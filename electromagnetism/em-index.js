// em-index.js — خلفية فهرس الكهرومغناطيسية: مجال ثنائي القطب لحلقة تيار بخطوط رفيعة فوق سماء فيها نجوم.
(function () {
  // ألوان الرسمة: فحمي وبرتقالي (نفس ألوان em-index.css)
  const TH = { ink: '#f2efe8', line: '225,222,215', loop: '255,140,60', glow: '255,150,70', core: '255,190,130' };

  document.addEventListener('DOMContentLoaded', () => {
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
      for (const [x, y, r, p] of STARS) { g.globalAlpha = .25 + .5 * (.5 + .5 * Math.sin(t / 1100 + p)); g.fillStyle = TH.ink; g.beginPath(); g.arc(x * W, y * H, r * k, 0, 7); g.fill(); }
      g.globalAlpha = 1;
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
