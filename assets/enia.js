/* ==========================================================================
   ENIA v4 — comportamento partilhado

   A rail navega entre PÁGINAS, nunca entre slides. Na home alterna de lado
   consoante o slide visível; nas restantes páginas assenta no lado definido
   no mapa abaixo. Fechada mostra apenas a marca.
   ========================================================================== */
(() => {
  'use strict';
  const html = document.documentElement;

  /* A classe .js é o que ativa a animação de revelação — e, com ela, o estado
     inicial opacity:0. Só a acrescentamos se existir mesmo forma de a reverter.
     Sem IntersectionObserver (ou se este script rebentar), o conteúdo fica
     visível: um site ilegível é pior do que um site sem animação. */
  const canReveal = 'IntersectionObserver' in window;
  if (canReveal) html.classList.add('js');

  /* Língua: as páginas inglesas vivem em /en/ e partilham este ficheiro. */
  const LANG = html.lang.slice(0, 2) === 'en' ? 'en' : 'pt';
  const EN = LANG === 'en';
  const UP = EN ? '../' : '';          /* de /en/ para a raiz */
  const DOWN = EN ? '' : 'en/';        /* da raiz para /en/ */

  const PAGES = [
    /* A home não aparece na lista: o próprio logótipo é o link para ela. */
    { id: 'radar',        file: 'radar.html',        side: 'left',
      pt: 'Radar IA Act',      ptSub: 'Observatório diário',
      en: 'AI Act Radar',      enSub: 'Daily observatory' },
    { id: 'noticias',     file: 'noticias.html',     side: 'right',
      pt: 'Notícias e publicações', ptSub: 'Arquivo integral',
      en: 'News and publications',  enSub: 'Full archive' },
    { id: 'sobre',        file: 'sobre.html',        side: 'left',
      pt: 'Sobre a ENIA e a estrutura em Colégios',
      en: 'About ENIA and the College structure' },
    { id: 'estrategia',   file: 'estrategia.html',   side: 'right',
      pt: 'Estratégia Nacional',  en: 'National Strategy' },
    { id: 'certificacao', file: 'certificacao.html', side: 'left',
      pt: 'Certificação',         en: 'Certification' },
    { id: 'teste',        file: 'teste.html',        side: 'right',
      pt: 'Teste de classificação', ptSub: 'Gratuito, 5 minutos',
      en: 'Risk classification test', enSub: 'Free, 5 minutes' },
    { id: 'marketplace',  file: 'marketplace.html',  side: 'left',
      pt: 'Marketplace de IA Ética', ptSub: 'Quem já se avaliou',
      en: 'Ethical AI Marketplace',  enSub: 'Who has been assessed' },
    { id: 'capacitacao',  file: 'capacitacao.html',  side: 'right',
      pt: 'Capacitação',          en: 'Skills and literacy' },
    { id: 'contactos',    file: 'contactos.html',    side: 'left',
      pt: 'Contactos',            en: 'Contact' }
  ].map(p => ({ ...p, label: EN ? p.en : p.pt, sub: EN ? p.enSub : p.ptSub }));

  const HOME = { id: 'home', file: 'index.html', side: 'right' };
  const ALL = [HOME, ...PAGES];

  const T = {
    open:   EN ? 'Open navigation'  : 'Abrir navegação',
    close:  EN ? 'Close navigation' : 'Fechar navegação',
    cta:    EN ? 'Join the cluster' : 'Integrar o cluster',
    meta:   EN ? 'Observatory updated daily at 00:00 CET'
               : 'Observatório atualizado diariamente às 00:00 CET',
    stamp:  EN ? 'Data updated on '  : 'Dados atualizados a ',
    ptLang: 'Português', enLang: 'English'
  };

  const current = html.dataset.page || 'home';

  html.dataset.side = (ALL.find(p => p.id === current) || HOME).side;

  /* largura real do viewport, sem a scrollbar */
  const setVW = () => html.style.setProperty('--vw', html.clientWidth + 'px');
  setVW();
  addEventListener('resize', setVW, { passive: true });
  addEventListener('orientationchange', setVW);

  /* ── rail ────────────────────────────────────────────────────────────── */
  const rail = document.createElement('nav');
  rail.className = 'rail';
  rail.setAttribute('aria-label', 'Navegação do site');
  const here = ALL.find(p => p.id === current) || HOME;

  /* Marca desenhada inline. Como <img src> falhava sempre que o caminho
     relativo mudava (/en/, build autónoma, file://), o símbolo passa a viver
     no próprio JS: não há caminho para partir. */
  const MARK = `<svg viewBox="0 0 3000 3000" fill="currentColor" aria-hidden="true"><path d="M1263.054,735.999c0,71.253 -57.848,129.101 -129.101,129.101l-427.603,0c-71.253,0 -129.101,-57.848 -129.101,-129.101c0,-71.253 57.848,-129.101 129.101,-129.101l427.603,0c71.253,0 129.101,57.848 129.101,129.101Zm-440.74,632.914l-0.014,-0c-345.572,-7.378 -623.445,-289.814 -623.445,-637.155c-0,-347.345 277.878,-629.783 623.406,-637.153c2.075,-0.1 4.163,-0.15 6.262,-0.15l522.626,0c71.253,0 129.101,57.848 129.101,129.101c0,71.253 -57.848,129.101 -129.101,129.101l-522.626,0c-3.536,0 -7.038,-0.143 -10.495,-0.422c-201.424,9.453 -361.818,175.761 -361.818,379.524c0,203.762 160.392,370.069 361.81,379.525c3.464,-0.28 6.967,-0.423 10.503,-0.423l522.626,0c71.253,0 129.101,57.848 129.101,129.101c0,71.253 -57.848,129.101 -129.101,129.101l-522.626,0c-2.081,0 -4.151,-0.05 -6.208,-0.147Zm764.7,-657.787l0,-0.014c7.378,-345.572 289.814,-623.445 637.155,-623.445c347.345,0 629.783,277.878 637.153,623.406c0.1,2.075 0.15,4.163 0.15,6.262l0,522.626c0,71.253 -57.848,129.101 -129.101,129.101c-71.253,0 -129.101,-57.848 -129.101,-129.101l0,-522.626c0,-3.536 0.143,-7.038 0.422,-10.495c-9.453,-201.424 -175.761,-361.818 -379.524,-361.818c-203.762,0 -370.069,160.392 -379.525,361.81c0.28,3.464 0.423,6.967 0.423,10.503l0,522.626c0,71.253 -57.848,129.101 -129.101,129.101c-71.253,0 -129.101,-57.848 -129.101,-129.101l0,-522.626c0,-2.081 0.05,-4.151 0.147,-6.208Zm0,1543.273l0,-0.014c7.378,-345.572 289.814,-623.445 637.155,-623.445c347.345,0 629.783,277.878 637.153,623.406c0.1,2.075 0.15,4.163 0.15,6.262l0,522.626c0,71.253 -57.848,129.101 -129.101,129.101c-71.253,0 -129.101,-57.848 -129.101,-129.101l-0,-522.626c0,-3.536 0.143,-7.038 0.422,-10.495c-9.453,-201.424 -175.761,-361.818 -379.524,-361.818c-203.762,0 -370.069,160.392 -379.525,361.81c0.28,3.464 0.423,6.967 0.423,10.503l0,522.626c0,71.253 -57.848,129.101 -129.101,129.101c-71.253,0 -129.101,-57.848 -129.101,-129.101l0,-522.626c0,-2.081 0.05,-4.151 0.147,-6.208Zm443.477,353.961c-70.238,-0 -127.263,-57.025 -127.263,-127.263c0,-70.238 57.025,-127.263 127.263,-127.263l387.358,0c70.238,-0 127.263,57.025 127.263,127.263c0,70.238 -57.025,127.263 -127.263,127.263l-387.358,0Zm-1187.263,-1183.516c245.834,0 445.42,199.586 445.42,445.42c0,245.834 -199.586,445.42 -445.42,445.42c-245.834,0 -445.42,-199.586 -445.42,-445.42c0,-245.834 199.586,-445.42 445.42,-445.42Zm0,254.525c-105.357,0 -190.894,85.537 -190.894,190.894c0,105.357 85.537,190.894 190.894,190.894c105.357,0 190.894,-85.537 190.894,-190.894c0,-105.357 -85.537,-190.894 -190.894,-190.894Zm-598.349,1001.037c125.585,-195.028 344.638,-324.253 593.62,-324.331l0.226,-0c63.141,-0.093 121.241,7.955 174.406,21.743c182.718,46.496 337.072,164.335 431.553,322.089c8.091,12.814 13.152,21.968 15.244,26.11c15.052,29.809 14.278,50.139 14.44,53.886l-8.248,50.875l-24.891,40.408l-26.452,22.073l-32.61,14.521l-25.621,4.552l-31.436,-1.59c-3.369,-0.594 -55.253,-1.979 -91.156,-66.818c-2.259,-4.079 -4.579,-8.12 -6.959,-12.121c-27.218,-40.735 -150.927,-207.367 -361.071,-220.395c-8.924,-0.532 -17.917,-0.803 -26.972,-0.808l-0.226,0c-194.067,0.444 -318.293,127.851 -364.006,184.589c-8.279,11.268 -16.049,22.932 -23.274,34.96c-26.081,43.416 -54.975,52.701 -58.653,54.402l-46.982,11.597l-54.746,-9.348l-43.607,-29.692l-24.079,-35.605l-11.287,-49.32l3.374,-32.509c1.087,-4.608 3.298,-13.542 9.004,-25.726c1.831,-3.908 8.604,-16.013 20.411,-33.544Z"/></svg>`;

  rail.innerHTML = `
    <a class="rail__home" href="${UP}index.html" aria-label="ENIA — ${EN ? 'home' : 'página inicial'}"${current === 'home' ? ' aria-current="page"' : ''}>
      <span class="rail__logo">${MARK}</span>
      <span class="rail__word" aria-hidden="true">ENIA</span>
    </a>
    <button class="rail__btn" type="button" aria-expanded="false" aria-controls="railPanel">
      <span class="sr">${T.open}</span>
      <span class="rail__hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>
    </button>
    <span class="rail__fill" aria-hidden="true"></span>
    <div class="rail__panel" id="railPanel">
      ${PAGES.map(p => `<a class="rail__link" href="${p.file}"${p.id === current ? ' aria-current="page"' : ''}>${p.label}${p.sub ? `<small>${p.sub}</small>` : ''}</a>`).join('')}
      <div class="rail__sep"></div>
      <a class="rail__cta" href="contactos.html#integrar">${T.cta} <i>→</i></a>
      <p class="rail__meta" id="railMeta">${T.meta}</p>
    </div>
    <div class="rail__lang">
      <a href="${UP}${here.file}" lang="pt" hreflang="pt-PT" aria-current="${!EN}" title="${T.ptLang}">PT</a>
      <i aria-hidden="true">·</i>
      <a href="${UP}${DOWN}${here.file}" lang="en" hreflang="en" aria-current="${EN}" title="${T.enLang}">EN</a>
    </div>`;

  const scrim = document.createElement('div');
  scrim.className = 'rail__scrim';
  document.body.prepend(rail, scrim);

  const btn = rail.querySelector('.rail__btn');
  const desktop = () => matchMedia('(min-width:861px)').matches;
  let open = false, byPointer = false;

  const setOpen = (v) => {
    open = v;
    rail.classList.toggle('is-open', v);
    scrim.classList.toggle('is-on', v);
    btn.setAttribute('aria-expanded', String(v));
    btn.querySelector('.sr').textContent = v ? T.close : T.open;
    if (v) rail.querySelector('.rail__link').focus({ preventScroll: true });
  };

  btn.addEventListener('click', () => { byPointer = false; setOpen(!open); });
  scrim.addEventListener('click', () => setOpen(false));
  rail.querySelector('.rail__lang').addEventListener('click', e => e.stopPropagation());
  addEventListener('keydown', e => { if (e.key === 'Escape' && open) { setOpen(false); btn.focus(); } });

  /* comportamento clássico de barra lateral: abre ao aproximar o ponteiro */
  rail.addEventListener('pointerenter', () => {
    if (!desktop() || open) return;
    byPointer = true; setOpen(true);
  });
  rail.addEventListener('pointerleave', () => {
    if (!desktop() || !byPointer) return;
    byPointer = false; setOpen(false);
  });

  /* ── home: a rail alterna de lado consoante o slide visível ──────────── */
  const slides = [...document.querySelectorAll('.slide')];
  if (slides.length && canReveal) {
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.intersectionRatio > .5) {
        const i = slides.indexOf(e.target);
        html.dataset.side = i % 2 === 0 ? 'right' : 'left';
        html.dataset.slide = String(i + 1);
      }
    }), { threshold: [.2, .55], root: document.querySelector('.deck') });
    slides.forEach(s => sio.observe(s));
    slides[0].classList.add('in');
  }

  /* ── revelação ───────────────────────────────────────────────────────── */
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (canReveal && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .1 });
    document.querySelectorAll('.rv').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
  }

  /* ── barras de dados ─────────────────────────────────────────────────── */
  window.eniaBars = (root = document) => {
    const fills = root.querySelectorAll('.brow__f[data-w]');
    if (!canReveal || reduce) {
      fills.forEach(f => { f.style.width = f.dataset.w + '%'; });
      return;
    }
    const bio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.width = e.target.dataset.w + '%';
      bio.unobserve(e.target);
    }), { threshold: .3 });
    fills.forEach(f => bio.observe(f));
  };
  eniaBars();

  /* ── utilitários partilhados ─────────────────────────────────────────── */
  const E = window.ENIA = {
    deadlines: (EN ? [
      { date: '2025-02-02', label: 'Prohibited practices + AI literacy', done: true },
      { date: '2025-08-02', label: 'GPAI, AI Office and penalties regime', done: true },
      { date: '2026-08-02', label: 'Article 50 — transparency obligations' },
      { date: '2026-12-02', label: 'Art. 50(2) for legacy systems + new prohibited practices' },
      { date: '2027-08-02', label: 'National regulatory sandbox becomes mandatory' },
      { date: '2027-12-02', label: 'High risk — Annex III (stand-alone systems)' },
      { date: '2028-08-02', label: 'High risk — Annex I (AI embedded in products)' }
    ] : [
      { date: '2025-02-02', label: 'Práticas proibidas + literacia em IA', done: true },
      { date: '2025-08-02', label: 'GPAI, AI Office e regime de coimas', done: true },
      { date: '2026-08-02', label: 'Artigo 50.º — obrigações de transparência' },
      { date: '2026-12-02', label: 'Art. 50.º(2) para sistemas legados + novas práticas proibidas' },
      { date: '2027-08-02', label: 'Sandbox regulatória nacional obrigatória' },
      { date: '2027-12-02', label: 'Alto risco — Anexo III (sistemas autónomos)' },
      { date: '2028-08-02', label: 'Alto risco — Anexo I (IA embebida em produtos)' }
    ]),
    lang: LANG, en: EN, base: UP,
    fLong:  new Intl.DateTimeFormat(EN ? 'en-GB' : 'pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }),
    fShort: new Intl.DateTimeFormat(EN ? 'en-GB' : 'pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
    fStamp: new Intl.DateTimeFormat(EN ? 'en-GB' : 'pt-PT', { dateStyle: 'long', timeStyle: 'short' }),
    D: s => new Date(s + 'T00:00:00Z'),
    days: s => Math.ceil((E.D(s) - Date.now()) / 864e5),
    ord: EN
      ? ['zeroth','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th']
      : ['zero','primeiro','segundo','terceiro','quarto','quinto','sexto','sétimo','oitavo','nono','décimo','décimo primeiro','décimo segundo'],
    esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    rich: s => E.esc(s).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>'),
    next() {
      const up = E.deadlines.filter(d => E.days(d.date) >= 0);
      return up[0] || E.deadlines[E.deadlines.length - 1];
    },
    /* dupla queda: fetch → data/bundle.js → semente inline */
    get: (url, fallback) => {
      const key = /marketplace/.test(url) ? 'marketplace' : /archive/.test(url) ? 'archive' : /radar/.test(url) ? 'radar' : /news/.test(url) ? 'news' : null;
      const local = key && window.__ENIA__ ? window.__ENIA__[key] : null;
      return fetch(UP + url, { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => local || fallback);
    }
  };

  E.get('data/radar.json', null).then(d => {
    if (!d || !d.generated) return;
    const m = document.getElementById('railMeta');
    if (m) m.textContent = T.stamp + E.fStamp.format(new Date(d.generated));
  });
  /* Rede de segurança: qualquer erro não previsto num script de página não pode
     deixar conteúdo invisível. */
  addEventListener('error', () => {
    html.classList.remove('js');
    document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
  });
})();
