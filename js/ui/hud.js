// HUD + dialog Indonesia. formatRupiah & hudModel murni (tanpa DOM) agar
// bisa diuji di node; mountHUD / mountSentuh / dialog adalah wiring DOM
// tipis yang dipasang Task 11 di main.js.
export function formatRupiah(n) {
  const bulat = Math.trunc(n);
  const digit = String(Math.abs(bulat));
  const grup = [];
  for (let i = digit.length; i > 0; i -= 3) {
    grup.unshift(digit.slice(Math.max(0, i - 3), i));
  }
  return (bulat < 0 ? '-Rp' : 'Rp') + grup.join('.');
}

export function hudModel(state, misiAktif = []) {
  return {
    uang: formatRupiah(state.uang ?? 0),
    hari: state.hari ?? 1,
    reputasi: state.reputasi ?? 0,
    level: state.level ?? 1,
    fase: state.fase ?? 'pagi',
    objektif: misiAktif.slice(0, 2).map((m) =>
      m.aksi ? `🎯 ${m.judul} ${m.progres}/${m.target}` : `🎯 ${m.judul}`),
  };
}

// hudEl: #hud. getState: () => state. getMisi: () => daftar misi aktif.
// aksi: { onToggleToko, onMisi, onLapor, onJurnal }.
// Me-render bar + tombol + tracker objektif, refresh tiap 250ms.
export function mountHUD(hudEl, getState, aksi = {}, getMisi = () => []) {
  hudEl.innerHTML = `
    <div class="hud-bar">
      <span id="hud-hari"></span>
      <span id="hud-uang"></span>
      <span id="hud-rep"></span>
      <span id="hud-level"></span>
    </div>
    <div id="hud-objektif"></div>
    <div class="hud-tombol">
      <button id="btn-toko" type="button"></button>
      <button id="btn-misi" type="button">Misi</button>
      <button id="btn-lapor" type="button">Laporan</button>
      <button id="btn-jurnal" type="button">📖</button>
    </div>`;
  const elHari = hudEl.querySelector('#hud-hari');
  const elUang = hudEl.querySelector('#hud-uang');
  const elRep = hudEl.querySelector('#hud-rep');
  const elLevel = hudEl.querySelector('#hud-level');
  const elObj = hudEl.querySelector('#hud-objektif');
  const btnToko = hudEl.querySelector('#btn-toko');
  const btnMisi = hudEl.querySelector('#btn-misi');
  const btnLapor = hudEl.querySelector('#btn-lapor');
  const btnJurnal = hudEl.querySelector('#btn-jurnal');

  function render() {
    const m = hudModel(getState(), getMisi());
    elHari.textContent = `📅 Hari ${m.hari}`;
    elUang.textContent = `💰 ${m.uang}`;
    elRep.textContent = `⭐ ${m.reputasi}`;
    elLevel.textContent = `🏪 Lv ${m.level}`;
    elObj.innerHTML = m.objektif.map((t) => `<div>${t}</div>`).join('');
    elObj.hidden = m.objektif.length === 0;
    btnToko.textContent = m.fase === 'buka' ? 'Tutup Toko' : 'Buka Toko';
  }

  btnToko.addEventListener('click', () => aksi.onToggleToko?.());
  btnMisi.addEventListener('click', () => aksi.onMisi?.());
  btnLapor.addEventListener('click', () => aksi.onLapor?.());
  btnJurnal.addEventListener('click', () => aksi.onJurnal?.());

  render();
  const timer = setInterval(render, 250);
  return { render, destroy() { clearInterval(timer); } };
}

