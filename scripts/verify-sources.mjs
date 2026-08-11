#!/usr/bin/env node
/**
 * ENIA — verificação do registo de fontes
 * ------------------------------------------------------------------
 * Testa todas as fontes de data/sources.json, uma a uma, e escreve o
 * resultado de volta no próprio registo. Se o URL principal falhar e
 * um dos 'alt' responder com XML válido, o alternativo é promovido a
 * principal e o antigo passa para 'alt'.
 *
 * Escreve:
 *   data/sources.json          registo actualizado (estado + verificado)
 *   data/sources-health.json   relatório legível da última verificação
 *
 * Porquê existe: um registo de 90 fontes degrada-se sozinho. Sem
 * auditoria automática, ao fim de seis meses metade está morta e o
 * log continua a dizer que está tudo bem. Foi assim que a Comissão
 * Europeia ficou dois meses desligada sem ninguém dar por isso.
 *
 * Uso:  node scripts/verify-sources.mjs
 *       node scripts/verify-sources.mjs --dry     (não escreve nada)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => resolve(ROOT, ...s);
const DRY = process.argv.includes('--dry');
const TIMEOUT = 25_000;
const HOJE = new Date().toISOString().slice(0, 10);

/* Alguns servidores públicos recusam agentes não-browser. A ANACOM é o
   caso conhecido: responde no browser e falha no runner. Tentamos duas
   identidades antes de declarar a fonte morta. */
const AGENTES = [
  'ENIA-Radar/3.0 (+https://enia.pt)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
];

async function tentar(url, charset) {
  for (const ua of AGENTES) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const r = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: {
          'user-agent': ua,
          'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
        }
      });
      if (!r.ok) { clearTimeout(t); continue; }

      const ct = r.headers.get('content-type') || '';
      const cs = charset || (ct.match(/charset=([\w-]+)/i) || [])[1] || 'utf-8';
      const buf = await r.arrayBuffer();
      const txt = /^utf-?8$/i.test(cs)
        ? new TextDecoder('utf-8').decode(buf)
        : new TextDecoder(cs.toLowerCase()).decode(buf);

      const itens = (txt.match(/<(item|entry)[\s>]/gi) || []).length;
      const feed  = /<(rss|feed|rdf:RDF)[\s>]/i.test(txt);
      clearTimeout(t);

      if (!feed) return { ok: false, motivo: 'resposta não é RSS/Atom', ua, http: r.status };
      if (!itens) return { ok: false, motivo: 'feed válido mas sem itens', ua, http: r.status };
      return { ok: true, itens, ua, http: r.status, bytes: buf.byteLength };
    } catch (e) {
      clearTimeout(t);
      var ultimo = e.name === 'AbortError' ? `timeout ${TIMEOUT / 1000}s` : e.message;
    }
  }
  return { ok: false, motivo: ultimo || 'HTTP não-2xx com ambos os agentes' };
}

async function main() {
  const cfg = JSON.parse(await readFile(p('data/sources.json'), 'utf8'));
  const relatorio = { verificadoEm: new Date().toISOString(), total: 0, activas: 0, mortas: 0, watch: 0, promovidas: [], fontes: [] };

  for (const src of cfg.sources) {
    relatorio.total++;

    if (src.kind === 'manual') {
      src.estado = 'activo';
      relatorio.activas++;
      relatorio.fontes.push({ id: src.id, estado: 'activo', nota: 'ficheiro local' });
      continue;
    }
    if (src.kind === 'watch') {
      relatorio.watch++;
      relatorio.fontes.push({ id: src.id, estado: 'watch', nota: 'sem feed, verificação manual' });
      continue;
    }
    if (src.kind === 'sparql') {
      src.estado = 'activo';
      relatorio.activas++;
      relatorio.fontes.push({ id: src.id, estado: 'activo', nota: 'endpoint SPARQL, testado pelo sync' });
      continue;
    }

    const candidatos = [src.url, ...(src.alt || [])].filter(Boolean);
    let vencedor = null, tentativas = [];

    for (const url of candidatos) {
      const r = await tentar(url, src.charset);
      tentativas.push({ url, ...r });
      if (r.ok) { vencedor = { url, ...r }; break; }
    }

    if (vencedor) {
      if (vencedor.url !== src.url) {
        relatorio.promovidas.push({ id: src.id, de: src.url, para: vencedor.url });
        src.alt = [src.url, ...(src.alt || []).filter(u => u !== vencedor.url)];
        src.url = vencedor.url;
      }
      src.estado = 'activo';
      src.verificado = `${HOJE} · ${vencedor.itens} itens · HTTP ${vencedor.http}`;
      relatorio.activas++;
    } else {
      src.estado = 'morto';
      src.verificado = `${HOJE} · FALHOU: ${tentativas.map(t => t.motivo).join(' | ')}`;
      relatorio.mortas++;
    }

    relatorio.fontes.push({
      id: src.id, tier: src.tier, estado: src.estado,
      url: src.url, itens: vencedor?.itens ?? 0,
      tentativas: vencedor ? undefined : tentativas
    });

    const marca = src.estado === 'activo' ? '✓' : '✗';
    console.log(`${marca} ${src.id.padEnd(28)} ${src.estado.padEnd(8)} ${vencedor ? vencedor.itens + ' itens' : tentativas.at(-1)?.motivo ?? ''}`);
  }

  console.log(`\n${relatorio.activas} activas · ${relatorio.mortas} mortas · ${relatorio.watch} em watch (de ${relatorio.total})`);
  if (relatorio.promovidas.length) {
    console.log('\nURLs promovidos a partir de alternativos:');
    for (const q of relatorio.promovidas) console.log(`  ${q.id}: ${q.para}`);
  }

  if (DRY) { console.log('\n--dry: nada foi escrito.'); return; }

  await writeFile(p('data/sources.json'), JSON.stringify(cfg, null, 2) + '\n');
  await writeFile(p('data/sources-health.json'), JSON.stringify(relatorio, null, 2) + '\n');
  console.log('\n✓ data/sources.json e data/sources-health.json actualizados.');
}

main().catch(e => { console.error('✗ verificação falhou:', e); process.exit(1); });
