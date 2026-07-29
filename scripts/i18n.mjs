#!/usr/bin/env node
/**
 * ENIA — build da versão inglesa
 * ---------------------------------------------------------------------------
 * Gera en/*.html a partir das páginas portuguesas, aplicando scripts/dict.mjs.
 *
 * Porque é um build e não ficheiros escritos à mão: garante paridade
 * estrutural absoluta. Qualquer correção de markup feita em português aparece
 * em inglês no build seguinte, e nenhum id, âncora ou classe se perde pelo
 * caminho. O custo é ter de manter o dicionário — e é o custo certo.
 *
 * No fim, o script relata a cobertura: strings visíveis que continuam a
 * parecer portuguesas. Esse número é a medida honesta da qualidade do build.
 *
 * Uso: node scripts/i18n.mjs
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import DICT from './dict.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => resolve(ROOT, ...s);
const OUT = p('en');

/* chaves mais longas primeiro: impede que uma tradução curta parta uma frase */
const KEYS = Object.keys(DICT).sort((a, b) => b.length - a.length);

/* datas em português nos JSON e no copy inline */
const MONTHS = {
  'janeiro': 'January', 'fevereiro': 'February', 'março': 'March', 'abril': 'April',
  'maio': 'May', 'junho': 'June', 'julho': 'July', 'agosto': 'August',
  'setembro': 'September', 'outubro': 'October', 'novembro': 'November', 'dezembro': 'December'
};

function translate(html) {
  let out = html, used = 0;
  for (const k of KEYS) {
    if (!out.includes(k)) continue;
    out = out.split(k).join(DICT[k]);
    used++;
  }
  /* datas longas: "8 de janeiro de 2026" → "8 January 2026" */
  for (const [pt, en] of Object.entries(MONTHS)) {
    out = out.replace(new RegExp(`(\\d{1,2}) de ${pt} de (\\d{4})`, 'gi'), `$1 ${en} $2`);
    out = out.replace(new RegExp(`\\b${pt} de (\\d{4})`, 'gi'), `${en} $1`);
  }
  return { out, used };
}

/* ── heurística de cobertura: o que ainda parece português ─────────────── */
/* Só palavras que não existem em inglês. 'do', 'em', 'no', 'a' colidem e
   produziriam falsos positivos em massa. */
const PT_WORDS = /\b(?:não|são|está|estão|também|até|pelo|pela|desta|deste|nossa|nosso|uma|dos|das|nas|nos|ser|têm|foi|mais|como|sobre|entre|quando|onde|porque|assim|apenas|ainda|todos|todas|para|que|com|por|seu|sua|isso|esta|este|qual|cada|onde|muito|menos|desde|após|sem|sob|entre)\b/i;

function residual(html) {
  /* apenas texto visível: fora de <style>, <script>, comentários e atributos */
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '\n');
  return [...new Set(stripped.split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 24 && PT_WORDS.test(s)))];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const pages = (await readdir(ROOT)).filter(f => f.endsWith('.html'));
  const report = [];

  for (const f of pages) {
    const src = await readFile(p(f), 'utf8');
    let { out, used } = translate(src);

    /* ── metadados de língua ── */
    out = out.replace(/<html lang="pt-PT"/, '<html lang="en"');
    out = out.replace(/content="pt_PT"/, 'content="en_GB"');
    /* apenas o atributo lang, nunca hreflang — de outro modo o alternate
       pt-PT era reescrito para en e as duas versões apontavam para si mesmas */
    out = out.replace(/(?<!href)lang="pt-PT"(?![^>]*hreflang)/g, 'lang="en"');

    /* ── caminhos: as páginas EN vivem um nível abaixo ── */
    out = out.replace(/(src|href)="(assets|data)\//g, '$1="../$2/');

    /* ── canónico e alternates ── */
    const url = f === 'index.html' ? '' : f;
    /* remove os alternates herdados da versão PT antes de escrever os próprios */
    out = out.replace(/\n?<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, '');
    out = out.replace(/<link rel="canonical" href="https:\/\/enia\.pt\/[^"]*">/,
      `<link rel="canonical" href="https://enia.pt/en/${url}">\n`
      + `<link rel="alternate" hreflang="pt-PT" href="https://enia.pt/${url}">\n`
      + `<link rel="alternate" hreflang="en" href="https://enia.pt/en/${url}">\n`
      + `<link rel="alternate" hreflang="x-default" href="https://enia.pt/${url}">`);

    /* ── formatadores de data e locale dentro dos scripts de página ── */
    out = out.replace(/'pt-PT'/g, "'en-GB'");
    out = out.replace(/toLocaleDateString\('en-GB'\)/g, "toLocaleDateString('en-GB')");

    await writeFile(resolve(OUT, f), out);
    const left = residual(out);
    report.push({ file: f, used, left });
  }

  /* ── hreflang nas páginas portuguesas ── */
  for (const f of pages) {
    let s = await readFile(p(f), 'utf8');
    const url = f === 'index.html' ? '' : f;
    if (!s.includes('hreflang="en"')) {
      s = s.replace(/<link rel="canonical" href="https:\/\/enia\.pt\/[^"]*">/,
        m => `${m}\n<link rel="alternate" hreflang="pt-PT" href="https://enia.pt/${url}">\n`
              + `<link rel="alternate" hreflang="en" href="https://enia.pt/en/${url}">\n`
              + `<link rel="alternate" hreflang="x-default" href="https://enia.pt/${url}">`);
      await writeFile(p(f), s);
    }
  }

  /* ── relatório ── */
  const total = report.reduce((a, r) => a + r.left.length, 0);
  console.log(`✓ en/: ${report.length} páginas`);
  for (const r of report) {
    console.log(`  ${r.file.padEnd(20)} ${String(r.used).padStart(3)} traduções · ${r.left.length} por traduzir`);
  }
  if (total) {
    console.log(`\n⚠ ${total} strings residuais — as primeiras de cada página:`);
    for (const r of report) {
      for (const s of r.left.slice(0, 4)) console.log(`  [${r.file}] ${s.slice(0, 150)}`);
    }
  } else {
    console.log('\n✓ cobertura completa: nenhuma string visível ficou em português');
  }
}

main().catch(e => { console.error('✗ i18n falhou:', e); process.exit(1); });
