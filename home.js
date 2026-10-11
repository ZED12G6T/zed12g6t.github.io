// home.js — مشهد الصفحة الرئيسية: نجمة زجاجية فوق بحيرة ليلية، وجزيرة طايرة فيها نباتات تضوي.
// كل المجسمات مبنية بالكود (بدون ملفات نماذج) عشان الصفحة تبقى خفيفة على الجوال.
// لو ما اشتغل WebGL تبقى الخلفية الداكنة من home.css والصفحة كلها تشتغل عادي.
import * as THREE from 'three';
import { Reflector } from './lib/three/Reflector.js';
import { RoomEnvironment } from './lib/three/RoomEnvironment.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;

setupReveal();

// ---------------------------------------------------------------- أدوات صغيرة
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = rng(7);
const R = (a, b) => a + (b - a) * rand();
function hash(x, y, z) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return l(l(l(c(0,0,0), c(1,0,0), u), l(c(0,1,0), c(1,1,0), u), v), l(l(c(0,0,1), c(1,0,1), u), l(c(0,1,1), c(1,1,1), u), v), w);
}
function fbm(x, y, z, o = 4) { let a = .5, f = 1, s = 0; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= .5; } return s; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------------------------------------------------------- المحرك
let renderer;
const canvas = document.getElementById('scene');
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (renderer) start();

