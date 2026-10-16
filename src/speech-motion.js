// A small, offline approximation of mouth shapes. Browser word boundaries reset
// the clock; engines without boundary events use a reading-speed estimate.
export function mouthShape(character) {
  const c = character?.toLowerCase() || '';
  if (!c || /[\s.,!?;:—-]/.test(c) || /[mbp]/.test(c)) return 0;
  if (/[ouwq]/.test(c)) return 3;
  if (/[eiy]/.test(c)) return 4;
  if (/[a]/.test(c)) return 2;
  return 1;
}

export function speechPosition(cue, now) {
  if (!cue?.text || now < cue.at) return { index: 0, shape: 0 };
  const elapsed = (now - cue.at) / 1000;
  const offset = Math.floor(elapsed * 10);
  const limit = cue.boundary ? (cue.length || cue.text.slice(cue.index).match(/^\S+/)?.[0].length || 1) : cue.text.length;
  if (offset >= limit) return { index: Math.min(cue.index + limit, cue.text.length), shape: 0 };
  const index = cue.index + offset;
  // Brief closures keep vowels from appearing held open between syllables.
  const closure = elapsed > 0 && (elapsed * 6.5) % 1 < 0.13;
  return { index, shape: closure ? 0 : mouthShape(cue.text[index]) };
}
