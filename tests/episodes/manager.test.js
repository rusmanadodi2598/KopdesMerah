import test from 'node:test';
import assert from 'node:assert/strict';
import { createEpisodeManager } from '../../js/episodes/manager.js';

function buatDeps() {
  const d = {
    calls: [],
    kartu: (k) => d.calls.push(['kartu', k.judul]),
    tutupKartu: () => d.calls.push(['tutupKartu']),
    dialog: (baris, cb) => {
      d.calls.push(['dialog', baris.length]);
      d.cbDialog = cb;
    },
    setObjektif: (t) => d.calls.push(['setObjektif', t]),
    jurnal: (ep, j) => d.calls.push(['jurnal', j]),
    suara: (n) => d.calls.push(['suara', n]),
    selesai: (def) => d.calls.push(['selesai', def.id]),
    cbDialog: null,
  };
  return d;
}

const DEF = {
  id: 'e99',
  nomor: 99,
  judul: 'Uji',
  beats: [
    { id: 'k1', tipe: 'kartu', judul: 'Judul', durasi: 2 },
    { id: 'd1', tipe: 'dialog', baris: [{ pembicara: 'A', teks: 'halo' }] },
    { id: 'o1', tipe: 'objektif', teks: 'Lakukan X' },
    { id: 'j1', tipe: 'jurnal', judul: 'Petunjuk A', teks: 'teks' },
    { id: 's1', tipe: 'suara', nama: 'tawa' },
    { id: 'w1', tipe: 'tunggu', durasi: 1 },
    { id: 'end', tipe: 'selesai' },
  ],
};

test('alur beat penuh: kartu → dialog → objektif → jurnal → suara → tunggu → selesai', () => {
  const deps = buatDeps();
  const em = createEpisodeManager(deps);
  em.mulai(DEF, null);
  assert.equal(em.beatId, 'k1');
  assert.equal(em.kartuAktif, true);
  assert.deepEqual(deps.calls[0], ['setObjektif', null]);
  assert.deepEqual(deps.calls[1], ['kartu', 'Judul']);

  em.tick(1); // belum cukup
  assert.equal(em.beatId, 'k1');
  em.tick(1.5); // kartu selesai → dialog
  assert.deepEqual(deps.calls.at(-2), ['tutupKartu']);
  assert.deepEqual(deps.calls.at(-1), ['dialog', 1]);
  assert.equal(typeof deps.cbDialog, 'function');

  deps.cbDialog(); // dialog selesai → objektif
  assert.equal(em.beatId, 'o1');
  assert.equal(em.objektifTeks(), 'Lakukan X');

  em.tandaiSelesai('id-salah'); // no-op
  assert.equal(em.beatId, 'o1');
  em.tandaiSelesai('o1'); // jurnal + suara instan → tunggu
  assert.deepEqual(deps.calls.filter((c) => c[0] === 'jurnal'), [['jurnal', 'Petunjuk A']]);
  assert.deepEqual(deps.calls.filter((c) => c[0] === 'suara'), [['suara', 'tawa']]);
  assert.equal(em.beatId, 'w1');

  em.tick(0.4);
  assert.equal(em.beatId, 'w1');
  em.tick(0.7); // tunggu selesai → beat 'selesai' → deps.selesai
  assert.deepEqual(deps.calls.at(-1), ['selesai', 'e99']);
  assert.equal(em.aktif, null);
  assert.equal(em.objektifTeks(), null);
});

test('lewatiKartu melompati kartu yang sedang tampil', () => {
  const deps = buatDeps();
  const em = createEpisodeManager(deps);
  em.mulai(DEF, null);
  em.lewatiKartu();
  assert.equal(em.kartuAktif, false);
  assert.equal(em.beatId, 'd1'); // langsung ke dialog
  assert.ok(deps.calls.some((c) => c[0] === 'tutupKartu'));
});

test('onStart dipanggil sekali saat beat dimulai (aman bila throw)', () => {
  const deps = buatDeps();
  const em = createEpisodeManager(deps);
  let n = 0;
  em.mulai(
    { id: 'x', nomor: 1, judul: 'X', beats: [{ id: 'a', tipe: 'tunggu', durasi: 0.1, onStart: () => { n += 1; throw new Error('boom'); } }, { id: 'b', tipe: 'selesai' }] },
    {},
  );
  assert.equal(n, 1);
  em.tick(0.2);
  assert.deepEqual(deps.calls.at(-1), ['selesai', 'x']); // game tetap jalan
});

test('hentikan membersihkan state episode', () => {
  const deps = buatDeps();
  const em = createEpisodeManager(deps);
  em.mulai(DEF, null);
  em.hentikan();
  assert.equal(em.aktif, null);
  assert.equal(em.beatId, null);
  assert.equal(em.kartuAktif, false);
  assert.equal(em.objektifTeks(), null);
  em.tick(10);
  em.tandaiSelesai('o1'); // tak ada efek
  assert.ok(deps.calls.some((c) => c[0] === 'tutupKartu'));
});

test('beat selesai di tengah daftar menutup episode dengan benar', () => {
  const deps = buatDeps();
  const em = createEpisodeManager(deps);
  em.mulai({ id: 'y', nomor: 2, judul: 'Y', beats: [{ id: 'a', tipe: 'selesai' }] }, null);
  assert.deepEqual(deps.calls, [['setObjektif', null], ['selesai', 'y']]);
  assert.equal(em.aktif, null);
});
