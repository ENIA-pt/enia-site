#!/usr/bin/env node
/**
 * ENIA v6 — Recolha regulatória diária (esquema 2)
 * ------------------------------------------------------------------
 * Lê data/sources.json (esquema 2) e escreve:
 *
 *   data/news.json          → feed do site (limitado a max_items)
 *   data/news-archive.json  → biblioteca exaustiva (nunca perde nada)
 *   data/radar.json         → apenas 'generated' e 'version'
 *   data/sync-log.json      → o que funcionou, o que falhou e porquê
 *
 * Mudanças face ao esquema 1, e a razão de cada uma:
 *
 *  1. QUOTA POR FONTE. Antes, o pool era ordenado por data e cortado
 *     nos 12. O Eurostat, que publica dezenas de itens por dia, ficava
 *     com o feed inteiro e empurrava a ANACOM e o EUR-Lex para fora.
 *     Agora cada fonte tem tecto próprio antes da fusão.
 *
 *  2. FILTRO REGEX COM FRONTEIRA DE PALAVRA. Antes, a chave "IA" em
 *     minúsculas fazia includes('ia'), que acerta dentro de 'notícia',
 *     'agência' e 'financial'. Era um filtro sempre verdadeiro.
 *
 *  3. ARQUIVO SEPARADO DO FEED. Antes, o arquivo só recebia o que
 *     sobrevivia ao corte de 12. Perdia-se tudo o resto para sempre.
 *     Agora o arquivo recebe tudo o que passa o filtro; o corte só se
 *     aplica ao que é mostrado na homepage.
 *
 *  4. 'watch' DEIXA DE MENTIR. Antes registava ok:true. Uma fonte sem
 *     feed é uma fonte desligada e o log passa a dizer exactamente isso.
 *
 * Uso:   node scripts/sync.mjs
 * Env:   ANTHROPIC_API_KEY (opcional — sem chave, usa o texto original)
 * Node:  >= 20 (fetch nativo)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => resolve(ROOT, ...s);
const MODEL = process.env.ENIA_MODEL || 'claude-sonnet-5';
const TIMEOUT = 25_000;

const log = { startedAt: new Date().toISOString(), sources: [], warnings: [], desligadas: [] };

const AGENTES = [
  'ENIA-Radar/3.0 (+https://enia.pt)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
];

/* ────────────────────────── utilitários ────────────────────────── */

async function get(url, { headers = {}, method = 'GET', body, charset, agente } = {}) {
  const uas = agente ? [agente] : AGENTES;
  let ultimo;
  for (const ua of uas) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const r = await fetch(url, {
        method, body, signal: ctrl.signal, redirect: 'follow',
        headers: { 'user-agent': ua, ...headers }
      });
      if (!r.ok) { ultimo = new Error(`HTTP ${r.status}`); clearTimeout(t); continue; }

      /* Nem toda a gente serve UTF-8: a ANACOM usa ISO-8859-15. O .text()
         do Node assume sempre UTF-8, o que partiria os acentos. */
      const ct = r.headers.get('content-type') || '';
      const cs = charset || (ct.match(/charset=([\w-]+)/i) || [])[1] || 'utf-8';
      const out = /^utf-?8$/i.test(cs)
        ? await r.text()
        : new TextDecoder(cs.toLowerCase()).decode(await r.arrayBuffer());
      clearTimeout(t);
      return out;
    } catch (e) {
      clearTimeout(t);
      ultimo = e.name === 'AbortError' ? new Error(`timeout ${TIMEOUT / 1000}s`) : e;
    }
  }
  throw ultimo ?? new Error('falha desconhecida');
}

const strip = (s = '') => s
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&([a-z]+|#\d+);/gi, m => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }[m] ?? ' '))
  .replace(/\s+/g, ' ')
  .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? strip(m[1]) : '';
};

const linkOf = (xml) =>
  (xml.match(/<link[^>]*href=["']([^"']+)["']/i) ?? [])[1] ||
  tag(xml, 'link') ||
  tag(xml, 'guid');

/** RSS 2.0, Atom e RDF partilham forma suficiente para um parser único. */
function parseFeed(xml, label) {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];
  return blocks.map(b => ({
    title: tag(b, 'title'),
    summary: tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'),
    url: linkOf(b),
    date: new Date(tag(b, 'pubDate') || tag(b, 'updated') || tag(b, 'published') || tag(b, 'dc:date') || Date.now()),
    source: label
  })).filter(i => i.title && i.url);
}

/* ────────────────────── filtro de relevância ────────────────────── */

function compilarMatch(cfg) {
  const f = cfg.match?.flags || 'iu';
  const any = (cfg.match?.any || []).map(r => new RegExp(r, f));
  const boost = (cfg.match?.boost || []).map(r => new RegExp(r, f));
  const excl = (cfg.match?.exclude || []).map(r => new RegExp(r, f));
  return {
    passa(texto) {
      if (excl.some(r => r.test(texto))) return false;
      return any.some(r => r.test(texto));
    },
    peso(texto) {
      return boost.reduce((n, r) => n + (r.test(texto) ? 1 : 0), 0);
    }
  };
}

