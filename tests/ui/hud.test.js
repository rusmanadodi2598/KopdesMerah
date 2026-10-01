import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRupiah, hudModel } from '../../js/ui/hud.js';

test("formatRupiah(15000)==='Rp15.000'", () => {
  assert.equal(formatRupiah(15000), 'Rp15.000');
});

test("formatRupiah(0)==='Rp0'", () => {
  assert.equal(formatRupiah(0), 'Rp0');
});

test('formatRupiah jutaan memakai titik', () => {
  assert.equal(formatRupiah(2500000), 'Rp2.500.000');
});

test('hudModel memetakan field dengan benar', () => {
  const m = hudModel({ uang: 75000, hari: 3, reputasi: 120, level: 2, fase: 'buka' });
  assert.deepEqual(m, { uang: 'Rp75.000', hari: 3, reputasi: 120, level: 2, fase: 'buka', objektif: [] });
});

test('hudModel memetakan objektif misi aktif (maks 2)', () => {
  const misi = [
    { judul: 'Bantu panen singkong Pak Kades', aksi: 'panen', target: 3, progres: 1 },
    { judul: 'Antar beras ke Bu RT', tujuan: 'burt' },
    { judul: 'Misi ketiga', aksi: 'kunjungi', target: 2, progres: 0 },
  ];
  const m = hudModel({}, misi);
  assert.deepEqual(m.objektif, [
    '🎯 Bantu panen singkong Pak Kades 1/3',
    '🎯 Antar beras ke Bu RT',
  ]);
});

test('hudModel tahan field hilang', () => {
  const m = hudModel({});
  assert.equal(m.uang, 'Rp0');
  assert.equal(m.hari, 1);
  assert.equal(m.reputasi, 0);
  assert.equal(m.level, 1);
  assert.equal(m.fase, 'pagi');
});
