#!/usr/bin/env node
/**
 * ENIA v3 — Recolha regulatória diária
 * ------------------------------------------------------------------
 * Lê data/sources.json, recolhe as fontes oficiais, filtra por janela
 * temporal + palavras-chave, opcionalmente reescreve cada item como
 * notícia em português (API Anthropic) e escreve:
 *
 *   data/news.json      → feed do site e do radar
 *   data/radar.json     → apenas os campos 'generated' e 'version'
 *   data/sync-log.json  → o que funcionou, o que falhou e porquê
 *
 * Princípio editorial: o script NUNCA inventa indicadores. Os números
 * do radar (prontidão, sectores, checklist) são curados pela ENIA e
 * só mudam por commit humano.
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
const TIMEOUT = 20_000;

const log = { startedAt: new Date().toISOString(), sources: [], warnings: [] };

/* ────────────────────────── utilitários ────────────────────────── */

async function get(url, { headers = {}, method = 'GET', body, charset } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      method, body, signal: ctrl.signal,
      headers: { 'user-agent': 'ENIA-Radar/3.0 (+https://enia.pt)', ...headers }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    /* Nem toda a gente serve UTF-8: a ANACOM usa ISO-8859-15. O .text() do
       Node assume sempre UTF-8, o que produziria acentos partidos no feed. */
    const ct = r.headers.get('content-type') || '';
    const cs = charset || (ct.match(/charset=([\w-]+)/i) || [])[1] || 'utf-8';
    if (/^utf-?8$/i.test(cs)) return await r.text();
    return new TextDecoder(cs.toLowerCase()).decode(await r.arrayBuffer());
  } finally { clearTimeout(t); }
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

/** RSS 2.0 e Atom partilham a mesma forma o suficiente para um parser único. */
function parseFeed(xml, label) {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];
  return blocks.map(b => ({
    title: tag(b, 'title'),
    summary: tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'),
    url: linkOf(b),
    date: new Date(tag(b, 'pubDate') || tag(b, 'updated') || tag(b, 'published') || Date.now()),
    source: label
  })).filter(i => i.title && i.url);
}

/* ────────────────────── fontes por tipo ────────────────────── */

async function fromSparql(src, since) {
  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?work ?date ?title WHERE {
  ?work cdm:work_date_document ?date .
  ?expr cdm:expression_belongs_to_work ?work ;
        cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/POR> ;
        cdm:expression_title ?title .
  FILTER(?date >= "${since.toISOString().slice(0, 10)}"^^xsd:date)
  FILTER(CONTAINS(LCASE(STR(?title)), "inteligência artificial"))
}
ORDER BY DESC(?date) LIMIT 20`;

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
  if (!key || !items.length) return items;

  const payload = items.map((i, n) => ({ n, title: i.title, text: i.summary.slice(0, 600), source: i.source }));
  const prompt = `És o editor do Radar IA Act da ENIA, o observatório regulatório português do AI Act.
Recebes itens em bruto de fontes oficiais. Devolve APENAS um array JSON, sem markdown e sem preâmbulo, com um objeto por item:
{"n":<índice>,"title":"<título em pt-PT, máx. 60 caracteres, sem ponto final>","summary":"<1 frase em pt-PT, máx. 200 caracteres, que diga o que isto muda em concreto para empresas ou instituições portuguesas>"}
Regras: português europeu; factual; sem adjetivos de marketing; nunca inventes datas, números ou obrigações que não estejam no texto recebido; se o texto for insuficiente, resume só o que está lá.

ITENS:
${JSON.stringify(payload)}`;

  try {
    const res = await get('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
    });
    const txt = (JSON.parse(res).content ?? []).filter(b => b.type === 'text').map(b => b.text).join('');
    const arr = JSON.parse(txt.replace(/```json|```/g, '').trim());
    for (const r of arr) {
      if (items[r.n]) {
        items[r.n].title = r.title || items[r.n].title;
        items[r.n].summary = r.summary || items[r.n].summary;
      }
    }
  } catch (e) {
    log.warnings.push(`Reescrita editorial ignorada: ${e.message}`);
  }
  return items;
}

/* ────────────────────────── principal ────────────────────────── */

async function main() {
  const cfg = JSON.parse(await readFile(p('data/sources.json'), 'utf8'));
  const since = new Date(Date.now() - cfg.window_days * 864e5);
  const kw = cfg.keywords.map(k => k.toLowerCase());
  let pool = [];

  for (const src of cfg.sources) {
    const entry = { id: src.id, kind: src.kind, ok: false, items: 0 };
    try {
      let items = [];
      if (src.kind === 'watch') {
        /* Fonte sem feed público ou interdita por robots.txt. Registada para
           verificação manual; nunca é raspada. */
        entry.ok = true; entry.skipped = 'sem feed — verificação manual';
        log.sources.push(entry);
        continue;
      }
      if (src.kind === 'sparql') items = await fromSparql(src, since);
      else if (src.kind === 'manual') items = await fromManual(src);
      else items = parseFeed(await get(src.url, { charset: src.charset }), src.label);

      entry.ok = true;
      entry.items = items.length;
      pool.push(...items);
    } catch (e) {
      entry.error = e.message;
      log.warnings.push(`[${src.id}] ${e.message}${src.verify ? ' — URL por confirmar em data/sources.json' : ''}`);
    }
    log.sources.push(entry);
  }

  /* filtrar, ordenar, deduplicar */
  const seen = new Set();
  pool = pool
    .filter(i => i._manual || (i.date >= since && kw.some(k =>
      (i.title + ' ' + i.summary).toLowerCase().includes(k))))
    .sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.date - a.date)
    .filter(i => {
      const k = (i.url || i.title).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k); return true;
    })
    .slice(0, cfg.max_items);

  await toPortugueseNews(pool.filter(i => !i._manual));

  const news = {
    generated: new Date().toISOString(),
    window: `últimos ${cfg.window_days} dias`,
    items: pool.map(i => ({
      title: i.title,
      summary: i.summary || '—',
      source: i.source,
      date: i.date.toISOString().slice(0, 10),
      url: i.url
    }))
  };

  log.finishedAt = new Date().toISOString();
  log.written = news.items.length;

  /* Recolha vazia = provável falha de rede/URL. Preserva o feed anterior. */
  if (!news.items.length) {
    log.warnings.push('Recolha vazia — data/news.json foi preservado.');
    await writeFile(p('data/sync-log.json'), JSON.stringify(log, null, 2) + '\n');
    console.warn('⚠ ' + log.warnings.join('\n⚠ '));
    process.exit(1);
  }

  const radar = JSON.parse(await readFile(p('data/radar.json'), 'utf8'));
  radar.generated = news.generated;
  radar.version = news.generated.slice(0, 10).replace(/-/g, '.');

  /* Arquivo integral: acrescenta o que é novo e nunca remove o que já lá está.
     É este ficheiro que alimenta a página de notícias com calendário. */
  let archive = { items: [] };
  try { archive = JSON.parse(await readFile(p('data/news-archive.json'), 'utf8')); } catch {}
  const known = new Set(archive.items.map(i => (i.url || i.title).toLowerCase()));
  let added = 0;
  for (const i of news.items) {
    const k = (i.url || i.title).toLowerCase();
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

  console.log(`✓ ${news.items.length} itens no feed · ${added} novo(s) no arquivo (${archive.count} no total)`);
  if (log.warnings.length) console.warn('⚠ ' + log.warnings.join('\n⚠ '));
}

main().catch(e => { console.error('✗ sync falhou:', e); process.exit(1); });
