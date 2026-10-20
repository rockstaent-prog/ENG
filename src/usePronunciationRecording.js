import { useEffect, useRef, useState } from 'react';

export default function usePronunciationRecording(exerciseKey) {
  const session = useRef({generation:0});
  const [status,setStatus] = useState('idle'), [url,setURL] = useState(''), [error,setError] = useState('');
  function release() {
    const current=session.current; current.generation++;
    clearTimeout(current.timer);
    if(current.recorder){current.recorder.onstop=null;current.recorder.ondataavailable=null;current.recorder.onerror=null;if(current.recorder.state!=='inactive')current.recorder.stop();}
    current.stream?.getTracks().forEach(track=>track.stop());
    if(current.url) URL.revokeObjectURL(current.url);
    session.current={generation:current.generation};
  }
  useEffect(()=>{setStatus('idle');setURL('');setError('');return release;},[exerciseKey]);
  async function start() {
    release();setURL('');setError('');
    if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==='undefined') {
      setStatus('idle');setError('このブラウザでは録音できません。お手本を聞き、声に出して練習できます。');return;
    }
    setStatus('requesting');const generation=session.current.generation;
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(session.current.generation!==generation){stream.getTracks().forEach(track=>track.stop());return;}
      session.current.stream=stream;
      const mimeType=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>MediaRecorder.isTypeSupported?.(type));
      const recorder=new MediaRecorder(stream,mimeType?{mimeType}:undefined),chunks=[];
      session.current.recorder=recorder;
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onstop=()=>{
        clearTimeout(session.current.timer);stream.getTracks().forEach(track=>track.stop());
        if(session.current.generation!==generation)return;
        const blob=new Blob(chunks,{type:recorder.mimeType || chunks[0]?.type || 'audio/webm'});
        if(blob.size){const next=URL.createObjectURL(blob);session.current.url=next;setURL(next);setStatus('ready');}
        else {setStatus('idle');setError('音声を保存できませんでした。もう一度録音してください。');}
      };
      recorder.onerror=()=>{if(session.current.generation===generation){release();setStatus('idle');setError('録音が止まりました。マイクを確認して、もう一度お試しください。');}};
      recorder.start(200);setStatus('recording');
      session.current.timer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},15000);
    } catch(e) {
      if(session.current.generation!==generation)return;
      release();setStatus('idle');
      setError(e.name==='NotAllowedError' ? 'マイクの利用が許可されていません。ブラウザで許可すると録音できます。お手本だけでも練習できます。' : 'マイクを使えませんでした。端末やブラウザのマイク設定を確認してください。');
    }
  }
  function stop(){const recorder=session.current.recorder;if(recorder?.state==='recording')recorder.stop();}
  return {status,url,error,start,stop};
}
