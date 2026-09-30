import * as THREE from '../../vendor/three.module.js';

// Rig tubuh low-poly bersama: torso + kepala + lengan & kaki berporos,
// dengan ayunan jalan (dipakai pemain & warga).
const std = (warna, rough = 0.85) =>
  new THREE.MeshStandardMaterial({ color: warna, roughness: rough, metalness: 0 });

export function bangunTubuh({ baju = 0x2b6cb0, kulit = 0xf2c89b, celana = 0x3a4a5a, kepalaR = 0.26 } = {}) {
  const group = new THREE.Group();
  const rig = new THREE.Group(); // wadah bob agar tak mengganggu posisi group
  group.add(rig);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 10), std(baju));
  torso.position.y = 0.85;
  rig.add(torso);
  const kepala = new THREE.Mesh(new THREE.SphereGeometry(kepalaR, 12, 10), std(kulit, 0.7));
  kepala.position.y = 1.62;
  rig.add(kepala);

  const anggota = (r, len, mat, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
    m.position.y = -(len / 2 + r * 0.6);
    pivot.add(m);
    rig.add(pivot);
    return pivot;
  };
  const matLengan = std(kulit, 0.7);
  const matKaki = std(celana);
  const lenganKiri = anggota(0.09, 0.38, matLengan, -0.43, 1.2);
  const lenganKanan = anggota(0.09, 0.38, matLengan, 0.43, 1.2);
  const kakiKiri = anggota(0.11, 0.32, matKaki, -0.15, 0.52);
  const kakiKanan = anggota(0.11, 0.32, matKaki, 0.15, 0.52);
  const semua = [lenganKiri, lenganKanan, kakiKiri, kakiKanan];

  let fase = 0;
  function ayun(dt, bergerak, cepat = 1) {
    if (bergerak) {
      fase += dt * 9 * cepat;
      const a = Math.sin(fase);
      lenganKiri.rotation.x = a * 0.55;
      lenganKanan.rotation.x = -a * 0.55;
      kakiKiri.rotation.x = -a * 0.6;
      kakiKanan.rotation.x = a * 0.6;
      rig.position.y = Math.abs(Math.cos(fase)) * 0.05;
    } else {
      for (const p of semua) p.rotation.x *= 0.8;
      rig.position.y *= 0.8;
    }
  }

  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group, rig, ayun };
}
