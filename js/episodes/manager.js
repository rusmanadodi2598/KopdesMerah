// Episode manager: menjalankan definisi episode sebagai urutan beat.
// Beat: kartu | dialog | objektif | jurnal | suara | tunggu | selesai.
// Murni logika; rendering & efek via deps sehingga mudah diuji.
// Beat boleh membawa onStart(ctx) — hook sekali jalan saat beat dimulai
// (mis. memadamkan lampu, memunculkan siluet).

export function createEpisodeManager(deps) {
  const em = { def: null, ctx: null, idx: -1, timer: 0, objektifId: null, kartuBuka: false };

  function beat() {
    return em.def ? em.def.beats[em.idx] ?? null : null;
  }

  function maju() {
    if (!em.def) return;
    em.idx += 1;
    if (em.idx >= em.def.beats.length) {
      const def = em.def;
      em.def = null;
      em.idx = -1;
      deps.selesai(def);
      return;
    }
    eksekusi();
  }

  function eksekusi() {
    const b = beat();
    em.objektifId = null;
    em.kartuBuka = false;
    if (!b) return;
    try {
      b.onStart?.(em.ctx);
    } catch {
      // Hook episode tak boleh mematikan game.
    }
    switch (b.tipe) {
      case 'kartu':
        em.kartuBuka = true;
        em.timer = b.durasi ?? 3;
        deps.kartu({ kicker: b.kicker ?? '', judul: b.judul ?? '', sub: b.sub ?? '' });
        break;
      case 'dialog':
        deps.dialog(b.baris ?? [], () => maju());
        break;
      case 'objektif':
        em.objektifId = b.id;
        deps.setObjektif(b.teks ?? '');
        break;
      case 'jurnal':
        deps.jurnal(em.def.id, b.judul ?? '', b.teks ?? '');
        maju(); // beat instan: langsung lanjut
        break;
      case 'suara':
        deps.suara(b.nama);
        maju(); // beat instan: langsung lanjut
        break;
      case 'tunggu':
        em.timer = b.durasi ?? 1;
        break;
      case 'selesai': {
        const def = em.def;
        em.def = null;
        em.idx = -1;
        deps.selesai(def);
        break;
      }
      default:
        maju(); // tipe tak dikenal: lewati
    }
  }

  return {
    get aktif() {
      return em.def;
    },
    get beatId() {
      return beat()?.id ?? null;
    },
    get kartuAktif() {
      return em.kartuBuka;
    },
    /** Teks objektif cerita yang sedang ditunggu, atau null. */
    objektifTeks() {
      const b = beat();
      return b?.tipe === 'objektif' ? b.teks : null;
    },
    mulai(def, ctx) {
      em.def = def;
      em.ctx = ctx ?? null;
      em.idx = 0;
      deps.setObjektif(null);
      eksekusi();
    },
    hentikan() {
      em.def = null;
      em.idx = -1;
      em.objektifId = null;
      em.kartuBuka = false;
      deps.tutupKartu();
      deps.setObjektif(null);
    },
    /** Dipanggil game saat kondisi objektif terpenuhi. Aman dipanggil kapan saja. */
    tandaiSelesai(id) {
      if (em.def && em.objektifId === id) {
        em.objektifId = null;
        deps.setObjektif(null);
        maju();
      }
    },
    lewatiKartu() {
      if (em.kartuBuka) {
        em.kartuBuka = false;
        deps.tutupKartu();
        maju();
      }
    },
    tick(dt) {
      if (!em.def || dt <= 0) return;
      const b = beat();
      if (b && (b.tipe === 'kartu' || b.tipe === 'tunggu')) {
        em.timer -= dt;
        if (em.timer <= 0) {
          if (b.tipe === 'kartu') {
            em.kartuBuka = false;
            deps.tutupKartu();
          }
          maju();
        }
      }
    },
  };
}
