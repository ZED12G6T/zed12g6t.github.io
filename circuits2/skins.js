/* skins.js — زر 🎨 في الشريط العلوي لاختيار شكل الصفحة (ألوان + أشكال).
   يُحمَّل في <head> بعد lecture.js عشان يطبق الشكل المحفوظ قبل الرسم (بدون وميض).
   الألوان والأشكال في skins.css. الاختيار يتحفظ في المتصفح ويمشي على كل المحاضرات. */
(function () {
  'use strict';
  var KEY = 'c2-skin', root = document.documentElement;
  // l = [خلفية الفاتح, لونه], d = [خلفية الداكن, لونه] — للمعاينة الصغيرة بس
  var SKINS = [
    { id: 'copper', ar: 'نحاسي (الأصلي)', en: 'Copper (original)', l: ['#f2f3f5', '#a3522f'], d: ['#121416', '#d0866a'] },
    { id: 'bp',     ar: 'مخطط هندسي',     en: 'Blueprint',         l: ['#e8eff7', '#1a5bb0'], d: ['#0c2646', '#82c8ff'] },
    { id: 'pcb',    ar: 'لوحة دوائر',     en: 'Circuit board',     l: ['#ecf3ee', '#875800'], d: ['#0a281c', '#e6b84a'] },
    { id: 'chalk',  ar: 'دفتر وسبورة',    en: 'Notebook & chalk',  l: ['#eef2e4', '#b0362a'], d: ['#1d2a25', '#f3d35c'] }
  ];
  function valid(id) { return SKINS.some(function (s) { return s.id === id; }); }
  function apply(id) {
    if (!valid(id) || id === 'copper') root.removeAttribute('data-skin');
    else root.setAttribute('data-skin', id);
  }
  var cur = 'copper';
  try { cur = localStorage.getItem(KEY) || 'copper'; } catch (e) {}
  if (!valid(cur)) cur = 'copper';
  apply(cur);

  function build() {
    var acts = document.querySelector('.topbar .tb-actions');
    if (!acts || document.getElementById('skin-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'skin-btn'; btn.className = 'icon-btn';
    btn.title = 'شكل الصفحة / Page style';
    btn.setAttribute('aria-label', 'شكل الصفحة / Page style');
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'skin-pop');
    btn.innerHTML = '<span aria-hidden="true">🎨</span>';
    acts.insertBefore(btn, document.getElementById('theme-btn') || acts.firstChild);

    var pop = document.createElement('div');
    pop.id = 'skin-pop'; pop.className = 'skin-pop'; pop.hidden = true;
    pop.setAttribute('role', 'group'); pop.setAttribute('aria-label', 'Page style');
    pop.innerHTML = '<p class="sk-title"><span lang="ar">اختر شكل الصفحة، والزر ☾ يبدّل بين الفاتح والداكن</span><span lang="en">Pick a page style. The ☾ button still switches light and dark</span></p>' +
      SKINS.map(function (s) {
        return '<button type="button" class="sk-opt" data-skin-id="' + s.id + '" aria-pressed="' + (s.id === cur) + '">' +
          '<span class="sk-prev" style="--l0:' + s.l[0] + ';--l1:' + s.l[1] + ';--d0:' + s.d[0] + ';--d1:' + s.d[1] + '"></span>' +
          '<span class="sk-name"><span lang="ar">' + s.ar + '</span><span lang="en">' + s.en + '</span></span></button>';
      }).join('');
    acts.closest('.topbar').appendChild(pop);

    function open(v) {
      pop.hidden = !v; btn.setAttribute('aria-expanded', String(v));
      if (v) { var on = pop.querySelector('[aria-pressed="true"]'); if (on) on.focus(); }
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(pop.hidden); });
    pop.addEventListener('click', function (e) {
      var o = e.target.closest('.sk-opt'); if (!o) return;
      cur = o.getAttribute('data-skin-id');
      // نفس حيلة المحرك: نوقف الحركات لحظة التبديل عشان كل شي يتغير مرة وحدة
      root.classList.add('theme-switch'); apply(cur); void root.offsetHeight;
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('theme-switch'); }); });
      try { localStorage.setItem(KEY, cur); } catch (err) {}
      pop.querySelectorAll('.sk-opt').forEach(function (b) { b.setAttribute('aria-pressed', String(b === o)); });
    });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { open(false); btn.focus(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
  setTimeout(build, 600);   // احتياط لو الشريط تأخر
})();
