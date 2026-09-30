import * as THREE from '../../vendor/three.module.js';

// Gedung Kopdes 3 varian level. Ukuran bounding box HARUS membesar tiap level
// (dipin oleh tests/world/kopdes.test.js).
const VARIAN = {
  1: { w: 6, h: 3, d: 5, warna: 0xf5f0e1, nama: 'Warung Kopdes' },
  2: { w: 10, h: 4, d: 8, warna: 0xf5f0e1, nama: 'Kopdes Maju' },
  3: { w: 10, h: 7, d: 8, warna: 0xfff8e7, nama: 'Kopdes Merah Putih' },
};

const std = (warna, rough = 0.9) =>
  new THREE.MeshStandardMaterial({ color: warna, roughness: rough, metalness: 0 });

function teksturSpanduk(text) {
  // CanvasTexture butuh DOM; di node (unit test) fallback banner polos.
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#c8102e';
  g.fillRect(0, 0, 512, 96);
  g.fillStyle = '#ffffff';
  g.font = 'bold 40px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 50);
  return new THREE.CanvasTexture(c);
}

function spanduk(text, lebar) {
  const tex = teksturSpanduk(text);
  const mat = tex
    ? new THREE.MeshBasicMaterial({ map: tex })
    : new THREE.MeshBasicMaterial({ color: 0xc8102e });
  return new THREE.Mesh(new THREE.PlaneGeometry(lebar, lebar * 0.1875), mat);
}

function atapPiramid(w, d, warna) {
  const geo = new THREE.ConeGeometry(Math.hypot(w, d) / 2, Math.min(w, d) * 0.45, 4);
  const m = new THREE.Mesh(geo, std(warna));
  m.rotation.y = Math.PI / 4;
  return m;
}

// Kanopi garis merah-putih di atas pintu (ciri khas Kopdes).
function kanopi(lebar) {
  const g = new THREE.Group();
  const n = 7;
  const seg = lebar / n;
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(seg + 0.02, 0.08, 1.1),
      std(i % 2 ? 0xffffff : 0xc8102e, 0.8),
    );
    s.position.set(-lebar / 2 + seg * (i + 0.5), 0, 0);
    g.add(s);
  }
  g.rotation.x = -0.18;
  return g;
}

export function buildKopdes(level) {
  const v = VARIAN[level] ?? VARIAN[1];
  const g = new THREE.Group();
  const { w, h, d } = v;

  const badan = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(v.warna));
  badan.position.y = h / 2;
  g.add(badan);

  // Pondasi: listplang bawah lebih gelap
  const pondasi = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.25, 0.4, d + 0.25), std(0xcbbfa8));
  pondasi.position.y = 0.2;
  g.add(pondasi);

  // Garis lantai untuk gedung tingkat (level 3)
  if (level >= 3) {
    const sabuk = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.2, 0.25, d + 0.2), std(0xc8102e));
    sabuk.position.y = h / 2;
    g.add(sabuk);
  }

  const atap = atapPiramid(w, d, 0xa33b2e);
  atap.position.y = h + (Math.min(w, d) * 0.45) / 2;
  g.add(atap);

  // Pintu + anak tangga + kanopi di sisi depan (+z)
  const pintu = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 0.15), std(0x5b3a1e));
  pintu.position.set(0, 0.95, d / 2 + 0.05);
  g.add(pintu);
  const tangga = new THREE.Mesh(new THREE.BoxGeometry(2, 0.25, 1), std(0xd9cfc0));
  tangga.position.set(0, 0.12, d / 2 + 0.55);
  g.add(tangga);
  const kan = kanopi(3.2);
  kan.position.set(0, 2.02, d / 2 + 0.5);
  g.add(kan);

  // Jendela berbingkai putih
  const nJendela = level >= 2 ? 4 : 2;
  for (let i = 0; i < nJendela; i++) {
    const xoff = (i - (nJendela - 1) / 2) * (w / (nJendela + 0.5));
    const bingkai = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.12), std(0xffffff, 0.7));
    bingkai.position.set(xoff, h * 0.62, d / 2 + 0.04);
    g.add(bingkai);
    const j = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x9fc5e8, roughness: 0.25, metalness: 0.1 }),
    );
    j.position.set(xoff, h * 0.62, d / 2 + 0.05);
    g.add(j);
  }

  // Spanduk "KOPDES MERAH PUTIH" di depan atas (di atas kanopi, tidak tertutup)
  const sp = spanduk('KOPDES MERAH PUTIH', Math.min(w * 0.7, 5));
  sp.position.set(0, h - 0.5, d / 2 + 0.12);
  g.add(sp);

  // Placeholder rak & kasir (posisi gameplay, gaya warung: layani dari depan)
  const rak = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.8), std(0x8b5a2b));
  rak.position.set(-w / 4, 0.8, d / 2 + 1.2);
  g.add(rak);
  const kasir = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 0.8), std(0x6b4a2f));
  kasir.position.set(w / 4, 0.5, d / 2 + 1.2);
  g.add(kasir);

  // Ukuran tapak untuk collider: wiring membaca ini agar collider selalu
  // sinkron dengan level gedung (jangan hard-code ukuran di village.js).
  g.userData.ukuran = { w, d };

  return g;
}
