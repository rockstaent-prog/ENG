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
  assert.deepEqual(readAvatar({getItem: () => JSON.stringify(settings)}), {...settings,name:'Emma',imageX:50,imageY:35,imageZoom:1,photoMode:'whole'});
});

test('invalid image URLs and oversized data cannot become saved avatars', () => {
  for (const image of ['https://example.com/image.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,YQ==', 'data:image/png;base64,'+'a'.repeat(500001)]) {
    const restored = readAvatar({getItem: () => JSON.stringify({kind:'custom',name:'My friend',image})});
    assert.equal(restored.image,''); assert.equal(restored.kind,defaultAvatar.kind);
  }
});

test('saved photo framing is restored and invalid framing is constrained', () => {
  const restored = value => readAvatar({getItem: () => JSON.stringify(value)});
  assert.deepEqual([restored({imageX:12,imageY:21,imageZoom:1.5}).imageX,restored({imageX:12,imageY:21,imageZoom:1.5}).imageY,restored({imageX:12,imageY:21,imageZoom:1.5}).imageZoom],[12,21,1.5]);
  const invalid = restored({imageX:-20,imageY:120,imageZoom:20});
  assert.deepEqual([invalid.imageX,invalid.imageY,invalid.imageZoom],[0,100,2]);
});
