// Level Kopdes & reputasi — murni, tanpa three.js.
// Reputasi naik dari: reward misi (per definisi misi) dan kepuasan harian
// >= 80 (+5). Wiring menaikkan level gedung (visual) saat level berubah.
export const LEVELS = [
  { level: 1, nama: 'Warung Kopdes', syaratReputasi: 0, bukaBarang: ['beras', 'gula', 'mie', 'teh'] },
  { level: 2, nama: 'Kopdes Maju', syaratReputasi: 100, bukaBarang: ['minyak', 'telur', 'kopi'] },
  { level: 3, nama: 'Kopdes Merah Putih', syaratReputasi: 250, bukaBarang: ['sabun'] },
];

// Level tertinggi yang syarat reputasinya terpenuhi.
export function levelUntuk(reputasi) {
  let hasil = LEVELS[0];
  for (const lv of LEVELS) {
    if (reputasi >= lv.syaratReputasi) hasil = lv;
  }
  return hasil;
}

// Daftar barang yang boleh dijual di level tertentu (kumulatif).
export function barangTerbuka(level) {
  const daftar = [];
  for (const lv of LEVELS) {
    if (lv.level <= level) daftar.push(...lv.bukaBarang);
  }
  return daftar;
}

// Bonus reputasi dari laporan harian: kepuasan >= 80 -> +5.
export function reputasiKepuasan(kepuasan) {
  return kepuasan >= 80 ? 5 : 0;
}
