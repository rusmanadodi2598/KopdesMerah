import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMalam, terapkanFaseMalam, tickVisualMalam,
  FASE, JUMLAH_LAMPU, MINYAK_PENUH, LAJU_MINYAK,
} from '../../js/core/malam.js';

test('fase awal siang, semua lampu menyala, minyak penuh', () => {
  const m = createMalam();
  assert.equal(m.fase, FASE.SIANG);
  assert.equal(m.jumlahLampuPadam(), 0);
  assert.equal(m.minyak, MINYAK_PENUH);
});

test('setFase hanya terima siang/malam', () => {
  const m = createMalam();
  m.setFase(FASE.MALAM);
  assert.equal(m.fase, FASE.MALAM);
  m.setFase('ngawur');
  assert.equal(m.fase, FASE.MALAM);
});

test('lampu bisa dipadamkan/dinyalakan per indeks', () => {
  const m = createMalam();
  m.padamkanLampu(1);
  assert.equal(m.lampuNyala(1), false);
  assert.equal(m.jumlahLampuPadam(), 1);
  m.nyalakanLampu(1);
  assert.equal(m.lampuNyala(1), true);
  m.padamkanSemua();
  assert.equal(m.jumlahLampuPadam(), JUMLAH_LAMPU);
  m.nyalakanSemua();
  assert.equal(m.jumlahLampuPadam(), 0);
});

test('indeks lampu di luar rentang aman (no-op)', () => {
  const m = createMalam();
  m.padamkanLampu(-1);
  m.padamkanLampu(99);
  m.nyalakanLampu(99);
  assert.equal(m.lampuNyala(-1), false);
  assert.equal(m.lampuNyala(99), false);
  assert.equal(m.jumlahLampuPadam(), 0);
});

test('minyak hanya berkurang saat malam', () => {
  const m = createMalam();
  m.tick(10);
  assert.equal(m.minyak, MINYAK_PENUH);
  m.setFase(FASE.MALAM);
  m.tick(10);
  assert.ok(Math.abs(m.minyak - (MINYAK_PENUH - LAJU_MINYAK * 10)) < 1e-9);
});

test('minyak tidak di bawah nol; tick kembalikan true tepat saat habis', () => {
  const m = createMalam();
  m.setFase(FASE.MALAM);
  m.tick(100000);
  assert.equal(m.minyak, 0);
  assert.equal(m.tick(1), false); // sudah habis: tidak lapor lagi
});

test('isiMinyak mengembalikan ke penuh', () => {
  const m = createMalam();
  m.setFase(FASE.MALAM);
  m.tick(50);
  m.isiMinyak();
  assert.equal(m.minyak, MINYAK_PENUH);
});

function envPalsu() {
  const warna = { v: 0, setHex(h) { this.v = h; } };
  const kepala = () => ({ material: { emissiveIntensity: 0.45 } });
  return {
    scene: { fog: { color: { setHex() {} }, near: 0, far: 0 } },
    sun: { intensity: 2.4 },
    bulan: { intensity: 0 },
    skyU: { atas: { value: warna }, bawah: { value: { setHex() {} } } },
    lampu: Array.from({ length: JUMLAH_LAMPU }, kepala).map((k) => ({
      kepala: k, cahaya: { visible: false, intensity: 0 },
    })),
    lentera: { visible: false, intensity: 0 },
    _warna: warna,
  };
}

test('terapkanFaseMalam: malam menggelapkan & menyalakan lampu', () => {
  const m = createMalam();
  m.setFase(FASE.MALAM);
  m.padamkanLampu(2);
  const env = envPalsu();
  terapkanFaseMalam(env, m);
  assert.equal(env.sun.intensity, 0);
  assert.equal(env.bulan.intensity, 0.35);
  assert.equal(env.lentera.visible, true);
  assert.equal(env.lampu[0].cahaya.visible, true);
  assert.equal(env.lampu[2].cahaya.visible, false);
  assert.equal(env._warna.v, 0x05070f);
});

test('terapkanFaseMalam: siang mematikan semua cahaya malam', () => {
  const m = createMalam();
  const env = envPalsu();
  terapkanFaseMalam(env, m);
  assert.equal(env.sun.intensity, 2.4);
  assert.equal(env.lentera.visible, false);
  assert.ok(env.lampu.every((l) => l.cahaya.visible === false));
});

test('terapkanFaseMalam: lentera mati saat minyak habis', () => {
  const m = createMalam();
  m.setFase(FASE.MALAM);
  m.tick(100000);
  const env = envPalsu();
  terapkanFaseMalam(env, m);
  assert.equal(env.lentera.visible, false);
});

test('tickVisualMalam: tidak mengubah apa pun saat siang', () => {
  const m = createMalam();
  const env = envPalsu();
  tickVisualMalam(env, m, 123);
  assert.equal(env.lentera.intensity, 0);
});