// Kontrol sentuh HP: joystick kiri + tombol AKSI kanan.
// Menulis ke input.touch (dipakai character.update) dan memanggil onAksi.
export function mountSentuh(sentuhEl, input, onAksi) {
  const zona = sentuhEl.querySelector('#joystick');
  const stick = sentuhEl.querySelector('#stick');
  const btnAksi = sentuhEl.querySelector('#btn-aksi');

  const atur = (dx, dy, aktif) => {
    input.touch.dx = dx;
    input.touch.dy = dy;
    input.touch.active = aktif;
    const r = Math.min(34, Math.hypot(dx, dy) * 34);
    const sudut = Math.atan2(dy, dx);
    stick.style.transform = `translate(${Math.cos(sudut) * r}px, ${Math.sin(sudut) * r}px)`;
  };
  const dariSentuh = (t) => {
    const b = zona.getBoundingClientRect();
    let dx = (t.clientX - (b.left + b.width / 2)) / (b.width / 2);
    let dy = (t.clientY - (b.top + b.height / 2)) / (b.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    return { dx, dy };
  };

  zona.addEventListener('touchstart', (e) => {
    const p = dariSentuh(e.changedTouches[0]);
    atur(p.dx, p.dy, true);
    e.preventDefault();
  }, { passive: false });
  zona.addEventListener('touchmove', (e) => {
    const p = dariSentuh(e.changedTouches[0]);
    atur(p.dx, p.dy, true);
    e.preventDefault();
  }, { passive: false });
  const lepas = () => {
    atur(0, 0, false);
    stick.style.transform = 'translate(0px, 0px)';
  };
  zona.addEventListener('touchend', lepas);
  zona.addEventListener('touchcancel', lepas);
  // Guard double-fire: di HP, touchstart diikuti click sintetis ~300ms.
  let aksiTerakhir = 0;
  btnAksi.addEventListener('touchstart', (e) => {
    aksiTerakhir = Date.now();
    onAksi?.();
    e.preventDefault();
  }, { passive: false });
  btnAksi.addEventListener('click', () => {
    if (Date.now() - aksiTerakhir > 500) onAksi?.();
  });

  // Nyalakan glow saat ada interaksi tersedia (ala tombol Tangan Hutan Kabut).
  return { setSiap(siap) { btnAksi.classList.toggle('siap', !!siap); } };
}

// Ikon tile per misi dari kata kunci judul (murni, bisa diuji).
export function ikonMisi(judul = '') {
  const j = judul.toLowerCase();
  if (j.includes('beras') || j.includes('panen') || j.includes('singkong')) return '🌾';
  if (j.includes('iuran') || j.includes('rumah')) return '🏠';
  if (j.includes('stok') || j.includes('rak') || j.includes('gula')) return '📦';
  if (j.includes('kopi') || j.includes('balai')) return '☕';
  return '🎯';
}

// Dialog daftar misi (overlay). onAccept(id) dipanggil saat tombol Ambil diklik.
export function tampilDialogMisi(overlayEl, daftar, onAccept) {
  const kartu = daftar.map((m) => {
    const status = m.selesai ? '<span class="lencana lencana-hijau">Selesai</span>'
      : m.diterima ? '<span class="lencana lencana-kuning">Diterima</span>'
      : `<button type="button" data-ambil="${m.id}">Ambil</button>`;
    const syarat = m.butuh
      ? `Butuh: ${Object.entries(m.butuh).map(([b, n]) => `${n} ${b}`).join(', ')}`
      : `Aksi: ${m.aksi} ${m.target}x`;
    return `<div class="misi"><div class="misi-ikon">${ikonMisi(m.judul)}</div>`
      + `<div class="misi-teks"><strong>${m.judul}</strong>`
      + `<small>${syarat} · Upah ${formatRupiah(m.upah)}</small></div>${status}</div>`;
  }).join('');
  overlayEl.innerHTML = `<div class="panel"><h2>📋 Papan Misi</h2>${kartu}<button type="button" data-tutup>Tutup</button></div>`;
  overlayEl.hidden = false;
  overlayEl.querySelectorAll('[data-ambil]').forEach((b) =>
    b.addEventListener('click', () => { onAccept?.(b.dataset.ambil); }));
  overlayEl.querySelector('[data-tutup]').addEventListener('click', () => sembunyiOverlay(overlayEl));
}

// Panel laporan harian (overlay). onTutup dipanggil setelah tombol ditekan.
export function tampilLaporan(overlayEl, laporan, onTutup) {
  overlayEl.innerHTML = `<div class="panel"><h2>🧾 Laporan Hari ${laporan.hari}</h2>
    <dl>
      <div><dt>Omzet</dt><dd>${formatRupiah(laporan.omzet)}</dd></div>
      <div><dt>Laba</dt><dd>${formatRupiah(laporan.laba)}</dd></div>
      <div><dt>Pembeli</dt><dd>${laporan.pembeli}</dd></div>
      <div><dt>Kepuasan</dt><dd>${laporan.kepuasan}</dd></div>
    </dl>
    <button type="button" data-tutup>Tutup</button></div>`;
  overlayEl.hidden = false;
  overlayEl.querySelector('[data-tutup]').addEventListener('click', () => {
    sembunyiOverlay(overlayEl);
    onTutup?.();
  });
}

export function sembunyiOverlay(overlayEl) {
  overlayEl.hidden = true;
  overlayEl.innerHTML = '';
}
