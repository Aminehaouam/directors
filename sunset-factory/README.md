# sunset-factory

A 20-second paper-cut animation of a tiny factory that manufactures sunsets, made entirely in code.
It renders as a vertical 1080×1920 MP4 for Instagram Reels.

**Output:** `export/sunset-factory_1080x1920.mp4`. The file is H.264 High, 30 fps, 600 frames, with AAC 48 kHz stereo audio at −16 LUFS and fast start for streaming.

## Story (no words; told through the action)
| time | beat |
|---|---|
| 0–3.5 s | The oven bell dings, the round oven door swings open and a glowing sun pops out onto the belt. Rosie and Tam roll it along while Gus pulls the lever to stop it. |
| 3.6–7.3 s | The two painters pull telescoping rollers from their paint buckets and sweep the blank paper sky pink and orange. |
| 7.3–11 s | Gus works the crane with a remote. The claw grabs the sun and lifts it into the dashed outline in the sky. It clicks into place and sunset light floods the scene. |
| 11–13.5 s | The three workers admire their sunset. |
| 13.5–17.5 s | Gus steps back to admire it and bumps a crate. The jar of stars wobbles, seems to settle, then tips over and its cork pops. The stars stream into the sky and night blooms out from each one while the sun sinks behind the hills. |
| 17.6–20 s | The workers look at each other, then shrug. |

The main action stays in the centre of the frame. The bottom strip of the frame (the machine-room cutaway) and the top of the sky are decorative, so Reels captions and buttons don't hide anything that matters.

## Render
Needs Node 22, ffmpeg, and a Chromium that Playwright can launch. Nothing gets installed: the script uses the preinstalled `playwright` package.
```
node scripts/audio.mjs                               # synthesises out/audio.wav (procedural SFX, loudness-normalised)
node scripts/render.mjs                              # renders 600 PNG frames and encodes export/…mp4 (about 90 s on 4 cores)
node scripts/check.mjs                               # spec, black/frozen frames, loudness, contact sheet
node scripts/render.mjs --scale 0.5 --stills 0,300,590   # quick half-size stills in out/stills
```
`npm run render` runs the audio and video steps together. Frames are cached in `out/frames`; add `--force` after changing the source.

## How it is built
- **Deterministic.** `window.renderFrame(i)` draws frame `i` at `t = i / 30` on a Canvas 2D in headless Chromium. Nothing uses the clock or `Math.random`; all randomness comes from a seeded generator.
- `src/story.js` holds the whole film as pure functions of time: the beat sheet `T`, layout, camera, machinery, the jar, star paths and every character pose. The renderer and the audio script both read it, so every sound sits on its visual cue.
- `src/paper.js` provides the paper look:
  - procedural fibrous paper texture, overlaid on every piece in that piece's own coordinates so the grain moves with it
  - hand-cut wobbly edges
  - stacked-paper drop shadows
  - a colour grade for day, sunset and night
- `src/rig.js` defines the split-pin paper-doll workers: two-bone IK hands, walk cycles driven by distance travelled, and expressive eyes, brows and mouths.
- `src/set.js` draws everything else:
  - sky: blank, painted and night layers
  - the hills, factory and oven
  - the belt, crane and claw
  - the rollers, jar, stars and sparkles
  - the machine room
- `scripts/audio.mjs` synthesises every sound from oscillators, filtered noise, modal and FM bells, and a Freeverb-style reverb:
  - bell, hinges, belt motor and gear ticks, footsteps
  - telescoping poles, paint rollers
  - crane winch, claw clamp, the lock "ka-chunk"
  - glass tinks, the cork pop
  - the star sparkle and chimes, crickets

  There is no narration and no music.
