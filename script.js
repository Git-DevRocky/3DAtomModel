import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 12;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// === Bloom Composer ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,
  1.5,
  0.9
);
composer.addPass(bloomPass);

// === Lights ===
scene.add(new THREE.AmbientLight(0x404040, 1.5));
const pointLight = new THREE.PointLight(0x3366ff, 6, 30);
pointLight.position.set(0, 0, 10);
scene.add(pointLight);

// === Nucleus (glowing, always pulsing) ===
const nucleusMat = new THREE.MeshStandardMaterial({
  color: 0xffaa66,
  emissive: 0xff4400,
  emissiveIntensity: 3.5,
  roughness: 0.2,
  metalness: 0.5
});
const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), nucleusMat);
scene.add(nucleus);

// === Electron Setup ===
const electronMat = new THREE.MeshStandardMaterial({
  color: 0x3366ff,
  emissive: 0x000066,
  emissiveIntensity: 1.5,
  roughness: 0.1,
  metalness: 0.8
});

const trailMat = new THREE.LineBasicMaterial({
  color: 0x99ccff,
  transparent: true,
  opacity: 0.35
});

const orbitMat = new THREE.MeshBasicMaterial({
  color: 0x99ccff,
  transparent: true,
  opacity: 0.5
});

const baseRadius = 3.5;
const baseSpeed = 0.015 * 6;
const orbitGroups = [];

for (let i = 0; i < 3; i++) {
  const group = new THREE.Group();
  const electron = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), electronMat);

  const angleOffset = (i / 3) * Math.PI * 2;
  electron.position.set(
    baseRadius * Math.cos(angleOffset),
    baseRadius * Math.sin(angleOffset),
    0
  );
  group.add(electron);

  const theta = (i / 3) * Math.PI * 2;
  const phi = Math.PI / 4 + i * 0.4;
  group.rotation.x = phi;
  group.rotation.y = theta;
  scene.add(group);

  // Trail
  const trailGeo = new THREE.BufferGeometry();
  const trailPoints = [new THREE.Vector3(), new THREE.Vector3()];
  trailGeo.setFromPoints(trailPoints);
  const trail = new THREE.Line(trailGeo, trailMat);
  group.add(trail);

  // Orbit ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(baseRadius, 0.02, 8, 100),
    orbitMat
  );
  ring.rotation.x = phi;
  ring.rotation.y = theta;
  scene.add(ring);

  orbitGroups.push({ group, electron, angle: angleOffset, speed: baseSpeed, trail });
}

// === Atom Wrapper Group ===
const atom = new THREE.Group();
while (scene.children.length > 0) atom.add(scene.children[0]);
scene.add(atom);

// === Resize Handler ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// === Animate ===
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.02;

  // Nucleus glow pulse
  nucleus.material.emissiveIntensity = 3.556;
  const pulseScale = 1 + 0.02 * Math.sin(time * 2);
  nucleus.scale.set(pulseScale, pulseScale, pulseScale);

  orbitGroups.forEach((data) => {
    data.angle += data.speed;
    const x = baseRadius * Math.cos(data.angle);
    const y = baseRadius * Math.sin(data.angle);
    data.electron.position.set(x, y, 0);

    const trailPoints = [
      new THREE.Vector3(x, y, 0),
      data.electron.position.clone().multiplyScalar(0.95)
    ];
    data.trail.geometry.setFromPoints(trailPoints);
  });
//by https://github.com/Git-DevRocky
  atom.rotation.y += 0.002;
  atom.rotation.x += 0.001;

  controls.update();
  composer.render();
}
animate();