function start() {
  let dpr = Math.min(devicePixelRatio || 1, isSmall ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070910, 0.011);
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);
  const GLOW = glowTexture();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---- الإضاءة: قمر بارد من قدام يسار، وسماء خافتة
  scene.add(new THREE.HemisphereLight(0x5c6c8e, 0x1a2234, 0.6));
  const moon = new THREE.DirectionalLight(0xc4d2ff, 1.7);
  moon.position.set(-25, 30, 18); scene.add(moon);
  const under = new THREE.DirectionalLight(0x6d7fae, .9); under.position.set(.3, -1, .8); scene.add(under);

  // ---- السماء
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vD;
      void main(){
        float h = clamp(vD.y, -1., 1.);
        vec3 top = vec3(.008,.010,.018), hor = vec3(.045,.065,.11);
        vec3 c = mix(hor, top, smoothstep(0., .45, h));
        c += vec3(.05,.06,.10) * pow(max(0., 1. - abs(h) * 3.), 3.) * (.6 + .4 * dot(normalize(vD.xz + 1e-4), normalize(vec2(-.6, -1.))));
        gl_FragColor = vec4(c, 1.);
      }`
  }));
  scene.add(sky);

  // ---- النجوم
  const starCount = isSmall ? 900 : 1800;
  {
    const pos = new Float32Array(starCount * 3), size = new Float32Array(starCount), ph = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const th = R(0, Math.PI * 2), y = R(0.04, 1), r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(th) * r * 240, y * 240, Math.sin(th) * r * 240], i * 3);
      size[i] = Math.pow(R(0, 1), 3) * 3.2 + 0.8; ph[i] = R(0, 6.28);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    var starMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, px: { value: dpr } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: `attribute float size; attribute float phase; uniform float time; uniform float px; varying float vA;
        void main(){ vA = .55 + .45 * sin(time * (.6 + phase * .25) + phase * 7.); gl_PointSize = size * px; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, d); gl_FragColor = vec4(vec3(.85,.9,1.) * a * vA, 1.); }`
    });
    scene.add(new THREE.Points(g, starMat));
  }

  // ---- الجبال البعيدة
  {
    const g = new THREE.PlaneGeometry(260, 110, isSmall ? 130 : 220, isSmall ? 55 : 90);
    g.rotateX(-Math.PI / 2); g.translate(0, 0, -62);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const far = smooth(-24, -52, z);
      const ridge = 1 - Math.abs(noise3(x * .05, 0, z * .05) * 2 - 1);
      let h = far * (fbm(x * .035 + 3, 1.7, z * .035, 5) * 22 + ridge * 7 - 9) - 1.2;
      h *= .5 + .5 * smooth(4, 34, Math.abs(x));
      p.setY(i, h);
      const snow = smooth(10, 16, h);
      c.setRGB(.11, .115, .135).lerp(new THREE.Color(.42, .44, .5), snow); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true })));
  }

  // ---- البحيرة (انعكاس حقيقي بدقة منخفضة + تموج)
  const reflScale = isSmall ? .3 : .5;
  const water = new Reflector(new THREE.PlaneGeometry(500, 500), {
    textureWidth: innerWidth * dpr * reflScale, textureHeight: innerHeight * dpr * reflScale, color: 0x8a96aa,
    shader: {
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, time: { value: 0 } },
      vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
        void main(){ vUv = textureMatrix * vec4(position,1.); vW = (modelMatrix * vec4(position,1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float time; varying vec4 vUv; varying vec3 vW;
        void main(){
          float r = sin(vW.x * 1.3 + time * 1.1) * .5 + sin(vW.z * 2.3 - time * 1.4 + vW.x * .4) * .5 + sin((vW.x + vW.z) * 4.1 + time * 2.) * .25;
          float d = length(vW.xz - cameraPosition.xz);
          vec4 uv = vUv; uv.x += r * .012 * uv.w; uv.y += r * .02 * uv.w;
          vec3 refl = texture2DProj(tDiffuse, uv).rgb * color;
          vec3 c = vec3(.006, .014, .026) + refl;
          c += vec3(.5,.6,.8) * pow(max(0., r - .9), 3.) * .12 * (1. - smoothstep(4., 30., d));
          c = mix(c, vec3(.03,.04,.065), smoothstep(25., 110., d) * .8);
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // ---- الزجاج
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .03, transmission: 1, thickness: .7, ior: 1.5, dispersion: isSmall ? 0 : 5, envMap, envMapIntensity: 2.6, iridescence: .9, iridescenceIOR: 1.3, clearcoat: 1, attenuationColor: 0xe4ecff, attenuationDistance: 2.5, flatShading: true });

  function mergeNonIndexed(geos) {
    const arr = [];
    for (const g of geos) { const n = g.index ? g.toNonIndexed() : g; arr.push(n.attributes.position.array); }
    const len = arr.reduce((s, a) => s + a.length, 0), out = new Float32Array(len); let o = 0;
    for (const a of arr) { out.set(a, o); o += a.length; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); g.computeVertexNormals(); return g;
  }
  function starGeometry() {
    const up = new THREE.Vector3(0, 1, 0), parts = [];
    const add = (dir, len, w) => {
      const g = new THREE.ConeGeometry(w, len, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, len / 2, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())); parts.push(g);
    };
    add(new THREE.Vector3(0, 1, 0), 2.5, .3); add(new THREE.Vector3(0, -1, 0), 1.9, .3);
    add(new THREE.Vector3(1, 0, 0), 2.0, .28); add(new THREE.Vector3(-1, 0, 0), 2.0, .28);
    add(new THREE.Vector3(0, 0, 1), 1.2, .26); add(new THREE.Vector3(0, 0, -1), 1.2, .26);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.Vector3(sx, sy, sz), .8, .13);
    parts.push(new THREE.OctahedronGeometry(.42, 0));
    return mergeNonIndexed(parts);
  }

  const heroStar = new THREE.Group();
  const starMesh = new THREE.Mesh(starGeometry(), glass);
  heroStar.add(starMesh);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x9fb4ff, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(7); heroStar.add(halo);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffffff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.scale.setScalar(1.1); heroStar.add(core);
  scene.add(heroStar);

  // بلورات صغيرة طايرة حول البحيرة
  const shards = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(R(.12, .26), 0), glass);
    m.scale.y = R(1.4, 2.2);
    m.position.set(R(-7, 7), R(.8, 4), R(-6, 2.5));
    m.userData = { y: m.position.y, s: R(.4, 1), p: R(0, 6) };
    scene.add(m); shards.push(m);
  }

  // ---- النباتات
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f8f86, roughness: .6, emissive: 0x0b2a24, emissiveIntensity: .6 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x6aa36a, roughness: .7, emissive: 0x0d2410, emissiveIntensity: .5 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc4, roughness: .6, emissive: 0x3a3030, emissiveIntensity: .4 });
  const leafGeo = new THREE.ConeGeometry(.06, 1, 3); leafGeo.translate(0, .5, 0);
  const capGeo = new THREE.SphereGeometry(.13, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const stemGeo = new THREE.CylinderGeometry(.022, .034, .24, 8); stemGeo.translate(0, .12, 0);
  const podGeo = new THREE.LatheGeometry([[0, 0], [.05, .02], [.095, .1], [.1, .2], [.075, .3], [.035, .37], [0, .42]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
  const tallStem = new THREE.CylinderGeometry(.012, .018, 1, 6); tallStem.translate(0, .5, 0);
  const glows = [];
  function glowSprite(color, size, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(size); s.userData = { base: opacity, p: R(0, 6) }; glows.push(s); return s;
  }
  function agave(s, mat = leafMat) {
    const g = new THREE.Group(), n = 11 + Math.floor(R(0, 6));
    for (let i = 0; i < n; i++) {
      const pivot = new THREE.Group(); pivot.rotation.y = i / n * Math.PI * 2 + R(-.2, .2);
      const leaf = new THREE.Mesh(leafGeo, mat); leaf.rotation.z = R(.15, .95); leaf.scale.set(1, R(.6, 1.25), 1);
      pivot.add(leaf); g.add(pivot);
    }
    g.scale.setScalar(s); return g;
  }
  function mushroom(color, s) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(stemGeo, stemMat));
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: .35 }));
    cap.position.y = .22; cap.scale.y = .8; g.add(cap);
    const gl = glowSprite(color, .9, .55); gl.position.y = .24; g.add(gl);
    g.scale.setScalar(s); g.rotation.z = R(-.2, .2); return g;
  }
  function pod(s, h) {
    const g = new THREE.Group();
    const st = new THREE.Mesh(tallStem, leafMat2); st.scale.y = h; g.add(st);
    const p = new THREE.Mesh(podGeo, new THREE.MeshStandardMaterial({ color: 0xffc2d8, emissive: 0xff4f8f, emissiveIntensity: 1.1, roughness: .3, transparent: true, opacity: .9 }));
    p.position.y = h; g.add(p);
    const gl = glowSprite(0xff5c9a, .8, .6); gl.position.y = h + .18; g.add(gl);
    g.scale.setScalar(s); g.rotation.z = R(-.25, .25); g.rotation.x = R(-.15, .15); return g;
  }

  // صخرة بسطح أعلى، ترجع دالة تحط النباتات على السطح
  function rockBody({ sx, sz, top, under, bend, seed, colors }) {
    const g = new THREE.SphereGeometry(1, isSmall ? 48 : 64, isSmall ? 28 : 40);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = fbm(x * 2 + seed, y * 2, z * 2 + seed, 4);
      if (y > 0) { y = y * top + (n - .5) * .16; }
      else { const k = -y; y = -k * under - (n - .3) * .55 * k; const tp = 1 - k * .62; x *= tp; z *= tp; x += (n - .5) * .35 * k; z += (noise3(x * 3, y * 3 + seed, z * 3) - .5) * .35 * k; }
      x *= sx; z *= sz; y += bend * x * x;
      p.setXYZ(i, x, y, z);
      const t = smooth(-.05, .12, p.getY(i) - bend * x * x);
      c.copy(colors[1]).lerp(colors[0], t).multiplyScalar(.75 + n * .5); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
    mesh.updateMatrixWorld();
    const surface = (x, z) => { ray.set(new THREE.Vector3(x, 10, z), down); const h = ray.intersectObject(mesh)[0]; return h ? h.point.y : null; };
    return { mesh, surface, geo: g };
  }
  const MOSS = [new THREE.Color(0x2f5226), new THREE.Color(0x3a332d)];

  function mossBumps(rock, count, rx, rz) {
    const geo = new THREE.IcosahedronGeometry(.1, 1);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1 }), count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let k = 0;
    for (let i = 0; i < count * 3 && k < count; i++) {
      const x = R(-rx, rx), z = R(-rz, rz); if ((x / rx) ** 2 + (z / rz) ** 2 > 1) continue;
      const y = rock.surface(x, z); if (y === null) continue;
      const s = R(.5, 1.6);
      m.compose(new THREE.Vector3(x, y + .02, z), q, new THREE.Vector3(s, s * R(.5, .9), s));
      im.setMatrixAt(k, m); im.setColorAt(k, c.setHSL(R(.22, .33), R(.35, .6), R(.12, .26))); k++;
    }
    im.count = k; return im;
  }

  function placeOn(rock, obj, x, z, sink = .02) { const y = rock.surface(x, z); if (y === null) return false; obj.position.set(x, y - sink, z); return true; }

  // ---- الجزيرة الطايرة
  const island = new THREE.Group();
  {
    const rock = rockBody({ sx: 2.5, sz: 1.5, top: .28, under: 2.1, bend: .11, seed: 3, colors: MOSS });
    island.add(rock.mesh);
    island.add(mossBumps(rock, isSmall ? 140 : 240, 2.3, 1.35));
    const spots = [[-.3, .1, 'a', 1.25], [.9, -.3, 'a', .9], [-1.5, -.2, 'a', .8], [1.7, .3, 'a2', .6], [.2, .7, 'a2', .55]];
    for (const [x, z, t, s] of spots) { const a = agave(s, t === 'a' ? leafMat : leafMat2); if (placeOn(rock, a, x, z)) island.add(a); }
    const mush = [[-.9, .55, 0xff5fb0, 1.3], [-1.15, .3, 0xff5fb0, .9], [.35, .5, 0x4dffb5, 1.1], [.55, .65, 0x4dffb5, .8], [-.6, -.5, 0xff8ad0, .8], [1.3, -.55, 0x7dffd0, .9]];
    for (const [x, z, c, s] of mush) { const m = mushroom(c, s); if (placeOn(rock, m, x, z)) island.add(m); }
    const pods = [[2.05, .05, 1, 1.1], [2.2, -.25, .8, 1.4], [1.9, .35, .7, .9], [-2.0, .1, .8, 1], [-2.15, -.2, .6, 1.3]];
    for (const [x, z, s, h] of pods) { const p = pod(s, h); if (placeOn(rock, p, x, z)) island.add(p); }
    // ورود بيضا صغيرة على الجوانب
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe6f0, emissiveIntensity: .5 }), 90);
    const pos = rock.geo.attributes.position, m4 = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < pos.count && k < 90; i += 7) {
      const y = pos.getY(i), x = pos.getX(i);
      const local = y - .11 * x * x;
      if (local < -.05 && local > -.55 && rand() < .5) { m4.makeTranslation(pos.getX(i) * 1.02, y, pos.getZ(i) * 1.02); fl.setMatrixAt(k++, m4); }
    }
    fl.count = k; island.add(fl);
    // جذور معلقة
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 1 });
    for (let i = 0; i < 9; i++) {
      const x = R(-.6, .6), z = R(-.3, .3), y0 = -1.5 - R(0, .3);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, y0 + .3, z), new THREE.Vector3(x + R(-.15, .15), y0 - .5, z + R(-.1, .1)), new THREE.Vector3(x + R(-.3, .3), y0 - R(.5, 1), z + R(-.2, .2))]);
      island.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .009, 4), rootMat));
    }
    const pl = new THREE.PointLight(0xff5fa8, 7, 5, 1.6); pl.position.set(-.9, .7, .6); island.add(pl);
    const gl = new THREE.PointLight(0x4dffb5, 5, 4, 1.6); gl.position.set(.5, .6, .6); island.add(gl);
    const pl2 = new THREE.PointLight(0xff5c9a, 4, 3.5, 1.6); pl2.position.set(2.1, 1.3, .4); island.add(pl2);
  }
  island.position.set(0, 11, -4);
  island.rotation.y = -.25;
  scene.add(island);

  // ---- ضفاف أمامية تأطّر البحيرة في البداية
  function shore(x, z, s, flip) {
    const g = new THREE.Group();
    const rock = rockBody({ sx: 1.6, sz: 1.1, top: .45, under: .6, bend: 0, seed: 11 + x, colors: [new THREE.Color(0x34502a), new THREE.Color(0x2b2724)] });
    g.add(rock.mesh); g.add(mossBumps(rock, isSmall ? 50 : 90, 1.4, .95));
    const a = agave(1.1); placeOn(rock, a, .2 * flip, -.1); g.add(a);
    const a2 = agave(.7, leafMat2); placeOn(rock, a2, -.8 * flip, .3); g.add(a2);
    const p = pod(1, 1.3); placeOn(rock, p, .9 * flip, .2); g.add(p);
    const m1 = mushroom(0xff5fb0, 1.2); placeOn(rock, m1, -.3 * flip, .55); g.add(m1);
    const m2 = mushroom(0x4dffb5, .9); placeOn(rock, m2, .5 * flip, .6); g.add(m2);
    const l = new THREE.PointLight(0xff6fb0, 4, 4, 1.6); l.position.set(0, 1, .8); g.add(l);
    g.position.set(x, .05, z); g.scale.setScalar(s); g.rotation.y = flip * .4;
    scene.add(g); return g;
  }
  const shores = [shore(-6.6, 1.5, 1.15, 1), shore(7, .4, 1.25, -1)];

  // ---- يراعات
  const flyCount = isSmall ? 70 : 130;
  let flyMat;
  {
    const pos = new Float32Array(flyCount * 3), ph = new Float32Array(flyCount);
    for (let i = 0; i < flyCount; i++) {
      const onIsland = i < flyCount * .55;
      pos.set(onIsland ? [R(-3.2, 3.2), 11 + R(-.4, 2.4), -4 + R(-1.8, 1.8)] : [R(-9, 9), R(.3, 3.5), R(-4, 3)], i * 3);
      ph[i] = R(0, 100);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    flyMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, px: { value: dpr }, map: { value: GLOW } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float phase; uniform float time; uniform float px; varying float vA; varying float vH;
        void main(){ vec3 p = position + vec3(sin(time*.5 + phase)*.35, sin(time*.7 + phase*1.3)*.25, cos(time*.4 + phase)*.35);
          vec4 mv = modelViewMatrix * vec4(p,1.); vA = .4 + .6 * pow(.5 + .5 * sin(time * 1.7 + phase * 3.), 2.); vH = fract(phase * .37);
          gl_PointSize = px * 70. / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying float vA; varying float vH;
        void main(){ vec3 c = mix(vec3(1.,.85,.5), vec3(.6,1.,.85), step(.6, vH)); gl_FragColor = vec4(c * texture2D(map, gl_PointCoord).a * vA, 1.); }`
    });
    scene.add(new THREE.Points(g, flyMat));
  }

  // ---- شهب
  const meteor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { a: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform float a; varying vec2 vU; void main(){ float t = pow(vU.x, 3.) * smoothstep(.5, 0., abs(vU.y - .5)); gl_FragColor = vec4(vec3(.9,.95,1.) * t * a, 1.); }'
  }));
  meteor.scale.set(9, .12, 1); meteor.visible = false; scene.add(meteor);
  let meteorT = -1, nextMeteor = 3; const meteorFrom = new THREE.Vector3(), meteorDir = new THREE.Vector3();

  // ---------------------------------------------------------------- الكاميرا مع النزول
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const keys = [
    { pos: V(0, 1.3, 9.6), look: V(0, 2.7, 0), veil: .35 },
    { pos: V(0, 4.4, 13), look: V(0, 3.2, -2), veil: .9 },
    { pos: V(0, 11.6, 9.4), look: V(0, 9.3, -4), veil: .3 },
    { pos: V(0, 12, 5), look: V(0, 17, -20), veil: .65 }
  ];
  const sections = [...document.querySelectorAll('[data-cam]')];
  let anchors = [];
  function measure() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    anchors = sections.map((el, i) => {
      const r = el.getBoundingClientRect(), top = r.top + scrollY;
      if (i === 0) return 0;
      if (i === sections.length - 1) return Math.min(max, top + r.height * .35);
      if (el.dataset.anchor === 'end') return Math.min(max, Math.max(0, top + r.height - innerHeight));
      return Math.min(max, Math.max(0, top + r.height / 2 - innerHeight / 2));
    });
  }
  function camTarget(s) {
    let i = 0; while (i < anchors.length - 2 && s > anchors[i + 1]) i++;
    const a = anchors[i], b = anchors[i + 1];
    const f = smooth(0, 1, b > a ? (s - a) / (b - a) : 1);
    const k0 = keys[i], k1 = keys[i + 1];
    return { pos: k0.pos.clone().lerp(k1.pos, f), look: k0.look.clone().lerp(k1.look, f), veil: k0.veil + (k1.veil - k0.veil) * f };
  }

  // الجوال: الشاشة طويلة، نبعد الكاميرا ونرفع النجمة فوق النص
  let distScale = 1;
  function layout() {
    const asp = innerWidth / innerHeight;
    distScale = asp < 1 ? Math.min(1.9, 1 + (1 - asp) * 1.25) : 1;
    if (asp < .9) heroStar.position.set(0, 3.9, 0); else heroStar.position.set(-2.4, 2.75, 0);
    heroStar.userData.y = heroStar.position.y;
    heroStar.scale.setScalar(asp < .9 ? 1.1 : 1.3);
    shores[0].position.x = asp < .9 ? -5.4 : -6.6; shores[1].position.x = asp < .9 ? 5.6 : 7;
  }

  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    water.getRenderTarget().setSize(innerWidth * dpr * reflScale, innerHeight * dpr * reflScale);
    layout(); measure();
  }
  addEventListener('resize', resize);
  addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  resize();

  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3();
  let first = true, veilNow = .35;
  const root = document.documentElement;
  const clock = new THREE.Clock();
  let slowFrames = 0, frames = 0;
  const speed = reduceMotion ? .15 : 1;

  function frame() {
    const dt = Math.min(clock.getDelta(), .1), t = clock.elapsedTime * speed;

    // تخفيف الدقة تلقائياً لو الجهاز بطيء
    frames++; if (dt > 1 / 32) slowFrames++;
    if (frames === 120) { if (slowFrames > 60 && dpr > 1) { dpr = Math.max(1, dpr * .7); renderer.setPixelRatio(dpr); starMat.uniforms.px.value = dpr; flyMat.uniforms.px.value = dpr; resize(); } frames = slowFrames = 0; }

    const target = camTarget(scrollY);
    const off = target.pos.clone().sub(target.look).multiplyScalar(distScale);
    tmp.copy(target.look).add(off);
    ptr.x += (ptr.tx - ptr.x) * .04; ptr.y += (ptr.ty - ptr.y) * .04;
    tmp.x += ptr.x * .45; tmp.y -= ptr.y * .25;
    if (first) { camPos.copy(tmp); camLook.copy(target.look); first = false; }
    const k = 1 - Math.pow(.0015, dt);
    camPos.lerp(tmp, k); camLook.lerp(target.look, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    veilNow += (target.veil - veilNow) * k;
    root.style.setProperty('--veil', veilNow.toFixed(3));

    // الحركة
    starMesh.rotation.y = t * .28; starMesh.rotation.x = Math.sin(t * .35) * .18; starMesh.rotation.z = Math.sin(t * .23) * .12;
    heroStar.position.y = heroStar.userData.y + Math.sin(t * .8) * .15;
    halo.material.opacity = .18 + Math.sin(t * 1.3) * .05;
    for (const s of shards) { const u = s.userData; s.position.y = u.y + Math.sin(t * u.s + u.p) * .25; s.rotation.y = t * u.s; s.rotation.x = t * u.s * .5; }
    island.position.y = 11 + Math.sin(t * .6) * .12; island.rotation.y = -.25 + Math.sin(t * .2) * .12;
    for (const g of glows) g.material.opacity = g.userData.base * (.75 + .25 * Math.sin(t * 2 + g.userData.p));
    starMat.uniforms.time.value = t; flyMat.uniforms.time.value = t; water.material.uniforms.time.value = t;

    // شهاب كل كم ثانية
    if (!reduceMotion) {
      if (meteorT < 0 && clock.elapsedTime > nextMeteor) {
        meteorT = 0; meteorFrom.set(R(-60, 40), R(30, 70), R(-120, -80)); meteorDir.set(R(.6, 1), R(-.55, -.25), 0).normalize();
        meteor.visible = true; meteor.rotation.z = Math.atan2(meteorDir.y, meteorDir.x);
      }
      if (meteorT >= 0) {
        meteorT += dt; const p = meteorT / 1.1;
        meteor.position.copy(meteorFrom).addScaledVector(meteorDir, p * 40); meteor.lookAt(camera.position); meteor.rotateZ(Math.atan2(meteorDir.y, meteorDir.x));
        meteor.material.uniforms.a.value = Math.sin(Math.min(1, p) * Math.PI);
        if (p >= 1) { meteor.visible = false; meteorT = -1; nextMeteor = clock.elapsedTime + R(4, 9); }
      }
    }

    // النجمة والبلورات للبداية بس، ما تطلع ورا نص المرصد
    const low = camPos.y < 7.5; heroStar.visible = low; for (const m of shards) m.visible = low;
    island.visible = camLook.y > 4;

    // لا نرسم الانعكاس لما الكاميرا تطالع فوق
    water.visible = camLook.y - camPos.y < 3;

    renderer.render(scene, camera);
    if (!document.body.classList.contains('gl-ready')) document.body.classList.add('gl-ready');
  }
  renderer.setAnimationLoop(frame);
}

// ---------------------------------------------------------------- نص الخاتمة يضوي كلمة كلمة
function setupReveal() {
  const sec = document.querySelector('.outro'); if (!sec) return;
  const words = [];
  for (const p of sec.querySelectorAll('.reveal')) {
    const parts = p.textContent.trim().split(/\s+/); p.textContent = '';
    parts.forEach((w, i) => { const s = document.createElement('span'); s.textContent = w; p.append(s); if (i < parts.length - 1) p.append(' '); words.push(s); });
  }
  const update = () => {
    const r = sec.getBoundingClientRect();
    const prog = (innerHeight * .6 - r.top) / Math.max(1, r.height - innerHeight * .4);
    const n = Math.round(Math.min(1, Math.max(0, prog)) * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < n));
  };
  const top = document.querySelector('.top');
  const onScroll = () => { update(); top.classList.toggle('scrolled', scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', update); onScroll();
}
