import { readAvatar } from './avatar.js';

export const avatarLibraryKey = 'komorebi-avatar-library';
export const avatarLibraryLimit = 8;
const imageBudget = 1500000;

export function readAvatarLibrary(storage) {
  try {
    const value = JSON.parse(storage.getItem(avatarLibraryKey));
    if (!Array.isArray(value)) return [];
    const result = [];
    for (const item of value) {
      const avatar = readAvatar({getItem: () => JSON.stringify(item?.avatar)});
      if (avatar.kind !== 'custom' || typeof item?.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(item.id)) continue;
      if (result.some(entry => entry.id === item.id || entry.avatar.image === avatar.image)) continue;
      if (result.length === avatarLibraryLimit || result.reduce((sum, entry) => sum + entry.avatar.image.length, 0) + avatar.image.length > imageBudget) continue;
      result.push({id:item.id, avatar});
    }
    return result;
  } catch { return []; }
}

// Match the exact stored photo, so names, framing and voices follow each partner.
export function keepAvatar(library, avatar, newId) {
  if (avatar.kind !== 'custom') return library;
  const existing = library.find(entry => entry.avatar.image === avatar.image);
  if (!existing && library.length >= avatarLibraryLimit) throw new Error('アバターは8人まで保存できます。使わないアバターを削除してから追加してください。');
  const result = existing ? library.map(entry => entry === existing ? {...entry, avatar:{...avatar}} : entry) : [...library, {id:newId, avatar:{...avatar}}];
  if (result.reduce((sum, entry) => sum + entry.avatar.image.length, 0) > imageBudget) throw new Error('写真の保存容量がいっぱいです。使わないアバターを削除するか、小さい写真を選んでください。');
  return result;
}

export function writeAvatarLibrary(storage, library) {
  // Write before changing the visible collection. A failed write keeps old data.
  try { storage.setItem(avatarLibraryKey, JSON.stringify(library)); }
  catch { throw new Error('アバターを保存できませんでした。端末の空き容量やブラウザの保存設定を確認してください。'); }
}
