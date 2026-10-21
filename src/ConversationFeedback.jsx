import React from 'react';
import { Volume2 } from 'lucide-react';
import './conversation-feedback.css';

export default function ConversationFeedback({feedback,voice,onSpeak,onPractice,busy}) {
  if(!feedback)return null;
  const {correction,natural,pronunciation}=feedback;
  return <section className="conversation-feedback" aria-label="今回の話し方のヒント">
    <h3>今回のひとことメモ</h3>
    {voice&&<p className="feedback-source">聞き取った文をもとにしたヒントです。</p>}
    {correction&&<div className="feedback-correction"><h4>ここを直すと伝わりやすい</h4><p lang="en" className="feedback-original">{correction.original}</p><p lang="en" className="feedback-example">{correction.suggested}</p><p>{correction.explanation}</p><button className="text-button" onClick={()=>onSpeak(correction.suggested)}><Volume2 size={14}/>直した言い方を聞く</button></div>}
    {natural&&<div className="feedback-natural"><h4>こう言うとスムーズだよ</h4><p lang="en" className="feedback-example">{natural.text}</p><p>{natural.explanation}</p><button className="text-button" onClick={()=>onSpeak(natural.text)}><Volume2 size={14}/>自然な言い方を聞く</button></div>}
    <details className="feedback-pronunciation"><summary>発音のコツ：<span lang="en">{pronunciation.word}</span></summary><p lang="en" className="feedback-word">{pronunciation.word} <span>{pronunciation.ipa}</span></p><p>{pronunciation.tip}</p><div><button className="text-button" onClick={()=>onSpeak(pronunciation.word,{rate:0.65})}><Volume2 size={14}/>ゆっくりお手本を聞く</button><button className="text-button" disabled={busy} onClick={()=>onPractice(pronunciation.lessonId)}>詳しく練習する</button></div></details>
    <p className="feedback-limit">音声そのものの発音の正確さは判定していません。</p>
  </section>;
}
