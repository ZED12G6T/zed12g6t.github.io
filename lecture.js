/* =====================================================================
   lecture.js — محرك صفحات ملخص المحاضرات (مشترك لكل المحاضرات)
   يُحمَّل في <head> قبل MathJax. صفحة المحاضرة فيها المحتوى بس،
   وهذا الملف يبني الباقي: الشريط العلوي، الفهرس، أزرار الحل خطوة بخطوة،
   التحقق من الإجابات، الاختبار، البطاقات، المختبر، الثيم واللغة.
   ===================================================================== */
(function () {
  'use strict';
  const root = document.documentElement;

  /* ---------- 1) الثيم واللغة قبل الرسم (بدون وميض) ---------- */
  try {
    const th = localStorage.getItem('lec-theme');
    if (th === 'light' || th === 'dark') root.setAttribute('data-theme', th);
    if (localStorage.getItem('lec-lang') === 'en' && !root.hasAttribute('data-ar-only')) { root.lang = 'en'; root.dir = 'ltr'; }
  } catch (e) {}

  /* ---------- 2) إعداد MathJax: يطبع المعادلات بعد ما نبني الصفحة ---------- */
  let markReady;
  const ready = new Promise(r => { markReady = r; });
  window.MathJax = {
    loader: { load: ['[tex]/html'] },
    tex: {
      packages: { '[+]': ['html'] },
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      macros: { X: ['\\class{vx}{#1}', 1], Y: ['\\class{vy}{#1}', 1], Z: ['\\class{vz}{#1}', 1] }
    },
    chtml: { scale: 1.02 },
    startup: { pageReady: () => ready.then(() => window.MathJax.startup.defaultPageReady()) }
  };

  /* ---------- أدوات ---------- */
  const L = (ar, en) => `<span lang="ar">${ar}</span><span lang="en">${en}</span>`;
  const T = v => Array.isArray(v) ? L(v[0], v[1]) : v;                    // [ar, en] أو نص مشترك
  const pipe = s => { const [a, e] = String(s).split('|'); return L(a, e === undefined ? a : e); };  // "عربي|English"
  const isEn = () => root.lang === 'en';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const typeset = els => (window.MathJax && MathJax.typesetPromise) ? MathJax.typesetPromise(els).catch(() => {}) : null;
  const hooks = { theme: [], lang: [] };
  window.Lec = { L, T, isEn, onTheme: f => hooks.theme.push(f), onLang: f => hooks.lang.push(f) };

  /* ---------- الثيم ---------- */
  function theme() {
    return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function paintTheme() { const b = document.getElementById('theme-btn'); if (b) b.textContent = theme() === 'dark' ? '☀' : '☾'; }
  function toggleTheme() {
    const next = theme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('lec-theme', next); } catch (e) {}
    paintTheme(); hooks.theme.forEach(f => f());
  }

  /* ---------- اللغة ---------- */
  let titleAr = '';
  function applyLang(l) {
    root.lang = l; root.dir = l === 'en' ? 'ltr' : 'rtl';
    try { localStorage.setItem('lec-lang', l); } catch (e) {}
    const b = document.getElementById('lang-btn'); if (b) b.textContent = l === 'en' ? 'عربي' : 'EN';
    document.title = l === 'en' && root.dataset.titleEn ? root.dataset.titleEn : titleAr;
    const nav = window.renderNav || window.renderNavigation;   // اسم الدالة يختلف بين نسخ nav.js
    if (nav) nav();
    hooks.lang.forEach(f => f());
  }

  /* ---------- الهيكل: الشريط العلوي + الفهرس + التذييل ---------- */
  function chrome() {
    const main = document.querySelector('main') || document.body;
    const secs = $$('main section[data-nav]');
    const arOnly = root.hasAttribute('data-ar-only');
    const pills = secs.map(s => `<a href="#${s.id}">${pipe(s.dataset.nav)}</a>`).join('');
    main.insertAdjacentHTML('beforebegin', `
<div id="progress"><i></i></div>
<header class="topbar">
  <div class="brand"><span class="logo"><i style="background:var(--cx)"></i><i style="background:var(--cy)"></i><i style="background:var(--cz)"></i></span>
    <span>${L('ملخصات المحاضرات ·', 'Lecture summaries ·')} <b>${root.dataset.topic || ''}</b></span></div>
  <div class="tb-actions">
    ${arOnly ? '' : '<button class="icon-btn" id="lang-btn" title="Language / اللغة">EN</button>'}
    <button class="icon-btn" id="theme-btn" title="المظهر / Theme">☾</button>
    <select id="lecture-select" aria-label="Lecture" onchange="if (this.value) location.href = this.value"></select>
  </div>
</header>
<nav class="pills" aria-label="Sections"><div class="pills-in" id="pills">${pills}</div></nav>`);
    main.insertAdjacentHTML('afterend', `
<footer class="foot">
  <button class="btn small" id="toggle-all">${L('📖 إظهار/إخفاء كل الحلول', '📖 Show/hide all solutions')}</button>
  <button class="btn small" onclick="window.print()">${L('🖨️ طباعة', '🖨️ Print')}</button>
  <span class="ltr">${root.dataset.topic || ''}</span>
</footer>`);
    const lb = document.getElementById('lang-btn');
    if (lb) lb.addEventListener('click', () => applyLang(isEn() ? 'ar' : 'en'));
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { paintTheme(); hooks.theme.forEach(f => f()); });

    // شريط التقدم
    const bar = document.querySelector('#progress i');
    addEventListener('scroll', () => {
      const h = document.documentElement;
      bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%';
    }, { passive: true });

    // القسم الحالي في الفهرس
    const links = $$('#pills a');
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('active', on);
        if (on) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }), { rootMargin: '-35% 0px -60% 0px' });
    secs.forEach(s => obs.observe(s));
  }

  /* ---------- رأس القسم: <section class="card" data-num="01"><h2>..</h2><p class="sub">..</p> ---------- */
  function sectionHeads() {
    $$('section.card[data-num]').forEach(sec => {
      const h = sec.querySelector(':scope > h2'); if (!h) return;
      const sub = h.nextElementSibling && h.nextElementSibling.classList.contains('sub') ? h.nextElementSibling : null;
      const head = document.createElement('div'); head.className = 'sec-head';
      head.innerHTML = `<span class="sec-num">${sec.dataset.num}</span><div></div>`;
      sec.insertBefore(head, h); head.lastChild.append(h); if (sub) head.lastChild.append(sub);
    });
  }

  /* ---------- الحل خطوة بخطوة: <ol class="solve"> <li class="step">… ---------- */
  const solvers = [];
  function steppers() {
    $$('ol.solve').forEach(ol => {
      const steps = [...ol.children].filter(li => li.classList.contains('step'));
      let num = steps[0] && steps[0].classList.contains('read') ? 0 : 1;
      steps.forEach(s => {
        const n = document.createElement('span'); n.className = 'step-n';
        n.textContent = s.classList.contains('final') ? '✓' : num++;
        s.prepend(n);
        $$('.left', s).forEach(p => { p.innerHTML = `${L('باقي:', 'Left:')} <b>${p.innerHTML}</b>`; });
        $$('.result', s).forEach(r => {
          const lab = r.dataset.label ? pipe(r.dataset.label) : L('الجواب', 'Answer');
          r.innerHTML = `<span class="r-label">${lab}</span><span class="r-val">${r.innerHTML}</span>`;
        });
      });
      const start = ol.dataset.start === 'solution' ? L('أبي الحل', 'Show solution') : L('ابدأ الحل ←', 'Start solving →');
      const bar = document.createElement('div'); bar.className = 'solve-bar';
      bar.innerHTML = `<button class="btn primary"></button><button class="btn">${L('كل الخطوات', 'All steps')}</button><button class="btn">↺</button><span class="dots">${steps.map(() => '<i></i>').join('')}</span>`;
      ol.before(bar);
      const [next, all, reset] = bar.querySelectorAll('button'), dots = [...bar.querySelectorAll('.dots i')];
      let k = 0;
      const render = () => {
        steps.forEach((s, i) => s.classList.toggle('shown', i < k));
        dots.forEach((d, i) => d.classList.toggle('on', i < k));
        next.innerHTML = k === 0 ? start : k < steps.length ? L('الخطوة التالية ←', 'Next step →') : L('✓ انتهى الحل', '✓ Done');
        next.disabled = k >= steps.length; all.hidden = k >= steps.length; reset.hidden = k === 0;
      };
      next.addEventListener('click', () => {
        if (k >= steps.length) return;
        k++; render();
        steps[k - 1].scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      all.addEventListener('click', () => { k = steps.length; render(); });
      reset.addEventListener('click', () => { k = 0; render(); });
      solvers.push({ set(open) { k = open ? steps.length : 0; render(); }, isOpen: () => k === steps.length });
      render();
    });
    const t = document.getElementById('toggle-all');
    if (t) t.addEventListener('click', () => { const open = solvers.some(s => !s.isOpen()); solvers.forEach(s => s.set(open)); });
  }

  /* ---------- التحقق من الجواب: <div class="check" data-answer="9/2"></div> ---------- */
  function parseAnswer(s) {
    s = String(s).trim()
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[٫,]/g, '.').replace(/\s+/g, '').replace(/^=/, '');
    const m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
    if (m) return parseFloat(m[1]) / parseFloat(m[2]);
    return /^-?\d*\.?\d+$/.test(s) ? parseFloat(s) : NaN;
  }
  function checks() {
    $$('.check[data-answer]').forEach(box => {
      box.innerHTML = `<input type="text" inputmode="decimal" placeholder="= ?" aria-label="answer"><button class="btn small">${L('تحقق', 'Check')}</button><span class="check-msg"></span>`;
      const input = box.querySelector('input'), btn = box.querySelector('button'), msg = box.querySelector('.check-msg');
      const target = parseAnswer(box.dataset.answer);
      const run = () => {
        const v = parseAnswer(input.value);
        if (isNaN(v)) { msg.className = 'check-msg no'; msg.innerHTML = L('اكتب رقم أو كسر مثل 3/4', 'Type a number or a fraction like 3/4'); return; }
        const ok = Math.abs(v - target) < 1e-3 * Math.max(1, Math.abs(target));
        msg.className = 'check-msg ' + (ok ? 'ok' : 'no');
        msg.innerHTML = ok ? L('✓ صح! ممتاز', '✓ Correct!') : L('✗ مو صحيح — جرّب مرة ثانية أو افتح التلميح', '✗ Not quite — try again or open the hint');
      };
      btn.addEventListener('click', run);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    });
    // التلميح: <details class="hint"><p>..</p></details> — العنوان يُضاف تلقائياً
    $$('details.hint').forEach(d => {
      if (!d.querySelector('summary')) d.insertAdjacentHTML('afterbegin', `<summary>${L('💡 تلميح', '💡 Hint')}</summary>`);
    });
  }

  /* ---------- الاختبار: <div class="quiz"> <div class="q" data-answer="2"> <p>سؤال</p> <button>..</button>×4 <p class="q-why">السبب</p> ---------- */
  function quiz() {
    $$('.quiz').forEach(qz => {
      const qs = $$('.q', qz); let score = 0;
      qs.forEach((q, i) => {
        const p = q.querySelector(':scope > p:not(.q-why)'); if (p) { p.classList.add('q-text'); p.insertAdjacentHTML('afterbegin', `<span class="qn">${i + 1}</span>`); }
        const opts = document.createElement('div'); opts.className = 'opts';
        $$(':scope > button', q).forEach(b => { b.className = 'opt'; opts.append(b); });
        const why = q.querySelector('.q-why');
        why ? why.before(opts) : q.append(opts);
        const correct = (+q.dataset.answer || 1) - 1;
        if (why) why.insertAdjacentHTML('afterbegin', '<span class="verdict"></span>');
        opts.addEventListener('click', e => {
          const b = e.target.closest('.opt'); if (!b || b.disabled) return;
          const all = $$('.opt', opts), j = all.indexOf(b), ok = j === correct;
          all.forEach((o, idx) => { o.disabled = true; if (idx === correct) o.classList.add('correct'); else if (idx === j) o.classList.add('wrong'); });
          if (ok) score++;
          if (why) { why.className = 'q-why ' + (ok ? 'ok' : 'no'); why.querySelector('.verdict').innerHTML = ok ? L('✓ صح! ', '✓ Correct! ') : L('✗ لا. ', '✗ No. '); }
          qz.querySelector('.score .val').textContent = score;
        });
      });
      qz.insertAdjacentHTML('beforeend', `<div class="score"><span>${L('نتيجتك:', 'Your score:')} <span class="val">0</span> <span class="ltr">/ ${qs.length}</span></span><button class="btn small">${L('🔄 من جديد', '🔄 Start over')}</button></div>`);
      qz.querySelector('.score button').addEventListener('click', () => {
        score = 0; qz.querySelector('.score .val').textContent = '0';
        $$('.opt', qz).forEach(o => { o.disabled = false; o.classList.remove('correct', 'wrong'); });
        $$('.q-why', qz).forEach(w => { w.className = 'q-why'; });
      });
    });
  }

  /* ---------- البطاقات: <div class="cards"> <div class="flash"><div>وجه</div><div>ظهر</div></div> ---------- */
  function cards() {
    $$('.cards').forEach(box => {
      box.classList.add('flash-grid');
      $$('.flash', box).forEach(c => {
        const [f, b] = [...c.children];
        c.tabIndex = 0; c.setAttribute('role', 'button');
        c.innerHTML = `<div class="flash-in"><div class="face front"><div>${f ? f.innerHTML : ''}</div><span class="hint">${L('اضغط ↻', 'tap ↻')}</span></div><div class="face back"><div>${b ? b.innerHTML : ''}</div></div></div>`;
      });
      box.insertAdjacentHTML('beforebegin', `<button class="btn small">${L('🔀 خلط', '🔀 Shuffle')}</button>`);
      box.previousElementSibling.addEventListener('click', () => {
        const items = [...box.children];
        for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
        items.forEach(c => { c.classList.remove('flipped'); box.append(c); });
      });
      box.addEventListener('click', e => { const c = e.target.closest('.flash'); if (c) c.classList.toggle('flipped'); });
      box.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const c = e.target.closest('.flash'); if (c) { e.preventDefault(); c.classList.toggle('flipped'); } } });
    });
  }

  /* ---------- المختبر ثلاثي الأبعاد: <div class="lab"></div> + window.LAB_PRESETS ---------- */
  function lab() {
    const host = document.querySelector('.lab'), P = window.LAB_PRESETS;
    if (!host || !P) return;
    host.innerHTML = `
<div class="lab-controls">
  <div class="field" style="flex:1 1 260px"><label>${L('الدالة والجسم', 'Function and solid')}</label><select></select></div>
  <div class="field"><label>${L('عدد التقسيمات لكل محور', 'Divisions per axis')} · <span class="rv">n = 6</span></label><input type="range" min="2" max="14" value="6"></div>
  <div style="display:flex;gap:8px"><button class="btn primary"></button><button class="btn">↺</button></div>
</div>
<div class="stage"><canvas aria-label="3D box model"></canvas><div class="readout"></div><div class="drag-hint">${L('↔ اسحب للتدوير', '↔ drag to rotate')}</div></div>
<div class="scale">${L('$f$ صغيرة', 'small $f$')}<i></i>${L('$f$ كبيرة', 'large $f$')}</div>
<div class="callout key lab-order"></div>`;
    const sel = host.querySelector('select'), nIn = host.querySelector('input[type=range]'), nVal = host.querySelector('.rv');
    const [playBtn, resetBtn] = host.querySelectorAll('.lab-controls button');
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    const readout = host.querySelector('.readout'), orderBox = host.querySelector('.lab-order');
    let key = Object.keys(P)[0], n = 6, cells = [], cum = [], shown = 0, playing = false, raf = 0;
    let yaw = -2.2, pitch = 0.42, W = 0, H = 0, d = {}, dV = 1, fmin = 0, fmax = 1, occ = null;
    Object.keys(P).forEach(k => { const o = document.createElement('option'); o.value = k; sel.append(o); });

    function build() {
      const p = P[key], b = p.box, ord = p.order.split('');   // [داخلي، أوسط، خارجي]
      d = { x: (b.x[1] - b.x[0]) / n, y: (b.y[1] - b.y[0]) / n, z: (b.z[1] - b.z[0]) / n };
      dV = d.x * d.y * d.z; cells = []; cum = [0];
      const idx = {};
      for (let a = 0; a < n; a++) for (let m = 0; m < n; m++) for (let c = 0; c < n; c++) {
        idx[ord[2]] = a; idx[ord[1]] = m; idx[ord[0]] = c;
        const x = b.x[0] + (idx.x + .5) * d.x, y = b.y[0] + (idx.y + .5) * d.y, z = b.z[0] + (idx.z + .5) * d.z;
        let frac = 1;   // صناديق الحافة تنحسب بنسبة الجزء اللي داخل الجسم
        if (p.inside) {
          let hit = 0; const S = 4;
          for (let u = 0; u < S; u++) for (let w = 0; w < S; w++) for (let t = 0; t < S; t++)
            if (p.inside(b.x[0] + (idx.x + (u + .5) / S) * d.x, b.y[0] + (idx.y + (w + .5) / S) * d.y, b.z[0] + (idx.z + (t + .5) / S) * d.z)) hit++;
          frac = hit / (S * S * S);
          if (!frac) continue;
        }
        const v = p.f(x, y, z);
        cells.push({ i: idx.x, j: idx.y, k: idx.z, x, y, z, v, row: a * n + m, vis: frac >= .5 });
        cum.push(cum[cum.length - 1] + v * frac * dV);
      }
      const vis = cells.filter(c => c.vis);
      fmin = Math.min(...vis.map(c => c.v)); fmax = Math.max(...vis.map(c => c.v));
      occ = new Uint8Array(n * n * n);
    }
    const css = name => getComputedStyle(root).getPropertyValue(name).trim();
    const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const v = parseInt(h, 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
    const STOPS = [[255, 226, 140], [255, 140, 90], [196, 45, 95]];
    const cmap = t => { t = Math.max(0, Math.min(1, t)); const s = t * 2, i = Math.min(1, Math.floor(s)), u = s - i; return STOPS[i].map((c, q) => c + (STOPS[i + 1][q] - c) * u); };

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    function draw() {
      if (!W || !H || !cells.length) return;
      const p = P[key], b = p.box;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const rot = (x, y, z) => { const x1 = x * cy - y * sy, y1 = x * sy + y * cy; return [x1, y1 * cp - z * sp, y1 * sp + z * cp]; };   // [أفقي، عمق، رأسي]
      const ext = 1.28, pts = [];
      for (const X of b.x) for (const Y of b.y) for (const Z of b.z) pts.push(rot(X, Y, Z));
      pts.push(rot(b.x[1] * ext, 0, 0), rot(0, b.y[1] * ext, 0), rot(0, 0, b.z[1] * ext));
      const minX = Math.min(...pts.map(q => q[0])), maxX = Math.max(...pts.map(q => q[0]));
      const minU = Math.min(...pts.map(q => q[2])), maxU = Math.max(...pts.map(q => q[2]));
      const pad = 34, s = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxU - minU));
      const ox = W / 2 - s * (minX + maxX) / 2, oy = H / 2 + s * (minU + maxU) / 2;
      const scr = (x, y, z) => { const r = rot(x, y, z); return [ox + s * r[0], oy - s * r[2]]; };
      ctx.clearRect(0, 0, W, H);
      const ink3 = css('--ink-3'), col = { x: css('--cx'), y: css('--cy'), z: css('--cz') };
      if (p.inside) {   // الصندوق المحيط
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = ink3; ctx.globalAlpha = .55; ctx.lineWidth = 1;
        const C = []; for (const X of b.x) for (const Y of b.y) for (const Z of b.z) C.push([X, Y, Z]);
        for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++)
          if ([0, 1, 2].filter(q => C[i][q] !== C[j][q]).length === 1) { const a = scr(...C[i]), e = scr(...C[j]); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...e); ctx.stroke(); }
        ctx.restore();
      }
      ctx.lineWidth = 1.6; ctx.font = '600 13px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [['x', [b.x[1] * ext, 0, 0]], ['y', [0, b.y[1] * ext, 0]], ['z', [0, 0, b.z[1] * ext]]].forEach(([nm, tip]) => {
        const a = scr(0, 0, 0), e = scr(...tip);
        ctx.strokeStyle = col[nm]; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...e); ctx.stroke();
        const dx = e[0] - a[0], dy = e[1] - a[1], len = Math.hypot(dx, dy) || 1;
        ctx.fillStyle = col[nm]; ctx.fillText(nm, e[0] + dx / len * 12, e[1] + dy / len * 12);
      });
      occ.fill(0);
      for (let q = 0; q < shown; q++) { const c = cells[q]; if (c.vis) occ[c.i + n * (c.j + n * c.k)] = 1; }
      const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], Lv = [-0.35, -0.55, 0.76];
      const faces = DIRS.map(dir => { const r = rot(...dir); return { dir, vis: r[1] < 0, sh: 0.58 + 0.42 * Math.max(0, r[0] * Lv[0] + r[1] * Lv[1] + r[2] * Lv[2]) }; }).filter(f => f.vis);
      const list = cells.slice(0, shown).filter(c => c.vis).map(c => ({ c, depth: rot(c.x, c.y, c.z)[1] })).sort((a, e) => e.depth - a.depth);
      const curRow = playing && shown > 0 ? cells[shown - 1].row : -1;
      const hl = hexRgb(col[p.order[0]]), flat = fmax - fmin < 1e-9;
      ctx.lineWidth = n > 9 ? 0.4 : 0.7; ctx.lineJoin = 'round';
      for (const { c } of list) {
        const base = c.row === curRow ? hl : flat ? [124, 131, 255] : cmap((c.v - fmin) / (fmax - fmin));
        const x0 = b.x[0] + c.i * d.x, x1 = x0 + d.x, y0 = b.y[0] + c.j * d.y, y1 = y0 + d.y, z0 = b.z[0] + c.k * d.z, z1 = z0 + d.z;
        for (const { dir, sh } of faces) {
          const ni = c.i + dir[0], nj = c.j + dir[1], nk = c.k + dir[2];
          if (ni >= 0 && nj >= 0 && nk >= 0 && ni < n && nj < n && nk < n && occ[ni + n * (nj + n * nk)]) continue;
          let Q;
          if (dir[0]) { const X = dir[0] > 0 ? x1 : x0; Q = [[X, y0, z0], [X, y1, z0], [X, y1, z1], [X, y0, z1]]; }
          else if (dir[1]) { const Y = dir[1] > 0 ? y1 : y0; Q = [[x0, Y, z0], [x1, Y, z0], [x1, Y, z1], [x0, Y, z1]]; }
          else { const Z = dir[2] > 0 ? z1 : z0; Q = [[x0, y0, Z], [x1, y0, Z], [x1, y1, Z], [x0, y1, Z]]; }
          ctx.beginPath(); Q.forEach((v, t) => { const s2 = scr(...v); t ? ctx.lineTo(...s2) : ctx.moveTo(...s2); }); ctx.closePath();
          ctx.fillStyle = `rgb(${base.map(v => Math.round(v * sh)).join(',')})`; ctx.fill();
          ctx.strokeStyle = 'rgba(20,15,35,.28)'; ctx.stroke();
        }
      }
      const sum = cum[shown], done = shown === cells.length;
      readout.innerHTML =
        `<div><span class="k">n = </span><span class="v">${n}</span><span class="k"> → ${p.inside ? cells.filter(c => c.vis).length + ' / ' + n ** 3 : n ** 3} boxes</span></div>` +
        `<div><span class="k">ΔV = </span><span class="v">${dV.toFixed(4)}</span></div>` +
        `<div><span class="k">Σ f·ΔV = </span><span class="v">${sum.toFixed(4)}</span>${done ? '' : '<span class="k"> …</span>'}</div>` +
        `<div><span class="k">exact = </span><span class="ok">${p.exactTxt || p.exact}</span></div>` +
        (done ? `<div><span class="k">|error| = </span><span class="v">${Math.abs(sum - p.exact).toFixed(4)}</span></div>` : '');
    }
    function writeOrder() {
      const [a, m, o] = P[key].order.split(''), v = c => `<b class="v${c}">${c}</b>`;
      const dv = `<span class="ltr" style="font-family:var(--f-mono)">d${a} d${m} d${o}</span>`;
      orderBox.innerHTML = `<strong>${L('▶ زر التشغيل يبني الجسم بنفس ترتيب التكامل', '▶ Play builds the solid in the order of integration')} ${dv}:</strong> ` +
        L(`أول شي <b>صف</b> على ${v(a)} (التكامل الداخلي — لونه مميز وهو ينبني)، الصفوف تصنع <b>طبقة</b> على ${v(m)} (الأوسط)، والطبقات تصنع <b>الجسم كامل</b> على ${v(o)} (الخارجي).`,
          `first a <b>row</b> along ${v(a)} (the inner integral — highlighted while it's built), rows stack into a <b>slab</b> along ${v(m)} (middle), and slabs stack into the <b>whole solid</b> along ${v(o)} (outer).`);
    }
    const setPlay = () => { playBtn.innerHTML = playing ? L('⏸ إيقاف', '⏸ Pause') : L('▶ ابنِ الجسم', '▶ Build it'); };
    function tick() {
      if (!playing) return;
      shown = Math.min(cells.length, shown + Math.max(1, Math.ceil(cells.length / 160)));
      if (shown >= cells.length) { playing = false; setPlay(); draw(); return; }
      draw(); raf = requestAnimationFrame(tick);
    }
    function stop() { playing = false; cancelAnimationFrame(raf); setPlay(); }
    function rebuild() { stop(); build(); shown = cells.length; writeOrder(); draw(); }
    playBtn.addEventListener('click', () => {
      if (playing) { stop(); draw(); return; }
      if (reduceMotion) { shown = cells.length; draw(); return; }
      if (shown >= cells.length) shown = 0;
      playing = true; setPlay(); tick();
    });
    resetBtn.addEventListener('click', () => { stop(); shown = cells.length; draw(); });
    sel.addEventListener('change', () => { key = sel.value; rebuild(); });
    nIn.addEventListener('input', () => { n = +nIn.value; nVal.textContent = 'n = ' + n; rebuild(); });
    let drag = null;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      yaw -= (e.clientX - drag.x) * 0.01;
      pitch = Math.max(0.05, Math.min(1.35, pitch + (e.clientY - drag.y) * 0.008));
      drag = { x: e.clientX, y: e.clientY }; draw();
    });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drag = null; }));
    new ResizeObserver(resize).observe(cv);
    const relabel = () => { [...sel.options].forEach(o => { const l = P[o.value].label; o.textContent = Array.isArray(l) ? l[isEn() ? 1 : 0] : l; }); setPlay(); writeOrder(); draw(); };
    window.Lec.onLang(relabel); window.Lec.onTheme(draw);
    build(); shown = cells.length; relabel();
  }

  /* ---------- التشغيل ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    titleAr = document.title;
    const steps = [chrome, sectionHeads, steppers, checks, quiz, cards, lab];
    steps.forEach(f => { try { f(); } catch (e) { console.error('lecture.js:', f.name, e); } });
    paintTheme();
    applyLang(isEn() ? 'en' : 'ar');
    markReady();
  });
})();
