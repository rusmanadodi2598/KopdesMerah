import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, defaultState, saveGame, loadGame, hasSave, clearSave } from '../../js/save/save.js';

// Fake storage ala localStorage untuk node.
function fakeStorage(isi = {}) {
  const data = { ...isi };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

test('save lalu load: state utuh', () => {
  const st = fakeStorage();
  const awal = { ...defaultState(), uang: 75000, hari: 3, reputasi: 120, stock: { beras: 4 }, inventory: { kopi: 2 } };
  saveGame(awal, st);
  const muat = loadGame(st);
  assert.deepEqual(muat.uang, 75000);
  assert.deepEqual(muat.hari, 3);
  assert.deepEqual(muat.stock, { beras: 4 });
  assert.deepEqual(muat.inventory, { kopi: 2 });
});

test('JSON korup -> default aman tanpa throw', () => {
  const st = fakeStorage({ [SAVE_KEY]: '{bukan json!!!' });
  const muat = loadGame(st);
  assert.deepEqual(muat, defaultState());
});

test('belum ada save -> default', () => {
  const muat = loadGame(fakeStorage());
  assert.deepEqual(muat, defaultState());
});

test('isi bukan objek (string/angka/array) -> default', () => {
  for (const isi of ['"teks"', '123', '[1,2]', 'null']) {
    const muat = loadGame(fakeStorage({ [SAVE_KEY]: isi }));
    assert.deepEqual(muat, defaultState(), isi);
  }
});

test('save lawas (field hilang) -> digabung dengan default', () => {
  const st = fakeStorage({ [SAVE_KEY]: JSON.stringify({ uang: 1000 }) });
  const muat = loadGame(st);
  assert.equal(muat.uang, 1000);
  assert.deepEqual(muat.inventory, {}); // default, bukan undefined
  assert.equal(muat.streakBuka, 0);
});

test('defaultState memuat semua field kanonis', () => {
  const d = defaultState();
  for (const f of ['uang', 'hari', 'reputasi', 'level', 'fase', 'stock', 'inventory', 'misiSelesai', 'achievement', 'streakBuka']) {
    assert.ok(f in d, `field ${f} hilang`);
  }
});

test('hasSave & clearSave', () => {
  const st = fakeStorage();
  assert.equal(hasSave(st), false);
  saveGame(defaultState(), st);
  assert.equal(hasSave(st), true);
  clearSave(st);
  assert.equal(hasSave(st), false);
});
