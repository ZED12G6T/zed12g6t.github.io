// main.js — قرنبع: بوابة ليل فيها غيوم وبحر وقمر وبرق ورعد، وبعد كلمة السر جزر طايرة على طريقة Tiny Glade.
// المجسمات جاهزة من KayKit Medieval Hexagon Pack (CC0) في assets/village.glb، بس ألوان العشب والشجر والموية والسقوف معدلة.
// كلمة السر ما تنحفظ هنا: نقارن بصمتها (SHA-256) بس. هذا قفل خفيف، مو حماية حقيقية.
// صوت الرعد مولّد بالمتصفح (Web Audio)، ويشتغل بعد أول لمسة أو ضغطة زر.
import * as THREE from 'three';
import { GLTFLoader } from '../lib/three/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../lib/three/libs/meshopt_decoder.module.js';

const PASS_HASH = '04b5575d8b2d8d0f796974a6271fee6b8e2f3176eddf5909f0a394ea8a6e9226';
const KEY = 'qurnba-open';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;

const $ = (id) => document.getElementById(id);
const gate = $('gate'), inside = $('inside'), form = $('lock'), input = $('pw'), msg = $('msg');
const flashEl = $('flash'), boltCanvas = $('bolt'), soundBtn = $('sound');

function loadModel(loader, onModel) {
  loader.load('assets/village.glb', onModel, undefined, (e) => console.warn('village.glb', e));
}

// ---------------------------------------------------------------- كلمة السر
async function digest(text) {
  const clean = text.trim().replace(/\s+/g, ' ').toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('qurnba:' + clean));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const store = {
  get(k, s = sessionStorage) { try { return s.getItem(k); } catch { return null; } },
  set(k, v, s = sessionStorage) { try { v == null ? s.removeItem(k) : s.setItem(k, v); } catch {} },
};

let world = null; // يتعبّى لما يشتغل WebGL
let mode = 'night';

function open(instant) {
  mode = 'day';
  gate.classList.add('out');
  inside.hidden = false;
  const show = () => {
    document.body.classList.add('day');
    world && world.setMode('day');
    requestAnimationFrame(() => inside.classList.add('on'));
  };
  if (instant || reduceMotion) { show(); gate.hidden = true; return; }
  // برقة كبيرة تبيّض الشاشة، وتحتها يتبدل الليل لنهار
  thunder(1, 0.05);
  flashEl.style.transition = 'opacity .18s ease-in';
  flashEl.style.opacity = '1';
  setTimeout(() => {
    show();
    flashEl.style.transition = 'opacity 1.6s ease-out';
    flashEl.style.opacity = '0';
    gate.hidden = true;
  }, 260);
}
function close() {
  store.set(KEY, null);
  mode = 'night';
  inside.classList.remove('on');
  inside.hidden = true;
  document.body.classList.remove('day');
  world && world.setMode('night');
  flashEl.style.transition = 'none';
  gate.hidden = false;
  requestAnimationFrame(() => gate.classList.remove('out'));
  input.value = ''; msg.textContent = '';
  setTimeout(() => input.focus(), 300);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  let ok = false;
  try { ok = (await digest(input.value)) === PASS_HASH; } catch { msg.textContent = 'المتصفح ما يدعم القفل، جرب متصفح ثاني'; return; }
  if (ok) { store.set(KEY, PASS_HASH); msg.textContent = ''; input.blur(); open(false); }
  else {
    msg.textContent = 'كلمة السر غلط';
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    input.select();
  }
});
$('relock').addEventListener('click', close);

// ---------------------------------------------------------------- صوت الرعد
let actx = null;
let soundOn = store.get('qurnba-sound', localStorage) !== 'off';
function wakeAudio() {
  if (!soundOn) return;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; } }
  if (actx.state === 'suspended') actx.resume();
}
addEventListener('pointerdown', wakeAudio);
addEventListener('keydown', wakeAudio);
function paintSound() {
  soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundBtn.setAttribute('aria-label', soundOn ? 'اطفي صوت الرعد' : 'شغّل صوت الرعد');
  soundBtn.classList.toggle('off', !soundOn);
}
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  store.set('qurnba-sound', soundOn ? 'on' : 'off', localStorage);
  paintSound();
  if (soundOn) { wakeAudio(); setTimeout(() => thunder(0.5, 0.05), 50); }
});
paintSound();

