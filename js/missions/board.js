// Papan misi + achievement — murni, tanpa three.js.
// Alur: accept(id) di papan → kerjakan (progress untuk misi aksi / bawa
// barang untuk misi antar) → complete(id, inventory) untuk misi antar,
// progress() otomatis menyelesaikan misi aksi saat target tercapai.
export const MISSIONS = [
  { id: 'antar-beras', judul: 'Antar beras ke rumah Bu RT', butuh: { beras: 1 }, tujuan: 'rumah-burt', upah: 15000, reputasi: 10 },
  { id: 'panen-singkong', judul: 'Bantu panen singkong Pak Kades', aksi: 'panen', target: 3, tujuan: 'sawah', upah: 20000, reputasi: 15 },
  { id: 'tagih-iuran', judul: 'Tagih iuran anggota ke 3 rumah', aksi: 'kunjungi', target: 3, upah: 25000, reputasi: 15 },
  { id: 'restok-gula', judul: 'Stok ulang rak gula (5)', butuh: { gula: 5 }, tujuan: 'toko', upah: 10000, reputasi: 10 },
  { id: 'antar-kopi', judul: 'Antar kopi ke Balai Desa', butuh: { kopi: 2 }, tujuan: 'balaiDesa', upah: 20000, reputasi: 10 },
];

export function createBoard() {
  const status = {};
  for (const m of MISSIONS) {
    status[m.id] = { diterima: false, selesai: false, progres: 0 };
  }
  const cari = (id) => MISSIONS.find((m) => m.id === id);

  return {
    get daftar() {
      return MISSIONS.map((m) => ({ ...m, ...status[m.id] }));
    },
    accept(id) {
      const st = status[id];
      if (st && !st.selesai) st.diterima = true;
    },
    // Misi aksi (panen/kunjungi). Otomatis selesai saat target tercapai.
    progress(id, event) {
      const m = cari(id);
      const st = status[id];
      if (!m || !st || !st.diterima || st.selesai || !m.aksi) {
        return { selesai: false, upah: 0, reputasi: 0 };
      }
      if ((m.aksi === 'kunjungi' && event.kunjungan) || (m.aksi === 'panen' && event.panen)) {
        st.progres += 1;
      }
      if (st.progres >= m.target) {
        st.selesai = true;
        return { selesai: true, upah: m.upah, reputasi: m.reputasi };
      }
      return { selesai: false, upah: 0, reputasi: 0 };
    },
    // Misi antar (butuh barang). Ambil barang dari inventory saat selesai.
    complete(id, inventory) {
      const m = cari(id);
      const st = status[id];
      if (!m || !st) return { ok: false, pesan: 'Misi tidak dikenal.' };
      if (st.selesai) return { ok: false, pesan: 'Misi sudah selesai.' };
      if (!st.diterima) return { ok: false, pesan: 'Ambil misi di papan dulu.' };
      if (m.aksi) {
        if (st.progres >= m.target) {
          st.selesai = true;
          return { ok: true, pesan: 'Misi selesai!', upah: m.upah, reputasi: m.reputasi };
        }
        return { ok: false, pesan: `Kurang ${m.target - st.progres} lagi.` };
      }
      const kurang = Object.entries(m.butuh).filter(([bid, n]) => !inventory.has(bid, n));
      if (kurang.length > 0) {
        return { ok: false, pesan: `Butuh ${kurang.map(([bid, n]) => `${n} ${bid}`).join(', ')} di tas.` };
      }
      for (const [bid, n] of Object.entries(m.butuh)) inventory.take(bid, n);
      st.selesai = true;
      return { ok: true, pesan: 'Misi selesai!', upah: m.upah, reputasi: m.reputasi };
    },
  };
}

const ACHIEVEMENTS = [
  { id: 'misi-10', nama: '10 misi selesai', cek: (e) => e.misiSelesai >= 10 },
  { id: 'buka-7', nama: '7 hari buka berturut-turut', cek: (e) => e.hariBuka >= 7 },
];

export function createAchievements() {
  const terbuka = new Set();
  return {
    get daftar() {
      return ACHIEVEMENTS.map((d) => ({ id: d.id, nama: d.nama, terbuka: terbuka.has(d.id) }));
    },
    // event: { misiSelesai, hariBuka } → return id achievement yang baru terbuka.
    buka(event) {
      const baru = [];
      for (const d of ACHIEVEMENTS) {
        if (!terbuka.has(d.id) && d.cek(event)) {
          terbuka.add(d.id);
          baru.push(d.id);
        }
      }
      return baru;
    },
  };
}
