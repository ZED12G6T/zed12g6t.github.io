// laws.js — ورقة القواعد والكلمات المفتاحية: أزرار عرض اللغة (الاثنين / English / عربي). منسوخ من economics/laws.js (جزء KaTeX ما يشتغل هنا لأن ما فيه معادلات)
(function () {
  'use strict';
  const KEY = 'laws-view';

  // ألوان المتغيرات: \X أزرق و \Y أخضر و \Z برتقالي (نفس ألوان صفحات الشرح)
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
  function fit() {
    const boxes = document.querySelectorAll('.eq, .hero-card');
    const one = box => {
      const k = box.querySelector('.katex-display > .katex') || box.querySelector('.katex');
      box.style.fontSize = '';
      if (!k || !box.clientWidth) return;
      const room = box.clientWidth - 8, w = k.scrollWidth;
      if (w > room) box.style.fontSize = (parseFloat(getComputedStyle(box).fontSize) * Math.max(0.7, room / w)).toFixed(2) + 'px';
    };
    boxes.forEach(one);
    if ('ResizeObserver' in window) {
      let last = innerWidth;
      new ResizeObserver(() => { if (innerWidth !== last) { last = innerWidth; boxes.forEach(one); } }).observe(document.body);
    }
  }

  function view() {
    const btns = document.querySelectorAll('.view [data-view]');
    const set = v => {
      document.body.classList.remove('view-en', 'view-ar');
      if (v !== 'both') document.body.classList.add('view-' + v);
      btns.forEach(b => b.classList.toggle('on', b.dataset.view === v));
      try { localStorage.setItem(KEY, v); } catch (e) {}
    };
    btns.forEach(b => b.addEventListener('click', () => set(b.dataset.view)));
    let saved = 'both';
    try { saved = localStorage.getItem(KEY) || 'both'; } catch (e) {}
    set(['both', 'en', 'ar'].includes(saved) ? saved : 'both');
  }

  view();
  typeset();
  fit();
  // بعد ما يوصل الخط تتغير المقاسات شوي
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
