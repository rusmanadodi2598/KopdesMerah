import * as THREE from 'three';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { buildVillage } from './world/village.js';
import { buildKopdes } from './world/kopdes.js';
import { createPlayer, updateCamera } from './player/character.js';
import { createVillager, stepVillager, disperseQueue, villagerMesh } from './npc/villagers.js';
import { createStock, ITEMS, nilaiModal } from './shop/stock.js';
import { createCashier } from './shop/cashier.js';
import { createDay } from './shop/day.js';
import { MISSIONS, createBoard, createAchievements } from './missions/board.js';
import { createInventory } from './player/inventory.js';
import { levelUntuk, barangTerbuka, reputasiKepuasan } from './progression/levels.js';
import { defaultState, saveGame, loadGame, hasSave } from './save/save.js';
import { sinkronState } from './save/sync.js';
import { mountHUD, mountSentuh, tampilDialogMisi, tampilLaporan, formatRupiah } from './ui/hud.js';

// ================= State =================
const S = loadGame();

const stock = createStock();
for (const [id, n] of Object.entries(S.stock)) stock.add(id, n);
const inventory = createInventory();
for (const [id, n] of Object.entries(S.inventory)) inventory.add(id, n);

const day = createDay();
day.hari = S.hari;

const kasir = createCashier(); // instance baru tiap sesi (C1)
const board = createBoard(S.misiSelesai.length);
const ach = createAchievements();
ach.pulihkan(S.achievement);

let dibukaHariIni = false;
let laporanTerakhir = null;
let txCounter = 0;
let serveTarget = null;

function simpan() {
  sinkronState(S, day); // C1/I1: hari & fase ikut tersimpan, HUD selalu benar
  S.stock = { ...stock.qty };
  S.inventory = { ...inventory.isi };
  saveGame(S);
}

// Modal awal: warung baru dapat stok dasar barang level 1.
if (!hasSave()) {
  stock.add('beras', 10);
  stock.add('gula', 10);
  stock.add('mie', 20);
  stock.add('teh', 10);
  simpan();
}

// ================= Scene =================
const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Kubah langit gradien (siang cerah) + fog tipis untuk kedalaman.
scene.fog = new THREE.Fog(0xd8ecf9, 60, 170);
{
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      atas: { value: new THREE.Color(0x2f7fc4) },
      bawah: { value: new THREE.Color(0xd8ecf9) },
    },
    vertexShader: 'varying vec3 vP; void main() { vP = position;'
      + ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 atas; uniform vec3 bawah; varying vec3 vP;'
      + ' void main() { float t = clamp(normalize(vP).y * 0.5 + 0.5, 0.0, 1.0);'
      + ' gl_FragColor = vec4(mix(bawah, atas, pow(t, 0.75)), 1.0); }',
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(230, 24, 16), skyMat));
}

// Matahari hangat + bayangan lembut.
const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
sun.position.set(34, 44, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
sun.shadow.camera.near = 5;
sun.shadow.camera.far = 130;
sun.shadow.bias = -0.0006;
scene.add(sun);
scene.add(sun.target);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(2, 3.5, 14);

const { colliders, spots, kopdes: kopdesAwal, tick: tickDesa } = buildVillage(scene);
let kopdesGroup = kopdesAwal;

// Naik level: tukar gedung + sinkronkan collider (I2).
function tukarGedung(level) {
  scene.remove(kopdesGroup);
  kopdesGroup = buildKopdes(level);
  kopdesGroup.position.set(0, 0, -2);
  kopdesGroup.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(kopdesGroup);
  const uk = kopdesGroup.userData.ukuran;
  const c = colliders.find((k) => k.tag === 'kopdes');
  if (c) {
    c.minX = -uk.w / 2; c.maxX = uk.w / 2;
    c.minZ = -2 - uk.d / 2; c.maxZ = -2 + uk.d / 2;
  }
}
if (S.level > 1) tukarGedung(S.level);

const player = createPlayer();
scene.add(player.group);

const input = createInput();
input.attach(window);

// ================= NPC =================
const WARNA_BAJU = [0xc25e5e, 0x5e8fc2, 0x6fbf5a, 0xc2a15e, 0x9b6fc2, 0x5ec2b8];
const KUMPUL = [
  { x: -20, z: 8 }, { x: 20, z: 8 }, { x: 0, z: 14 },
  { x: -10, z: -14 }, { x: 14, z: -14 }, { x: 0, z: 26 },
];
const villagers = KUMPUL.map((t, i) => {
  const v = createVillager(`w${i}`, [t, { x: -t.x, z: t.z + 4 }]);
  v.group = villagerMesh(WARNA_BAJU[i % WARNA_BAJU.length]);
  v.group.position.set(v.pos.x, 0, v.pos.z);
  scene.add(v.group);
  return v;
});

// ================= Notifikasi =================
const notifEl = document.createElement('div');
notifEl.id = 'notif';
document.body.appendChild(notifEl);
let notifTimer = 0;
function notif(teks, ms = 2600) {
  notifEl.textContent = teks;
  notifEl.classList.add('tampil');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => notifEl.classList.remove('tampil'), ms);
}

