# Handoff to Claude Design

Code is complete and renders end to end. What exists is a **functional first pass**; visual polish is open for design.

Source of truth for intent: the creative plan PDF (palette, typography, voiceover, 12-shot timeline, motion rules). Those values are encoded in `config/palette.json` and `config/episode.json`.

## Where to design
- Shot compositions: `src/scenes/s1..s6`. Reusable pieces: `src/components/`.
- Illustrations (generated, editable SVG): `public/illustrations/*.svg` from `scripts/assets/svgs.mjs`. Textures from `scripts/assets/textures.mjs`.
- Stand-in footage art: `src/compositing/standins.js` (placeholders only).

## Known weak spots to improve (visual, not logic)
1. Candle flame and glow too faint; the pen reads as a pencil.
2. Standing figure in the diagram (shot 6) is a mannequin; needs a more engraved human.
3. Stand-in footage art is crude (only used until real clips arrive).
4. Shot 10 green reaches only a few percent; the plan allows ~30% there.
5. Engraving of footage in shot 7 is light.

## Constraints (checked by `npm run validate`)
Palette-only colours, green <= ~12% (30% in shot 10) and never a full-frame wash, safe margins 96/72 px, text contrast >= 4.5:1, text entrances 80-120 ms before the spoken word, no particles/lens flares/whip pans.

Run `npm run render:draft` (about 1 minute) to see changes; `npm run validate` for the QA report.
