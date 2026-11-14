#!/usr/bin/env bash
# Cuts the raw downloads in .media/audio/sfx into the short takes the film uses (assets/sfx).
# Sources and licences: assets/sfx/CREDITS.md
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=.media/audio/sfx
OUT=assets/sfx
mkdir -p "$OUT"

# carve <src> <start> <dur> <out> [extra filters]
carve() {
  local src=$1 ss=$2 dur=$3 out=$4 extra=${5:-}
  local fo; fo=$(python3 -c "print(max(0.0, $dur - 0.08))")
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$SRC/$src" \
    -af "${extra:+$extra,}afade=t=in:d=0.004,afade=t=out:st=$fo:d=0.08,alimiter=limit=0.7:level=false" \
    -ar 48000 -ac 2 "$OUT/$out"
}

# Tool landing on its hook: six takes rotated across the twelve tools.
carve sfx_003.mp3 0.020 0.40 clank-1.wav "volume=-5dB"
carve sfx_003.mp3 0.020 0.34 clank-2.wav "volume=-5dB,asetrate=48000*1.22,aresample=48000"
carve sfx_003.mp3 0.020 0.46 clank-3.wav "volume=-5dB,asetrate=48000*0.84,aresample=48000"
carve sfx_001.mp3 0.595 0.32 clank-4.wav "volume=+6dB"
carve sfx_001.mp3 1.575 0.30 clank-5.wav "volume=+8dB"
carve sfx_001.mp3 2.105 0.30 clank-6.wav "asetrate=48000*1.12,aresample=48000"

# Sign landing: wood thud under the bass impact.
carve sfx_006.mp3 0.440 0.60 sign-thud.wav "volume=+6dB"
cp "$SRC/impact-bass-1.mp3" "$OUT/impact.mp3"
cp "$SRC/riser.mp3" "$OUT/riser.mp3"

# Masking tape slapped on, then the marker strike and the new word.
carve sfx_005.mp3 0.150 0.32 tape.wav "volume=+4dB"
carve sfx_002.mp3 0.520 0.30 marker-strike.wav
carve sfx_002.mp3 1.240 0.52 marker-write.wav
