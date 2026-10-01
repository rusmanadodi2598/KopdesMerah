// Episode 1 — "Kabut Pertama"
// Implementasi playable dari docs/episodes/e01-kabut-pertama.md.
// Catatan: cold open (mikro-scene 90 detik) belum diimplementasikan —
// episode dimulai dari kartu judul. Hooks ctx disediakan main.js:
//   ctx.malamE01()        — padamkan 3 lampu + terapkan visual malam
//   ctx.spawnSiluet()     — munculkan bayangan bertopi caping di ujung jalan
//   ctx.hilangkanSiluet() — lenyapkan siluet

export const E01 = {
  id: 'e01',
  nomor: 1,
  judul: 'Kabut Pertama',
  sinopsis:
    'Tiga hari sebelum kabut turun, Sukarame Mistery tampak biasa saja. ' +
    'Tapi lampu jalan padam tanpa sebab, tawa anak kecil terdengar dari ' +
    'dalam kabut, dan Mbah Sari tahu sesuatu tentang lentera ayah Raka.',

  beats: [
    {
      id: 'kartu-judul',
      tipe: 'kartu',
      kicker: 'Dua Belas Malam Kabut',
      judul: 'Episode 1',
      sub: '"Kabut Pertama"',
      durasi: 3.4,
    },
    {
      id: 'intro',
      tipe: 'dialog',
      baris: [
        { pembicara: 'Raka', teks: 'Tiga hari sebelum kabut turun, Sukarame Mistery tampak biasa saja.' },
        { pembicara: 'Raka', teks: 'Toko buka seperti biasa. Warga datang dan pergi. Tak ada yang tahu apa yang menunggu.' },
      ],
    },
    {
      id: 'buka-toko',
      tipe: 'objektif',
      teks: 'Buka toko (tombol Buka Toko)',
      onStart: (ctx) => ctx.jaminPembeli(),
    },
    { id: 'layani-2', tipe: 'objektif', teks: 'Layani 2 pembeli' },
    {
      id: 'pak-karta',
      tipe: 'dialog',
      baris: [
        { pembicara: 'Pak Karta', teks: 'Raka. Rapat kopdes besok jangan lupa.' },
        { pembicara: 'Pak Karta', teks: 'Ada yang mau Bapak bicarakan. Soal... buku kas lama.' },
        { pembicara: 'Raka', teks: 'Buku kas? Memangnya kenapa, Pak?' },
        { pembicara: 'Pak Karta', teks: '...nanti saja. Besok.' },
      ],
    },
    { id: 'layani-1', tipe: 'objektif', teks: 'Layani 1 pembeli lagi' },
    {
      id: 'mbah-sari',
      tipe: 'dialog',
      baris: [
        { pembicara: 'Mbah Sari', teks: 'Raka.' },
        { pembicara: 'Raka', teks: 'Mbah? Mau belanja?' },
        { pembicara: 'Mbah Sari', teks: 'Lentera ayahmu... masih kau simpan?' },
        { pembicara: 'Raka', teks: 'Ada, Mbah. Di rumah. Kenapa?' },
        { pembicara: 'Mbah Sari', teks: 'Bagus. Jangan sampai hilang.' },
      ],
    },
    { id: 'tutup-toko', tipe: 'objektif', teks: 'Tutup toko dan tunggu malam tiba' },
    {
      id: 'kartu-malam',
      tipe: 'kartu',
      kicker: 'Dua Belas Malam Kabut',
      judul: 'Malam Pertama',
      sub: 'Kabut mulai turun...',
      durasi: 3.0,
      onStart: (ctx) => ctx.malamE01(),
    },
    {
      id: 'lampu-padam',
      tipe: 'dialog',
      baris: [
        { pembicara: 'Raka', teks: 'Lampu jalan... padam semua? Padahal baru diganti minggu lalu.' },
        { pembicara: 'Raka', teks: 'Baiklah. Nyalakan satu per satu sebelum kabut makin tebal.' },
      ],
    },
    { id: 'nyalakan-3', tipe: 'objektif', teks: 'Nyalakan 3 lampu jalan yang padam' },
    { id: 'tawa', tipe: 'suara', nama: 'tawa' },
    {
      id: 'tawa-dialog',
      tipe: 'dialog',
      baris: [
        { pembicara: 'Raka', teks: 'Suara itu lagi... tawa anak kecil. Dari dalam kabut.' },
        { pembicara: 'Raka', teks: 'Halo?! Siapa di sana?' },
      ],
    },
    {
      id: 'selidiki',
      tipe: 'objektif',
      teks: 'Selidiki suara tawa di ujung jalan',
      onStart: (ctx) => ctx.spawnSiluet(),
    },
    {
      id: 'siluet-dialog',
      tipe: 'dialog',
      baris: [
        { pembicara: 'Raka', teks: '...siapa di sana?' },
        { pembicara: '???', teks: '...' },
      ],
    },
    {
      id: 'cliffhanger',
      tipe: 'kartu',
      kicker: 'Bersambung',
      judul: '',
      sub: 'Di ujung jalan, sesosok bayangan bertopi caping — lalu kabut menelannya.',
      durasi: 4.0,
      onStart: (ctx) => ctx.hilangkanSiluet(),
    },
    {
      id: 'jurnal-1',
      tipe: 'jurnal',
      judul: 'Tawa di dalam kabut',
      teks: 'Terdengar dua kali, selalu tepat sebelum sesuatu padam.',
    },
    {
      id: 'jurnal-2',
      tipe: 'jurnal',
      judul: 'Lentera ayah',
      teks: '"Untuk malam-malam yang gelap." Mbah Sari tahu soal lentera ini. Kenapa?',
    },
    {
      id: 'preview',
      tipe: 'kartu',
      kicker: 'Preview Episode 2',
      judul: '"Pesan Mbah Sari"',
      sub: '"Kabut ini datang dua belas malam, Nak. Dan Mbah... Mbah ingat semuanya."',
      durasi: 4.5,
    },
    { id: 'selesai', tipe: 'selesai' },
  ],
};
