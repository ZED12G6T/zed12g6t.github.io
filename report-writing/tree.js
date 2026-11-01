/* =====================================================================
   tree.js — شجرة المفاهيم (tree.html)
   يبني الشجرة من #tr-data: كل عقدة زر، تضغطه يفتح فروعه ويطلع شرحه في اللوحة
   (جنب الشجرة في الشاشة العريضة، ومن تحت كورقة في الجوال). السهم يفتح ويسكر بس.
   ===================================================================== */
(function () {
  'use strict';
  const src = document.getElementById('tr-data');
  if (!src) return;
  const ROOT = JSON.parse(src.textContent);
  const treeEl = document.querySelector('.tr-tree'), panel = document.querySelector('.tr-panel');
  const COLORS = ['var(--cx)', 'var(--cy)', 'var(--cz)', 'var(--accent)'];
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const byId = {};
  const wide = () => matchMedia('(min-width: 900px)').matches;

  // ---- بناء الشجرة
  function build(n, id, parent, color) {
    n.id = id; n.parent = parent; byId[id] = n;
    const li = document.createElement('li');
    li.className = 'tr-li'; li.setAttribute('role', 'treeitem');
    if (color) li.style.setProperty('--b', color);
    const kids = n.kids || [];
    li.innerHTML = `<div class="tr-row">${kids.length ? `<button type="button" class="tr-tg" aria-label="افتح أو سكّر"></button>` : '<span class="tr-dot"></span>'}` +
      `<button type="button" class="tr-node" data-id="${id}"><span class="tr-e" dir="ltr">${esc(n.en)}</span><span class="tr-a">${esc(n.ar)}</span>` +
      `${kids.length ? `<span class="tr-c">${kids.length}</span>` : ''}</button></div>`;
    if (kids.length) {
      const ul = document.createElement('ul');
      ul.className = 'tr-ul'; ul.setAttribute('role', 'group');
      kids.forEach((k, i) => ul.appendChild(build(k, id + '.' + i, n, color || COLORS[i % COLORS.length])));
      li.appendChild(ul);
      li.setAttribute('aria-expanded', 'false');
    }
    n.li = li;
    return li;
  }
  const top = document.createElement('ul');
  top.className = 'tr-ul tr-top';
  top.appendChild(build(ROOT, '0', null, ''));
  treeEl.appendChild(top);

  const setOpen = (n, open) => { if (n.kids && n.kids.length) n.li.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  const openPath = n => { for (let p = n.parent; p; p = p.parent) setOpen(p, true); };

  // ---- اللوحة
  const pair = (en, ar, cls = '') => `<p class="tr-pe ${cls}" dir="ltr">${esc(en)}</p><p class="tr-pa ${cls}">${esc(ar)}</p>`;
  function show(n, scroll) {
    document.querySelectorAll('.tr-node.on').forEach(b => b.classList.remove('on'));
    const btn = n.li.querySelector(':scope > .tr-row .tr-node');
    btn.classList.add('on');
    const path = []; for (let p = n; p; p = p.parent) path.unshift(p);
    let h = `<button type="button" class="tr-x" aria-label="سكّر">✕</button>`;
    h += `<nav class="tr-crumb">${path.map(p => p === n ? `<b>${esc(p.ar)}</b>` : `<button type="button" data-id="${p.id}">${esc(p.ar)}</button>`).join(' <span>‹</span> ')}</nav>`;
    h += `<h3 class="tr-title"><span class="tr-e" dir="ltr">${esc(n.en)}</span><span class="tr-a">${esc(n.ar)}</span></h3>`;
    if (n.d) h += `<div class="tr-box"><p class="tr-lbl">📌 التعريف · Definition</p>${pair(n.d[0], n.d[1])}</div>`;
    if (n.say) h += `<div class="tr-box tr-say"><p class="tr-lbl">🗣️ بالسعودي</p><p class="tr-pa">${esc(n.say)}</p></div>`;
    if (n.pts && n.pts.length) h += `<div class="tr-box"><p class="tr-lbl">🔑 أهم النقاط · Key points</p><ul class="tr-pts">${n.pts.map(p => `<li>${pair(p[0], p[1])}</li>`).join('')}</ul></div>`;
    if (n.ex) h += `<div class="tr-box tr-ex"><p class="tr-lbl">💡 مثال · Example</p>${pair(n.ex[0], n.ex[1])}</div>`;
    if (n.tip) h += `<div class="tr-box tr-tip"><p class="tr-lbl">⚠️ لا تتلخبط</p><p class="tr-pa">${esc(n.tip)}</p></div>`;
    if (n.kids && n.kids.length) h += `<div class="tr-box"><p class="tr-lbl">🌿 فروعه (${n.kids.length})</p><div class="tr-kids">${n.kids.map(k => `<button type="button" data-id="${k.id}"><span class="tr-e" dir="ltr">${esc(k.en)}</span><span class="tr-a">${esc(k.ar)}</span></button>`).join('')}</div></div>`;
    let go = n.go; for (let p = n.parent; !go && p; p = p.parent) go = p.go;
    if (go) h += `<a class="tr-go" href="${esc(go)}">📖 اقرا الشرح الكامل في المحاضرة ←</a>`;
    panel.innerHTML = h;
    panel.scrollTop = 0;
    document.body.classList.add('tr-sheet');
    if (scroll && wide()) {
      const r = btn.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight) btn.scrollIntoView({ block: 'center' });
    }
  }
  function pick(id, fromPanel) {
    const n = byId[id]; if (!n) return;
    openPath(n); setOpen(n, true); show(n, fromPanel);
  }

  treeEl.addEventListener('click', e => {
    const tg = e.target.closest('.tr-tg');
    if (tg) { const li = tg.closest('.tr-li'); li.setAttribute('aria-expanded', li.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
    const b = e.target.closest('.tr-node');
    if (b) pick(b.dataset.id, false);
  });
  panel.addEventListener('click', e => {
    if (e.target.closest('.tr-x')) { document.body.classList.remove('tr-sheet'); return; }
    const b = e.target.closest('button[data-id]');
    if (b) pick(b.dataset.id, true);
  });
  document.querySelectorAll('.tr-all').forEach(b => b.addEventListener('click', () => {
    Object.values(byId).forEach(n => setOpen(n, b.dataset.open === '1'));
    if (b.dataset.open === '0') setOpen(ROOT, true);
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('tr-sheet'); });

  // البداية: الجذر مفتوح، و«أنواع التقارير» مفتوحة بفروعها، واللوحة فيها شرح «أنواع التقارير» (في الشاشة العريضة بس)
  setOpen(ROOT, true);
  const types = ROOT.kids[0];
  setOpen(types, true);
  types.kids.forEach(k => setOpen(k, true));
  if (wide()) show(types, false);
  else panel.innerHTML = '';
})();
