import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoop } from '../../js/core/loop.js';

test('update dipanggil tiap tick', () => {
  let calls = 0;
  const callbacks = [];
  const loop = createLoop({
    update: () => { calls += 1; },
    render: () => {},
    raf: (cb) => callbacks.push(cb),
  });
  loop.start();
  callbacks.shift()();
  callbacks.shift()();
  assert.equal(calls, 2);
  assert.equal(loop.tickCount(), 2);
});

test('stop menghentikan loop', () => {
  let calls = 0;
  const callbacks = [];
  const loop = createLoop({
    update: () => { calls += 1; },
    render: () => {},
    raf: (cb) => callbacks.push(cb),
  });
  loop.start();
  loop.stop();
  callbacks.shift()();
  assert.equal(calls, 0);
  assert.equal(loop.tickCount(), 0);
});
