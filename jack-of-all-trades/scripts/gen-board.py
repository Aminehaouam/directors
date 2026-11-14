#!/usr/bin/env python3
"""Writes compositions/board.html (tool layout, sign, tape, timeline). Overwrites hand edits to that file.
Usage: python3 scripts/gen-board.py compositions/board.html"""
import json, sys, pathlib

OUT = pathlib.Path(sys.argv[1])

# ---------- tool drawings (symbol id -> (viewBox w, h, svg body)) ----------
def saw_blade():
    # top edge (118,34)->(432,72); toothed bottom edge (432,108)->(118,142)
    pts = ["118,34", "432,72", "432,108"]
    n = 36
    x0, y0, x1, y1 = 432, 108, 118, 142
    for i in range(n):
        a = i / n
        b = (i + 0.5) / n
        c = (i + 1) / n
        xb, yb = x0 + (x1 - x0) * b, y0 + (y1 - y0) * b
        xc, yc = x0 + (x1 - x0) * c, y0 + (y1 - y0) * c
        pts.append(f"{xb:.1f},{yb + 9:.1f}")
        pts.append(f"{xc:.1f},{yc:.1f}")
    return " ".join(pts)

def wires():
    out = []
    for w, col in [(58, "#9AA2A8"), (44, "#C9CFD3"), (28, "#B3BAC0"), (12, "#DDE2E6")]:
        out.append(
            f'<path d="M70 184 C{70-w} 244 {64-w} 368 70 392 C{76+w} 368 {70+w} 244 70 184" '
            f'fill="none" stroke="{col}" stroke-width="4.5"/>'
        )
    return "".join(out)

