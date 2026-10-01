// Kontroler malam: fase waktu, lampu jalan, lentera + minyak.
// State murni (tanpa THREE) agar bisa diuji; terapkanFaseMalam() adalah
// jembatan ke scene, tickVisualMalam() untuk kedip cahaya.

export const FASE = { SIANG: 'siang', MALAM: 'malam' };
export const JUMLAH_LAMPU = 4;
export const MINYAK_PENUH = 100;
// 100 / 1.1 ≈ 90 detik jelajah malam — cukup untuk pulang ke rumah.
export const LAJU_MINYAK = 1.1;

export function createMalam() {
  const s = {
    fase: FASE.SIANG,
    lampu: Array(JUMLAH_LAMPU).fill(true),
    minyak: MINYAK_PENUH,
  };
  return {
    get fase() { return s.fase; },
    get minyak() { return s.minyak; },
    lampuNyala(i) { return i >= 0 && i < JUMLAH_LAMPU ? s.lampu[i] : false; },
    jumlahLampuPadam() { return s.lampu.filter((x) => !x).length; },
    setFase(f) {
      if (f === FASE.SIANG || f === FASE.MALAM) s.fase = f;
    },
    nyalakanLampu(i) { if (i >= 0 && i < JUMLAH_LAMPU) s.lampu[i] = true; },
    padamkanLampu(i) { if (i >= 0 && i < JUMLAH_LAMPU) s.lampu[i] = false; },
    padamkanSemua() { s.lampu.fill(false); },
    nyalakanSemua() { s.lampu.fill(true); },
    // Kembalikan true tepat saat minyak habis pada tick ini.
    tick(dt) {
      if (s.fase !== FASE.MALAM || s.minyak <= 0 || dt <= 0) return false;
      s.minyak = Math.max(0, s.minyak - LAJU_MINYAK * dt);
      return s.minyak === 0;
    },
    isiMinyak() { s.minyak = MINYAK_PENUH; },
  };
}

// env: { scene, sun, bulan, skyU:{atas,bawah}, lampu:[{kepala,cahaya}], lentera }
export function terapkanFaseMalam(env, malam) {
  const m = malam.fase === FASE.MALAM;
  const fog = env.scene.fog;
  if (m) {
    fog.color.setHex(0x0a1020); fog.near = 6; fog.far = 46;
    env.skyU.atas.value.setHex(0x05070f);
    env.skyU.bawah.value.setHex(0x0d1526);
  } else {
    fog.color.setHex(0xd8ecf9); fog.near = 60; fog.far = 170;
    env.skyU.atas.value.setHex(0x2f7fc4);
    env.skyU.bawah.value.setHex(0xd8ecf9);
  }
  env.sun.intensity = m ? 0 : 2.4;
  if (env.bulan) env.bulan.intensity = m ? 0.35 : 0;
  env.lampu.forEach((l, i) => {
    const nyala = m && malam.lampuNyala(i);
    l.kepala.material.emissiveIntensity = nyala ? 1.6 : 0.05;
    l.cahaya.visible = nyala;
  });
  env.lentera.visible = m && malam.minyak > 0;
}

// Kedip halus: lentera berdenyut saat minyak menipis, lampu jalan bergoyang pelan.
export function tickVisualMalam(env, malam, t) {
  if (malam.fase !== FASE.MALAM) return;
  const kritis = malam.minyak < 20;
  const kedip = kritis ? 0.7 + 0.3 * Math.sin(t * 23) * Math.sin(t * 7.3) : 1;
  env.lentera.intensity = 2.2 * kedip * Math.min(1, malam.minyak / 25 + 0.15);
  env.lampu.forEach((l, i) => {
    if (l.cahaya.visible) l.cahaya.intensity = 1.4 + 0.12 * Math.sin(t * 9 + i * 1.7);
  });
}
