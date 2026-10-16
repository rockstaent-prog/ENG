import { selectEnglishVoice } from './voices.js';

let cancelPending = null;
export function cancelSpeech() {
  cancelPending?.();
  cancelPending = null;
  window.speechSynthesis?.cancel();
}

export function speak(text, options = {}) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return 'unsupported';
  cancelSpeech();
  const synth = window.speechSynthesis;
  const choose = () => selectEnglishVoice(synth.getVoices(), options.voiceURI, options.femaleOnly);
  const play = voice => {
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || 'en-US'; utterance.rate = 0.9;
    if (voice) utterance.voice = voice;
    utterance.onstart = options.onStart;
    utterance.onend = options.onEnd;
    utterance.onerror = options.onError;
    utterance.onboundary = options.onBoundary;
    synth.speak(utterance);
  };
  const voice = choose();
  if (voice || !options.femaleOnly) { play(voice); return 'started'; }

  // Some browsers populate the voice list after the first read. Wait briefly,
  // and cancel this request if the user stops or starts a different utterance.
  let active = true, timer;
  const cleanup = () => {
    active = false; clearTimeout(timer);
    synth.removeEventListener('voiceschanged', attempt);
    if (cancelPending === cleanup) cancelPending = null;
  };
  const attempt = () => {
    if (!active) return;
    const available = choose();
    if (available) { cleanup(); play(available); }
  };
  cancelPending = cleanup;
  synth.addEventListener('voiceschanged', attempt);
  timer = setTimeout(() => {
    if (!active) return;
    const available = choose();
    cleanup();
    if (available) play(available);
    else options.onUnavailable?.();
  }, 1500);
  return 'queued';
}
