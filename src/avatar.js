export const avatarPresets = [
  { id: 'portrait', name: 'Emma', label: 'エマ', image: typeof __AVATAR_IMAGE__ !== 'undefined' ? __AVATAR_IMAGE__ : './avatars/conversation-partner.png' },
  { id: 'fox', name: 'こも', label: 'きつね', color: '#efba8d' },
  { id: 'cat', name: 'ミミ', label: 'ねこ', color: '#b4a3d5' },
  { id: 'bear', name: 'ベア', label: 'くま', color: '#c4aa91' },
  { id: 'robot', name: 'ロボ', label: 'ロボット', color: '#93bbb5' },
];
export const defaultAvatar = { kind: 'portrait', name: 'Emma', image: '', autoRead: true, voiceURI: '' };
export const avatarStorageKey = 'komorebi-avatar';
export function readAvatar(storage) {
  try {
    const value = JSON.parse(storage.getItem(avatarStorageKey));
    if (!value || typeof value !== 'object') return { ...defaultAvatar };
    const image = typeof value.image === 'string' && value.image.length <= 500000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.image) ? value.image : '';
    const kind = value.kind === 'custom' && image ? 'custom' : avatarPresets.some(p => p.id === value.kind) ? value.kind : defaultAvatar.kind;
    return {
      kind, image: kind === 'custom' ? image : '',
      name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 24) : defaultAvatar.name,
      autoRead: typeof value.autoRead === 'boolean' ? value.autoRead : true,
      voiceURI: typeof value.voiceURI === 'string' ? value.voiceURI.slice(0, 400) : '',
    };
  } catch { return { ...defaultAvatar }; }
}

export async function prepareAvatarImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('PNG・JPEG・WebPの画像を選んでください。');
  if (file.size > 5 * 1024 * 1024) throw new Error('5MB以下の画像を選んでください。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error('画像を読み込めませんでした。別の画像をお試しください。'); }
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('このブラウザでは画像を設定できません。用意されたアバターを選べます。');
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
    const result = canvas.toDataURL('image/webp', 0.85);
    if (result.length > 500000) throw new Error('画像が大きすぎます。別の画像をお試しください。');
    return result;
  } finally { URL.revokeObjectURL(url); }
}
