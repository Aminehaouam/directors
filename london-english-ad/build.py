#!/usr/bin/env python3
"""London -> English-learning app ad: 15 s, 1080x1920, 30 fps.

Stage 1  ffmpeg re-cuts the source onto a 120 BPM grid (0.5 s per beat),
         crops each shot to 9:16, retimes it and grades it  -> build/base.mp4
Stage 2  numpy synthesises a placeholder phonk-style bed + SFX -> build/mix.wav
Stage 3  Pillow animates the type, vocab chips and end card over every frame
         and pipes them to ffmpeg with the mix               -> output/london-english-ad.mp4

Usage: python3 build.py [--app-name NAME] [--preview-frames]
"""
import argparse
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "footage", "source.mp4")
BUILD = os.path.join(ROOT, "build")
OUT = os.path.join(ROOT, "output")
W, H, FPS = 1080, 1920, 30
DUR = 15.0
NFRAMES = int(DUR * FPS)
SR = 44100
BEAT = 0.5  # 120 BPM

FONT_DIR = "/usr/share/fonts/opentype/inter"
F_BLACK = os.path.join(FONT_DIR, "InterDisplay-Black.otf")
F_BOLD = os.path.join(FONT_DIR, "InterDisplay-Bold.otf")
F_SEMI = os.path.join(FONT_DIR, "Inter-SemiBold.otf")
F_MED = os.path.join(FONT_DIR, "Inter-Medium.otf")

WHITE = (255, 255, 255)
YELLOW = (255, 214, 10)      # #FFD60A highlight
INK = (11, 11, 11)           # #0B0B0B text on yellow
RED = (228, 0, 43)           # #E4002B London red
NAVY = (11, 31, 75)          # #0B1F4B

# ---------------------------------------------------------------------------
# Shot list: (source in, source out, output duration, crop x-centre 0..1, motion, label)
# Source in/out sit inside the detected cuts of the source reel.
# motion: punch = 1.14 -> 1.0 snap zoom, push = slow 1.0 -> 1.08, snap = 1.06 -> 1.0, shake
SHOTS = [
    # HOOK 0.0-1.5: three hard hits, one per beat
    (0.30, 0.80, 0.5, 0.50, "punch", "Tube roundels (Green Park / Piccadilly Circus)"),
    (7.48, 7.76, 0.5, 0.50, "punch", "Escalator tunnel"),
    (5.04, 5.22, 0.5, 0.42, "shake", "Tube train arriving"),
    # BRIDGE 1.5-4.0: the drop lands on Big Ben, then the explorer
    (1.90, 3.35, 1.5, 0.50, "push", "Big Ben & Westminster at dusk"),
    (4.02, 4.98, 1.0, 0.42, "push", "Person looking out over the Thames"),
    # VOCAB MONTAGE 4.0-9.0: a cut on every beat, one word chip per two shots
    (5.44, 5.69, 0.5, 0.50, "snap", "Platform & The Shard"),
    (9.88, 10.09, 0.5, 0.45, "snap", "Canary Wharf station"),
    (11.41, 11.75, 0.5, 0.50, "snap", "Aerial: Tower Bridge & Tower of London"),
    (6.44, 6.72, 0.5, 0.50, "snap", "Aerial: Westminster"),
    (8.28, 8.49, 0.5, 0.50, "snap", "London Eye at night"),
    (9.31, 9.59, 0.5, 0.38, "snap", "Tower Bridge"),
    (10.38, 10.62, 0.5, 0.68, "snap", "South Bank: lamps, pedicabs, double-decker"),
    (12.14, 12.39, 0.5, 0.50, "snap", "South Bank carousel"),
    (10.11, 10.36, 0.5, 0.58, "snap", "The Shard between towers"),
    (8.01, 8.26, 0.5, 0.50, "snap", "City skyline at blue hour"),
    # PAYOFF 9.0-12.0
    (10.64, 11.38, 1.0, 0.50, "push", "Silhouette by Westminster Bridge"),
    (7.24, 7.46, 0.5, 0.50, "snap", "London Bridge station & The Shard"),
    (12.42, 12.72, 0.5, 0.50, "snap", "Archway toward Big Ben"),
    (9.61, 9.86, 0.5, 0.50, "snap", "Millennium Bridge toward St Paul's"),
    (12.78, 12.95, 0.5, 0.50, "punch", "London Eye light streaks"),
    # CTA 12.0-15.0
    (13.55, 14.83, 3.0, 0.50, "push", "Millennium Bridge & The Shard (end card)"),
]
assert abs(sum(s[2] for s in SHOTS) - DUR) < 1e-6


