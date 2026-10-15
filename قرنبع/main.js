// main.js — قرنبع: بوابة ليل عاصف فوق بحر حقيقي يعكس القمر والغيوم والبرق، وبعد كلمة السر جزر طايرة على طريقة Tiny Glade وجدول الشهر.
// المواد الجاهزة:
//   assets/village.glb  مجسمات KayKit Medieval Hexagon Pack (CC0)، ألوانها معدلة شوي.
//   assets/tex/moon.jpg  خريطة سطح القمر من أمثلة three.js.
//   assets/tex/waternormals.jpg  و ../lib/three/objects/Water.js  البحر العاكس من أمثلة three.js (MIT).
//   assets/tex/cloud.png  نفثة دخان/سحاب من opengameart عبر أمثلة three.js.
// كلمة السر ما تنحفظ هنا: نقارن بصمتها (SHA-256) بس. هذا قفل خفيف، مو حماية حقيقية.
// صوت الرعد مولّد بالمتصفح (Web Audio)، ويشتغل بعد أول لمسة أو ضغطة زر.
import * as THREE from 'three';
import { GLTFLoader } from '../lib/three/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../lib/three/libs/meshopt_decoder.module.js';
import { Water } from '../lib/three/objects/Water.js';
import { startCalendar } from './calendar.js';

const PASS_HASH = '04b5575d8b2d8d0f796974a6271fee6b8e2f3176eddf5909f0a394ea8a6e9226';
const KEY = 'qurnba-open';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;

const $ = (id) => document.getElementById(id);
const gate = $('gate'), inside = $('inside'), form = $('lock'), input = $('pw'), msg = $('msg');
const flashEl = $('flash'), soundBtn = $('sound');

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
let calendarStarted = false;

