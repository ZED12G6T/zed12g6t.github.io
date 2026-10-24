// quiz.js — اختبار "أي قانون تستخدم؟" (quiz2.html و quiz4-1.html و quiz4-2.html)
// زر ترجمة لكل سؤال، وزر الجواب، والطالب يقيّم نفسه ✓ / ✗ والعداد فوق يحسب. التقييم والترتيب ينحفظون في المتصفح.
(function () {
  'use strict';
  const data = JSON.parse(document.getElementById('qz-data').textContent);
  const list = document.getElementById('qz-list');
  const cards = () => Array.from(list.querySelectorAll('.qz'));
  const $ = id => document.getElementById(id);
  const TR_KEY = 'quiz-tr';

  // ---------- الحفظ (ممكن يكون مقفل في التصفح الخاص، فكل شي داخل try) ----------
  let state = { g: {}, order: null };
  try { Object.assign(state, JSON.parse(localStorage.getItem(data.key)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(data.key, JSON.stringify(state)); } catch (e) {} };

  // ---------- المعادلات ----------
  function typeset() {
    if (!window.renderMathInElement) return;
    renderMathInElement(document.body, {
      delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
      macros: { '\\X': '\\htmlClass{vx}{#1}', '\\Y': '\\htmlClass{vy}{#1}', '\\Z': '\\htmlClass{vz}{#1}' },
      trust: ctx => ctx.command === '\\htmlClass',
      strict: false,
      throwOnError: false
    });
  }
  // لو المعادلة أعرض من صندوقها: نصغر الخط لين 70%، وبعدها يتمرر الصندوق
  function fit(root) {
    root.querySelectorAll('.eq').forEach(box => {
      const k = box.querySelector('.katex-display > .katex') || box.querySelector('.katex');
      box.style.fontSize = '';
      if (!k || !box.clientWidth) return;
      const room = box.clientWidth - 8, w = k.scrollWidth;
      if (w > room) box.style.fontSize = (parseFloat(getComputedStyle(box).fontSize) * Math.max(0.7, room / w)).toFixed(2) + 'px';
    });
  }

  // ---------- الترجمة والجواب ----------
  function setTr(card, on) {
    card.classList.toggle('tr-on', on);
    const b = card.querySelector('.b-tr');
    b.setAttribute('aria-expanded', on);
    b.querySelector('span').textContent = on ? 'إخفاء الترجمة' : 'ترجمة';
  }
  function setAns(card, on) {
    const a = card.querySelector('.qz-a'), b = card.querySelector('.b-ans');
    a.hidden = !on;
    card.classList.toggle('open', on);
    b.setAttribute('aria-expanded', on);
    b.querySelector('span').textContent = on ? 'إخفاء الجواب' : 'الجواب';
    if (on) fit(a);
  }

  // ---------- التقييم والعداد ----------
  function paint(card) {
    const g = state.g[card.id];
    card.classList.toggle('is-ok', g === 1);
    card.classList.toggle('is-no', g === 0);
    card.querySelector('.qz-st').textContent = g === 1 ? '✓ صح' : g === 0 ? '✗ غلط' : '';
    card.querySelectorAll('.qz-grade button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.g === g)));
  }
  function score() {
    const all = cards(), n = all.length;
    let ok = 0, no = 0;
    const per = {};
    all.forEach(c => {
      const g = state.g[c.id];
      if (g === undefined) return;
      g ? ok++ : no++;
      const p = per[c.dataset.law] || (per[c.dataset.law] = [0, 0]);
      p[g ? 0 : 1]++;
    });
    const done = ok + no;
    $('sc-ok').textContent = ok;
    $('sc-no').textContent = no;
    $('sc-left').textContent = n - done;
    $('sc-pct').textContent = done ? Math.round(100 * ok / done) + '%' : '–';
    $('bar-ok').style.width = (100 * ok / n) + '%';
    $('bar-no').style.width = (100 * no / n) + '%';
    // نهاية الاختبار
    const end = $('qz-end');
    end.hidden = done < n;
    if (done === n) $('qz-end-s').innerHTML = `نتيجتك <b>${ok}</b> من <b>${n}</b> (${Math.round(100 * ok / n)}%).` +
      (no ? ` غلطت في ${no}، راجعها مع ورقة القوانين.` : ' ولا غلطة! 👏');
    // حسب القانون: بس القوانين اللي انكشفت
    const rows = Object.keys(data.laws).filter(id => per[id]).map(id => {
      const [ar, en, href] = data.laws[id], [a, b] = per[id];
      return `<a class="ql${b ? ' has-no' : ''}" href="${href}"><span class="ql-t"><b>${ar}</b><small dir="ltr" lang="en">${en}</small></span><span class="ql-s"><i class="ok">✓ ${a}</i><i class="no">✗ ${b}</i></span></a>`;
    });
    $('qz-laws-b').innerHTML = rows.length ? rows.join('') : '<p class="muted">لسا ما قيّمت ولا سؤال.</p>';
    filter();
  }
  function grade(card, g) {
    if (state.g[card.id] === g) delete state.g[card.id]; else state.g[card.id] = g;   // نفس الزر مرة ثانية يلغي التقييم
    save(); paint(card); score();
  }

  // ---------- الفلتر ----------
  let mode = 'all';
  function filter() {
    let shown = 0;
    cards().forEach(c => {
      const g = state.g[c.id];
      const hide = (mode === 'todo' && g !== undefined) || (mode === 'wrong' && g !== 0);
      c.hidden = hide;
      if (!hide) shown++;
    });
    $('qz-empty').hidden = shown > 0;
    document.querySelectorAll('.seg [data-f]').forEach(b => b.classList.toggle('on', b.dataset.f === mode));
  }
  function setMode(m) { mode = m; filter(); }

  // ---------- الترتيب ----------
  function number() { cards().forEach((c, i) => { c.querySelector('.qz-n b').textContent = i + 1; }); }
  function applyOrder(ids) {
    const byId = {};
    cards().forEach(c => { byId[c.id] = c; });
    if (!ids || ids.length !== cards().length || !ids.every(id => byId[id])) return false;
    ids.forEach(id => list.appendChild(byId[id]));
    number();
    return true;
  }
  function shuffle() {
    const all = cards();
    let best = null;
    for (let t = 0; t < 300 && !best; t++) {
      const a = all.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      if (a.every((c, i) => !i || a[i - 1].dataset.law !== c.dataset.law)) best = a;   // ولا سؤالين ورا بعض على نفس القانون
    }
    state.order = (best || all).map(c => c.id);
    applyOrder(state.order);
    save();
  }

  // ---------- الأحداث ----------
  list.addEventListener('click', e => {
    const card = e.target.closest('.qz');
    if (!card) return;
    if (e.target.closest('.b-tr')) setTr(card, !card.classList.contains('tr-on'));
    else if (e.target.closest('.b-ans')) setAns(card, card.querySelector('.qz-a').hidden);
    else if (e.target.closest('.qz-grade button')) grade(card, +e.target.closest('button').dataset.g);
  });
  document.querySelectorAll('.seg [data-f]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.f)));
  document.querySelector('[data-go="wrong"]').addEventListener('click', () => { setMode('wrong'); list.scrollIntoView({ behavior: 'smooth' }); });

  const trAll = $('tr-all');
  function setTrAll(on) {
    document.body.classList.toggle('tr-all', on);
    trAll.setAttribute('aria-pressed', on);
    trAll.classList.toggle('on', on);
    try { localStorage.setItem(TR_KEY, on ? '1' : '0'); } catch (e) {}
  }
  trAll.addEventListener('click', () => setTrAll(!document.body.classList.contains('tr-all')));
  let trSaved = false;
  try { trSaved = localStorage.getItem(TR_KEY) === '1'; } catch (e) {}
  setTrAll(trSaved);

  $('shuffle').addEventListener('click', () => { shuffle(); window.scrollTo({ top: list.offsetTop - 200, behavior: 'smooth' }); });
  $('reset').addEventListener('click', () => {
    if (!confirm('تبي تمسح التقييم وتبدأ من جديد؟')) return;
    state.g = {};
    save();
    cards().forEach(c => { setAns(c, false); setTr(c, false); paint(c); });
    setMode('all');
    score();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- البداية ----------
  applyOrder(state.order);
  cards().forEach(paint);
  score();
  typeset();
  let last = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== last) { last = innerWidth; document.querySelectorAll('.qz.open .qz-a').forEach(fit); } });
  // خطوط KaTeX ما تنزل إلا لما يبان الجواب أول مرة، فنعيد القياس بعد ما توصل
  const refit = () => document.querySelectorAll('.qz.open .qz-a').forEach(fit);
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(refit);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refit);
  }
})();
