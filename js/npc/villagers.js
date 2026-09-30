import { bangunTubuh } from '../player/rig.js';

// Brain NPC murni (tanpa three.js) + villagerMesh() terpisah untuk visual.
// State: wander → toShop → queue → buying → leave → wander
const SPEED = 2; // m/s

function gerak(v, target, dt, speed = SPEED) {
  const dx = target.x - v.pos.x;
  const dz = target.z - v.pos.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.25) return true;
  const step = Math.min(d, speed * dt);
  v.pos.x += (dx / d) * step;
  v.pos.z += (dz / d) * step;
  return false;
}

function slotBebas(villagers, queueSpots) {
  const dipakai = new Set();
  for (const v of villagers) {
    if (v.queueSlot != null) dipakai.add(v.queueSlot);
  }
  for (let i = 0; i < queueSpots.length; i++) {
    if (!dipakai.has(i)) return i;
  }
  return -1;
}

export function createVillager(id, waypoints, opts = {}) {
  return {
    id,
    pos: { x: waypoints[0].x, z: waypoints[0].z },
    waypoints,
    wpIndex: 1 % waypoints.length,
    state: 'wander',
    queueSlot: null,
    timer: 0,
    cooldown: 0,
    shopper: opts.shopper ?? Math.random() < 0.6,
    group: null, // diisi wiring (Task 11) via villagerMesh()
  };
}

export function stepVillager(v, dt, ctx) {
  const { shopOpen, queueSpots, villagers = [] } = ctx;
  switch (v.state) {
    case 'wander': {
      if (v.cooldown > 0) v.cooldown -= dt;
      if (shopOpen && v.shopper && v.cooldown <= 0) {
        const slot = slotBebas(villagers, queueSpots);
        if (slot >= 0) {
          v.state = 'toShop';
          v.queueSlot = slot;
          break;
        }
      }
      const wp = v.waypoints[v.wpIndex];
      if (gerak(v, wp, dt)) v.wpIndex = (v.wpIndex + 1) % v.waypoints.length;
      break;
    }
    case 'toShop': {
      if (!shopOpen) {
        v.queueSlot = null;
        v.state = 'leave';
        break;
      }
      if (gerak(v, queueSpots[v.queueSlot], dt)) v.state = 'queue';
      break;
    }
    case 'queue': {
      // Wiring (Task 11) melayani antrean dengan mengisi ctx.serveId = id
      // villager yang sedang dilayani. (Plan menyebut onArrive; kontrak
      // aktual modul ini adalah serveId.)
      if (ctx.serveId === v.id) {
        v.state = 'buying';
        v.timer = 2;
      }
      break;
    }
    case 'buying': {
      v.timer -= dt;
      if (v.timer <= 0) {
        v.queueSlot = null;
        v.shopper = false;
        v.cooldown = 20;
        v.state = 'leave';
      }
      break;
    }
    case 'leave': {
      if (gerak(v, v.waypoints[0], dt)) v.state = 'wander';
      break;
    }
    default:
      break;
  }
}

// Dipanggil saat toko tutup: antrean bubar, semua pulang.
export function disperseQueue(villagers) {
  for (const v of villagers) {
    if (v.state === 'toShop' || v.state === 'queue' || v.state === 'buying') {
      v.queueSlot = null;
      v.state = 'leave';
    }
  }
}

// Visual low-poly, terpisah dari brain.
export function villagerMesh(warnaBaju = 0xc25e5e) {
  const { group, ayun } = bangunTubuh({ baju: warnaBaju, kepalaR: 0.24 });
  group.userData.ayun = ayun;
  return group;
}

// Ayunan jalan warga; bergerak=true saat state berpindah (wander/toShop/leave).
export function ayunVillager(group, dt, bergerak) {
  group.userData.ayun?.(dt, bergerak, 0.8);
}
