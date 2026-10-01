import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KONTROL_PC, KONTROL_HP } from '../../js/ui/layar.js';

test('daftar kontrol PC memuat tombol inti (E/H/G/M/Esc)', () => {
  const tombol = KONTROL_PC.map(([t]) => t);
  for (const k of ['E', 'H', 'G', 'M', 'Esc']) {
    assert.ok(tombol.includes(k), `kurang ${k}`);
  }
});

test('daftar kontrol HP menyebut AKSI kontekstual', () => {
  const semua = KONTROL_HP.map(([t, d]) => `${t} ${d}`).join(' ');
  assert.ok(semua.includes('AKSI'), 'kontrol HP harus menyebut tombol AKSI');
});
