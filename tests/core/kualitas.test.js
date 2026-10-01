import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tingkatBerikutnya, terapkanKualitas, TINGKAT } from '../../js/core/kualitas.js';

test('tingkatBerikutnya bersiklus Tinggi → Sedang → Rendah → Tinggi', () => {
  assert.equal(tingkatBerikutnya('Tinggi'), 'Sedang');
  assert.equal(tingkatBerikutnya('Sedang'), 'Rendah');
  assert.equal(tingkatBerikutnya('Rendah'), 'Tinggi');
});

test('tingkatBerikutnya tahan input asing', () => {
  assert.ok(TINGKAT.includes(tingkatBerikutnya('ngawur')));
});

function envPalsu() {
  const diteruskan = [];
  return {
    env: {
      renderer: {
        rasio: 0,
        setPixelRatio(r) { this.rasio = r; },
        shadowMap: { enabled: true },
      },
      scene: { traverse(fn) { diteruskan.push(fn); } },
      efek: { asap: { visible: true }, daun: { visible: true } },
    },
    diteruskan,
  };
}

test('Rendah: piksel 1, tanpa bayangan, tanpa partikel', () => {
  const { env } = envPalsu();
  terapkanKualitas(env, 'Rendah');
  assert.equal(env.renderer.rasio, 1);
  assert.equal(env.renderer.shadowMap.enabled, false);
  assert.equal(env.efek.asap.visible, false);
  assert.equal(env.efek.daun.visible, false);
});

test('Sedang: bayangan nyala, asap nyala, daun mati', () => {
  const { env } = envPalsu();
  terapkanKualitas(env, 'Sedang');
  assert.equal(env.renderer.shadowMap.enabled, true);
  assert.equal(env.efek.asap.visible, true);
  assert.equal(env.efek.daun.visible, false);
});

test('Tinggi: semua efek nyala', () => {
  const { env } = envPalsu();
  env.efek.asap.visible = false;
  terapkanKualitas(env, 'Tinggi');
  assert.equal(env.renderer.shadowMap.enabled, true);
  assert.equal(env.efek.asap.visible, true);
  assert.equal(env.efek.daun.visible, true);
});
