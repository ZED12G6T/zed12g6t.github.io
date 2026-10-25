/* =====================================================================
   course.js — أدوات مادة كتابة التقارير الهندسية (نفس فكرة econ.js في economics/ بدون أدوات الحساب)
   1) تبويب "📖 الشرح | 📐 المفاهيم | 🧠 الاختبار" في أعلى صفحة الشرح لو لها ورقة مفاهيم (<html data-laws="laws2.html">)
   2) المعادلة اللي أعرض شوي من صندوقها (في الجوال) تصغر لين 75% بدل ما تتمرر
   حمّله آخر الـ body قبل nav.js في كل صفحات المادة: <script src="course.js"></script>
   ===================================================================== */
(function () {
  'use strict';
  function fitMath() {
    if (!('ResizeObserver' in window)) return;
    const fit = box => {
      const math = box.querySelector('mjx-math');
      box.style.fontSize = '';
      if (!math || !box.clientWidth) return;
      const cs = getComputedStyle(box);
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
      const w = math.getBoundingClientRect().width;
      if (w > room) box.style.fontSize = (parseFloat(cs.fontSize) * Math.max(0.75, room / w)).toFixed(2) + 'px';
    };
    const ro = new ResizeObserver(list => list.forEach(e => fit(e.target)));
    document.querySelectorAll('.m, .result .r-val').forEach(b => ro.observe(b));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fitMath);
  else fitMath();
  // الشريط يبنيه lecture.js وقت DOMContentLoaded قبلنا
  document.addEventListener('DOMContentLoaded', () => {
    const laws = document.documentElement.dataset.laws, bar = document.querySelector('header.topbar');
    if (!laws || !bar) return;
    bar.insertAdjacentHTML('afterend', `<nav class="mode-tabs" aria-label="الشرح أو المفاهيم أو الاختبار"><span class="on" aria-current="page">📖 الشرح</span><a href="${laws}">📐 المفاهيم</a><a href="${laws.replace('laws', 'quiz')}">🧠 الاختبار</a></nav>`);
  });
})();
