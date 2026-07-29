#!/usr/bin/env node
/**
 * ENIA v3 — série histórica
 * ------------------------------------------------------------------
 * Guarda um retrato datado do Radar por dia e reconstrói a série.
 *
 *   data/history/AAAA-MM-DD.json   retrato do dia (imutável)
 *   data/history/series.json       série consolidada, lida pelo Radar
 *
 * Porquê: o Radar mostra um estado; a série mostra trajetória. Um
 * concorrente copia o produto num mês, mas não copia dezoito meses de
 * leituras diárias. É este ficheiro que constrói essa barreira — e só
 * a constrói se correr todos os dias desde hoje.
 *
 * Corre automaticamente no fim de scripts/sync.mjs.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => resolve(ROOT, ...s);
const HIST = p('data/history');

const radar = JSON.parse(await readFile(p('data/radar.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

/* ── retrato do dia ─────────────────────────────────────────────── */
const ranked = [...(radar.countries || [])].sort((a, b) => b.score - a.score);
const ptIdx = ranked.findIndex(c => /portugal/i.test(c.name));
const scores = ranked.map(c => c.score);
const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

const ania = (radar.ania?.medidas || []).reduce((a, m) => (a[m.estado] = (a[m.estado] || 0) + 1, a), {});
const chk = radar.checklist || [];

const snapshot = {
  date: today,
  version: radar.version,
  pt: ptIdx >= 0 ? ranked[ptIdx].score : null,
  rank: ptIdx >= 0 ? ptIdx + 1 : null,
  of: ranked.length,
  euAvg: avg,
  leader: ranked[0] ? { name: ranked[0].name, score: ranked[0].score } : null,
  gapToLeader: ptIdx >= 0 && ranked[0] ? ranked[0].score - ranked[ptIdx].score : null,
  countries: Object.fromEntries(ranked.map(c => [c.name, c.score])),
  sectors: Object.fromEntries((radar.sectors || []).map(s => [s.name, s.value])),
  checklist: { done: chk.filter(c => c.done).length, total: chk.length },
  ania: { ok: ania.ok || 0, wip: ania.wip || 0, no: ania.no || 0 }
};

await mkdir(HIST, { recursive: true });
await writeFile(resolve(HIST, `${today}.json`), JSON.stringify(snapshot, null, 2) + '\n');

/* ── série consolidada ──────────────────────────────────────────── */
const files = (await readdir(HIST)).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const points = [];
for (const f of files) {
  const s = JSON.parse(await readFile(resolve(HIST, f), 'utf8'));
  points.push({
    date: s.date, pt: s.pt, rank: s.rank, of: s.of, euAvg: s.euAvg,
    gap: s.gapToLeader, done: s.checklist?.done, aniaOk: s.ania?.ok
  });
}

const first = points[0], last = points[points.length - 1];
const series = {
  generated: new Date().toISOString(),
  since: first?.date || today,
  readings: points.length,
  delta: first && last && first.pt != null && last.pt != null
    ? { pt: +(last.pt - first.pt).toFixed(1), rank: first.rank - last.rank }
    : null,
  points
};

await writeFile(resolve(HIST, 'series.json'), JSON.stringify(series, null, 2) + '\n');
console.log(`✓ histórico: ${points.length} leitura(s) desde ${series.since}`);
