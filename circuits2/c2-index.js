// c2-index.js — خلفية فهرس تحليل الدوائر 2: رسمة ثلاثية الأبعاد بخطوط رفيعة (ديكور فقط، بدون تفاعل).
// فيها أكثر من رسمة كلها من المادة، والمختارة تحددها M تحت (أو ?m= في الرابط للتجربة).
(function () {
  // الألوان (نفس c2-index.css): خطوط فضية، الجهد نحاسي، التيار فيروزي، القدرة ذهبية
  const TH = { ink: '#eef2f0', line: '208,222,220', v: '236,142,88', i: '72,214,196', p: '242,200,96', neg: '235,96,96' };
  const MOTIFS = {
    phasor:  { ar: 'الفيزور الدوّار يرسم موجته', en: 'ROTATING PHASOR · v(t) = Re{V e^jωt}', leg: [['v', 'الجهد', 'v(t)'], ['i', 'التيار', 'i(t)'], ['p', 'القدرة', 'p(t)']] },
    circuit: { ar: 'دائرة RLC والتيار المتردد يمشي فيها', en: 'SERIES RLC · ALTERNATING CURRENT', leg: [['v', 'المصدر', 'vs(t)'], ['i', 'التيار', 'i(t)'], ['p', 'شحنة المكثف', 'q(t)']] },
    scope:   { ar: 'شاشة الراسم: الموجتان وشكل ليساجو', en: 'OSCILLOSCOPE · LISSAJOUS v–i', leg: [['v', 'الجهد', 'v(t)'], ['i', 'التيار', 'i(t)'], ['p', 'فرق الطور', 'θ']] },
    power:   { ar: 'مثلث القدرة وتصحيح معامل القدرة', en: 'POWER TRIANGLE · S = P + jQ', leg: [['v', 'الظاهرية', 'S'], ['p', 'الفعلية', 'P'], ['i', 'غير الفعلية', 'Q']] },
  };
  const DEF = 'phasor';
  let M = DEF;
  try { const q = new URLSearchParams(location.search).get('m'); if (MOTIFS[q]) M = q; } catch (e) {}

  document.addEventListener('DOMContentLoaded', () => {
    const cv = document.getElementById('sky'), g = cv.getContext('2d'), HERO = document.getElementById('hero');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STARS = Array.from({ length: 170 }, () => [Math.random(), Math.random(), Math.random() * 1.05 + .25, Math.random() * 7]);
    let W, H, k, cx, cy, S, rotY = .5, tiltX = -.3;

    // اسم الرسمة ومفتاح الألوان تحت العنوان
    const mo = MOTIFS[M], ob = document.getElementById('obj'), lg = document.getElementById('legend');
    if (ob) ob.innerHTML = `<b>${mo.ar}</b><span class="en-name">${mo.en}</span>`;
    if (lg) lg.innerHTML = mo.leg.map(([c, a, e]) => `<span><i style="background:var(--${c})"></i>${a} <span class="en-name">${e}</span></span>`).join('');

    function size() {
      k = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * k; H = cv.height = innerHeight * k;
      const narrow = innerWidth < 760;
      cx = narrow ? W * .53 : W * .27; S = Math.min(narrow ? W * .2 : W * .12, H * (narrow ? .11 : .2));
    }
    size();

    /* ===== أدوات الرسم: إسقاط منظوري على الكانفس ===== */
    function P([x, y, z]) {
      const c = Math.cos(rotY), s = Math.sin(rotY); const X = x * c + z * s; let Z = -x * s + z * c;
      const ct = Math.cos(tiltX), st = Math.sin(tiltX); const Y = y * ct - Z * st; Z = y * st + Z * ct;
      const f = 5 / (5 + Z); return [cx + X * S * f, cy - Y * S * f];
    }
    const rgba = (c, a) => `rgba(${c},${a})`;
    function line(pts, c, a, w = 1, dash) {
      g.strokeStyle = rgba(c, a); g.lineWidth = w * k; g.setLineDash(dash ? dash.map(d => d * k) : []);
      g.beginPath(); pts.forEach((p, n) => { const q = P(p); n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
      g.setLineDash([]);
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
    const lerp = (a, b, u) => a.map((v, n) => v + (b[n] - v) * u);
    const range = (n, f) => Array.from({ length: n + 1 }, (_, j) => f(j / n));

    /* ================= 1) الفيزور الدوّار =================
       x = محور الزمن ، y = المحور الحقيقي ، z = المحور التخيلي. الحلقة عند X0 ، الجدار عند z = ZW ، الأرضية عند y = YF */
    function phasor(t) {
      rotY = .62 + .2 * Math.sin(t / 15000); tiltX = -.3;
      const X0 = -1.5, X1 = 1.65, ZW = 1.45, YF = -1.55, VM = 1, IM = .66, N = 150, kap = 1.75 * 2 * Math.PI / (X1 - X0);
      const w = t / 1150, th = (50 * Math.sin(t / 6500 + .8)) * Math.PI / 180;
      const ang = x => w - kap * (x - X0), xs = range(N, u => X0 + (X1 - X0) * u);
      for (let n = 0; n <= 12; n++) { const x = X0 + (X1 - X0) * n / 12; line([[x, -1.15, ZW], [x, 1.15, ZW]], TH.line, n % 4 ? .07 : .14, .7); }
      [-1, -.5, 0, .5, 1].forEach(y => line([[X0, y, ZW], [X1, y, ZW]], TH.line, y ? .08 : .22, y ? .7 : .9));
      line(xs.map(x => [x, VM * Math.cos(ang(x)), ZW]), TH.v, .95, 1.7);
      line(xs.map(x => [x, IM * Math.cos(ang(x) - th), ZW]), TH.i, .9, 1.4);
      const zp = x => 1.7 * VM * Math.cos(ang(x)) * IM * Math.cos(ang(x) - th);
      for (let n = 0; n <= 12; n++) { const x = X0 + (X1 - X0) * n / 12; line([[x, YF, -.75], [x, YF, 1.05]], TH.line, .06, .7); }
      line([[X0, YF, 0], [X1, YF, 0]], TH.line, .25, .9);
      for (let n = 0; n < N; n++) { const a = xs[n], b = xs[n + 1], pa = zp(a), pb = zp(b); poly([[a, YF, 0], [a, YF, pa], [b, YF, pb], [b, YF, 0]], pa + pb >= 0 ? TH.p : TH.neg, pa + pb >= 0 ? .2 : .26); }
      line(xs.map(x => [x, YF, zp(x)]), TH.p, .9, 1.4);
      const zav = 1.7 * .5 * VM * IM * Math.cos(th);
      line([[X0, YF, zav], [X1, YF, zav]], TH.p, .85, 1.1, [5, 5]);
      arrow([X0, 0, 0], [X1 + .25, 0, 0], TH.line, .4, .9);
      const hv = xs.map(x => [x, VM * Math.cos(ang(x)), VM * Math.sin(ang(x))]);
      line(hv, TH.line, .62, 1.1);
      line(xs.map(x => [x, IM * Math.cos(ang(x) - th), IM * Math.sin(ang(x) - th)]), TH.i, .28, .9);
      for (let n = 4; n <= N; n += 6) line([hv[n], [hv[n][0], hv[n][1], ZW]], TH.v, .13, .7);
      const ring = r => range(120, u => [X0, r * Math.cos(u * 7), r * Math.sin(u * 7)]);
      line(ring(1), TH.line, .55, 1.1); line(ring(IM), TH.line, .16, .7);
      for (let n = 0; n < 72; n++) { const a = n / 72 * Math.PI * 2, m = n % 6 ? .955 : .9; line([[X0, Math.cos(a), Math.sin(a)], [X0, m * Math.cos(a), m * Math.sin(a)]], TH.line, .5, .8); }
      line([[X0, -1.25, 0], [X0, 1.25, 0]], TH.line, .4, .8); line([[X0, 0, -1.25], [X0, 0, 1.25]], TH.line, .4, .8);
      line(range(20, u => [X0, .3 * Math.cos(w - th * u), .3 * Math.sin(w - th * u)]), TH.p, .9, 1.2);
      const tv = [X0, VM * Math.cos(w), VM * Math.sin(w)], ti = [X0, IM * Math.cos(w - th), IM * Math.sin(w - th)];
      arrow([X0, 0, 0], tv, TH.v, 1, 2.2); arrow([X0, 0, 0], ti, TH.i, 1, 2);
      line([tv, [X0, tv[1], ZW]], TH.v, .45, .8, [3, 4]);
      glow(tv, 3.2, TH.v); glow([X0, tv[1], ZW], 2.4, TH.v, .9); glow(ti, 2.4, TH.i, .9); glow([X0, ti[1], ZW], 2, TH.i, .8);
      glow([X0, YF, zp(X0)], 2.2, TH.p, .9);
    }

    /* ================= 2) دائرة RLC على لوحة =================
       اللوحة في المستوى x-z ، والعناصر على أضلاع الحلقة: المصدر يسار، المقاومة خلف، الملف يمين، المكثف قدّام */
    function circuit(t) {
      rotY = t / 26000 + .5; tiltX = -.5;
      const A = 1.5, B = .95, w = t / 900, cur = Math.sin(w), q = -Math.cos(w);
      // اللوحة: شبكة خفيفة وحافة بإطار
      for (let n = -7; n <= 7; n++) { line([[n * .25, -.02, -1.35], [n * .25, -.02, 1.35]], TH.line, n % 4 ? .05 : .1, .6); }
      for (let n = -5; n <= 5; n++) { line([[-1.85, -.02, n * .25], [1.85, -.02, n * .25]], TH.line, n % 4 ? .05 : .1, .6); }
      line([[-1.9, -.02, -1.4], [1.9, -.02, -1.4], [1.9, -.02, 1.4], [-1.9, -.02, 1.4], [-1.9, -.02, -1.4]], TH.line, .35, 1);
      // مسار الحلقة كنقاط بالترتيب (عكس عقارب الساعة من الزاوية القريبة اليسار)
      const C = [[-A, 0, B], [-A, 0, -B], [A, 0, -B], [A, 0, B]];
      const edges = [[C[0], C[1]], [C[1], C[2]], [C[2], C[3]], [C[3], C[0]]];
      const lens = edges.map(([a, b]) => Math.hypot(b[0] - a[0], b[2] - a[2])), L = lens.reduce((a, b) => a + b);
      const at = s => { s = ((s % L) + L) % L; for (let e = 0; e < 4; e++) { if (s <= lens[e]) return lerp(edges[e][0], edges[e][1], s / lens[e]); s -= lens[e]; } return C[0]; };
      // الأسلاك (مع فراغ مكان كل عنصر)
      const gap = .42;
      line([C[0], [-A, 0, gap]], TH.line, .7, 1.3); line([[-A, 0, -gap], C[1]], TH.line, .7, 1.3);
      line([C[1], [-.62, 0, -B]], TH.line, .7, 1.3); line([[.62, 0, -B], C[2]], TH.line, .7, 1.3);
      line([C[2], [A, 0, -.55]], TH.line, .7, 1.3); line([[A, 0, .55], C[3]], TH.line, .7, 1.3);
      line([C[3], [.09, 0, B]], TH.line, .7, 1.3); line([[-.09, 0, B], C[0]], TH.line, .7, 1.3);
      // المصدر المتردد: دائرة واقفة وفيها موجة جيبية تمشي
      line(range(80, u => [-A, .42 * Math.sin(u * 7), .42 * Math.cos(u * 7)]), TH.v, .95, 1.6);
      line(range(60, u => [-A, .2 * Math.sin(u * 2 * Math.PI * 1.5 + w), -.28 + .56 * u]), TH.v, .9, 1.3);
      line([[-A, 0, gap], [-A, 0, .42]], TH.line, .7, 1.3); line([[-A, 0, -.42], [-A, 0, -gap]], TH.line, .7, 1.3);
      // المقاومة: خط متعرّج واقف
      const zz = range(12, u => [-.62 + 1.24 * u, (u === 0 || u === 1) ? 0 : (Math.round(u * 12) % 2 ? .22 : -.22), -B]);
      line(zz, TH.line, .95, 1.5);
      // الملف: لفات حول السلك (حلزون)
      line(range(220, u => [A + .2 * Math.cos(u * 2 * Math.PI * 7), .2 * Math.sin(u * 2 * Math.PI * 7), -.55 + 1.1 * u]), TH.line, .85, 1.2);
      // المكثف: لوحان متقابلان، وخطوط المجال بينهم تقوى مع الشحنة q
      [-.09, .09].forEach((x, j) => line([[x, -.34, B - .34], [x, .34, B - .34], [x, .34, B + .34], [x, -.34, B + .34], [x, -.34, B - .34]], j ? TH.i : TH.v, .9, 1.4));
      for (let n = 0; n < 5; n++) for (let m = 0; m < 3; m++) { const y = -.24 + n * .12, z = B - .2 + m * .2; line([[-.09, y, z], [.09, y, z]], TH.p, .15 + .6 * Math.abs(q), .9); }
      [-.09, .09].forEach((x, j) => poly([[x, -.34, B - .34], [x, .34, B - .34], [x, .34, B + .34], [x, -.34, B + .34]], (j ? q < 0 : q > 0) ? TH.p : TH.line, .08 + .14 * Math.abs(q)));
      // التيار: نقاط مضيئة تروح وتجي مع الموجة
      const shift = 1.3 * Math.sin(w - Math.PI / 2);
      for (let n = 0; n < 16; n++) { const p = at(n * L / 16 + shift); glow(p, 1.8, TH.i, .55 + .45 * Math.abs(cur)); }
      // سهم اتجاه التيار الآن فوق السلك الخلفي
      const dir = cur >= 0 ? 1 : -1;
      arrow([-.3 * dir, .55, -B], [.3 * dir, .55, -B], TH.i, .3 + .6 * Math.abs(cur), 1.4);
      // العقد في الزوايا
      C.forEach(c => glow(c, 1.6, TH.line, .7));
    }

    /* ================= 3) شاشة الراسم (أوسيلوسكوب) =================
       شاشتان مثل كتاب مفتوح: يسار الموجتان مع الزمن، يمين شكل ليساجو (v على الأفقي و i على الرأسي) */
    function scope(t) {
      rotY = .1 * Math.sin(t / 17000); tiltX = -.12;
      const w = t / 800, th = Math.PI / 2 * (1 - Math.cos(t / 5200));       // فرق الطور يمشي من 0 إلى 180 ويرجع
      const panel = (c, ux, vy) => (u, v) => [c[0] + ux[0] * u, c[1] + v * vy, c[2] + ux[2] * u];
      const pa = Math.PI * .16;
      const A = panel([-1.25, 0, .15], [1.1 * Math.cos(pa), 0, -1.1 * Math.sin(pa)], .85);
      const B = panel([1.12, 0, .1], [.85 * Math.cos(pa), 0, .85 * Math.sin(pa)], .85);
      function frameOf(F, glowA) {
        const rect = s => [[-s, -s], [s, -s], [s, s], [-s, s], [-s, -s]].map(([u, v]) => F(u, v));
        poly(rect(1).slice(0, 4), '20,40,34', .45);
        line(rect(1.0), TH.line, .5, 1.1); line(rect(1.09), TH.line, .25, .8);
        for (let n = -4; n <= 4; n++) line([F(n / 4.4, -1), F(n / 4.4, 1)], TH.i, n ? .07 : .2, .7);
        for (let n = -3; n <= 3; n++) line([F(-1, n / 3.4), F(1, n / 3.4)], TH.i, n ? .07 : .2, .7);
        for (let n = -20; n <= 20; n++) { const u = n / 22; line([F(u, -.03), F(u, .03)], TH.i, .25, .7); }
      }
      // شاشة الزمن
      frameOf(A);
      const tv = u => .72 * Math.cos(2.5 * Math.PI * u - w), ti = u => .45 * Math.cos(2.5 * Math.PI * u - w - th);
      [[tv, TH.v], [ti, TH.i]].forEach(([f, c]) => { const pts = range(160, u => A(-1 + 2 * u, f(-1 + 2 * u))); line(pts, c, .18, 5); line(pts, c, .95, 1.5); });
      // أزرار تحت الشاشة
      for (let n = 0; n < 4; n++) { const c = A(-.6 + n * .4, -1.32); line(range(30, u => [c[0] + .1 * Math.cos(u * 7), c[1] + .1 * Math.sin(u * 7), c[2]]), TH.line, .45, 1); line([c, [c[0] + .1 * Math.cos(t / 3000 + n), c[1] + .1 * Math.sin(t / 3000 + n), c[2]]], TH.v, .7, 1); }
      // شاشة ليساجو: شكل يتغير من خط مائل إلى بيضاوي إلى دائرة حسب فرق الطور
      frameOf(B);
      const lis = range(160, u => B(.75 * Math.cos(u * 2 * Math.PI), .75 * Math.cos(u * 2 * Math.PI - th)));
      line(lis, TH.p, .2, 5); line(lis, TH.p, .95, 1.5);
      glow(B(.75 * Math.cos(w), .75 * Math.cos(w - th)), 2.6, TH.p);
      // خيوط تربط آخر نقطة على شاشة الزمن بنقطتها على ليساجو
      glow(A(-1, tv(-1)), 2.2, TH.v, .9); glow(A(-1, ti(-1)), 2, TH.i, .9);
      line([A(1, tv(1)), B(-1.09, tv(1) * .75 / .72)], TH.v, .2, .8, [3, 5]);
    }

    /* ================= 4) مثلث القدرة =================
       P على x ، Q على y ، والزمن للخلف على z: مثلثات قديمة تبهت فتصير مروحة ثلاثية الأبعاد.
       Q تنقص مع تصحيح معامل القدرة (مكثف يضيف −jQc) ثم ترجع */
    function power(t) {
      rotY = .32 + .15 * Math.sin(t / 14000); tiltX = .05;
      const O = [-1.35, -1.1, 0], Pm = 2.1, Qmax = 1.55;
      const Qat = tt => .22 + (Qmax - .22) * (.5 + .5 * Math.cos(tt / 2600));
      const tri = (Q, z, a, wd) => { const o = [O[0], O[1], z], p = [O[0] + Pm, O[1], z], s = [O[0] + Pm, O[1] + Q, z]; line([o, p], TH.p, a, wd); line([p, s], TH.i, a, wd); line([o, s], TH.v, a, wd); return [o, p, s]; };
      // المستوى المركب للقدرة: شبكة + ربع دائرة |S| مدرّجة
      for (let n = 0; n <= 10; n++) line([[O[0] + n * .25, O[1], 0], [O[0] + n * .25, O[1] + 2, 0]], TH.line, n % 4 ? .05 : .1, .6);
      for (let n = 0; n <= 8; n++) line([[O[0], O[1] + n * .25, 0], [O[0] + 2.5, O[1] + n * .25, 0]], TH.line, n % 4 ? .05 : .1, .6);
      arrow(O, [O[0] + 2.85, O[1], 0], TH.line, .45, .9); arrow(O, [O[0], O[1] + 2.35, 0], TH.line, .45, .9);
      const R = Math.hypot(Pm, Qmax);
      line(range(60, u => [O[0] + R * Math.cos(u * Math.PI / 2), O[1] + R * Math.sin(u * Math.PI / 2), 0]), TH.line, .3, .9, [2, 4]);
      for (let n = 0; n <= 18; n++) { const a = n / 18 * Math.PI / 2, m = n % 3 ? .97 : .93; line([[O[0] + R * Math.cos(a), O[1] + R * Math.sin(a), 0], [O[0] + m * R * Math.cos(a), O[1] + m * R * Math.sin(a), 0]], TH.line, .4, .8); }
      // مروحة المثلثات القديمة للخلف
      for (let j = 18; j >= 1; j--) { const Q = Qat(t - j * 140), a = .32 * (1 - j / 19); const [o, p, s] = tri(Q, j * .13, a, .8); poly([o, p, s], TH.v, a * .12); }
      line(range(18, u => { const j = u * 18; return [O[0] + Pm, O[1] + Qat(t - j * 140), j * .13]; }), TH.i, .35, .9);
      // المثلث الحالي
      const Q = Qat(t), [o, p, s] = tri(Q, 0, 0, 0), th = Math.atan2(Q, Pm);
      poly([o, p, s], TH.v, .1);
      arrow(o, p, TH.p, 1, 2); arrow(p, s, TH.i, 1, 2); arrow(o, s, TH.v, 1, 2.2);
      line(range(24, u => [O[0] + .55 * Math.cos(th * u), O[1] + .55 * Math.sin(th * u), 0]), TH.p, .9, 1.2);
      // سهم المكثف −jQc: يورّي كم نقصت Q عن أكبر قيمة
      if (Qmax - Q > .08) { const x = O[0] + Pm + .32; arrow([x, O[1] + Qmax, 0], [x, O[1] + Q, 0], TH.neg, .75, 1.3); line([[O[0] + Pm, O[1] + Qmax, 0], [x + .08, O[1] + Qmax, 0]], TH.neg, .35, .8, [3, 3]); }
      line([o, [O[0] + Pm, O[1] + Qmax, 0]], TH.v, .22, .9, [4, 5]);
      glow(s, 3, TH.v); glow(p, 2, TH.p, .9);
    }

    const DRAW = { phasor, circuit, scope, power };
    function frame(t) {
      t = t || 0;
      g.clearRect(0, 0, W, H);
      for (const [x, y, r, p] of STARS) { g.globalAlpha = .2 + .45 * (.5 + .5 * Math.sin(t / 1100 + p)); g.fillStyle = TH.ink; g.beginPath(); g.arc(x * W, y * H, r * k, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.lineCap = 'round'; g.lineJoin = 'round';
      // الرسمة تمشي مع العنوان لما تنزل بالصفحة
      const hr = HERO.getBoundingClientRect(); cy = (innerWidth < 760 ? hr.top + innerHeight * .18 : hr.top + hr.height / 2) * k;
      if (hr.bottom > -innerHeight * .5) DRAW[M](still ? 2600 : t);
      if (!still) requestAnimationFrame(frame);
    }
    const redraw = () => { if (still) requestAnimationFrame(frame); };
    addEventListener('resize', () => { size(); redraw(); });
    addEventListener('scroll', redraw, { passive: true });
    requestAnimationFrame(frame);
  });
})();
