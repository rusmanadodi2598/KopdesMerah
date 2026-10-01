import * as THREE from 'three';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { buildVillage } from './world/village.js';
import { buildKopdes } from './world/kopdes.js';
import { createPlayer, updateCamera } from './player/character.js';
import { createVillager, stepVillager, disperseQueue, villagerMesh, ayunVillager } from './npc/villagers.js';
import { createStock, ITEMS, nilaiModal } from './shop/stock.js';
import { createCashier } from './shop/cashier.js';
import { createDay } from './shop/day.js';
import { MISSIONS, createBoard, createAchievements } from './missions/board.js';
import { createInventory } from './player/inventory.js';
import { levelUntuk, barangTerbuka, reputasiKepuasan } from './progression/levels.js';
import { defaultState, saveGame, loadGame, hasSave } from './save/save.js';
import { sinkronState } from './save/sync.js';
import { mountHUD, mountSentuh, tampilDialogMisi, tampilLaporan, formatRupiah } from './ui/hud.js';
import {
  tampilJudul, sembunyiJudul, tampilBantuan, sembunyiBantuan,
  tampilJeda, sembunyiJeda, toast, setPrompt, fadeKe, kartuHari,
  tampilKartuEpisode, sembunyiKartuEpisode,
} from './ui/layar.js';
import { bunyi, toggleBisu, apakahBisu } from './core/suara.js';
import { tingkatBerikutnya, bacaKualitas, terapkanKualitas } from './core/kualitas.js';
import { createMalam, terapkanFaseMalam, tickVisualMalam, FASE } from './core/malam.js';
import { createDialog, renderDialog } from './ui/dialog.js';
import { createEpisodeManager } from './episodes/manager.js';
import { E01 } from './episodes/data/e01.js';
import { createJournal, renderJournal, sembunyiJournal } from './ui/journal.js';

// Kualitas grafis dibaca awal karena dipakai saat membangun dunia.
let kualitas = bacaKualitas();

// ================= Three.js dasar =================

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
const skyU = {
  atas: { value: new THREE.Color(0x2f7fc4) },
  bawah: { value: new THREE.Color(0xd8ecf9) },
};
{
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyU,
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

const { colliders, spots, kopdes: kopdesAwal, tick: tickDesa, lampuJalan, efek } = buildVillage(scene);
terapkanKualitas({ renderer, scene, efek }, kualitas);
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

// ================= Malam: bulan, cahaya lampu jalan, lentera Raka =================
const bulan = new THREE.DirectionalLight(0x8fb4ff, 0);
bulan.position.set(-20, 30, -10);
scene.add(bulan);

const lampu3D = lampuJalan.map((l) => {
  const cahaya = new THREE.PointLight(0xffd9a0, 1.4, 13, 1.8);
  cahaya.position.set(l.x, 3.4, l.z);
  cahaya.visible = false;
  scene.add(cahaya);
  return { ...l, cahaya };
});

// Lentera Raka: point light hangat mengikuti pemain (hanya menyala saat malam).
const lentera = new THREE.PointLight(0xffb347, 2.2, 11, 1.8);
lentera.position.set(0, 1.7, 0.8);
lentera.visible = false;
player.group.add(lentera);

const malam = createMalam();
const dialog = createDialog();
const dialogEl = document.getElementById('dialog');
dialogEl.addEventListener('click', () => {
  if (dialog.tekan()) renderDialog(dialogEl, dialog);
});
const envMalam = { scene, sun, bulan, skyU, lampu: lampu3D, lentera };

// ================= Episode: Dua Belas Malam Kabut =================
const kartuEpisodeEl = document.getElementById('kartu-episode');
const journalEl = document.getElementById('journal');
const journal = createJournal();
if (!S.episode) S.episode = { selesai: [], aktif: null, petunjuk: [] };
for (const p of S.episode.petunjuk ?? []) journal.tambah(p.episode, p.judul, p.teks);
let journalBuka = false;
let penjualanEpisode = 0;

// Bayangan bertopi caping (cliffhanger E01): humanoid gelap sederhana.
const siluet = (() => {
  const g = new THREE.Group();
  const gelap = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 1 });
  const badan = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 4, 8), gelap);
  badan.position.y = 1.0;
  const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gelap);
  kepala.position.y = 1.82;
  const caping = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.32, 10),
    new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 }),
  );
  caping.position.y = 2.02;
  g.add(badan, kepala, caping);
  g.position.set(36, 0, 8);
  g.rotation.y = -Math.PI / 2; // menghadap barat, ke arah pemain
  g.visible = false;
  scene.add(g);
  return g;
})();
const TITIK_SELIDIK = { x: 32, z: 8 };

