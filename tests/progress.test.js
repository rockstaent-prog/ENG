import test from 'node:test';
import assert from 'node:assert/strict';
import { awardProgress, initialProgress, lessons, readProgress, streak, localDay } from '../src/data.js';
import { guidedReply } from '../src/conversation.js';

test('lesson completion awards XP, unlocks once and retains mistakes for review', () => {
  const day = new Date(2026, 9, 16, 12);
  const result = awardProgress(structuredClone(initialProgress), 'hello', 4, 5, [lessons[0].questions[0]], day);
  assert.equal(result.xp, 30);
  assert.equal(result.history['2026-10-16'], 30);
  assert.deepEqual(result.completed, ['hello']);
  assert.equal(result.best.hello, 80);
  assert.equal(result.mistakes.length, 1);
  const replay = awardProgress(result, 'hello', 5, 5, [], day);
  assert.equal(replay.completed.length, 1);
  assert.equal(replay.best.hello, 100);
  assert.equal(replay.mistakes.length, 0);
});

test('review removes corrected mistakes and retains failed ones', () => {
  const p = { ...structuredClone(initialProgress), mistakes: lessons[0].questions.slice(0, 2) };
  const result = awardProgress(p, 'review', 1, 2, [p.mistakes[1]]);
  assert.equal(result.mistakes.length, 1);
  assert.equal(result.mistakes[0].prompt, p.mistakes[1].prompt);
  assert.deepEqual(result.completed, []);
  assert.equal(awardProgress(result, 'review', 1, 1, []).mistakes.length, 0);
});

test('streak includes yesterday before today is studied and breaks on a missing day', () => {
  const now = new Date(2026, 9, 16, 0, 10);
  assert.equal(localDay(now), '2026-10-16');
  assert.equal(streak({'2026-10-15': 30, '2026-10-14': 20}, now), 2);
  assert.equal(streak({'2026-10-16': 10, '2026-10-15': 30, '2026-10-13': 20}, now), 2);
  assert.equal(streak({'2026-10-14': 20}, now), 0);
});

test('corrupt or unavailable local storage recovers without crashing', () => {
  for (const value of ['oops', 'null', '{}', '{"xp":-1}', JSON.stringify({...initialProgress, history: []})]) assert.deepEqual(readProgress({ getItem: () => value }), initialProgress);
  assert.deepEqual(readProgress({getItem() {throw new Error('Storage unavailable');}}), initialProgress);
});

test('every lesson has five answerable questions and unique vocabulary', () => {
  for (const l of lessons) {
    assert.equal(l.questions.length, 5);
    for (const q of l.questions) {
      if (q.type === 'choice') assert.ok(q.options.includes(q.answer));
      else assert.deepEqual([...q.words].sort(), [...q.answer].sort());
    }
  }
});

test('damaged saved reviews and numeric records are repaired without losing valid progress', () => {
  const question = lessons[0].questions[0];
  const stored = { completed:['hello','hello','missing'], xp:35, history:{'2026-10-16':35,'2026-10-15':{},bad:20}, best:{hello:80,review:-1,missing:100}, mistakes:[{type:'order',prompt:'bad',words:[{}],answer:[{}]},{prompt:question.prompt,options:[{}]},null] };
  const progress = readProgress({getItem:()=>JSON.stringify(stored)});
  assert.deepEqual(progress.completed,['hello']);
  assert.equal(progress.xp,35);
  assert.deepEqual(progress.history,{'2026-10-16':35});
  assert.deepEqual(progress.best,{hello:80});
  assert.deepEqual(progress.mistakes,[question]);
});

test('payment and ticket choices advance the conversation instead of repeating an earlier question', () => {
  for (const text of ["I'll pay by card.",'Can I pay in cash?','Cash, please.']) assert.match(guidedReply('cafe',text).reply,/Here's your drink/);
  assert.match(guidedReply('travel','I need a ticket for the station.').reply,/machine inside the station/);
});

test('guided conversations respond to drink, temperature, directions and introduction', () => {
  assert.match(guidedReply('cafe', "I'd like a tea, please.").reply, /tea.*hot or iced/);
  assert.match(guidedReply('cafe', 'Iced, please.').reply, /anything to eat/);
  assert.match(guidedReply('cafe', 'No, thank you. How much is it?').reply, /four dollars/);
  assert.match(guidedReply('travel', 'Where is the station?').reply, /two blocks/);
  assert.match(guidedReply('friends', 'My name is Hana.').reply, /Where are you from/);
  assert.equal(guidedReply('cafe', 'something unusual').mode, 'guided');
});
