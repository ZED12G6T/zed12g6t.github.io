/* =====================================================================
   econ.js — أدوات مادة الاقتصاد الهندسي (مشتركة بين صفحات الفصل 4)
   1) Econ.f      : عوامل الفائدة المركبة (F/P, P/F, F/A, P/A, A/F, A/P, P/G, A/G)
   2) مخطط التدفق النقدي: <svg class="cfd" data-cfd="N|موقع:قيمة:نص:لون|..."></svg>
        الموقع رقم (5) أو مدى (6-10). القيمة موجبة = سهم لفوق (داخل)، سالبة = لتحت (طالع)،
        و +? أو -? سهم مجهول متقطع، و -3324? مجهول متقطع بس طوله بالمقياس. اللون x أو y أو z (نفس ألوان الصفحة) أو فاضي.
        في النص، P_0 أو P_J تكتب الحرف بعد _ صغير تحت.
        اختياري: data-ticks="0,1,…,N" لأسماء المحور، و data-i="i = 8%" يطلع فوق يمين.
        كل <text> فيه $ واحدة بس، عشان MathJax ما يحسبها معادلة.
   3) حاسبة العوامل: <div class="econ-lab factor-lab" data-i="8" data-n="6"></div>
   4) المعادلة اللي أعرض شوي من صندوقها (في الجوال) تصغر لين 75% بدل ما تتمرر. الأطول من كذا تحتاج m wide و m narrow.
   حمّله آخر الـ body قبل nav.js في كل صفحات المادة: <script src="econ.js"></script>
   ===================================================================== */
