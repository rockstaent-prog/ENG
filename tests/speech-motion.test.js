import test from 'node:test';
import assert from 'node:assert/strict';
import { mouthShape, speechPosition } from '../src/speech-motion.js';

test('speech shapes distinguish closed, open, rounded and stretched lips', () => {
  for (const c of ['m','B','p',' ','.','']) assert.equal(mouthShape(c),0);
  assert.equal(mouthShape('a'),2);assert.equal(mouthShape('O'),3);assert.equal(mouthShape('w'),3);
  assert.equal(mouthShape('e'),4);assert.equal(mouthShape('i'),4);assert.equal(mouthShape('t'),1);
});

test('word events reset the mouth position and close lips at the end of a word', () => {
  const cue={text:'Hello moon',index:6,length:4,at:1000,boundary:true};
  assert.deepEqual(speechPosition(cue,1000),{index:6,shape:0});
  assert.equal(speechPosition(cue,1110).shape,3);
  assert.equal(speechPosition(cue,1500).shape,0);
  assert.equal(speechPosition(null,1000).shape,0);
});

test('an estimated timeline works without boundary events and stops after the text', () => {
  const cue={text:'awe',index:0,at:1000,boundary:false};
  assert.equal(speechPosition(cue,999).shape,0);
  assert.equal(speechPosition(cue,1000).shape,2);
  assert.equal(speechPosition(cue,1110).shape,3);
  assert.equal(speechPosition(cue,1400).shape,0);
});
