// vec-index.js — خلفية فهرس المتجهات: رسمة ثلاثية الأبعاد بخطوط رفيعة فوق سماء فيها نجوم.
document.addEventListener('DOMContentLoaded', function () {
/* ================= الثيمات ================= */
const DX = { X: '111,168,255', Y: '58,214,154', Z: '255,143,85' }, LX = { X: '37,99,235', Y: '11,143,99', Z: '219,84,12' };
const THEMES = {
  midnight: { name: 'منتصف الليل', dark: 1, css: { bg: '#0a0f1c', 'bg-2': '#18244a', ink: '#eef2fb', dim: '#9aa6bf', acc: '#8dbbff', card: 'rgba(17,25,46,.8)', edge: 'rgba(170,190,230,.18)', soft: 'rgba(127,178,255,.16)' },
    line: '205,218,245', main: '127,178,255', glow: '110,165,255', core: '220,235,255', star: '230,238,255', ...DX },
  xyz: { name: 'جرافيت XYZ', dark: 1, css: { bg: '#0d0e10', 'bg-2': '#202327', ink: '#f0f0ee', dim: '#a3a5a8', acc: '#3ad69a', card: 'rgba(24,26,29,.82)', edge: 'rgba(220,220,220,.14)', soft: 'rgba(58,214,154,.14)' },
    line: '222,224,226', main: '58,214,154', glow: '58,214,154', core: '205,255,232', star: '240,240,240', ...DX, multi: 1 },
  emerald: { name: 'زمرّد وذهب', dark: 1, css: { bg: '#05110d', 'bg-2': '#103026', ink: '#f3efe2', dim: '#a9b8ac', acc: '#e9c46a', card: 'rgba(11,32,25,.82)', edge: 'rgba(233,196,106,.2)', soft: 'rgba(233,196,106,.15)' },
    line: '214,232,220', main: '233,196,106', glow: '240,186,80', core: '255,238,196', star: '250,240,210', ...DX },
  ivory: { name: 'عاجي فاتح', dark: 0, css: { bg: '#f8f5ee', 'bg-2': '#ffffff', ink: '#18203a', dim: '#5b6378', acc: '#2350c8', card: 'rgba(255,255,255,.84)', edge: 'rgba(24,32,58,.12)', soft: 'rgba(37,99,235,.1)' },
    line: '28,38,72', main: '37,90,220', glow: '60,120,255', core: '30,80,210', star: '28,38,72', ...LX },
  gold: { name: 'ذهبي الموقع', dark: 0, css: { bg: '#fffbea', 'bg-2': '#fffef8', ink: '#1f1c14', dim: '#6f6858', acc: '#9a6a00', card: 'rgba(255,255,255,.86)', edge: 'rgba(154,106,0,.2)', soft: '#fff3c4' },
    line: '58,48,24', main: '176,120,0', glow: '247,190,40', core: '150,100,0', star: '120,95,30', ...LX },
};
/* ================= الأشكال ================= */
const MOTIFS = {
  helix:  { name: 'المنحنى وإطار TNB', ar: 'منحنى حلزوني وإطاره المتحرك', en: 'HELIX · FRENET FRAME T N B' },
  grad:   { name: 'الانحدار وخطوط المستوى', ar: 'سطح وخطوط المستوى والانحدار', en: 'SURFACE · LEVEL CURVES · ∇f' },
  curl:   { name: 'الالتفاف (عجلة المجداف)', ar: 'مجال دوّار وعجلة تقيس الالتفاف', en: 'ROTATIONAL FIELD · ∇×F' },
  flux:   { name: 'التباعد والتدفق', ar: 'مصدر وتدفق عبر سطح مغلق', en: 'SOURCE · FLUX · ∯ F·n dS' },
  riemann:{ name: 'التكامل الثنائي', ar: 'أعمدة ريمان تحت سطح', en: 'RIEMANN SUM · ∬ f dA' },
};

const cv = document.getElementById('sky'), g = cv.getContext('2d'), HERO = document.getElementById('hero');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
let TH, M, W, H, k, cx, cy, S, rotY = 0, tilt = -.3, CUR;
const STARS = Array.from({ length: 190 }, () => [Math.random(), Math.random(), Math.random() * 1.1 + .25, Math.random() * 7]);

function size() {
  k = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * k; H = cv.height = innerHeight * k;
  const narrow = innerWidth < 760;
  cx = narrow ? W / 2 : W * .22; S = Math.min(narrow ? W * .34 : W * .23, H * (narrow ? .17 : .4));
}
const add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, s) => a.map(v => v * s), sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => mul(a, 1 / Math.hypot(...a));
function P([x, y, z]) {
  const c = Math.cos(rotY), s = Math.sin(rotY); const X = x * c + z * s; let Z = -x * s + z * c;
  const ct = Math.cos(tilt), st = Math.sin(tilt); const Y = y * ct - Z * st; Z = y * st + Z * ct;
  const f = 4.4 / (4.4 + Z); return [cx + X * S * f, cy - Y * S * f, Z];
}
const LA = () => TH.dark ? 1 : 1.15;               // الخطوط أغمق شوي بالفاتح
function line(pts, a, w = 1, col = CUR) {
  g.strokeStyle = `rgba(${col},${Math.min(1, a * LA())})`; g.lineWidth = w * k; g.beginPath();
  pts.forEach((p, i) => { const q = P(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
}
// خط يخف كل ما بعد عن الكاميرا (يعطي عمق)
function lineD(pts, a, w = 1, col = CUR, step = 6) {
  for (let i = 0; i < pts.length - 1; i += step) {
    const seg = pts.slice(i, i + step + 1), z = P(seg[Math.floor(seg.length / 2)])[2];
    line(seg, a * (.35 + .65 * Math.max(0, Math.min(1, (1.4 - z) / 2.8))), w, col);
  }
}
function glow(p, r, a = 1, col = TH.glow, core = TH.core) {
  const q = P(p), R = r * 6 * k, gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], R), ga = TH.dark ? .6 : .32;
  gr.addColorStop(0, `rgba(${col},${ga * a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], R, 0, 7); g.fill();
  g.fillStyle = `rgba(${core},${a})`; g.beginPath(); g.arc(q[0], q[1], r * k, 0, 7); g.fill();
}
function arrowAt(p0, p1, a, s = 6, col = CUR, w = 1.1) {
  const p = P(p0), q = P(p1), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), L = s * k;
  g.strokeStyle = `rgba(${col},${Math.min(1, a * LA())})`; g.lineWidth = k * w; g.beginPath();
  g.moveTo(q[0] - L * Math.cos(ang - .45), q[1] - L * Math.sin(ang - .45)); g.lineTo(q[0], q[1]); g.lineTo(q[0] - L * Math.cos(ang + .45), q[1] - L * Math.sin(ang + .45)); g.stroke();
}
function vec(a, b, al, col, w = 1.7, s = 9) { line([a, b], al, w, col); arrowAt(add(a, mul(sub(b, a), .9)), b, al, s, col, w * .8); }
function label(p, txt, a = .9, col = CUR, px = 11) { const q = P(p); g.fillStyle = `rgba(${col},${a})`; g.font = `${px * k}px 'JetBrains Mono', ui-monospace, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText(txt, q[0], q[1]); }
function circ(c, R, u, w, n = 120) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n * TAU; pts.push(add(c, add(mul(u, R * Math.cos(t)), mul(w, R * Math.sin(t))))); } return pts; }
function ticks(c, R, u, w, n, a, col = CUR) { for (let i = 0; i < n; i++) { const t = i / n * TAU, d = add(mul(u, Math.cos(t)), mul(w, Math.sin(t))); line([add(c, mul(d, R)), add(c, mul(d, R * (i % 5 ? .955 : .91)))], a, .8, col); } }
const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

/* ---------- 1) منحنى حلزوني وإطار فرينيه ---------- */
function helix(t) {
  rotY = .55 + t / 18000; tilt = -.26;
  const R = .66, c = .052, s0 = -15, s1 = 15, r = s => [R * Math.cos(s), c * s, R * Math.sin(s)];
  CUR = TH.line;
  for (const y of [s0 * c, s1 * c]) { const ring = circ([0, y, 0], R, [1, 0, 0], [0, 0, 1]); line(ring, .2, .9); ticks([0, y, 0], R, [1, 0, 0], [0, 0, 1], 60, .18); }
  line([[0, s0 * c - .25, 0], [0, s1 * c + .25, 0]], .14, .8);
  for (let m = 0; m < 8; m++) { const ph = m / 8 * TAU; line([[R * Math.cos(ph), s0 * c, R * Math.sin(ph)], [R * Math.cos(ph), s1 * c, R * Math.sin(ph)]], .06, .7); }
  const pts = []; for (let i = 0; i <= 480; i++) pts.push(r(s0 + i / 480 * (s1 - s0))); lineD(pts, .55, 1.1);
  const u = (t / 32000 + .38) % 1, s = s0 + u * (s1 - s0), fade = smooth(u / .06) * smooth((1 - u) / .06), p = r(s);
  const trail = []; for (let i = 0; i <= 40; i++) trail.push(r(s - 4 + i / 10));
  for (let i = 0; i < 4; i++) line(trail.slice(i * 10, i * 10 + 11), (.2 + i * .22) * fade, 2.1, TH.main);
  const T = norm([-R * Math.sin(s), c, R * Math.cos(s)]), N = [-Math.cos(s), 0, -Math.sin(s)], B = cross(T, N);
  const rho = (R * R + c * c) / R, oc = add(p, mul(N, rho));
  line(circ(oc, rho, T, N, 140), .3 * fade, 1, TH.main); ticks(oc, rho, T, N, 60, .22 * fade, TH.main);
  const L = .48;
  vec(p, add(p, mul(T, L)), .95 * fade, TH.X); vec(p, add(p, mul(N, L)), .95 * fade, TH.Y); vec(p, add(p, mul(B, L)), .95 * fade, TH.Z);
  label(add(p, mul(T, L + .1)), 'T', .9 * fade, TH.X); label(add(p, mul(N, L + .1)), 'N', .9 * fade, TH.Y); label(add(p, mul(B, L + .1)), 'B', .9 * fade, TH.Z);
  glow(p, 2.6, fade);
  label([0, s1 * c + .38, 0], 'r(t) = ⟨cos t, sin t, ct⟩', .45, TH.line, 10);
}

/* ---------- 2) سطح وخطوط المستوى والانحدار ---------- */
const F = (x, z) => 1.0 * Math.exp(-((x - .38) ** 2 + (z + .22) ** 2) / .3) + .62 * Math.exp(-((x + .55) ** 2 + (z - .48) ** 2) / .2) - .3 * Math.exp(-((x + .35) ** 2 + (z + .7) ** 2) / .16);
const gF = (x, z) => { const e = 1e-3; return [(F(x + e, z) - F(x - e, z)) / (2 * e), (F(x, z + e) - F(x, z - e)) / (2 * e)]; };
const Y0 = -.42, HS = .95, FL = -1.05, D = 1.2;
const surf = (x, z) => [x, Y0 + HS * F(x, z), z];
// خطوط المستوى (marching squares) — تنحسب مرة وحدة
const LEVELS = [.12, .26, .4, .54, .68, .82], CONT = [];
(function () {
  const n = 56, h = 2 * D / n, val = (i, j) => F(-D + i * h, -D + j * h);
  for (const lv of LEVELS) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = [val(i, j), val(i + 1, j), val(i + 1, j + 1), val(i, j + 1)], P4 = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], hit = [];
    for (let e = 0; e < 4; e++) { const a = v[e], b = v[(e + 1) % 4]; if ((a - lv) * (b - lv) < 0) { const f = (lv - a) / (b - a), A = P4[e], B = P4[(e + 1) % 4]; hit.push([-D + (A[0] + f * (B[0] - A[0])) * h, -D + (A[1] + f * (B[1] - A[1])) * h]); } }
    if (hit.length >= 2) CONT.push([lv, hit[0], hit[1]]); if (hit.length === 4) CONT.push([lv, hit[2], hit[3]]);
  }
})();
const CLIMB = [[-.9, .9], [.95, -.95], [1.0, .5], [-.2, -1.0], [-1.05, .1], [.3, 1.0], [.2, -.4]].map(([x, z]) => {
  const path = [[x, z]]; for (let i = 0; i < 260; i++) { const [gx, gz] = gF(x, z), m = Math.hypot(gx, gz); if (m < .02) break; x += gx / m * .011; z += gz / m * .011; path.push([x, z]); } return path;
});
function grad(t) {
  rotY = .7 + t / 20000; tilt = -.42;
  CUR = TH.line;
  const fr = [[-D, FL, -D], [D, FL, -D], [D, FL, D], [-D, FL, D], [-D, FL, -D]]; line(fr, .3, 1);
  for (let i = -5; i <= 5; i++) { const v = i / 5 * D; line([[v, FL, -D], [v, FL, -D + .06]], .3, .8); line([[-D, FL, v], [-D + .06, FL, v]], .3, .8); }
  for (const [lv, a, b] of CONT) line([[a[0], FL, a[1]], [b[0], FL, b[1]]], .16 + lv * .2, .9);
  const n = 22;
  for (let i = 0; i <= n; i++) { const v = -D + i / n * 2 * D, A = [], B = []; for (let j = 0; j <= 48; j++) { const w = -D + j / 48 * 2 * D; A.push(surf(v, w)); B.push(surf(w, v)); } lineD(A, .26, .8, TH.line, 4); lineD(B, .26, .8, TH.line, 4); }
  for (const [lv, a, b] of CONT) line([surf(a[0], a[1]), surf(b[0], b[1])], .3 + lv * .5, 1.1, TH.main);
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const x = i / 4 * (D - .15), z = j / 4 * (D - .15), [gx, gz] = gF(x, z), m = Math.hypot(gx, gz); if (m < .05) continue; const L = Math.min(.17, .06 + m * .07), e = [x + gx / m * L, FL, z + gz / m * L]; line([[x, FL, z], e], .4, 1, TH.main); arrowAt([x, FL, z], e, .4, 4, TH.main, .9); }
  CLIMB.forEach((path, idx) => {
    const per = 9000, u = ((t + idx * per / CLIMB.length * 1.7) % per) / per, i = Math.floor(u * (path.length - 1)), f = smooth(u / .08) * smooth((1 - u) / .12);
    const tr = path.slice(Math.max(0, i - 30), i + 1).map(([x, z]) => surf(x, z)); if (tr.length > 1) line(tr, .75 * f, 1.8, TH.main);
    const [x, z] = path[i]; line([surf(x, z), [x, FL, z]], .12 * f, .7); glow(surf(x, z), 2.1, f);
  });
  const top = surf(.38, -.22); label(add(top, [0, .28, 0]), '∇f', .7, TH.main, 12);
}