def shot_starts():
    t, out = 0.0, []
    for s in SHOTS:
        out.append(t)
        t += s[2]
    return out


STARTS = shot_starts()


# ---------------------------------------------------------------------------
# Stage 1: base cut
def build_base(path):
    cw = int(round(1080 * 9 / 16 / 2)) * 2  # 608 px wide 9:16 window from the 1080p source
    parts, labels = [], []
    for i, (a, b, d, xc, _, _) in enumerate(SHOTS):
        speed = (b - a) / d
        x = int(min(max(xc * 1920 - cw / 2, 0), 1920 - cw))
        n = int(round(d * FPS))
        chain = (f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{speed:.4f},"
                 f"crop={cw}:1080:{x}:0,")
        if speed < 0.75:  # optical-flow slow motion instead of duplicated frames
            chain += f"fps=60,minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,"
        chain += (f"fps={FPS},tpad=stop_mode=clone:stop_duration=1,trim=end_frame={n},"
                  f"setpts=PTS-STARTPTS,scale={W}:{H}:flags=lanczos,setsar=1[v{i}]")
        parts.append(chain)
        labels.append(f"[v{i}]")
    grade = ("eq=contrast=1.08:saturation=1.18:gamma=0.97,"
             "colorbalance=rs=-0.04:gs=0.0:bs=0.07:rh=0.07:gh=0.02:bh=-0.05,"
             "unsharp=5:5:0.6")
    fc = ";".join(parts) + ";" + "".join(labels) + f"concat=n={len(SHOTS)}:v=1:a=0,{grade}[out]"
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", SRC, "-filter_complex", fc, "-map", "[out]",
           "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", path]
    subprocess.run(cmd, check=True)


# ---------------------------------------------------------------------------
# Stage 2: audio
rng = np.random.default_rng(7)


def tt(n):
    return np.arange(n) / SR


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be a scalar or a per-sample array (Hz)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1.0 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


class Bus:
    def __init__(self):
        self.buf = np.zeros(int(DUR * SR) + SR)

    def add(self, t0, sig, gain=1.0):
        i = int(t0 * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), len(self.buf) - i)
        self.buf[i:i + n] += gain * sig[:n]


def kick():
    t = tt(int(0.42 * SR))
    f = 48 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t / 0.16))


def bass808(freq, dur=0.48):
    t = tt(int(dur * SR))
    f = freq * (1 + 0.6 * np.exp(-t / 0.02))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.8 * np.sin(ph)) * np.exp(-t / 0.3) * 0.8


def cowbell(freq):
    t = tt(int(0.16 * SR))
    s = np.sign(np.sin(2 * np.pi * freq * t)) + np.sign(np.sin(2 * np.pi * freq * 1.48 * t))
    return highpass(lowpass(s, 4200), 500) * np.exp(-t / 0.05) * 0.35


def hat(open_=False):
    t = tt(int((0.12 if open_ else 0.04) * SR))
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t / (0.05 if open_ else 0.012)) * 0.5


def clap():
    t = tt(int(0.22 * SR))
    env = np.exp(-t / 0.07)
    for off in (0.0, 0.011, 0.022):
        env += (t >= off) * np.exp(-np.clip(t - off, 0, None) / 0.004)
    return highpass(lowpass(rng.standard_normal(len(t)), 5000), 900) * env * 0.4


def whoosh(dur, f0=300, f1=6000, gain=0.6):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    sig = lowpass(rng.standard_normal(n), f0 + (f1 - f0) * x ** 2)
    return highpass(sig, 150) * np.sin(np.pi * x) ** 1.5 * gain


def impact():
    t = tt(int(0.9 * SR))
    boom = np.sin(2 * np.pi * (42 + 40 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.35)
    crack = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.05)
    return np.tanh(1.5 * (boom + 0.5 * crack)) * 0.9


def bell_bong():
    """Big-Ben-like low E bell: inharmonic partials, long decay."""
    t = tt(int(3.0 * SR))
    f0 = 165.0
    sig = np.zeros_like(t)
    for ratio, amp, dec in ((0.5, 0.5, 2.5), (1.0, 1.0, 1.8), (1.19, 0.4, 1.2), (1.5, 0.35, 1.0),
                            (2.0, 0.5, 0.9), (2.74, 0.25, 0.6), (3.0, 0.2, 0.5), (4.2, 0.12, 0.35)):
        sig += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / dec)
    return sig * (1 - np.exp(-t / 0.004)) * 0.35


