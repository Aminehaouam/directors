// Builds one .riv per art direction: rive/style-{a,b,c}.riv
// Each file holds the same artboards, animations and state machines;
// only the art (palette, detail level, pixel grid) differs.
'use strict';
const fs = require('fs');
const path = require('path');
const { RivFile } = require('../tools/riv-writer');
const styles = require('./styles');
const { buildDesk, buildProps } = require('./elements/desk');
const { buildJournal } = require('./elements/journal');
const optional = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(p.slice(2))) return null; throw e; } };

const out = path.join(__dirname, '..', 'rive');
fs.mkdirSync(out, { recursive: true });
const only = process.argv[2];

for (const S of styles.all) {
  if (only && only !== S.id) continue;
  const file = new RivFile();
  buildDesk(file, S);
  buildProps(file, S);
  buildJournal(file, S);
  const ticket = optional('./elements/ticket'); if (ticket) ticket.buildTicket(file, S);
  const london = optional('./elements/london'); if (london) london.buildLondon(file, S);
  const coco = optional('./elements/coco'); if (coco) coco.buildCoco(file, S);
  const buf = file.toBuffer();
  const p = path.join(out, `${S.slug}.riv`);
  fs.writeFileSync(p, buf);
  console.log(`${path.basename(p)}  ${(buf.length / 1024).toFixed(1)} KB  artboards: ${file.artboards.map((a) => a.name).join(', ')}`);
}
// Style data the browser compositor needs.
fs.writeFileSync(path.join(out, 'styles.json'), JSON.stringify(Object.fromEntries(styles.all.map((s) => [s.id, { id: s.id, slug: s.slug, name: s.name, pixel: s.pixel || 0, palette: s.palette || null, pal: s.pal, post: s.post }])), null, 1));
