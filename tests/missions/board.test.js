import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, createBoard, createAchievements } from '../../js/missions/board.js';
import { createInventory } from '../../js/player/inventory.js';

test('misi antar: inventory kosong -> ok:false', () => {
  const board = createBoard();
  const inv = createInventory();
  board.accept('antar-beras');
  const r = board.complete('antar-beras', inv);
  assert.equal(r.ok, false);
  assert.ok(r.pesan.length > 0);
});

test('misi antar: bawa barang -> ok:true dan barang diambil', () => {
  const board = createBoard();
  const inv = createInventory();
  board.accept('antar-beras');
  inv.add('beras', 1);
  const r = board.complete('antar-beras', inv);
  assert.equal(r.ok, true);
  assert.ok(r.upah > 0);
  assert.equal(inv.has('beras', 1), false);
});

test('misi kunjungi: progress 3x -> selesai', () => {
  const board = createBoard();
  board.accept('tagih-iuran');
  board.progress('tagih-iuran', { kunjungan: true });
  board.progress('tagih-iuran', { kunjungan: true });
  const done = board.progress('tagih-iuran', { kunjungan: true });
  assert.equal(done.selesai, true);
  assert.ok(done.upah > 0);
});

test('misi belum diterima tidak bisa progress/complete', () => {
  const board = createBoard();
  const inv = createInventory();
  inv.add('beras', 1);
  assert.equal(board.complete('antar-beras', inv).ok, false);
  assert.equal(board.progress('tagih-iuran', { kunjungan: true }).selesai, false);
});

test('ada 5 misi sesuai spec', () => {
  assert.equal(MISSIONS.length, 5);
  assert.deepEqual(MISSIONS.map((m) => m.id), [
    'antar-beras', 'panen-singkong', 'tagih-iuran', 'restok-gula', 'antar-kopi',
  ]);
});

test('achievement 10 misi terbuka setelah 10 misi selesai', () => {
  const a = createAchievements();
  assert.deepEqual(a.buka({ misiSelesai: 9, hariBuka: 0 }), []);
  assert.deepEqual(a.buka({ misiSelesai: 10, hariBuka: 0 }), ['misi-10']);
  assert.equal(a.daftar.find((d) => d.id === 'misi-10').terbuka, true);
});

test('achievement 7 hari buka berturut-turut', () => {
  const a = createAchievements();
  assert.deepEqual(a.buka({ misiSelesai: 0, hariBuka: 7 }), ['buka-7']);
});

test('resetHarian: misi bisa diulang, totalSelesai kumulatif', () => {
  const board = createBoard();
  const inv = createInventory();
  board.accept('antar-beras');
  inv.add('beras', 1);
  assert.equal(board.complete('antar-beras', inv).ok, true);
  assert.equal(board.totalSelesai, 1);
  board.resetHarian();
  assert.equal(board.totalSelesai, 1); // kumulatif, tidak ikut reset
  const st = board.daftar.find((m) => m.id === 'antar-beras');
  assert.equal(st.selesai, false);
  assert.equal(st.diterima, false);
  board.accept('antar-beras');
  inv.add('beras', 1);
  assert.equal(board.complete('antar-beras', inv).ok, true);
  assert.equal(board.totalSelesai, 2);
});

test('progress auto-selesai lalu complete(): tidak reward ganda', () => {
  const board = createBoard();
  board.accept('tagih-iuran');
  board.progress('tagih-iuran', { kunjungan: true });
  board.progress('tagih-iuran', { kunjungan: true });
  const done = board.progress('tagih-iuran', { kunjungan: true });
  assert.equal(done.selesai, true);
  assert.equal(board.totalSelesai, 1);
  const inv = createInventory();
  const r = board.complete('tagih-iuran', inv);
  assert.equal(r.ok, false);
  assert.equal(board.totalSelesai, 1); // tidak naik lagi
});

test('complete tanpa inventory tidak crash', () => {
  const board = createBoard();
  board.accept('antar-beras');
  const r = board.complete('antar-beras', undefined);
  assert.equal(r.ok, false);
  assert.ok(r.pesan.length > 0);
});
