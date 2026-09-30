# Panduan Kontribusi — KopdesMerah

Terima kasih sudah mau berkontribusi! Panduan singkat agar perubahanmu
mudah di-review dan digabung.

## Alur Kerja

1. Fork repo, lalu clone fork-mu.
2. Buat branch dari `master`: `git checkout -b fitur/nama-fitur`
3. Jalankan `make setup` sekali untuk mengaktifkan hook keamanan.
4. Kerjakan perubahan. Untuk kode: tulis test dulu (TDD), lihat merah, lalu hijaukan.
5. Pastikan `make check` lolos (test + pindai gitleaks).
6. Commit dengan pesan yang jelas (contoh: `feat: tambah misi baru antar-gula`),
   lalu push dan buka Pull Request ke `master`.

## Standar Kode

- Vanilla JS + ES modules, **tanpa build step** — game harus tetap jalan
  langsung via `make serve`.
- Bahasa Indonesia untuk semua teks yang dilihat pemain.
- Satu modul = satu tanggung jawab; hindari state mutable level-modul
  (buat factory seperti `createCashier()`, `createDay()`).
- Setiap perilaku baru wajib ditemani test di `tests/` (`node:test`).

## Keamanan

- Hook gitleaks (pre-commit & pre-push) aktif otomatis — jangan di-skip.
- **Jangan pernah commit secret**: API key, token, password, file `.env`.
  Pakai `.env.example` untuk contoh konfigurasi.

## Melaporkan Bug

Buka issue dengan: langkah reproduksi, yang diharapkan vs yang terjadi,
dan info browser/perangkat bila relevan.

## Pertanyaan?

Buka issue berlabel `question` — maintainer akan menjawab.