/* ---------- 3) مجال دوّار وعجلة المجداف ---------- */
function curl(t) {
  rotY = .4 + t / 22000; tilt = -.38;
  CUR = TH.line;
  const planes = [-.75, 0, .75], radii = [.45, .8, 1.15];
  line([[0, -1.25, 0], [0, 1.3, 0]], .18, .8);
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const y of [-.75, .75]) {
    const x = i * .55, z = j * .55, r = Math.hypot(x, z); if (r < .2 || r > 1.3) continue;
    const d = [-z * .16, 0, x * .16], e = add([x, y, z], d); line([[x, y, z], e], .16, .8); arrowAt([x, y, z], e, .16, 3.5);
  }
  for (const y of planes) for (const R of radii) {
    const a = y === 0 ? .26 : .13; line(circ([0, y, 0], R, [1, 0, 0], [0, 0, 1], 140), a, .9);
    const nC = Math.round(R * 6), w = t / 2600;               // سرعة متناسبة مع r (دوران جاسئ: الالتفاف ثابت)
    for (let m = 0; m < nC; m++) {
      const th0 = w + m / nC * TAU + y, seg = []; for (let q = 0; q <= 16; q++) { const th = th0 - q * .028 / R * 2.4; seg.push([R * Math.cos(th), y, R * Math.sin(th)]); }
      const c = y === 0 ? TH.main : TH.line, al = y === 0 ? .85 : .4;
      line(seg.slice(0, 9), al, 1.6, c); line(seg.slice(8), al * .35, 1.2, c);
      arrowAt(seg[1], seg[0], al, 5, c, 1.1);
    }
  }
  // عجلة المجداف في المركز
  const sp = t / 2600, vane = .3, hh = .18;
  for (let v = 0; v < 4; v++) {
    const a = sp + v * TAU / 4, d = [Math.cos(a), 0, Math.sin(a)];
    line([[0, -hh, 0], add(mul(d, vane), [0, -hh, 0]), add(mul(d, vane), [0, hh, 0]), [0, hh, 0]], .8, 1.2, TH.multi ? TH.Y : TH.main);
  }
  line(circ([0, -hh, 0], vane, [1, 0, 0], [0, 0, 1], 60), .2, .8, TH.main); line(circ([0, hh, 0], vane, [1, 0, 0], [0, 0, 1], 60), .2, .8, TH.main);
  vec([0, hh, 0], [0, 1.05, 0], .95, TH.Z, 1.9, 10); label([0, 1.22, 0], '∇×F', .9, TH.Z, 12);
  glow([0, 0, 0], 2.2, .9);
}

