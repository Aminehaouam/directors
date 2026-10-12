// npm run inspect : records the build environment into docs/ENVIRONMENT.md (never assume tools exist).
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { ROOT, abs } from '../lib/config.mjs';

const run = (cmd, args = [], opt = {}) => { const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 15000, ...opt }); return r.error ? { ok: false, out: `not available (${r.error.code || r.error.message})` } : { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() }; };
const out = [], sec = (t) => out.push(`\n## ${t}\n`), code = (s) => out.push('```\n' + s + '\n```');
out.push('# Environment inspection', '', `Generated ${new Date().toISOString().slice(0, 10)} by \`npm run inspect\`. Nothing below is assumed; it is measured.`);

sec('Working directory'); code(`pwd: ${ROOT}\n${run('ls', ['-la', ROOT]).out}`);
sec('Runtimes');
code([`node ${process.version}`, `npm ${run('npm', ['-v']).out}`, `python3 ${run('python3', ['-V']).out}`].join('\n'));

sec('ffmpeg / ffprobe');
const ffv = run('ffmpeg', ['-version']), fpv = run('ffprobe', ['-version']);
code(`${ffv.out.split('\n')[0]}\n${fpv.out.split('\n')[0]}`);
const enc = run('ffmpeg', ['-hide_banner', '-encoders']).out, want = ['libx264', 'aac', 'libfdk_aac', 'prores_ks'];
code(want.map((e) => `${e.padEnd(11)} ${new RegExp(`\\s${e}\\s`).test(enc) ? 'available' : 'MISSING'}`).join('\n'));
const filt = run('ffmpeg', ['-hide_banner', '-filters']).out;
code(['sidechaincompress', 'loudnorm', 'alimiter', 'adelay', 'blackdetect'].map((f) => `${f.padEnd(18)} ${new RegExp(`\\s${f}\\s`).test(filt) ? 'available' : 'MISSING'}`).join('\n'));

sec('Browser (frame capture)');
let pw = 'Playwright not installed (run npm install)';
try {
  const { chromium } = await import('playwright');
  const exe = chromium.executablePath();
  pw = `playwright chromium: ${exe} (${fs.existsSync(exe) ? 'present' : 'MISSING - install with: npx playwright install chromium'})`;
} catch (e) { pw = `playwright import failed: ${e.message}`; }
code([pw, ...['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'].map((b) => `${b}: ${run('which', [b]).ok ? run('which', [b]).out : 'not on PATH'}`), `PLAYWRIGHT_BROWSERS_PATH=${process.env.PLAYWRIGHT_BROWSERS_PATH || '(unset)'}`].join('\n'));

sec('Fonts installed on the system (informational: the project vendors its own and never uses these)');
const fl = run('fc-list').out;
code(['Cormorant', 'Inter', 'Reenie', 'Caveat'].map((f) => `${f.padEnd(10)} ${fl.split('\n').filter((l) => l.includes(f)).length} system faces`).join('\n'));
sec('Vendored fonts'); code(fs.existsSync(abs('public/fonts')) ? fs.readdirSync(abs('public/fonts')).join('\n') : 'public/fonts missing');

sec('Machine');
code([`cpu cores: ${os.cpus().length} (${os.cpus()[0]?.model})`, `memory: ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB`, `free disk (project): ${run('df', ['-h', ROOT]).out.split('\n').slice(-1)[0]}`, `platform: ${os.platform()} ${os.release()}`].join('\n'));
sec('GPU / hardware encoders');
code([`nvidia-smi: ${run('nvidia-smi', ['-L']).out.split('\n')[0]}`, `vainfo: ${run('vainfo').out.split('\n')[0]}`, `videotoolbox encoders: ${/videotoolbox/.test(enc) ? 'listed by ffmpeg (only usable on macOS)' : 'not listed'}`, `hardware h264 encoders in ffmpeg: ${enc.split('\n').filter((l) => /h264_(nvenc|vaapi|qsv|videotoolbox)/.test(l)).map((l) => l.trim().split(/\s+/)[1]).join(', ') || 'none'}`].join('\n'));

sec('Network');
const probe = async (u) => { try { const r = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(8000) }); return `${r.status}`; } catch (e) { return `unreachable (${e.cause?.code || e.message})`; } };
code([`npm registry:  ${await probe('https://registry.npmjs.org/playwright')}`, `Google Fonts:  ${await probe('https://fonts.googleapis.com/css2?family=Inter')}`].join('\n'));

fs.mkdirSync(abs('docs'), { recursive: true });
fs.writeFileSync(abs('docs/ENVIRONMENT.md'), out.join('\n') + '\n');
const missing = [];
if (!ffv.ok) missing.push('ffmpeg');
for (const e of ['libx264', 'aac']) if (!new RegExp(`\\s${e}\\s`).test(enc)) missing.push(`ffmpeg encoder ${e}`);
console.log(`Wrote docs/ENVIRONMENT.md${missing.length ? `\nPROBLEMS: ${missing.join(', ')}` : '\nAll required tools present.'}`);
if (missing.length) process.exit(1);