function noiseBuffer(seconds, brown) {
  const len = Math.floor(actx.sampleRate * seconds);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}
// power: 0 بعيد … 1 قريب
function thunder(power, delay) {
  if (!actx || !soundOn || actx.state !== 'running') return;
  const t = actx.currentTime + delay;
  const dur = 3 + power * 2.5;
  const out = actx.createGain();
  out.gain.value = 0.9;
  out.connect(actx.destination);

  const rumble = actx.createBufferSource();
  rumble.buffer = noiseBuffer(dur, true);
  const lp = actx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(220 + power * 500, t);
  lp.frequency.exponentialRampToValueAtTime(70, t + dur);
  const g = actx.createGain();
  const peak = 0.25 + power * 0.65;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.04 + (1 - power) * 0.35);
  // تموجات الرعد وهو يتدحرج
  for (let i = 1; i < 4; i++) {
    const at = t + 0.4 + i * (dur / 5) * (0.7 + Math.random() * 0.5);
    g.gain.exponentialRampToValueAtTime(peak * (0.35 + Math.random() * 0.4) / i, at);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  rumble.connect(lp).connect(g).connect(out);
  rumble.start(t); rumble.stop(t + dur);

  if (power > 0.6) { // طقة البرق القريب
    const crack = actx.createBufferSource();
    crack.buffer = noiseBuffer(0.5, false);
    const hp = actx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 700;
    const cg = actx.createGain();
    cg.gain.setValueAtTime(0.5 * power, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    crack.connect(hp).connect(cg).connect(out);
    crack.start(t); crack.stop(t + 0.5);
  }
}

// ---------------------------------------------------------------- خط البرق (رسم ثنائي فوق المشهد)
const bctx = boltCanvas.getContext('2d');
function sizeBolt() {
  const r = Math.min(devicePixelRatio, 1.5);
  boltCanvas.width = innerWidth * r; boltCanvas.height = innerHeight * r;
  bctx.setTransform(r, 0, 0, r, 0, 0);
}
sizeBolt();
addEventListener('resize', sizeBolt);
function drawBolt() {
  const w = innerWidth, h = innerHeight;
  bctx.clearRect(0, 0, w, h);
  const branch = (x, y, len, width, depth) => {
    bctx.beginPath(); bctx.moveTo(x, y);
    const steps = 10 + Math.floor(Math.random() * 6);
    const pts = [];
    for (let i = 0; i < steps; i++) {
      x += (Math.random() - 0.5) * len * 0.22; y += len / steps;
      bctx.lineTo(x, y); pts.push([x, y]);
    }
    bctx.lineWidth = width; bctx.stroke();
    if (depth > 0) for (let i = 0; i < 2; i++) {
      const p = pts[2 + Math.floor(Math.random() * (pts.length - 4))];
      if (p) branch(p[0], p[1], len * 0.4, width * 0.5, depth - 1);
    }
  };
  bctx.strokeStyle = 'rgba(232, 238, 255, .95)';
  bctx.shadowColor = 'rgba(150, 180, 255, .9)';
  bctx.shadowBlur = 22;
  bctx.lineJoin = 'round';
  const x0 = w * (0.12 + Math.random() * 0.76);
  branch(x0, h * 0.02, h * (0.35 + Math.random() * 0.2), 2.6, 2);
}
function clearBolt() { bctx.clearRect(0, 0, innerWidth, innerHeight); }

// ---------------------------------------------------------------- المشهد
if (store.get(KEY) === PASS_HASH) open(true); else input.focus();

const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, alpha: true, powerPreference: 'low-power' });
} catch { /* بدون WebGL تبقى السما من CSS والبوابة تشتغل عادي */ }
if (renderer) world = startScene();

