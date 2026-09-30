import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventory } from '../../js/player/inventory.js';

test('add/has/take dasar', () => {
  const inv = createInventory();
  assert.equal(inv.has('beras', 1), false);
  inv.add('beras', 2);
  assert.equal(inv.has('beras', 2), true);
  assert.equal(inv.take('beras', 1), true);
  assert.equal(inv.has('beras', 2), false);
  assert.equal(inv.has('beras', 1), true);
});

test('take melebihi isi -> false dan isi tetap', () => {
  const inv = createInventory();
  inv.add('kopi', 1);
  assert.equal(inv.take('kopi', 5), false);
  assert.equal(inv.has('kopi', 1), true);
});
