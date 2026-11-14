#!/usr/bin/env bash
# Cuts the raw CC0 downloads in .media/audio/sfx into short takes (assets/sfx), each peak-normalised to -3 dBFS.
# Sources and licences: assets/CREDITS.md
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=.media/audio/sfx
OUT=assets/sfx
mkdir -p "$OUT"

# carve <src> <start> <dur> <out> [extra filters]
carve() {
  local src=$1 ss=$2 dur=$3 out=$4 extra=${5:-}
  local fo; fo=$(python3 -c "print(max(0.0, $dur - 0.06))")
  local tmp="$OUT/.tmp-$out"
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$SRC/$src" \
    -af "${extra:+$extra,}afade=t=in:d=0.004,afade=t=out:st=$fo:d=0.06" -ar 48000 -ac 2 "$tmp"
  local peak; peak=$(ffmpeg -hide_banner -i "$tmp" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-\?[0-9.]*\) dB.*/\1/p')
  local gain; gain=$(python3 -c "print(round(-3.0 - ($peak), 2))")
  ffmpeg -v error -y -i "$tmp" -af "volume=${gain}dB" -ar 48000 -ac 2 "$OUT/$out"
  rm -f "$tmp"
}

carve sfx_001.mp3 0.25 0.80 slide.wav                      # page slides onto the board
carve sfx_005.mp3 0.00 0.52 page-flick.wav                 # quote strip whips in
carve sfx_004.mp3 0.05 0.70 page-turn.wav                  # portrait arrives
carve whoosh.mp3  0.00 0.45 whoosh.wav                     # scene whip
carve sfx_008.mp3 0.47 0.22 tap-1.wav                      # engravings slapped down (three takes)
carve sfx_008.mp3 2.10 0.22 tap-2.wav "asetrate=48000*1.12,aresample=48000"
carve sfx_008.mp3 5.49 0.22 tap-3.wav "asetrate=48000*0.9,aresample=48000"
carve sfx_010.mp3 0.00 0.32 thud.wav                       # labels stamped on
carve sfx_007.mp3 0.10 0.60 scribble.wav                   # red pen circles
carve sfx_009.mp3 1.82 0.52 marker.wav                     # highlighter stroke
