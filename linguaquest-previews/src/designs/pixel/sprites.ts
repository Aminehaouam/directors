/**
 * Pixel-art sprites as text grids: one character per pixel, '.' = transparent.
 * Edit them like ASCII art; <Sprite> turns them into crisp SVG rects.
 * 'x' renders in currentColor so single-colour icons can be themed.
 */

export const PALETTE: Record<string, string> = {
  k: '#2b2340', // ink outline
  K: '#5a4e7c', // soft ink
  w: '#ffffff',
  c: '#fff6e0', // cream
  u: '#d8efff', // cloud shade
  s: '#8fd3ff', // sky
  S: '#3e9be0', // sky dark
  l: '#c4f07a', // leaf light
  g: '#74cc4c', // leaf
  G: '#3f9e3c', // leaf dark
  d: '#24703a', // leaf deep
  y: '#ffc93c', // gold
  Y: '#e8862a', // gold dark / beak shade
  o: '#ff9f2e', // beak
  r: '#ff6b4a', // flame
  R: '#c73e2e', // flame dark
  p: '#a66bff', // gem
  P: '#6b3fd1', // gem dark
  q: '#e2ccff', // gem light
  b: '#a8643a', // bark
  B: '#6e3d22', // bark dark
  n: '#e3ad6f', // dirt
  N: '#b97c45', // dirt dark
  e: '#c9c4d8', // stone
  E: '#8f88a6', // stone dark
  f: '#ffa3b1', // blush
};

export type SpriteRows = readonly string[];

export const BIRD: SpriteRows = [
  '......kk........',
  '.....kggk.......',
  '......kgk.......',
  '.....kkgkkk.....',
  '...kkllggggkk...',
  '..kllggggwwggk..',
  '.kgggggggwkgggk.',
  '.kgggggggwkggkk.',
  '.kggGGGggffgoook',
  '.kgGGGGGggggYYk.',
  '.kggdddgllllggk.',
  '..kggggllllggk..',
  '...kkgGGGGgkk...',
  '.....kkkkkk.....',
  '......Y...Y.....',
  '.....YYY.YYY....',
];

/** Same bird with closed eye, for the idle blink. */
export const BIRD_BLINK: SpriteRows = BIRD.map((row, y) => {
  if (y === 5) return row.slice(0, 9) + 'gg' + row.slice(11);
  if (y === 6) return row.slice(0, 9) + 'kk' + row.slice(11);
  if (y === 7) return row.slice(0, 9) + 'gg' + row.slice(11);
  return row;
});

/** Wings-up pose for celebrations. */
export const BIRD_CHEER: SpriteRows = [
  '......kk........',
  '.....kggk.......',
  'kk....kgk.......',
  'kGk..kkgkkk.....',
  'kGGkkllggggkk...',
  '.kGGgggggwwggk..',
  '.kdGgggggwkgggk.',
  '.kgggggggwkggkk.',
  '.kgggggggffgoook',
  '.kggggggggggYYk.',
  '.kggggggllllggk.',
  '..kggggllllggk..',
  '...kkgGGGGgkk...',
  '.....kkkkkk.....',
  '......Y...Y.....',
  '.....YYY.YYY....',
];

export const CLOUD: SpriteRows = [
  '......wwww......',
  '...wwwwwwwwww...',
  '..wwwwwwwwwwwww.',
  '.wwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  '.uuuuuuuuuuuuuu.',
];

export const SUN: SpriteRows = [
  '...yyyy...',
  '.yyyyyyyy.',
  '.yywyyyyy.',
  'yywyyyyyyy',
  'yyyyyyyyyY',
  'yyyyyyyyyY',
  'yyyyyyyyYY',
  '.yyyyyyYY.',
  '.yyyyYYYY.',
  '...YYYY...',
];

export const TREE: SpriteRows = [
  '..dddd..',
  '.dgglgd.',
  'dgglgggd',
  'dggggggd',
  'dgggggGd',
  'dGgggGGd',
  '.dGGGGd.',
  '..ddbd..',
  '...bB...',
  '...bB...',
];

export const FLAG_FR: SpriteRows = [
  'kSSwwrr.',
  'kSSwwrr.',
  'kSSwwrr.',
  'kSSwwrr.',
  'k.......',
  'k.......',
  'k.......',
  'k.......',
  'k.......',
  'kk......',
];

export const FLAG_BADGE: SpriteRows = [
  'kkkkkkkkk',
  'kSSwwwrrk',
  'kSSwwwrrk',
  'kSSwwwrrk',
  'kSSwwwrrk',
  'kkkkkkkkk',
];

