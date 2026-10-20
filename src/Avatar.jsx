import React, { useState } from 'react';
import { avatarPresets } from './avatar';
import PhotoAvatar from './PhotoAvatar';
import OriginalPhotoAvatar from './OriginalPhotoAvatar';

export default function Avatar({ avatar, className = '', speaking = false, listening = false, cue, animated = false }) {
  const [failedImage, setFailedImage] = useState(null);
  const chosen = avatarPresets.find(p => p.id === avatar.kind) || avatarPresets[0];
  const source = avatar.kind === 'custom' ? avatar.image : chosen.image;
  const failed = Boolean(source && source === failedImage);
  const preset = failed ? avatarPresets[1] : chosen;
  const image = failed ? '' : source;
  return <span className={`character-avatar ${className} ${speaking ? 'is-speaking' : ''}`} role="img" aria-label={`${avatar.name || 'Emma'}のアバター`}>
    {image ? animated && avatar.kind === 'portrait' ? <PhotoAvatar image={image} speaking={speaking} listening={listening} cue={cue} onError={() => setFailedImage(source)}/> : avatar.kind === 'custom' && animated ? <OriginalPhotoAvatar image={image} speaking={speaking} listening={listening} cue={cue} framing={avatar} onError={() => setFailedImage(source)}/> : avatar.kind === 'custom' ? <span className={`custom-photo ${avatar.photoMode !== 'crop' ? 'whole-photo' : ''}`}><img src={image} alt="" onError={() => setFailedImage(source)} style={{objectPosition:`${avatar.imageX ?? 50}% ${avatar.imageY ?? 35}%`,transform:avatar.photoMode === 'crop' ? `scale(${avatar.imageZoom || 1})` : 'none'}}/></span> : <img src={image} alt="" onError={() => setFailedImage(source)}/> : <svg viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <circle cx="70" cy="70" r="68" fill={avatar.kind === 'robot' ? '#edf6f2' : '#f5eff9'}/>
      {avatar.kind === 'bear' ? <><circle cx="34" cy="39" r="18" fill={preset.color}/><circle cx="106" cy="39" r="18" fill={preset.color}/><circle cx="34" cy="39" r="10" fill="#f1ddcc"/><circle cx="106" cy="39" r="10" fill="#f1ddcc"/></> : avatar.kind === 'robot' ? <><path d="M70 31V16" stroke="#93bbb5" strokeWidth="5"/><circle cx="70" cy="15" r="6" fill="#d0a36c"/><rect x="18" y="59" width="12" height="29" rx="5" fill="#7ba29d"/><rect x="110" y="59" width="12" height="29" rx="5" fill="#7ba29d"/></> : <><path d="m30 60-4-39q-1-7 6-3l31 22m15 0 30-22q7-4 6 3l-5 39" fill={preset.color}/><path d="m35 43-2-16 17 14m41 0 16-14-2 17" fill="#f9ddd6"/></>}
      <path d="M29 68c0-30 19-39 41-39s41 9 41 39v15c0 25-16 40-41 40S29 108 29 83V68Z" fill={preset.color}/>
      {avatar.kind === 'robot' ? <rect x="37" y="49" width="66" height="52" rx="16" fill="#f3faf8"/> : <path d="M31 76q14-19 39-4 25-15 39 4c0 24-15 40-39 40S31 100 31 76Z" fill="#fff5e9"/>}
      <g className="face-eyes"><ellipse cx="53" cy="75" rx="4" ry="6" fill="#504655"/><ellipse cx="87" cy="75" rx="4" ry="6" fill="#504655"/></g>
      <ellipse cx="43" cy="88" rx="7" ry="4" fill="#e6a2a4"/><ellipse cx="97" cy="88" rx="7" ry="4" fill="#e6a2a4"/>
      {avatar.kind !== 'robot' && <path d="m66 86 4 3 4-3" stroke="#504655" strokeWidth="3" strokeLinecap="round"/>}
      <ellipse className="face-mouth" cx="70" cy="98" rx="7" ry="3" fill="#6d5366"/>
      <ellipse cx="70" cy="99" rx="3" ry="1" fill="#e0a5ad"/>
      {avatar.kind === 'cat' && <g stroke="#9c87be" strokeWidth="2" strokeLinecap="round"><path d="m28 88 15 2m-14 7 15-3m53-4 15-2m-15 6 15 3"/></g>}
    </svg>}
  </span>;
}
