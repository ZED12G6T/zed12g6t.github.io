/* ======================================================================
   أدوات مشتركة لرسومات الكهرومغناطيسية: chart() و player() والمساعدات.
   كل محاضرة تستدعيها بـ: const { chart, player, $, L, ... } = EM;
   ====================================================================== */
window.EM = (function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', TAU = 2 * Math.PI, LOG = Math.log10, NPDB = 20 * Math.log10(Math.E);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const L = (ar, en) => `<span lang="ar">${ar}</span><span lang="en">${en}</span>`;
  const TL = (ar, en) => `<tspan lang="ar">${ar}</tspan><tspan lang="en">${en}</tspan>`;
  const SB = (b, s, rest) => `${b}<tspan dy="3" font-size="8.5">${s}</tspan>` + (rest ? `<tspan dy="-3">${rest}</tspan>` : '');   // حرف سفلي في SVG

  /* ---------- الأرقام ---------- */
  const neg = s => s.replace(/^-/, '−');
  const N = (v, d = 2) => neg((Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d));
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const p10 = e => e === 0 ? '1' : e === 1 ? '10' : '10' + String(e).split('').map(ch => SUP[ch]).join('');
  const sig = (v, n = 3) => {
    if (!v) return '0';
    const a = Math.abs(v), e = Math.floor(LOG(a) + 1e-9);
    return a >= 1e4 || a < 1e-3 ? neg((v / Math.pow(10, e)).toFixed(n - 1)) + '×' + p10(e) : neg(v.toFixed(Math.max(0, n - 1 - e)));
  };
  const deg = r => { const d = r * 180 / Math.PI; return (d < 0.005 ? '0' : d < 1 ? d.toFixed(2) : Math.abs(d - Math.round(d)) < 0.05 ? String(Math.round(d)) : d.toFixed(1)) + '°'; };
  const pct = f => (f > 0.995 ? '100' : f >= 0.1 ? (f * 100).toFixed(0) : f >= 0.01 ? (f * 100).toFixed(1) : (f * 100).toFixed(2)) + '%';

  /* ---------- الوسط: كل شي يطلع من النسبة M = σ/ωε ---------- */
  const med = M => { const r = Math.sqrt(1 + M * M); return { ab: Math.sqrt((r - 1) / (r + 1)), th: Math.atan(M) / 2, eta: 1 / Math.sqrt(r) }; };
  const verdict = M => M === 0 ? L('عازل مثالي (σ = 0)', 'Perfect dielectric (σ = 0)') : M <= 0.01 ? L('عازل جيد', 'Good dielectric') : M >= 100 ? L('موصل جيد', 'Good conductor') : L('عازل فقّاد', 'Lossy dielectric');

  /* ---------- المقاييس والرسم ---------- */
  function scale(W, H, p, xd, yd, xlog, ylog) {
    const fx = xlog ? LOG : v => v, fy = ylog ? LOG : v => v;
    const ax = fx(xd[0]), bx = fx(xd[1]), ay = fy(yd[0]), by = fy(yd[1]), iw = W - p.l - p.r, ih = H - p.t - p.b;
    return {
      W, H, pl: p.l, pr: p.r, pt: p.t, pb: p.b, iw, ih, x0: xd[0], x1: xd[1],
      X: v => p.l + (fx(v) - ax) / (bx - ax) * iw,
      Y: v => p.t + (1 - (fy(v) - ay) / (by - ay)) * ih,
      Xi: px => { const u = ax + (px - p.l) / iw * (bx - ax); return xlog ? Math.pow(10, u) : u; }
    };
  }
  function path(f, a, b, n, X, Y, log) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = log ? Math.pow(10, LOG(a) + (LOG(b) - LOG(a)) * u) : a + (b - a) * u;
      d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1);
    }
    return d;
  }
  const P = (cls, d) => `<path class="${cls}" d="${d}"/>`;
  // شبكة خفيفة عند قيم y (والصفر بخط المحور) + أرقام x تحت الرسمة
  function grid(s, o) {
    const xa = s.pl, xb = s.W - s.pr, Y = o.Y || s.Y, ty = o.ty ?? s.H - s.pb;
    let g = '';
    (o.yt || []).forEach(([v, t]) => {
      const y = Y(v).toFixed(1);
      g += `<line class="${v === 0 && !o.ylog ? 'ax' : 'gl'}" x1="${xa}" x2="${xb}" y1="${y}" y2="${y}"/>`;
      if (t) g += `<text class="tick" x="${xa - 6}" y="${(+y + 3.5).toFixed(1)}" text-anchor="end">${t}</text>`;
    });
    (o.xt || []).forEach(([v, t, an]) => {
      const x = s.X(v).toFixed(1);
      if (o.xgrid) g += `<line class="gl" x1="${x}" x2="${x}" y1="${(o.gy0 ?? s.pt).toFixed(1)}" y2="${(o.gy1 ?? s.H - s.pb).toFixed(1)}"/>`;
      if (t) g += `<text class="tick" x="${x}" y="${(ty + 15).toFixed(1)}" text-anchor="${an || 'middle'}">${t}</text>`;
    });
    return g;
  }
  const axName = (s, t, Y = s.Y) => `<text class="ttl" x="${s.W - s.pr + 6}" y="${(Y(0) + 4).toFixed(1)}">${t}</text>`;
  const bracket = (s, a, b, y, t) => {
    const x1 = s.X(a), x2 = s.X(b);
    return `<path class="bracket" d="M${x1.toFixed(1)} ${y + 5}V${y}H${x2.toFixed(1)}V${y + 5}"/><text class="lbl" x="${((x1 + x2) / 2).toFixed(1)}" y="${y - 5}" text-anchor="middle">${t}</text>`;
  };
  function arrow(x1, y1, x2, y2, c) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return `<circle class="dot ${c}" cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="3.5"/>`;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, hl = Math.min(10, len * 0.6), hw = 4.5, bx = x2 - ux * hl, by = y2 - uy * hl;
    return `<line class="ln ${c}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/>` +
      `<path class="head ${c}" d="M${x2.toFixed(1)} ${y2.toFixed(1)}L${(bx - uy * hw).toFixed(1)} ${(by + ux * hw).toFixed(1)}L${(bx + uy * hw).toFixed(1)} ${(by - ux * hw).toFixed(1)}Z"/>`;
  }

  /* ---------- مصنع الرسمات: SVG بعرض الحاوية + مؤشر وتلميح ---------- */
  const charts = [];
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(en => {
    const c = charts.find(k => k.host === en.target);
    if (c && Math.round(en.contentRect.width) !== c.cw) c.draw();
  })) : null;
  function chart(host, o) {
    if (!host) return null;
    const mk = n => document.createElementNS(NS, n), svg = mk('svg'), gS = mk('g'), gD = mk('g'), gX = mk('g');
    gX.setAttribute('class', 'cross');
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', o.label || '');
    svg.append(gS, gD, gX); host.textContent = ''; host.append(svg);
    const c = { host, svg, hx: null, py: null, cw: 0, s: null, show() {}, hide() {} };
    c.draw = () => {
      c.cw = Math.round(host.clientWidth);
      const W = Math.max(280, c.cw || 640), H = o.h(W);
      c.s = scale(W, H, o.pad(W), o.x, o.y || [0, 1], o.xlog, o.ylog);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
      gS.innerHTML = o.st ? o.st(c.s) : '';
      c.drawDyn();
    };
    c.drawDyn = () => { if (o.dy) gD.innerHTML = o.dy(c.s); if (c.hx !== null) c.show(c.hx); };
    if (o.hover) {
      const tip = document.createElement('div');
      tip.className = 'wv-tip'; tip.hidden = true; tip.setAttribute('aria-live', 'polite');
      host.append(tip); svg.setAttribute('tabindex', '0');
      c.show = v => {
        const s = c.s; v = Math.min(s.x1, Math.max(s.x0, v)); c.hx = v;
        const r = o.hover(v, s), px = s.X(v).toFixed(1);
        gX.innerHTML = `<line x1="${px}" x2="${px}" y1="${r.y0 ?? s.pt}" y2="${r.y1 ?? s.H - s.pb}"/>` +
          (r.pts || []).map(q => `<circle class="dot ${q.c}" cx="${px}" cy="${q.y.toFixed(1)}" r="4.5"/>`).join('');
        tip.innerHTML = `<div class="hd"><span class="bd">${r.hd}</span></div>` + r.rows.map(q =>
          `<div class="row">${q.c ? `<span class="key ${q.c}${q.dash ? ' dash' : ''}"></span>` : ''}<span class="lab">${q.k}</span>${q.v !== undefined ? `<span class="val">${q.v}</span>` : ''}</div>`).join('');
        tip.hidden = false;
        const b = svg.getBoundingClientRect(), k = b.width / s.W || 1, x = s.X(v) * k, tw = tip.offsetWidth, th = tip.offsetHeight, hw = host.clientWidth;
        let left = x + 14;
        if (left + tw > hw) left = x - 14 - tw;
        if (left < 0) left = Math.max(0, Math.min(hw - tw, x - tw / 2));
        const top = c.py !== null ? Math.max(0, Math.min(b.height - th, c.py - th / 2)) : s.pt * k;
        tip.style.left = left + 'px'; tip.style.top = top + 'px';
      };
      c.hide = () => { c.hx = null; c.py = null; gX.innerHTML = ''; tip.hidden = true; };
      const at = e => { const b = svg.getBoundingClientRect(); c.py = e.clientY - b.top; return c.s.Xi((e.clientX - b.left) * c.s.W / b.width); };
      svg.addEventListener('pointermove', e => c.show(at(e)));
      svg.addEventListener('pointerdown', e => c.show(at(e)));
      svg.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') c.hide(); });
      if (o.click) svg.addEventListener('click', e => o.click(at(e)));
      svg.addEventListener('focus', () => { if (c.hx === null) { c.py = null; c.show(o.start ?? (o.xlog ? Math.sqrt(c.s.x0 * c.s.x1) : (c.s.x0 + c.s.x1) / 2)); } });
      svg.addEventListener('blur', () => c.hide());
      svg.addEventListener('keydown', e => {
        const s = c.s, v0 = c.hx ?? (s.x0 + s.x1) / 2;
        const mv = d => o.xlog ? Math.pow(10, LOG(v0) + d * (LOG(s.x1) - LOG(s.x0)) / 40) : v0 + d * (s.x1 - s.x0) / 40;
        let v;
        if (e.key === 'ArrowRight') v = mv(1);
        else if (e.key === 'ArrowLeft') v = mv(-1);
        else if (e.key === 'Home') v = s.x0;
        else if (e.key === 'End') v = s.x1;
        else if (e.key === 'Escape') { c.hide(); return; }
        else if ((e.key === 'Enter' || e.key === ' ') && o.click && c.hx !== null) { e.preventDefault(); o.click(c.hx); return; }
        else return;
        e.preventDefault(); c.py = null; c.show(v);
      });
    } else svg.style.cursor = 'default';
    charts.push(c); if (ro) ro.observe(host); c.draw();
    return c;
  }
  // في الجوال التلميح يبقى لين تلمس مكان ثاني
  document.addEventListener('pointerdown', e => charts.forEach(c => { if (c.hx !== null && !c.svg.contains(e.target)) c.hide(); }));

  /* ---------- التشغيل: حلقة وحدة، وكل رسمة تتحرك بس لما تكون ظاهرة ---------- */
  const players = [];
  let raf = 0, last = 0;
  function loop(ts) {
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    let any = false;
    players.forEach(p => { if (p.on && p.vis) { p.tick(dt); any = true; } });
    raf = any ? requestAnimationFrame(loop) : (last = 0);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  function player(btn, host, tick, auto) {
    const p = { on: !!auto && !reduce, vis: false, tick };
    const paint = () => { if (btn) { btn.innerHTML = p.on ? L('⏸ إيقاف', '⏸ Pause') : L('▶ تشغيل', '▶ Play'); btn.setAttribute('aria-pressed', p.on); } };
    p.start = () => { p.on = true; paint(); kick(); };
    p.stop = () => { p.on = false; paint(); };
    if (btn) btn.addEventListener('click', () => (p.on ? p.stop() : p.start()));
    if (host && 'IntersectionObserver' in window) new IntersectionObserver(es => { p.vis = es[es.length - 1].isIntersecting; if (p.vis) kick(); }).observe(host);
    else p.vis = true;
    paint(); players.push(p);
    return p;
  }
  return { NS, TAU, LOG, NPDB, reduce, $, $$, L, TL, SB, neg, N, SUP, p10, sig, deg, pct, med, verdict, scale, path, P, grid, axName, bracket, arrow, charts, chart, player, kick };
})();