def chime(freqs=(1318.5, 1975.5), dur=0.5):
    t = tt(int(dur * SR))
    return sum(np.sin(2 * np.pi * f * t) for f in freqs) * np.exp(-t / 0.15) * 0.22


def click():
    t = tt(int(0.03 * SR))
    return highpass(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.004) * 0.6


def footstep():
    t = tt(int(0.12 * SR))
    return lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.025) * 0.9


def ambience(dur, cutoff, gain):
    n = int(dur * SR)
    x = np.cumsum(rng.standard_normal(n))
    x = highpass(x - x.mean(), 40)
    x = lowpass(x, cutoff)
    x /= np.max(np.abs(x)) + 1e-9
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.15 * SR))
    return x * fade * gain


def build_audio(path):
    music, sfx = Bus(), Bus()
    # HOOK 0-1.5: riser + an impact on each cut, kick on every beat
    n = int(1.5 * SR)
    x = np.linspace(0, 1, n)
    riser = lowpass(rng.standard_normal(n), 400 + 7000 * x ** 2) * x ** 2 * 0.35
    riser += np.sin(2 * np.pi * np.cumsum(220 + 660 * x ** 2) / SR) * x ** 3 * 0.12
    music.add(0, riser)
    for b in (0.0, 0.5, 1.0):
        music.add(b, kick(), 0.9)
        music.add(b, bass808(49.0, 0.4), 0.6)

    # MAIN GROOVE 1.5-12.0 (filtered break 9.0-10.0), outro groove 12.0-14.5
    cow_pattern = [784, 0, 698, 784, 0, 932, 784, 698, 784, 0, 698, 622, 0, 587, 622, 698]
    bass_notes = [49.0, 49.0, 58.3, 55.0]  # G1 G1 Bb1 A1, one per bar
    t = 1.5
    step = 0
    while t < 14.5 - 1e-6:
        bar = int((t - 1.5) // 2.0)
        beat_in_bar = int(round((t - 1.5) / BEAT)) % 4
        if step % 2 == 0:
            if beat_in_bar in (0, 2) or (beat_in_bar == 3 and bar % 2):
                music.add(t, kick(), 0.9)
                music.add(t, bass808(bass_notes[bar % 4]), 0.7)
            if beat_in_bar in (1, 3):
                music.add(t, clap(), 0.8)
        music.add(t, hat(open_=(step % 8 == 6)), 0.35 if step % 2 else 0.5)
        f = cow_pattern[step % 16]
        if f:
            music.add(t, cowbell(f), 0.8)
        t += BEAT / 4 * 2  # 8th notes for cowbell/hats
        step += 1

    # filtered break 9.0-10.0 for "No flashcards. No classroom."
    i0, i1 = int(9.0 * SR), int(10.0 * SR)
    seg = music.buf[i0:i1]
    music.buf[i0:i1] = lowpass(seg, np.linspace(1800, 350, len(seg))) * 0.8
    music.add(9.5, whoosh(0.5, 200, 7000, 0.4))  # reverse-swell into the re-drop
    # fade the bed out at the end
    i0 = int(14.2 * SR)
    music.buf[i0:] *= np.clip(1 - (np.arange(len(music.buf) - i0) / (0.8 * SR)), 0, 1)

    # SFX
    sfx.add(0.0, ambience(1.5, 500, 0.18))              # station hum / crowd wash
    sfx.add(0.0, impact(), 0.55)
    sfx.add(0.5, whoosh(0.35, 500, 9000, 0.5))           # escalator rush
    sfx.add(0.9, whoosh(0.9, 150, 3000, 0.9))            # train swish through the cut
    sfx.add(0.95, ambience(0.7, 120, 0.35))              # train rumble
    sfx.add(1.5, impact(), 0.8)                          # the drop
    sfx.add(1.5, bell_bong(), 0.75)                      # Big Ben bong
    sfx.add(1.5, ambience(10.5, 900, 0.07))              # city bed under the montage
    for k in range(4):                                   # explorer footsteps
        sfx.add(3.02 + k * 0.25, footstep(), 0.55)
    sfx.add(4.0, ambience(1.0, 450, 0.16))               # platform ambience under "Mind the gap"
    for c in CHIPS:
        sfx.add(c[0] - 0.08, whoosh(0.18, 1500, 9000, 0.25))
        sfx.add(c[0], chime(), 1.0)
    sfx.add(10.0, impact(), 0.75)                        # re-drop on "Just London."
    sfx.add(11.75, whoosh(0.5, 300, 8000, 0.6))          # into the end card
    sfx.add(12.0, impact(), 0.6)
    sfx.add(12.0, bell_bong(), 0.45)
    sfx.add(12.9, click(), 0.8)                          # button tap
    sfx.add(13.2, chime((1046.5, 1318.5, 1568.0), 0.8), 1.0)

    mix = music.buf * 0.75 + sfx.buf
    mix = mix[: int(DUR * SR)]
    mix = np.tanh(mix * 1.1)                             # soft clip / glue
    mix *= 10 ** (-3.8 / 20) / (np.max(np.abs(mix)) + 1e-9)  # ~-14 LUFS, true peak under -1 dBTP
    # slight stereo width: hats/ambience decorrelated via a 7 ms offset blend
    d = int(0.007 * SR)
    right = np.concatenate([mix[:d], 0.85 * mix[d:] + 0.15 * mix[:-d]])
    stereo = np.stack([mix, right], axis=1)
    pcm = (stereo * 32767).astype("<i2")
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------------------
# Stage 3: graphics
def font(path, size):
    return ImageFont.truetype(path, size)


def ease_out_cubic(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def ease_out_back(x, s=1.9):
    x = min(max(x, 0.0), 1.0)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def with_shadow(img, radius=14, offset=(0, 6), opacity=0.6, pad=40):
    """Return img on a padded canvas with a soft drop shadow."""
    w, h = img.size
    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    a = img.split()[3].point(lambda v: int(v * opacity))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 255))
    sh.putalpha(a)
    canvas.alpha_composite(sh, (pad + offset[0], pad + offset[1]))
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius))
    canvas.alpha_composite(img, (pad, pad))
    return canvas


