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
  assert.deepEqual(m, { uang: 'Rp75.000', hari: 3, reputasi: 120, level: 2, fase: 'buka' });
});

test('hudModel tahan field hilang', () => {
  const m = hudModel({});
  assert.equal(m.uang, 'Rp0');
  assert.equal(m.hari, 1);
  assert.equal(m.reputasi, 0);
  assert.equal(m.level, 1);
  assert.equal(m.fase, 'pagi');
});
