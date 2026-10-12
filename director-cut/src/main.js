import { boot } from './engine.js';

const q = new URLSearchParams(location.search);
window.__ready = boot({ scale: parseFloat(q.get('scale') || '1') }).then(
  (api) => { Object.assign(window, api); return { ok: true, info: api.info }; },
  (e) => ({ ok: false, error: `${e && e.message ? e.message : e}` }),
);
