// Builds output/mix.wav: loudnormed voice, sidechain-ducked music, sfx placed with adelay, final limiter at -1 dBTP.
// Missing media never breaks the build: silent voice track / clearly labelled procedural placeholder music and sfx.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { abs } from '../lib/config.mjs';

const ff = (args, what) => {
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed while ${what}: ${(r.stderr || '').trim().split('\n').slice(-3).join(' | ')}`);
};

function placeholderSfx(spec, out, dur, seed) {
  const k = spec.kind, f = spec.freq || 80, d = spec.duration || dur, fade = spec.fade ?? 0.1;
  const tail = `aformat=channel_layouts=stereo,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, d - fade)}:d=${fade}`;
  let args;
  if (k === 'noise') {
    const fl = [spec.highpass && `highpass=f=${spec.highpass}`, spec.lowpass && `lowpass=f=${spec.lowpass}`, spec.tremolo && `tremolo=f=${spec.tremolo}:d=0.9`].filter(Boolean).join(',');
    args = ['-f', 'lavfi', '-i', `anoisesrc=d=${d}:c=pink:r=48000:a=0.5:seed=${seed},${fl ? fl + ',' : ''}${tail}`];
  } else if (k === 'thump') args = ['-f', 'lavfi', '-i', `sine=f=${f}:d=${d}:r=48000,volume='exp(-5*t)':eval=frame,${tail}`];
  else if (k === 'clicks') args = ['-f', 'lavfi', '-i', `anoisesrc=d=${d}:c=white:r=48000:a=0.8:seed=${seed},highpass=f=1800,lowpass=f=7000,volume='lt(mod(t,${(1 / (spec.rate || 4)).toFixed(4)}),0.012)*exp(-mod(t,${(1 / (spec.rate || 4)).toFixed(4)})*300)':eval=frame,${tail}`];
  else if (k === 'pulse') args = ['-f', 'lavfi', '-i', `sine=f=${f}:d=${d}:r=48000,volume='exp(-7*mod(t,${(60 / (spec.bpm || 60)).toFixed(4)}))':eval=frame,${tail}`];
  else if (k === 'swell') args = ['-f', 'lavfi', '-i', `sine=f=${f}:d=${d}:r=48000,afade=t=in:d=${d * 0.65},lowpass=f=400,${tail}`];
  else args = ['-f', 'lavfi', '-i', `sine=f=${f}:d=${d}:r=48000${spec.tremolo ? `,tremolo=f=${spec.tremolo}:d=0.5` : ''},${tail}`];
  ff([...args, '-ar', '48000', '-ac', '2', out], `generating placeholder sfx ${path.basename(out)}`);
}

function placeholderMusic(out, dur) {
  ff(['-f', 'lavfi', '-i', `sine=f=55:d=${dur}:r=48000`, '-f', 'lavfi', '-i', `sine=f=82.5:d=${dur}:r=48000`, '-f', 'lavfi', '-i', `sine=f=110:d=${dur}:r=48000`,
    '-filter_complex', `[0][1][2]amix=inputs=3:normalize=0,tremolo=f=0.18:d=0.35,lowpass=f=600,afade=t=in:d=1.2,afade=t=out:st=${dur - 2.5}:d=2.5,aformat=channel_layouts=stereo`,
    '-ar', '48000', '-ac', '2', out], 'generating placeholder music');
}

export function buildMix(cfg, warnings) {
  const dur = cfg.duration, tl = cfg._timeline, pdir = abs(`${cfg.output.cache}/placeholders`);
  fs.mkdirSync(pdir, { recursive: true });
  const inputs = [], chains = [], labels = [];
  const addInput = (args) => { inputs.push(...args); return inputs.filter((x) => x === '-i').length - 1; };

  // voice
  let voiceIdx, silentVoice = false;
  if (fs.existsSync(abs(cfg.voiceover.path))) voiceIdx = addInput(['-i', abs(cfg.voiceover.path)]);
  else { warnings.add(`Voiceover missing (${cfg.voiceover.path}): mix uses a silent ${dur}s track.`); silentVoice = true; voiceIdx = addInput(['-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo']); }
  chains.push(`[${voiceIdx}:a]aresample=48000,aformat=channel_layouts=stereo${silentVoice ? '' : ',loudnorm=I=-16:TP=-1.5:LRA=11'},apad=whole_dur=${dur},atrim=0:${dur},asetpts=N/SR/TB,asplit=2[vmix][vsc]`);
  labels.push('[vmix]');

  // music
  let musicPath = abs(cfg.music.path);
  if (!fs.existsSync(musicPath)) { musicPath = path.join(pdir, 'PLACEHOLDER-music.wav'); placeholderMusic(musicPath, dur); warnings.add(`Music missing (${cfg.music.path}): using a generated placeholder drone (PLACEHOLDER-music.wav).`); }
  const mi = addInput(['-i', musicPath]);
  const drops = (cfg.music.dropouts || []).map((d) => `volume=enable='between(t,${d.start},${d.end})':volume=${d.gainDb}dB`).join(',');
  const over = 14, duck = cfg.music.duckDb || 10, ratio = (1 / (1 - duck / over)).toFixed(2);
  chains.push(`[${mi}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${cfg.music.gainDb}dB${drops ? ',' + drops : ''},apad=whole_dur=${dur},atrim=0:${dur}[mus]`);
  chains.push(`[mus][vsc]sidechaincompress=threshold=0.08:ratio=${ratio}:attack=25:release=350:makeup=1[duck]`);
  labels.push('[duck]');

  // sfx
  const placeholders = [];
  cfg.sfx.forEach((s, n) => {
    let p = abs(s.path);
    if (!fs.existsSync(p)) { p = path.join(pdir, `PLACEHOLDER-${s.id}.wav`); placeholderSfx(s.placeholder || { kind: 'tone' }, p, 1, 100 + n); placeholders.push(s.id); }
    const at = s.atCue !== undefined ? tl.wordTime(s.atCue, s.atWord) + (s.offset || 0) : s.atSeconds + (s.offset || 0);
    const ms = Math.max(0, Math.round(at * 1000)), i = addInput(['-i', p]);
    chains.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.gainDb ?? -18}dB,adelay=${ms}|${ms},apad=whole_dur=${dur},atrim=0:${dur}[sfx${n}]`);
    labels.push(`[sfx${n}]`);
  });
  if (placeholders.length) warnings.add(`${placeholders.length} sfx are generated placeholders (${placeholders.join(', ')}). Drop real files at the paths in config/episode.json sfx[] to replace them.`);

  // optional footage audio (the film's own sound), ducked under the voice via a low gain
  for (const [slot, s] of Object.entries(cfg.footageSlots)) {
    const a = abs(`${cfg.output.cache}/footage/${slot}/audio.wav`);
    if (s.useAudio && fs.existsSync(a)) {
      const i = addInput(['-i', a]), ms = Math.round((s.placeAtSeconds || 0) * 1000);
      chains.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.audioGainDb ?? -12}dB,adelay=${ms}|${ms},apad=whole_dur=${dur},atrim=0:${dur}[fa${slot}]`);
      labels.push(`[fa${slot}]`);
    }
  }
  chains.push(`${labels.join('')}amix=inputs=${labels.length}:duration=longest:normalize=0,alimiter=limit=0.89:attack=5:release=60:level=disabled,apad=whole_dur=${dur},atrim=0:${dur}[out]`);
  const out = abs(cfg.output.mix);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  ff([...inputs, '-filter_complex', chains.join(';'), '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', '-t', String(dur), out], 'mixing audio');
  return out;
}