// ================= Aturan main =================
const dekat = (a, b, r = 3.5) => Math.hypot(a.x - b.x, a.z - b.z) < r;

function beriReputasi(n) {
  if (!n) return;
  S.reputasi += n;
  const lv = levelUntuk(S.reputasi).level;
  if (lv > S.level) {
    S.level = lv;
    tukarGedung(lv);
    notif(`Kopdes naik ke level ${lv}!`);
  }
}

function cekAchievement() {
  const baru = ach.buka({ misiSelesai: board.totalSelesai, hariBuka: S.streakBuka });
  for (const id of baru) {
    S.achievement.push(id);
    notif(`Achievement terbuka: ${id}`);
  }
  if (baru.length) simpan();
}

function beriHadiah(id, upah, reputasi) {
  S.uang += upah;
  S.misiSelesai.push(id);
  beriReputasi(reputasi);
  cekAchievement();
  notif(`Misi selesai! +${formatRupiah(upah)}`);
  simpan();
}

function selesaikanMisiAntar(id) {
  const r = board.complete(id, inventory);
  if (!r.ok) { notif(r.pesan); return; }
  if (id === 'restok-gula') {
    // Barang misi masuk rak toko.
    const m = MISSIONS.find((x) => x.id === id);
    for (const [bid, n] of Object.entries(m.butuh)) stock.add(bid, n);
  }
  beriHadiah(id, r.upah, r.reputasi);
}

function layani(v) {
  serveTarget = v.id;
}

function jualKe() {
  const boleh = barangTerbuka(S.level);
  const cart = {};
  const n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const id = boleh[Math.floor(Math.random() * boleh.length)];
    cart[id] = (cart[id] ?? 0) + 1;
  }
  for (const id of Object.keys(cart)) {
    if ((stock.qty[id] ?? 0) < cart[id]) delete cart[id];
  }
  if (Object.keys(cart).length === 0) {
    notif('Stok habis, pembeli pulang kecewa.');
    return;
  }
  txCounter += 1;
  const r = kasir.checkout(cart, `tx-${Date.now()}-${txCounter}`, stock);
  if (!r.ok) return;
  S.uang += r.total;
  day.recordSale(r.total, nilaiModal(cart));
  simpan();
}

// Gudang: ambil barang untuk misi antar yang diterima; kalau tidak ada
// yang perlu diambil, pesan stok dari supplier (isi ke 10, bayar modal).
function aksiGudang() {
  const daftar = board.daftar.filter((m) => m.diterima && !m.selesai && m.butuh);
  for (const m of daftar) {
    for (const [bid, n] of Object.entries(m.butuh)) {
      if ((inventory.isi[bid] ?? 0) < n) {
        inventory.add(bid, 1);
        simpan();
        notif(`Mengambil 1 ${ITEMS[bid].nama} dari gudang.`);
        return;
      }
    }
  }
  const boleh = barangTerbuka(S.level);
  const dibeli = [];
  let biaya = 0;
  for (const id of boleh) {
    const kurang = 10 - (stock.qty[id] ?? 0);
    if (kurang > 0) {
      const mampu = Math.min(kurang, Math.floor(S.uang / ITEMS[id].modal));
      if (mampu > 0) {
        stock.add(id, mampu);
        S.uang -= mampu * ITEMS[id].modal;
        biaya += mampu * ITEMS[id].modal;
        dibeli.push(`${mampu} ${ITEMS[id].nama}`);
      }
    }
  }
  simpan();
  notif(dibeli.length
    ? `Pesan stok: ${dibeli.join(', ')} (${formatRupiah(biaya)})`
    : 'Stok masih cukup, atau uang kurang.');
}