def text_line(segments, size, fnt=F_BLACK, color=WHITE, shadow=True):
    """segments: list of (text, highlighted). Highlighted words sit on a yellow pill."""
    f = font(fnt, size)
    pad_x, pad_y = int(size * 0.22), int(size * 0.12)
    space = f.getlength(" ")
    widths = [f.getlength(s) + (2 * pad_x if hl else 0) for s, hl in segments]
    total = int(sum(widths) + space * (len(segments) - 1))
    asc, desc = f.getmetrics()
    h = asc + desc + 2 * pad_y
    img = Image.new("RGBA", (total + 4, h + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 0.0
    text_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(text_layer)
    for (s, hl), wdt in zip(segments, widths):
        if hl:
            d.rounded_rectangle([x, 2, x + wdt, h], radius=int(size * 0.2), fill=YELLOW + (255,))
            d.text((x + pad_x, pad_y), s, font=f, fill=INK)
        else:
            td.text((x, pad_y), s, font=f, fill=color)
        x += wdt + space
    if shadow:
        text_layer = with_shadow(text_layer, pad=0)
    img.alpha_composite(text_layer)
    return img


def rounded(size, radius, fill):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=fill)
    return img


def vocab_chip(term, meaning):
    w, h = 860, 210
    card = rounded((w, h), 36, (255, 255, 255, 246))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, 18, h - 1], radius=9, fill=RED + (255,))
    d.rectangle([9, 0, 18, h - 1], fill=RED + (255,))
    d.text((52, 30), "N E W   W O R D", font=font(F_SEMI, 24), fill=RED)
    d.text((50, 62), term, font=font(F_BLACK, 64), fill=INK)
    d.text((52, 148), meaning, font=font(F_MED, 34), fill=(85, 85, 85))
    # +1 badge
    b = 92
    badge = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    bd.ellipse([0, 0, b - 1, b - 1], fill=YELLOW + (255,))
    f = font(F_BLACK, 38)
    tw = f.getlength("+1")
    bd.text(((b - tw) / 2, 20), "+1", font=f, fill=INK)
    canvas = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    canvas.alpha_composite(card, (0, 40))
    canvas.alpha_composite(badge, (w + 40 - b - 4, 0))
    return with_shadow(canvas, radius=18, offset=(0, 10), opacity=0.45)