SYMBOLS = {
"hammer": (220, 360, """
  <rect x="94" y="70" width="32" height="190" rx="12" fill="url(#g-wood)"/>
  <path d="M100 110 Q106 160 101 230 M118 100 Q114 170 119 240" stroke="#7A4520" stroke-width="2" fill="none" opacity=".45"/>
  <rect x="88" y="226" width="44" height="128" rx="19" fill="url(#g-rubber)"/>
  <g stroke="#0d0b0a" stroke-width="3" opacity=".55"><path d="M92 252h36M92 272h36M92 292h36M92 312h36"/></g>
  <rect x="14" y="27" width="30" height="60" rx="7" fill="url(#g-steel-v)"/>
  <rect x="40" y="38" width="28" height="38" fill="url(#g-steel-v)"/>
  <rect x="64" y="25" width="74" height="64" rx="8" fill="url(#g-steel-v)"/>
  <path d="M132 27 C170 27 198 46 212 84 L198 92 C184 72 164 66 136 88 Z" fill="url(#g-steel-v)"/>
  <rect x="96" y="22" width="28" height="7" rx="2" fill="#B9773E"/>
  <path d="M18 31 H136 C166 31 190 46 204 74" stroke="#fff" stroke-width="3" fill="none" opacity=".45"/>
"""),
"wrench": (120, 380, """
  <defs><mask id="m-wrench" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="380">
    <rect width="120" height="380" fill="#fff"/>
    <rect x="47" y="330" width="26" height="80" fill="#000" transform="rotate(18 60 338)"/>
  </mask></defs>
  <path fill-rule="evenodd" fill="url(#g-steel)" d="M20 46 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 Z M42 46 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z"/>
  <path d="M43 78 L77 78 L73 304 L47 304 Z" fill="url(#g-steel)"/>
  <rect x="55" y="104" width="10" height="176" rx="5" fill="#7d858c" opacity=".55"/>
  <circle cx="60" cy="338" r="42" fill="url(#g-steel)" mask="url(#m-wrench)"/>
  <text x="60" y="200" font-family="Oswald" font-size="13" fill="#5f676d" text-anchor="middle" transform="rotate(90 60 200)" letter-spacing="2">19 MM</text>
"""),
"brush": (100, 400, """
  <path fill-rule="evenodd" fill="url(#g-red)" d="M42 14 C46 9 54 9 58 14 L64 150 C68 190 70 212 70 228 L30 228 C30 212 32 190 36 150 Z M43 36 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"/>
  <rect x="26" y="224" width="48" height="66" rx="4" fill="url(#g-steel)"/>
  <path d="M26 242h48M26 250h48" stroke="#6e767d" stroke-width="2"/>
  <path d="M28 288 L72 288 C76 330 74 360 66 392 L34 392 C26 360 24 330 28 288 Z" fill="#5A3B22"/>
  <path d="M27 338 L73 338 C74 362 70 380 66 392 L34 392 C30 380 26 362 27 338 Z" fill="#F2B705"/>
  <path d="M27 338 C40 346 60 330 73 340" stroke="#C99400" stroke-width="3" fill="none"/>
"""),
"whisk": (140, 400, """
  <circle cx="70" cy="24" r="13" fill="none" stroke="url(#g-steel)" stroke-width="6"/>
  """ + wires() + """
  <rect x="56" y="34" width="28" height="142" rx="13" fill="url(#g-steel)"/>
  <rect x="52" y="170" width="36" height="16" rx="5" fill="url(#g-steel)"/>
"""),
"scissors": (170, 340, """
  <path d="M70 118 L96 126 L90 332 Z" fill="url(#g-steel)"/>
  <path d="M100 118 L74 126 L82 332 Z" fill="#8e969c"/>
  <path fill-rule="evenodd" fill="url(#g-red)" d="M10 64 a40 48 0 1 0 80 0 a40 48 0 1 0 -80 0 Z M25 64 a25 33 0 1 0 50 0 a25 33 0 1 0 -50 0 Z"/>
  <path fill-rule="evenodd" fill="url(#g-red)" d="M80 64 a40 48 0 1 0 80 0 a40 48 0 1 0 -80 0 Z M95 64 a25 33 0 1 0 50 0 a25 33 0 1 0 -50 0 Z"/>
  <path d="M62 104 L80 104 L92 132 L76 132 Z M108 104 L90 104 L78 132 L94 132 Z" fill="url(#g-red)"/>
  <circle cx="85" cy="142" r="8" fill="#5d656b"/><circle cx="83" cy="140" r="3" fill="#dde2e6"/>
"""),
"saw": (440, 170, """
  <polygon points=\"""" + saw_blade() + """\" fill="url(#g-steel-v)"/>
  <path d="M130 46 L420 80" stroke="#fff" stroke-width="5" opacity=".35"/>
  <path fill-rule="evenodd" fill="url(#g-wood-v)" d="M18 30 C18 14 34 8 52 8 L120 24 L126 150 L60 162 C30 166 12 150 12 130 Z M40 54 C40 44 48 38 60 38 L92 42 C100 44 104 52 104 62 L102 110 C102 120 96 126 86 126 L58 128 C48 128 40 122 40 112 Z"/>
  <circle cx="112" cy="62" r="6" fill="#C9A64B"/><circle cx="112" cy="112" r="6" fill="#C9A64B"/>
"""),
"tapemeasure": (200, 200, """
  <rect x="70" y="6" width="60" height="30" rx="6" fill="url(#g-steel)"/>
  <rect x="20" y="24" width="160" height="156" rx="46" fill="url(#g-yellow-v)"/>
  <rect x="122" y="16" width="38" height="16" rx="5" fill="#26221F"/>
  <circle cx="100" cy="102" r="56" fill="#26221F"/>
  <circle cx="100" cy="102" r="40" fill="#3a3532"/>
  <circle cx="100" cy="102" r="9" fill="url(#g-steel)"/>
  <rect x="26" y="158" width="58" height="18" fill="#F2C230"/>
  <path d="M34 158v8M42 158v5M50 158v8M58 158v5M66 158v8M74 158v5" stroke="#1d1a17" stroke-width="2"/>
  <rect x="18" y="152" width="9" height="30" rx="2" fill="url(#g-steel)"/>
"""),
"roller": (220, 360, """
  <path d="M160 160 L160 206 Q160 224 142 224 L46 224 Q30 224 30 240 L30 262" fill="none" stroke="url(#g-steel)" stroke-width="9" stroke-linecap="round"/>
  <path fill-rule="evenodd" fill="url(#g-rubber)" d="M144 28 C144 12 176 12 176 28 L176 156 C176 168 144 168 144 156 Z M153 32 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"/>
  <rect x="144" y="124" width="32" height="10" fill="#F2B705"/>
  <rect x="18" y="256" width="192" height="84" rx="28" fill="url(#g-yellow-v)"/>
  <path d="M40 270v10M60 296v12M86 266v9M110 304v10M136 276v12M160 300v9M184 270v10" stroke="#C99400" stroke-width="3" stroke-linecap="round"/>
  <rect x="10" y="270" width="14" height="56" rx="5" fill="url(#g-steel)"/>
"""),
"screwdriver": (90, 400, """
  <rect x="40" y="182" width="10" height="196" fill="url(#g-steel)"/>
  <path d="M38 374 L52 374 L49 396 L41 396 Z" fill="url(#g-steel)"/>
  <rect x="33" y="168" width="24" height="18" rx="3" fill="#6e767d"/>
  <path fill-rule="evenodd" fill="url(#g-red)" d="M20 30 C20 12 70 12 70 30 L72 140 C72 158 62 168 56 172 L34 172 C28 168 18 158 18 140 Z M38 32 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"/>
  <path d="M32 52v100M45 52v104M58 52v100" stroke="#fff" stroke-width="3" opacity=".25"/>
"""),
"spatula": (140, 400, """
  <path d="M62 184 L78 184 L76 238 L64 238 Z" fill="url(#g-steel)"/>
  <path fill-rule="evenodd" fill="url(#g-steel)" d="M30 236 L110 236 C116 236 120 240 120 248 L124 380 C124 388 118 392 110 392 L30 392 C22 392 16 388 16 380 L20 248 C20 240 24 236 30 236 Z
    M36 264 h9 v104 h-9 Z M56 264 h9 v104 h-9 Z M76 264 h9 v104 h-9 Z M96 264 h9 v104 h-9 Z"/>
  <path fill-rule="evenodd" fill="url(#g-wood)" d="M54 16 C54 6 86 6 86 16 L84 182 C84 192 56 192 56 182 Z M63 32 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"/>
  <circle cx="70" cy="110" r="4" fill="#C9A64B"/><circle cx="70" cy="150" r="4" fill="#C9A64B"/>
"""),
"pliers": (170, 360, """
  <path d="M78 160 L70 100 C68 70 74 40 84 18 L91 20 C87 50 88 100 91 152 Z" fill="url(#g-steel)"/>
  <path d="M92 160 L100 100 C102 70 96 40 86 18 L79 20 C83 50 82 100 79 152 Z" fill="#8e969c"/>
  <path d="M83 40l6 2M82 56l7 2M82 72l7 2M82 88l7 2" stroke="#4d555b" stroke-width="2"/>
  <path d="M76 166 C66 220 44 290 30 346 C28 354 40 358 44 350 C62 296 80 230 88 170 Z" fill="url(#g-red)"/>
  <path d="M94 166 C104 220 126 290 140 346 C142 354 130 358 126 350 C108 296 90 230 82 170 Z" fill="url(#g-red)"/>
  <circle cx="85" cy="150" r="15" fill="url(#g-steel)"/><circle cx="85" cy="150" r="6" fill="#5d656b"/>
"""),
"level": (520, 80, """
  <rect x="6" y="6" width="508" height="66" rx="6" fill="url(#g-yellow-v)"/>
  <rect x="6" y="36" width="508" height="3" fill="#C99400" opacity=".6"/>
  <rect x="0" y="4" width="28" height="72" rx="6" fill="#26221F"/>
  <rect x="492" y="4" width="28" height="72" rx="6" fill="#26221F"/>
  <rect x="218" y="16" width="84" height="46" rx="8" fill="#26221F"/>
  <rect x="226" y="25" width="68" height="28" rx="14" fill="#9BD16A"/>
  <ellipse cx="262" cy="36" rx="11" ry="7" fill="#EAF8DC"/>
  <path d="M246 25v28M278 25v28" stroke="#1d1a17" stroke-width="2"/>
  <circle cx="96" cy="39" r="22" fill="#26221F"/><circle cx="96" cy="39" r="14" fill="#9BD16A"/><circle cx="92" cy="35" r="5" fill="#EAF8DC"/>
  <circle cx="424" cy="39" r="22" fill="#26221F"/><circle cx="424" cy="39" r="14" fill="#9BD16A"/><circle cx="428" cy="35" r="5" fill="#EAF8DC"/>
  <path d="M140 66v-10M160 66v-6M180 66v-10M340 66v-10M360 66v-6M380 66v-10" stroke="#1d1a17" stroke-width="2" opacity=".7"/>
"""),
"trowel": (160, 400, """
  <path d="M80 186 L148 236 L80 394 L12 236 Z" fill="url(#g-steel)"/>
  <path d="M80 200 L80 300" stroke="#fff" stroke-width="4" opacity=".4"/>
  <path d="M74 156 L86 156 L86 200 L74 200 Z" fill="#6e767d"/>
  <rect x="60" y="142" width="40" height="18" rx="3" fill="#C9A64B"/>
  <path fill-rule="evenodd" fill="url(#g-wood)" d="M62 16 C62 6 98 6 98 16 L100 140 C100 150 60 150 60 140 Z M73 30 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"/>
"""),
"stethoscope": (200, 320, """
  <path d="M60 26 C60 74 80 112 100 132 M140 26 C140 74 120 112 100 132" fill="none" stroke="url(#g-steel)" stroke-width="7" stroke-linecap="round"/>
  <path d="M66 66 H134" stroke="#9aa2a8" stroke-width="5" stroke-linecap="round"/>
  <circle cx="60" cy="20" r="10" fill="#26221F"/><circle cx="140" cy="20" r="10" fill="#26221F"/>
  <path d="M100 130 C100 200 36 214 44 262 C52 304 112 300 120 270" fill="none" stroke="#2B2623" stroke-width="13" stroke-linecap="round"/>
  <circle cx="140" cy="270" r="32" fill="url(#g-steel)"/>
  <circle cx="140" cy="270" r="23" fill="#DDE2E6"/><circle cx="140" cy="270" r="23" fill="none" stroke="#8e969c" stroke-width="3"/>
"""),
"ladle": (160, 400, """
  <path d="M20 296 C20 386 140 386 140 296 Z" fill="url(#g-steel)"/>
  <ellipse cx="80" cy="296" rx="60" ry="13" fill="#6e767d"/>
  <ellipse cx="80" cy="299" rx="52" ry="8" fill="#4d555b"/>
  <path fill-rule="evenodd" fill="url(#g-steel)" d="M68 22 C68 4 92 4 92 22 L87 288 L73 288 Z M74 22 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z"/>
"""),
}

