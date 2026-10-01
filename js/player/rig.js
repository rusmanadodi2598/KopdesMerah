import * as THREE from '../../vendor/three.module.js';

// Rig humanoid semi-realistis: proporsi ~1,8 m, wajah (mata/hidung/mulut/
// telinga), lengan dua segmen (bahu + siku), kaki dua segmen (pinggul +
// lutut), sepatu, serta pilihan rambut / hijab / topi Kopdes.
// Dipakai pemain & warga. Kontrak: { group, rig, ayun(dt, bergerak, cepat) }.
const std = (warna, rough = 0.85) =>
  new THREE.MeshStandardMaterial({ color: warna, roughness: rough, metalness: 0 });

const KULIT_GELAP = (kulit) => new THREE.Color(kulit).multiplyScalar(0.82).getHex();

function kapsul(r, len, mat) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
}

export function bangunTubuh({
  baju = 0x2b6cb0,
  kulit = 0xf2c89b,
  celana = 0x3a4a5a,
  sepatu = 0x2b2b30,
  rambut = 0x23272f,
  hijab = null, // warna hijab → menutup rambut
  topiKopdes = false,
  kepalaR = 0.2, // radius kepala (warga 0.19 = sedikit lebih kecil)
} = {}) {
  const group = new THREE.Group();
  const rig = new THREE.Group(); // wadah bob agar tak mengganggu posisi group
  group.add(rig);
  const matKulit = std(kulit, 0.65);
  const matKulitGelap = std(KULIT_GELAP(kulit), 0.7);
  const matBaju = std(baju);
  const matBajuGelap = std(new THREE.Color(baju).multiplyScalar(0.8).getHex());
  const matCelana = std(celana);
  const matSepatu = std(sepatu, 0.6);

  // ---------- Kaki: pinggul → paha → lutut → betis → sepatu ----------
  const sendi = [];
  function kaki(x) {
    const pinggul = new THREE.Group();
    pinggul.position.set(x, 0.9, 0);
    const paha = kapsul(0.085, 0.26, matCelana);
    paha.position.y = -0.19;
    pinggul.add(paha);
    const lutut = new THREE.Group();
    lutut.position.y = -0.4;
    const betis = kapsul(0.062, 0.26, matCelana);
    betis.position.y = -0.17;
    lutut.add(betis);
    const sepatuM = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.27), matSepatu);
    sepatuM.position.set(0, -0.445, 0.05);
    lutut.add(sepatuM);
    pinggul.add(lutut);
    rig.add(pinggul);
    sendi.push(pinggul, lutut);
    return { pinggul, lutut };
  }
  const kakiKiri = kaki(-0.11);
  const kakiKanan = kaki(0.11);

  // Pinggul + torso + kerah.
  const bokong = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.22), matCelana);
  bokong.position.y = 0.99;
  rig.add(bokong);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.155, 0.5, 12), matBaju);
  torso.position.y = 1.31;
  rig.add(torso);
  const kerah = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.07, 10), matBajuGelap);
  kerah.position.y = 1.57;
  rig.add(kerah);

  // ---------- Lengan: bahu → lengan atas → siku → lengan bawah → tangan ----------
  function lengan(x) {
    const bahu = new THREE.Group();
    bahu.position.set(x, 1.48, 0);
    const atas = kapsul(0.07, 0.2, matBaju); // lengan baju pendek
    atas.position.y = -0.15;
    bahu.add(atas);
    const siku = new THREE.Group();
    siku.position.y = -0.3;
    const bawah = kapsul(0.055, 0.2, matKulit);
    bawah.position.y = -0.14;
    siku.add(bawah);
    const tangan = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), matKulit);
    tangan.scale.set(0.9, 1.25, 0.9);
    tangan.position.y = -0.3;
    siku.add(tangan);
    bahu.add(siku);
    rig.add(bahu);
    sendi.push(bahu, siku);
    return { bahu, siku };
  }
  const lenganKiri = lengan(-0.27);
  const lenganKanan = lengan(0.27);

  // ---------- Leher + kepala + wajah ----------
  const leher = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.1, 10), matKulit);
  leher.position.y = 1.6;
  rig.add(leher);
  const kepalaG = new THREE.Group();
  kepalaG.position.y = 1.66;
  kepalaG.scale.setScalar(kepalaR / 0.2);
  rig.add(kepalaG);
  const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), matKulit);
  kepalaG.add(kepala);
  // Mata.
  const matMata = std(0x23272f, 0.35);
  for (const sx of [-1, 1]) {
    const mata = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), matMata);
    mata.position.set(sx * 0.075, 0.02, 0.185);
    kepalaG.add(mata);
    const alis = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.02), std(rambut, 0.9));
    alis.position.set(sx * 0.075, 0.085, 0.182);
    alis.rotation.z = sx * -0.12;
    kepalaG.add(alis);
  }
  // Hidung + mulut (senyum tipis).
  const hidung = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), matKulitGelap);
  hidung.scale.set(0.8, 1, 0.8);
  hidung.position.set(0, -0.03, 0.192);
  kepalaG.add(hidung);
  const mulut = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.013, 8, 12, Math.PI), std(0x9c4a4a, 0.6));
  mulut.position.set(0, -0.068, 0.184);
  mulut.rotation.z = Math.PI; // busur bawah = senyum
  mulut.rotation.x = -0.15;
  kepalaG.add(mulut);
  // Telinga.
  for (const sx of [-1, 1]) {
    const telinga = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matKulit);
    telinga.scale.set(0.45, 0.9, 0.7);
    telinga.position.set(sx * 0.195, 0, 0);
    kepalaG.add(telinga);
  }
  // Rambut / hijab / topi.
  const matRambut = std(rambut, 0.95);
  if (hijab) {
    const matHijab = std(hijab, 0.9);
    // Kapsul rambut seukuran rambut biasa + bingkai oval di sekitar wajah
    // (bukan bola penuh agar mata/hidung/mulut tetap terlihat).
    const jilbab = new THREE.Mesh(
      new THREE.SphereGeometry(0.228, 16, 12, 0, Math.PI * 2, 0, 1.45), matHijab);
    jilbab.position.y = 0.015;
    kepalaG.add(jilbab);
    const bingkai = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.042, 10, 20), matHijab);
    bingkai.position.set(0, -0.005, 0.055);
    kepalaG.add(bingkai);
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 12), matHijab);
    drape.position.y = -0.18;
    kepalaG.add(drape);
  } else if (topiKopdes) {
    const matTopi = std(0xc8102e, 0.8);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.13, 14), matTopi);
    crown.position.y = 0.17;
    kepalaG.add(crown);
    const lidah = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.035, 14, 1, false, -Math.PI / 2, Math.PI), matTopi);
    lidah.position.set(0, 0.115, 0.08);
    kepalaG.add(lidah);
  } else {
    const rambutM = new THREE.Mesh(
      new THREE.SphereGeometry(0.207, 16, 12, 0, Math.PI * 2, 0, 1.45), matRambut);
    rambutM.position.set(0, 0.018, -0.012);
    kepalaG.add(rambutM);
  }

  // ---------- Animasi ----------
  let fase = 0;
  let tIdle = 0;
  function ayun(dt, bergerak, cepat = 1) {
    if (bergerak) {
      fase += dt * 9 * cepat;
      const s = Math.sin(fase);
      // Ayunan kontralateral bahu ↔ pinggul.
      lenganKiri.bahu.rotation.x = s * 0.55;
      lenganKanan.bahu.rotation.x = -s * 0.55;
      // Siku sedikit menekuk, lebih saat lengan mengayun ke belakang.
      lenganKiri.siku.rotation.x = -0.25 - Math.max(0, -s) * 0.4;
      lenganKanan.siku.rotation.x = -0.25 - Math.max(0, s) * 0.4;
      // Kaki + lutut menekuk saat fase ayun ke depan.
      kakiKiri.pinggul.rotation.x = -s * 0.62;
      kakiKanan.pinggul.rotation.x = s * 0.62;
      kakiKiri.lutut.rotation.x = Math.max(0, s) * 0.95 + 0.06;
      kakiKanan.lutut.rotation.x = Math.max(0, -s) * 0.95 + 0.06;
      // Bob + goyangan badan + condong saat lari.
      rig.position.y = Math.abs(Math.cos(fase)) * 0.05;
      rig.rotation.z = s * 0.03;
      rig.rotation.x = cepat > 1.2 ? 0.07 : 0;
    } else {
      // Diam: sendi lemas + napas halus.
      tIdle += dt;
      for (const j of sendi) j.rotation.x *= 0.85;
      rig.rotation.z *= 0.85;
      rig.rotation.x *= 0.85;
      rig.position.y = Math.sin(tIdle * 2.2) * 0.012;
    }
  }

  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group, rig, ayun };
}
