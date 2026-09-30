// Collision 2D (x,z) murni — tanpa dependensi three.js agar bisa diuji di node.
// AABB = { minX, maxX, minZ, maxZ }
export function resolveCircle(pos, radius, boxes) {
  let x = pos.x;
  let z = pos.z;
  for (const b of boxes) {
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * radius;
        z = cz + (dz / d) * radius;
      } else {
        // Titik pusat di dalam box: dorong lewat sisi dengan penetrasi terkecil.
        const pl = x - b.minX;
        const pr = b.maxX - x;
        const pt = z - b.minZ;
        const pb = b.maxZ - z;
        const m = Math.min(pl, pr, pt, pb);
        if (m === pl) x = b.minX - radius;
        else if (m === pr) x = b.maxX + radius;
        else if (m === pt) z = b.minZ - radius;
        else z = b.maxZ + radius;
      }
    }
  }
  return { x, z };
}