const ctxEpisode = {
  // E01: 3 dari 4 lampu padam misterius (indeks 1..3).
  malamE01() {
    malam.padamkanLampu(1);
    malam.padamkanLampu(2);
    malam.padamkanLampu(3);
    terapkanFase();
    bunyi('padam');
  },
  spawnSiluet() {
    siluet.visible = true;
  },
  hilangkanSiluet() {
    siluet.visible = false;
  },
  // E01 butuh 3 penjualan: pastikan semua warga mau belanja (tanpa cooldown).
  jaminPembeli() {
    for (const v of villagers) {
      v.shopper = true;
      v.cooldown = 0;
    }
  },
};

const em = createEpisodeManager({
  kartu: ({ kicker, judul, sub }) => tampilKartuEpisode(kartuEpisodeEl, { kicker, judul, sub }),
  tutupKartu: () => sembunyiKartuEpisode(kartuEpisodeEl),
  dialog: (baris, cb) => {
    dialog.mulai(baris, () => {
      renderDialog(dialogEl, dialog);
      cb();
    });
    renderDialog(dialogEl, dialog);
  },
  setObjektif: () => {}, // objektif cerita dibaca HUD via em.objektifTeks()
  jurnal: (epId, judul, teks) => {
    journal.tambah(epId, judul, teks);
    S.episode.petunjuk.push({ episode: epId, judul, teks });
    simpan();
    bunyi('sukses');
    notif(`📖 Petunjuk baru: ${judul} (buka dengan J)`);
  },
  suara: (nama) => bunyi(nama),
  selesai: (def) => {
    if (!S.episode.selesai.includes(def.id)) S.episode.selesai.push(def.id);
    S.episode.aktif = null;
    simpan();
    bunyi('sukses');
    notif(`🎬 Episode ${def.nomor} "${def.judul}" selesai! Tekan J untuk baca ulang petunjuk.`);
  },
});
kartuEpisodeEl.addEventListener('click', () => em.lewatiKartu());

function toggleJournal() {
  journalBuka = !journalBuka;
  if (journalBuka) {
    bunyi('klik');
    renderJournal(journalEl, journal);
  } else {
    sembunyiJournal(journalEl);
  }
}

// Rumah Raka = rumah-w2 (warga pulang saat malam; hanya Raka yang berkeliaran).
const RUMAH_RAKA = spots.rumah.find((r) => r.id === 'rumah-w2').pos;

function terapkanFase() {
  terapkanFaseMalam(envMalam, malam);
  for (const v of villagers) v.group.visible = malam.fase !== FASE.MALAM;
}

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

// ================= Notifikasi (toast bertumpuk) =================
const toastEl = document.getElementById('toast');
function notif(teks, ms = 2600) {
  toast(toastEl, teks, ms);
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
  bunyi('sukses');
  S.uang += upah;
  S.misiSelesai.push(id);
  beriReputasi(reputasi);
  cekAchievement();
  notif(`Misi selesai! +${formatRupiah(upah)}`);
  simpan();
}

