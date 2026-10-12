// Pre-extracts footage into cached still-frame sequences so the browser never decodes video.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { abs } from '../lib/config.mjs';

export function extractFootage(cfg, warnings, { force = false } = {}) {
  const out = {};
  for (const [slot, s] of Object.entries(cfg.footageSlots)) {
    const src = abs(s.path), dir = abs(path.join(cfg.output.cache, 'footage', slot));
    if (!fs.existsSync(src)) {
      fs.rmSync(dir, { recursive: true, force: true });
      if (!s.optional) warnings.add(`Footage slot ${slot} is missing (${s.path}): using an illustrated stand-in stamped SOURCE SHOT REQUIRED: ${slot}.`);
      else warnings.add(`Optional footage slot ${slot} is missing (${s.path}): using the illustrated stand-in.`);
      out[slot] = { present: false, count: 0 };
      continue;
    }
    const st = fs.statSync(src);
    const key = crypto.createHash('sha1').update(JSON.stringify({ s, size: st.size, m: st.mtimeMs, fps: cfg.fps })).digest('hex');
    const mf = path.join(dir, 'manifest.json');
    const want = Math.round(s.durationSeconds * cfg.fps);
    if (!force && fs.existsSync(mf)) {
      const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
      if (m.key === key) { out[slot] = { present: true, count: m.count }; continue; }
    }
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const c = s.crop;
    const vf = `crop=iw*${c.w}:ih*${c.h}:iw*${c.x}:ih*${c.y},scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1,setpts=PTS/${s.speed},fps=${cfg.fps}`;
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(s.inSeconds), '-t', String(s.durationSeconds * s.speed), '-i', src, '-vf', vf, '-frames:v', String(want), '-q:v', '2', path.join(dir, '%04d.jpg')], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`Footage slot ${slot}: ffmpeg could not read ${s.path}: ${r.stderr.trim().split('\n').pop()}. Check the file is a valid video and inSeconds (${s.inSeconds}) is inside it.`);
    const count = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length;
    if (count === 0) throw new Error(`Footage slot ${slot}: no frames extracted from ${s.path} at inSeconds=${s.inSeconds}. The in-point is probably past the end of the clip.`);
    if (count < want) warnings.add(`Footage slot ${slot}: clip only supplies ${count}/${want} frames from inSeconds=${s.inSeconds}; the last frame will be held.`);
    if (s.useAudio) {
      spawnSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(s.inSeconds), '-t', String(s.durationSeconds * s.speed), '-i', src, '-vn', '-ac', '2', '-ar', '48000', path.join(dir, 'audio.wav')]);
    }
    fs.writeFileSync(mf, JSON.stringify({ key, count }));
    out[slot] = { present: true, count };
  }
  return out;
}
