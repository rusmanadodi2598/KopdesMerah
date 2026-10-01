import { test } from 'node:test';
import assert from 'node:assert/strict';

// Stub localStorage ala browser.
const simpan = {};
globalThis.localStorage = {
  getItem: (k) => (k in simpan ? simpan[k] : null),
  setItem: (k, v) => { simpan[k] = String(v); },
  removeItem: (k) => { delete simpan[k]; },
};

const { bunyi, apakahBisu, setBisu, toggleBisu } = await import('../../js/core/suara.js');

test('bunyi() tanpa AudioContext tidak throw (node)', () => {
  assert.doesNotThrow(() => bunyi('koin'));
  assert.doesNotThrow(() => bunyi('nama-ngawur'));
});

test('setBisu/toggleBisu membalik dan menyimpan preferensi', () => {
  setBisu(false);
  assert.equal(apakahBisu(), false);
  assert.equal(toggleBisu(), true);
  assert.equal(simpan['kopdes3d_bisu'], '1');
  assert.equal(toggleBisu(), false);
  assert.equal(simpan['kopdes3d_bisu'], '0');
});

test('bunyi() diam saat bisu', () => {
  setBisu(true);
  assert.doesNotThrow(() => bunyi('sukses'));
  setBisu(false);
});