function selesaikanMisiAntar(id) {
  const r = board.complete(id, inventory);
  if (!r.ok) { bunyi('gagal'); notif(r.pesan); return; }
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
  bunyi('koin');
  S.uang += r.total;
  day.recordSale(r.total, nilaiModal(cart));
  simpan();
  // Hook episode E01: hitung penjualan selama episode berjalan.
  penjualanEpisode += 1;
  if (penjualanEpisode === 2) em.tandaiSelesai('layani-2');
  else if (penjualanEpisode === 3) em.tandaiSelesai('layani-1');
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
  bunyi('klik');
  board.accept(id);
  notif('Misi diambil! Lihat tracker di kiri atas.');
  bukaPapan();
});

// Interaksi kontekstual: cariInteraksi() murni-mencari (untuk prompt HUD),
// interaksi() mengeksekusi.
function cariInteraksi() {
  const p = player.pos;
  // Malam: warga sudah pulang — hanya lampu jalan & tidur yang bisa diakses.
  if (malam.fase === FASE.MALAM) {
    if (dekat(p, RUMAH_RAKA)) return { label: 'Tidur', jalan: tidur };
    const li = lampu3D.findIndex((l) => dekat(p, l, 3));
    if (li >= 0) {
      const nyala = malam.lampuNyala(li);
      return {
        label: nyala ? 'Padamkan lampu jalan' : 'Nyalakan lampu jalan',
        jalan: () => toggleLampu(li),
      };
    }
    return null;
  }
  // 1. Layani pembeli di kasir (prioritas saat toko buka).
  if (day.fase === 'buka' && dekat(p, spots.toko.kasir)) {
    const antre = villagers
      .filter((v) => v.state === 'queue')
      .sort((a, b) => a.queueSlot - b.queueSlot);
    if (antre.length > 0) return { label: 'Layani pembeli', jalan: () => layani(antre[0]) };
    return { label: 'Kasir', jalan: () => notif('Belum ada pembeli mengantre.') };
  }
  // 2. Papan misi.
  if (dekat(p, spots.papanMisi)) return { label: 'Buka papan misi', jalan: bukaPapan };
  // 3. Gudang: ambil barang misi / pesan stok.
  if (dekat(p, spots.gudang)) return { label: 'Ambil barang / pesan stok', jalan: aksiGudang };
  // 4. Sawah: panen singkong.
  if (dekat(p, spots.sawah, 6)) return { label: 'Panen singkong', jalan: aksiSawah };
  // 5. Tujuan misi antar (dicek sebelum kunjungan rumah agar tidak tertelan).
  const misi = board.daftar.find((m) => {
    if (!m.diterima || m.selesai || m.aksi) return false;
    const t = tujuanPos(m.tujuan);
    return t && dekat(p, t);
  });
  if (misi) return { label: `Antar ke ${misi.tujuan}`, jalan: () => selesaikanMisiAntar(misi.id) };
  // 6. Rumah warga: tagih iuran (tiap E di dekat rumah = 1 kunjungan).
  if (spots.rumah.some((r) => dekat(p, r.pos))) return { label: 'Tagih iuran', jalan: aksiTagih };
  return null;
}

function aksiSawah() {
  const r = board.progress('panen-singkong', { panen: true });
  if (r.selesai) beriHadiah('panen-singkong', r.upah, r.reputasi);
  else notif('Memanen singkong...');
}

function aksiTagih() {
  const r = board.progress('tagih-iuran', { kunjungan: true });
  if (r.selesai) beriHadiah('tagih-iuran', r.upah, r.reputasi);
  else notif('Menagih iuran...');
}

function interaksi() {
  const it = cariInteraksi();
  if (it) it.jalan();
  else notif('Tidak ada yang bisa dilakukan di sini.');
}

