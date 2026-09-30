import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStock } from '../../js/shop/stock.js';
import { createCashier } from '../../js/shop/cashier.js';

test('checkout sukses: total benar dan stok berkurang', () => {
  const s = createStock();
  s.add('beras', 5);
  s.add('teh', 5);
  const k = createCashier();
  const r = k.checkout({ beras: 2, teh: 1 }, 'tx-1', s);
  assert.equal(r.ok, true);
  assert.equal(r.total, 12000 * 2 + 8000);
  assert.equal(s.qty.beras, 3);
  assert.equal(s.qty.teh, 4);
});

test('txId sama dua kali: hanya diproses sekali', () => {
  const s = createStock();
  s.add('kopi', 5);
  const k = createCashier();
  const r1 = k.checkout({ kopi: 2 }, 'tx-dup', s);
  const r2 = k.checkout({ kopi: 2 }, 'tx-dup', s);
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  assert.equal(r2.total, r1.total);
  assert.equal(s.qty.kopi, 3); // berkurang sekali, bukan dua kali
});

test('stok kurang -> ok:false dan stok tidak berubah', () => {
  const s = createStock();
  s.add('mie', 1);
  const k = createCashier();
  const r = k.checkout({ mie: 3 }, 'tx-gagal', s);
  assert.equal(r.ok, false);
  assert.equal(s.qty.mie, 1);
});

test('gagal lalu retry txId sama -> sukses, stok berkurang sekali', () => {
  const s = createStock();
  s.add('mie', 1);
  const k = createCashier();
  const gagal = k.checkout({ mie: 3 }, 'tx-retry', s);
  assert.equal(gagal.ok, false);
  s.add('mie', 5);
  const r = k.checkout({ mie: 3 }, 'tx-retry', s);
  assert.equal(r.ok, true);
  assert.equal(s.qty.mie, 3); // 1 + 5 - 3
});

test('txId kosong ditolak berisik, stok tidak berubah', () => {
  const s = createStock();
  s.add('kopi', 5);
  const k = createCashier();
  for (const txId of [undefined, null, '']) {
    const r = k.checkout({ kopi: 2 }, txId, s);
    assert.equal(r.ok, false);
    assert.ok(r.pesan && r.pesan.length > 0);
  }
  assert.equal(s.qty.kopi, 5);
});

test('instance baru tidak mewarisi cache sesi lama', () => {
  const s = createStock();
  s.add('kopi', 10);
  const k1 = createCashier();
  k1.checkout({ kopi: 2 }, 'tx-sama', s);
  const k2 = createCashier(); // sesi baru, mis. setelah loadGame
  const r = k2.checkout({ kopi: 3 }, 'tx-sama', s);
  assert.equal(r.ok, true);
  assert.equal(r.total, 10000 * 3);
  assert.equal(s.qty.kopi, 5); // 10 - 2 - 3
});
