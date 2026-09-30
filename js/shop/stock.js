// Data & logika stok toko — murni, tanpa three.js.
export const ITEMS = {
  beras: { nama: 'Beras', harga: 12000, modal: 9000 },
  minyak: { nama: 'Minyak Goreng', harga: 20000, modal: 16000 },
  gula: { nama: 'Gula', harga: 15000, modal: 12000 },
  telur: { nama: 'Telur', harga: 2000, modal: 1500 },
  mie: { nama: 'Mie Instan', harga: 3500, modal: 2500 },
  kopi: { nama: 'Kopi', harga: 10000, modal: 7000 },
  teh: { nama: 'Teh', harga: 8000, modal: 6000 },
  sabun: { nama: 'Sabun', harga: 5000, modal: 3500 },
};

export function createStock() {
  const qty = {};
  for (const id of Object.keys(ITEMS)) qty[id] = 0;
  return {
    qty,
    add(id, n) {
      if (!(id in ITEMS) || n <= 0) return;
      qty[id] += n;
    },
    // return false bila stok kurang; qty tidak boleh negatif.
    take(id, n) {
      if (!(id in ITEMS) || n <= 0) return false;
      if (qty[id] < n) return false;
      qty[id] -= n;
      return true;
    },
  };
}

// Total modal sebuah keranjang {id: qty} — untuk hitung laba.
export function nilaiModal(cart) {
  let total = 0;
  for (const [id, n] of Object.entries(cart)) {
    if (id in ITEMS) total += ITEMS[id].modal * n;
  }
  return total;
}
