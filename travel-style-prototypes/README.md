# Travel-film art-direction prototypes

Three 10-second, 1080 × 1920, 30 fps previews of one story in three art
directions, built so a single direction can be chosen for the final film.

| | Direction | Preview | Rive source |
|---|---|---|---|
| A | Modern Illustrated Travel Journal | `out/style-a-journal.mp4` | `rive/style-a-journal.riv` |
| B | Dimensional Paper Cut-Out | `out/style-b-paper.mp4` | `rive/style-b-paper.riv` |
| C | Modern Pixel Art | `out/style-c-pixel.mp4` | `rive/style-c-pixel.riv` |

Keyframes (Stage 1) are in `out/keyframes/` (t = 6.0 s and the end frame for each style). The side-by-side page is `comparison/index.html`
(serve the folder over http and open it).

## The story (identical in all three)

A journal lies on a desk and its cover swings open. A folded ticket slides out
from between the pages, unfolds, grows, and its face becomes the Thames and
streets of a miniature London. The skyline pops up and Big Ben rises. Coco
flies in, lands beside the ticket, turns to face it and nudges it twice. London
folds flat and the ticket opens into a map: a dotted route runs to Paris, a pin
drops, the Eiffel Tower pops up and a destination tag appears. Coco hops.

Timing, cues and camera live in one file, `src/timeline.js`, which all three
styles read.

## How Rive is used

What I checked first:

- The Rive **editor** is a GUI app. It has no headless or command-line
  authoring, and there was no Rive tool or MCP server available here.
- The official **runtimes** are on npm. `@rive-app/canvas-advanced` 2.49.0
  gives low-level control: load a `.riv`, create state-machine instances, fire
  inputs, advance by an exact `dt`, and draw to a canvas.
- The `.riv` binary format is defined by rive-runtime's generated headers.

So the `.riv` files are **generated from code**:

- `tools/extract-defs.js` reads the generated C++ headers from
  `rive-app/rive-runtime` into `tools/rive-defs.json`, which holds the type keys,
  property keys and field types.
- `tools/riv-writer.js` is a small encoder for Rive format 7. It writes
  artboards, nodes, shapes, cubic paths, solid and gradient fills, strokes,
  trim and dash effects, clipping, linear animations with cubic-eased
  keyframes, and state machines (layers, animation states, trigger
  transitions, exit-time transitions, mix durations).
- `src/elements/*.js` holds the art and motion for each element. It is written
  once and skinned per style by `src/styles.js`.

Every artboard has its own state machine:

| Artboard | State machine | Inputs | States |
|---|---|---|---|
| Journal | JournalSM | `open` | open |
| Ticket | TicketSM | `slide`, `unfold`, `map` | slide → unfold → map |
| LondonBack / LondonFront | …SM | `popup`, `fold` | popup → fold (+ a looping London Eye layer on Front) |
| BigBen | BigBenSM | `rise`, `fold` | rise → fold |
| Coco | CocoSM | `flyIn`, `land`, `nudge`, `cheer` | layer *path*: flight. Layer *pose*: fly ↔ land → idle ↔ nudge / cheer |

Coco is a rig of nested nodes: `cocoPath > facing > flyScale > hop > squash >
bodyTilt > head / wingFront / wingFar / tail`, plus feet. She has no eyes or
other facial features. Her emotion comes from head angle, body lean, wings,
tail and how she lands.

### Rendering pipeline

`compositor/compositor.js` runs in headless Chromium:

1. It loads the style's `.riv` with the official runtime.
2. On a fixed 30 fps clock it advances each artboard's state machine and fires
   the cues from `src/timeline.js` at exact sub-frame times.
3. Rive draws each artboard into its own layer canvas through the shared
   camera (`renderer.align`).
4. The style's finishing is applied. Nothing is redrawn by hand; this stage
   only lights and treats what Rive rendered:
   - **A**: fine grain inside each layer, two-part soft shadow, vignette, paper tone.
   - **B**: paper fibre texture, cut-edge rim light and shade, three-part
     contact, ambient and key-light shadows, key light and falloff,
     depth-of-field edge blur, film grain. Every cut piece also carries its own
     small shadow inside the Rive art.
   - **C**: the scene is rendered at 270 × 480, alpha is hardened, a selective
     1-pixel outline is added, then a hard drop shadow. The frame is quantised
     to a fixed 41-colour palette and upscaled 4× with nearest-neighbour.
5. `render/render.js` streams PNG frames into ffmpeg (H.264 High, CRF 16, yuv420p).

Each artboard's `fx` node is animated in Rive and carries that layer's height
above the desk, so the shadows lift and land with the motion.

### What Rive does not do here, and why

- **Video export.** Rive has no video exporter for the runtime, so frames are
  rendered by the runtime and encoded with ffmpeg.
- **Feathered (soft) shapes.** Rive's Feather didn't render in the web
  runtime's Canvas2D or WebGL2 backends in this setup, so soft shadows are made
  in the compositor from each Rive layer's alpha.
- **Paper and pixel finishing.** These are compositor passes. A and C's motion
  and art are fully Rive. B's material look needs the compositor.
- **Opening in the Rive editor.** The editor imports `.riv` files, but the
  editable "source" here is the generator code rather than a `.rev` project.
  If you pick a direction, rebuilding its hero assets by hand in the Rive editor
  is a sensible next step.

## Commands

```bash
npm install
node src/build.js                # writes rive/*.riv (+ rive/styles.json)
node render/render.js A --frames 180,250   # stills to out/stills/
node render/render.js A --video            # out/style-a-journal.mp4
node render/render.js C --video --only Coco,Ticket   # isolate layers for review
```

## Folder map

```
src/timeline.js      story cues + camera (shared by all styles)
src/styles.js        palettes / per-style rules
src/elements/        desk, journal, ticket+map, london (3 layers), coco
tools/riv-writer.js  .riv encoder; tools/rive-defs.json format schema
compositor/          browser compositor (Rive runtime + per-style finishing)
render/render.js     headless render -> PNG stills / MP4
rive/                generated Rive files, one per direction
out/                 MP4 previews, keyframes
comparison/          comparison page (web-size encodes + posters)
```
