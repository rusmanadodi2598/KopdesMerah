import { ITEMS } from './stock.js';

// Kasir idempoten: satu txId hanya diproses satu kali (anti double-charge
// saat tombol bayar di-spam). Hanya transaksi sukses yang diingat; yang
// gagal boleh dicoba lagi dengan txId baru dari wiring.
const sukses = new Map();

export function checkout(cart, txId, stock) {
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
}
