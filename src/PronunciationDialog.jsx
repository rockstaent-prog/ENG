import React, { useEffect, useRef } from 'react';
import Pronunciation from './Pronunciation';

export default function PronunciationDialog({lessonId,onClose}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const before=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';dialog.current?.focus();
    return()=>{document.body.style.overflow=overflow;before?.focus();};
  },[]);
  function keydown(event){
    if(event.key==='Escape'){event.preventDefault();onClose();return;}
    if(event.key!=='Tab')return;
    const items=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),audio,summary')].filter(node=>node.getClientRects().length);
    const first=items[0],last=items.at(-1);
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  return <div className="pronunciation-dialog-backdrop"><section className="pronunciation-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pronunciation-dialog-title" onKeyDown={keydown}><header><h2 id="pronunciation-dialog-title">会話で使った音を練習</h2><button className="button secondary" onClick={onClose}>会話に戻る</button></header><Pronunciation initialLesson={lessonId}/></section></div>;
}
