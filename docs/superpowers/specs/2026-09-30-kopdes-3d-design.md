# Design Spec — Kopdes 3D: Maju Desaku

Tanggal: 2026-09-30
Status: Disetujui user per bagian (via chat)
Path: brainstorming architectural → writing-plans

## 1. Ringkasan

Game 3D browser tentang **Kopdes (Koperasi Desa) Merah Putih** — program yang
sedang trending di Indonesia. Pemain menjadi pengurus Kopdes di sebuah desa.
Inspirasi format dari `bangtutorial.id/hutan-kabut` (Three.js di browser),
tetapi dengan tema **cozy, siang hari, tanpa horor**.

Kopdes adalah **markas utama**: gedungnya menampung toko, gudang, dan papan
misi. Gedung Kopdes **bisa di-upgrade secara visual** mengikuti level:
warung kecil → gedung besar → gedung tingkat.

## 2. Gameplay Loop

### 2.1 Loop utama — jaga toko

1. Pagi: buka toko.
2. Warga (NPC) datang sebagai pembeli, antre di kasir.
3. Pemain mengambil barang dari rak/gudang, melayani di kasir → uang masuk.
4. Stok menipis → pesan ke supplier → barang tiba di gudang → susun ke rak.
5. Malam: tutup toko → laporan harian (omzet, laba, kepuasan warga).

### 2.2 Sub-misi — keliling desa

Papan misi di depan Kopdes memberi misi petualangan, contoh:

- "Antar beras ke rumah Bu RT"
- "Bantu panen singkong Pak Kades"
- "Tagih iuran anggota ke 3 rumah"

Hadiah: upah uang + poin reputasi desa. Ada achievement sederhana
(misal: "10 misi selesai", "Toko buka 7 hari berturut-turut").

### 2.3 Progresi & leveling

- Reputasi naik → Kopdes naik level (3 level di MVP).
- Tiap naik level: **gedung Kopdes berubah visual** (makin besar/tingkat),
  membuka jenis barang baru (sembako → alat tani), dan kapasitas toko bertambah.

## 3. Dunia & Konten

Suasana: siang hari cerah, cozy. Satu desa kecil.

| Lokasi | Fungsi |
|---|---|
| Gedung Kopdes | Toko (rak + kasir), gudang, papan misi. 3 varian model per level |
| 5–6 rumah warga | Tujuan antar misi (Bu RT, Pak Kades, dll — beda warna tiap rumah) |
| Sawah/kebun | Lokasi misi panen |
| Balai desa | Landmark |
| Gapura desa | "Selamat Datang di Desa Maju", penanda batas area |
| Jalan tanah + pohon | Jalur keliling desa |

NPC: warga lalu-lalang; saat toko buka, sebagian menjadi pembeli.

Barang dagangan MVP (8 jenis): beras, minyak goreng, gula, telur,
mie instan, kopi, teh, sabun.

## 4. Teknis

- **Engine:** Three.js, kamera **third-person** (mengikuti karakter dari belakang).
- **Kode:** murni HTML/CSS/JS + ES modules, **tanpa build step** —
  mengikuti pola repo Bang Tutorial (aether-clash, hutan-kabut) agar mudah
  di-host di mana saja.
- **Aset 3D:** low-poly. Sumber: generate via AI (mis. Tripo AI seperti
  Hutan Kabut) atau aset gratis berlisensi aman. Gedung Kopdes: 3 varian
  model sesuai level.
- **Kontrol:** WASD + mouse (PC); joystick virtual + tombol aksi (HP).
- **Bahasa:** Indonesia penuh.
- **Save:** localStorage (uang, level, stok, progres misi, reputasi).
- **Struktur modul:**
  - `core/` — game loop, input, kamera
  - `world/` — desa, gedung, collision
  - `npc/` — warga & pembeli (AI sederhana)
  - `shop/` — rak, stok, kasir, supplier, laporan harian
  - `missions/` — papan misi, tracker misi, achievement
  - `ui/` — HUD, dialog, menu
  - `save/` — localStorage

## 5. Scope MVP

### Masuk MVP

- 1 desa kecil + gedung Kopdes 3 level (upgrade visual)
- 8 jenis barang; sistem stok, kasir, supplier, laporan harian
- 5 sub-misi + achievement sederhana
- NPC warga & pembeli dasar
- Kontrol PC + HP; save localStorage

### Sengaja TIDAK masuk MVP (YAGNI)

- Multiplayer
- Cuaca & siklus malam hari
- Desa kedua / map tambahan
- Kustomisasi karakter
- Voice acting

## 6. Kriteria sukses

1. Dapat dibuka dan dimainkan langsung di browser HP & PC tanpa install.
2. Satu siklus hari (buka → layani → tutup → laporan) berjalan penuh tanpa bug.
3. Naik level Kopdes terlihat jelas secara visual (gedung berubah).
4. 5 sub-misi dapat diselesaikan dari awal sampai akhir.
5. Progres tersimpan dan dapat dilanjutkan setelah browser ditutup.

## 7. Risiko & catatan

- **Aset 3D** adalah risiko terbesar: generate AI butuh kurasi agar gaya
  konsisten; fallback = primitif Three.js / aset gratis.
- **Performa HP:** batasi jumlah draw call (low-poly, instancing untuk pohon/
  barang), target 30fps di HP menengah.
- **Scope creep:** sistem ekonomi dibuat sederhana dulu (harga tetap per hari,
  tanpa fluktuasi pasar) — pendalaman ekonomi masuk fase berikutnya bila MVP
  terbukti fun.