function tujuanPos(tujuan) {
  if (tujuan === 'toko') return spots.toko.pos;
  if (tujuan === 'sawah') return spots.sawah;
  if (tujuan === 'balaiDesa') return spots.balaiDesa;
  const r = spots.rumah.find((x) => x.id === tujuan);
  return r ? r.pos : null;
}

const bukaPapan = () => tampilDialogMisi(overlay, board.daftar, (id) => {
  board.accept(id);
  notif('Misi diambil! Cek papan untuk detail.');
  bukaPapan();
});

// Interaksi kontekstual (tombol E / AKSI).
function interaksi() {
  const p = player.pos;
  // 1. Layani pembeli di kasir (prioritas saat toko buka).
  if (day.fase === 'buka' && dekat(p, spots.toko.kasir)) {
    const antre = villagers
      .filter((v) => v.state === 'queue')
      .sort((a, b) => a.queueSlot - b.queueSlot);
    if (antre.length > 0) { layani(antre[0]); return; }
  }
  // 2. Papan misi.
  if (dekat(p, spots.papanMisi)) { bukaPapan(); return; }
  // 3. Gudang: ambil barang misi / pesan stok.
  if (dekat(p, spots.gudang)) { aksiGudang(); return; }
  // 4. Sawah: panen singkong.
  if (dekat(p, spots.sawah, 6)) {
    const r = board.progress('panen-singkong', { panen: true });
    if (r.selesai) beriHadiah('panen-singkong', r.upah, r.reputasi);
    else notif('Memanen singkong...');
    return;
  }
  // 5. Tujuan misi antar (dicek sebelum kunjungan rumah agar tidak tertelan).
  const misi = board.daftar.find((m) => {
    if (!m.diterima || m.selesai || m.aksi) return false;
    const t = tujuanPos(m.tujuan);
    return t && dekat(p, t);
  });
  if (misi) { selesaikanMisiAntar(misi.id); return; }
  // 6. Rumah warga: tagih iuran (tiap E di dekat rumah = 1 kunjungan).
  if (spots.rumah.some((r) => dekat(p, r.pos))) {
    const r = board.progress('tagih-iuran', { kunjungan: true });
    if (r.selesai) beriHadiah('tagih-iuran', r.upah, r.reputasi);
    else notif('Menagih iuran...');
    return;
  }
  notif('Tidak ada yang bisa dilakukan di sini.');
}

function toggleToko() {
  if (day.fase === 'buka') {
    disperseQueue(villagers);
    const lap = day.close();
    if (!lap) return;
    laporanTerakhir = lap;
    S.streakBuka = dibukaHariIni ? S.streakBuka + 1 : 0;
    dibukaHariIni = false;
    beriReputasi(reputasiKepuasan(lap.kepuasan));
    board.resetHarian();
    cekAchievement();
    simpan();
    tampilLaporan(overlay, lap, () => simpan());
  } else {
    day.open();
    dibukaHariIni = true;
    simpan();
    notif('Toko buka! Dekati kasir lalu tekan E / AKSI untuk melayani.');
  }
}

// ================= UI =================
mountHUD(document.getElementById('hud'), () => S, {
  onToggleToko: toggleToko,
  onMisi: () => bukaPapan(),
  onLapor: () => {
    if (laporanTerakhir) tampilLaporan(overlay, laporanTerakhir, () => {});
    else notif('Belum ada laporan hari ini.');
  },
});
mountSentuh(document.getElementById('sentuh'), input, () => {
  if (!overlay.hidden) return; // M4: jangan aksi di balik dialog
  interaksi();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' && !overlay.hidden) return;
  if (e.code === 'KeyE') interaksi();
});
window.addEventListener('beforeunload', () => simpan());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ================= Loop =================
const loop = createLoop({
  update(dt) {
    player.update(dt, input, colliders);
    updateCamera(camera, player, dt);
    const shopOpen = day.fase === 'buka';
    const ctx = { shopOpen, queueSpots: spots.toko.antre, villagers, serveId: serveTarget };
    for (const v of villagers) {
      const sebelum = v.state;
      stepVillager(v, dt, ctx);
      v.group.position.set(v.pos.x, 0, v.pos.z);
      if (sebelum === 'buying' && v.state === 'leave') jualKe();
    }
    serveTarget = null;
    tickDesa?.(dt);
  },
  render() { renderer.render(scene, camera); },
});
loop.start();
