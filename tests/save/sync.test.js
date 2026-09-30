import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { sinkronState } from '../../js/save/sync.js';
import { createDay } from '../../js/shop/day.js';
import { defaultState } from '../../js/save/save.js';

test('sinkronState menyalin hari & fase dari day ke state', () => {
  const S = defaultState();
  const day = createDay();
  day.open();
  day.close();
  sinkronState(S, day);
  assert.equal(S.hari, 2);
  assert.equal(S.fase, 'pagi');
});

test('sinkronState fase buka ikut tersalin', () => {
  const S = defaultState();
  const day = createDay();
  day.open();
  sinkronState(S, day);
  assert.equal(S.hari, 1);
  assert.equal(S.fase, 'buka');
});

test('sinkronState tidak menyentuh field lain', () => {
  const S = defaultState();
  S.uang = 12345;
  const day = createDay();
  sinkronState(S, day);
  assert.equal(S.uang, 12345);
});
