import test from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, renderJournal, sembunyiJournal } from '../../js/ui/journal.js';

function elPalsu() {
  return { innerHTML: '', hidden: true, querySelector: () => null };
}

test('tambah/daftar/jumlah mencatat petunjuk berurutan', () => {
  const j = createJournal();
  assert.equal(j.jumlah(), 0);
  j.tambah('e01', 'Tawa di dalam kabut', 'Terdengar dua kali.');
  j.tambah('e01', 'Lentera ayah', 'Mbah Sari tahu soal ini.');
  assert.equal(j.jumlah(), 2);
  const d = j.daftar();
  assert.equal(d[0].judul, 'Tawa di dalam kabut');
  assert.equal(d[1].teks, 'Mbah Sari tahu soal ini.');
  d[0].judul = 'diubah';
  assert.equal(j.daftar()[0].judul, 'Tawa di dalam kabut'); // salinan, bukan referensi
});

test('tambah tanpa judul diabaikan', () => {
  const j = createJournal();
  j.tambah('e01', '', 'teks');
  assert.equal(j.jumlah(), 0);
});

test('renderJournal menampilkan daftar petunjuk bernomor', () => {
  const j = createJournal();
  j.tambah('e01', 'Tawa di dalam kabut', 'Terdengar dua kali.');
  const el = elPalsu();
  renderJournal(el, j);
  assert.equal(el.hidden, false);
  assert.ok(el.innerHTML.includes('Buku Catatan Misteri'));
  assert.ok(el.innerHTML.includes('#1 — Tawa di dalam kabut'));
  assert.ok(el.innerHTML.includes('Terdengar dua kali.'));
});

test('renderJournal kosong menampilkan pesan ramah', () => {
  const j = createJournal();
  const el = elPalsu();
  renderJournal(el, j);
  assert.ok(el.innerHTML.includes('Belum ada petunjuk'));
});

test('sembunyiJournal menyembunyikan panel', () => {
  const el = elPalsu();
  el.hidden = false;
  sembunyiJournal(el);
  assert.equal(el.hidden, true);
});
