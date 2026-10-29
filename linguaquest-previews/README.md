# LinguaQuest — Choose Your Learning World

Interactive prototypes of four visual directions for the LinguaQuest language-learning app (French, beginner). Every direction renders the same mock data and runs on the same state machine, so the comparison is about the visual identity alone.

| | Direction | Idea |
|---|---|---|
| A | Bright Pixel Adventure | Retro overworld: a snake road of stages to Paris, 4px world pixels, sprite art stored as text grids |
| B | Minimal Flat | Calm, premium product: one green action, one amber reward colour, editorial serif, stepper path |
| C | Soft 2.5D Mascot World | Clay-like Pip on a floating island; every tappable object has thickness and a contact shadow |
| D | Low-Poly 3D World | Faceted expedition: floating islands climbing from the harbour to Paris, dark HUD, chamfered UI |

This is a design experiment, not the app: no backend, accounts, real lessons or reward economy.

## Run it

```bash
cd linguaquest-previews
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build`, then `npm run preview` (http://localhost:4173). `npm run typecheck` runs TypeScript only.

## Compare the directions

- **Focus** shows one phone at full size between its design brief (intent, strengths, watch-outs) and its system (palette, type, production cost).
- **Compare all 4** puts the four phones side by side. With **Link phones** on, a tap in any phone is mirrored to all four, so you can walk the same flow in every style at once. **4 across / 2 × 2** trades overview for size.
- Shortcuts: `1`–`4` pick a direction, `C` toggles compare. Direct links: `#pixel`, `#minimal`, `#soft`, `#lowpoly`, `#compare`.
- **Reset demo** returns every phone to the starting state.

Things to try in each phone: select a milestone (completed, current and locked behave differently); press **Continue learning** and answer the three questions; finish to see gems go 125 → 140, the daily goal tick from 2/5 to 3/5 and the next stop unlock; use the bottom navigation for Practice, Progress and Profile.

## Structure

```
src/
  data/sample.ts         shared mock content (learner, milestones, vocabulary, lesson)
  core/model.ts          pure reducer + selectors every direction consumes
  core/store.ts          one state per direction, optional "linked" mirroring
  shell/                 review board: tabs, phone frame, notes, compare view
  designs/registry.ts    the four directions and their design rationale
  designs/pixel/         A — sprites.ts (pixel art as text), Sprite.tsx, scenery, screens, pixel.css
  designs/minimal/       B — icons.tsx, Mascot.tsx, screens, minimal.css
  designs/soft/          C — Mascot.tsx, World.tsx (scenery), icons, screens, soft.css
  designs/lowpoly/       D — art.tsx (parametric terrain kit + landmarks), scenes.tsx, screens, lowpoly.css
```

Each direction is self-contained: its tokens live at the top of its stylesheet (`.px-app`, `.mn-app`, `.sf-app`, `.lp-app`), its art lives in its own folder, and it only depends on `core/` and `data/`. To drop a direction, remove its folder and its entry in `designs/registry.ts`.

All illustration is code: SVG and CSS, no external images. Fonts are bundled locally through `@fontsource`.
