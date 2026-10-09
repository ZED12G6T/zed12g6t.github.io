// site.js — زر الوضع الليلي في الصفحة الرئيسية وفهارس المواد. يحفظ نفس الاختيار اللي تحفظه صفحات المحاضرات.
(function () {
  var root = document.documentElement, KEY = 'lec-theme';
  try { var t = localStorage.getItem(KEY); if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-btn');
    if (!b) return;
    b.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  });
})();
