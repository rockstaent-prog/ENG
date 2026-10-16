import test from 'node:test';
import assert from 'node:assert/strict';
import { isFemaleVoice, englishVoices, selectEnglishVoice } from '../src/voices.js';
import { speak, cancelSpeech } from '../src/speech.js';

const male={voiceURI:'david',name:'Microsoft David',lang:'en-US',default:true};
const female={voiceURI:'aria',name:'Microsoft Aria Online (Natural)',lang:'en-US'};
const another={voiceURI:'samantha',name:'Samantha',lang:'en-US',localService:true};
const unknown={voiceURI:'default',name:'System default',lang:'en-US',default:true};

test('female voice filtering excludes male, unknown and non-English voices',()=>{
  assert.deepEqual(englishVoices([male,unknown,female,{...female,lang:'ja-JP'}],true),[female]);
  assert.equal(isFemaleVoice({...female,gender:'male'}),false);
  assert.equal(isFemaleVoice({name:'Prabhat'}),false);
  assert.equal(isFemaleVoice({name:'Google UK English Male'}),false);
  assert.equal(isFemaleVoice({name:'Google UK English Female'}),true);
  assert.equal(isFemaleVoice({name:'English',voiceURI:'en-us#female_1-local'}),true);
  assert.equal(isFemaleVoice({name:'English',voiceURI:'en-us#male_1-local'}),false);
});
test('a saved male selection cannot override the female requirement',()=>{
  assert.equal(selectEnglishVoice([male,female,another],'david',true),female);
  assert.equal(selectEnglishVoice([male,female,another],'samantha',true),another);
});
test('missing female voices return no voice rather than the male system default',()=>{
  assert.equal(selectEnglishVoice([male,unknown],'david',true),null);
  assert.equal(selectEnglishVoice([], '',true),null);
});

function engine(t,initial){
  const previous=globalThis.window, played=[];
  let voices=initial;
  const synth=Object.assign(new EventTarget(),{getVoices:()=>voices,cancel(){},speak:u=>played.push(u)});
  globalThis.window={speechSynthesis:synth,SpeechSynthesisUtterance:class {constructor(text){this.text=text;}}};
  t.after(()=>{cancelSpeech();if(previous===undefined)delete globalThis.window;else globalThis.window=previous;});
  return {played,setVoices:value=>{voices=value;synth.dispatchEvent(new Event('voiceschanged'));}};
}
test('late voice loading waits for a female voice without starting a male voice',t=>{
  const state=engine(t,[male]);
  assert.equal(speak('Hello',{femaleOnly:true}),'queued');
  assert.equal(state.played.length,0);
  state.setVoices([male,female]);
  assert.equal(state.played.length,1);assert.equal(state.played[0].voice,female);
});
test('stopping a pending voice prevents a delayed utterance',t=>{
  const state=engine(t,[]);
  speak('Hello',{femaleOnly:true});cancelSpeech();state.setVoices([female]);
  assert.equal(state.played.length,0);
});
test('an unavailable female voice reports a useful failure and stays silent',async t=>{
  const state=engine(t,[male,unknown]);
  await new Promise(resolve=>speak('Hello',{femaleOnly:true,onUnavailable:resolve}));
  assert.equal(state.played.length,0);
});

test('a speech engine failure is reported without an uncaught exception',t=>{
  engine(t,[female]);
  window.speechSynthesis.speak=()=>{throw new Error('Device unavailable');};
  let reported='';
  assert.equal(speak('Hello',{femaleOnly:true,onError:e=>{reported=e.error;}}),'failed');
  assert.equal(reported,'synthesis-failed');
});

test('canceling speech detaches callbacks from the canceled utterance',t=>{
  const state=engine(t,[female]);
  speak('Hello',{femaleOnly:true,onStart(){},onEnd(){}});
  const utterance=state.played[0];
  cancelSpeech();
  assert.equal(utterance.onstart,null);assert.equal(utterance.onend,null);
});
