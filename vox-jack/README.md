# Jack of All Trades: the 1592 insult (10 s)

A documentary-style collage explainer in HyperFrames: archival scans, torn paper, highlighter and red pen. 1920×1080, 30 fps, 10 s. Your voiceover plus sound effects, no music.

Share copy: `renders/jack-of-all-trades-doc-share.mp4`

## Voiceover script

Read at an easy documentary pace (about 22 spoken words). The visuals are timed to these cues:

| Time | Say | On screen |
| --- | --- | --- |
| 0.3 – 1.6 s | "In 1592," | the 1592 title page slides in; its printed date is circled, a 1592 card lands |
| 1.6 – 3.2 s | "a dying playwright mocked a rival" | "Written before his death" is circled; ROBERT GREENE, PLAYWRIGHT |
| 3.3 – 4.9 s | "as 'an absolute Johannes factotum'" | whip to the original quote; highlighter across *absolute Iohannes fac totum* |
| 4.9 – 6.6 s | "a jack of all trades." | 1814 engravings of tradesmen slapped down; = A JACK OF ALL TRADES |
| 6.7 – 8.8 s | "He meant William Shakespeare." | *Shake-scene* circled; the 1623 portrait lands; WILLIAM SHAKESPEARE |

## Add your voiceover

1. Record the script and export it as a WAV (or MP3) that starts at the first word with about 0.3 s of lead-in.
2. Replace `assets/voiceover.wav` with it (same name; for an MP3, change the `src` of `<audio id="voiceover">` in `index.html`).
3. `npm run render`. If a line lands early or late, the cue times are in `compositions/greene.html` and `compositions/factotum.html` (each tween's last number is its time; the factotum scene starts at 3.2 s).

## Files

- `index.html`: root (10 s), mounts the four scenes and places the voiceover and every sound effect.
- `compositions/board.html`: the slate paper board. `greene.html`: the 1592 title page (0–3.6 s). `factotum.html`: the quote, the trades and Shakespeare (3.2–10 s). `finish.html`: grain and vignette.
- Copy is editable through each scene's variables.
- `scripts/prep-audio.sh`: cuts the raw CC0 downloads in `.media/audio/sfx/` into `assets/sfx/`.
- Credits and licences: `assets/CREDITS.md`.

```bash
npm run check     # lint, layout, motion, audio
npm run dev       # preview in the browser
npm run render    # render to renders/
```
