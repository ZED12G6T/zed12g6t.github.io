// main.js — قرنبع: بوابة كلمة سر، وقرية صغيرة طايرة على طريقة Tiny Glade.
// المجسمات جاهزة من KayKit Medieval Hexagon Pack (CC0) في assets/village.glb، بس ألوان العشب والشجر والموية معدلة.
// كلمة السر ما تنحفظ هنا: نقارن بصمتها (SHA-256) بس. هذا قفل خفيف، مو حماية حقيقية.
import * as THREE from 'three';
import { GLTFLoader } from '../lib/three/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../lib/three/libs/meshopt_decoder.module.js';

const PASS_HASH = '04b5575d8b2d8d0f796974a6271fee6b8e2f3176eddf5909f0a394ea8a6e9226';
const KEY = 'qurnba-open';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;

const $ = (id) => document.getElementById(id);
const gate = $('gate'), inside = $('inside'), form = $('lock'), input = $('pw'), msg = $('msg');

// ---------------------------------------------------------------- كلمة السر
async function digest(text) {
  const clean = text.trim().replace(/\s+/g, ' ').toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('qurnba:' + clean));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function remembered() { try { return sessionStorage.getItem(KEY) === PASS_HASH; } catch { return false; } }
function remember(on) { try { on ? sessionStorage.setItem(KEY, PASS_HASH) : sessionStorage.removeItem(KEY); } catch {} }

function open(instant) {
  gate.classList.add('out');
  inside.hidden = false;
  requestAnimationFrame(() => inside.classList.add('on'));
  setTimeout(() => { gate.hidden = true; }, instant ? 0 : 900);
  view.target = 1;
  if (instant) view.t = 1;
}
function close() {
  remember(false);
  inside.classList.remove('on');
  inside.hidden = true;
  gate.hidden = false;
  requestAnimationFrame(() => gate.classList.remove('out'));
  input.value = ''; msg.textContent = '';
  view.target = 0;
  setTimeout(() => input.focus(), 300);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  let ok = false;
  try { ok = (await digest(input.value)) === PASS_HASH; } catch { msg.textContent = 'المتصفح ما يدعم القفل، جرب متصفح ثاني'; return; }
  if (ok) { remember(true); msg.textContent = ''; input.blur(); open(false); }
  else {
    msg.textContent = 'كلمة السر غلط';
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    input.select();
  }
});
$('relock').addEventListener('click', close);

// ---------------------------------------------------------------- المشهد
const view = { t: 0, target: 0 }; // 0 = بعيد خلف البوابة، 1 = قريب بعد الدخول
if (remembered()) open(true); else input.focus();

const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, alpha: true, powerPreference: 'low-power' });
} catch { /* بدون WebGL تبقى السما من CSS والبوابة تشتغل عادي */ }
if (renderer) startScene();