# ---------- placement ----------
# id, symbol, hook board (x,y), hook local (x,y), scale, landing order, swing amp (deg), kind
TOOLS = [
    ("saw",         (120, 120),  (66, 42),   1.00, 4,  4.0, "hang"),
    ("hammer",      (648, 120),  (110, 96),  0.85, 0,  6.0, "hang"),
    ("wrench",      (792, 72),   (60, 46),   0.80, 2, -7.0, "hang"),
    ("brush",       (936, 72),   (50, 36),   0.78, 6,  7.0, "hang"),
    ("whisk",       (1080, 72),  (70, 24),   0.76, 3, -6.0, "hang"),
    ("scissors",    (1224, 72),  (50, 34),   0.86, 8,  6.0, "hang"),
    ("tapemeasure", (1416, 120), (100, 20),  0.95, 10, -6.0, "hang"),
    ("roller",      (1704, 72),  (160, 30),  0.86, 12,  5.0, "hang"),
    ("screwdriver", (168, 408),  (45, 30),   0.80, 9, -7.0, "hang"),
    ("spatula",     (1752, 408), (70, 30),   0.80, 7,  6.0, "hang"),
    ("pliers",      (216, 840),  (85, 178),  0.80, 5, -5.0, "hang"),
    ("level",       (768, 888),  (260, 81),  1.00, 1,  1.5, "rest"),
    ("trowel",      (1224, 792), (80, 30),   0.66, 13, 6.0, "hang"),
    ("stethoscope", (1464, 840), (100, 66),  0.80, 14, -5.0, "hang"),
    ("ladle",       (1752, 744), (80, 22),   0.70, 11, 6.0, "hang"),
]
LEVEL_PEGS = [(600, 888), (936, 888)]
SIGN = dict(x=400, y=384, w=1120, h=316, pegs=[(552, 408), (1368, 408)])

