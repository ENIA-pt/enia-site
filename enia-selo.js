/**
 * ENIA · selo de fonte
 * ══════════════════════════════════════════════════════════════════
 * Componente autónomo. Duas linhas em qualquer página e todos os
 * números passam a mostrar a origem.
 *
 *   <link rel="stylesheet" href="assets/enia-selo.css">
 *   <script src="assets/enia-selo.js" defer></script>
 *
 * ─── PORQUE EXISTE ────────────────────────────────────────────────
 * A 28 de agosto de 2026 uma auditoria encontrou no site o valor
 * «17% das empresas portuguesas usam IA, o dobro da média europeia».
 * Não correspondia a nenhum valor real de Portugal em nenhum ano: era
 * a taxa das pequenas empresas de TODA a União Europeia. Uma troca de
 * linhas ao ler uma tabela.
 *
 * O erro sobreviveu meses por uma razão estrutural, não humana: o
 * número estava escrito à mão em duas páginas, sem fonte ao lado e sem
 * um lugar único onde o verificar. Este ficheiro remove essa
 * possibilidade. Os números vivem em data/enia-dados.json e chegam ao
 * ecrã sempre acompanhados da origem.
 *
 * ─── COMO SE USA NO HTML ──────────────────────────────────────────
 *
 * 1) Valor vindo do ficheiro de dados, com selo automático:
 *      <b data-enia="convergencia_ia.valor"></b>
 *      <span data-enia-selo="convergencia_ia"></span>
 *
 * 2) Número escrito à mão que ainda não migrou, mas que precisa de
 *    fonte visível já:
 *      <span data-enia-selo="ine_iutice_2025"></span>
 *
 * 3) Índice proprietário da ENIA (fica em cor de destaque e liga à
 *    metodologia, para nunca se confundir com dado oficial):
 *      <span data-enia-selo="enia_indice"></span>
 *
 * ─── REGRA MECÂNICA ───────────────────────────────────────────────
 * Em modo de desenvolvimento (localhost) o componente percorre a
 * página à procura de percentagens sem selo por perto e imprime aviso
 * na consola. A régua de rigor não se cumpre por boa intenção: precisa
 * de alguém a bater à porta.
 */

