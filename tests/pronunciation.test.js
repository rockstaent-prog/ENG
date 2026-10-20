import test from 'node:test';
import assert from 'node:assert/strict';
import { pronunciationLessons, readPronunciationProgress } from '../src/pronunciation.js';

test('pronunciation progress keeps known lessons once and recovers unavailable storage',()=>{
  assert.deepEqual(readPronunciationProgress({getItem:()=>JSON.stringify(['rl','unknown','th','rl',null,42])}),['rl','th']);
  for(const raw of ['{}','null','bad'])assert.deepEqual(readPronunciationProgress({getItem:()=>raw}),[]);
  assert.deepEqual(readPronunciationProgress({getItem(){throw new Error('blocked');}}),[]);
  assert.equal(new Set(pronunciationLessons.map(lesson=>lesson.id)).size,6);
});
