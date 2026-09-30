// Siklus hari toko + laporan harian — murni, tanpa three.js.
export function createDay() {
  const d = {
    hari: 1,
    fase: 'pagi', // pagi | buka | tutup
    omzet: 0,
    modalTerjual: 0,
    pembeli: 0,

    open() {
      if (d.fase === 'pagi') d.fase = 'buka';
    },

    recordSale(total, modal) {
      d.omzet += total;
      d.modalTerjual += modal;
      d.pembeli += 1;
    },

    close() {
      const laporan = {
        hari: d.hari,
        omzet: d.omzet,
        laba: d.omzet - d.modalTerjual,
        pembeli: d.pembeli,
        kepuasan: d.pembeli > 0 ? 100 : 70,
      };
      d.hari += 1;
      d.fase = 'pagi';
      d.omzet = 0;
      d.modalTerjual = 0;
      d.pembeli = 0;
      return laporan;
    },
  };
  return d;
}
