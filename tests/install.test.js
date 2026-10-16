import test from 'node:test';
import assert from 'node:assert/strict';
import { phonePlatform } from '../src/install.js';

test('installation guidance recognizes iPhone and desktop-mode iPad', () => {
  assert.equal(phonePlatform('iPhone OS 18_0 like Mac OS X','iPhone',5),'ios');
  assert.equal(phonePlatform('Macintosh; Intel Mac OS X','MacIntel',5),'ios');
});
test('installation guidance recognizes Android', () => {
  assert.equal(phonePlatform('Linux; Android 15; Pixel','Linux',5),'android');
});
test('desktop installation guidance does not misidentify a Mac as an iPad', () => {
  assert.equal(phonePlatform('Macintosh; Intel Mac OS X','MacIntel',0),'other');
});
