# director-cut

Reproducible, deterministic pipeline that renders the 30-second *Director's Cut: Episode 1 (The Matrix)* film-essay animation to MP4.
Every frame is a pure function of its index: `window.renderFrame(i)` draws a Canvas scene graph at `t = i / fps`; Playwright/Chromium captures the PNGs and ffmpeg assembles video + audio.

## Install
```
npm install          # playwright, ajv, pngjs, fontsource (fonts are vendored in public/fonts)
npm run inspect      # records tools/versions into docs/ENVIRONMENT.md
npm run assets       # textures (seeded), SVG illustrations, footage frame cache
```
Needs ffmpeg (libx264, aac) and a Chromium that Playwright can find (`PLAYWRIGHT_BROWSERS_PATH`, or `npx playwright install chromium`).

## Commands
| command | does |
|---|---|
| `npm run preview` | 960x540 quick silent preview, `output/preview.mp4` |
| `npm run render:draft` | 960x540 with audio, `output/director-cut-ep01-draft.mp4` |
| `npm run render` | final 1920x1080 H.264 + ProRes intermediate, then QA. Add `--require-footage` to fail if clips are missing |
| `npm run validate` | QA: ffprobe spec, blackdetect, determinism, safe margins, contrast, text-lead timing, green cap, contact sheet -> `output/qa-report.md` |
| `npm test` | unit + determinism tests |

Render flags: `--from N --to N`, `--workers N`, `--force`. Frames are cached in `output/frames`; the cache clears itself when source or config changes.

## Supply footage
Put four clips at `public/footage/{A,B,C,D}.mp4` (D optional). In `config/episode.json -> footageSlots` set `inSeconds`, `durationSeconds`, `speed` and `crop {x,y,w,h}` (fractions 0..1). Source timestamps are never hard-coded. Missing clips render an illustrated stand-in stamped `SOURCE SHOT REQUIRED: <slot>`.
- A: Neo alone at night at his computer, green text scrolling
- B: Neo moving through an ordinary workday
- C: a crowd or rows of office workers
- D: two pills in an open palm, or the awakening in the pod (about 1.2 s)

## Record the voiceover and set cue times
Save `public/audio/voiceover.wav`. Cues `c1..c8` in `config/episode.json -> voiceover.cues` hold start/end; word markers are fractions of the cue. Every animation event references a cue (or a word in it), so re-timing means editing cue times only:
```
node scripts/cues/cues.mjs times.json --write          # {"c1":{"start":0.4,"end":4.9}, ...}
node scripts/cues/cues.mjs --whisper whisper.json      # optional Whisper JSON
```
If the full read runs past 30 s, shorten the line 6 pause, then cut "will" in line 8, then drop line 6.

## Swap music and sfx
Drop files at the paths in `config/episode.json` (`music.path`, `sfx[].path`). Missing files are replaced by clearly named procedural placeholders (`output/cache/placeholders/PLACEHOLDER-*.wav`). The mix (loudnorm -16 LUFS voice, ~10 dB sidechain duck, adelay sfx, -1 dBTP limiter) is `output/mix.wav`.

## Structure
`config/` content (episode.json, palette.json, schema) · `src/scenes/` six scene modules `build(ctx)`/`update(t, ctx)` · `src/components/` ParallaxCamera, PaperLayer, InkStroke, CutoutLetters, StampText, MountedFrame, CodeColumns, CandleLight, Grain, Vignette, MaskReveal, EngravingHatch · `src/compositing/` ink-blot, torn-paper, archival-slide transitions, footage and stand-ins · `scripts/` inspect, assets, render, validate, cues.

## Add a second episode
Copy `config/episode.json`, change cues/events/footage/scene list, and add scene modules under `src/scenes/` exporting `build`/`update`. Engine code is episode-agnostic. The architecture keeps canvas size in config for a later 9:16 adaptation (not built).
