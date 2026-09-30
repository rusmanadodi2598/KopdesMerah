import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, createStock, nilaiModal } from '../../js/shop/stock.js';

test('take saat stok 0 -> false dan qty tetap 0', () => {
  const s = createStock();
  assert.equal(s.take('beras', 1), false);
  assert.equal(s.qty.beras, 0);
});

test('add lalu take berhasil mengurangi stok', () => {
  const s = createStock();
  s.add('beras', 5);
  assert.equal(s.take('beras', 2), true);
  assert.equal(s.qty.beras, 3);
});

test('take melebihi stok -> false dan qty tidak berubah', () => {
  const s = createStock();
  s.add('gula', 2);
  assert.equal(s.take('gula', 5), false);
  assert.equal(s.qty.gula, 2);
});

test('ITEMS berisi 8 barang dengan harga dan modal', () => {
  assert.equal(Object.keys(ITEMS).length, 8);
  assert.deepEqual([ITEMS.beras.harga, ITEMS.beras.modal], [12000, 9000]);
});

test('nilaiModal menghitung total modal keranjang', () => {
  assert.equal(nilaiModal({ beras: 2, teh: 1 }), 9000 * 2 + 6000);
  assert.equal(nilaiModal({}), 0);
});