(() => {
  'use strict';

  const FICHEIRO = 'data/enia-dados.json';
  const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  /* Caminho relativo funciona na raiz e em /en/ sem configuração. */
  const raiz = () => location.pathname.includes('/en/') ? '../' : '';

  /* Segue "a.b.c" dentro do objecto sem avaliar código. */
  const desce = (obj, caminho) =>
    caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  async function carregar() {
    const url = raiz() + FICHEIRO + '?v=' + Date.now();
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  /* ── construção do selo ───────────────────────────────────────── */

  function textoDaFonte(dados, idFonte, en) {
    const f = desce(dados, 'fontes.' + idFonte);
    if (!f) return null;
    const nome = esc(f.nome);
    const ano = f.ano ? ', ' + f.ano : '';
    const alvo = f.proprio ? raiz() + 'metodologia.html' : f.url;
    const rotulo = en ? 'Source' : 'Fonte';
    const corpo = alvo
      ? `<a href="${esc(alvo)}"${/^https?:/.test(alvo) ? ' target="_blank" rel="noopener"' : ''}>${nome}${ano}</a>`
      : nome + ano;
    return { html: `${rotulo}: ${corpo}`, proprio: !!f.proprio };
  }

  function selo(dados, chave, en) {
    /* A chave pode ser um id de fonte directo, ou um indicador cujo
       campo "fonte" lista uma ou mais fontes. */
    const direct = textoDaFonte(dados, chave, en);
    if (direct) {
      return `<span class="selo${direct.proprio ? ' selo--proprio' : ''}">${direct.html}</span>`;
    }

    const ind = desce(dados, 'indicadores.' + chave);
    if (!ind) {
      if (DEV) console.warn('[selo] chave desconhecida em enia-dados.json:', chave);
      return '';
    }

    /* Se o indicador traz texto de fonte pronto, é o que manda: foi
       escrito para ser lido, não montado por concatenação. */
    const pronto = en ? ind.fonte_texto_en : ind.fonte_texto_pt;
    const proprio = !!ind.proprio;
    if (pronto) {
      const liga = proprio
        ? ` · <a href="${raiz()}metodologia.html">${en ? 'methodology' : 'metodologia'}</a>`
        : '';
      return `<span class="selo${proprio ? ' selo--proprio' : ''}">${en ? 'Source' : 'Fonte'}: ${esc(pronto)}${liga}</span>`;
    }

    const ids = [].concat(ind.fonte || []);
    const partes = ids.map(id => textoDaFonte(dados, id, en)).filter(Boolean);
    if (!partes.length) {
      if (DEV) console.warn('[selo] indicador sem fonte declarada:', chave);
      return '';
    }
    const algumProprio = proprio || partes.some(p => p.proprio);
    const corpo = partes.map(p => p.html.replace(/^(Fonte|Source): /, '')).join(' e ');
    return `<span class="selo${algumProprio ? ' selo--proprio' : ''}">${en ? 'Source' : 'Fonte'}: ${corpo}</span>`;
  }

  /* ── aplicação ────────────────────────────────────────────────── */

  function aplicar(dados) {
    const en = document.documentElement.lang.startsWith('en');

    /* valores */
    for (const el of document.querySelectorAll('[data-enia]')) {
      const v = desce(dados, 'indicadores.' + el.dataset.enia);
      if (v === undefined || v === null) {
        if (DEV) console.warn('[selo] valor não encontrado:', el.dataset.enia);
        continue;
      }
      /* Decimais à portuguesa e sufixo opcional, para que um valor
         citado em prosa saia igual ao que sai num quadro. Sem isto,
         9.4 apareceria com ponto no meio de uma frase em português. */
      let saida = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
      saida += el.dataset.eniaSuf || '';
      el.textContent = saida;
    }

    /* selos */
    for (const el of document.querySelectorAll('[data-enia-selo]')) {
      el.outerHTML = selo(dados, el.dataset.eniaSelo, en);
    }

    /* legendas */
    for (const el of document.querySelectorAll('[data-enia-legenda]')) {
      const ind = desce(dados, 'indicadores.' + el.dataset.eniaLegenda);
      const t = ind && (en ? ind.legenda_en : ind.legenda_pt);
      if (t) el.textContent = t;
    }

    if (DEV) fiscalizar();
  }

  /* ── fiscal de rigor (só em desenvolvimento) ──────────────────── */

  function fiscalizar() {
    /* Procura percentagens sem selo no bloco onde vivem. Ruidoso por
       desenho: é mais barato ignorar um aviso falso do que descobrir
       um número órfão pela voz de um jornalista. */
    const orfaos = [];
    const blocos = document.querySelectorAll('section, article, li, td, .fig, .warn, .dl');
    const numero = /\d+[,.]\d+\s*%|\b\d{1,3}\s*%/;

    for (const b of blocos) {
      if (b.querySelector('section, article')) continue;      /* só folhas */
      const txt = b.textContent || '';
      if (!numero.test(txt)) continue;
      if (b.querySelector('.selo') || b.closest('.selo')) continue;
      if (b.querySelector('cite')) continue;                  /* .fig usa <cite> */
      if (/fonte|source|metodologia|methodology/i.test(txt)) continue;
      orfaos.push(b);
    }

    if (!orfaos.length) {
      console.info('%c[selo] Nenhum número órfão detectado.', 'color:#2DD4BF');
      return;
    }
    console.warn(
      `%c[selo] ${orfaos.length} bloco(s) com percentagens e sem fonte visível.\n` +
      `Régua de rigor, regra 2: toda a estatística mostra a fonte junto ao número.`,
      'color:#F97316;font-weight:bold'
    );
    for (const o of orfaos) {
      console.warn('  →', (o.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 110), o);
    }
  }

  /* ── arranque ─────────────────────────────────────────────────── */

  const arrancar = () => carregar()
    .then(aplicar)
    .catch(e => {
      console.error('[selo] ' + FICHEIRO + ' não carregou:', e.message);
      /* Falha visível, não silenciosa. Um site que mostra números sem
         conseguir provar a origem deve dizê-lo, e é essa a lição de
         28/08/2026. */
      for (const el of document.querySelectorAll('[data-enia-selo]')) {
        el.outerHTML = '<span class="selo selo--falha">Fonte indisponível: '
          + FICHEIRO + ' não respondeu</span>';
      }
    });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
