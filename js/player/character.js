import * as THREE from '../../vendor/three.module.js';
import { resolveCircle } from '../world/collision.js';

const JALAN = 4; // m/s
const LARI = 7; // m/s (tahan Shift)
const RADIUS = 0.4;

const _targetKamera = new THREE.Vector3();

function bangunMesh() {
  const g = new THREE.Group();
  const std = (warna, rough = 0.85) =>
    new THREE.MeshStandardMaterial({ color: warna, roughness: rough, metalness: 0 });
  const badan = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.7, 4, 10),
    std(0x2b6cb0),
  );
  badan.position.y = 0.85;
  g.add(badan);
  const kepala = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 10),
    std(0xf2c89b, 0.7),
  );
  kepala.position.y = 1.62;
  g.add(kepala);
  // Topi merah khas Kopdes
  const topi = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.28, 0.16, 12), std(0xc8102e, 0.8));
  topi.position.y = 1.82;
  g.add(topi);
  const lidah = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.04, 12, 1, false, 0, Math.PI), std(0xc8102e, 0.8));
  lidah.position.set(0, 1.76, 0.14);
  g.add(lidah);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}

export function createPlayer() {
  const group = bangunMesh();
  const pos = { x: 2, z: 8 }; // mulai di jalan dekat setapak kopdes
  group.position.set(pos.x, 0, pos.z);

  function update(dt, input, colliders) {
    let mx = 0;
    let mz = 0;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) mz -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) mz += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) mx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) mx += 1;
    const t = input.touch;
    if (t && t.active) {
      mx += t.dx;
      mz += t.dy;
    }
    const len = Math.hypot(mx, mz);
    if (len > 0.01) {
      const norm = Math.max(len, 1);
      const nx = mx / norm;
      const nz = mz / norm;
      const lari = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
      const speed = lari ? LARI : JALAN;
      pos.x += nx * speed * dt;
      pos.z += nz * speed * dt;
      group.rotation.y = Math.atan2(nx, nz);
      const p = resolveCircle(pos, RADIUS, colliders);
      pos.x = p.x;
      pos.z = p.z;
    }
    group.position.set(pos.x, 0, pos.z);
  }

  return { group, pos, update };
}

// Kamera di belakang-bahu: offset (0, 3.5, 6), smooth follow.
export function updateCamera(camera, player, dt) {
  _targetKamera.set(player.pos.x, 3.5, player.pos.z + 6);
  camera.position.lerp(_targetKamera, Math.min(8 * dt, 1));
  camera.lookAt(player.pos.x, 1.2, player.pos.z);
}
