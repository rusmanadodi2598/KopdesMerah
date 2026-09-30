import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../../js/core/input.js';

test('keydown lalu keyup mengubah status tombol', () => {
  const input = createInput();
  input.handleKeyDown({ code: 'KeyW' });
  assert.equal(input.isDown('KeyW'), true);
  input.handleKeyUp({ code: 'KeyW' });
  assert.equal(input.isDown('KeyW'), false);
});

test('tombol lain tidak terpengaruh', () => {
  const input = createInput();
  input.handleKeyDown({ code: 'KeyW' });
  assert.equal(input.isDown('KeyA'), false);
  assert.equal(input.isDown('ShiftLeft'), false);
});
