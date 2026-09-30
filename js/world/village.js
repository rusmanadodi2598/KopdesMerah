import * as THREE from '../../vendor/three.module.js';
import { buildKopdes } from './kopdes.js';

// Desa kecil: siang cerah, cozy. Satuan meter; +x ke kanan, +z ke selatan (ke viewer).
// Material standar + bayangan lembut + detail (rumput, bunga, lampu, awan).
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

  // Material standar: respons cahaya matahari + bayangan lebih hidup.
  const std = (warna, rough = 0.92) =>
    new THREE.MeshStandardMaterial({ color: warna, roughness: rough, metalness: 0 });

  const tambah = (mesh, bayang = false) => {
    if (bayang) { mesh.castShadow = true; mesh.receiveShadow = true; }
    scene.add(mesh);
    return mesh;
  };
  const kotak = (w, h, d, warna, x, z, y = h / 2, bayang = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(warna));
    m.position.set(x, y, z);
    return tambah(m, bayang);
  };
  const collider = (x, z, w, d, tag) => {
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, tag });
  };
  const diLuarZona = (x, z, zona) =>
    !zona.some((zn) => (x - zn.x) ** 2 + (z - zn.z) ** 2 < zn.r ** 2);
  const dummy = new THREE.Object3D();
  const tmpWarna = new THREE.Color();

  // Tanah & cahaya langit
  const tanah = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), std(0x79c74f));
  tanah.rotation.x = -Math.PI / 2;
  tanah.receiveShadow = true;
  tambah(tanah);
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x6a8f5f, 0.85);
  tambah(hemi);

  // Jalan utama (sumbu x, z=8) + setapak ke kopdes
  const jalan = new THREE.Mesh(new THREE.PlaneGeometry(88, 4), std(0xb08d5f, 1));
  jalan.rotation.x = -Math.PI / 2;
  jalan.position.set(0, 0.02, 8);
  jalan.receiveShadow = true;
  tambah(jalan);
  const setapak = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 7), std(0xbfa06e, 1));
  setapak.rotation.x = -Math.PI / 2;
  setapak.position.set(0, 0.02, 4.5);
  setapak.receiveShadow = true;
  tambah(setapak);

  // Gapura di kedua ujung jalan
  for (const gx of [-38, 38]) {
    kotak(0.8, 5, 0.8, 0x8b5a2b, gx - 2.5, 8);
    kotak(0.8, 5, 0.8, 0x8b5a2b, gx + 2.5, 8);
    kotak(6.4, 1, 1, 0xc8102e, gx, 8, 5.2);
    tambah(banner('SELAMAT DATANG DI DESA MAJU', 5.6, gx, 4.4, 8.55));
    collider(gx - 2.5, 8, 0.8, 0.8);
    collider(gx + 2.5, 8, 0.8, 0.8);
  }

  // Gedung Kopdes (level 1) — markas. Collider diambil dari ukuran gedung
  // agar sinkron saat Task 11 menukar gedung naik level.
  const kopdes = buildKopdes(1);
  kopdes.position.set(0, 0, -2);
  kopdes.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  tambah(kopdes);
  collider(0, -2, kopdes.userData.ukuran.w, kopdes.userData.ukuran.d, 'kopdes');

  // Gudang di belakang kopdes
  kotak(3, 2.5, 3, 0x9c7a4d, -8, -8);
  collider(-8, -8, 3, 3);

  // Papan misi di depan kopdes
  kotak(0.25, 1.6, 0.25, 0x6b4a2f, 4.4, 3);
  kotak(0.25, 1.6, 0.25, 0x6b4a2f, 5.6, 3);
  kotak(1.8, 1.1, 0.12, 0x8b5a2b, 5, 3, 1.5);

  // Rumah warga: badan + atap + bingkai jendela + pintu + anak tangga
  for (const r of RUMAH) {
    kotak(5, 3.5, 4, r.warna, r.x, r.z);
    const atap = new THREE.Mesh(new THREE.ConeGeometry(4.1, 1.8, 4), std(0xa33b2e));
    atap.rotation.y = Math.PI / 4;
    atap.position.set(r.x, 3.5 + 0.9, r.z);
    atap.scale.set(1, 1, 0.82);
    tambah(atap, true);
    // Bingkai jendela putih + kaca
    for (const jx of [-1.5, 1.5]) {
      const bingkai = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.1), std(0xffffff, 0.7));
      bingkai.position.set(r.x + jx, 2.1, r.z + 2.02);
      tambah(bingkai);
      const kaca = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x9fc5e8, roughness: 0.25, metalness: 0.1 }),
      );
      kaca.position.set(r.x + jx, 2.1, r.z + 2.04);
      tambah(kaca);
    }
    kotak(1.1, 2, 0.15, 0x5b3a1e, r.x, r.z + 2.05, 1); // pintu
    kotak(1.6, 0.25, 0.9, 0xd9cfc0, r.x, r.z + 2.5, 0.12); // anak tangga
    // Cerobong asap di atap
    const cerobong = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), std(0x8a7f70));
    cerobong.position.set(r.x + 1.5, 4.7, r.z - 0.8);
    tambah(cerobong, true);
    collider(r.x, r.z, 5, 4);
  }

  // Asap cerobong: sprite lembut yang naik, membesar, memudar (butuh DOM).
  const asap = [];
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g2 = c.getContext('2d');
    const grad = g2.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(245,245,245,0.9)');
    grad.addColorStop(1, 'rgba(245,245,245,0)');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 64, 64);
    const texAsap = new THREE.CanvasTexture(c);
    for (const r of RUMAH) {
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texAsap, transparent: true, opacity: 0.3, depthWrite: false,
        }));
        s.userData = { cx: r.x + 1.5, cy: 5.4, cz: r.z - 0.8, t: Math.random() };
        tambah(s);
        asap.push(s);
      }
    }
  }

  // Daun berguguran: instanced, melayang turun + bergoyang.
  const N_DAUN = 36;
  const daunJatuh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.24, 0.24),
    new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
    N_DAUN,
  );
  const dataDaun = [];
  for (let i = 0; i < N_DAUN; i++) {
    dataDaun.push({
      x: (Math.random() * 2 - 1) * 45,
      y: Math.random() * 7,
      z: (Math.random() * 2 - 1) * 40,
      vy: 0.45 + Math.random() * 0.5,
      f: Math.random() * 6.28,
    });
    daunJatuh.setColorAt(i, tmpWarna.setHSL(0.12 + Math.random() * 0.13, 0.6, 0.45));
  }
  daunJatuh.instanceColor.needsUpdate = true;
  tambah(daunJatuh);

  // Sawah: petak-petak hijau
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      kotak(2.2, 0.35, 2.2, (i + j) % 2 ? 0x5da24a : 0x6fbf5a, -32 + i * 2.7, -31 + j * 2.7, 0.17);
    }
  }

  // Balai desa
  kotak(8, 4, 6, 0xe8dcc0, 26, -24);
  const atapBalai = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.2, 4), std(0x8b2f24));
  atapBalai.rotation.y = Math.PI / 4;
  atapBalai.position.set(26, 5.1, -24);
  atapBalai.scale.set(1, 1, 0.78);
  tambah(atapBalai, true);
  tambah(banner('BALAI DESA', 5, 26, 3.2, -20.9));
  collider(26, -24, 8, 6);

  // Lampu jalan di sepanjang jalan utama
  for (const lx of [-24, -8, 8, 24]) {
    const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 8), std(0x3f4753, 0.6));
    tiang.position.set(lx, 1.7, 5.2);
    tambah(tiang, true);
    const kepala = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0xfff3c4, emissive: 0xffe9a8, emissiveIntensity: 0.45, roughness: 0.4,
      }),
    );
    kepala.position.set(lx, 3.55, 5.2);
    tambah(kepala);
  }

  // Zona larangan untuk vegetasi acak
  const zonaLarangan = [
    { x: 0, z: -2, r: 8 }, { x: -8, z: -8, r: 4 }, { x: 5, z: 3, r: 3 },
    { x: -28, z: -28, r: 10 }, { x: 26, z: -24, r: 9 },
    ...RUMAH.map((r) => ({ x: r.x, z: r.z, r: 6 })),
  ];
  const acakBebas = (n, y0 = 0) => {
    const hasil = [];
    let guard = 0;
    while (hasil.length < n && guard++ < 3000) {
      const x = (Math.random() * 2 - 1) * 52;
      const z = (Math.random() * 2 - 1) * 46;
      if (Math.abs(z - 8) < 4.5 && Math.abs(x) < 46) continue; // jalan
      if (!diLuarZona(x, z, zonaLarangan)) continue;
      hasil.push({ x, z, s: 0.7 + Math.random() * 0.7 });
    }
    return hasil;
  };

  // Pohon: InstancedMesh (batang + daun) — murah untuk HP; variasi warna daun.
  const posisiPohon = acakBebas(44);
  const batang = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.25, 1.6, 6), std(0x6b4a2f), posisiPohon.length);
  const daun = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.3, 2.6, 7), std(0x3f8f3a), posisiPohon.length);
  posisiPohon.forEach((p, i) => {
    dummy.position.set(p.x, 0.8 * p.s, p.z);
    dummy.scale.setScalar(p.s);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.updateMatrix();
    batang.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x, (1.6 + 1.1) * p.s, p.z);
    dummy.updateMatrix();
    daun.setMatrixAt(i, dummy.matrix);
    tmpWarna.setHSL(0.29 + Math.random() * 0.05, 0.55, 0.32 + Math.random() * 0.12);
    daun.setColorAt(i, tmpWarna);
  });
  daun.instanceColor.needsUpdate = true;
  batang.castShadow = true;
  daun.castShadow = true;
  tambah(batang);
  tambah(daun);

  // Rumput liar: cone kecil instanced
  const rumput = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.09, 0.38, 5), std(0x8bd95e), 150);
  acakBebas(150).forEach((p, i) => {
    dummy.position.set(p.x, 0.16 * p.s, p.z);
    dummy.scale.setScalar(p.s);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.updateMatrix();
    rumput.setMatrixAt(i, dummy.matrix);
  });
  tambah(rumput);

  // Bunga: bola kecil warna-warni instanced
  const bunga = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.11, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.8 }), 60);
  const WARNA_BUNGA = [0xff8fb3, 0xffd166, 0xffffff, 0xff6b6b];
  acakBebas(60).forEach((p, i) => {
    dummy.position.set(p.x, 0.28 * p.s, p.z);
    dummy.scale.setScalar(p.s);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    bunga.setMatrixAt(i, dummy.matrix);
    bunga.setColorAt(i, tmpWarna.set(WARNA_BUNGA[i % WARNA_BUNGA.length]));
  });
  bunga.instanceColor.needsUpdate = true;
  tambah(bunga);

  // Batu hias
  for (let i = 0; i < 9; i++) {
    const p = acakBebas(1)[0];
    if (!p) continue;
    const batu = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 * p.s, 0), std(0x9aa3ab, 1));
    batu.position.set(p.x, 0.2 * p.s, p.z);
    batu.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    tambah(batu, true);
  }

  // Bedeng bunga di depan tiap rumah
  for (const r of RUMAH) {
    for (let i = 0; i < 5; i++) {
      const bed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0),
        std(WARNA_BUNGA[(i + Math.abs(Math.round(r.x))) % WARNA_BUNGA.length], 0.8));
      bed.position.set(r.x - 2 + i, 0.3, r.z + 3.4);
      tambah(bed);
    }
  }

  // Awan: gumpalan bola pipih, melayang pelan.
  const awan = [];
  const matAwan = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 1.4, 10, 8), matAwan);
      s.position.set(j * 2.2 - n, Math.random() * 0.8, Math.random() * 1.2 - 0.6);
      s.scale.y = 0.55;
      g.add(s);
    }
    g.position.set((Math.random() * 2 - 1) * 70, 12 + Math.random() * 4, (Math.random() * 2 - 1) * 60 - 10);
    g.scale.setScalar(1.9);
    tambah(g);
    awan.push({ g, v: 0.35 + Math.random() * 0.35 });
  }

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

  // Tick animasi desa (awan melayang, asap cerobong, daun gugur).
  // Dipanggil dari loop utama.
  function tick(dt) {
    for (const a of awan) {
      a.g.position.x += a.v * dt;
      if (a.g.position.x > 95) a.g.position.x = -95;
    }
    for (const s of asap) {
      const u = s.userData;
      u.t += dt * 0.22;
      if (u.t > 1) u.t = 0;
      s.position.set(
        u.cx + Math.sin(u.t * 5) * 0.4 + u.t * 1.4,
        u.cy + u.t * 3.4,
        u.cz + Math.cos(u.t * 4) * 0.3,
      );
      const sk = 0.7 + u.t * 2;
      s.scale.set(sk, sk, 1);
      s.material.opacity = 0.3 * (1 - u.t);
    }
    dataDaun.forEach((d, i) => {
      d.y -= d.vy * dt;
      d.f += dt * 1.6;
      if (d.y < 0.15) {
        d.y = 5 + Math.random() * 3;
        d.x = (Math.random() * 2 - 1) * 45;
        d.z = (Math.random() * 2 - 1) * 40;
      }
      dummy.position.set(d.x + Math.sin(d.f) * 0.9, d.y, d.z);
      dummy.rotation.set(d.f * 0.7, d.f, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      daunJatuh.setMatrixAt(i, dummy.matrix);
    });
    daunJatuh.instanceMatrix.needsUpdate = true;
  }

  return { colliders, spots, kopdes, tick };
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
