import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, levelUntuk, barangTerbuka, reputasiKepuasan } from '../../js/progression/levels.js';

test('reputasi 99 -> level 1', () => {
  assert.equal(levelUntuk(99).level, 1);
  assert.equal(levelUntuk(99).nama, 'Warung Kopdes');
});

test('reputasi 100 -> level 2', () => {
  assert.equal(levelUntuk(100).level, 2);
  assert.equal(levelUntuk(100).nama, 'Kopdes Maju');
});

test('reputasi 250 -> level 3', () => {
  assert.equal(levelUntuk(250).level, 3);
  assert.equal(levelUntuk(250).nama, 'Kopdes Merah Putih');
});

test('reputasi 1000 -> tetap level 3 (maksimum)', () => {
  assert.equal(levelUntuk(1000).level, 3);
});

test('barang terbuka kumulatif per level', () => {
  assert.deepEqual(barangTerbuka(1), ['beras', 'gula', 'mie', 'teh']);
  assert.deepEqual(barangTerbuka(2), ['beras', 'gula', 'mie', 'teh', 'minyak', 'telur', 'kopi']);
  assert.deepEqual(barangTerbuka(3).length, 8);
  assert.ok(barangTerbuka(3).includes('sabun'));
});

test('kepuasan >= 80 -> +5 reputasi', () => {
  assert.equal(reputasiKepuasan(80), 5);
  assert.equal(reputasiKepuasan(100), 5);
  assert.equal(reputasiKepuasan(79), 0);
  assert.equal(reputasiKepuasan(70), 0);
});

test('LEVELS sesuai kontrak plan', () => {
  assert.equal(LEVELS.length, 3);
  assert.deepEqual(LEVELS.map((l) => l.syaratReputasi), [0, 100, 250]);
});
