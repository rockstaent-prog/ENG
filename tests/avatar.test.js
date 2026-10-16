import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarPresets, defaultAvatar, readAvatar } from '../src/avatar.js';

test('fresh or unavailable avatar storage uses the supplied portrait', () => {
  for (const value of ['null', 'invalid', '{}']) assert.deepEqual(readAvatar({getItem: () => value}), defaultAvatar);
  assert.deepEqual(readAvatar({getItem() {throw new Error('Storage unavailable');}}), defaultAvatar);
  assert.ok(avatarPresets.find(p => p.id === defaultAvatar.kind).image.endsWith('.png'));
});

test('avatar settings restore image, name and voice preferences', () => {
  const settings = {kind:'custom',name:'  Emma  ',image:'data:image/png;base64,YQ==',autoRead:false,voiceURI:'English Voice'};
  assert.deepEqual(readAvatar({getItem: () => JSON.stringify(settings)}), {...settings,name:'Emma'});
});

test('invalid image URLs and oversized data cannot become saved avatars', () => {
  for (const image of ['https://example.com/image.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,YQ==', 'data:image/png;base64,'+'a'.repeat(500001)]) {
    const restored = readAvatar({getItem: () => JSON.stringify({kind:'custom',name:'My friend',image})});
    assert.equal(restored.image,''); assert.equal(restored.kind,defaultAvatar.kind);
  }
});
