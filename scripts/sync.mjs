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
const MAX_SUM = 420;   /* tecto do resumo em bruto, antes da reescrita */

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

/* ─────────────────── limpeza de texto (corrigida) ───────────────────
 *
 * O QUE ESTAVA MAL, e porque é que se via markup no site:
 *
 *   A versão anterior removia as tags PRIMEIRO e só depois descodificava
 *   as entidades. Vários feeds institucionais — o da Comissão Europeia é
 *   o caso mais visível — servem a descrição com o HTML escapado dentro
 *   de CDATA, isto é, "&lt;span&gt;" em vez de "<span>".
 *
 *   Nesse formato, o removedor de tags não vê tag nenhuma e deixa passar.
 *   O descodificador, a seguir, transforma "&lt;span&gt;" em "<span>" —
 *   já depois de a limpeza ter acontecido. O markup entrava pela porta
 *   que o passo anterior tinha acabado de fechar.
 *
 * A CORREÇÃO: descodificar antes de limpar, e repetir o par até o texto
 * estabilizar, porque há fontes com escape duplo ("&amp;lt;span&amp;gt;").
 *
 * COMPROMISSO ASSUMIDO: um texto que use "&lt;" como sinal de menor
 * ("a &lt; b") passa a ser tratado como início de tag e pode perder-se.
 * É raro em prosa regulatória e muito menos grave do que despejar a folha
 * de estilos da Comissão dentro de um cartão de notícia.
 */

const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»',
  rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201C', rdquo: '\u201D',
  eacute: 'é', ccedil: 'ç', atilde: 'ã', otilde: 'õ', aacute: 'á',
  oacute: 'ó', iacute: 'í', uacute: 'ú', agrave: 'à', ecirc: 'ê',
  ocirc: 'ô', acirc: 'â', euro: '€'
};

const decode = (s) => String(s).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, g) => {
  if (g[0] === '#') {
    const hex = g[1] === 'x' || g[1] === 'X';
    const n = parseInt(hex ? g.slice(2) : g.slice(1), hex ? 16 : 10);
    /* Só códigos válidos e imprimíveis; o resto vira espaço em vez de
       poluir o texto com caracteres de controlo. */
    return Number.isFinite(n) && n >= 9 && n <= 0x10FFFF ? String.fromCodePoint(n) : ' ';
  }
  return ENT[g.toLowerCase()] ?? ' ';
});

const strip = (s = '') => {
  let t = String(s).replace(/<!\[CDATA\[|\]\]>/g, '');
  for (let i = 0; i < 3; i++) {
    const antes = t;
    t = decode(t).replace(/<[^>]*>/g, ' ');
    if (t === antes) break;          /* estabilizou: nada mais a limpar */
  }
  return t
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')  /* espaço órfão antes de pontuação */
    .trim();
};

/* Corta na fronteira da palavra, sem partir a meio. */
const cut = (s, n) => {
  const t = String(s || '');
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t;
};

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
    title: cut(tag(b, 'title'), 160),
    summary: cut(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'), MAX_SUM),
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
    title: cut(strip(b.title.value), 160),
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
  if (!key) {
    log.warnings.push('ANTHROPIC_API_KEY ausente: os itens ficam no texto e na língua originais. Adicionar o segredo no repositório para obter títulos e resumos em pt-PT.');
    return items;
  }
  if (!items.length) return items;

  /* Em lotes de 15: um prompt com 60 itens estoura o max_tokens da
     resposta e devolve JSON truncado, o que faria cair o lote inteiro. */
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
          lote[r.n].title = strip(r.title) || lote[r.n].title;
          lote[r.n].summary = strip(r.summary) || lote[r.n].summary;
        }
      }
    } catch (e) {
      log.warnings.push(`Reescrita editorial do lote ${Math.floor(i / 15) + 1} ignorada: ${e.message}`);
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

  const seen = new Set();
  const chave = (i) => (i.url || i.title).toLowerCase().replace(/[?#].*$/, '');
  const todos = pool
    .sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b._peso - a._peso || b.date - a.date)
    .filter(i => { const k = chave(i); if (seen.has(k)) return false; seen.add(k); return true; });

  const doFeed = todos.slice(0, cfg.max_items ?? 60);

  await toPortugueseNews(todos.filter(i => !i._manual));

  /* Última passagem de limpeza: mesmo que a reescrita falhe ou uma fonte
     nova traga formato inesperado, nada com markup chega ao ficheiro. */
  const limpar = i => ({
    title: strip(i.title),
    summary: cut(strip(i.summary), 260) || '—',
    source: strip(i.source),
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

  if (!news.items.length) {
    log.warnings.push('Recolha vazia — data/news.json foi preservado.');
    await writeFile(p('data/sync-log.json'), JSON.stringify(log, null, 2) + '\n');
    console.warn('⚠ ' + log.warnings.join('\n⚠ '));
    process.exit(1);
  }

  const radar = JSON.parse(await readFile(p('data/radar.json'), 'utf8'));
  radar.generated = news.generated;
  radar.version = news.generated.slice(0, 10).replace(/-/g, '.');

  /* ── arquivo ──
     O arquivo nunca remove itens, o que significa que também guardou o
     markup escrito pela versão anterior do strip(). Por isso cada execução
     volta a limpar o que já lá está: o defeito desaparece do histórico
     todo, não só dos itens novos. É idempotente — sobre texto já limpo o
     strip() não altera nada. */
  let archive = { items: [] };
  try { archive = JSON.parse(await readFile(p('data/news-archive.json'), 'utf8')); } catch {}

  let curados = 0;
  archive.items = (archive.items || []).map(i => {
    const t = strip(i.title), s = cut(strip(i.summary), 260) || '—';
    if (t !== i.title || s !== i.summary) curados++;
    return { ...i, title: t, summary: s };
  });

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
  log.archive = { added, curados, total: archive.count };

  await writeFile(p('data/news.json'), JSON.stringify(news, null, 2) + '\n');
  await writeFile(p('data/radar.json'), JSON.stringify(radar, null, 2) + '\n');
  await writeFile(p('data/sync-log.json'), JSON.stringify(log, null, 2) + '\n');

  const { execFileSync } = await import('node:child_process');
  for (const step of ['scripts/history.mjs', 'scripts/bundle.mjs']) {
    try { execFileSync(process.execPath, [p(step)], { stdio: 'inherit' }); }
    catch (e) { log.warnings.push(`${step} falhou: ${e.message}`); }
  }

  const activas = log.sources.filter(s => s.ok).length;
  const falhadas = log.sources.filter(s => s.error).length;
  console.log(`✓ ${activas} fontes ok · ${falhadas} falhadas · ${log.desligadas.length} desligadas (watch)`);
  console.log(`✓ ${todos.length} itens relevantes · ${news.items.length} no feed · ${added} novos no arquivo (${archive.count} no total)`);
  if (curados) console.log(`✓ ${curados} itens antigos do arquivo limpos de markup residual`);
  if (log.warnings.length) console.warn('⚠ ' + log.warnings.join('\n⚠ '));
}

main().catch(e => { console.error('✗ sync falhou:', e); process.exit(1); });