def counter_pill(n):
    f = font(F_BOLD, 32)
    label = f"WORDS LEARNED  {n}"
    w = int(f.getlength(label)) + 64
    img = rounded((w, 64), 32, (11, 31, 75, 215))
    d = ImageDraw.Draw(img)
    d.ellipse([22, 25, 36, 39], fill=YELLOW)
    d.text((48, 13), label, font=f, fill=WHITE)
    return with_shadow(img, radius=10, offset=(0, 4), opacity=0.4, pad=20)


def app_icon(size=230):
    grad = Image.new("RGBA", (size, size))
    gp = grad.load()
    for y in range(size):
        for x in range(size):
            k = (x + y) / (2 * size)
            gp[x, y] = tuple(int(NAVY[i] * (1 - k) + RED[i] * k) for i in range(3)) + (255,)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.23), fill=255)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(icon)
    # speech bubble with "Aa"
    m = int(size * 0.18)
    d.rounded_rectangle([m, m, size - m, size - int(size * 0.3)], radius=int(size * 0.12), fill=WHITE)
    d.polygon([(m + 30, size - int(size * 0.31)), (m + 30, size - m + 4), (m + 75, size - int(size * 0.31))], fill=WHITE)
    f = font(F_BLACK, int(size * 0.3))
    tw = f.getlength("Aa")
    d.text(((size - tw) / 2, m + int(size * 0.07)), "Aa", font=f, fill=NAVY)
    d.ellipse([size - m - 26, m - 14, size - m + 12, m + 24], fill=YELLOW)
    return with_shadow(icon, radius=20, offset=(0, 12), opacity=0.5)


def store_badge(small, big):
    """Text-only placeholder: swap for the official Apple / Google badge artwork before launch."""
    w, h = 400, 120
    img = rounded((w, h), 24, (0, 0, 0, 235))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([1, 1, w - 2, h - 2], radius=24, outline=(170, 170, 170, 255), width=3)
    fs, fb = font(F_MED, 24), font(F_BOLD, 46)
    d.text(((w - fs.getlength(small)) / 2, 18), small, font=fs, fill=WHITE)
    d.text(((w - fb.getlength(big)) / 2, 46), big, font=fb, fill=WHITE)
    return img


def cta_button(label):
    w, h = 760, 132
    img = rounded((w, h), 66, YELLOW + (255,))
    d = ImageDraw.Draw(img)
    f = font(F_BLACK, 50)
    tw = f.getlength(label)
    d.text(((w - tw) / 2, 34), label, font=f, fill=INK)
    return with_shadow(img, radius=22, offset=(0, 10), opacity=0.5)


class El:
    """An animated overlay: in/out times, centre position, entry/exit styles."""

    def __init__(self, img, cx, cy, t_in, t_out, enter="slideup", exit="fade", dur_in=0.28, pulse=False):
        self.img, self.cx, self.cy = img, cx, cy
        self.t_in, self.t_out, self.enter, self.exit = t_in, t_out, enter, exit
        self.dur_in, self.pulse = dur_in, pulse

    def draw(self, frame, t):
        if not (self.t_in <= t < self.t_out):
            return
        p = (t - self.t_in) / self.dur_in
        alpha, scale, dy = 1.0, 1.0, 0.0
        if self.enter == "slideup":
            e = ease_out_cubic(p)
            alpha, dy = min(1, p * 2.5), (1 - e) * 70
        elif self.enter == "pop":
            alpha, scale = min(1, p * 4), 0.55 + 0.45 * ease_out_back(p)
        elif self.enter == "slam":
            e = ease_out_cubic(p)
            alpha, scale = min(1, p * 4), 1.6 - 0.6 * e
        elif self.enter == "cut":
            pass
        q = (self.t_out - t) / 0.14
        if self.exit == "fade" and q < 1:
            alpha *= max(q, 0)
            dy -= (1 - q) * 30
        if self.pulse and p >= 1:
            scale *= 1 + 0.035 * math.sin((t - self.t_in) * 2 * math.pi / BEAT)
        img = self.img
        if abs(scale - 1) > 1e-3:
            img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BICUBIC)
        if alpha < 0.999:
            img = img.copy()
            img.putalpha(img.split()[3].point(lambda v: int(v * alpha)))
        frame.alpha_composite(img, (int(self.cx - img.width / 2), int(self.cy - img.height / 2 + dy)))


