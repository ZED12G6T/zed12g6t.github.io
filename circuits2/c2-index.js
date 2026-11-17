// c2-index.js — خلفية فهرس تحليل الدوائر 2: فيزور دوّار يرسم موجته مع الزمن، وتحتها القدرة اللحظية.
// الفكرة كلها من المادة: v(t) = Re{V e^{jωt}} ، والتيار متأخر بزاوية θ ، و p(t) = v·i ومتوسطها ½VmIm cosθ.
(function () {
  // الألوان (نفس c2-index.css): خطوط فضية، الجهد نحاسي، التيار فيروزي، القدرة ذهبية
  const TH = { ink: '#eef2f0', line: '208,222,220', v: '236,142,88', i: '72,214,196', p: '242,200,96', neg: '235,96,96' };

  document.addEventListener('DOMContentLoaded', () => {
    const cv = document.getElementById('sky'), g = cv.getContext('2d'), HERO = document.getElementById('hero');
    const SL = document.getElementById('theta'), OUT = { th: document.getElementById('o-th'), pf: document.getElementById('o-pf'), kind: document.getElementById('o-kind'), p: document.getElementById('o-p') };
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STARS = Array.from({ length: 170 }, () => [Math.random(), Math.random(), Math.random() * 1.05 + .25, Math.random() * 7]);
    let W, H, k, cx, cy, S, rotY = .5, tiltX = -.3, user = false, thDeg = 36.87;

    // لو حرّك الطالب المنزلق نوقف الحركة التلقائية للزاوية
    if (SL) SL.addEventListener('input', () => { user = true; thDeg = +SL.value; readout(); });

    function size() {
      k = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * k; H = cv.height = innerHeight * k;
      const narrow = innerWidth < 760;
      cx = narrow ? W * .56 : W * .27; S = Math.min(narrow ? W * .2 : W * .12, H * (narrow ? .11 : .2));
    }
    size();

    /* ===== إسقاط منظوري ===== */
    function P([x, y, z]) {
      const c = Math.cos(rotY), s = Math.sin(rotY); const X = x * c + z * s; let Z = -x * s + z * c;
      const ct = Math.cos(tiltX), st = Math.sin(tiltX); const Y = y * ct - Z * st; Z = y * st + Z * ct;
      const f = 5 / (5 + Z); return [cx + X * S * f, cy - Y * S * f];
    }
    const rgba = (c, a) => `rgba(${c},${a})`;
    function line(pts, c, a, w = 1, dash) {
      g.strokeStyle = rgba(c, a); g.lineWidth = w * k; g.setLineDash(dash ? dash.map(d => d * k) : []);
      g.beginPath(); pts.forEach((p, n) => { const q = P(p); n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
    }
    function poly(pts, c, a) { g.fillStyle = rgba(c, a); g.beginPath(); pts.forEach((p, n) => { const q = P(p); n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fill(); }
    function glow(p, r, c, a = 1) {
      const q = P(p), R = r * 6 * k, gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], R);
      gr.addColorStop(0, rgba(c, .55 * a)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], R, 0, 7); g.fill();
      g.fillStyle = rgba('255,245,232', a); g.beginPath(); g.arc(q[0], q[1], r * k, 0, 7); g.fill();
    }
    function arrow(a3, b3, c, al, w) {
      line([a3, b3], c, al, w);
      const p = P(a3), q = P(b3), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), s = 9 * k;
      g.fillStyle = rgba(c, al); g.beginPath(); g.moveTo(q[0], q[1]);
      g.lineTo(q[0] - s * Math.cos(ang - .38), q[1] - s * Math.sin(ang - .38)); g.lineTo(q[0] - s * Math.cos(ang + .38), q[1] - s * Math.sin(ang + .38)); g.closePath(); g.fill();
    }

    /* ===== أبعاد المشهد =====
       x = محور الزمن ، y = المحور الحقيقي Re ، z = المحور التخيلي Im
       الحلقة (المستوى المركب) عند X0 ، الجدار خلفها عند z = ZW ، والأرضية تحتها عند y = YF */
    const X0 = -1.5, X1 = 1.65, ZW = 1.45, YF = -1.55, VM = 1, IM = .66, CYC = 1.75, N = 150;
    const kap = CYC * 2 * Math.PI / (X1 - X0);

    function readout() {
      const th = thDeg * Math.PI / 180, pf = Math.cos(th);
      if (SL && !user) SL.value = thDeg.toFixed(1);
      OUT.th.textContent = (thDeg >= 0 ? '+' : '−') + Math.abs(thDeg).toFixed(1) + '°';
      OUT.pf.textContent = pf.toFixed(2);
      OUT.p.textContent = (pf * 100).toFixed(0) + '%';
      OUT.kind.textContent = Math.abs(thDeg) < 1.5 ? 'مقاومي بحت: التيار مع الجهد' : thDeg > 0 ? 'حثّي: التيار متأخر عن الجهد' : 'سعوي: التيار متقدم على الجهد';
      OUT.kind.dataset.k = Math.abs(thDeg) < 1.5 ? 'r' : thDeg > 0 ? 'l' : 'c';
    }

    function scene(t) {
      const w = t / 1150, th = thDeg * Math.PI / 180;           // ωt و زاوية الحمل θ = θv − θi
      const ang = x => w - kap * (x - X0);                       // زاوية الفيزور عند كل نقطة على محور الزمن
      const xs = Array.from({ length: N + 1 }, (_, n) => X0 + (X1 - X0) * n / N);

      /* --- الجدار: شبكة + موجتا v(t) و i(t) (ظل الحلزون على المحور الحقيقي) --- */
      for (let n = 0; n <= 12; n++) { const x = X0 + (X1 - X0) * n / 12; line([[x, -1.15, ZW], [x, 1.15, ZW]], TH.line, n % 4 ? .07 : .14, .7); }
      [-1, -.5, 0, .5, 1].forEach(y => line([[X0, y, ZW], [X1, y, ZW]], TH.line, y ? .08 : .22, y ? .7 : .9));
      line(xs.map(x => [x, VM * Math.cos(ang(x)), ZW]), TH.v, .95, 1.7);
      line(xs.map(x => [x, IM * Math.cos(ang(x) - th), ZW]), TH.i, .9, 1.4);

      /* --- الأرضية: القدرة اللحظية p = v·i ، الموجب يروح للحمل والسالب يرجع للمصدر --- */
      const zp = x => 1.7 * VM * Math.cos(ang(x)) * IM * Math.cos(ang(x) - th);
      for (let n = 0; n <= 12; n++) { const x = X0 + (X1 - X0) * n / 12; line([[x, YF, -.75], [x, YF, 1.05]], TH.line, .06, .7); }
      line([[X0, YF, 0], [X1, YF, 0]], TH.line, .25, .9);
      for (let n = 0; n < N; n++) {
        const a = xs[n], b = xs[n + 1], pa = zp(a), pb = zp(b);
        poly([[a, YF, 0], [a, YF, pa], [b, YF, pb], [b, YF, 0]], (pa + pb) >= 0 ? TH.p : TH.neg, (pa + pb) >= 0 ? .2 : .26);
      }
      line(xs.map(x => [x, YF, zp(x)]), TH.p, .9, 1.4);
      const zav = 1.7 * .5 * VM * IM * Math.cos(th);                // متوسط القدرة P = ½ Vm Im cosθ
      line([[X0, YF, zav], [X1, YF, zav]], TH.p, .85, 1.1, [5, 5]);

      /* --- محور الزمن والحلزون (رأس الفيزور مع مرور الزمن) --- */
      arrow([X0, 0, 0], [X1 + .25, 0, 0], TH.line, .4, .9);
      const hv = xs.map(x => [x, VM * Math.cos(ang(x)), VM * Math.sin(ang(x))]);
      line(hv, TH.line, .62, 1.1);
      line(xs.map(x => [x, IM * Math.cos(ang(x) - th), IM * Math.sin(ang(x) - th)]), TH.i, .28, .9);
      // ستارة: خيوط من الحلزون للجدار تبيّن إن الموجة هي ظل الحلزون
      for (let n = 4; n <= N; n += 6) line([hv[n], [hv[n][0], hv[n][1], ZW]], TH.v, .13, .7);

      /* --- المستوى المركب: حلقة مدرّجة بالدرجات + المحوران --- */
      const ringPts = r => Array.from({ length: 121 }, (_, n) => { const a = n / 120 * Math.PI * 2; return [X0, r * Math.cos(a), r * Math.sin(a)]; });
      line(ringPts(1), TH.line, .55, 1.1);
      line(ringPts(IM), TH.line, .16, .7);
      for (let n = 0; n < 72; n++) { const a = n / 72 * Math.PI * 2, m = n % 6 ? .955 : .9; line([[X0, Math.cos(a), Math.sin(a)], [X0, m * Math.cos(a), m * Math.sin(a)]], TH.line, .5, .8); }
      line([[X0, -1.25, 0], [X0, 1.25, 0]], TH.line, .4, .8);
      line([[X0, 0, -1.25], [X0, 0, 1.25]], TH.line, .4, .8);
      // قوس الزاوية θ بين الفيزورين
      const arc = Array.from({ length: 21 }, (_, n) => { const a = w - th * n / 20; return [X0, .3 * Math.cos(a), .3 * Math.sin(a)]; });
      line(arc, TH.p, .9, 1.2);

      /* --- الفيزوران V و I --- */
      const tv = [X0, VM * Math.cos(w), VM * Math.sin(w)], ti = [X0, IM * Math.cos(w - th), IM * Math.sin(w - th)];
      arrow([X0, 0, 0], tv, TH.v, 1, 2.2);
      arrow([X0, 0, 0], ti, TH.i, 1, 2);
      line([tv, [X0, tv[1], ZW]], TH.v, .45, .8, [3, 4]);          // ظل رأس V على الجدار
      glow(tv, 3.2, TH.v); glow([X0, tv[1], ZW], 2.4, TH.v, .9);
      glow(ti, 2.4, TH.i, .9); glow([X0, ti[1], ZW], 2, TH.i, .8);
      glow([X0, YF, zp(X0)], 2.2, TH.p, .9);
    }

    let last = 0;
    function frame(t) {
      t = t || 0;
      g.clearRect(0, 0, W, H);
      for (const [x, y, r, p] of STARS) { g.globalAlpha = .2 + .45 * (.5 + .5 * Math.sin(t / 1100 + p)); g.fillStyle = TH.ink; g.beginPath(); g.arc(x * W, y * H, r * k, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.lineCap = 'round'; g.lineJoin = 'round';
      rotY = .62 + .2 * Math.sin(t / 15000);
      if (!user && !still) thDeg = 50 * Math.sin(t / 6500 + .8);
      if (t - last > 90 || still) { readout(); last = t; }
      // الرسمة تمشي مع العنوان لما تنزل بالصفحة
      const hr = HERO.getBoundingClientRect(); cy = (innerWidth < 760 ? hr.top + innerHeight * .16 : hr.top + hr.height / 2) * k;
      if (hr.bottom > -innerHeight * .5) scene(still ? 2600 : t);
      if (!still) requestAnimationFrame(frame);
    }
    const redraw = () => { if (still) requestAnimationFrame(frame); };
    addEventListener('resize', () => { size(); redraw(); });
    addEventListener('scroll', redraw, { passive: true });
    if (SL) SL.addEventListener('input', redraw);
    readout();
    requestAnimationFrame(frame);
  });
})();