/* ---------- 4) مصدر وتدفق عبر سطح مغلق ---------- */
const DIRS = (() => { const n = 34, out = [], ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), th = i * ga; out.push([r * Math.cos(th), y, r * Math.sin(th)]); } return out; })();
function flux(t) {
  rotY = .3 + t / 24000; tilt = -.3;
  CUR = TH.line; const Rs = .78, Rmax = 1.55;
  for (let i = 1; i < 8; i++) { const y = Rs * Math.cos(i / 8 * Math.PI), rr = Rs * Math.sin(i / 8 * Math.PI); lineD(circ([0, y, 0], rr, [1, 0, 0], [0, 0, 1], 60), .2, .7, TH.line, 5); }
  for (let m = 0; m < 8; m++) { const ph = m / 8 * Math.PI; lineD(circ([0, 0, 0], Rs, [Math.cos(ph), 0, Math.sin(ph)], [0, 1, 0], 60), .2, .7, TH.line, 5); }
  line(circ([0, 0, 0], Rs, [1, 0, 0], [0, 0, 1], 120), .4, 1.1, TH.main); ticks([0, 0, 0], Rs, [1, 0, 0], [0, 0, 1], 72, .35, TH.main);
  DIRS.forEach((d, i) => {
    line([mul(d, .12), mul(d, Rmax)], .14, .8); arrowAt(mul(d, Rmax - .1), mul(d, Rmax), .3, 4);
    for (let j = 0; j < 2; j++) {
      const u = ((t / 4200 + i * .137 + j * .5) % 1), r = .12 + u * (Rmax - .12), f = smooth(u / .1) * smooth((1 - u) / .2);
      const near = Math.exp(-(((r - Rs) / .1) ** 2));
      line([mul(d, Math.max(.12, r - .16)), mul(d, r)], (.35 + .6 * near) * f, 1.4 + near, TH.main);
      if (near > .5) glow(mul(d, r), 1.2, near * f * .8);
    }
  });
  // رقعة صغيرة على السطح مع العمودي n
  const a = t / 7000, d = norm([Math.cos(a), .35, Math.sin(a)]), u = norm(cross(d, [0, 1, 0])), v = cross(d, u), c0 = mul(d, Rs), h = .17;
  const patch = [add(c0, add(mul(u, h), mul(v, h))), add(c0, add(mul(u, -h), mul(v, h))), add(c0, add(mul(u, -h), mul(v, -h))), add(c0, add(mul(u, h), mul(v, -h)))];
  line([...patch, patch[0]], .9, 1.3, TH.multi ? TH.Y : TH.main);
  vec(c0, add(c0, mul(d, .55)), .95, TH.Z, 1.8); label(add(c0, mul(d, .68)), 'n', .9, TH.Z, 12);
  glow([0, 0, 0], 3, 1); label([0, -Rmax - .15, 0], '∯ F·n dS = ∭ ∇·F dV', .5, TH.line, 10);
}

