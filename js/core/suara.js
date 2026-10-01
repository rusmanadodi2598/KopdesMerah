// Efek suara synth WebAudio tanpa aset. AudioContext dibuat malas saat
// gestur pertama (klik "mulai" di layar judul) agar lolos autoplay policy.
// Murni + aman di node (tanpa AudioContext/localStorage → no-op).
const KUNCI_BISU = 'kopdes3d_bisu';

function adaLS() {
  return typeof localStorage !== 'undefined';
}

let ctx = null;
let bisu = adaLS() && localStorage.getItem(KUNCI_BISU) === '1';

function pastikanCtx() {
  if (ctx || typeof AudioContext === 'undefined') return ctx;
  ctx = new AudioContext();
  return ctx;
}

// Nada sederhana: frekuensi awal→akhir, durasi detik, tipe osilator.
function nada(f0, f1, dur, tipe = 'sine', vol = 0.18, tunda = 0) {
  const ac = pastikanCtx();
  if (!ac || bisu) return;
  const t0 = ac.currentTime + tunda;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = tipe;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const POLA = {
  klik: () => nada(620, 620, 0.06, 'square', 0.08),
  koin: () => { nada(950, 950, 0.09); nada(1400, 1400, 0.14, 'sine', 0.18, 0.08); },
  sukses: () => { nada(523, 523, 0.12); nada(659, 659, 0.12, 'sine', 0.18, 0.1); nada(784, 784, 0.2, 'sine', 0.18, 0.2); },
  gagal: () => nada(220, 120, 0.25, 'sawtooth', 0.12),
  buka: () => nada(320, 640, 0.18, 'sine', 0.15),
  tutup: () => nada(640, 320, 0.18, 'sine', 0.15),
  lentera: () => { nada(180, 520, 0.3, 'sine', 0.12); nada(520, 760, 0.25, 'sine', 0.1, 0.12); },
  padam: () => nada(400, 90, 0.4, 'sine', 0.14),
  // Tawa anak kecil dari dalam kabut: tiga rengekan tinggi menurun, agak seram.
  tawa: () => {
    for (let i = 0; i < 3; i++) {
      const t = i * 0.26;
      nada(720 - i * 110, 460 - i * 70, 0.2, 'sine', 0.09, t);
      nada(1090 - i * 160, 700 - i * 110, 0.2, 'triangle', 0.05, t);
    }
  },
  klikLampu: () => nada(1200, 900, 0.05, 'square', 0.07),
};

export function bunyi(nama) {
  if (bisu) return;
  POLA[nama]?.();
}

export function apakahBisu() {
  return bisu;
}

export function setBisu(v) {
  bisu = !!v;
  if (adaLS()) localStorage.setItem(KUNCI_BISU, bisu ? '1' : '0');
  return bisu;
}

export function toggleBisu() {
  return setBisu(!bisu);
}
