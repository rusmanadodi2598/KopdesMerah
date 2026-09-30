# Changelog

Semua perubahan penting proyek ini dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/).
Proyek ini belum merilis versi stabil — semua di bawah masih pra-rilis.

## [Unreleased]

### Ditambahkan
- Game 3D "Kopdes 3D: Maju Desaku": desa 3D, pemain third-person, NPC warga & antrean pembeli
- Sistem toko: stok, kasir idempoten, siklus hari + laporan harian
- Papan misi (5 misi harian, reset tiap hari), inventory pemain, achievement
- Level Kopdes (3 level) & reputasi; gedung membesar secara fisik tiap naik level
- Save/load localStorage yang aman dari data korup
- HUD, dialog, dan kontrol sentuh HP berbahasa Indonesia
- Test suite: 73 test (`node --test`)
- Standar keamanan: gitleaks + hook pre-commit & pre-push
- README, .gitignore, CHANGELOG, Lisensi MIT, CONTRIBUTING, Makefile

### Diperbaiki
- Sinkronisasi hari & fase ke state save (counter hari sempat macet)
- Label tombol HUD Buka/Tutup Toko, guard double-fire tombol AKSI di HP