export const TOWER: SpriteRows = [
  '.....k.....',
  '.....k.....',
  '....kKk....',
  '....kKk....',
  '....kKk....',
  '...kkkkk...',
  '....kKk....',
  '....kKk....',
  '...kK.Kk...',
  '..kkkkkkk..',
  '...kK.Kk...',
  '..kK...Kk..',
  '..kK.k.Kk..',
  '.kK.kKk.Kk.',
  '.kK.k.k.Kk.',
  'kkk.....kkk',
];

/** Distant tower for the horizon. */
export const TOWER_MINI: SpriteRows = [
  '..k..',
  '..k..',
  '.kKk.',
  '.kKk.',
  '.kkk.',
  '.kKk.',
  'kkkkk',
  'kK.Kk',
  'k...k',
];

/** Speech-bubble tail; its right column overlaps the bubble border to open it. */
export const TAIL: SpriteRows = ['....k', '...kw', '..kww', '.kwww', 'kkkkk'];

export const FLOWER: SpriteRows = ['.f.', 'fyf', '.f.', '.g.'];

export const GEM: SpriteRows = [
  '..kkkk..',
  '.kqpppk.',
  'kqqppPPk',
  'kpppPPPk',
  '.kppPPk.',
  '..kpPk..',
  '...kk...',
];

export const FLAME: SpriteRows = [
  '...k....',
  '..kr.k..',
  '..krkrk.',
  '.krrrrrk',
  'krryyrrk',
  'kryyyyrk',
  'kryywyrk',
  '.kryyrk.',
  '..kkkk..',
];

export const STAR: SpriteRows = [
  '.....k.....',
  '....kyk....',
  '...kwyyk...',
  'kkkkyyykkkk',
  'kyyyyyyyyYk',
  '.kyyyyyyYk.',
  '..kyyyyYk..',
  '.kyyyyyyYk.',
  '.kyyk.kyYk.',
  'kyyk...kyYk',
  'kkk.....kkk',
];

export const STAR_EMPTY: SpriteRows = STAR.map((r) => r.replace(/[ywY]/g, 'e'));

export const LOCK: SpriteRows = [
  '..kkkk..',
  '.kk..kk.',
  '.k....k.',
  'kkkkkkkk',
  'keeeeeEk',
  'keekkeEk',
  'keekkeEk',
  'kEEEEEEk',
  'kkkkkkkk',
];

export const CHEST: SpriteRows = [
  '.kkkkkkkk.',
  'kbbbbbbbbk',
  'kbBBBBBBbk',
  'kkkkyykkkk',
  'kbbbyYbbbk',
  'kbbbbbbbbk',
  'kBBBBBBBBk',
  'kkkkkkkkkk',
];

export const CHECK: SpriteRows = [
  '......xx',
  '.....xx.',
  'x...xx..',
  'xx.xx...',
  '.xxx....',
  '..x.....',
];

export const CLOSE: SpriteRows = [
  'xx...xx',
  '.xx.xx.',
  '..xxx..',
  '.xx.xx.',
  'xx...xx',
];

export const PLAY: SpriteRows = ['x....', 'xx...', 'xxx..', 'xxxx.', 'xxx..', 'xx...', 'x....'];

export const SPEAKER: SpriteRows = [
  '...x....',
  '..xx..x.',
  'xxxx...x',
  'xxxx.x.x',
  'xxxx...x',
  '..xx..x.',
  '...x....',
];

export const HEART: SpriteRows = [
  '.kk.kk.',
  'krrkrrk',
  'krwrrRk',
  'krrrrRk',
  '.krrRk.',
  '..kRk..',
  '...k...',
];

export const ICON_LEARN: SpriteRows = [
  '....xx....',
  '...xxxx...',
  '..xxxxxx..',
  '.xxxxxxxx.',
  'xxxxxxxxxx',
  '.x......x.',
  '.x..xx..x.',
  '.x..xx..x.',
  '.x..xx..x.',
  '.xxxxxxxx.',
];

export const ICON_PRACTICE: SpriteRows = [
  '..xxxxxxxx',
  '..x......x',
  'xxxxxxxx.x',
  'x......x.x',
  'x.xxxx.x.x',
  'x......x.x',
  'x.xxx..xxx',
  'x......x..',
  'xxxxxxxx..',
  '..........',
];

export const ICON_PROGRESS: SpriteRows = [
  '........xx',
  '........xx',
  '.....xx.xx',
  '.....xx.xx',
  '..xx.xx.xx',
  '..xx.xx.xx',
  '..xx.xx.xx',
  '..xx.xx.xx',
  '..........',
  'xxxxxxxxxx',
];

export const ICON_PROFILE: SpriteRows = [
  '...xxxx...',
  '..xxxxxx..',
  '..xxxxxx..',
  '..xxxxxx..',
  '...xxxx...',
  '..........',
  '.xxxxxxxx.',
  'xxxxxxxxxx',
  'xxxxxxxxxx',
  'xxxxxxxxxx',
];
