/* Interactive 3D view of the MoonLady Beta 1 model. Loads only when the stage scrolls into view. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The model is stored inside a script file, so it loads from a web server and from a double-clicked page alike. */
let modelData;
function loadModelData() {
  if (!modelData) {
    modelData = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = 'assets/js/model-data.js';
      s.onload = () => {
        const bin = atob(window.AMD_MODEL_B64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        window.AMD_MODEL_B64 = null;
        ok(bytes.buffer);
      };
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }
  return modelData;
}

function start(stage) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    stage.classList.add('failed'); /* No WebGL: show the still image instead. */
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
  camera.position.set(0.62, 0.42, 0.78);

  const key = new THREE.DirectionalLight(0x9fe9f2, 1.5); key.position.set(2, 3, 2); scene.add(key);
  const rim = new THREE.DirectionalLight(0x0a9fe8, 2.2); rim.position.set(-3, 1, -2); scene.add(rim);

  /* Ground rings in the deck's cyan */
  const rings = new THREE.Group();
  [0.3, 0.42, 0.54].forEach((r, i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.003, 96), new THREE.MeshBasicMaterial({ color: 0x4dd4e0, transparent: true, opacity: 0.5 - i * 0.13, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; rings.add(m);
  });
  rings.position.y = -0.13; scene.add(rings);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 0.45; controls.maxDistance = 1.8;
  controls.autoRotate = !reduce; controls.autoRotateSpeed = 1.1;
  controls.target.set(0, 0.02, 0);
  if (matchMedia('(pointer: coarse)').matches) controls.enableZoom = false;

  const pivot = new THREE.Group(); scene.add(pivot);
  const spinners = [];
  const state = { throttle: stage.dataset.idle ? +stage.dataset.idle : 0.35, roll: 0, pitch: 0, yaw: 0 };
  const shown = { roll: 0, pitch: 0, yaw: 0, y: 0 };

  addEventListener('amd-controls', (e) => { Object.assign(state, e.detail); controls.autoRotate = false; });

  if (matchMedia('(pointer: coarse)').matches) renderer.domElement.style.touchAction = 'pan-y'; /* Phones: swipe sideways to rotate, up and down to scroll. */

  loadModelData().then((buffer) => new Promise((ok, fail) => new GLTFLoader().parse(buffer, '', ok, fail))).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.sub(c);
    pivot.add(model);
    model.traverse((o) => {
      if (/_Bell$/.test(o.name)) spinners.push({ o, dir: /FL|RR/.test(o.name) ? -1 : 1 });
    });
    stage.classList.add('ready');
    resize();
  }).catch(() => { renderer.domElement.remove(); stage.classList.add('failed'); });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 520 ? 44 : 32;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const speed = reduce ? 0 : 6 + state.throttle * 60;
    spinners.forEach((s) => { s.o.rotation.y += s.dir * speed * dt; });
    const k = 1 - Math.exp(-dt * 5);
    shown.roll += (state.roll * 0.5 - shown.roll) * k;
    shown.pitch += (state.pitch * 0.5 - shown.pitch) * k;
    shown.yaw += state.yaw * dt * 1.4;
    shown.y += ((state.throttle - 0.35) * 0.09 - shown.y) * k;
    pivot.rotation.set(shown.pitch, shown.yaw, -shown.roll);
    pivot.position.y = shown.y + (reduce ? 0 : Math.sin(t * 1.6) * 0.006);
    rings.rotation.y = t * 0.2;
    controls.update();
    renderer.render(scene, camera);
  });
}

const stages = document.querySelectorAll('[data-model]');
const io = new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); start(e.target); } });
}, { rootMargin: '200px' });
stages.forEach((s) => io.observe(s));
