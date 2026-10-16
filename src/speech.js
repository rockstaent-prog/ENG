import { selectEnglishVoice } from './voices.js';

let cancelPending = null;
let activeUtterance = null;
export function cancelSpeech() {
  cancelPending?.();
  cancelPending = null;
  if (activeUtterance) {
    activeUtterance.onstart = null; activeUtterance.onend = null;
    activeUtterance.onerror = null; activeUtterance.onboundary = null;
    activeUtterance = null;
  }
  window.speechSynthesis?.cancel();
}

export function speak(text, options = {}) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return 'unsupported';
  cancelSpeech();
  const synth = window.speechSynthesis;
  const choose = () => selectEnglishVoice(synth.getVoices(), options.voiceURI, options.femaleOnly);
  const play = voice => {
    try {
      // Keep the utterance alive until the engine finishes. Some browsers drop
      // events when their JavaScript utterance is garbage-collected mid-speech.
      const utterance = new window.SpeechSynthesisUtterance(text);
      activeUtterance = utterance;
      utterance.lang = voice?.lang || 'en-US'; utterance.rate = 0.9;
      if (voice) utterance.voice = voice;
      utterance.onstart = options.onStart;
      utterance.onend = event => { if (activeUtterance === utterance) activeUtterance = null; options.onEnd?.(event); };
      utterance.onerror = event => { if (activeUtterance === utterance) activeUtterance = null; options.onError?.(event); };
      utterance.onboundary = options.onBoundary;
      if (synth.paused) synth.resume();
      synth.speak(utterance);
      return 'started';
    } catch {
      activeUtterance = null;
      options.onError?.({ error: 'synthesis-failed' });
      return 'failed';
    }
  };
  const voice = choose();
  if (voice || !options.femaleOnly) return play(voice);

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
