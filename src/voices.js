// The Web Speech API has no standard gender field. Only use named voices known
// to be female (or an explicit provider label), never an unknown system default.
const femaleNames = /\b(Samantha|Aria|Jenny|Ava|Emma|Zira|Sonia|Karen|Serena|Victoria|Susan|Hazel|Moira|Tessa|Fiona|Allison|Alicia|Amelia|Ashley|Catherine|Elizabeth|Eva|Holly|Ivy|Joanna|Joelle|Kimberly|Libby|Linda|Michelle|Nancy|Nicky|Salli|Sara|Shelley|Stephanie|Tracy|Amber|Ana|Monica|Natasha|Clara|Maisie|Luna|Veena|Neerja)\b/i;

export function isFemaleVoice(voice) {
  const explicit = String(voice.gender || '').toLowerCase();
  const label = `${voice.name || ''} ${voice.voiceURI || ''}`;
  if (explicit === 'male' || /(?:^|[^a-z])(male|man)(?:[^a-z]|$)/i.test(label)) return false;
  if (explicit === 'female' || /(?:^|[^a-z])(female|woman)(?:[^a-z]|$)/i.test(label)) return true;
  return femaleNames.test(voice.name) || /^Google US English$/i.test(voice.name.trim());
}

export function englishVoices(voices, femaleOnly = false) {
  return voices.filter(v => /^en(?:[-_]|$)/i.test(v.lang) && (!femaleOnly || isFemaleVoice(v)));
}

export function selectEnglishVoice(voices, preferredURI = '', femaleOnly = false) {
  const candidates = englishVoices(voices, femaleOnly);
  const preferred = candidates.find(v => v.voiceURI === preferredURI);
  if (preferred) return preferred;
  const score = v => (/natural|neural|enhanced|premium/i.test(v.name) ? 20 : 0) + (/^en[-_]US$/i.test(v.lang) ? 10 : 0) + (v.localService ? 2 : 0);
  return candidates.sort((a,b) => score(b) - score(a))[0] || null;
}
