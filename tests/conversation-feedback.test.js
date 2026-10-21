import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationFeedback } from '../src/conversation-feedback.js';

test('concrete grammar mistakes receive meaning-preserving corrections with Japanese explanations',()=>{
  const examples=[['I from Japan.',"I'm from Japan."],['I goed to Kyoto yesterday.','I went to Kyoto yesterday.'],["I didn't went home.","I didn't go home."],['My name Hana.','My name is Hana.'],['I have 20 years old.',"I'm 20 years old."],['I like swim.','I like swimming.'],['Where station?','Where is the station?'],['I am agree.','I agree.']];
  for(const [input,expected] of examples){
    const feedback=conversationFeedback(input,'friends');
    assert.equal(feedback.correction.suggested,expected);assert.equal(feedback.correction.original,input);
    assert.match(feedback.correction.explanation,/[ぁ-んァ-ン一-龯]/);
  }
});

test('correct expressions, emphatic past, embedded questions and mass-noun orders are not marked wrong',()=>{
  for(const text of ["I'd like a coffee, please.",'I did go yesterday.','I like to play tennis.','My name is Hana.','My name was Hana.','I am going home.','I agree.','I want some water.','I have a twenty-year-old brother.',"I don't know where the station is."]){
    assert.equal(conversationFeedback(text,'cafe').correction,null,text);
  }
});

test('natural alternatives preserve negation, quantities and drink modifiers',()=>{
  assert.equal(conversationFeedback('I want coffee','cafe').natural.text,"I'd like a coffee, please.");
  assert.equal(conversationFeedback('Water, please.','cafe').natural.text,"I'd like some water, please.");
  assert.equal(conversationFeedback('Where station?','travel').natural.text,'How can I get to the station?');
  assert.equal(conversationFeedback('I from Japan.','friends').natural.text,"I'm from Japan. How about you?");
  for(const input of ["I don't want coffee.",'I want two coffees.','I want hot coffee.','I want a large coffee.','I want coffee without sugar.','I want coffee and tea.','I like coffee.',"I'd like a coffee, please."]){
    assert.equal(conversationFeedback(input,'cafe').natural,null,input);
  }
});

test('word-specific sound tips contain no invented pronunciation score or error diagnosis',()=>{
  const tip=conversationFeedback('Thank you.','friends');
  assert.equal(tip.pronunciation.word,'thank');assert.equal(tip.pronunciation.lessonId,'th');
  const pair=conversationFeedback('Turn right at the light.','travel');
  assert.equal(pair.pronunciation.lessonId,'rl');assert.match(pair.pronunciation.tip,/R.*L/);
  const generic=conversationFeedback('My dog is happy.');
  assert.equal(generic.pronunciation.word,'My dog is happy.');assert.equal(generic.pronunciation.lessonId,'stress');
  for(const feedback of [tip,pair,generic]){
    assert.equal(Object.hasOwn(feedback,'score'),false);
    assert.doesNotMatch(feedback.pronunciation.tip,/間違って|発音できていません|正解率|点数/);
  }
  for(const input of [null,{},'', 'ありがとう'])assert.equal(conversationFeedback(input),null);
});
