import { ITEMS } from './stock.js';

// Kasir idempoten: satu txId hanya diproses satu kali (anti double-charge
// saat tombol bayar di-spam). Hanya transaksi sukses yang diingat; yang
// gagal boleh dicoba lagi dengan txId yang sama maupun baru.
//
// Cache idempotensi hidup di instance kasir (bukan level modul) agar tidak
// bocor lintas sesi: wiring membuat instance baru tiap sesi/loadGame
// (lihat reset()). txId wajib diisi wiring; txId kosong ditolak berisik
// supaya bug wiring ketahuan, bukan salah charge diam-diam.
export function createCashier() {
  const sukses = new Map();

  return {
    checkout(cart, txId, stock) {
      if (!txId) return { total: 0, ok: false, pesan: 'txId kosong.' };
      if (sukses.has(txId)) return sukses.get(txId);

      let total = 0;
      for (const [id, n] of Object.entries(cart)) {
        const item = ITEMS[id];
        if (!item || (stock.qty[id] ?? 0) < n) {
          return { total: 0, ok: false };
        }
        total += item.harga * n;
      }
      for (const [id, n] of Object.entries(cart)) {
        stock.take(id, n);
      }
      const hasil = { total, ok: true };
      sukses.set(txId, hasil);
      return hasil;
    },

    // Dipanggil wiring saat sesi baru / loadGame agar txId sesi lama
    // tidak bertabrakan dengan cache sesi sebelumnya.
    reset() {
      sukses.clear();
    },
  };
}
