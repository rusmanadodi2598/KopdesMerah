import * as THREE from '../../vendor/three.module.js';
import { buildKopdes } from './kopdes.js';

// Desa kecil: siang cerah, cozy. Satuan meter; +x ke kanan, +z ke selatan (ke viewer).
export function buildVillage(scene) {
  const colliders = [];
  const RUMAH = [
    { id: 'rumah-burt', nama: 'Bu RT', x: -18, z: -10, warna: 0xf7e8c9 },
    { id: 'rumah-pakkades', nama: 'Pak Kades', x: 18, z: -10, warna: 0xcfe3f7 },
    { id: 'rumah-w1', nama: 'Warga 1', x: -30, z: 16, warna: 0xf7e08b },
    { id: 'rumah-w2', nama: 'Warga 2', x: -12, z: 20, warna: 0xbfe3b4 },
    { id: 'rumah-w3', nama: 'Warga 3', x: 12, z: 20, warna: 0xf5c396 },
    { id: 'rumah-w4', nama: 'Warga 4', x: 30, z: 16, warna: 0xd9c2f0 },
  ];

  const tambah = (mesh) => { scene.add(mesh); return mesh; };
  const kotak = (w, h, d, warna, x, z, y = h / 2) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: warna }),
    );
    m.position.set(x, y, z);
    return tambah(m);
  };
  const collider = (x, z, w, d) => {
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  };

  // Tanah & langit
  const tanah = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    new THREE.MeshLambertMaterial({ color: 0x7ec850 }),
  );
  tanah.rotation.x = -Math.PI / 2;
  tambah(tanah);
  tambah(new THREE.HemisphereLight(0xbfd9ff, 0x6a8f5f, 1.0));

  // Jalan utama (sumbu x, z=8) + setapak ke kopdes
  const jalan = new THREE.Mesh(
    new THREE.PlaneGeometry(88, 4),
    new THREE.MeshLambertMaterial({ color: 0xb08d5f }),
  );
  jalan.rotation.x = -Math.PI / 2;
  jalan.position.set(0, 0.02, 8);
  tambah(jalan);
  const setapak = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 7),
    new THREE.MeshLambertMaterial({ color: 0xb08d5f }),
  );
  setapak.rotation.x = -Math.PI / 2;
  setapak.position.set(0, 0.02, 4.5);
  tambah(setapak);

  // Gapura di kedua ujung jalan
  for (const gx of [-38, 38]) {
    const p1 = kotak(0.8, 5, 0.8, 0x8b5a2b, gx - 2.5, 8);
    const p2 = kotak(0.8, 5, 0.8, 0x8b5a2b, gx + 2.5, 8);
    const balok = kotak(6.4, 1, 1, 0xc8102e, gx, 8, 5.2);
    tambah(banner('SELAMAT DATANG DI DESA MAJU', 5.6, gx, 4.4, 8.55));
    collider(gx - 2.5, 8, 0.8, 0.8);
    collider(gx + 2.5, 8, 0.8, 0.8);
    void p1; void p2; void balok;
  }

  // Gedung Kopdes (level 1) — markas
  const kopdes = buildKopdes(1);
  kopdes.position.set(0, 0, -2);
  tambah(kopdes);
  collider(0, -2, 6, 5);

  // Gudang di belakang kopdes
  kotak(3, 2.5, 3, 0x9c7a4d, -8, -8);
  collider(-8, -8, 3, 3);

  // Papan misi di depan kopdes
  kotak(0.25, 1.6, 0.25, 0x6b4a2f, 4.4, 3);
  kotak(0.25, 1.6, 0.25, 0x6b4a2f, 5.6, 3);
  const papan = kotak(1.8, 1.1, 0.12, 0x8b5a2b, 5, 3, 1.5);
  void papan;

  // Rumah warga
  for (const r of RUMAH) {
    kotak(5, 3.5, 4, r.warna, r.x, r.z);
    const atap = new THREE.Mesh(
      new THREE.ConeGeometry(4.1, 1.8, 4),
      new THREE.MeshLambertMaterial({ color: 0xa33b2e }),
    );
    atap.rotation.y = Math.PI / 4;
    atap.position.set(r.x, 3.5 + 0.9, r.z);
    atap.scale.set(1, 1, 0.82);
    tambah(atap);
    kotak(1.1, 2, 0.15, 0x5b3a1e, r.x, r.z + 2.05, 1);
    collider(r.x, r.z, 5, 4);
  }

  // Sawah: petak-petak hijau
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      kotak(2.2, 0.35, 2.2, (i + j) % 2 ? 0x5da24a : 0x6fbf5a, -32 + i * 2.7, -31 + j * 2.7, 0.17);
    }
  }

  // Balai desa
  kotak(8, 4, 6, 0xe8dcc0, 26, -24);
  const atapBalai = new THREE.Mesh(
    new THREE.ConeGeometry(6.2, 2.2, 4),
    new THREE.MeshLambertMaterial({ color: 0x8b2f24 }),
  );
  atapBalai.rotation.y = Math.PI / 4;
  atapBalai.position.set(26, 5.1, -24);
  atapBalai.scale.set(1, 1, 0.78);
  tambah(atapBalai);
  tambah(banner('BALAI DESA', 5, 26, 3.2, -20.9));
  collider(26, -24, 8, 6);

  // Pohon: InstancedMesh (batang + daun) — murah untuk HP
  const zonaLarangan = [
    { x: 0, z: -2, r: 8 }, { x: -8, z: -8, r: 4 }, { x: 5, z: 3, r: 3 },
    { x: -28, z: -28, r: 10 }, { x: 26, z: -24, r: 9 },
    ...RUMAH.map((r) => ({ x: r.x, z: r.z, r: 6 })),
  ];
  const posisiPohon = [];
  let guard = 0;
  while (posisiPohon.length < 44 && guard++ < 2000) {
    const x = (Math.random() * 2 - 1) * 52;
    const z = (Math.random() * 2 - 1) * 46;
    if (Math.abs(z - 8) < 4 && Math.abs(x) < 46) continue; // jalan
    if (zonaLarangan.some((zn) => (x - zn.x) ** 2 + (z - zn.z) ** 2 < zn.r ** 2)) continue;
    posisiPohon.push({ x, z, s: 0.8 + Math.random() * 0.6 });
  }
  const dummy = new THREE.Object3D();
  const batang = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.25, 1.6, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2f }),
    posisiPohon.length,
  );
  const daun = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.3, 2.6, 7),
    new THREE.MeshLambertMaterial({ color: 0x3f8f3a }),
    posisiPohon.length,
  );
  posisiPohon.forEach((p, i) => {
    dummy.position.set(p.x, 0.8 * p.s, p.z);
    dummy.scale.setScalar(p.s);
    dummy.updateMatrix();
    batang.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x, (1.6 + 1.1) * p.s, p.z);
    dummy.updateMatrix();
    daun.setMatrixAt(i, dummy.matrix);
  });
  tambah(batang);
  tambah(daun);

  const spots = {
    toko: {
      pos: { x: 0, z: 2 },
      kasir: { x: 0, z: 2.5 },
      antre: [
        { x: -3, z: 6 }, { x: -1, z: 6 }, { x: 1, z: 6 }, { x: 3, z: 6 },
      ],
    },
    gudang: { x: -8, z: -6 },
    papanMisi: { x: 5, z: 3 },
    rumah: RUMAH.map((r) => ({ id: r.id, nama: r.nama, pos: { x: r.x, z: r.z + 3.5 } })),
    sawah: { x: -28, z: -24 },
    balaiDesa: { x: 26, z: -19 },
  };
  return { colliders, spots };
}

// Banner teks via CanvasTexture (butuh DOM; di node kembalikan mesh polos).
function banner(text, lebar, x, y, z) {
  let mat;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#c8102e';
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#ffffff';
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 256, 34);
    mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) });
  } else {
    mat = new THREE.MeshBasicMaterial({ color: 0xc8102e });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(lebar, lebar * 0.125), mat);
  m.position.set(x, y, z);
  return m;
}
