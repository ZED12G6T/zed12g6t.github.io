// em-index.js — خلفية فهرس الكهرومغناطيسية: مجال ثنائي القطب لحلقة تيار بخطوط رفيعة،
// مع ١٢ ثيم (٧ فاتحة و٥ داكنة) يحفظها المتصفح. يتحمّل في <head> عشان الثيم ينطبق قبل ما تطلع الصفحة.
(function () {
  const T = [
    { name: 'ذهبي', bg: '#fdfaf0', bg2: '#fff3cc', ink: '#1f1c14', dim: '#6f6858', acc: '#9a6a00', fill: '#f7cf3d', on: '#1f1c14', line: '150,102,0', loop: '150,102,0', glow: '247,200,40', core: '222,160,0' },
    { name: 'أزرق مخطط', bg: '#f5f8fd', bg2: '#dde9fb', ink: '#0f1d33', dim: '#55647b', acc: '#1d4fb8', fill: '#2f6fe8', on: '#ffffff', line: '29,79,184', loop: '12,38,100', glow: '90,160,255', core: '29,100,230' },
    { name: 'نعناعي', bg: '#f3f9f5', bg2: '#d6efe1', ink: '#11241b', dim: '#53705f', acc: '#0d7a5f', fill: '#2bb98a', on: '#0b2a20', line: '13,122,95', loop: '8,72,56', glow: '60,210,160', core: '13,150,110' },
    { name: 'سماوي ومرجاني', bg: '#f4fafb', bg2: '#d8f0f4', ink: '#10222a', dim: '#566d74', acc: '#0b7285', fill: '#ff7a59', on: '#2a0f08', line: '11,114,133', loop: '226,86,56', glow: '255,140,100', core: '238,96,64' },
    { name: 'وردي', bg: '#fdf5f5', bg2: '#fadcdf', ink: '#2a1416', dim: '#7b5d61', acc: '#ae2a48', fill: '#ee6a88', on: '#2a0a12', line: '174,42,72', loop: '110,20,42', glow: '255,120,150', core: '220,50,90' },
    { name: 'لافندر', bg: '#f7f5fd', bg2: '#e4ddfb', ink: '#1c1630', dim: '#635d7c', acc: '#5a3fc0', fill: '#7c5cf0', on: '#ffffff', line: '90,63,192', loop: '48,28,118', glow: '160,130,255', core: '110,80,230' },
    { name: 'كتاب فيزياء', bg: '#f8f7f3', bg2: '#ecebe3', ink: '#141414', dim: '#646460', acc: '#c4321f', fill: '#e2452d', on: '#ffffff', line: '34,34,34', loop: '200,52,32', glow: '240,96,56', core: '208,50,30' },
    { dark: 1, name: 'كحلي وذهبي', bg: '#0a1029', bg2: '#16224f', ink: '#f1ead8', dim: '#a9a48f', acc: '#e3c07a', fill: '#e3c07a', on: '#0a1029', line: '217,181,106', loop: '240,204,130', glow: '255,214,130', core: '255,224,150' },
    { dark: 1, name: 'بنفسجي ليلي', bg: '#100b21', bg2: '#271b52', ink: '#eee9ff', dim: '#a39bc4', acc: '#b9a2ff', fill: '#9f86ff', on: '#100b21', line: '180,156,255', loop: '110,220,255', glow: '120,220,255', core: '170,235,255' },
    { dark: 1, name: 'زمردي ليلي', bg: '#08150f', bg2: '#123323', ink: '#e6f3ea', dim: '#8ea998', acc: '#72e2ad', fill: '#4fd197', on: '#06140d', line: '114,226,173', loop: '210,240,160', glow: '140,255,200', core: '200,255,220' },
    { dark: 1, name: 'عنابي ونحاسي', bg: '#1a0b10', bg2: '#3d1522', ink: '#f7e9e3', dim: '#b89c97', acc: '#f2a774', fill: '#f2a774', on: '#1a0b10', line: '242,167,116', loop: '255,214,170', glow: '255,170,110', core: '255,210,170' },
    { dark: 1, name: 'فحمي وبرتقالي', bg: '#111111', bg2: '#232120', ink: '#f2efe8', dim: '#a19b91', acc: '#ff9d4d', fill: '#ff8a3d', on: '#111111', line: '225,222,215', loop: '255,140,60', glow: '255,150,70', core: '255,190,130' },
  ];
  const KEY = 'em-theme';
  let cur = 0;
  try { cur = Math.min(+localStorage.getItem(KEY) || 0, T.length - 1); } catch (e) {}
  let TH = T[cur];

  function apply(i) {
    TH = T[i]; cur = i;
    const st = document.documentElement.style;
    const v = { '--bg': TH.bg, '--bg-2': TH.bg2, '--ink': TH.ink, '--dim': TH.dim, '--acc': TH.acc, '--line': `rgba(${TH.line},.22)`,
      '--glass': TH.bg + 'd9', '--fill': TH.fill, '--on': TH.on, '--soft': `rgba(${TH.glow},.2)`, '--card': TH.dark ? TH.bg2 : '#ffffff' };
    for (const k in v) st.setProperty(k, v[k]);
    st.colorScheme = TH.dark ? 'dark' : 'light';
    document.querySelectorAll('#pick button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.i === i));
  }
  apply(cur);

  document.addEventListener('DOMContentLoaded', () => {
    const pick = document.getElementById('pick');
    pick.innerHTML = T.map((t, i) => (i === 0 ? '<span class="grp">فاتح</span>' : t.dark && !T[i - 1].dark ? '<span class="grp">داكن</span>' : '') +
      `<button type="button" data-i="${i}" aria-pressed="false"><i style="background:linear-gradient(135deg, ${t.bg2} 0 45%, rgb(${t.line}) 45% 72%, rgb(${t.loop}) 72%)"></i>${t.name}</button>`).join('');
    pick.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      apply(+b.dataset.i);
      try { localStorage.setItem(KEY, cur); } catch (err) {}
      if (still) requestAnimationFrame(frame);
    });
    apply(cur);

    /* ===== الرسمة: إسقاط منظوري ثلاثي الأبعاد على كانفس ===== */
    const cv = document.getElementById('sky'), g = cv.getContext('2d'), HERO = document.getElementById('hero');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STARS = Array.from({ length: 200 }, () => [Math.random(), Math.random(), Math.random() * 1.1 + .25, Math.random() * 7]);
    let W, H, k, cx, cy, S, CUR = TH.line, rotY = 0;
    const tiltX = -.32;
    function size() {
      k = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * k; H = cv.height = innerHeight * k;
      const narrow = innerWidth < 760;
      cx = narrow ? W / 2 : W * .26; S = Math.min(narrow ? W * .34 : W * .165, H * (narrow ? .17 : .28));
    }
    size();
    const col = a => `rgba(${CUR},${a})`;
    function P([x, y, z]) {
      const c = Math.cos(rotY), s = Math.sin(rotY); const X = x * c + z * s; let Z = -x * s + z * c;
      const ct = Math.cos(tiltX), st = Math.sin(tiltX); const Y = y * ct - Z * st; Z = y * st + Z * ct;
      const f = 4.2 / (4.2 + Z); return [cx + X * S * f, cy - Y * S * f];
    }
    function line(pts, a, w = 1) { g.strokeStyle = col(a); g.lineWidth = w * k; g.beginPath(); pts.forEach((p, i) => { const q = P(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); }
    // حلقة أفقية أو رأسية مع شرطات تدريج
    function ring(R, axis, a, ticks = 0, w = 1.1) {
      const pt = t => axis === 'y' ? [R * Math.cos(t), 0, R * Math.sin(t)] : [0, R * Math.cos(t), R * Math.sin(t)];
      const pts = []; for (let i = 0; i <= 160; i++) pts.push(pt(i / 160 * Math.PI * 2)); line(pts, a, w);
      for (let i = 0; i < ticks; i++) { const p1 = pt(i / ticks * Math.PI * 2); line([p1, p1.map(v => v * (i % 5 ? .965 : .93))], a * .9, .8); }
    }
    function glow(p, r, a = 1) {
      const q = P(p), gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 6 * k);
      gr.addColorStop(0, `rgba(${TH.glow},${.6 * a})`); gr.addColorStop(1, `rgba(${TH.glow},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], r * 6 * k, 0, 7); g.fill();
      g.fillStyle = `rgba(${TH.core},${a})`; g.beginPath(); g.arc(q[0], q[1], r * k, 0, 7); g.fill();
    }
    function wireSphere(r, a) {
      for (let i = 1; i < 6; i++) { const y = r * Math.cos(i / 6 * Math.PI), rr = r * Math.sin(i / 6 * Math.PI), pts = []; for (let j = 0; j <= 40; j++) { const t = j / 40 * 7; pts.push([rr * Math.cos(t), y, rr * Math.sin(t)]); } line(pts, a, .7); }
      for (let m = 0; m < 6; m++) { const ph = m / 6 * Math.PI, pts = []; for (let j = 0; j <= 40; j++) { const t = j / 40 * Math.PI * 2; pts.push([r * Math.sin(t) * Math.cos(ph), r * Math.cos(t), r * Math.sin(t) * Math.sin(ph)]); } line(pts, a, .7); }
    }
    function arrowOn(pts, i, a) {
      const p = P(pts[i]), q = P(pts[i + 1]), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), s = 6 * k;
      g.strokeStyle = col(a); g.lineWidth = k; g.beginPath();
      g.moveTo(q[0] - s * Math.cos(ang - .45), q[1] - s * Math.sin(ang - .45)); g.lineTo(q[0], q[1]); g.lineTo(q[0] - s * Math.cos(ang + .45), q[1] - s * Math.sin(ang + .45)); g.stroke();
    }
    // خط مجال ثنائي القطب: r = c·sin²θ في مستوى زاويته phi حول المحور
    function fieldLine(c, phi) { const pts = []; for (let i = 1; i < 120; i++) { const th = i / 120 * Math.PI, r = c * Math.sin(th) ** 2; pts.push([r * Math.sin(th) * Math.cos(phi), r * Math.cos(th), r * Math.sin(th) * Math.sin(phi)]); } return pts; }
    function dipole(t) {
      line([[0, -1.25, 0], [0, 1.25, 0]], .45, .8);
      CUR = TH.loop; ring(.34, 'y', .9, 48, 1.6); CUR = TH.line;
      ring(1.2, 'y', .55, 120, 1.1);
      ring(1.2, 'x', .28, 0, .8);
      wireSphere(.12, .6);
      for (let m = 0; m < 8; m++) { const phi = m / 8 * Math.PI * 2; [.75, 1.35, 2.1].forEach((c, j) => { const pts = fieldLine(c, phi); line(pts, j === 1 ? .5 : .28, j === 1 ? 1 : .8); if (j === 1 && m % 2 === 0) arrowOn(pts, 30, .7); }); }
      const pts = fieldLine(1.35, Math.PI * .25); glow(pts[Math.floor((t / 5200) % 1 * (pts.length - 1))], 4);
      const a0 = t / 1400; glow([.34 * Math.cos(a0), 0, .34 * Math.sin(a0)], 1.6, .8); // التيار يمشي على الحلقة
    }
    function frame(t) {
      t = t || 0;
      g.clearRect(0, 0, W, H);
      if (TH.dark) { for (const [x, y, r, p] of STARS) { g.globalAlpha = .25 + .5 * (.5 + .5 * Math.sin(t / 1100 + p)); g.fillStyle = TH.ink; g.beginPath(); g.arc(x * W, y * H, r * k, 0, 7); g.fill(); } g.globalAlpha = 1; }
      else { g.fillStyle = `rgba(${TH.line},.13)`; const st = 28 * k; for (let x = st / 2; x < W; x += st) for (let y = st / 2; y < H; y += st) g.fillRect(x - .7 * k, y - .7 * k, 1.4 * k, 1.4 * k); }
      g.lineCap = 'round';
      rotY = t / 14000 + .6;
      // الرسمة تمشي مع العنوان لما تنزل بالصفحة
      const hr = HERO.getBoundingClientRect(); cy = (innerWidth < 760 ? hr.top + innerHeight * .17 : hr.top + hr.height / 2) * k;
      if (hr.bottom > -innerHeight * .5) { CUR = TH.line; dipole(t); }
      if (!still) requestAnimationFrame(frame);
    }
    addEventListener('resize', () => { size(); if (still) requestAnimationFrame(frame); });
    addEventListener('scroll', () => { if (still) requestAnimationFrame(frame); }, { passive: true });
    requestAnimationFrame(frame);
  });
})();