class Typewriter:
    def __init__(self, text, size, cx, cy, t_in, t_out, cps=22):
        self.text, self.size, self.cx, self.cy = text, size, cx, cy
        self.t_in, self.t_out, self.cps = t_in, t_out, cps
        self.cache = {}
        self.full_w = text_line([(text, False)], size).width

    def draw(self, frame, t):
        if not (self.t_in <= t < self.t_out):
            return
        n = min(len(self.text), int((t - self.t_in) * self.cps) + 1)
        cursor = "|" if (n < len(self.text) or int(t * 4) % 2 == 0) else " "
        key = (n, cursor)
        if key not in self.cache:
            self.cache[key] = text_line([(self.text[:n] + cursor, False)], self.size)
        img = self.cache[key]
        frame.alpha_composite(img, (int(self.cx - self.full_w / 2), int(self.cy - img.height / 2)))


# chip pop time, term, meaning (each spans two montage shots)
CHIPS = [
    (4.0, "Mind the gap", "= be careful stepping onto the train"),
    (5.0, "Innit?", "= isn't it? (casual London English)"),
    (6.0, "Cheers, mate!", "= thanks, friend"),
    (7.0, "Double-decker", "= a bus with two floors"),
    (8.0, "Fancy a walk?", "= would you like to go for a walk?"),
]


def build_overlays(app_name):
    cx = W // 2
    els = []
    # HOOK: word-by-word on the beat
    els += [
        El(text_line([("POV:", False)], 84), cx, 610, 0.05, 1.47, "pop", "fade", 0.2),
        El(text_line([("you're exploring", False)], 84), cx, 715, 0.30, 1.47, "pop", "fade", 0.2),
        El(text_line([("LONDON", True)], 150), cx, 870, 0.55, 1.47, "slam", "fade", 0.22),
    ]
    # BRIDGE: exploring -> learning
    els += [
        El(text_line([("and every street", False)], 80), cx, 640, 1.55, 2.97),
        El(text_line([("teaches you", False), ("English", True)], 80), cx, 750, 1.75, 2.97),
        Typewriter("Just look around.", 76, cx, 700, 3.05, 3.97),
    ]
    # VOCAB MONTAGE chips + counter
    for k, (t0, term, meaning) in enumerate(CHIPS):
        els.append(El(vocab_chip(term, meaning), cx, 1230, t0, t0 + 0.97, "pop", "fade", 0.25))
    counters = [counter_pill(n) for n in range(0, 6)]

    class Counter:
        def draw(self, frame, t):
            if not (4.0 <= t < 11.97):
                return
            n = sum(1 for c in CHIPS if t >= c[0])
            img = counters[n]
            since = t - max(c[0] for c in CHIPS if t >= c[0])
            s = 1 + 0.18 * math.exp(-since / 0.08) if since < 0.4 else 1.0
            a = min(1, (t - 4.0) / 0.15)
            if s != 1:
                img = img.resize((int(img.width * s), int(img.height * s)), Image.BICUBIC)
            if a < 1:
                img = img.copy()
                img.putalpha(img.split()[3].point(lambda v: int(v * a)))
            frame.alpha_composite(img, (int(cx - img.width / 2), int(260 - img.height / 2)))

    els.append(Counter())
    # PAYOFF
    els += [
        El(text_line([("No flashcards.", False)], 84), cx, 660, 9.0, 9.97, "slideup", "fade", 0.22),
        El(text_line([("No classroom.", False)], 84), cx, 770, 9.5, 9.97, "slideup", "fade", 0.22),
        El(text_line([("Just", False)], 110), cx, 670, 10.0, 11.85, "slam", "fade", 0.2),
        El(text_line([("London.", True)], 150), cx, 860, 10.0, 11.85, "slam", "fade", 0.2),
    ]
    # CTA end card (12.0-15.0)
    els += [
        El(app_icon(), cx, 470, 12.1, 99, "pop", None, 0.3),
        El(text_line([(app_name, False)], 62, F_BOLD), cx, 650, 12.25, 99, "slideup", None),
        El(text_line([("Explore London.", False)], 96), cx, 790, 12.35, 99, "slideup", None),
        El(text_line([("Speak", False), ("English.", True)], 96), cx, 905, 12.5, 99, "slideup", None),
        El(text_line([("Real places. Real conversations.", False)], 42, F_SEMI, (235, 235, 235)), cx, 1020,
           12.65, 99, "slideup", None),
        El(cta_button("Start learning free  →"), cx, 1190, 12.9, 99, "pop", None, 0.3, pulse=True),
        El(store_badge("Download on the", "App Store"), cx - 215, 1360, 13.2, 99, "slideup", None),
        El(store_badge("GET IT ON", "Google Play"), cx + 215, 1360, 13.3, 99, "slideup", None),
    ]
    return els