// Transisi tutup hari: fade → kartu "Hari N" → laporan (ala fade Hutan Kabut).
const fadeEl = document.getElementById('fade');
const kartuEl = document.getElementById('kartu-hari');
function transisiHari(lap) {
  bunyi('tutup');
  fadeKe(fadeEl, true);
  setTimeout(() => {
    kartuHari(kartuEl, day.hari);
    setTimeout(() => {
      fadeKe(fadeEl, false);
      tampilLaporan(overlay, lap, () => simpan());
    }, 2100);
  }, 550);
}

function toggleToko() {
  if (malam.fase === FASE.MALAM) {
    notif('Malam hari toko tutup. Pulanglah dan tidur (E).');
    return;
  }
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
    masukMalam(lap);
  } else {
    day.open();
    dibukaHariIni = true;
    em.tandaiSelesai('buka-toko');
    simpan();
    bunyi('buka');
    notif('Toko buka! Dekati kasir lalu tekan E / AKSI untuk melayani.');
  }
}

// Malam tiba setelah toko tutup: kabut turun, lampu jalan menyala, warga pulang.
// Laporan harian baru tampil setelah Raka tidur (transisiHari dipakai ulang).
let laporanTertunda = null;
let malamPertama = true;

function masukMalam(lap) {
  laporanTertunda = lap;
  fadeKe(fadeEl, true);
  setTimeout(() => {
    malam.setFase(FASE.MALAM);
    malam.nyalakanSemua();
    malam.isiMinyak();
    terapkanFase();
    // Setelah lampu dinyalakan: tandai objektif tutup-toko. Bila E01 aktif,
    // beat berikutnya (kartu-malam) memadamkan 3 lampu via onStart.
    em.tandaiSelesai('tutup-toko');
    fadeKe(fadeEl, false);
    bunyi('lentera');
    notif('🌙 Malam tiba di Sukarame Mistery. Pulanglah dan tidur (E).');
    // Dialog intro generik hanya bila tak ada episode aktif (episode punya beat sendiri).
    const introGenerik = malamPertama && !em.aktif;
    malamPertama = false;
    if (introGenerik) {
      dialog.mulai([
        { pembicara: 'Raka', teks: 'Malam pertama... desa ini sepi sekali.' },
        { pembicara: 'Raka', teks: 'Lentera ayah masih menyala. Sebaiknya aku cepat pulang.' },
      ]);
      renderDialog(dialogEl, dialog);
    }
  }, 600);
}

function tidur() {
  dialog.tutup();
  renderDialog(dialogEl, dialog);
  bunyi('tutup');
  const lap = laporanTertunda;
  laporanTertunda = null;
  malam.setFase(FASE.SIANG);
  malam.isiMinyak();
  terapkanFase();
  if (lap) transisiHari(lap);
}

function toggleLampu(i) {
  if (malam.lampuNyala(i)) { malam.padamkanLampu(i); bunyi('padam'); }
  else { malam.nyalakanLampu(i); bunyi('lentera'); }
  terapkanFaseMalam(envMalam, malam);
  // Hook episode E01: semua lampu menyala lagi.
  if (malam.jumlahLampuPadam() === 0) em.tandaiSelesai('nyalakan-3');
}

// ================= UI =================
const SENTUH = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)
  || (typeof window !== 'undefined' && 'ontouchstart' in window);
const hudWrap = document.getElementById('hud');
const sentuhWrap = document.getElementById('sentuh');
const judulEl = document.getElementById('judul');
const bantuanEl = document.getElementById('bantuan');
const jedaEl = document.getElementById('jeda');
const promptEl = document.getElementById('prompt');

// State layar: judul → main ⇄ jeda ⇄ bantuan. Loop update hanya jalan di 'main'.
let layar = 'judul';

function misiAktif() {
  const daftar = board.daftar.filter((m) => m.diterima && !m.selesai);
  // Objektif cerita episode diprioritaskan di atas objektif malam generik.
  const ep = em.objektifTeks();
  if (ep) daftar.unshift({ judul: `🎬 ${ep}` });
  else if (malam.fase === FASE.MALAM) daftar.unshift({ judul: '🌙 Pulang ke rumah dan tidur' });
  return daftar;
}