function startScene() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // الجزر ثابتة، الظل يترسم مرة وحدة

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d1834, 40, 150);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
  const deg = (d) => d * Math.PI / 180;
  const R = (a, b) => a + (b - a) * Math.random();

  const night = new THREE.Group(), day = new THREE.Group();
  scene.add(night, day);

  // ------------------------------------------------ الليل
  night.add(new THREE.HemisphereLight(0x3a4c80, 0x05070f, 1.1));
  const moonLight = new THREE.DirectionalLight(0xc3d0ff, 1.8);
  moonLight.position.set(-40, 40, -60);
  night.add(moonLight);
  const flashLight = new THREE.PointLight(0xd8e2ff, 0, 140, 0);
  night.add(flashLight);

  const MOON = new THREE.Vector3(-62, 34, -150);
  function moonTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(118, 112, 10, 128, 128, 120);
    g.addColorStop(0, '#fffbea'); g.addColorStop(0.75, '#f1ead2'); g.addColorStop(1, '#d9d2bb');
    x.fillStyle = g; x.beginPath(); x.arc(128, 128, 120, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(150, 145, 130, .22)';
    for (const [cx, cy, r] of [[90, 100, 26], [160, 80, 14], [150, 160, 30], [100, 170, 12], [185, 130, 10], [70, 140, 9]]) {
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(220,230,255,.55)'); g.addColorStop(0.35, 'rgba(170,190,255,.18)'); g.addColorStop(1, 'rgba(150,170,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
  glow.position.copy(MOON); glow.scale.setScalar(130); glow.renderOrder = -2;
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), fog: false, transparent: true, toneMapped: false }));
  moon.position.copy(MOON); moon.scale.setScalar(30); moon.renderOrder = -1;
  night.add(glow, moon);

  // نجوم
  {
    const n = isSmall ? 350 : 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = deg(R(4, 70)), r = 300;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    night.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
  }

  // البحر: موج بسيط وطريق لمعة القمر عليه
  const seaMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, flash: { value: 0 }, moon: { value: new THREE.Vector2(MOON.x, MOON.z) }, cam: { value: new THREE.Vector2() } },
    vertexShader: `varying vec3 wp; void main(){ vec4 w = modelMatrix * vec4(position,1.); wp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float time, flash; uniform vec2 moon, cam; varying vec3 wp;
      void main(){
        vec2 rel = wp.xz - cam; float dist = length(rel);
        vec2 dir = normalize(moon - cam);
        float along = dot(rel, dir); float side = abs(rel.x*dir.y - rel.y*dir.x);
        float w1 = sin(wp.x*.55 + time*.9) * sin(wp.z*.8 - time*1.1);
        float w2 = sin((wp.x + wp.z)*1.7 + time*1.6) * .5 + sin(wp.x*3.1 - wp.z*2.3 - time*2.2) * .35;
        float n = w1 + w2;
        vec3 deep = vec3(.02,.045,.10), near = vec3(.05,.10,.20);
        vec3 col = mix(near, deep, smoothstep(10., 120., dist));
        col += vec3(.03,.05,.09) * smoothstep(.2, 1.2, n);
        float path = smoothstep(2. + along*.09, 0., side) * step(0., along);
        col += vec3(.85,.88,1.) * path * smoothstep(.55, 1.3, n) * .9;
        col += vec3(.25,.3,.45) * path * .18;
        col += vec3(.35,.4,.6) * flash * .35;
        float fog = smoothstep(40., 170., dist);
        col = mix(col, vec3(.051,.094,.204), fog);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.y = -5;
  night.add(sea);

  // ------------------------------------------------ النهار
  const hemiDay = new THREE.HemisphereLight(0xcfe6ff, 0x8a9a5b, 1.25);
  const sun = new THREE.DirectionalLight(0xffe2b5, 2.6);
  sun.position.set(-14, 20, 10);
  sun.castShadow = true;
  const sm = isSmall ? 1024 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 70 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  day.add(hemiDay, sun);

  const lands = new THREE.Group();
  day.add(lands);
  const spinners = [];
  const cloudSets = [];

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loadModel(loader, (gltf) => {
    const parts = {};
    gltf.scenes.forEach((s) => { const root = s.children[0]; if (root) { s.updateMatrixWorld(true); parts[root.name] = root; } });
    buildLands(parts);
    buildClouds(parts);
    renderer.shadowMap.needsUpdate = true;
  });

  // نسخ هندسة المجسم بأرقام عادية (الملف مضغوط ومكمّم)، عشان نقدر نكررها بـ InstancedMesh
  function baked(root) {
    let geo = null;
    root.traverse((m) => {
      if (geo || !m.isMesh) return;
      const src = m.geometry, out = new THREE.BufferGeometry();
      for (const name of ['position', 'normal']) {
        const a = src.attributes[name]; if (!a) continue;
        const arr = new Float32Array(a.count * 3);
        for (let i = 0; i < a.count; i++) { arr[i * 3] = a.getX(i); arr[i * 3 + 1] = a.getY(i); arr[i * 3 + 2] = a.getZ(i); }
        out.setAttribute(name, new THREE.BufferAttribute(arr, 3));
      }
      if (src.index) out.setIndex(Array.from(src.index.array));
      out.applyMatrix4(m.matrixWorld);
      if (!out.attributes.normal) out.computeVertexNormals();
      geo = out;
    });
    return geo;
  }

  function buildClouds(P) {
    const big = P.cloud_big && baked(P.cloud_big), small = P.cloud_small && baked(P.cloud_small);
    if (!big || !small) return;
    const make = (parent, mat, list) => {
      for (const geo of [big, small]) {
        const mine = list.filter((c) => c.big === (geo === big));
        const im = new THREE.InstancedMesh(geo, mat, mine.length);
        im.frustumCulled = false;
        parent.add(im);
        cloudSets.push({ im, list: mine, parent });
      }
    };
    // ليل: بحر غيوم بين الكاميرا والقمر
    const nightMat = new THREE.MeshLambertMaterial({ color: 0x8792bb, emissive: 0x18213f });
    const nl = [];
    const n = isSmall ? 70 : 110;
    for (let i = 0; i < n; i++) {
      const z = R(-140, -6), spread = 25 + (-z) * 0.9, far = Math.min(1, -z / 120);
      nl.push({ big: Math.random() < 0.6, x: R(-spread, spread), y: R(-2.5, 1.5) + far * R(0, 7), z, s: R(1.4, 3.2) * (1 + far * 1.6), r: R(0, 6.28), v: R(0.15, 0.45) });
    }
    // طبقة قريبة تحت الكاميرا تأطر الشاشة من تحت
    for (let i = 0; i < 7; i++) nl.push({ big: true, x: R(-24, 24), y: R(-5.5, -4), z: R(6, 16), s: R(2, 3.2), r: R(0, 6.28), v: R(0.2, 0.4) });
    make(night, nightMat, nl);

    // نهار: سحاب أبيض دافي حول الجزر وتحتها
    const dayMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xf4ead9, emissiveIntensity: 0.55 });
    const dl = [];
    // بحر سحاب تحت الجزر، وشوية سحاب بعيد ورا
    for (let i = 0; i < 30; i++) {
      const a = R(0, 6.28), rad = R(4, 34);
      dl.push({ big: Math.random() < 0.6, x: Math.cos(a) * rad, y: R(-10, -6), z: Math.sin(a) * rad, s: R(1.6, 3), r: R(0, 6.28), v: R(0.1, 0.3) });
    }
    for (let i = 0; i < 10; i++) {
      const a = R(0, 6.28), rad = R(26, 45);
      dl.push({ big: Math.random() < 0.5, x: Math.cos(a) * rad, y: R(-2, 7), z: Math.sin(a) * rad, s: R(1.2, 2.2), r: R(0, 6.28), v: R(0.1, 0.3) });
    }
    make(day, dayMat, dl);
    placeClouds(0, true);
  }
  const tmp = new THREE.Object3D();
  function placeClouds(time, all) {
    for (const set of cloudSets) {
      if (!all && !set.parent.visible) continue;
      const nightSet = set.parent === night;
      set.list.forEach((c, i) => {
        let x;
        if (nightSet) {
          const span = 60 + (-c.z) * 1.8;
          x = c.x + time * c.v;
          x = ((x + span) % (2 * span) + 2 * span) % (2 * span) - span;
        } else x = c.x + Math.sin(time * 0.05 * c.v + c.r) * 2;
        tmp.position.set(x, c.y, c.z); tmp.rotation.set(0, c.r, 0); tmp.scale.setScalar(c.s);
        tmp.updateMatrix(); set.im.setMatrixAt(i, tmp.matrix);
      });
      set.im.instanceMatrix.needsUpdate = true;
    }
  }

  // ------------------------------------------------ الجزر
  const SQ3 = Math.sqrt(3);
  const at = (q, r) => new THREE.Vector3(2 * q + r, 0, SQ3 * r);
  function put(P, parent, name, q, r, opt = {}) {
    if (!P[name]) return null;
    const o = new THREE.Group(); // غلاف، لأن الضغط يحط إزاحة على عقدة المجسم نفسها
    o.add(P[name].clone());
    const p = at(q, r);
    o.position.set(p.x + (opt.dx || 0), opt.y || 0, p.z + (opt.dz || 0));
    o.rotation.y = deg(opt.rot || 0);
    if (opt.s) o.scale.setScalar(opt.s);
    const cast = opt.shadow !== false;
    o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } });
    parent.add(o);
    return o;
  }
  function isle(x, y, z, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = deg(rot); lands.add(g); return g;
  }
  const RING1 = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

  function buildLands(P) {
    // الجزيرة الكبيرة: قرية فيها نهر وجسر
    const main = isle(0, 0, 0);
    const special = new Map();
    const tile = (q, r, name, rot) => special.set(q + ',' + r, [name, rot]);
    for (const q of [-3, -2, -1, 1, 2]) tile(q, 1, 'hex_river_A', 0);
    tile(0, 1, 'hex_river_crossing_A', 0);
    for (const r of [0, -1, 2, 3]) tile(0, r, 'hex_road_A', -60);
    for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) {
      if (Math.abs(q + r) > 3) continue;
      const [name, rot] = special.get(q + ',' + r) || ['hex_grass', 0];
      put(P, main, name, q, r, { rot });
    }
    const add = (name, q, r, opt) => put(P, main, name, q, r, opt);
    add('building_bridge_A', 0, 1);
    add('building_church_blue', 0, -2, { rot: 180 });
    add('building_home_A_blue', -1, 0, { rot: 120, dx: .2 });
    add('building_home_B_red', 1, -1, { rot: -60, dx: -.2 });
    add('building_tavern_red', -1, -1, { rot: 100 });
    add('building_well_blue', 1, 0, { dx: -.3, dz: .1 });
    add('building_market_blue', 2, -1, { rot: -90 });
    add('building_home_A_red', -2, 0, { rot: 60 });
    add('building_home_B_blue', 0, -3, { rot: 200 });
    add('building_windmill_blue', 2, -2, { rot: -30 });
    add('building_grain', 3, -3); add('building_grain', 3, -2); add('building_grain', 2, -3);
    add('building_watermill_blue', -2, 1);
    add('fence_stone_straight', 1, -3); add('fence_stone_straight', 1, -2);
    add('fence_wood_straight', 3, -1, { rot: 60 });
    add('trees_A_medium', -3, 2); add('trees_B_medium', -2, 3, { rot: 40 }); add('trees_A_small', -3, 3);
    add('trees_B_small', -1, 3, { rot: 90 }); add('trees_A_medium', -2, 2, { rot: 130 });
    add('tree_single_A', -1, 2, { dx: .4, dz: -.2 }); add('rock_single_A', -1, 2, { dx: -.5, dz: .3 });
    add('tree_single_B', 1, 2, { dx: -.2 }); add('rock_single_C', 1, 2, { dx: .5, dz: .4 });
    add('trees_A_medium', -3, 0, { rot: 20 }); add('trees_B_small', -2, -1, { rot: 60 }); add('trees_A_small', -1, -2, { rot: 10 });
    add('tree_single_A', 3, -1, { dx: .2, dz: .3 }); add('trees_B_small', 3, 0, { rot: 10 }); add('trees_A_small', 2, 0, { rot: 70 });
    add('tree_single_B', 1, -3, { dx: .3, dz: -.2 });
    add('barrel', 1, -1, { dx: .55, dz: .45 }); add('sack', 1, -1, { dx: .7, dz: .25 });
    add('crate_A_small', -1, -1, { dx: -.6, dz: .5 }); add('wheelbarrow', -1, 0, { dx: -.55, dz: .55, rot: 30 });
    add('bucket_water', 1, 0, { dx: .3, dz: .4 }); add('flag_blue', 0, -1, { dx: .75, dz: -.2 });
    add('waterlily_A', 1, 1, { dz: .1, shadow: false }); add('waterlily_A', -3, 1, { dx: .3, rot: 50, shadow: false });
    add('waterplant_A', 2, 1, { dx: .5, dz: -.4, shadow: false });

    // جزيرة غابة فيها بيت صغير
    const a = isle(-14.5, -2, -5, 20);
    RING1.forEach(([q, r]) => put(P, a, 'hex_grass', q, r));
    put(P, a, 'building_home_A_red', 0, 0, { rot: 150 });
    put(P, a, 'trees_A_medium', -1, 0); put(P, a, 'trees_B_medium', 0, 1, { rot: 50 }); put(P, a, 'trees_A_small', -1, 1);
    put(P, a, 'tree_single_B', 1, 0, { dx: .3 }); put(P, a, 'trees_B_small', 1, -1); put(P, a, 'rock_single_A', 0, -1, { dx: .3 });
    put(P, a, 'sack', 0, 0, { dx: .6, dz: .5 });

    // جزيرة حقل وبير
    const b = isle(13.5, 1, -9, -15);
    [[0, 0], [1, 0], [0, 1], [1, -1], [-1, 1]].forEach(([q, r]) => put(P, b, 'hex_grass', q, r));
    put(P, b, 'building_grain', 1, 0); put(P, b, 'building_grain', 1, -1);
    put(P, b, 'building_well_blue', 0, 0, { rot: 30 });
    put(P, b, 'tree_single_A', 0, 1, { dx: -.3 }); put(P, b, 'trees_A_small', -1, 1, { rot: 80 });
    put(P, b, 'fence_wood_straight', 0, 0, { rot: 180 }); put(P, b, 'barrel', 0, 1, { dx: .5, dz: .3 });

    // جزيرة بعيدة فيها شجر
    const c = isle(-4, 3.5, -17, 40);
    [[0, 0], [1, 0], [0, 1]].forEach(([q, r]) => put(P, c, 'hex_grass', q, r));
    put(P, c, 'trees_B_medium', 0, 0); put(P, c, 'trees_A_small', 1, 0, { rot: 30 }); put(P, c, 'tree_single_A', 0, 1);

    // جزر صغيرة: بلاطة وحدة أو ثنتين
    const d = isle(10.5, -3, 6, 0);
    put(P, d, 'hex_grass', 0, 0); put(P, d, 'tree_single_B', 0, 0, { dx: -.2 }); put(P, d, 'rock_single_C', 0, 0, { dx: .5, dz: .3 });
    const e = isle(-11, -4.5, 7, 10);
    [[0, 0], [1, 0]].forEach(([q, r]) => put(P, e, 'hex_grass', q, r));
    put(P, e, 'trees_A_small', 0, 0); put(P, e, 'tree_single_A', 1, 0);

    lands.traverse((o) => {
      if (/windmill_top_fan/.test(o.name)) spinners.push([o, 'z', 0.8]);
      if (/watermill_wheel/.test(o.name)) spinners.push([o, 'x', -0.6]);
    });
  }

  // ------------------------------------------------ البرق
  let flash = 0, strikeT = -1, nextStrike = 1.5, flicker = [];
  function strike(t) {
    const near = Math.random();
    flicker = near > 0.5 ? [[0, 1], [0.07, 0.25], [0.13, 0.9], [0.24, 0.15], [0.32, 0.6], [0.6, 0]] : [[0, 0.7], [0.1, 0.1], [0.18, 0.45], [0.45, 0]];
    strikeT = t;
    flashLight.position.set(R(-50, 40), R(4, 12), R(-90, -20));
    if (near > 0.35) drawBolt();
    thunder(0.3 + near * 0.7, 0.25 + (1 - near) * 2);
    nextStrike = t + R(3.5, 9);
  }
  function flashAt(t) {
    if (strikeT < 0) return 0;
    const dt = t - strikeT;
    for (let i = 0; i < flicker.length - 1; i++) {
      const [t0, v0] = flicker[i], [t1, v1] = flicker[i + 1];
      if (dt >= t0 && dt < t1) return v0 + (v1 - v0) * (dt - t0) / (t1 - t0);
    }
    return 0;
  }

  // ------------------------------------------------ تبديل ليل ونهار
  function setMode(m) {
    const isDay = m === 'day';
    night.visible = !isDay; day.visible = isDay;
    if (isDay) { scene.fog.color.set(0xf3e6cf); scene.fog.near = 40; scene.fog.far = 110; renderer.shadowMap.needsUpdate = true; }
    else { scene.fog.color.set(0x0d1834); scene.fog.near = 40; scene.fog.far = 150; }
    clearBolt(); flash = 0;
  }
  setMode(mode);

  // ------------------------------------------------ كاميرا وسحب
  let yaw = deg(-20), yawVel = 0, dragging = false, lastX = 0, idle = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (mode !== 'day') return;
    dragging = true; lastX = e.clientX; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    yawVel = -dx * 0.006; yaw += yawVel; idle = 0;
  });
  const end = () => { dragging = false; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  const frameGap = isSmall ? 1 / 30 : 0;
  let acc = 0, time = 0;

  function frame() {
    acc += Math.min(clock.getDelta(), 0.1);
    if (acc < frameGap) return;
    const step = acc; acc = 0;
    time += step;
    const portrait = camera.aspect < 0.8;

    if (mode === 'night') {
      camera.fov = portrait ? 62 : 45;
      camera.updateProjectionMatrix();
      const sway = reduceMotion ? 0 : Math.sin(time * 0.07) * 1.5;
      camera.position.set(sway, 3, 30);
      camera.lookAt((portrait ? -24 : -6) + sway * 0.3, portrait ? 8 : 4, -100);
      if (!reduceMotion && time > nextStrike) strike(time);
      flash = flashAt(time);
      if (strikeT >= 0 && time - strikeT > 0.25) clearBolt();
      flashLight.intensity = flash * 9;
      seaMat.uniforms.flash.value = flash;
      seaMat.uniforms.time.value = time;
      seaMat.uniforms.cam.value.set(camera.position.x, camera.position.z);
      if (!gate.classList.contains('out')) flashEl.style.opacity = String(flash * 0.16);
    } else {
      camera.fov = portrait ? 48 : 36;
      camera.updateProjectionMatrix();
      if (!dragging) {
        idle += step;
        yawVel *= Math.pow(0.04, step);
        yaw += yawVel + (reduceMotion ? 0 : step * 0.04 * Math.min(1, idle / 2));
      }
      const fit = (w) => w / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
      const dist = Math.max(27, fit(6.6));
      const bob = reduceMotion ? 0 : Math.sin(time * 0.6) * 0.25;
      camera.position.set(Math.sin(yaw) * dist, 13 + bob, Math.cos(yaw) * dist);
      camera.lookAt(0, portrait ? 1.6 : -0.8, 0);
      if (!reduceMotion) for (const [o, axis, speed] of spinners) o.rotation[axis] += speed * step;
    }
    if (!reduceMotion) placeClouds(time);
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    renderer.setAnimationLoop(document.hidden ? null : frame);
    clock.getDelta();
  });

  return { setMode };
}
