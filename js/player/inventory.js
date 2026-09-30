// Inventory pemain (tas untuk misi) — murni, tanpa three.js.
export function createInventory() {
  const isi = {};
  return {
    isi,
    add(id, n) {
      if (n <= 0) return;
      isi[id] = (isi[id] ?? 0) + n;
    },
    take(id, n) {
      if (n <= 0 || (isi[id] ?? 0) < n) return false;
      isi[id] -= n;
      return true;
    },
    has(id, n) {
      return (isi[id] ?? 0) >= n;
    },
  };
}