/* ────────────────────── fontes por tipo ────────────────────── */

async function fromSparql(src, since) {
  /* O esquema 1 exigia expressão em português E 'inteligência artificial'
     no título. Isso excluía tudo o que não fosse acto do JO em português,
     ou seja, quase tudo o que interessa. Aqui alargamos a línguas e termos. */
  const desde = since.toISOString().slice(0, 10);
  const termos = src.query_profile === 'titulo_multilingue'
    ? ['inteligência artificial', 'artificial intelligence', 'intelligence artificielle', 'künstliche intelligenz', '2024/1689']
    : ['inteligência artificial'];

  const filtro = termos
    .map(t => `CONTAINS(LCASE(STR(?title)), "${t.toLowerCase()}")`)
    .join(' || ');

  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?work ?date ?title WHERE {
  ?work cdm:work_date_document ?date .
  ?expr cdm:expression_belongs_to_work ?work ;
        cdm:expression_title ?title .
  FILTER(?date >= "${desde}"^^xsd:date)
  FILTER(${filtro})
}
ORDER BY DESC(?date) LIMIT 60`;

  const body = await get(`${src.endpoint}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson`,
    { headers: { accept: 'application/sparql-results+json' } });

  const json = JSON.parse(body);
  return (json.results?.bindings ?? []).map(b => ({
    title: b.title.value,
    summary: '',
    url: b.work.value.replace('http://publications.europa.eu/resource/cellar/',
      'https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=cellar:'),
    date: new Date(b.date.value),
    source: src.label
  }));
}

async function fromManual(src) {
  try {
    const raw = JSON.parse(await readFile(p(src.file), 'utf8'));
    return raw.map(i => ({ ...i, date: new Date(i.date), _manual: true }));
  } catch { return []; }
}

/* ─────────────── reescrita editorial (opcional) ─────────────── */

async function toPortugueseNews(items) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { log.warnings.push('ANTHROPIC_API_KEY ausente: itens ficam no texto e língua originais.'); return items; }
  if (!items.length) return items;

  /* Em lotes de 15: um prompt com 60 itens estoura o max_tokens da resposta
     e devolve JSON truncado, o que faz cair todo o lote. */
  for (let i = 0; i < items.length; i += 15) {
    const lote = items.slice(i, i + 15);
    const payload = lote.map((it, n) => ({ n, title: it.title, text: (it.summary || '').slice(0, 600), source: it.source }));
    const prompt = `És o editor do Radar IA Act da ENIA, o observatório regulatório português do AI Act.
Recebes itens em bruto de fontes oficiais, em várias línguas. Devolve APENAS um array JSON, sem markdown e sem preâmbulo, com um objeto por item:
{"n":<índice>,"title":"<título em pt-PT, máx. 70 caracteres, sem ponto final>","summary":"<1 frase em pt-PT, máx. 220 caracteres, que diga o que isto muda em concreto para empresas ou instituições portuguesas>"}
Regras: português europeu; factual; sem adjetivos de marketing; nunca inventes datas, números ou obrigações que não estejam no texto recebido; se o texto for insuficiente, traduz apenas o título e deixa o resumo curto.

ITENS:
${JSON.stringify(payload)}`;

    try {
      const res = await get('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        agente: AGENTES[0],
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
      });
      const txt = (JSON.parse(res).content ?? []).filter(b => b.type === 'text').map(b => b.text).join('');
      const arr = JSON.parse(txt.replace(/```json|```/g, '').trim());
      for (const r of arr) {
        if (lote[r.n]) {
          lote[r.n].title = r.title || lote[r.n].title;
          lote[r.n].summary = r.summary || lote[r.n].summary;
        }
      }
    } catch (e) {
      log.warnings.push(`Reescrita editorial do lote ${i / 15 + 1} ignorada: ${e.message}`);
    }
  }
  return items;
}

/* ────────────────────────── principal ────────────────────────── */

async function main() {
  const cfg = JSON.parse(await readFile(p('data/sources.json'), 'utf8'));
  const since = new Date(Date.now() - cfg.window_days * 864e5);
  const filtro = compilarMatch(cfg);
  const quotaDefeito = cfg.default_quota ?? 3;
  let pool = [];

  for (const src of cfg.sources) {
    const entry = { id: src.id, tier: src.tier, kind: src.kind, ok: false, items: 0, kept: 0 };

    /* 'watch' é uma fonte DESLIGADA. Regista-se como tal, sem fingir sucesso. */
    if (src.kind === 'watch') {
      entry.ok = false;
      entry.desligada = 'sem feed — verificação manual';
      log.desligadas.push(src.id);
      log.sources.push(entry);
      continue;
    }

    try {
      let items = [];
      if (src.kind === 'sparql') items = await fromSparql(src, since);
      else if (src.kind === 'manual') items = await fromManual(src);
      else items = parseFeed(await get(src.url, { charset: src.charset }), src.label);

      entry.ok = true;
      entry.items = items.length;

      /* Filtrar dentro da própria fonte, e só depois aplicar a quota.
         Assim uma fonte prolífica contribui com os seus melhores N e não
         com os seus N mais recentes, que podem ser todos irrelevantes. */
      const quota = src.quota ?? quotaDefeito;
      const relevantes = items
        .filter(i => i._manual || src.always || filtro.passa(`${i.title} ${i.summary}`))
        .filter(i => i._manual || i.date >= since)
        .map(i => ({ ...i, _peso: filtro.peso(`${i.title} ${i.summary}`), _tier: src.tier, _src: src.id }))
        .sort((a, b) => b._peso - a._peso || b.date - a.date)
        .slice(0, quota);

      entry.kept = relevantes.length;
      pool.push(...relevantes);
    } catch (e) {
      entry.error = e.message;
      log.warnings.push(`[${src.id}] ${e.message}`);
    }
    log.sources.push(entry);
  }

  /* deduplicar por URL, depois ordenar por peso editorial e data */
  const seen = new Set();
  const todos = pool
    .sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b._peso - a._peso || b.date - a.date)
    .filter(i => {
      const k = (i.url || i.title).toLowerCase().replace(/[?#].*$/, '');
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });

  /* O feed é o topo; o arquivo é tudo. Esta separação é o que torna a
     biblioteca exaustiva em vez de uma janela de 12 itens. */
  const doFeed = todos.slice(0, cfg.max_items ?? 60);

  await toPortugueseNews(todos.filter(i => !i._manual));

  const limpar = i => ({
    title: i.title,
    summary: i.summary || '—',
    source: i.source,
    tier: i._tier,
    date: i.date.toISOString().slice(0, 10),
    url: i.url
  });

  const news = {
    generated: new Date().toISOString(),
    window: `últimos ${cfg.window_days} dias`,
    items: doFeed.map(limpar)
  };

  log.finishedAt = new Date().toISOString();
  log.recolhidos = todos.length;
  log.written = news.items.length;

  /* Recolha vazia = falha de rede ou de URL. Preserva o feed anterior. */
  if (!news.items.length) {
    log.warnings.push('Recolha vazia — data/news.json foi preservado.');
    await writeFile(p('data/sync-log.json'), JSON.stringify(log, null, 2) + '\n');
    console.warn('⚠ ' + log.warnings.join('\n⚠ '));
    process.exit(1);
  }

  const radar = JSON.parse(await readFile(p('data/radar.json'), 'utf8'));
  radar.generated = news.generated;
  radar.version = news.generated.slice(0, 10).replace(/-/g, '.');

  /* Arquivo integral: acrescenta tudo o que é novo, nunca remove nada.
     Recebe 'todos', não 'doFeed'. */
  let archive = { items: [] };
  try { archive = JSON.parse(await readFile(p('data/news-archive.json'), 'utf8')); } catch {}
  const known = new Set(archive.items.map(i => (i.url || i.title).toLowerCase().replace(/[?#].*$/, '')));
  let added = 0;
  for (const i of todos.map(limpar)) {
    const k = (i.url || i.title).toLowerCase().replace(/[?#].*$/, '');
    if (known.has(k)) continue;
    known.add(k); archive.items.push(i); added++;
  }
  archive.items.sort((a, b) => b.date.localeCompare(a.date));
  archive.generated = news.generated;
  archive.count = archive.items.length;
  await writeFile(p('data/news-archive.json'), JSON.stringify(archive, null, 2) + '\n');
  log.archive = { added, total: archive.count };

  await writeFile(p('data/news.json'), JSON.stringify(news, null, 2) + '\n');
  await writeFile(p('data/radar.json'), JSON.stringify(radar, null, 2) + '\n');
  await writeFile(p('data/sync-log.json'), JSON.stringify(log, null, 2) + '\n');

  /* retrato do dia + série histórica, depois o bundle usado em file:// */
  const { execFileSync } = await import('node:child_process');
  for (const step of ['scripts/history.mjs', 'scripts/bundle.mjs']) {
    try { execFileSync(process.execPath, [p(step)], { stdio: 'inherit' }); }
    catch (e) { log.warnings.push(`${step} falhou: ${e.message}`); }
  }

  const activas = log.sources.filter(s => s.ok).length;
  const falhadas = log.sources.filter(s => s.error).length;
  console.log(`✓ ${activas} fontes ok · ${falhadas} falhadas · ${log.desligadas.length} desligadas (watch)`);
  console.log(`✓ ${todos.length} itens relevantes · ${news.items.length} no feed · ${added} novos no arquivo (${archive.count} no total)`);
  if (log.warnings.length) console.warn('⚠ ' + log.warnings.join('\n⚠ '));
}

main().catch(e => { console.error('✗ sync falhou:', e); process.exit(1); });
