// Level kualitas grafis ala tombol G Hutan Kabut: Tinggi / Sedang / Rendah.
// Murni + aman di node; terapkanKualitas memakai objek bebek (duck-typed)
// sehingga mudah diuji tanpa three.js.
export const TINGKAT = ['Tinggi', 'Sedang', 'Rendah'];
const KUNCI = 'kopdes3d_kualitas';

export function tingkatBerikutnya(t) {
  const i = TINGKAT.indexOf(t);
  return TINGKAT[(i + 1 + TINGKAT.length) % TINGKAT.length];
}

export function bacaKualitas() {
  if (typeof localStorage === 'undefined') return 'Tinggi';
  const t = localStorage.getItem(KUNCI);
  return TINGKAT.includes(t) ? t : 'Tinggi';
}

export function simpanKualitas(t) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(KUNCI, t);
}

// env: { renderer, scene, efek: { asap, daun } }.
// Tinggi: penuh. Sedang: piksel lebih rendah, tanpa daun. Rendah: tanpa
// bayangan & partikel (target 30fps HP kentang).
export function terapkanKualitas(env, tingkat) {
  const { renderer, scene, efek } = env;
  const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
  if (tingkat === 'Tinggi') {
    renderer.setPixelRatio(Math.min(dpr, 2));
    renderer.shadowMap.enabled = true;
    efek.asap.visible = true;
    efek.daun.visible = true;
  } else if (tingkat === 'Sedang') {
    renderer.setPixelRatio(Math.min(dpr, 1.25));
    renderer.shadowMap.enabled = true;
    efek.asap.visible = true;
    efek.daun.visible = false;
  } else {
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    efek.asap.visible = false;
    efek.daun.visible = false;
  }
  // Kompilasi ulang material agar perubahan bayangan berlaku.
  scene.traverse((o) => {
    if (!o.material) return;
    const daftar = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of daftar) m.needsUpdate = true;
  });
  simpanKualitas(tingkat);
}
