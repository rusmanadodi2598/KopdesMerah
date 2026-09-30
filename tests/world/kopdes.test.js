import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three.module.js';
import { buildKopdes } from '../../js/world/kopdes.js';

function volume(group) {
  const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  return size.x * size.y * size.z;
}

test('gedung kopdes membesar tiap level', () => {
  const v1 = volume(buildKopdes(1));
  const v2 = volume(buildKopdes(2));
  const v3 = volume(buildKopdes(3));
  assert.ok(v1 < v2, `v1=${v1} harus < v2=${v2}`);
  assert.ok(v2 < v3, `v2=${v2} harus < v3=${v3}`);
});

test('semua level mengembalikan Group', () => {
  for (const lv of [1, 2, 3]) {
    assert.ok(buildKopdes(lv) instanceof THREE.Group, `level ${lv}`);
  }
});
