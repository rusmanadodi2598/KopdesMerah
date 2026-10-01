// Buku Catatan Misteri — jurnal petunjuk pemain.
// Murni data + render DOM; buka/tutup diatur main.js (tombol J).

export function createJournal() {
  const j = { petunjuk: [] }; // {episode, judul, teks}
  return {
    tambah(episode, judul, teks) {
      if (!judul) return;
      j.petunjuk.push({ episode, judul, teks });
    },
    daftar() {
      return j.petunjuk.map((p) => ({ ...p }));
    },
    jumlah() {
      return j.petunjuk.length;
    },
  };
}

export function renderJournal(el, journal) {
  const daftar = journal.daftar();
  const isi =
    daftar.length === 0
      ? '<p class="jurnal-kosong">Belum ada petunjuk. Petunjuk tercatat otomatis saat episode berjalan.</p>'
      : `<ol class="jurnal-daftar">${daftar
          .map((p, i) => `<li><strong>#${i + 1} — ${p.judul}</strong><span>${p.teks}</span></li>`)
          .join('')}</ol>`;
  el.innerHTML =
    `<div class="panel jurnal-panel"><h2>📖 Buku Catatan Misteri</h2>${isi}` +
    `<button type="button" data-tutup>Tutup (J)</button></div>`;
  el.hidden = false;
  const btn = el.querySelector('[data-tutup]');
  if (btn && typeof btn.addEventListener === 'function') {
    btn.addEventListener('click', () => {
      el.hidden = true;
    });
  }
}

export function sembunyiJournal(el) {
  el.hidden = true;
}
