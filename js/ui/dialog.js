// Sistem dialog: antrean {pembicara, teks}, efek typewriter.
// E / klik / sentuh: tekan pertama menyelesaikan ketikan, tekan kedua
// lanjut ke baris berikutnya. Logika murni; renderDialog() jembatan DOM.

export const KECEPATAN_KETIK = 45; // karakter per detik

export function createDialog() {
  const d = {
    antre: [],
    baris: null, // {pembicara, teks}
    tampil: 0, // jumlah karakter yang sudah tampil
    onSelesai: null,
  };

  function lanjut() {
    d.baris = d.antre.shift() ?? null;
    d.tampil = 0;
    if (!d.baris) {
      const cb = d.onSelesai;
      d.onSelesai = null;
      cb?.();
    }
  }

  return {
    get adaBaris() { return d.baris !== null; },
    get pembicara() { return d.baris?.pembicara ?? ''; },
    get selesaiMengetik() {
      return d.baris ? d.tampil >= d.baris.teks.length : true;
    },
    teksTampil() {
      return d.baris ? d.baris.teks.slice(0, Math.floor(d.tampil)) : '';
    },
    sisaAntrean() { return d.antre.length; },
    mulai(daftar, onSelesai) {
      d.antre = (daftar ?? []).map((b) => ({
        pembicara: b.pembicara ?? '',
        teks: b.teks ?? '',
      }));
      d.onSelesai = onSelesai ?? null;
      lanjut();
    },
    // Kembalikan true bila dialog aktif (input terkonsumsi).
    tekan() {
      if (!d.baris) return false;
      if (d.tampil < d.baris.teks.length) d.tampil = d.baris.teks.length;
      else lanjut();
      return true;
    },
    tick(dt) {
      if (d.baris && d.tampil < d.baris.teks.length && dt > 0) {
        d.tampil = Math.min(d.baris.teks.length, d.tampil + KECEPATAN_KETIK * dt);
      }
    },
    tutup() {
      d.antre = [];
      d.baris = null;
      d.tampil = 0;
      d.onSelesai = null;
    },
  };
}

// Render tipis ke #dialog; sembunyikan saat tidak ada baris aktif.
export function renderDialog(el, dialog) {
  if (!dialog.adaBaris) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  let nama = el.querySelector('.dlg-nama');
  let teks = el.querySelector('.dlg-teks');
  if (!nama || !teks) {
    el.innerHTML = '<div class="dlg-nama"></div><div class="dlg-teks"></div>'
      + '<div class="dlg-hint">E ▸</div>';
    nama = el.querySelector('.dlg-nama');
    teks = el.querySelector('.dlg-teks');
  }
  if (nama.textContent !== dialog.pembicara) nama.textContent = dialog.pembicara;
  const t = dialog.teksTampil();
  if (teks.textContent !== t) teks.textContent = t;
}
