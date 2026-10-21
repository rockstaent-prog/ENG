import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mic, Square, Volume2 } from 'lucide-react';
import { pronunciationLessons, pronunciationStorageKey, readPronunciationProgress } from './pronunciation';
import { readAvatar } from './avatar';
import { speak, cancelSpeech } from './speech';
import usePronunciationRecording from './usePronunciationRecording';
import './pronunciation.css';

export default function Pronunciation({initialLesson=null}) {
  const [selected,setSelected]=useState(()=>pronunciationLessons.some(lesson=>lesson.id===initialLesson)?initialLesson:null),[index,setIndex]=useState(0),[completed,setCompleted]=useState(()=>readPronunciationProgress({getItem:key=>localStorage.getItem(key)}));
  const [storageError,setStorageError]=useState(false),[audioError,setAudioError]=useState(''),[playback,setPlayback]=useState(''),[checked,setChecked]=useState(false);
  const speechSession=useRef(0), ownAudio=useRef(null), heading=useRef(null), exampleHeading=useRef(null);
  const lesson=pronunciationLessons.find(item=>item.id===selected),example=lesson?.examples[index];
  const recording=usePronunciationRecording(`${selected}:${index}`);
  const recordingBusy=['requesting','recording'].includes(recording.status);
  useEffect(()=>{try{localStorage.setItem(pronunciationStorageKey,JSON.stringify(completed));setStorageError(false);}catch{setStorageError(true);}},[completed]);
  useEffect(()=>{(lesson&&index>0?exampleHeading:heading).current?.focus();return ()=>{speechSession.current++;cancelSpeech();ownAudio.current?.pause();};},[selected,index]);
  function stopModel(){speechSession.current++;cancelSpeech();setPlayback('');}
  function playModel(slow=false){
    stopModel();ownAudio.current?.pause();setAudioError('');
    const id=++speechSession.current;
    const avatar=readAvatar({getItem:key=>localStorage.getItem(key)});
    const result=speak(example.text,{femaleOnly:true,locale:'en-US',voiceURI:avatar.voiceURI,rate:slow?0.65:0.9,
      onStart:()=>{if(speechSession.current===id)setPlayback(slow?'ゆっくり再生中':'お手本を再生中');},
      onEnd:()=>{if(speechSession.current===id)setPlayback('');},
      onError:()=>{if(speechSession.current===id){setPlayback('');setAudioError('お手本を再生できませんでした。端末の音声設定を確認してください。');}},
      onUnavailable:()=>{if(speechSession.current===id){setPlayback('');setAudioError('女性の英語音声が見つかりません。端末に女性の英語音声を追加するか、別のブラウザでお試しください。');}},
    });
    if(result==='queued')setPlayback('女性の声を準備しています…');
    if(result==='unsupported')setAudioError('このブラウザではお手本を再生できません。口や舌の説明を見ながら練習できます。');
  }
  function move(next){stopModel();ownAudio.current?.pause();setAudioError('');setChecked(false);setIndex(next);}
  function open(id){stopModel();setAudioError('');setChecked(false);setIndex(0);setSelected(id);}
  function finish(){setCompleted(previous=>previous.includes(lesson.id)?previous:[...previous,lesson.id]);stopModel();ownAudio.current?.pause();setChecked(false);setSelected(null);}
  return <div className="pronunciation-workspace">
    {storageError && <p className="notice" role="alert">このブラウザでは発音の練習記録を保存できません。練習は続けられます。</p>}
    {!lesson ? <><div className="pronunciation-welcome"><Volume2 size={30}/><div><h2 tabIndex={-1} ref={heading}>聞く → まねする → 聞き比べる</h2><p>口と舌の使い方を日本語で確認し、単語から短い英文へ。アメリカ英語を基本に練習します。</p><span>{completed.length} / {pronunciationLessons.length} レッスン練習済み</span></div></div><div className="pronunciation-list">{pronunciationLessons.map((item,i)=><button className="pronunciation-lesson" key={item.id} onClick={()=>open(item.id)} aria-label={`${item.title}を練習する`}><span className="pronunciation-number">{completed.includes(item.id)?<Check size={22}/>:String(i+1).padStart(2,'0')}</span><span><small>{item.sound}</small><strong>{item.title}</strong><span>{item.summary}</span></span><ArrowRight size={19}/></button>)}</div><p className="pronunciation-note">お手本は端末の読み上げ音声を使うため、声やアクセントは端末によって異なります。口の説明を見ながら、自分のペースで練習しましょう。</p></> : <>
      <button className="text-button pronunciation-back" onClick={()=>{stopModel();ownAudio.current?.pause();setChecked(false);setSelected(null);}}><ArrowLeft size={16}/>発音レッスン一覧へ</button>
      <section className="pronunciation-guide"><span className="eyebrow">口と舌の使い方</span><h2 tabIndex={-1} ref={heading}>{lesson.title}</h2><ol>{lesson.steps.map(step=><li key={step}>{step}</li>)}</ol></section>
      <section className="pronunciation-practice" aria-label="発音の練習"><div className="pronunciation-step">声に出す練習 {index+1} / {lesson.examples.length}</div><h3 lang="en" tabIndex={-1} ref={exampleHeading}>{example.text}</h3><p className="pronunciation-ipa" lang="en">{example.ipa}</p><p>{example.meaning}</p>{example.rhythm&&<p className="pronunciation-rhythm" lang="en">{example.rhythm}</p>}<p className="pronunciation-focus">{example.focus}</p>
        <div className="pronunciation-audio-buttons"><button className="button primary" disabled={recordingBusy} onClick={()=>playModel(false)}><Volume2 size={18}/>お手本を聞く</button><button className="button secondary" disabled={recordingBusy} onClick={()=>playModel(true)}><Volume2 size={18}/>ゆっくり聞く</button></div>
        <div className="pronunciation-playback" role="status">{playback}{playback&&<button className="text-button" onClick={stopModel}><Square size={14}/>お手本を止める</button>}</div>
        {audioError&&<p className="notice" role="alert">{audioError}</p>}
        <div className="pronunciation-recording"><h4>自分の声と聞き比べよう</h4><p>お手本をまねして録音し、聞き直せます。録音はこの画面だけで使い、送信・保存しません。自動採点は行いません。</p><button className="button secondary" disabled={recording.status==='requesting'} onClick={()=>{stopModel();ownAudio.current?.pause();if(recording.status==='recording')recording.stop();else recording.start();}}>{recording.status==='recording'?<><Square size={17}/>録音を止める</>:<><Mic size={17}/>{recording.status==='requesting'?'マイクを準備しています…':recording.url?'もう一度録音する':'自分の声を録音する'}</>}</button><span role="status">{recording.status==='recording'?'録音中…（最大15秒）':''}</span>{recording.error&&<p className="notice" role="alert">{recording.error}</p>}{recording.url&&<audio ref={ownAudio} controls src={recording.url} aria-label="自分の発音を聞く" onPlay={stopModel} onError={()=>setAudioError('録音を再生できませんでした。もう一度録音するか、別のブラウザでお試しください。')}/>}
        </div>
        <label className="pronunciation-self-check"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span>{lesson.check}<small>コツを意識して、声に出して練習した</small></span></label>
        <div className="pronunciation-next"><button className="button secondary" disabled={index===0||recordingBusy} onClick={()=>move(index-1)}><ArrowLeft size={16}/>前へ</button><button className="button primary" disabled={!checked||recordingBusy} onClick={()=>index===lesson.examples.length-1?finish():move(index+1)}>{index===lesson.examples.length-1?'練習を終える':'次の練習へ'}<ArrowRight size={16}/></button></div>
      </section>
    </>}
  </div>;
}