window.Econ = (function () {
  'use strict';
  const f = {
    FP: (i, n) => Math.pow(1 + i, n),
    PF: (i, n) => Math.pow(1 + i, -n),
    FA: (i, n) => (Math.pow(1 + i, n) - 1) / i,
    PA: (i, n) => (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n)),
    AF: (i, n) => i / (Math.pow(1 + i, n) - 1),
    AP: (i, n) => i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1),
    PG: (i, n) => (1 / i) * ((Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n)) - n / Math.pow(1 + i, n)),
    AG: (i, n) => 1 / i - n / (Math.pow(1 + i, n) - 1)
  };
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const r1 = n => Math.round(n * 10) / 10;
  // يكتب النص، واللي بعد _ ينكتب صغير تحت (P_0 ← P₀)
  const setText = (t, s) => s.split(/_(\w+)/).forEach((p, k) => {
    if (!p) return;
    if (k % 2) el('tspan', { 'baseline-shift': 'sub', 'font-size': '75%' }, t).textContent = p;
    else t.appendChild(document.createTextNode(p));
  });

  /* ---------- مخطط التدفق النقدي ---------- */
  function cfd(svg) {
    const parts = svg.dataset.cfd.split('|');
    const n = +parts[0];
    const items = parts.slice(1).map(t => {
      const [pos, val, label = '', col = ''] = t.split(':');
      const [a, b] = pos.includes('-') ? pos.split('-').map(Number) : [+pos, +pos];
      const unknown = val.includes('?'), num = parseFloat(val.replace('?', ''));
      return { a, b, unknown, scaled: !unknown || !isNaN(num), v: isNaN(num) ? (val[0] === '-' ? -1 : 1) : num, label, col };
    });
    // المحور: لو N كبير نختصر الوسط بـ "…"
    const big = n > 12;
    const slots = big ? [0, 1, 2, 3, null, n - 2, n - 1, n] : Array.from({ length: n + 1 }, (_, k) => k);
    const slotOf = p => big ? (p <= 3 ? p : p >= n - 2 ? 5 + p - (n - 2) : -1) : p;
    const ticks = svg.dataset.ticks ? svg.dataset.ticks.split(',') : slots.map(s => s === null ? '…' : String(s));
    const hasUp = items.some(it => it.v > 0), hasDn = items.some(it => it.v < 0);
    const top = svg.dataset.i ? 20 : 0;   // شريط فوق لنص الفائدة عشان ما يركب على أسماء الأسهم
    const H0 = +(svg.dataset.h || (hasUp && hasDn ? 230 : 170)), W = 600, H = H0 + top;
    const axisY = top + (hasUp && hasDn ? H0 * 0.5 : hasUp ? H0 - 34 : 34);
    const L = hasUp && hasDn ? H0 * 0.5 - 38 : H0 - 74;
    const x0 = 46, x1 = 556, dx = (x1 - x0) / (slots.length - 1), X = s => x0 + s * dx;
    const maxV = Math.max(1, ...items.filter(it => it.scaled).map(it => Math.abs(it.v)));
    const len = it => it.scaled ? Math.max(16, L * Math.abs(it.v) / maxV) : L * 0.8;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    el('path', { class: 'ax', d: `M${x0 - 16} ${axisY}H${x1 + 22}` }, svg);
    const downAt = new Set(), upAt = new Set();
    items.forEach(it => { for (let p = it.a; p <= it.b; p++) (it.v < 0 ? downAt : upAt).add(slotOf(p)); });
    slots.forEach((s, k) => {
      el('path', { class: 'ax', d: `M${X(k)} ${axisY - 4}V${axisY + 4}` }, svg);
      // الرقم تحت المحور، إلا لو فيه سهم نازل فيطلع فوق، ولو فيه سهمين (فوق وتحت) ينزاح جنب السهم
      const below = !downAt.has(k), both = downAt.has(k) && upAt.has(k);
      const t = el('text', { class: 'tick', x: both ? X(k) + 7 : X(k), y: below ? axisY + 16 : axisY - 8, 'text-anchor': both ? 'start' : 'middle' }, svg);
      t.textContent = ticks[k] !== undefined ? ticks[k] : '';
    });
    if (svg.dataset.i) { const t = el('text', { class: 'lbl', x: x1 + 20, y: 14, 'text-anchor': 'end' }, svg); t.textContent = svg.dataset.i; }
    items.forEach(it => {
      const up = it.v > 0, cls = 'sk' + (it.col ? ' ' + it.col : '');
      const tips = [];
      for (let p = it.a; p <= it.b; p++) {
        const s = slotOf(p); if (s < 0) continue;
        const x = X(s), y2 = up ? axisY - len(it) : axisY + len(it), h = up ? 6 : -6;
        const g = el('g', { class: cls }, svg);
        el('path', { d: `M${x} ${axisY}V${r1(y2)}`, style: it.unknown ? 'stroke-dasharray:5 4' : '' }, g);
        el('path', { d: `M${x - 5} ${r1(y2 + h)}L${x} ${r1(y2)}L${x + 5} ${r1(y2 + h)}`, style: 'stroke-dasharray:none' }, g);
        tips.push([x, y2]);
      }
      if (!it.label || !tips.length) return;
      const xm = (tips[0][0] + tips[tips.length - 1][0]) / 2, ty = tips[0][1];
      if (tips.length > 1) el('path', { class: 'guide', d: `M${tips[0][0]} ${r1(up ? ty - 8 : ty + 8)}H${tips[tips.length - 1][0]}` }, svg);
      // سهم لحاله في أول المحور أو آخره: النص يمتد لداخل الرسمة عشان ما ينقص من الطرف (خصوصاً في الجوال لما يكبر الخط)
      const edge = tips.length > 1 ? 'middle' : xm >= x1 - 1 ? 'end' : xm <= x0 + 1 ? 'start' : 'middle';
      const tx = edge === 'end' ? xm + 8 : edge === 'start' ? xm - 8 : xm;
      const t = el('text', { class: 'lbl' + (it.col ? ' ' + it.col + 't' : ''), x: r1(tx), y: r1(up ? ty - (tips.length > 1 ? 14 : 8) : ty + (tips.length > 1 ? 22 : 16)), 'text-anchor': edge }, svg);
      setText(t, it.label);
    });
  }

  /* ---------- حاسبة العوامل ---------- */
  const ROWS = [
    ['F/P', 'FP', '(1+i)^N'], ['P/F', 'PF', '(1+i)^{-N}'],
    ['F/A', 'FA', '\\frac{(1+i)^N - 1}{i}'], ['P/A', 'PA', '\\frac{(1+i)^N - 1}{i(1+i)^N}'],
    ['A/F', 'AF', '\\frac{i}{(1+i)^N - 1}'], ['A/P', 'AP', '\\frac{i(1+i)^N}{(1+i)^N - 1}'],
    ['P/G', 'PG', '\\frac{1}{i}\\left[\\frac{(1+i)^N - 1}{i(1+i)^N} - \\frac{N}{(1+i)^N}\\right]'], ['A/G', 'AG', '\\frac{1}{i} - \\frac{N}{(1+i)^N - 1}']
  ];
  function factorLab(box) {
    const only = (box.dataset.rows || 'FP,PF,FA,PA,AF,AP,PG,AG').split(',');
    const rows = ROWS.filter(r => only.includes(r[1]));
    box.innerHTML = `
      <h3>🧮 حاسبة العوامل (بدل الجداول)</h3>
      <p class="lab-note">اكتب $i$ بالمية وعدد الفترات $N$، وتطلع لك قيم العوامل بأربع منازل مثل جداول الكتاب. وتقدر تكتب المبلغ المعروف عشان يضربه لك.</p>
      <div class="lab-controls">
        <div class="field"><label>$i$ (%)</label><input type="number" step="any" min="0.01" value="${box.dataset.i || 8}" data-k="i"></div>
        <div class="field"><label>$N$</label><input type="number" step="1" min="1" value="${box.dataset.n || 6}" data-k="n"></div>
        <div class="field"><label>المبلغ المعروف (اختياري)</label><input type="number" step="any" value="${box.dataset.amt || ''}" data-k="amt"></div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><th>العامل</th><th>القانون</th><th class="n">القيمة</th><th class="n">× المبلغ</th></tr>
        ${rows.map(r => `<tr><td><span class="ltr">(${r[0]}, <span data-o="i"></span>%, <span data-o="n"></span>)</span></td><td>$${r[2]}$</td><td class="n" data-f="${r[1]}"></td><td class="n" data-m="${r[1]}"></td></tr>`).join('')}
      </table></div>`;
    const inp = k => box.querySelector(`[data-k="${k}"]`);
    const run = () => {
      const i = +inp('i').value / 100, n = Math.round(+inp('n').value), amt = inp('amt').value === '' ? NaN : +inp('amt').value;
      box.querySelectorAll('[data-o="i"]').forEach(s => { s.textContent = inp('i').value; });
      box.querySelectorAll('[data-o="n"]').forEach(s => { s.textContent = n; });
      rows.forEach(r => {
        const v = i > 0 && n >= 1 ? f[r[1]](i, n) : NaN;
        box.querySelector(`[data-f="${r[1]}"]`).textContent = isFinite(v) ? v.toFixed(4) : '—';
        box.querySelector(`[data-m="${r[1]}"]`).textContent = isFinite(v) && isFinite(amt) ? (amt * v).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '';
      });
    };
    box.querySelectorAll('input').forEach(x => x.addEventListener('input', run));
    run();
  }

  /* ---------- تصغير المعادلة على قد صندوقها ---------- */
  // يشتغل كل ما تغير حجم الصندوق: لما يطبعها MathJax، ولما تنفتح خطوة الحل، ولما تلف الجوال
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

  function init() {
    document.querySelectorAll('svg.cfd[data-cfd]').forEach(cfd);
    document.querySelectorAll('.factor-lab').forEach(factorLab);
    // صناديق النتيجة (r-val) يبنيها lecture.js وقت DOMContentLoaded، فنراقب بعده
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fitMath);
    else fitMath();
  }
  // تبويب "الشرح | القوانين | الاختبار" في نص أعلى الصفحة لو لها ورقة قوانين (<html data-laws="laws2.html">، والاختبار quiz2.html). الشريط يبنيه lecture.js وقت DOMContentLoaded قبلنا
  document.addEventListener('DOMContentLoaded', () => {
    const laws = document.documentElement.dataset.laws, bar = document.querySelector('header.topbar');
    if (!laws || !bar) return;
    bar.insertAdjacentHTML('afterend', `<nav class="mode-tabs" aria-label="الشرح أو القوانين أو الاختبار"><span class="on" aria-current="page">📖 الشرح</span><a href="${laws}">📐 القوانين</a><a href="${laws.replace('laws', 'quiz')}">🧠 الاختبار</a></nav>`);
  });
  init();   // الملف يُحمَّل آخر الـ body، فالعناصر جاهزة، ونرسم قبل ما يطبع MathJax معادلات الحاسبة
  return { f, cfd };
})();
