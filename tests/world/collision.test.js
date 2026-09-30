import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCircle } from '../../js/world/collision.js';

const box = { minX: 0, maxX: 4, minZ: 0, maxZ: 4 };

test('lingkaran di dalam box terdorong keluar', () => {
  const p = resolveCircle({ x: 2, z: 2 }, 0.5, [box]);
  const diLuar = p.x <= 0 - 0.5 || p.x >= 4 + 0.5 || p.z <= 0 - 0.5 || p.z >= 4 + 0.5;
  assert.equal(diLuar, true);
});

test('lingkaran jauh dari box tidak berubah', () => {
  const p = resolveCircle({ x: 10, z: 10 }, 0.5, [box]);
  assert.deepEqual(p, { x: 10, z: 10 });
});

test('lingkaran dekat tepi terdorong sejauh radius', () => {
  const p = resolveCircle({ x: 4.3, z: 2 }, 0.5, [box]);
  assert.ok(Math.abs(p.x - 4.5) < 1e-9, `x=${p.x}`);
  assert.ok(Math.abs(p.z - 2) < 1e-9, `z=${p.z}`);
});