/* ---------- 5) أعمدة ريمان تحت سطح ---------- */
const FR = (x, z) => .62 + .3 * Math.sin(1.7 * x + .4) * Math.cos(1.4 * z) + .12 * x;
function riemann(t) {
  rotY = .62 + .18 * Math.sin(t / 9000); tilt = -.4;
  CUR = TH.line; const A = .95, B0 = -.62, hs = 1.0, n = 8, w = 2 * A / n;
  line([[-A, B0, -A], [A, B0, -A], [A, B0, A], [-A, B0, A], [-A, B0, -A]], .35, 1);
  for (let i = 0; i <= n; i++) { const v = -A + i * w; line([[v, B0, -A], [v, B0, A]], .1, .7); line([[-A, B0, v], [A, B0, v]], .1, .7); }
  const cyc = 13000, ph = ((t + 5200) % cyc) / cyc;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = -A + i * w, z0 = -A + j * w, hgt = FR(x0 + w / 2, z0 + w / 2) * hs;
    const del = (i + j) / (2 * n - 2) * .35, grow = smooth((ph - del) / .2) * (1 - smooth((ph - .82) / .14)); if (grow <= 0) continue;
    const y = B0 + hgt * grow, g2 = .9 * grow, c = TH.multi ? [TH.X, TH.Y, TH.Z][(i + j) % 3] : TH.main;
    line([[x0, y, z0], [x0 + w, y, z0], [x0 + w, y, z0 + w], [x0, y, z0 + w], [x0, y, z0]], .6 * g2, 1, c);
    for (const [a, b] of [[x0, z0], [x0 + w, z0], [x0 + w, z0 + w], [x0, z0 + w]]) line([[a, B0, b], [a, y, b]], .08 * g2, .7);
  }
  for (let i = 0; i <= 20; i++) { const v = -A + i / 20 * 2 * A, P1 = [], P2 = []; for (let j = 0; j <= 40; j++) { const q = -A + j / 40 * 2 * A; P1.push([v, B0 + FR(v, q) * hs, q]); P2.push([q, B0 + FR(q, v) * hs, v]); } lineD(P1, .28, .8, TH.line, 5); lineD(P2, .28, .8, TH.line, 5); }
  const sx = -A + ((t / 6000) % 1) * 2 * A, sl = []; for (let j = 0; j <= 40; j++) { const q = -A + j / 40 * 2 * A; sl.push([sx, B0 + FR(sx, q) * hs, q]); }
  line(sl, .85, 1.8, TH.main); line([[sx, B0, -A], [sx, B0, A]], .5, 1.2, TH.main); glow(sl[20], 1.8, .9);
  label([0, B0 + 1.15, 0], '∬ f(x,y) dA', .6, TH.line, 12);
}

