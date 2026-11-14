# Jack of All Trades: the 1592 insult (10 s)

A documentary-style collage explainer in HyperFrames: archival scans, torn paper, highlighter and red pen. 1920×1080, 30 fps, 10 s. Cut to an eerie, suspenseful score, with your voiceover and sound effects on top.

Share copy: `renders/jack-of-all-trades-doc-share.mp4`

## Score

"Mysterious Merchant" by code_box (CC0, `assets/music/mysterious-merchant.mp3`): a diminished, harmonic-minor melody that drops out at 6.55 s and comes back with heavy bass at 7.00 s, 120.5 BPM. The picture is cut to it: circles and the whip fall on phrase starts, labels on beats, the eight engravings on sixteenth notes, the portrait one frame before the drop, the name on the 7.31 s hit and a punch-in on the 8.99 s accent. Its level (the `data-automation` lane on `<audio id="music">`) is set to sit under a voice, so without your voiceover the film plays quiet.

## Voiceover script

Read at an easy documentary pace (about 22 spoken words). The visuals are timed to these cues:

| Time | Say | On screen |
| --- | --- | --- |
| 0.3 – 1.6 s | "In 1592," | the 1592 title page slides in; its printed date is circled, a 1592 card lands |
| 1.6 – 3.3 s | "a dying playwright mocked a rival" | "Written before his death" is circled; ROBERT GREENE, PLAYWRIGHT |
| 3.5 – 4.9 s | "as 'an absolute Johannes factotum'" | whip to the original quote; highlighter across *absolute Iohannes fac totum* |
| 5.0 – 6.4 s | "a jack of all trades." | 1814 engravings of tradesmen slapped down; = A JACK OF ALL TRADES |
| 6.5 – 6.95 s | "He meant…" | the music drops out; *Shake-scene* is circled |
| 7.0 – 8.4 s | "William Shakespeare." | on the drop: the 1623 portrait slams in; WILLIAM SHAKESPEARE |

## Add your voiceover

1. Record the script and export it as a WAV (or MP3) that starts at the first word with about 0.3 s of lead-in.
2. Replace `assets/voiceover.wav` with it (same name; for an MP3, change the `src` of `<audio id="voiceover">` in `index.html`).
3. `npm run render`. If your read runs long or short, keep "William" on the 7.00 s drop and adjust the earlier lines; cue times are in `compositions/greene.html` and `compositions/factotum.html` (the factotum scene's `at(…)` values are film time).

## Files

- `index.html`: root (10 s), mounts the four scenes and places the score, the voiceover and every sound effect.
- `compositions/board.html`: the slate paper board. `greene.html`: the 1592 title page (0–3.6 s). `factotum.html`: the quote, the trades and Shakespeare (3.2–10 s). `finish.html`: grain and vignette.
- Copy is editable through each scene's variables.
- `scripts/prep-audio.sh`: cuts the raw CC0 downloads in `.media/audio/sfx/` into `assets/sfx/`.
- Credits and licences: `assets/CREDITS.md`.

```bash
npm run check     # lint, layout, motion, audio
npm run dev       # preview in the browser
npm run render    # render to renders/
```
