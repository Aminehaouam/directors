# London → English: 15 s app-install ad

The output is `output/london-english-ad.mp4`: 1080×1920 (9:16), 30 fps, H.264 + AAC, 15.0 s, −14 LUFS.
To rebuild it, run `python3 build.py [--app-name "Your App"]`. It needs ffmpeg, numpy and Pillow.
The source reel goes in `footage/source.mp4`.

There is also an **illustrated version**, `output/london-english-ad-illustrated.mp4`. It has the same cut, copy and sound, but every shot is flat vector animation instead of footage. See [Illustrated version](#illustrated-version).

The edit is cut on a **120 BPM grid**, so one beat lasts 0.5 s. The audio is a procedural placeholder. To use a licensed track instead, pick one at 120 BPM, or a 240 BPM double-time phonk track. Put its downbeat at 0.0 s and its drop at 1.5 s.

> Footage note: the shot breakdown in the brief doesn't quite match the reel. The reel opens on a lens close-up and a **Green Park → Piccadilly Circus** roundel. It also contains Canary Wharf station, a South Bank carousel, Millennium Bridge with St Paul's, and a Tube train arriving. The cut below uses the real shots and their timestamps.

## 1. Pacing & cut strategy

| Out (s) | Source (s) | Speed | Shot | Move |
|---|---|---|---|---|
| **HOOK** | | | | |
| 0.0–0.5 | 0.30–0.80 | 1.0× | Tube roundels (Green Park / Piccadilly Circus) | 1.14→1.0 punch-in, white flash |
| 0.5–1.0 | 7.48–7.76 | 0.56× (optical flow) | Escalator tunnel, moved up from 0:07 | punch-in, flash |
| 1.0–1.5 | 5.04–5.22 | 0.36× (optical flow) | Tube train arriving | camera shake |
| **DROP** | | | | |
| 1.5–3.0 | 1.90–3.35 | 0.97× | Big Ben at dusk, the drop lands here | slow push 1.0→1.08, flash |
| 3.0–4.0 | 4.02–4.98 | 0.96× | Explorer looking over the Thames | slow push |
| **VOCAB MONTAGE** (one cut per beat) | | | | |
| 4.0–4.5 | 5.44–5.69 | 0.5× | Platform & The Shard | 1.06 snap |
| 4.5–5.0 | 9.88–10.09 | 0.42× | Canary Wharf station | snap |
| 5.0–5.5 | 11.41–11.75 | 0.68× | Aerial: Tower Bridge & Tower of London | snap |
| 5.5–6.0 | 6.44–6.72 | 0.56× | Aerial: Westminster | snap |
| 6.0–6.5 | 8.28–8.49 | 0.42× | London Eye at night | snap |
| 6.5–7.0 | 9.31–9.59 | 0.56× | Tower Bridge | snap |
| 7.0–7.5 | 10.38–10.62 | 0.48× | South Bank: lamps, pedicabs, double-decker | snap |
| 7.5–8.0 | 12.14–12.39 | 0.5× | South Bank carousel | snap |
| 8.0–8.5 | 10.11–10.36 | 0.5× | The Shard between towers | snap |
| 8.5–9.0 | 8.01–8.26 | 0.5× | City skyline, blue hour | snap |
| **PAYOFF** | | | | |
| 9.0–10.0 | 10.64–11.38 | 0.74× | Silhouette by Westminster Bridge | push, music filtered |
| 10.0–10.5 | 7.24–7.46 | 0.44× | London Bridge station & The Shard | flash on re-drop |
| 10.5–11.0 | 12.42–12.72 | 0.6× | Archway toward Big Ben | snap |
| 11.0–11.5 | 9.61–9.86 | 0.5× | Millennium Bridge → St Paul's | snap |
| 11.5–12.0 | 12.78–12.95 | 0.34× | London Eye light streaks | punch, dip to black |
| **CTA** | | | | |
| 12.0–15.0 | 13.55–14.83 | 0.43× | Millennium Bridge & The Shard | push, blur and darken under the end card |

- **Hook (0–3 s):** the hook makes three hard cuts on the first three beats: the roundel, the escalator and the train. The original opening is a camera-lens close-up, and that shot is dropped. The original's slow 3-second Big Ben is saved for the drop at 1.5 s, where it pays off the hook. Nothing on screen stays still for more than 0.5 s before the drop.
- **Speed:** all the montage shots run at 0.35–0.75× with motion-interpolated slow motion. The cuts are fast and land on every beat, but each shot drifts slowly, which gives the phonk "slow-fast" feel.
- **Reverse:** nothing is reversed. The train pull-in and the escalator already move toward camera, and reversing either one makes it read wrong.
- **Grade:** the look is teal shadows, warm highlights, +8% contrast and +18% saturation, with a soft vignette.
- The person-looking shot and the Canary Wharf clip are both reframed for 9:16. Each shot uses a 608 px-wide window from the 1080p source, centred on its subject.

## 2. Kinetic typography

**Type:**
- **Headlines:** Inter Display Black. It's a free, close match for Montserrat and Helvetica Neue, and it's bundled with the system.
- **Labels and secondary lines:** Inter SemiBold or Medium.
- **Colours:**
  - main text: white `#FFFFFF` with a soft drop shadow (black at 60%, 14 px blur, 6 px down)
  - emphasis: a yellow pill `#FFD60A` with near-black text `#0B0B0B`
  - accent: London red `#E4002B`
  - counter pill and icon: navy `#0B1F4B`
- **Safe area:** all text sits between y≈230 and y≈1420. That keeps it clear of the TikTok and Reels caption, username and button rails.

| Time (s) | Copy | Style | In / out |
|---|---|---|---|
| 0.05–1.47 | **POV:** | white, 84 px | pop (scale 0.55→1 with back-ease), fade out |
| 0.30–1.47 | **you're exploring** | white, 84 px | pop on beat 2 |
| 0.55–1.47 | **LONDON** | yellow pill, 150 px | slam (scale 1.6→1) on beat 2 |
| 1.55–2.97 | **and every street** | white, 80 px | slide-up 70 px, ease-out cubic |
| 1.75–2.97 | **teaches you `English`** | "English" in a yellow pill | slide-up, 0.2 s stagger |
| 3.05–3.97 | **Just look around.** | white, 76 px | typewriter at 22 chars/s, blinking cursor |
| 4.0–11.97 | `● WORDS LEARNED n` | navy pill at the top, white and yellow | counts 1→5 and bounces at each chip |
| 4.0 / 5.0 / 6.0 / 7.0 / 8.0 | Vocab chips (each held about 1 s) | white card with a red edge bar, a red `NEW WORD` label, the term in Black 64 px, the meaning in grey 34 px and a yellow `+1` badge | pop in, fade up and out |
| 9.0–9.97 | **No flashcards.** then **No classroom.** (+0.5 s) | white, 84 px | slide-up |
| 10.0–11.85 | **Just** / **`London.`** | 110 px white over a 150 px yellow pill | slam on the re-drop |

The five vocab chips are:

| Time (s) | Term | Meaning |
|---|---|---|
| 4.0 | Mind the gap | = be careful stepping onto the train |
| 5.0 | Innit? | = isn't it? (casual London English) |
| 6.0 | Cheers, mate! | = thanks, friend |
| 7.0 | Double-decker | = a bus with two floors |
| 8.0 | Fancy a walk? | = would you like to go for a walk? |

The copy moves through four stages:
1. the wanderlust hook: *POV: you're exploring LONDON*
2. the promise: *every street teaches you English*
3. proof that shows the product in use: the vocab chips and the words-learned counter
4. a contrast with the old way: *No flashcards. No classroom. Just London.*

## 3. Sound design

| Time (s) | Layer |
|---|---|
| 0.0–1.5 | Noise and pitch riser, a kick and 808 hit on each cut, station-hum ambience |
| 0.0 | Impact on the first frame, so the ad doesn't open silent |
| 0.5 | Escalator air-rush whoosh |
| 0.9–1.8 | **Train swish** through the cut, with low rumble under it |
| **1.5** | **Drop:** impact plus a **Big Ben bell "bong"** (low E, inharmonic partials) |
| 1.5–12.0 | Full groove: kick and 808 (G–G–B♭–A), claps on 2 and 4, 8th-note **phonk cowbell** riff, hats. Faint city bed underneath |
| 3.0–3.75 | Four **footsteps** under the explorer shot |
| 4.0–5.0 | Platform ambience under "Mind the gap" |
| 4.0, 5.0, 6.0, 7.0, 8.0 | Tick-whoosh, then a **two-note chime** on each vocab chip (the reward sound) |
| 9.0–10.0 | **Filter break:** the music low-passes from 1.8 kHz down to 350 Hz, with a reverse swell into… |
| 10.0 | **Re-drop** impact on "Just London." |
| 11.75–12.0 | Whoosh into the end card, then impact and a softer bell |
| 12.9 / 13.2 | UI **tap** when the button lands, then a C-E-G **success chime** when the store badges land |
| 14.2–15.0 | The bed fades out |

**Mix:** the music sits about 2.5 dB under the SFX, with soft-clip glue and slight stereo width. It's measured at **−14.1 LUFS integrated, −1.8 dBTP**. The original track in the reel was not used. It came from a TikTok download, so it isn't licensed for paid ads.

## 4. CTA / end card (12.0–15.0 s)

The background is the Millennium Bridge and Shard shot. It is slowed to 0.43×, pushed in, darkened 40–60% on a top-to-bottom gradient and blurred to 10 px in 0.4 s. The red Shard tip glows behind the icon.

| Time (s) | y (px) | Element | Animation |
|---|---|---|---|
| 12.10 | 470 | App icon: 230 px squircle, navy→red gradient, a white "Aa" speech bubble and a yellow notification dot | pop |
| 12.25 | 650 | **App name** (`--app-name`, placeholder `WanderEnglish`) | slide-up |
| 12.35 / 12.50 | 790 / 905 | **Explore London.** / **Speak `English.`** at 96 px | staggered slide-up |
| 12.65 | 1020 | *Real places. Real conversations.* | slide-up |
| 12.90 | 1190 | Yellow pill button: **Start learning free →** | pop, then a ±3.5% pulse on every beat |
| 13.20 / 13.30 | 1360 | **App Store** and **Google Play** badges, side by side | slide-up |

There are about 1.7 s of fully built end card before the loop. TikTok and Reels autoplay in a loop, and the dark end frame cuts cleanly back to the bright roundel hit at 0.0.

## Illustrated version

`output/london-english-ad-illustrated.mp4` re-imagines the ad as 2D animation inspired by Kurzgesagt and Duolingo. The style takes Kurzgesagt's layered gradients, glow, starry skies and soft grain, and Duolingo's chunky, bouncy character. Every shot is drawn in code (`illustrated/scenes.js`) and rendered frame by frame in headless Chromium. Each shot keeps the timing of the footage cut, so the same text, word cards, end card and audio sit on top.

To rebuild it, run `python3 build.py --style illustrated`. On top of the footage requirements, it needs Node and Playwright with Chromium.

**Mascot:** a chunky speech-bubble character with a red scarf and a yellow notification-dot antenna, which echoes the app icon. It's an original design, not the Duolingo owl or a Kurzgesagt bird. The shots avoid the TfL roundel, which is a TfL trademark.

| Time (s) | Shot |
|---|---|
| 0.0–0.5 | The mascot pops up through a starburst, with confetti |
| 0.5–1.0 | Rushing down a Tube escalator tunnel |
| 1.0–1.5 | A train whooshes in and squashes to a stop while the mascot's scarf blows |
| 1.5–3.0 | Big Ben at dusk. Bell rings pulse out on the drop and a bus crosses Westminster Bridge |
| 3.0–4.0 | The mascot walks the Embankment (four steps, on the footstep SFX) and looks up in wonder |
| 4.0–4.5 | A platform under The Shard, with "MIND THE GAP" on the edge |
| 4.5–5.0 | The mascot hops the gap into the carriage |
| 5.0–5.5 | Aerial view of Tower Bridge and the Tower of London, with a boat on the Thames |
| 5.5–6.0 | Floodlit Parliament, Big Ben and a pink London Eye |
| 6.0–6.5 | A neon London Eye under the stars |
| 6.5–7.0 | Tower Bridge at night, with a bus crossing |
| 7.0–7.5 | A double-decker on the South Bank |
| 7.5–8.0 | The South Bank carousel |
| 8.0–8.5 | Looking up at The Shard between towers |
| 8.5–9.0 | The City skyline (Gherkin, Walkie-Talkie, Cheesegrater, Shard), windows switching on in a wave |
| 9.0–10.0 | The mascot tosses its flashcards and the chalkboard vanishes in a poof |
| 10.0–10.5 | The Shard with light rays, on the re-drop |
| 10.5–11.0 | Big Ben framed by a stone arch |
| 11.0–11.5 | Gliding along the Millennium Bridge toward St Paul's |
| 11.5–12.0 | A light-streak zoom on the London Eye |
| 12.0–15.0 | End card over the Millennium Bridge and The Shard. The mascot pops up and waves |

What's different from the footage version:
- **Type:** Nunito replaces Inter. It's rounder and friendlier, and it's vendored in `illustrated/fonts` under the OFL. The CTA arrow still comes from Inter, because Nunito has no → glyph.
- **Effects:** the scenes draw their own camera moves, vignette, grain and end-card dim, so stage 3 skips those passes.
- **Audio:** adds a cartoon layer: boings on the mascot's pops and hops, a paper flutter, and a poof (`build/mix-illustrated.wav`).

## Before launch

- [ ] Replace `WanderEnglish` and the drawn icon with your real name and icon (`--app-name`, `app_icon()` in `build.py`).
- [ ] Illustrated version: keep the speech-bubble mascot, or swap in your own character (`mascot()` in `illustrated/scenes.js`).
- [ ] Replace the text-only store badges with the official Apple and Google badge artwork.
- [ ] Replace the procedural audio (`build/mix.wav`) with a licensed 120/240 BPM phonk or lo-fi track. Keep the SFX layer.
- [ ] Optional: a TTS or real voice saying *"Mind the gap"* at 4.0 s makes a strong audio hook.
