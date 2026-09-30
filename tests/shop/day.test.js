import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDay } from '../../js/shop/day.js';

test('2 penjualan -> laba dan jumlah pembeli benar', () => {
  const d = createDay();
  d.open();
  d.recordSale(20000, 13000);
  d.recordSale(10000, 7000);
  const lap = d.close();
  assert.equal(lap.laba, 10000);
  assert.equal(lap.pembeli, 2);
  assert.equal(lap.omzet, 30000);
  assert.equal(lap.hari, 1);
});

test('tutup hari menaikkan hari dan mereset akumulasi', () => {
  const d = createDay();
  d.open();
  d.recordSale(5000, 3000);
  d.close();
  assert.equal(d.hari, 2);
  assert.equal(d.fase, 'pagi');
  assert.equal(d.omzet, 0);
  assert.equal(d.pembeli, 0);
});

test('fase berjalan pagi -> buka -> tutup', () => {
  const d = createDay();
  assert.equal(d.fase, 'pagi');
  d.open();
  assert.equal(d.fase, 'buka');
  d.close();
  assert.equal(d.fase, 'pagi');
});

test('laporan memuat kepuasan', () => {
  const d = createDay();
  d.open();
  d.recordSale(5000, 3000);
  const lap = d.close();
  assert.ok(lap.kepuasan >= 0 && lap.kepuasan <= 100);
});
