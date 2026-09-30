// Sinkronisasi field dinamis dari modul hari ke state save.
// main.js memanggil ini di simpan() agar HUD dan save selalu melihat
// nilai hari/fase terbaru (bug review final: S.hari/S.fase macet).
export function sinkronState(state, day) {
  state.hari = day.hari;
  state.fase = day.fase;
}