function open(instant) {
  mode = 'day';
  gate.classList.add('out');
  inside.hidden = false;
  if (!calendarStarted) { calendarStarted = true; startCalendar($('calendar')); }
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
  for (let i = 1; i < 4; i++) { // تموجات الرعد وهو يتدحرج
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

// ---------------------------------------------------------------- المشهد
if (store.get(KEY) === PASS_HASH) open(true); else input.focus();

const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, alpha: true, powerPreference: 'high-performance' });
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
  scene.fog = new THREE.Fog(0x070d1c, 300, 1500);
  const camera = new THREE.PerspectiveCamera(42, 1, 1, 3000);
  const deg = (d) => d * Math.PI / 180;
  const R = (a, b) => a + (b - a) * Math.random();
  const texLoader = new THREE.TextureLoader();

  const night = new THREE.Group(), day = new THREE.Group();
  scene.add(night, day);

  // ================================================= الليل
  const CAM_NIGHT = new THREE.Vector3(0, 10, 80);
  const MOON = new THREE.Vector3(-420, 245, -1000);

  // القمر: كرة عليها خريطة سطح القمر الحقيقية، وهالة ناعمة وراها
  const moonTex = texLoader.load('assets/tex/moon.jpg');
  moonTex.colorSpace = THREE.SRGBColorSpace;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(58, 48, 32),
    new THREE.MeshBasicMaterial({ map: moonTex, color: new THREE.Color(0xfff3d6).multiplyScalar(1.3), fog: false, toneMapped: false }),
  );
  moon.position.copy(MOON);
  moon.rotation.y = deg(-90);
  night.add(moon);
  function haloTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,248,225,.75)'); g.addColorStop(0.18, 'rgba(225,230,255,.35)');
    g.addColorStop(0.45, 'rgba(150,170,230,.10)'); g.addColorStop(1, 'rgba(120,140,220,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false }));
  halo.position.copy(MOON).add(new THREE.Vector3(0, 0, -60));
  halo.scale.setScalar(620);
  night.add(halo);

  // نجوم قليلة في فتحات الغيوم
  {
    const n = isSmall ? 250 : 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = R(-2.2, -0.9), e = deg(R(12, 60)), r = 1400;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    night.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 })));
  }

  // البحر: Water من أمثلة three.js، يعكس القمر والغيوم والبرق
  const moonDir = MOON.clone().sub(CAM_NIGHT).normalize();
  const waterNormals = texLoader.load('assets/tex/waternormals.jpg', (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const water = new Water(new THREE.PlaneGeometry(4000, 4000), {
    textureWidth: isSmall ? 256 : 512, textureHeight: isSmall ? 256 : 512,
    waterNormals, sunDirection: moonDir, sunColor: 0x9aa4c4, waterColor: 0x01040b,
    distortionScale: 3.4, fog: true,
  });
  // الأصل يضيف رمادي ثابت للانعكاس، يناسب النهار؛ بالليل نخليه شبه أسود
  water.material.fragmentShader = water.material.fragmentShader.replace('vec3( 0.1 ) + reflectionSample * 0.9', 'vec3( 0.003 ) + reflectionSample * 0.75');
  water.rotation.x = -Math.PI / 2;
  water.material.uniforms.size.value = 1.6;
  night.add(water);

  // غيوم العاصفة: مئات النفثات المصورة في رسمة وحدة (InstancedBufferGeometry)
  const cloudTex = texLoader.load('assets/tex/cloud.png');
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      map: { value: cloudTex }, time: { value: 0 },
      flash: { value: 0 }, flashPos: { value: new THREE.Vector3() },
      fogColor: { value: new THREE.Color(0x070d1c) }, fogNear: { value: 300 }, fogFar: { value: 1500 },
    },
    vertexShader: `
      attribute vec3 iOffset; attribute vec4 iData; // scale, rotation, shade, drift
      uniform float time;
      varying vec2 vUv; varying float vShade; varying vec3 vWorld; varying float vDepth;
      void main(){
        vUv = uv; vShade = iData.z;
        vec3 w = iOffset; w.x += time * iData.w;
        vWorld = w;
        vec4 mv = viewMatrix * vec4(w, 1.);
        float c = cos(iData.y), s = sin(iData.y);
        mv.xy += mat2(c, -s, s, c) * position.xy * iData.x;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform float flash; uniform vec3 flashPos;
      uniform vec3 fogColor; uniform float fogNear, fogFar;
      varying vec2 vUv; varying float vShade; varying vec3 vWorld; varying float vDepth;
      void main(){
        vec4 t = texture2D(map, vUv);
        float lum = dot(t.rgb, vec3(.333));
        float a = t.a * .62;
        if (a < .01) discard;
        vec3 dark = vec3(.03, .045, .09), lit = vec3(.42, .47, .64);
        vec3 col = mix(dark, lit, vShade) * mix(.5, 1.2, lum) * mix(.55, 1.35, smoothstep(.1, .95, vUv.y));
        float d = distance(vWorld, flashPos);
        float f = flash * exp(-d * d / 52000.);
        col += vec3(.80, .84, 1.) * f * (.35 + lum);
        col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth) * .85);
        gl_FragColor = vec4(col, a);
      }`,
  });
  {
    const puffs = [];
    const dir = new THREE.Vector3();
    const add = (x, y, z, s, shadeBoost = 0) => {
      const p = new THREE.Vector3(x, y, z);
      dir.copy(p).sub(CAM_NIGHT).normalize();
      const ang = Math.acos(Math.min(1, dir.dot(moonDir)));
      const puffAng = Math.atan(s * 0.5 / p.distanceTo(CAM_NIGHT));
      if (ang < deg(4.5) + puffAng * 0.75) return; // نخلي فتحة قدام القمر
      const nearMoon = Math.max(0, 1 - ang / deg(22));
      const shade = Math.min(1, R(0.08, 0.32) + nearMoon * nearMoon * 0.75 + shadeBoost);
      puffs.push({ p, s, rot: R(0, 6.28), shade, drift: R(1.5, 4) });
    };
    const k = isSmall ? 0.6 : 1;
    for (let i = 0; i < 170 * k; i++) add(R(-1300, 1300), R(-10, 160) + R(0, 1) ** 3 * 160, R(-1100, -650), R(160, 320)); // جدار العاصفة على الأفق
    for (let i = 0; i < 70 * k; i++) add(R(-700, 700), R(60, 200), R(-600, -260), R(110, 210)); // طبقة وسطى أقرب
    for (let i = 0; i < 50 * k; i++) add(R(-500, 500), R(180, 260), R(-500, -80), R(160, 260), -0.05); // سقف غيم فوق الكاميرا
    for (let i = 0; i < 26 * k; i++) add(R(-600, 600), R(2, 30), R(-900, -300), R(120, 220), 0.05); // ضباب منخفض فوق الموج
    // ترتيب من البعيد للقريب عشان الشفافية تطلع صح
    puffs.sort((a, b) => b.p.distanceTo(CAM_NIGHT) - a.p.distanceTo(CAM_NIGHT));
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    const off = new Float32Array(puffs.length * 3), data = new Float32Array(puffs.length * 4);
    puffs.forEach((c, i) => {
      off.set([c.p.x, c.p.y, c.p.z], i * 3);
      data.set([c.s, c.rot, c.shade, c.drift], i * 4);
    });
    geo.setAttribute('iOffset', new THREE.InstancedBufferAttribute(off, 3));
    geo.setAttribute('iData', new THREE.InstancedBufferAttribute(data, 4));
    geo.instanceCount = puffs.length;
    const clouds = new THREE.Mesh(geo, cloudMat);
    clouds.frustumCulled = false;
    clouds.renderOrder = 2;
    night.add(clouds);
  }

  // البرق: شريط متعرج يتوهج، بين طبقات الغيم، والبحر يعكسه
  const boltMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { glow: { value: 0 } },
    vertexShader: `attribute float side; varying float vSide; void main(){ vSide = side; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform float glow; varying float vSide;
      void main(){ float d = abs(vSide); float core = smoothstep(.22, .0, d); float soft = pow(1. - d, 3.);
        vec3 c = vec3(.75,.82,1.) * soft * .55 + vec3(1.) * core; gl_FragColor = vec4(c * glow, 1.); }`,
  });
  const bolt = new THREE.Mesh(new THREE.BufferGeometry(), boltMat);
  bolt.frustumCulled = false; bolt.renderOrder = 1; bolt.visible = false;
  night.add(bolt);
  function makeBolt(top, bottomY) {
    const pos = [], side = [], idx = [];
    const ribbon = (pts, width) => {
      const start = pos.length / 3;
      pts.forEach((p, i) => {
        const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
        const dx = q.x - o.x, dy = q.y - o.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * width, ny = dx / len * width;
        pos.push(p.x + nx, p.y + ny, p.z, p.x - nx, p.y - ny, p.z);
        side.push(1, -1);
        if (i > 0) { const a = start + (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      });
    };
    const walk = (from, toY, width, depth) => {
      const pts = [from.clone()];
      const steps = 18;
      const dy = (toY - from.y) / steps;
      let p = from.clone();
      for (let i = 0; i < steps; i++) {
        p = p.clone(); p.y += dy; p.x += R(-1, 1) * Math.abs(dy) * 0.7;
        pts.push(p);
      }
      ribbon(pts, width);
      if (depth > 0) for (let b = 0; b < 2; b++) {
        const s = pts[3 + Math.floor(Math.random() * (pts.length - 8))];
        if (s) walk(s, s.y - (s.y - toY) * R(0.25, 0.5), width * 0.55, depth - 1);
      }
    };
    walk(top, bottomY, 6, 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('side', new THREE.Float32BufferAttribute(side, 1));
    g.setIndex(idx);
    bolt.geometry.dispose();
    bolt.geometry = g;
  }

  // مطر خفيف قدام الكاميرا
  const rainMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, flash: { value: 0 } },
    vertexShader: `attribute float tip; uniform float time; varying float vTip;
      void main(){ vec3 p = position; p.y = mod(p.y - time * 55., 90.) - 12.; p.x += p.y * .1;
        p.y += tip * 2.6; p.x += tip * .26; vTip = tip; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform float flash; varying float vTip;
      void main(){ gl_FragColor = vec4(vec3(.62,.68,.85) + flash * .4, (.16 + flash * .25) * (1. - vTip * .6)); }`,
  });
  {
    const n = isSmall ? 500 : 1100, pos = new Float32Array(n * 6), tip = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const x = R(-70, 70), y = R(0, 90), z = R(-90, 60);
      pos.set([x, y, z, x, y, z], i * 6); tip.set([0, 1], i * 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('tip', new THREE.BufferAttribute(tip, 1));
    const rain = new THREE.LineSegments(g, rainMat);
    rain.frustumCulled = false;
    rain.position.copy(CAM_NIGHT).add(new THREE.Vector3(0, -10, -40));
    night.add(rain);
  }

  // ================================================= النهار
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
  let dayClouds = null;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loadModel(loader, (gltf) => {
    const parts = {};
    gltf.scenes.forEach((s) => { const root = s.children[0]; if (root) { s.updateMatrixWorld(true); parts[root.name] = root; } });
    buildLands(parts);
    buildDayClouds(parts);
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

  function buildDayClouds(P) {
    const big = P.cloud_big && baked(P.cloud_big), small = P.cloud_small && baked(P.cloud_small);
    if (!big || !small) return;
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xf4ead9, emissiveIntensity: 0.55 });
    const list = [];
    for (let i = 0; i < 30; i++) { // بحر سحاب تحت الجزر
      const a = R(0, 6.28), rad = R(4, 34);
      list.push({ big: Math.random() < 0.6, x: Math.cos(a) * rad, y: R(-10, -6), z: Math.sin(a) * rad, s: R(1.6, 3), r: R(0, 6.28), v: R(0.1, 0.3) });
    }
    for (let i = 0; i < 10; i++) { // سحاب بعيد ورا
      const a = R(0, 6.28), rad = R(26, 45);
      list.push({ big: Math.random() < 0.5, x: Math.cos(a) * rad, y: R(-2, 7), z: Math.sin(a) * rad, s: R(1.2, 2.2), r: R(0, 6.28), v: R(0.1, 0.3) });
    }
    dayClouds = [];
    for (const geo of [big, small]) {
      const mine = list.filter((c) => c.big === (geo === big));
      const im = new THREE.InstancedMesh(geo, mat, mine.length);
      day.add(im);
      dayClouds.push({ im, list: mine });
    }
    placeDayClouds(0);
  }
  const tmp = new THREE.Object3D();
  function placeDayClouds(time) {
    if (!dayClouds) return;
    for (const set of dayClouds) {
      set.list.forEach((c, i) => {
        tmp.position.set(c.x + Math.sin(time * 0.05 * c.v + c.r) * 2, c.y, c.z);
        tmp.rotation.set(0, c.r, 0); tmp.scale.setScalar(c.s);
        tmp.updateMatrix(); set.im.setMatrixAt(i, tmp.matrix);
      });
      set.im.instanceMatrix.needsUpdate = true;
    }
  }

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

    const a = isle(-14.5, -2, -5, 20); // جزيرة غابة فيها بيت صغير
    RING1.forEach(([q, r]) => put(P, a, 'hex_grass', q, r));
    put(P, a, 'building_home_A_red', 0, 0, { rot: 150 });
    put(P, a, 'trees_A_medium', -1, 0); put(P, a, 'trees_B_medium', 0, 1, { rot: 50 }); put(P, a, 'trees_A_small', -1, 1);
    put(P, a, 'tree_single_B', 1, 0, { dx: .3 }); put(P, a, 'trees_B_small', 1, -1); put(P, a, 'rock_single_A', 0, -1, { dx: .3 });
    put(P, a, 'sack', 0, 0, { dx: .6, dz: .5 });

    const b = isle(13.5, 1, -9, -15); // جزيرة حقل وبير
    [[0, 0], [1, 0], [0, 1], [1, -1], [-1, 1]].forEach(([q, r]) => put(P, b, 'hex_grass', q, r));
    put(P, b, 'building_grain', 1, 0); put(P, b, 'building_grain', 1, -1);
    put(P, b, 'building_well_blue', 0, 0, { rot: 30 });
    put(P, b, 'tree_single_A', 0, 1, { dx: -.3 }); put(P, b, 'trees_A_small', -1, 1, { rot: 80 });
    put(P, b, 'fence_wood_straight', 0, 0, { rot: 180 }); put(P, b, 'barrel', 0, 1, { dx: .5, dz: .3 });

    const c = isle(-4, 3.5, -17, 40); // جزيرة بعيدة فيها شجر
    [[0, 0], [1, 0], [0, 1]].forEach(([q, r]) => put(P, c, 'hex_grass', q, r));
    put(P, c, 'trees_B_medium', 0, 0); put(P, c, 'trees_A_small', 1, 0, { rot: 30 }); put(P, c, 'tree_single_A', 0, 1);

    const d = isle(10.5, -3, 6, 0); // جزر صغيرة
    put(P, d, 'hex_grass', 0, 0); put(P, d, 'tree_single_B', 0, 0, { dx: -.2 }); put(P, d, 'rock_single_C', 0, 0, { dx: .5, dz: .3 });
    const e = isle(-11, -4.5, 7, 10);
    [[0, 0], [1, 0]].forEach(([q, r]) => put(P, e, 'hex_grass', q, r));
    put(P, e, 'trees_A_small', 0, 0); put(P, e, 'tree_single_A', 1, 0);

    lands.traverse((o) => {
      if (/windmill_top_fan/.test(o.name)) spinners.push([o, 'z', 0.8]);
      if (/watermill_wheel/.test(o.name)) spinners.push([o, 'x', -0.6]);
    });
  }

  // ================================================= البرق
  let flash = 0, strikeT = -1, nextStrike = 1.2, flicker = [];
  function strike(t) {
    const near = Math.random();
    flicker = near > 0.45
      ? [[0, 1], [0.06, 0.2], [0.12, 0.95], [0.22, 0.3], [0.3, 0.7], [0.62, 0]]
      : [[0, 0.65], [0.09, 0.1], [0.17, 0.5], [0.42, 0]];
    strikeT = t;
    const x = R(-700, 700), z = R(-950, -450), y = R(160, 230);
    cloudMat.uniforms.flashPos.value.set(x, y - 40, z);
    bolt.visible = near > 0.3;
    if (bolt.visible) makeBolt(new THREE.Vector3(x, y, z), 0);
    thunder(0.3 + near * 0.7, 0.25 + (1 - near) * 2.2);
    nextStrike = t + R(3.5, 8.5);
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

  // ================================================= تبديل ليل ونهار
  function setMode(m) {
    const isDay = m === 'day';
    night.visible = !isDay; day.visible = isDay;
    renderer.toneMappingExposure = isDay ? 1.05 : 0.8;
    if (isDay) {
      scene.fog.color.set(0xf3e6cf); scene.fog.near = 40; scene.fog.far = 110;
      camera.near = 0.5; camera.far = 300; renderer.shadowMap.needsUpdate = true;
    } else {
      scene.fog.color.set(0x070d1c); scene.fog.near = 300; scene.fog.far = 1500;
      camera.near = 1; camera.far = 3000; camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    flash = 0;
  }
  setMode(mode);

  // ================================================= كاميرا وسحب
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

  // بالنهار الجدول ياخذ جزء من الشاشة، فنزيح مركز الصورة عشان الجزر تبان في الباقي
  function frameDay() {
    const w = innerWidth, h = innerHeight;
    if (w >= 900) {
      const panel = Math.min(660, w * 0.54) + 32;
      camera.setViewOffset(w, h, panel / 2, 0, w, h); // RTL: الجدول يمين والجزر يسار
    } else {
      camera.setViewOffset(w, h, 0, h * 0.3, w, h); // الجوال: الجزر فوق والجدول تحت
    }
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    if (mode === 'day') frameDay(); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  const frameGap = isSmall ? 1 / 30 : 0;
  let acc = 0, time = 0, lastMode = '';

  function frame() {
    acc += Math.min(clock.getDelta(), 0.1);
    if (acc < frameGap) return;
    const step = acc; acc = 0;
    time += step;
    const portrait = camera.aspect < 0.8;
    if (mode !== lastMode) { lastMode = mode; resize(); }

    if (mode === 'night') {
      camera.fov = portrait ? 64 : 42;
      camera.updateProjectionMatrix();
      const sway = reduceMotion ? 0 : Math.sin(time * 0.08) * 3;
      camera.position.set(CAM_NIGHT.x + sway, CAM_NIGHT.y + (reduceMotion ? 0 : Math.sin(time * 0.5) * 0.6), CAM_NIGHT.z);
      camera.lookAt(portrait ? -360 : -60, portrait ? -110 : 110, -900);
      if (!reduceMotion && time > nextStrike) strike(time);
      flash = flashAt(time);
      cloudMat.uniforms.flash.value = flash;
      cloudMat.uniforms.time.value = reduceMotion ? 0 : time;
      boltMat.uniforms.glow.value = Math.min(1, flash * 1.4);
      if (flash <= 0.001) bolt.visible = false;
      rainMat.uniforms.time.value = time;
      rainMat.uniforms.flash.value = flash;
      water.material.uniforms.time.value = time * 0.6;
      if (!gate.classList.contains('out')) flashEl.style.opacity = String(flash * 0.12);
    } else {
      camera.fov = portrait ? 50 : 34;
      camera.updateProjectionMatrix();
      if (!dragging) {
        idle += step;
        yawVel *= Math.pow(0.04, step);
        yaw += yawVel + (reduceMotion ? 0 : step * 0.04 * Math.min(1, idle / 2));
      }
      const dist = portrait ? 46 : 33;
      const bob = reduceMotion ? 0 : Math.sin(time * 0.6) * 0.25;
      camera.position.set(Math.sin(yaw) * dist, 15 + bob, Math.cos(yaw) * dist);
      camera.lookAt(0, -1, 0);
      if (!reduceMotion) { for (const [o, axis, speed] of spinners) o.rotation[axis] += speed * step; placeDayClouds(time); }
    }
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    renderer.setAnimationLoop(document.hidden ? null : frame);
    clock.getDelta();
  });

  return { setMode };
}