mountHUD(hudWrap, () => S, {
  onToggleToko: () => { bunyi('klik'); toggleToko(); },
  onMisi: () => { bunyi('klik'); bukaPapan(); },
  onLapor: () => {
    bunyi('klik');
    if (laporanTerakhir) tampilLaporan(overlay, laporanTerakhir, () => {});
    else notif('Belum ada laporan hari ini.');
  },
  onJurnal: () => toggleJournal(),
}, misiAktif);

const sentuhApi = mountSentuh(sentuhWrap, input, () => {
  if (layar !== 'main' || !overlay.hidden) return; // M4: jangan aksi di balik dialog
  if (dialog.adaBaris) { dialog.tekan(); renderDialog(dialogEl, dialog); return; }
  if (em.kartuAktif) { em.lewatiKartu(); return; }
  interaksi();
});

function aturVisibilitasHUD() {
  const diJudul = layar === 'judul';
  hudWrap.hidden = diJudul;
  sentuhWrap.hidden = diJudul;
}

function mulaiMain() {
  bunyi('klik');
  sembunyiJudul(judulEl);
  layar = 'main';
  aturVisibilitasHUD();
  // Snap kamera ke belakang pemain (hindari lerp jauh dari orbit judul).
  camera.position.set(player.pos.x, 3.5, player.pos.z + 6);
  camera.lookAt(player.pos.x, 1.2, player.pos.z);
  notif('Selamat datang di Kopdes! Tekan H untuk bantuan.');
  // Auto-mulai E01 bila belum selesai (resume sederhana: dari awal episode).
  if (!S.episode.selesai.includes('e01') && !em.aktif) {
    S.episode.aktif = 'e01';
    penjualanEpisode = 0;
    simpan();
    em.mulai(E01, ctxEpisode);
  }
}

function keJudul() {
  layar = 'judul';
  aturVisibilitasHUD();
  tampilJudul(judulEl, { onMulai: mulaiMain, sentuh: SENTUH });
}

function bukaJeda() {
  if (layar !== 'main') return;
  bunyi('klik');
  layar = 'jeda';
  tampilJeda(jedaEl, {
    kualitas,
    bisu: apakahBisu(),
    onPilih: pilihJeda,
  });
}

function tutupJeda() {
  sembunyiJeda(jedaEl);
  layar = 'main';
}

let kembaliBantuan = null;
function bukaBantuan(kembali) {
  kembaliBantuan = kembali ?? (() => { layar = 'main'; });
  layar = 'bantuan';
  tampilBantuan(bantuanEl, {
    sentuh: SENTUH,
    onTutup: () => {
      const k = kembaliBantuan;
      kembaliBantuan = null;
      k?.();
    },
  });
}

