// Seeded randomness. Nothing in the engine may call Math.random.
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Seeded generator keyed by an element id (stable across frames and workers). */
export function rngFor(id, salt = 0) { return mulberry32((hashStr(String(id)) ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0); }

export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296);
}
const sm = (t) => t * t * (3 - 2 * t);
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return hash2(i, 0, seed) * (1 - sm(f)) + hash2(i + 1, 0, seed) * sm(f);
}
export function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
export function fbm1(x, seed = 0, oct = 3) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise1(x * f, seed + i * 17); a *= 0.5; f *= 2; }
  return v / (1 - Math.pow(0.5, oct));
}
