import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDialog, renderDialog, KECEPATAN_KETIK } from '../../js/ui/dialog.js';

const DUA_BARIS = [
  { pembicara: 'Raka', teks: 'Malam pertama.' },
  { pembicara: 'Mbah Sari', teks: 'Jangan sampai hilang.' },
];

test('mulai: baris pertama aktif, ketikan bertahap via tick', () => {
  const d = createDialog();
  d.mulai(DUA_BARIS, null);
  assert.equal(d.adaBaris, true);
  assert.equal(d.pembicara, 'Raka');
  assert.equal(d.teksTampil(), '');
  d.tick(1 / KECEPATAN_KETIK * 5);
  assert.equal(d.teksTampil(), 'Malam');
  assert.equal(d.selesaiMengetik, false);
});

test('tekan saat mengetik: langsung tampil penuh', () => {
  const d = createDialog();
  d.mulai(DUA_BARIS, null);
  d.tick(0.01);
  assert.equal(d.tekan(), true);
  assert.equal(d.teksTampil(), 'Malam pertama.');
  assert.equal(d.selesaiMengetik, true);
});

test('tekan saat penuh: lanjut ke baris berikutnya', () => {
  const d = createDialog();
  d.mulai(DUA_BARIS, null);
  d.tekan(); // selesaikan ketikan baris 1
  d.tekan(); // lanjut baris 2
  assert.equal(d.pembicara, 'Mbah Sari');
  assert.equal(d.sisaAntrean(), 0);
});

test('antrean habis: onSelesai dipanggil sekali', () => {
  const d = createDialog();
  let n = 0;
  d.mulai(DUA_BARIS, () => { n += 1; });
  d.tekan(); d.tekan(); // baris 1 selesai & lanjut
  d.tekan(); d.tekan(); // baris 2 selesai & lanjut → selesai
  assert.equal(n, 1);
  assert.equal(d.adaBaris, false);
  assert.equal(d.tekan(), false); // tidak ada baris: tidak konsumsi input
});

test('mulai([]): onSelesai langsung, tidak ada baris', () => {
  const d = createDialog();
  let n = 0;
  d.mulai([], () => { n += 1; });
  assert.equal(n, 1);
  assert.equal(d.adaBaris, false);
});

test('tutup: menghentikan dialog dan membatalkan callback', () => {
  const d = createDialog();
  let n = 0;
  d.mulai(DUA_BARIS, () => { n += 1; });
  d.tutup();
  assert.equal(d.adaBaris, false);
  assert.equal(n, 0);
});

function elPalsu() {
  const anak = {};
  return {
    hidden: true,
    innerHTML: '',
    querySelector(sel) {
      if (sel === '.dlg-nama') return anak.nama ?? null;
      if (sel === '.dlg-teks') return anak.teks ?? null;
      return null;
    },
    __pasang() {
      anak.nama = { textContent: '' };
      anak.teks = { textContent: '' };
      this.innerHTML = 'terpasang';
    },
  };
}

test('renderDialog: sembunyi saat tidak ada baris; tampilkan nama+teks', () => {
  const d = createDialog();
  const el = elPalsu();
  renderDialog(el, d);
  assert.equal(el.hidden, true);
  d.mulai(DUA_BARIS, null);
  el.__pasang();
  d.tick(10);
  renderDialog(el, d);
  assert.equal(el.hidden, false);
  assert.equal(el.querySelector('.dlg-teks').textContent, 'Malam pertama.');
});
