import * as THREE from 'three';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5e0); // biru langit

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 8, 14);
camera.lookAt(0, 0, 0);

// Tanah placeholder — diganti desa lengkap di Task 2
const tanah = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: 0x7ec850 }),
);
tanah.rotation.x = -Math.PI / 2;
scene.add(tanah);

scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x6a8f5f, 1.0));

const input = createInput();
input.attach(window);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const loop = createLoop({
  update(_dt) { /* Task 3+: gerak pemain, NPC, dsb */ },
  render() { renderer.render(scene, camera); },
});
loop.start();
