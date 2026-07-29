#!/usr/bin/env node
/**
 * ENIA v3 — build autónoma
 * ------------------------------------------------------------------
 * Gera standalone/*.html com o CSS, o JS, os dados e os logótipos
 * embutidos. Cada ficheiro passa a funcionar sozinho: aberto por duplo
 * clique, enviado por e-mail, colocado numa pen.
 *
 * O site em produção usa a versão normal (ficheiros separados, com
 * cache e uma só cópia do CSS). A build autónoma existe para
 * pré-visualização e partilha.
 *
 * Uso: node scripts/standalone.mjs
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => resolve(ROOT, ...s);
const OUT = p('standalone');

const [css, js, bundle, tdata] = await Promise.all([
  readFile(p('assets/enia.css'), 'utf8'),
  readFile(p('assets/enia.js'), 'utf8'),
  readFile(p('data/bundle.js'), 'utf8'),
  readFile(p('assets/teste-dados.js'), 'utf8')
]);

/* logótipos como data URI — pequenos e vetoriais */
const dataUri = async (f) => 'data:image/svg+xml;base64,'
  + Buffer.from(await readFile(p('assets', f), 'utf8')).toString('base64');

const SVG = {
  'assets/enia-mark.svg': await dataUri('enia-mark.svg'),
  'assets/enia-monogram.svg': await dataUri('enia-monogram.svg'),
  'assets/favicon.svg': await dataUri('favicon.svg')
};

await mkdir(OUT, { recursive: true });

/* as duas línguas: raiz e /en/ */
const SETS = [
  { dir: '',   out: OUT,                       up: '' },
  { dir: 'en', out: resolve(OUT, 'en'),        up: '../' }
];
let n = 0;

for (const set of SETS) {
  await mkdir(set.out, { recursive: true });
  const pages = (await readdir(p(set.dir))).filter(f => f.endsWith('.html'));
  for (const f of pages) {
  let h = await readFile(p(set.dir, f), 'utf8');
  const U = set.up;

  /* CSS e JS embutidos, pela mesma ordem em que eram carregados */
  h = h.replace(`<link rel="stylesheet" href="${U}assets/enia.css">`,
                `<style>\n${css}\n</style>`);
  h = h.replace(`<script src="${U}data/bundle.js"></script>\n<script src="${U}assets/enia.js"></script>`,
                `<script>\n${bundle}\n</script>\n<script>\n${js}\n</script>`);
  h = h.replace(`<script src="${U}assets/enia.js"></script>`,
                `<script>\n${js}\n</script>`);
  h = h.replace(`<script src="${U}assets/teste-dados.js"></script>`,
                `<script>\n${tdata}\n</script>`);

  /* imagens vetoriais como data URI */
  for (const [path, uri] of Object.entries(SVG)) h = h.split(U + path).join(uri);

  /* a fotografia só é usada em og:image — fica com o URL absoluto */
  h = h.replace(/(src|href)="(?:\.\.\/)?assets\/hero-sky\.jpg"/g, '$1="https://enia.pt/assets/hero-sky.jpg"');

  await writeFile(resolve(set.out, basename(f)), h);
  n++;
  }
}

console.log(`✓ standalone/: ${n} páginas autónomas (PT + EN)`);
