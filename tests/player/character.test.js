import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../../js/player/character.js';

const inputW = { isDown: (c) => c === 'KeyW', touch: { dx: 0, dy: 0, active: false } };
const inputDiam = { isDown: () => false, touch: { dx: 0, dy: 0, active: false } };

test('tombol W menggerakkan pemain maju (-z) 4 m/s', () => {
  const p = createPlayer();
  const z0 = p.pos.z;
  p.update(1, inputW, []);
  assert.ok(Math.abs(p.pos.z - (z0 - 4)) < 1e-9, `z=${p.pos.z}`);
});

test('Shift membuat lari 7 m/s', () => {
  const p = createPlayer();
  const z0 = p.pos.z;
  p.update(1, { isDown: (c) => c === 'KeyW' || c === 'ShiftLeft', touch: { dx: 0, dy: 0, active: false } }, []);
  assert.ok(Math.abs(p.pos.z - (z0 - 7)) < 1e-9, `z=${p.pos.z}`);
});

test('box di depan menahan pemain (tidak tembus)', () => {
  const p = createPlayer();
  p.pos.x = 0; p.pos.z = 0;
  const box = { minX: -1, maxX: 1, minZ: -6, maxZ: -4 };
  p.update(1, inputW, [box]);
  assert.ok(p.pos.z > -4, `z=${p.pos.z} harus tertahan di depan box`);
  assert.ok(p.pos.z < 0, `z=${p.pos.z} harus tetap bergerak maju`);
});

test('tanpa input posisi tidak berubah', () => {
  const p = createPlayer();
  const { x, z } = { ...p.pos };
  p.update(1, inputDiam, []);
  assert.deepEqual({ ...p.pos }, { x, z });
});
