import React, { useEffect, useRef } from 'react';
import { X, Volume2, Square } from 'lucide-react';
import Avatar from './Avatar';

export default function AvatarFocus({ avatar, speaking, preparing, cue, onSpeak, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const before = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; before?.focus(); };
  }, []);
  function keydown(event) {
    if (event.key === 'Escape') onClose();
    if (event.key !== 'Tab') return;
    const [first, last] = dialog.current.querySelectorAll('button');
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {event.preventDefault(); last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
  }
  return <div className="mobile-dialog-backdrop" onClick={e => {if(e.currentTarget === e.target) onClose();}}><section className="mobile-dialog avatar-focus-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-focus-title" tabIndex={-1} ref={dialog} onKeyDown={keydown}>
    <button className="icon-button dialog-close" aria-label="アバターの拡大を閉じる" onClick={onClose}><X size={22}/></button>
    <h2 id="avatar-focus-title">{avatar.name || 'Emma'}と話そう</h2>
    <Avatar avatar={avatar} className="focused-character stage-character" speaking={speaking} cue={cue} animated/>
    <p className="install-description">{speaking ? '話しています…' : preparing ? '女性の声を探しています…' : '声を聞いて、英語をまねしてみよう。'}</p>
    <button className="button primary install-now" onClick={onSpeak}>{speaking || preparing ? <><Square size={18}/>読み上げを止める</> : <><Volume2 size={18}/>あいさつを聞く</>}</button>
  </section></div>;
}
