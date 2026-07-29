#!/usr/bin/env node
/**
 * ENIA v3 — gera data/bundle.js a partir dos JSON.
 * O bundle é carregado por <script src> e permite que o site funcione
 * aberto directamente do disco (file://), onde fetch é bloqueado.
 * Corre automaticamente no fim de scripts/sync.mjs.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => resolve(ROOT, ...s);

const read = async (f, fb) => readFile(p(f), 'utf8').then(JSON.parse).catch(() => fb);

const [radar, news, series, archive, marketplace] = await Promise.all([
  read('data/radar.json'), read('data/news.json'),
  read('data/history/series.json', { readings: 0, points: [] }),
  read('data/news-archive.json', { items: [] }),
  read('data/marketplace.json', { items: [], aggregate: null })
]);

const out = `/* Gerado por scripts/bundle.mjs — não editar à mão. */
window.__ENIA__ = ${JSON.stringify({ radar, news, series, archive, marketplace })};
`;

await writeFile(p('data/bundle.js'), out);
console.log(`✓ data/bundle.js (${(out.length / 1024).toFixed(1)} KB)`);