FPS = 30
def frame(t):
    return round(t * FPS) / FPS

land = []
t, iv = 0.22, 0.19
for i in range(len(TOOLS)):
    land.append(frame(t))
    t += iv
    iv *= 0.905

tool_html, peg_html, tl_data = [], [], []
for (tid, (bx, by), (hx, hy), s, order, amp, kind) in TOOLS:
    vw, vh, _ = SYMBOLS[tid]
    w, h = vw * s, vh * s
    left, top = bx - hx * s, by - hy * s
    ox, oy = hx * s, hy * s
    tool_html.append(f"""
    <div class="tool" id="board-{tid}" style="left:{left:.1f}px;top:{top:.1f}px;width:{w:.1f}px;height:{h:.1f}px">
      <svg class="sil" viewBox="0 0 {vw} {vh}" width="{w:.1f}" height="{h:.1f}"><use href="#s-{tid}" filter="url(#f-sil)"/></svg>
      <div class="kick" id="board-{tid}-kick">
        <div class="body" id="board-{tid}-body">
          <svg class="art" viewBox="0 0 {vw} {vh}" width="{w:.1f}" height="{h:.1f}"><use href="#s-{tid}"/></svg>
        </div>
      </div>
    </div>""")
    if kind == "hang":
        peg_html.append(f'<div class="peg" style="left:{bx}px;top:{by}px"></div>')
    # impact kick: tools swing away from the sign's centre
    kick = 2.6 if bx > 960 else -2.6
    dist = ((bx - 960) ** 2 + (by - 540) ** 2) ** 0.5
    tl_data.append(dict(id=tid, land=land[order], amp=amp, kind=kind,
                        ox=round(ox, 1), oy=round(oy, 1), kick=kick,
                        kickDelay=round(dist / 9000, 3)))
