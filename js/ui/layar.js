// Layar-layar game shell ala Hutan Kabut: judul, bantuan, jeda, toast,
// prompt interaksi, transisi fade, kartu hari. Wiring DOM tipis; logika
// teks murni agar bisa diuji.

export const KONTROL_PC = [
  ['W A S D', 'jalan'],
  ['Shift', 'lari'],
  ['E', 'aksi / interaksi'],
  ['J', 'buku catatan misteri'],
  ['H', 'bantuan'],
  ['G', 'kualitas grafis'],
  ['M', 'suara on/off'],
  ['Esc', 'jeda'],
];

export const KONTROL_HP = [
  ['Joystick kiri', 'jalan · dorong penuh = lari'],
  ['Tombol AKSI', 'interaksi (menyala saat tersedia)'],
];

// ---- Layar judul ----
export function tampilJudul(el, { onMulai, sentuh }) {
  const baris = (daftar) => daftar
    .map(([t, d]) => `<div class="krow"><kbd>${t}</kbd><span>${d}</span></div>`)
    .join('');
  el.innerHTML = `
    <div class="judul-kartu">
      <div class="judul-logo">🏪</div>
      <h1>KOPDES 3D</h1>
      <p class="judul-sub">Maju Desaku — koperasi desa cozy</p>
      <button type="button" id="btn-mulai" class="denyut">— klik untuk mulai —</button>
      <div class="kontrol-grid">${baris(sentuh ? KONTROL_HP : KONTROL_PC)}</div>
    </div>`;
  el.hidden = false;
  el.querySelector('#btn-mulai').addEventListener('click', () => onMulai?.());
}

export function sembunyiJudul(el) {
  el.hidden = true;
  el.innerHTML = '';
}

// ---- Bantuan (H) ----
export function tampilBantuan(el, { onTutup, sentuh }) {
  const baris = (daftar, judul) => `
    <h3>${judul}</h3>` + daftar
    .map(([t, d]) => `<div class="krow"><kbd>${t}</kbd><span>${d}</span></div>`)
    .join('');
  el.innerHTML = `
    <div class="panel">
      <h2>❓ Bantuan</h2>
      ${baris(KONTROL_PC, '⌨️ Keyboard')}
      ${baris(KONTROL_HP, '📱 Layar sentuh')}
      <p class="tips">Dekati papan misi, gudang, sawah, atau kasir lalu tekan
      <kbd>E</kbd> / <kbd>AKSI</kbd>. Buka toko di pagi hari, layani pembeli,
      tutup toko untuk laporan harian.</p>
      <button type="button" data-tutup>Tutup</button>
    </div>`;
  el.hidden = false;
  el.querySelector('[data-tutup]').addEventListener('click', () => {
    sembunyiBantuan(el);
    onTutup?.();
  });
}

export function sembunyiBantuan(el) {
  el.hidden = true;
  el.innerHTML = '';
}

// ---- Jeda (Esc) ----
export function tampilJeda(el, aksi) {
  el.innerHTML = `
    <div class="panel">
      <h2>⏸️ Jeda</h2>
      <div class="jeda-menu">
        <button type="button" data-jeda="lanjut">▶️ Lanjut</button>
        <button type="button" data-jeda="bantuan">❓ Bantuan</button>
        <button type="button" data-jeda="kualitas">🎨 Kualitas: ${aksi.kualitas}</button>
        <button type="button" data-jeda="suara">🔊 Suara: ${aksi.bisu ? 'Mati' : 'Nyala'}</button>
        <button type="button" data-jeda="judul">🏠 Judul</button>
        <button type="button" data-jeda="baru" class="bahaya">🗑️ Mulai Baru</button>
      </div>
    </div>`;
  el.hidden = false;
  el.querySelectorAll('[data-jeda]').forEach((b) =>
    b.addEventListener('click', () => aksi.onPilih?.(b.dataset.jeda)));
}

export function sembunyiJeda(el) {
  el.hidden = true;
  el.innerHTML = '';
}

// ---- Toast bertumpuk (pengganti notif tunggal) ----
export function toast(el, teks, ms = 2600) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = teks;
  el.appendChild(t);
  while (el.children.length > 3) el.firstChild.remove();
  requestAnimationFrame(() => t.classList.add('tampil'));
  setTimeout(() => {
    t.classList.remove('tampil');
    setTimeout(() => t.remove(), 400);
  }, ms);
}

// ---- Prompt interaksi kontekstual ala "E <aksi>" ----
export function setPrompt(el, teks, tombol = 'E') {
  if (!teks) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = '';
  const k = document.createElement('kbd');
  k.textContent = tombol;
  el.appendChild(k);
  el.appendChild(document.createTextNode(` ${teks}`));
}

// ---- Transisi fade + kartu tengah (untuk ganti hari) ----
export function fadeKe(el, tampil, ms = 500) {
  el.classList.toggle('gelap', tampil);
}

export function kartuHari(el, hari, ms = 1800) {
  el.innerHTML = `<div class="kartu-hari-tengah"><div>☀️</div><h2>Hari ${hari}</h2></div>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('tampil'));
  setTimeout(() => {
    el.classList.remove('tampil');
    setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 400);
  }, ms);
}

// ---- Kartu episode sinematik (judul / cliffhanger / preview) ----
// Ditutup manual via sembunyiKartuEpisode (diatur episode manager),
// klik juga dilewati oleh handler main.js.
export function tampilKartuEpisode(el, { kicker = '', judul = '', sub = '' }) {
  el.innerHTML =
    `<div class="kartu-episode-tengah">` +
    (kicker ? `<div class="kep-kicker">${kicker}</div>` : '') +
    (judul ? `<h2>${judul}</h2>` : '') +
    (sub ? `<p>${sub}</p>` : '') +
    `<div class="kep-hint">E ▸ lewati</div></div>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('tampil'));
}

export function sembunyiKartuEpisode(el) {
  el.classList.remove('tampil');
  el.hidden = true;
  el.innerHTML = '';
}
