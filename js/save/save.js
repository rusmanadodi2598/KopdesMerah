// Save/load localStorage — murni, tanpa three.js.
// Aman dari JSON korup: loadGame tidak pernah throw, selalu kembalikan
// state valid (default bila data rusak/hilang).
export const SAVE_KEY = 'kopdes3d_save_v1';

export function defaultState() {
  return {
    uang: 50000, // modal awal warung
    hari: 1,
    reputasi: 0,
    level: 1,
    fase: 'pagi',
    stock: {},
    inventory: {},
    misiSelesai: [],
    achievement: [],
    streakBuka: 0, // hari buka berturut-turut (untuk achievement buka-7)
  };
}

const simpan = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export function saveGame(state, storage = simpan()) {
  if (!storage) return;
  storage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(storage = simpan()) {
  let raw = null;
  try {
    raw = storage ? storage.getItem(SAVE_KEY) : null;
  } catch {
    return defaultState();
  }
  if (raw == null) return defaultState();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultState();
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return defaultState();
  }
  // Gabung di atas default: save lawas yang kehilangan field tetap valid.
  return { ...defaultState(), ...parsed };
}

export function hasSave(storage = simpan()) {
  try {
    return storage != null && storage.getItem(SAVE_KEY) != null;
  } catch {
    return false;
  }
}

export function clearSave(storage = simpan()) {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // abaikan
  }
}