for (px, py) in LEVEL_PEGS:
    peg_html.append(f'<div class="peg" style="left:{px}px;top:{py}px"></div>')
sign_pegs = "".join(f'<div class="peg peg-sign" style="left:{px}px;top:{py}px"></div>' for px, py in SIGN["pegs"])

symbols = "".join(f'<symbol id="s-{k}" viewBox="0 0 {v[0]} {v[1]}">{v[2]}</symbol>' for k, v in SYMBOLS.items())

T_SIGN = frame(max(land) + 0.3)   # sign lands
T_TAPE = frame(T_SIGN + 0.55)
T_STRIKE = frame(T_TAPE + 0.55)
T_WRITE = frame(T_STRIKE + 0.18)

timing = dict(land=sorted(land), sign=T_SIGN, tape=T_TAPE, strike=T_STRIKE, write=T_WRITE)
print(json.dumps(timing))

html = f"""<template id="board-template">
  <style>
    @font-face {{
      font-family: "Permanent Marker";
      src: url("assets/fonts/PermanentMarker-Regular.woff2") format("woff2");
      font-weight: 400;
    }}
    #root {{
      position: absolute;
      inset: 0;
      overflow: hidden;
      --board: #c69c6d;
      --hole: #24170d;
      --ink: #1d1a17;
      --sign: #f2b705;
      --marker-red: #c8312b;
      --tape: #e9dcb6;
      background: var(--board);
    }}
    #board-cam {{ position: absolute; inset: -40px; }}
    #board-ground {{
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 24px 24px, var(--hole) 0 6.5px, rgba(36, 23, 13, 0) 7.6px) 16px 16px / 48px 48px,
        radial-gradient(circle at 24px 26.5px, rgba(255, 236, 205, 0.5) 0 7px, rgba(255, 236, 205, 0) 8.6px) 16px 16px / 48px 48px,
        linear-gradient(135deg, rgba(255, 240, 220, 0.12), rgba(255, 240, 220, 0) 40%, rgba(40, 20, 0, 0.18)),
        var(--board);
    }}
    #board-grain {{ position: absolute; inset: 0; opacity: 0.22; mix-blend-mode: multiply; }}
    #board-stage {{ position: absolute; left: 40px; top: 40px; width: 1920px; height: 1080px; }}
    .tool {{ position: absolute; }}
    .tool svg {{ position: absolute; left: 0; top: 0; overflow: visible; }}
    .tool .sil {{ opacity: 0.9; }}
    .kick, .body {{ position: absolute; inset: 0; }}
    .art {{ filter: drop-shadow(4px 9px 5px rgba(45, 25, 8, 0.5)); }}
    .peg {{
      position: absolute;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 32%, #f4f6f7 0 2px, #b9c0c5 3px, #6a7279 7px);
      box-shadow: 2px 4px 3px rgba(45, 25, 8, 0.45);
      z-index: 5;
    }}
    #board-sign {{ position: absolute; left: {SIGN['x']}px; top: {SIGN['y']}px; width: {SIGN['w']}px; height: {SIGN['h']}px; z-index: 6; }}
    #board-sign-body {{ position: absolute; inset: 0; }}
    .plank {{
      position: absolute;
      inset: 0;
      border-radius: 10px;
      background:
        repeating-linear-gradient(178.6deg, rgba(150, 95, 0, 0) 0 19px, rgba(150, 95, 0, 0.13) 20px 21px, rgba(150, 95, 0, 0) 22px 37px),
        linear-gradient(180deg, #ffcd2e, #f2b705 55%, #dda400);
      box-shadow: 10px 20px 16px rgba(45, 25, 8, 0.45), inset 0 0 0 6px rgba(120, 75, 0, 0.25);
    }}
    .plank::after {{
      content: "";
      position: absolute;
      inset: 18px;
      border: 5px solid var(--ink);
      border-radius: 6px;
    }}
    .grommet {{
      position: absolute;
      width: 30px;
      height: 30px;
      margin: -15px 0 0 -15px;
      border-radius: 50%;
      background: radial-gradient(circle, #3b2a1c 0 7px, #c9cfd3 8px 11px, #7d858c 14px);
      top: 24px;
    }}
    #board-title {{
      position: absolute;
      inset: 28px 30px 46px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: "Archivo Black", sans-serif;
      color: var(--ink);
      text-align: center;
      line-height: 0.98;
    }}
    #board-line1 {{ font-size: 112px; letter-spacing: 0.02em; }}
    #board-line2 {{ font-size: 132px; letter-spacing: 0.005em; }}
    .peg-sign {{ z-index: 7; }}
    #board-tape {{ position: absolute; left: 830px; top: 648px; width: 860px; height: 108px; z-index: 8; }}
    #board-tape-body {{
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(90deg, rgba(120, 100, 60, 0) 0 5px, rgba(120, 100, 60, 0.07) 6px 7px),
        linear-gradient(180deg, #efe4c2, var(--tape) 60%, #dccd9f);
      clip-path: polygon(0% 6%, 1.2% 22%, 0.2% 38%, 1.4% 55%, 0% 72%, 1.1% 88%, 0.3% 100%, 99.4% 96%, 98.6% 80%, 100% 64%, 98.8% 46%, 99.8% 30%, 98.7% 14%, 100% 0%);
      filter: drop-shadow(2px 3px 2px rgba(45, 25, 8, 0.3));
      display: flex;
      align-items: center;
      padding-left: 34px;
      font-family: "Permanent Marker", cursive;
      font-size: 62px;
      color: var(--ink);
      white-space: nowrap;
    }}
    #board-none {{ position: relative; display: inline-block; margin: 0 22px 0 20px; }}
    #board-strike {{ position: absolute; left: -10px; top: 2px; width: calc(100% + 20px); height: 100%; overflow: visible; }}
    #board-many {{ display: inline-block; color: var(--marker-red); }}
  </style>
  <div
    id="root"
    data-composition-id="board"
    data-width="1920"
    data-height="1080"
    data-layout-allow-overlap
    data-composition-variables='[{{"id":"line1","type":"string","label":"Sign line 1","default":"JACK OF"}},{{"id":"line2","type":"string","label":"Sign line 2","default":"ALL TRADES"}},{{"id":"label","type":"string","label":"Tape label","default":"MASTER OF"}},{{"id":"struck","type":"string","label":"Struck word","default":"NONE"}},{{"id":"fix","type":"string","label":"Marker fix","default":"MANY"}}]'
  >
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <linearGradient id="g-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f777e"/><stop offset=".32" stop-color="#e6eaed"/><stop offset=".6" stop-color="#a9b0b6"/><stop offset="1" stop-color="#5f676d"/></linearGradient>
        <linearGradient id="g-steel-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6eaed"/><stop offset=".45" stop-color="#a9b0b6"/><stop offset="1" stop-color="#5f676d"/></linearGradient>
        <linearGradient id="g-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5326"/><stop offset=".4" stop-color="#cf9356"/><stop offset=".7" stop-color="#b9773e"/><stop offset="1" stop-color="#7a4520"/></linearGradient>
        <linearGradient id="g-wood-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cf9356"/><stop offset=".6" stop-color="#b9773e"/><stop offset="1" stop-color="#7a4520"/></linearGradient>
        <linearGradient id="g-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e1f1b"/><stop offset=".38" stop-color="#e2524a"/><stop offset=".7" stop-color="#c8312b"/><stop offset="1" stop-color="#7e1a16"/></linearGradient>
        <linearGradient id="g-yellow-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84f"/><stop offset=".5" stop-color="#f2b705"/><stop offset="1" stop-color="#c99400"/></linearGradient>
        <linearGradient id="g-rubber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1715"/><stop offset=".4" stop-color="#4a4440"/><stop offset="1" stop-color="#161311"/></linearGradient>
        <filter id="f-sil" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"/>
          <feFlood flood-color="#2a2017" flood-opacity="0.82"/>
          <feComposite in2="d" operator="in"/>
        </filter>
        {symbols}
      </defs>
    </svg>

    <div id="board-cam" data-layout-allow-overflow>
      <div id="board-ground"></div>
      <svg id="board-grain" width="2000" height="1160" aria-hidden="true">
        <filter id="f-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="2" seed="7"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#f-grain)"/>
      </svg>
      <div id="board-stage">
        {"".join(tool_html)}
        {"".join(peg_html)}
        <div id="board-sign" data-layout-allow-overflow>
          <div id="board-sign-body">
            <div class="plank"></div>
            <div class="grommet" style="left:{SIGN['pegs'][0][0]-SIGN['x']}px"></div>
            <div class="grommet" style="left:{SIGN['pegs'][1][0]-SIGN['x']}px"></div>
            <div id="board-title">
              <span id="board-line1" data-var-text="line1">JACK OF</span>
              <span id="board-line2" data-var-text="line2">ALL TRADES</span>
            </div>
          </div>
        </div>
        {sign_pegs}
        <div id="board-tape" class="clip" data-start="{T_TAPE}" data-duration="{round(5 - T_TAPE, 3)}" data-track-index="2">
          <div id="board-tape-body">
            <span id="board-label" data-var-text="label">MASTER OF</span>
            <span id="board-none"><span id="board-none-word" data-var-text="struck">NONE</span><svg id="board-strike" viewBox="0 0 200 70" preserveAspectRatio="none"><path id="board-strike-path" d="M4 44 C 60 34, 120 40, 196 28" pathLength="1" fill="none" stroke="#c8312b" stroke-width="9" stroke-linecap="round"/></svg></span>
            <span id="board-many" data-var-text="fix">MANY</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    (function () {{
      const TOOLS = {json.dumps(tl_data)};
      const T_SIGN = {T_SIGN}, T_TAPE = {T_TAPE}, T_STRIKE = {T_STRIKE}, T_WRITE = {T_WRITE};
      const tl = gsap.timeline({{ paused: true }});

      // 1. Each tool is hung on its hook: a short drop, then it swings and settles.
      TOOLS.forEach(function (t) {{
        const body = "#board-" + t.id + "-body";
        const kick = "#board-" + t.id + "-kick";
        const origin = t.ox + "px " + t.oy + "px";
        const fall = 0.13;
        tl.fromTo(body, {{ y: -90, opacity: 0, rotation: 0, transformOrigin: origin }},
          {{ y: 0, duration: fall, ease: "power2.in" }}, t.land - fall);
        tl.fromTo(body, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.04, ease: "none", immediateRender: false }}, t.land - fall);
        if (t.kind === "rest") {{
          tl.fromTo(body, {{ y: 0 }}, {{ y: -8, duration: 0.07, ease: "power2.out", immediateRender: false }}, t.land);
          tl.fromTo(body, {{ y: -8 }}, {{ y: 0, duration: 0.09, ease: "power2.in", immediateRender: false }}, t.land + 0.07);
          tl.fromTo(body, {{ rotation: 0 }}, {{ rotation: t.amp, duration: 0.07, ease: "sine.out", immediateRender: false }}, t.land);
          tl.fromTo(body, {{ rotation: t.amp }}, {{ rotation: 0, duration: 0.16, ease: "sine.inOut", immediateRender: false }}, t.land + 0.07);
        }} else {{
          const a = t.amp;
          const seq = [[0, a, 0.1, "sine.out"], [a, -0.55 * a, 0.2, "sine.inOut"], [-0.55 * a, 0.3 * a, 0.18, "sine.inOut"],
                       [0.3 * a, -0.12 * a, 0.16, "sine.inOut"], [-0.12 * a, 0, 0.14, "sine.inOut"]];
          let at = t.land;
          seq.forEach(function (s) {{
            tl.fromTo(body, {{ rotation: s[0] }}, {{ rotation: s[1], duration: s[2], ease: s[3], immediateRender: false }}, at);
            at += s[2];
          }});
        }}
        // 2. The sign's impact shakes every tool on the board.
        const k = t.kind === "rest" ? 0 : t.kick;
        const kt = T_SIGN + t.kickDelay;
        tl.fromTo(kick, {{ rotation: 0, y: 0, transformOrigin: origin }},
          {{ rotation: k, y: t.kind === "rest" ? -6 : 0, duration: 0.06, ease: "sine.out" }}, kt);
        tl.fromTo(kick, {{ rotation: k, y: t.kind === "rest" ? -6 : 0 }},
          {{ rotation: -0.5 * k, y: 0, duration: 0.16, ease: "sine.inOut", immediateRender: false }}, kt + 0.06);
        tl.fromTo(kick, {{ rotation: -0.5 * k }}, {{ rotation: 0.2 * k, duration: 0.14, ease: "sine.inOut", immediateRender: false }}, kt + 0.22);
        tl.fromTo(kick, {{ rotation: 0.2 * k }}, {{ rotation: 0, duration: 0.12, ease: "sine.inOut", immediateRender: false }}, kt + 0.36);
      }});

      // 3. The sign drops onto its two pegs.
      const fallS = 0.27;
      tl.fromTo("#board-sign-body", {{ y: -820, rotation: -1.2, transformOrigin: "50% 8%" }},
        {{ y: 0, rotation: 0, duration: fallS, ease: "power3.in" }}, T_SIGN - fallS);
      tl.fromTo("#board-sign-body", {{ y: 0, scaleY: 1 }}, {{ y: -16, scaleY: 0.985, duration: 0.08, ease: "power2.out", immediateRender: false }}, T_SIGN);
      tl.fromTo("#board-sign-body", {{ y: -16, scaleY: 0.985 }}, {{ y: 0, scaleY: 1, duration: 0.11, ease: "power2.in", immediateRender: false }}, T_SIGN + 0.08);
      tl.fromTo("#board-sign-body", {{ rotation: 0 }}, {{ rotation: 0.8, duration: 0.1, ease: "sine.out", immediateRender: false }}, T_SIGN + 0.04);
      tl.fromTo("#board-sign-body", {{ rotation: 0.8 }}, {{ rotation: -0.35, duration: 0.16, ease: "sine.inOut", immediateRender: false }}, T_SIGN + 0.14);
      tl.fromTo("#board-sign-body", {{ rotation: -0.35 }}, {{ rotation: 0, duration: 0.14, ease: "sine.inOut", immediateRender: false }}, T_SIGN + 0.30);

      // Camera shake on the impact.
      const shake = [[0, 0, 9, -4, 0.04], [9, -4, -6, 3, 0.07], [-6, 3, 3, -1, 0.07], [3, -1, -1, 0.5, 0.07], [-1, 0.5, 0, 0, 0.08]];
      let st = T_SIGN;
      shake.forEach(function (s) {{
        tl.fromTo("#board-cam", {{ y: s[0], x: s[1] }}, {{ y: s[2], x: s[3], duration: s[4], ease: "sine.inOut", immediateRender: st > T_SIGN ? false : true }}, st);
        st += s[4];
      }});

      // 4. A strip of masking tape is slapped on: MASTER OF NONE.
      tl.fromTo("#board-tape-body", {{ scale: 1.09, rotation: -5.5, y: -14, transformOrigin: "50% 50%" }},
        {{ scale: 1, rotation: -3, y: 0, duration: 0.11, ease: "power3.out" }}, T_TAPE);

      // 5. Marker strikes NONE and writes MANY.
      tl.fromTo("#board-strike-path", {{ strokeDasharray: 1, strokeDashoffset: 1 }},
        {{ strokeDashoffset: 0, duration: 0.15, ease: "power1.inOut" }}, T_STRIKE);
      tl.fromTo("#board-many", {{ clipPath: "inset(-20% 100% -20% 0%)" }},
        {{ clipPath: "inset(-20% 0% -20% 0%)", duration: 0.3, ease: "power1.inOut" }}, T_WRITE);

      tl.set({{}}, {{}}, 5);
      window.__timelines["board"] = tl;
    }})();
  </script>
</template>
"""
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html)