def make_vignette():
    y, x = np.mgrid[0:H, 0:W]
    r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
    return (1 - 0.45 * np.clip(r - 0.35, 0, 1) ** 1.4 / 0.65 ** 1.4)[..., None].astype(np.float32)


def shot_at(t):
    for i in range(len(SHOTS) - 1, -1, -1):
        if t >= STARTS[i] - 1e-9:
            return i, t - STARTS[i]
    return 0, t


def zoom_for(i, lt):
    motion, d = SHOTS[i][4], SHOTS[i][2]
    if motion == "punch":
        return 1.0 + 0.14 * (1 - ease_out_cubic(lt / 0.3))
    if motion == "snap":
        return 1.0 + 0.06 * (1 - ease_out_cubic(lt / 0.25))
    if motion == "push":
        return 1.0 + 0.08 * (lt / d)
    if motion == "shake":
        return 1.06
    return 1.0


FLASHES = [0.5, 1.0, 1.5, 10.0, 12.0]


def render(app_name, preview_frames=False):
    base = os.path.join(BUILD, "base.mp4")
    mix = os.path.join(BUILD, "mix.wav")
    out = os.path.join(OUT, "london-english-ad.mp4")
    els = build_overlays(app_name)
    vig = make_vignette()
    reader = subprocess.Popen(["ffmpeg", "-v", "error", "-i", base, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                              stdout=subprocess.PIPE)
    writer = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
         "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
         "-shortest", out], stdin=subprocess.PIPE)
    shake = np.random.default_rng(3)
    previews = {int(s * FPS) for s in (0.7, 2.4, 3.6, 4.4, 6.3, 9.7, 10.6, 14.0)}
    for fi in range(NFRAMES):
        raw = reader.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:
            raise SystemExit(f"base video ended early at frame {fi}")
        t = fi / FPS
        i, lt = shot_at(t)
        arr = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        img = Image.fromarray(arr)
        z = zoom_for(i, lt)
        if z > 1.001:
            cw, ch = W / z, H / z
            ox = oy = 0.0
            if SHOTS[i][4] == "shake":
                ox, oy = shake.normal(0, 7, 2)
            l, tp = (W - cw) / 2 + ox, (H - ch) / 2 + oy
            img = img.resize((W, H), Image.BICUBIC, box=(l, tp, l + cw, tp + ch))
        f = np.asarray(img).astype(np.float32) * vig
        if t >= 12.0:  # end card: darken for legibility
            k = ease_out_cubic((t - 12.0) / 0.4)
            grad = np.linspace(0.62, 0.38, H, dtype=np.float32)[:, None, None]
            f = f * (1 - k * (1 - grad))
        if 11.85 <= t < 12.0:  # dip toward the end card
            f *= 1 - 0.7 * (t - 11.85) / 0.15
        for fl in FLASHES:
            if 0 <= t - fl < 0.1:
                a = 0.55 * (1 - (t - fl) / 0.1)
                f = f * (1 - a) + 255 * a
        frame = Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).convert("RGBA")
        if t >= 12.0:
            r = 10 * ease_out_cubic((t - 12.0) / 0.4)
            frame = frame.filter(ImageFilter.GaussianBlur(r))
        for el in els:
            el.draw(frame, t)
        rgb = frame.convert("RGB")
        if preview_frames and fi in previews:
            rgb.save(os.path.join(BUILD, f"frame_{t:05.2f}.png"))
        writer.stdin.write(rgb.tobytes())
    writer.stdin.close()
    writer.wait()
    reader.wait()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-name", default="WanderEnglish")
    ap.add_argument("--preview-frames", action="store_true")
    ap.add_argument("--skip-base", action="store_true")
    args = ap.parse_args()
    os.makedirs(BUILD, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    if not args.skip_base:
        print("stage 1: base cut", file=sys.stderr)
        build_base(os.path.join(BUILD, "base.mp4"))
    print("stage 2: audio", file=sys.stderr)
    build_audio(os.path.join(BUILD, "mix.wav"))
    print("stage 3: graphics + encode", file=sys.stderr)
    print(render(args.app_name, args.preview_frames))


if __name__ == "__main__":
    main()
