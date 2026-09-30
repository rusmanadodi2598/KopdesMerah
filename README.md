# KopdesMerah

**Kopdes 3D: Maju Desaku** — game 3D santai berbahasa Indonesia: kelola koperasi desa (Kopdes),
layani pembeli yang antre, jaga stok warung, selesaikan misi warga, dan naikkan level gedung
Kopdes dari warung kecil sampai koperasi besar.

Repo: https://github.com/rusmanadodi2598/KopdesMerah

## Fitur

- Desa 3D siang yang cozy: rumah warga, sawah, balai desa, papan misi, gudang
- Pemain third-person (WASD + kamera mengikuti), bisa dimainkan di HP (joystick + tombol AKSI)
- Toko dengan siklus hari: buka → pembeli datang & antre → layani di kasir → tutup → laporan harian
- 8 barang dagangan, kasir idempoten, stok tidak bisa negatif
- 5 misi harian yang reset tiap hari (antar barang, panen, tagih iuran, restok)
- Reputasi & 3 level Kopdes — gedung membesar secara fisik tiap naik level
- Achievement, save/load otomatis via localStorage (aman dari data korup)
- HUD + dialog + laporan harian berbahasa Indonesia

## Cara Menjalankan

Tanpa build step. Karena memakai ES modules, buka lewat server lokal (bukan `file://`):

```bash
# pilihan 1: python
python3 -m http.server 8000

# pilihan 2: node
npx serve .
```

Lalu buka http://localhost:8000 di browser.

## Perintah Cepat (Makefile)

```bash
make setup   # instalasi awal: aktifkan hook keamanan, cek dependensi
make serve   # jalankan game di http://localhost:8000
make test    # jalankan seluruh unit test
make check   # test + pindai secret (gitleaks)
make help    # daftar semua perintah
```

## Kontrol

| Aksi | PC | HP |
|---|---|---|
| Jalan | WASD / panah | Joystick kiri |
| Interaksi (layani, ambil misi, panen, dll) | E | Tombol AKSI |
| Buka/tutup toko, papan misi, laporan | Tombol HUD | Tombol HUD |

Alur main: dekati papan misi (E) untuk ambil misi → buka toko lewat HUD → dekati kasir lalu
tekan E untuk melayani pembeli antre → tutup toko untuk lihat laporan & ganti hari.

## Struktur Proyek

```
index.html          # entry point + importmap three.js
css/style.css       # gaya HUD, dialog, kontrol sentuh
js/main.js          # wiring game (state, scene, loop, interaksi)
js/core/            # game loop & input (keyboard + sentuh)
js/world/           # desa, gedung Kopdes 3 level, collision
js/player/          # karakter pemain & inventory
js/npc/             # warga & antrean pembeli
js/shop/            # stok, kasir idempoten, siklus hari
js/missions/        # papan misi & achievement
js/progression/     # level Kopdes & reputasi
js/save/            # save/load localStorage
js/ui/              # HUD, dialog, kontrol sentuh
vendor/             # three.js 0.160.0 lokal (tanpa CDN)
tests/              # unit test (node:test)
docs/               # spec & plan
```

## Testing

```bash
node --test "tests/**/*.test.js"
```

## Teknologi

- three.js 0.160.0 (disertakan lokal di `vendor/`, tanpa CDN)
- Vanilla JS + ES modules, tanpa build step
- Target 30 fps di HP menengah

## Keamanan

Repo ini memakai [gitleaks](https://github.com/gitleaks/gitleaks) sebagai standar
pemeriksaan secret:

- **pre-commit** (`githooks/pre-commit`): memblokir commit bila ada secret di staged changes
- **pre-push** (`githooks/pre-push`): memindai seluruh riwayat sebelum push
- Hook aktif otomatis via `git config core.hooksPath githooks`

Bila gitleaks belum terinstal, hook memberi peringatan dan melewati pemeriksaan
(set `GITLEAKS_BIN` ke lokasi binary gitleaks bila bukan di path default).

## Dokumen Lain

- [CHANGELOG.md](CHANGELOG.md) — riwayat perubahan (pra-rilis)
- [CONTRIBUTING.md](CONTRIBUTING.md) — panduan kontribusi
- [LICENSE](LICENSE) — Lisensi MIT

## Pengembang

[Dodi Rusmana](https://github.com/rusmanadodi2598/rusmanadodi2598)