function pilihJeda(pilih) {
  bunyi('klik');
  if (pilih === 'lanjut') tutupJeda();
  else if (pilih === 'bantuan') { sembunyiJeda(jedaEl); bukaBantuan(bukaJeda); }
  else if (pilih === 'kualitas') {
    kualitas = tingkatBerikutnya(kualitas);
    terapkanKualitas({ renderer, scene, efek }, kualitas);
    notif(`Kualitas grafis: ${kualitas}`);
    bukaJeda();
  } else if (pilih === 'suara') {
    const b = toggleBisu();
    notif(b ? 'Suara dimatikan.' : 'Suara dinyalakan.');
    if (layar === 'jeda') bukaJeda();
  } else if (pilih === 'judul') { sembunyiJeda(jedaEl); keJudul(); }
  else if (pilih === 'baru') {
    if (confirm('Hapus simpanan dan mulai dari awal?')) {
      localStorage.removeItem('kopdes3d_save_v1');
      location.reload();
    }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (journalBuka) { toggleJournal(); return; }
    if (layar === 'main') bukaJeda();
    else if (layar === 'jeda') tutupJeda();
    else if (layar === 'bantuan') {
      sembunyiBantuan(bantuanEl);
      const k = kembaliBantuan;
      kembaliBantuan = null;
      k?.();
    }
    return;
  }
  if (layar !== 'main') return;
  if (e.code === 'KeyH') { bukaBantuan(); return; }
  if (e.code === 'KeyG') {
    bunyi('klik');
    kualitas = tingkatBerikutnya(kualitas);
    terapkanKualitas({ renderer, scene, efek }, kualitas);
    notif(`Kualitas grafis: ${kualitas}`);
    return;
  }
  if (e.code === 'KeyM') {
    const b = toggleBisu();
    bunyi('klik');
    notif(b ? 'Suara dimatikan (M untuk menyalakan).' : 'Suara dinyalakan.');
    return;
  }
  if (e.code === 'KeyJ' && overlay.hidden) { toggleJournal(); return; }
  if (e.code === 'KeyE' && !overlay.hidden) return;
  if (e.code === 'KeyE') {
    if (dialog.adaBaris) { dialog.tekan(); renderDialog(dialogEl, dialog); return; }
    if (em.kartuAktif) { em.lewatiKartu(); return; }
    interaksi();
  }
});
window.addEventListener('beforeunload', () => simpan());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ================= Loop =================
let sudutJudul = 0;
let promptTimer = 0;
const loop = createLoop({
  update(dt) {
    // Layar judul: kamera mengorbit desa sebagai latar sinematik.
    if (layar === 'judul') {
      sudutJudul += dt * 0.07;
      camera.position.set(Math.sin(sudutJudul) * 30, 11, Math.cos(sudutJudul) * 30);
      camera.lookAt(0, 2, 0);
      tickDesa?.(dt);
      return;
    }
    if (layar !== 'main') return; // jeda / bantuan: dunia berhenti
    player.update(dt, input, colliders);
    updateCamera(camera, player, dt);
    // Dialog: typewriter + render tiap frame.
    dialog.tick(dt);
    renderDialog(dialogEl, dialog);
    // Episode: timer kartu/tunggu + trigger posisi cerita.
    em.tick(dt);
    if (em.beatId === 'selidiki' && dekat(player.pos, TITIK_SELIDIK, 6)) {
      em.tandaiSelesai('selidiki');
    }
    // Malam: minyak lentera berkurang + kedip cahaya.
    if (malam.fase === FASE.MALAM) {
      if (malam.tick(dt)) {
        terapkanFaseMalam(envMalam, malam);
        bunyi('padam');
        notif('Minyak lentera habis! Cepat pulang sebelum gelap total.');
      }
      tickVisualMalam(envMalam, malam, performance.now() / 1000);
    }
    // Prompt interaksi kontekstual (throttle 200ms; sembunyi saat dialog aktif).
    promptTimer += dt;
    if (promptTimer > 0.2) {
      promptTimer = 0;
      const it = dialog.adaBaris ? null : cariInteraksi();
      setPrompt(promptEl, it ? it.label : null, SENTUH ? 'AKSI' : 'E');
      sentuhApi.setSiap(!!it);
    }
    const shopOpen = day.fase === 'buka';
    const ctx = { shopOpen, queueSpots: spots.toko.antre, villagers, serveId: serveTarget };
    for (const v of villagers) {
      const sebelum = v.state;
      stepVillager(v, dt, ctx);
      v.group.position.set(v.pos.x, 0, v.pos.z);
      ayunVillager(v.group, dt, v.state === 'wander' || v.state === 'toShop' || v.state === 'leave');
      if (sebelum === 'buying' && v.state === 'leave') jualKe();
    }
    serveTarget = null;
    tickDesa?.(dt);
  },
  render() { renderer.render(scene, camera); },
});
keJudul();
loop.start();
