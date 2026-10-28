// QA for the exported MP4: delivery spec, black/frozen frames, loudness, and a contact sheet to eyeball.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] || path.join(ROOT, 'export/sunset-factory_1080x1920.mp4');
const run = (args) => spawnSync(args[0], args.slice(1), { encoding: 'utf8' });
const probe = JSON.parse(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).stdout);
const v = probe.streams.find((s) => s.codec_type === 'video'), a = probe.streams.find((s) => s.codec_type === 'audio');
const checks = [
  ['video codec h264 / high', v.codec_name === 'h264' && v.profile === 'High', `${v.codec_name} ${v.profile}`],
  ['1080x1920 (9:16)', v.width === 1080 && v.height === 1920, `${v.width}x${v.height}`],
  ['30 fps', v.r_frame_rate === '30/1', v.r_frame_rate],
  ['yuv420p', v.pix_fmt === 'yuv420p', v.pix_fmt],
  ['600 frames', +v.nb_frames === 600, v.nb_frames],
  ['duration 20.0 s', Math.abs(+probe.format.duration - 20) < 0.05, probe.format.duration],
  ['audio aac 48 kHz stereo', a && a.codec_name === 'aac' && a.sample_rate === '48000' && a.channels === 2, a ? `${a.codec_name} ${a.sample_rate} ${a.channels}ch` : 'none'],
  ['faststart (moov first)', fs.readFileSync(file).subarray(0, 64).includes(Buffer.from('moov')) || run(['sh', '-c', `head -c 4096 "${file}" | grep -c moov`]).stdout.trim() !== '0', ''],
];
const bd = run(['ffmpeg', '-hide_banner', '-i', file, '-vf', 'blackdetect=d=0.1:pix_th=0.06', '-an', '-f', 'null', '-']).stderr;
checks.push(['no black segments', !/black_start/.test(bd), (bd.match(/black_start\S*/g) || []).join(' ')]);
const fz = run(['ffmpeg', '-hide_banner', '-i', file, '-vf', 'freezedetect=n=0.0005:d=0.6', '-an', '-f', 'null', '-']).stderr;
checks.push(['no frozen stretches > 0.6 s', !/freeze_start/.test(fz), (fz.match(/freeze_start: \S+/g) || []).join(' ')]);
const lo = run(['ffmpeg', '-hide_banner', '-i', file, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr;
const I = +(lo.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.match(/-?[\d.]+/)[0], TP = +(lo.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
checks.push(['loudness -18..-14 LUFS', I > -18 && I < -14, `${I} LUFS`], ['true peak <= -1 dBTP', TP <= -1, `${TP} dBTP`]);
let ok = true;
for (const [name, pass, info] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${info}`); ok &&= pass; }
const sheet = path.join(ROOT, 'out/contact-sheet.png');
run(['ffmpeg', '-y', '-v', 'error', '-i', file, '-vf', 'fps=1,scale=216:384,tile=10x2:padding=4:color=0x222222', '-frames:v', '1', sheet]);
console.log(`contact sheet -> ${path.relative(ROOT, sheet)}`);
process.exit(ok ? 0 : 1);
