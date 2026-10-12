// Resolves cue-relative events to absolute seconds. Pure: runs in the browser and in Node.
export function resolveTimeline(cfg) {
  const fail = (m) => { throw new Error(`timeline: ${m}`); };
  const cues = {};
  for (const c of cfg.voiceover.cues) {
    if (c.end <= c.start) fail(`cue ${c.id} ends (${c.end}) before it starts (${c.start})`);
    cues[c.id] = c;
  }
  const wordTime = (cueId, word) => {
    const c = cues[cueId];
    if (!c) fail(`unknown cue "${cueId}" (known: ${Object.keys(cues).join(', ')})`);
    if (!word) return c.start;
    const f = c.words && c.words[word];
    if (f === undefined) fail(`cue ${cueId} has no word marker "${word}" (known: ${Object.keys(c.words || {}).join(', ') || 'none'})`);
    return c.start + f * (c.end - c.start);
  };
  const resolveAt = (o) => (o.atCue !== undefined ? wordTime(o.atCue, o.atWord) : o.atSeconds) + (o.offset || 0);

  const sceneById = {};
  for (const s of cfg.scenes) sceneById[s.id] = s;
  const events = {};
  for (const e of cfg.events) {
    if (!sceneById[e.scene]) fail(`event "${e.id}" references unknown scene "${e.scene}"`);
    if (events[e.id]) fail(`duplicate event id "${e.id}"`);
    const anchor = resolveAt(e);
    const t0 = e.align === 'end' ? anchor - e.duration : anchor;
    const wordAt = e.atCue !== undefined ? wordTime(e.atCue, e.atWord) : null;
    events[e.id] = { ...e, t0, t1: t0 + e.duration, wordAt, landing: e.align === 'end' ? t0 + e.duration : t0 };
  }
  const transitions = (cfg.transitions || []).map((tr) => {
    if (!sceneById[tr.from] || !sceneById[tr.to]) fail(`transition "${tr.id}" references an unknown scene`);
    const t0 = resolveAt(tr);
    return { ...tr, t0, t1: t0 + (tr.duration || 0) };
  });
  return { cues, events, transitions, scenes: cfg.scenes, wordTime, resolveAt };
}