function startScene() {
  const maxDpr = isSmall ? 1.25 : 1.5;
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // القرية ثابتة، الظل يترسم مرة وحدة

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf3e6cf, 26, 60);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 120);

  // إضاءة العصر: شمس دافية + سما زرقا من فوق وعشب من تحت
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x8a9a5b, 1.25));
  const sun = new THREE.DirectionalLight(0xffe2b5, 2.6);
  sun.position.set(-9, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  scene.add(sun);

  const island = new THREE.Group();
  scene.add(island);
  const clouds = [];
  const spinners = [];

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load('assets/village.glb', (gltf) => {
    const parts = {};
    gltf.scenes.forEach((s) => { const root = s.children[0]; if (root) parts[root.name] = root; });
    buildVillage(parts);
    renderer.shadowMap.needsUpdate = true;
  }, undefined, () => {});

  // إحداثيات خلايا السداسي (axial) لمكانها في العالم
  const SQ3 = Math.sqrt(3);
  const at = (q, r) => new THREE.Vector3(2 * q + r, 0, SQ3 * r);
  const deg = (d) => d * Math.PI / 180;

  function put(parts, name, q, r, opt = {}) {
    const src = parts[name];
    if (!src) return null;
    const o = new THREE.Group(); // غلاف، لأن الضغط يحط إزاحة على عقدة المجسم نفسها
    o.add(src.clone());
    const p = at(q, r);
    o.position.set(p.x + (opt.dx || 0), opt.y || 0, p.z + (opt.dz || 0));
    o.rotation.y = deg(opt.rot || 0);
    if (opt.s) o.scale.setScalar(opt.s);
    const shadows = opt.shadow !== false;
    o.traverse((m) => { if (m.isMesh) { m.castShadow = shadows; m.receiveShadow = true; } });
    island.add(o);
    return o;
  }

  function buildVillage(P) {
    // الأرض: دائرة سداسية نصف قطرها 3 خلايا
    const special = new Map();
    const tile = (q, r, name, rot) => special.set(q + ',' + r, [name, rot]);
    // نهر يقطع الجزيرة، وجسر عليه طريق للقرية
    for (const q of [-3, -2, -1, 1, 2]) tile(q, 1, 'hex_river_A', 0);
    tile(0, 1, 'hex_river_crossing_A', 0);
    tile(0, 0, 'hex_road_A', -60);
    tile(0, -1, 'hex_road_A', -60);
    tile(0, 2, 'hex_road_A', -60);
    tile(0, 3, 'hex_road_A', -60);

    for (let q = -3; q <= 3; q++) {
      for (let r = -3; r <= 3; r++) {
        if (Math.abs(q + r) > 3) continue;
        const [name, rot] = special.get(q + ',' + r) || ['hex_grass', 0];
        put(P, name, q, r, { rot });
      }
    }
    put(P, 'building_bridge_A', 0, 1, { rot: 0 });

    // القرية شمال النهر
    put(P, 'building_church_blue', 0, -2, { rot: 180 });
    put(P, 'building_home_A_blue', -1, 0, { rot: 120, dx: .2 });
    put(P, 'building_home_B_red', 1, -1, { rot: -60, dx: -.2 });
    put(P, 'building_tavern_red', -1, -1, { rot: 100 });
    put(P, 'building_well_blue', 1, 0, { dx: -.3, dz: .1 });
    put(P, 'building_market_blue', 2, -1, { rot: -90 });
    put(P, 'building_home_A_red', -2, 0, { rot: 60 });
    put(P, 'building_home_B_blue', 0, -3, { rot: 200 });
    put(P, 'building_windmill_blue', 2, -2, { rot: -30 });
    put(P, 'building_grain', 3, -3);
    put(P, 'building_grain', 3, -2);
    put(P, 'building_grain', 2, -3);
    put(P, 'building_watermill_blue', -2, 1, { rot: 0 });

    // سور حجري صغير حول الحقول
    put(P, 'fence_stone_straight', 1, -3, { rot: 0 });
    put(P, 'fence_stone_straight', 1, -2, { rot: 0 });
    put(P, 'fence_wood_straight', 3, -1, { rot: 60 });

    // شجر وصخور وأشياء صغيرة
    put(P, 'trees_A_medium', -3, 2);
    put(P, 'trees_B_medium', -2, 3, { rot: 40 });
    put(P, 'trees_A_small', -3, 3);
    put(P, 'trees_B_small', -1, 3, { rot: 90 });
    put(P, 'trees_A_medium', -2, 2, { rot: 130 });
    put(P, 'tree_single_A', -1, 2, { dx: .4, dz: -.2 });
    put(P, 'rock_single_A', -1, 2, { dx: -.5, dz: .3 });
    put(P, 'tree_single_B', 1, 2, { dx: -.2 });
    put(P, 'rock_single_C', 1, 2, { dx: .5, dz: .4 });
    put(P, 'trees_A_medium', -3, 0, { rot: 20 });
    put(P, 'trees_B_small', -2, -1, { rot: 60 });
    put(P, 'trees_A_small', -1, -2, { rot: 10 });
    put(P, 'tree_single_A', 3, -1, { dx: .2, dz: .3 });
    put(P, 'trees_B_small', 3, 0, { rot: 10 });
    put(P, 'trees_A_small', 2, 0, { rot: 70 });
    put(P, 'tree_single_B', 1, -3, { dx: .3, dz: -.2 });
    put(P, 'barrel', 1, -1, { dx: .55, dz: .45 });
    put(P, 'sack', 1, -1, { dx: .7, dz: .25 });
    put(P, 'crate_A_small', -1, -1, { dx: -.6, dz: .5 });
    put(P, 'wheelbarrow', -1, 0, { dx: -.55, dz: .55, rot: 30 });
    put(P, 'bucket_water', 1, 0, { dx: .3, dz: .4 });
    put(P, 'flag_blue', 0, -1, { dx: .75, dz: -.2 });
    put(P, 'waterlily_A', 1, 1, { dz: .1, shadow: false });
    put(P, 'waterlily_A', -3, 1, { dx: .3, rot: 50, shadow: false });
    put(P, 'waterplant_A', 2, 1, { dx: .5, dz: -.4, shadow: false });

    // الطواحين تدور
    island.traverse((o) => {
      if (/windmill_top_fan/.test(o.name)) spinners.push([o, 'z', 0.8]);
      if (/watermill_wheel/.test(o.name)) spinners.push([o, 'x', -0.6]);
    });

    // غيوم حول الجزيرة وتحتها، بيضا دافية ما تتأثر بظل الأرض
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xf4ead9, emissiveIntensity: 0.55 });
    const cloudSpots = [
      ['cloud_big', -10, 3, -7, 1.1], ['cloud_small', 9, 4.2, -8, 1], ['cloud_big', 11, -1.8, 3, 1.3],
      ['cloud_small', -11, -2.4, 4, 1.1], ['cloud_big', 3, -4.5, 8, 1.5], ['cloud_small', -4, 5.5, -12, 0.9],
      ['cloud_big', -1, -3.4, -1, 2.2], ['cloud_small', 6, -3, -5, 1.3],
    ];
    for (const [name, x, y, z, s] of cloudSpots) {
      if (!P[name]) continue;
      const c = new THREE.Group();
      c.add(P[name].clone());
      c.position.set(x, y, z); c.scale.setScalar(s);
      c.traverse((m) => { if (m.isMesh) { m.material = cloudMat; m.castShadow = false; m.receiveShadow = false; } });
      c.userData = { x, speed: 0.15 + Math.random() * 0.15, phase: Math.random() * 6 };
      scene.add(c); clouds.push(c);
    }
  }

  // ---------------------------------------------------------------- كاميرا وسحب
  let yaw = deg(-20), yawVel = 0, dragging = false, lastX = 0, idle = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    yawVel = -dx * 0.006; yaw += yawVel; idle = 0;
  });
  const end = () => { dragging = false; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 44 : 32;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const ease = (x) => x * x * (3 - 2 * x);
  const clock = new THREE.Clock();
  const frameGap = isSmall ? 1 / 30 : 0;
  let acc = 0, time = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    acc += dt;
    if (acc < frameGap) return;
    const step = acc; acc = 0;
    time += step;

    view.t += (view.target - view.t) * Math.min(1, step * (reduceMotion ? 10 : 1.4));
    const k = ease(view.t);

    if (!dragging) {
      idle += step;
      yawVel *= Math.pow(0.04, step);
      yaw += yawVel + (reduceMotion ? 0 : step * 0.05 * Math.min(1, idle / 2));
    }

    // بعيد ومن فوق قدام البوابة، أقرب وأوطى بعد الدخول
    // على الجوال نوسع العدسة ونبعد شوي عشان الجزيرة كلها تبان بالعرض
    const fit = (w) => w / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    const dist = Math.max(28 - k * 9, fit(7.4 - k * 1.2));
    const height = 16 - k * 5;
    const bob = reduceMotion ? 0 : Math.sin(time * 0.6) * 0.25;
    camera.position.set(Math.sin(yaw) * dist, height + bob, Math.cos(yaw) * dist);
    const lookY = 4.2 * (1 - k) + (camera.aspect < 0.8 ? 2.2 : -0.6) * k;
    camera.lookAt(0, lookY, 0);

    if (!reduceMotion) {
      for (const [o, axis, speed] of spinners) o.rotation[axis] += speed * step;
      for (const c of clouds) c.position.x = c.userData.x + Math.sin(time * c.userData.speed + c.userData.phase) * 1.2;
    }
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    renderer.setAnimationLoop(document.hidden ? null : frame);
    clock.getDelta();
  });
}