const DRAW = { helix, grad, curl, flux, riemann };
function frame(t) {
  t = t || 0; g.clearRect(0, 0, W, H);
  const sa = TH.dark ? 1 : .28;
  for (const [x, y, r, p] of STARS) { g.globalAlpha = sa * (.22 + .5 * (.5 + .5 * Math.sin(t / 1100 + p))); g.fillStyle = `rgb(${TH.star})`; g.beginPath(); g.arc(x * W, y * H, r * k, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.lineCap = 'round'; g.lineJoin = 'round';
  const hr = HERO.getBoundingClientRect(); cy = (innerWidth < 760 ? hr.top + innerHeight * .2 : hr.top + hr.height / 2) * k;
  if (hr.bottom > -innerHeight * .5) DRAW[M](t);
  if (!still) requestAnimationFrame(frame);
}

/* ================= التشغيل =================
   الشكل والثيم ثابتين. لتغييرهم: غيّر M و TH هنا (الأشكال الثانية موجودة فوق: helix, grad, curl, flux). */
M = 'riemann'; TH = THEMES.midnight;
{
  for (const a of ['X', 'Y', 'Z']) { const el = document.getElementById('c' + a.toLowerCase()); if (el) el.style.background = `rgb(${TH[a]})`; }
}
size();
addEventListener('resize', () => { size(); if (still) requestAnimationFrame(frame); });
addEventListener('scroll', () => { if (still) requestAnimationFrame(frame); }, { passive: true });
requestAnimationFrame(frame);
});
