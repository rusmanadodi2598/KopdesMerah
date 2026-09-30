import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStock } from '../../js/shop/stock.js';
import { checkout } from '../../js/shop/cashier.js';

test('checkout sukses: total benar dan stok berkurang', () => {
  const s = createStock();
  s.add('beras', 5);
  s.add('teh', 5);
  const r = checkout({ beras: 2, teh: 1 }, 'tx-1', s);
  assert.equal(r.ok, true);
  assert.equal(r.total, 12000 * 2 + 8000);
  assert.equal(s.qty.beras, 3);
  assert.equal(s.qty.teh, 4);
});

test('txId sama dua kali: hanya diproses sekali', () => {
  const s = createStock();
  s.add('kopi', 5);
  const r1 = checkout({ kopi: 2 }, 'tx-dup', s);
  const r2 = checkout({ kopi: 2 }, 'tx-dup', s);
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  assert.equal(r2.total, r1.total);
  assert.equal(s.qty.kopi, 3); // berkurang sekali, bukan dua kali
});

test('stok kurang -> ok:false dan stok tidak berubah', () => {
  const s = createStock();
  s.add('mie', 1);
  const r = checkout({ mie: 3 }, 'tx-gagal', s);
  assert.equal(r.ok, false);
  assert.equal(s.qty.mie, 1);
});
