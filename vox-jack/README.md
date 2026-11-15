# Jack of All Trades: the 1592 insult (10 s, 9:16)

A gothic documentary collage for TikTok in HyperFrames: archival scans graded cold and desaturated, charred paper on a soot-black wall lit like a single candle, oxblood ink and blackletter titles. 1080×1920, 30 fps, 10 s. Cut to a dark, eerie score, with your voiceover and sound effects on top. Every word sits inside TikTok's clear band (y 240–1260, clear of the button rail).

Share copy: `renders/jack-of-all-trades-tiktok-share.mp4`

## Score

- "Mysterious Merchant" by code_box (CC0, `assets/music/mysterious-merchant.mp3`): a diminished, harmonic-minor melody that drops out at 6.55 s and comes back with heavy bass at 7.00 s, 120.5 BPM. Darkened in the mix (`data-fx-chain` on `<audio id="music">`): low-passed at 2.2 kHz, +3 dB low shelf, and a large damped reverb.
- Under the intro, "Suspense_Strings_001" by jdagenet (CC0, `assets/music/low-strings.mp3`): low tremolo strings whose C/E♭/E cluster sits in the melody's key; it stops before the break so the silence stays empty.
- A sub-bass boom under the drop.

The picture is cut to the score: circles and the whip fall on phrase starts, labels on beats, the eight engravings on sixteenth notes, the portrait one frame before the drop, the name on the 7.31 s hit and a push-in on Shakespeare's face on the 8.99 s accent. Levels are set to sit under a voice (the mix without voice measures about −23 LUFS), so add your voiceover before judging the balance.

## Look

Ground #0b0c0d soot plaster with soft-light mottling; one pool of light at 38% height whose darkness wavers by a few percent (a seeded candle flicker); heavy top and bottom vignette; 14% film grain. Scans graded with `media-treatment` (exposure −0.35, contrast +0.22, saturation −0.7, slightly cold, vignette 0.4). Paper in bone #bdb3a0 with charred edges, tags soot-black with bone type, ink oxblood #9a1f1a, the highlight a dull blood wash. Titles in UnifrakturMaguntia, text in EB Garamond.

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
