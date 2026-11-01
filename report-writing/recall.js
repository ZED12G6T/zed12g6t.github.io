/* =====================================================================
   recall.js — "🎯 جاوب من راسك" في mindmaps.html
   خانة لكل محاضرة (.rc[data-ch]) مكانها ثابت والسؤال يتغير: سؤال عشوائي من بنك أسئلة المحاضرة (#rc-data)
   "جاوبت" يطلع الإجابة بالإنجليزي والعربي، وبعدها "عرفتها" أو "ما عرفتها" يجيب سؤال جديد.
   اللي ما عرفته يرجع بعد 4 أسئلة، واللي عرفته ما يتكرر لين تخلص كل الأسئلة.
   ===================================================================== */
(function () {
  'use strict';
  const src = document.getElementById('rc-data');
  if (!src) return;
  const bank = JSON.parse(src.textContent);
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const mark = t => esc(t).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  document.querySelectorAll('.rc[data-ch]').forEach(box => {
    const qs = bank[box.dataset.ch] || [];
    if (!qs.length) return;
    const $ = s => box.querySelector(s);
    const show = $('.rc-show'), ok = $('.rc-ok'), no = $('.rc-no'), ans = $('.rc-a');
    let deck = [], cur = -1, known = 0, tried = 0, done = new Set();

    function next() {
      if (!deck.length) { done.clear(); deck = shuffle(qs.map((_, i) => i).filter(i => i !== cur)); }
      cur = deck.shift();
      const q = qs[cur];
      $('.rc-q .rc-en').innerHTML = mark(q.q[0]);
      $('.rc-q .rc-ar').innerHTML = mark(q.q[1]);
      $('.rc-ans.rc-en').innerHTML = mark(q.a[0]);
      $('.rc-ans.rc-ar').innerHTML = mark(q.a[1]);
      $('.rc-why.rc-en').innerHTML = mark(q.w[0]);
      $('.rc-why.rc-ar').innerHTML = mark(q.w[1]);
      ans.hidden = true; show.hidden = false; ok.hidden = no.hidden = true;
      box.classList.remove('rc-in'); void box.offsetWidth; box.classList.add('rc-in');
    }
    function score() {
      $('.rc-k').textContent = known; $('.rc-t').textContent = tried;
      $('.rc-left').textContent = qs.length - done.size;
    }
    show.addEventListener('click', () => { ans.hidden = false; show.hidden = true; ok.hidden = no.hidden = false; ok.focus({ preventScroll: true }); });
    ok.addEventListener('click', () => { known++; tried++; done.add(cur); score(); next(); });
    no.addEventListener('click', () => { tried++; deck.splice(Math.min(4, deck.length), 0, cur); score(); next(); });
    next(); score();
  });
})();
