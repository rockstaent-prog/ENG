import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAvatar } from '../src/avatar.js';
import { avatarLibraryKey, readAvatarLibrary, keepAvatar, writeAvatarLibrary } from '../src/avatar-library.js';

const photo = (name, data = 'YQ==') => ({...defaultAvatar, kind:'custom', name, image:`data:image/png;base64,${data}`});

test('library restores multiple partners and their own voice/framing preferences', () => {
  const first = {...photo('Nora'), imageY:23, imageZoom:1.5, photoMode:'crop', voiceURI:'voice-one'};
  const second = {...photo('Sara','Yg=='), voiceURI:'voice-two'};
  const entries = keepAvatar(keepAvatar([],first,'one'),second,'two');
  const storage = new Map();
  writeAvatarLibrary({setItem:(key,value) => storage.set(key,value)},entries);
  assert.deepEqual(readAvatarLibrary({getItem:key => storage.get(key)}),entries);
  assert.ok(storage.has(avatarLibraryKey));
  const renamed = keepAvatar(entries,{...first,name:'Norah'},'unused');
  assert.equal(renamed.length,2); assert.equal(renamed[0].id,'one');
  assert.equal(renamed[0].avatar.name,'Norah'); assert.deepEqual(renamed[1],entries[1]);
  assert.equal(entries[0].avatar.name,'Nora','updates do not mutate the existing collection');
});

test('old single custom avatar can be retained and invalid saved entries cannot load', () => {
  const old = photo('Old partner');
  assert.deepEqual(keepAvatar([],old,'legacy'),[{id:'legacy',avatar:old}]);
  for (const raw of ['null','{}','broken']) assert.deepEqual(readAvatarLibrary({getItem:() => raw}),[]);
  assert.deepEqual(readAvatarLibrary({getItem(){throw new Error('denied');}}),[]);
  const entries = [{id:'good',avatar:old},{id:'duplicate-photo',avatar:old},{id:'good',avatar:photo('Other','Yg==')},{id:'remote',avatar:{...old,image:'https://example.org/person.jpg'}},null,{id:'<unsafe>',avatar:photo('Other','Yg==')}];
  assert.deepEqual(readAvatarLibrary({getItem:() => JSON.stringify(entries)}),[{id:'good',avatar:old}]);
});

test('library limits and storage failure preserve previously saved partners', () => {
  let entries=[];
  for(let i=0;i<8;i++) entries=keepAvatar(entries,photo(String(i),Buffer.from(String(i)).toString('base64')),`id-${i}`);
  assert.throws(()=>keepAvatar(entries,photo('Ninth','dGVzdA=='),'ninth'),/8人/);
  assert.equal(entries.length,8);
  const huge=Array.from({length:3},(_,i)=>({id:`big-${i}`,avatar:photo(String(i),'a'.repeat(499900)+String(i))}));
  assert.throws(()=>keepAvatar(huge,photo('extra','dGVzdA=='.repeat(100)),'extra'),/容量/);
  const storage={setItem(){throw new Error('quota');}};
  assert.throws(()=>writeAvatarLibrary(storage,entries),/保存できません/);
  assert.equal(entries.length,8);
});
