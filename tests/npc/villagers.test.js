import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVillager, stepVillager, disperseQueue } from '../../js/npc/villagers.js';

test('toko buka: warga shopper pergi ke toko', () => {
  const v = createVillager('a', [{ x: 0, z: 0 }, { x: 20, z: 0 }], { shopper: true });
  assert.equal(v.state, 'wander');
  stepVillager(v, 0.1, { shopOpen: true, queueSpots: [{ x: 5, z: 0 }], villagers: [v] });
  assert.equal(v.state, 'toShop');
});

test('toko tutup: warga tetap berkeliaran', () => {
  const v = createVillager('a', [{ x: 0, z: 0 }, { x: 20, z: 0 }], { shopper: true });
  stepVillager(v, 0.1, { shopOpen: false, queueSpots: [{ x: 5, z: 0 }], villagers: [v] });
  assert.equal(v.state, 'wander');
});

test('sampai slot antrean: state queue dengan slot unik', () => {
  const spots = [{ x: 2, z: 0 }, { x: 4, z: 0 }];
  const a = createVillager('a', [{ x: 0, z: 0 }], { shopper: true });
  const b = createVillager('b', [{ x: 0, z: 0 }], { shopper: true });
  const villagers = [a, b];
  const ctx = { shopOpen: true, queueSpots: spots, villagers };
  stepVillager(a, 0.1, ctx);
  stepVillager(b, 0.1, ctx);
  assert.notEqual(a.queueSlot, b.queueSlot);
  for (let i = 0; i < 20 && a.state !== 'queue'; i++) stepVillager(a, 0.5, ctx);
  assert.equal(a.state, 'queue');
});

test('dilayani lalu pergi: queue -> buying -> leave -> wander', () => {
  const spots = [{ x: 2, z: 0 }];
  const v = createVillager('a', [{ x: 0, z: 0 }, { x: 30, z: 0 }], { shopper: true });
  const villagers = [v];
  const ctx = { shopOpen: true, queueSpots: spots, villagers };
  stepVillager(v, 0.1, ctx);
  for (let i = 0; i < 20 && v.state !== 'queue'; i++) stepVillager(v, 0.5, ctx);
  stepVillager(v, 0.1, { ...ctx, serveId: 'a' });
  assert.equal(v.state, 'buying');
  stepVillager(v, 2.1, { ...ctx, serveId: 'a' });
  assert.equal(v.state, 'leave');
  for (let i = 0; i < 60 && v.state !== 'wander'; i++) stepVillager(v, 0.5, ctx);
  assert.equal(v.state, 'wander');
});

test('disperseQueue: toShop/queue/buying bubar jadi leave', () => {
  const spots = [{ x: 2, z: 0 }, { x: 4, z: 0 }];
  const a = createVillager('a', [{ x: 0, z: 0 }], { shopper: true });
  const b = createVillager('b', [{ x: 0, z: 0 }], { shopper: true });
  const villagers = [a, b];
  const ctx = { shopOpen: true, queueSpots: spots, villagers };
  stepVillager(a, 0.1, ctx);
  for (let i = 0; i < 20 && a.state !== 'queue'; i++) stepVillager(a, 0.5, ctx);
  stepVillager(a, 0.1, { ...ctx, serveId: 'a' });
  assert.equal(a.state, 'buying');
  stepVillager(b, 0.1, ctx); // b: wander -> toShop
  assert.equal(b.state, 'toShop');
  disperseQueue(villagers);
  assert.equal(a.state, 'leave');
  assert.equal(b.state, 'leave');
  assert.equal(a.queueSlot, null);
  assert.equal(b.queueSlot, null);
});

test('slot antre dibebaskan setelah buying, bisa dipakai ulang', () => {
  const spots = [{ x: 2, z: 0 }];
  const a = createVillager('a', [{ x: 0, z: 0 }, { x: 30, z: 0 }], { shopper: true });
  const villagers = [a];
  const ctx = { shopOpen: true, queueSpots: spots, villagers };
  stepVillager(a, 0.1, ctx);
  for (let i = 0; i < 20 && a.state !== 'queue'; i++) stepVillager(a, 0.5, ctx);
  stepVillager(a, 0.1, { ...ctx, serveId: 'a' });
  stepVillager(a, 2.1, { ...ctx, serveId: 'a' });
  assert.equal(a.state, 'leave');
  assert.equal(a.queueSlot, null);
  const b = createVillager('b', [{ x: 0, z: 0 }], { shopper: true });
  villagers.push(b);
  stepVillager(b, 0.1, { ...ctx, villagers });
  assert.equal(b.state, 'toShop');
  assert.equal(b.queueSlot, 0); // slot yang sama dipakai ulang
});
