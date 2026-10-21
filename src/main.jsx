import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, House, MessageCircle, Layers, BarChart3, Flame, Zap, ChevronRight, Check, X, LockKeyhole, Star, Volume2, ArrowRight, RotateCcw, Sparkles, Coffee, Sun, Plane, ShoppingBag, Hand, Send, Mic, MicOff, Trophy, Target, Headphones, Leaf, CheckCheck, Pencil, Upload, Square } from 'lucide-react';
import { lessons, readProgress, localDay, streak, awardProgress } from './data';
import { scenes } from './conversation';
import { browserReply, requestChatReply } from './chat-client';
import Avatar from './Avatar';
import { avatarPresets, avatarStorageKey, readAvatar, prepareAvatarImage } from './avatar';
import { readAvatarLibrary, keepAvatar, writeAvatarLibrary } from './avatar-library';
import { englishVoices } from './voices';
import { speak, cancelSpeech } from './speech';
import useMobileViewport from './useMobileViewport';
import InstallApp from './InstallApp';
import AvatarFocus from './AvatarFocus';
import Pronunciation from './Pronunciation';
import './style.css';
import './avatar.css';
import './conversation-stage.css';
import './mobile.css';
import './install.css';
import './face-to-face.css';

const icons = { wave: Hand, coffee: Coffee, sun: Sun, plane: Plane, chat: MessageCircle, bag: ShoppingBag };
const staticPreview = import.meta.env.VITE_STATIC_PREVIEW === 'true';
const navigation = [{ id: 'learn', label: '学習する', icon: House }, { id: 'talk', label: '会話する', icon: MessageCircle }, { id: 'pronunciation', label: '発音', icon: Volume2 }, { id: 'words', label: '単語帳', icon: Layers }, { id: 'stats', label: '学習の記録', icon: BarChart3 }];
function Mascot({ small = false }) {
  return <svg className={`mascot ${small ? 'small' : ''}`} viewBox="0 0 240 240" fill="none" aria-hidden="true"><ellipse cx="120" cy="214" rx="63" ry="9" fill="#DAD3ED"/><path d="M63 103 48 38q-2-13 10-8l55 37M134 67l46-38q12-8 12 7l-7 73" fill="#E6AD7E"/><path d="m61 45 14 50 23-21M177 44l-30 31 25 22" fill="#F6CEAD"/><path d="M55 123c0-51 29-65 65-65s69 17 69 66c0 40-16 84-69 84S55 164 55 123Z" fill="#F2BF94"/><path d="M59 124c11-19 40-24 61-2 22-22 52-17 66 2-1 44-22 73-66 73s-61-31-61-73Z" fill="#FFF5E6"/><ellipse cx="90" cy="129" rx="5" ry="7" fill="#49404D"/><ellipse cx="150" cy="129" rx="5" ry="7" fill="#49404D"/><ellipse cx="76" cy="145" rx="10" ry="6" fill="#EFA6A0"/><ellipse cx="163" cy="145" rx="10" ry="6" fill="#EFA6A0"/><path d="m113 146 7 5 7-5M120 152v4m-10 0q10 12 20 0" stroke="#49404D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="m74 185-14 20m105-20 14 20" stroke="#E6AD7E" strokeWidth="15" strokeLinecap="round"/><path d="M91 190q29-14 59 0v32q-29-14-59 0v-32Z" fill="#8D78C2"/><path d="M120 185v31" stroke="#B3A1DC" strokeWidth="3"/><path d="m101 199 10-2m18 0 10 2m-38 8 10-2m18 0 10 2" stroke="#E7DFF8" strokeWidth="2" strokeLinecap="round"/><path d="m210 85 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#9B87CE"/><path d="m25 120 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#D7AF6F"/></svg>;
}
function App() {
  useMobileViewport();
  const [page, setPage] = useState(() => {
    const requested = new URLSearchParams(location.search).get('screen');
    return navigation.some(item => item.id === requested) ? requested : import.meta.env.MODE === 'standalone' || import.meta.env.MODE === 'mobile' ? 'talk' : 'learn';
  });
  const [progress, setProgress] = useState(() => readProgress({ getItem: key => window.localStorage.getItem(key) }));
  const [session, setSession] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const today = progress.history[localDay()] || 0;
  const next = lessons.find(l => !progress.completed.includes(l.id)) || lessons[0];
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  useEffect(() => { try { localStorage.setItem('komorebi-progress', JSON.stringify(progress)); setStorageError(false); } catch { setStorageError(true); } }, [progress]);
  function start(lesson) { setSession({ ...lesson }); }
  function finish(lesson, correct, mistakes) {
    setProgress(p => awardProgress(p, lesson.id, correct, lesson.questions.length, mistakes));
  }
  return <>
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setPage('learn'); }}><span className="brand-mark"><Leaf size={25}/></span><span>こもれび<span className="brand-sub">ENGLISH, LITTLE BY LITTLE.</span></span></a>
      <div className="sidebar-caption">MY LEARNING SPACE</div>
      <nav aria-label="メインメニュー">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined}><Icon size={21}/><span>{label}</span>{id === 'talk' && <span className="new-badge">NEW</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="small-note"><Sparkles size={19}/><p>小さな一歩が、<br/>大きな世界につながる。</p></div><div className="profile"><span className="avatar">🌱</span><div><strong>英語ビギナー</strong><small>レベル {Math.floor(progress.xp / 100) + 1} ・ 自分のペースで</small></div><span className="online-dot"/></div></div>
    </aside>
    <div className={`app-shell ${page === 'talk' ? 'conversation-shell' : ''}`}><header className="topbar"><div className="breadcrumb">マイコース <ChevronRight size={14}/><strong>英語 / はじめの一歩</strong></div><InstallApp/><div className="top-stats"><span className="language"><span>🇺🇸</span> English</span><span title="連続学習日数"><Flame size={19} className="orange"/><b>{streak(progress.history)}</b><small>日</small></span><span title="獲得したXP"><Zap size={19} className="purple"/><b>{progress.xp}</b><small>XP</small></span></div></header>
      <main className={page === 'talk' ? 'conversation-main' : undefined}>
        {storageError && <div className="notice" role="alert">このブラウザでは学習記録を保存できません。現在の画面では引き続き学習できます。</div>}
        <div className="page-heading"><div><div className="eyebrow">{page === 'learn' ? 'A LITTLE PRACTICE, A BIG WORLD.' : page === 'talk' ? 'LET’S HAVE A CONVERSATION.' : page === 'pronunciation' ? 'LISTEN, TRY, AND SAY IT.' : page === 'words' ? 'WORDS THAT OPEN DOORS.' : 'EVERY LITTLE STEP COUNTS.'}</div><h1>{page === 'learn' ? '今日も、ひとつ成長しよう。' : page === 'talk' ? '英語で、話してみよう。' : page === 'pronunciation' ? '英語の音を、口から覚えよう。' : page === 'words' ? 'ことばを、あなたのものに。' : '積み重ねた、小さな一歩。'}</h1><p>{page === 'learn' ? '1日5分。あなたのペースで、英語のある毎日へ。' : page === 'talk' ? '間違えても大丈夫。まずは、ひとことから。' : page === 'pronunciation' ? '口と舌のコツを知って、お手本をまねしてみよう。' : page === 'words' ? '声に出して、くり返して。覚えたことばが世界を広げる。' : '昨日の自分より、少しだけ遠くへ。'}</p></div><div className="date-chip"><Sun size={16}/> 今日もいい学びを</div></div>
        <div className={`main-grid ${page === 'talk' ? 'conversation-grid' : page === 'pronunciation' ? 'pronunciation-grid' : ''}`}><div className="primary-column">
          {page === 'learn' && <>
            <section className="hero"><div className="hero-copy"><span className="pill"><span/> LET’S KEEP GROWING</span><h2>「わかった！」を、<br/>今日もひとつ。</h2><p>新しいことばと出会う、小さな冒険。<br/>きょうのレッスンをはじめよう。</p><button className="button primary" onClick={() => start(next)}>レッスンをはじめる <ArrowRight size={17}/></button><span className="hero-time">約3分 ・ 5問のミニレッスン</span></div><div className="hero-art"><span className="art-note">You’ve got this!</span><Mascot/><span className="art-dot one"/><span className="art-dot two"/></div></section>
            <div className="section-heading"><div><h2>学びの道のり <span className="section-tag">はじめの一歩</span></h2><p>日常で使える英語を、ひとつずつ。</p></div><span className="muted small-text">{progress.completed.length} / {lessons.length} 完了</span></div>
            <section className="lesson-list" aria-label="レッスン一覧">{lessons.map((lesson, index) => {
              const done = progress.completed.includes(lesson.id), available = index === 0 || progress.completed.includes(lessons[index - 1].id), current = available && !done;
              const Icon = icons[lesson.icon];
              return <article className={`lesson-card ${current ? 'current' : ''} ${!available ? 'locked' : ''}`} key={lesson.id}><div className={`lesson-icon ${lesson.color}`}><Icon size={25}/></div><div className="lesson-info"><div className="lesson-label">LESSON {String(index + 1).padStart(2, '0')} {current && <span>学習中</span>}{done && <span className="done-label">完了</span>}</div><h3>{lesson.title}</h3><p>{lesson.subtitle}</p></div><div className="lesson-action">{done ? <button className="completed-button" onClick={() => start(lesson)} aria-label={`${lesson.title}を復習`}><CheckCheck size={19}/><span>もう一度</span></button> : available ? <button className="round-button" onClick={() => start(lesson)} aria-label={`${lesson.title}をはじめる`}><ArrowRight size={20}/></button> : <span className="locked-icon" aria-label="前のレッスンを完了すると解放"><LockKeyhole size={18}/></span>}</div></article>;
            })}</section>
            <section className="conversation-banner"><div className="banner-icon"><MessageCircle size={26}/></div><div><span className="eyebrow">MAKE IT A CONVERSATION</span><h3>覚えた英語を、使ってみよう。</h3><p>気軽な英会話で「話せた！」を体験。</p></div><button className="button secondary" onClick={() => setPage('talk')}>会話する <ArrowRight size={16}/></button></section>
          </>}
          {page === 'talk' && <Conversation/>}
          {page === 'pronunciation' && <Pronunciation/>}
          {page === 'words' && <Words progress={progress}/>}
          {page === 'stats' && <Stats progress={progress}/>}
        </div><aside className="right-column">
          <section className="side-card goal-card"><div className="card-heading"><h3><Target size={18}/>今日の目標</h3><span className="soft-tag">1日 30 XP</span></div><div className="goal-value"><b>{today}</b><span>/ 30 XP</span>{today >= 30 && <span className="goal-check"><Check size={15}/>達成！</span>}</div><div className="progress-track"><div style={{ width: `${Math.min(100, today / 30 * 100)}%` }}/></div><p>{today >= 30 ? '今日の一歩、しっかり積み重なりました。' : 'レッスンをひとつ終えて、目標に近づこう。'}</p><div className="week">{Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const active = !!progress.history[localDay(d)]; return <div key={i}><span>{['日', '月', '火', '水', '木', '金', '土'][d.getDay()]}</span><span className={`day-dot ${active ? 'done' : ''} ${i === 6 ? 'today' : ''}`}>{active ? <Check size={14}/> : i === 6 ? <span/> : '·'}</span></div>; })}</div></section>
          <section className="side-card review-card"><span className="card-illustration"><BookOpen size={30}/><Sparkles size={15}/></span><h3>できた！を、忘れない。</h3><p>{progress.mistakes.length ? `${progress.mistakes.length}問の苦手を、いっしょにおさらい。` : 'くり返すたび、英語がもっと自分のものに。'}</p><button className="button full secondary" onClick={() => start({ id: 'review', title: 'おさらいレッスン', questions: progress.mistakes.length ? progress.mistakes : lessons[0].questions })}><RotateCcw size={15}/> おさらいする</button></section>
          <section className="daily-phrase"><div className="eyebrow"><Leaf size={14}/> TODAY’S LITTLE PHRASE</div><blockquote>“Little by little,<br/>a little becomes a lot.”</blockquote><p>少しずつが、やがて大きな力になる。</p><button className="text-button" onClick={() => speak('Little by little, a little becomes a lot.')}><Volume2 size={15}/> 発音を聞く</button></section>
          <footer className="side-footer">こもれびと、英語のある毎日。<br/><span>Made for your little moments.</span></footer>
        </aside></div>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="モバイルメニュー">{navigation.map(({id,label,icon:Icon}) => <button key={id} onClick={() => setPage(id)} className={page === id ? 'active' : ''}><Icon size={20}/><span>{label}</span></button>)}</nav>
    {session && <Lesson key={session.id} lesson={session} onClose={() => setSession(null)} onFinish={finish}/>}
  </>;
}

function Lesson({ lesson, onClose, onFinish }) {
  const [index, setIndex] = useState(0), [selected, setSelected] = useState(''), [tokens, setTokens] = useState([]), [checked, setChecked] = useState(false), [correct, setCorrect] = useState(0), [mistakes, setMistakes] = useState([]), [done, setDone] = useState(false), [confirmExit, setConfirmExit] = useState(false);
  const modalRef = useRef(null);
  const q = lesson.questions[index];
  const isCorrect = q.type === 'choice' ? selected === q.answer : tokens.map(i => q.words[i]).join(' ') === q.answer.join(' ');
  useEffect(() => { const before = document.activeElement; modalRef.current?.focus(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = overflow; before?.focus(); }; }, []);
  const close = () => { if (!done && index + Number(checked) > 0) setConfirmExit(true); else onClose(); };
  function check() { if (checked || !(q.type === 'choice' ? selected : tokens.length)) return; setChecked(true); if (isCorrect) setCorrect(v => v + 1); else setMistakes(v => [...v, q]); }
  function next() {
    if (index === lesson.questions.length - 1) { onFinish(lesson, correct, mistakes); setDone(true); }
    else { setIndex(v => v + 1); setSelected(''); setTokens([]); setChecked(false); }
  }
  function keydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') { const items = [...modalRef.current.querySelectorAll('button:not(:disabled)')]; const first = items[0], last = items.at(-1); if (e.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
  }
  return <div className="modal-backdrop"><section className="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-title" tabIndex={-1} ref={modalRef} onKeyDown={keydown}>
    <header className="lesson-top"><button className="icon-button" onClick={close} aria-label="レッスンを閉じる"><X/></button><div className="progress-track"><div style={{width: `${done ? 100 : (index + Number(checked)) / lesson.questions.length * 100}%`}}/></div><span>{done ? lesson.questions.length : index + 1} / {lesson.questions.length}</span></header>
    {confirmExit ? <div className="result"><h2 id="lesson-title">レッスンを終了しますか？</h2><p>途中の回答は保存されません。</p><button className="button primary" onClick={() => setConfirmExit(false)}>学習を続ける</button><button className="text-button" onClick={onClose}>終了する</button></div> : done ? <div className="result"><div className="result-trophy"><Trophy size={48}/></div><div className="eyebrow">ONE MORE LITTLE STEP!</div><h2 id="lesson-title">よくがんばりました！</h2><p>今日の小さな一歩が、未来の自信に。</p><div className="result-stats"><div><Zap size={23}/><b>+{correct * 5 + 10}</b><span>獲得 XP</span></div><div><Target size={23}/><b>{Math.round(correct / lesson.questions.length * 100)}%</b><span>正答率</span></div></div><p>{correct === lesson.questions.length ? '全問正解！すばらしいですね。' : '間違えた問題は「おさらいする」から復習できます。'}</p><button className="button primary" onClick={onClose}>学びの道のりに戻る <ArrowRight size={17}/></button></div> : <>
    <div className="question-area"><div className="eyebrow">{lesson.title} ・ {q.type === 'choice' ? 'CHOOSE THE ANSWER' : 'BUILD A SENTENCE'}</div><h2 id="lesson-title">{q.prompt}</h2><p className="muted">{q.type === 'choice' ? '正しい答えをひとつ選んでください。' : '単語をタップして、正しい順番に並べてください。'}</p>
    {q.type === 'choice' ? <div className="answer-options">{q.options.map((option, i) => <button key={option} disabled={checked} className={`answer-option ${selected === option ? 'selected' : ''} ${checked && option === q.answer ? 'correct' : ''} ${checked && selected === option && !isCorrect ? 'incorrect' : ''}`} onClick={() => setSelected(option)}><span>{i + 1}</span>{option}{checked && option === q.answer && <Check size={18}/>}</button>)}</div> : <><div className="sentence" aria-label="選択した単語">{tokens.length === 0 && <span className="muted">ここに英文ができあがります</span>}{tokens.map((i, n) => <button key={i} disabled={checked} onClick={() => setTokens(v => v.filter((_, idx) => idx !== n))}>{q.words[i]}</button>)}</div><div className="word-bank">{q.words.map((word, i) => <button key={i} disabled={checked || tokens.includes(i)} onClick={() => setTokens(v => [...v, i])}>{word}</button>)}</div></>}
    </div><div className={`answer-footer ${checked ? isCorrect ? 'success' : 'retry' : ''}`} aria-live="polite"><div>{checked && <><h3>{isCorrect ? <><Check size={21}/> そのとおり！</> : <>正解：{Array.isArray(q.answer) ? q.answer.join(' ') : q.answer}</>}</h3><p>{q.note}</p><button className="text-button" onClick={() => speak(q.english)}><Volume2 size={15}/> 発音を聞く</button></>}</div><button className="button primary" disabled={!checked && !(q.type === 'choice' ? selected : tokens.length)} onClick={checked ? next : check}>{checked ? index === lesson.questions.length - 1 ? '結果を見る' : '次へ進む' : '答え合わせ'}<ArrowRight size={17}/></button></div></>}
  </section></div>;
}

function Conversation() {
  const [scene, setScene] = useState('cafe'), [messages, setMessages] = useState([]), [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [mode, setMode] = useState('guided'), [listening, setListening] = useState(false), [showTranslation, setShowTranslation] = useState(true);
  const [avatar, setAvatar] = useState(() => readAvatar({ getItem: key => window.localStorage.getItem(key) }));
  const [savedAvatars, setSavedAvatars] = useState(() => readAvatarLibrary({getItem:key => window.localStorage.getItem(key)}));
  const savedAvatarsRef = useRef(savedAvatars);
  const [libraryError, setLibraryError] = useState(''), [deletingAvatar, setDeletingAvatar] = useState(null);
  const [avatarSettings, setAvatarSettings] = useState(false), [speaking, setSpeaking] = useState(false), [voices, setVoices] = useState([]), [avatarError, setAvatarError] = useState(''), [uploading, setUploading] = useState(false), [avatarSaveError, setAvatarSaveError] = useState(false);
  const [speechCue, setSpeechCue] = useState(null);
  const [preparingVoice, setPreparingVoice] = useState(false);
  const [avatarFocus, setAvatarFocus] = useState(false);
  const [historyView, setHistoryView] = useState(false);
  const [browserOnly, setBrowserOnly] = useState(staticPreview), [canPractice, setCanPractice] = useState(false);
  const speechId = useRef(0), avatarRef = useRef(avatar), uploadRef = useRef(0);
  avatarRef.current = avatar;
  const scrollRef = useRef(null), recognition = useRef(null), request = useRef(null), inputRef = useRef(null), sending = useRef(false);
  const avatarName = avatar.name.trim() || 'Emma';
  const sceneInfo = { ...scenes[scene], role: scene === 'friends' ? '新しい友だち' : scenes[scene].role, intro: scenes[scene].intro.replace(/\bAlex\b/g, () => avatarName), translation: scenes[scene].translation.replace(/アレックス/g, () => avatarName) };
  const suggestions = messages.at(-1)?.role === 'assistant' ? messages.at(-1).suggestions : sceneInfo.suggestions;
  const femaleVoices = englishVoices(voices, true);
  const selectedVoiceURI = femaleVoices.some(v => v.voiceURI === avatar.voiceURI) ? avatar.voiceURI : '';
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    if (!staticPreview) fetch('/api/chat/status', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (!controller.signal.aborted && data?.mode === 'ai') setMode('ai'); }).catch(() => {}).finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); request.current?.abort(); stopListening(); };
  }, []);
  useEffect(() => {
    const synth = window.speechSynthesis;
    const updateVoices = () => setVoices(englishVoices(synth?.getVoices() || []));
    updateVoices(); synth?.addEventListener('voiceschanged', updateVoices);
    return () => { speechId.current++; uploadRef.current++; cancelSpeech(); synth?.removeEventListener('voiceschanged', updateVoices); };
  }, []);
  useEffect(() => { try { localStorage.setItem(avatarStorageKey, JSON.stringify(avatar)); setAvatarSaveError(false); } catch { setAvatarSaveError(true); } }, [avatar]);
  useEffect(() => {
    if (avatar.kind !== 'custom') return;
    try {
      const next = keepAvatar(savedAvatarsRef.current, avatar, crypto.randomUUID());
      if (JSON.stringify(next) !== JSON.stringify(savedAvatarsRef.current)) storeAvatars(next);
    } catch (e) { setLibraryError(e.message); }
  }, [avatar]);
  useEffect(() => {
    const log = scrollRef.current, last = log?.lastElementChild;
    if (last) log.scrollTo({ top: log.scrollTop + last.getBoundingClientRect().top - log.getBoundingClientRect().top - 10, behavior: 'auto' });
  }, [messages, busy]);
  function stopSpeech() { speechId.current++; cancelSpeech(); setSpeaking(false); setSpeechCue(null); setPreparingVoice(false); }
  function speakReply(content) {
    stopListening(); setListening(false);
    const id = ++speechId.current;
    setSpeaking(false); setPreparingVoice(false); setError('');
    const result = speak(content, {
      voiceURI: avatarRef.current.voiceURI,
      femaleOnly: true,
      onStart: () => { if (speechId.current === id) { setHistoryView(false); setPreparingVoice(false); setSpeaking(true); setSpeechCue({text:content,index:0,at:performance.now(),boundary:false}); } },
      onBoundary: event => { if (speechId.current === id && event.name !== 'sentence') setSpeechCue({text:content,index:event.charIndex || 0,length:event.charLength || 0,at:performance.now(),boundary:true}); },
      onEnd: () => { if (speechId.current === id) { setPreparingVoice(false); setSpeaking(false); setSpeechCue(null); } },
      onError: event => { if (speechId.current === id) { setPreparingVoice(false); setSpeaking(false); setSpeechCue(null); if (!['canceled', 'interrupted'].includes(event.error)) setError('音声を再生できませんでした。返事は文字でも確認できます。'); } },
      onUnavailable: () => { if (speechId.current === id) { setPreparingVoice(false); setError('女性の英語の声が見つかりません。端末に女性の英語音声を追加するか、別のブラウザで開いてください。'); } },
    });
    if (result === 'unsupported') setError('このブラウザでは読み上げが利用できません。文字で会話を続けられます。');
    if (result === 'queued') setPreparingVoice(true);
  }
  async function uploadAvatar(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const id = ++uploadRef.current; setUploading(true); setAvatarError('');
    try {
      const image = await prepareAvatarImage(file);
      if (uploadRef.current === id) {
        const existing = savedAvatarsRef.current.find(entry => entry.avatar.image === image);
        const nextAvatar = existing?.avatar || {...avatarRef.current, kind:'custom', name:`相棒 ${savedAvatarsRef.current.length + 1}`, image, imageX:50, imageY:35, imageZoom:1, photoMode:'whole'};
        const next = keepAvatar(savedAvatarsRef.current, nextAvatar, crypto.randomUUID());
        if (storeAvatars(next)) { stopSpeech(); stopListening(); setListening(false); setAvatar(nextAvatar); }
      }
    }
    catch (e) { if (uploadRef.current === id) setAvatarError(e.message); }
    finally { if (uploadRef.current === id) setUploading(false); }
  }
  function storeAvatars(next) {
    try {
      writeAvatarLibrary(window.localStorage, next);
      savedAvatarsRef.current = next; setSavedAvatars(next); setLibraryError(''); return true;
    } catch (e) { setLibraryError(e.message); return false; }
  }
  function chooseSavedAvatar(entry) {
    stopSpeech(); stopListening(); setListening(false); setDeletingAvatar(null); setAvatarError(''); setAvatar({...entry.avatar});
  }
  function removeSavedAvatar(entry) {
    if (!storeAvatars(savedAvatarsRef.current.filter(item => item.id !== entry.id))) return;
    if (avatar.image === entry.avatar.image && avatar.kind === 'custom') {
      stopSpeech(); stopListening(); setListening(false);
      setAvatar(v => ({...v,kind:'portrait',name:'Emma',image:'',photoMode:'whole'}));
    }
    setDeletingAvatar(null);
  }
  function stopListening() {
    const rec = recognition.current; recognition.current = null;
    if (rec) { rec.onresult = null; rec.onend = null; rec.onerror = null; try { rec.abort(); } catch {} }
  }
  function changeScene(value) { if (busy) return; stopSpeech(); stopListening(); setListening(false); setScene(value); setMessages([]); setDraft(''); setError(''); setCanPractice(false); }
  async function send(value = draft, practice = false, {focusInput = true} = {}) {
    const content = value.trim(); if (!content || sending.current) return;
    sending.current = true;
    const userMessage = { role: 'user', content };
    const prior = [...messages, userMessage];
    stopSpeech(); stopListening(); setListening(false);
    setMessages(prior); setDraft(''); setBusy(true); setError(''); setCanPractice(false);
    request.current = new AbortController();
    try {
      const payload = { scene, partnerName: avatarName, messages: [{ role: 'assistant', content: sceneInfo.intro }, ...prior.map(({role, content}) => ({role, content}))].slice(-22) };
      const data = browserOnly || practice ? browserReply(payload) : await requestChatReply(payload, { signal: request.current.signal });
      if (data.browserOnly) setBrowserOnly(true);
      setMessages(v => [...v, { role: 'assistant', content: data.reply, ...data }]); setMode(data.mode);
      if (avatarRef.current.autoRead) speakReply(data.reply);
    } catch (e) { if (e.name !== 'AbortError') { setMessages(prior.slice(0, -1)); setDraft(content); setError(e.message); setCanPractice(true); } }
    finally { sending.current = false; setBusy(false); if (focusInput) inputRef.current?.focus(); }
  }
  function dictate() {
    if (recognition.current) { stopListening(); setListening(false); return; }
    if (sending.current) return;
    stopSpeech();
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError('このブラウザは音声入力に対応していません。キーボードから入力できます。'); return; }
    stopListening();
    const rec = new Recognition(); recognition.current = rec; rec.lang = 'en-US'; rec.interimResults = false; rec.continuous = false;
    rec.onresult = e => {
      if (recognition.current !== rec) return;
      const finals = Array.from(e.results || []).slice(e.resultIndex || 0).filter(result => result.isFinal);
      if (!finals.length) return;
      const content = finals.map(result => result[0]?.transcript || '').join(' ').trim().slice(0, 500);
      stopListening(); setListening(false);
      if (content) send(content, false, {focusInput:false});
      else setError('音声を聞き取れませんでした。もう一度話すか、文字で入力してください。');
    };
    rec.onend = () => { if (recognition.current === rec) { recognition.current = null; setListening(false); } };
    rec.onerror = e => { if (recognition.current === rec) { stopListening(); setListening(false); setError(e.error === 'not-allowed' ? 'マイクを使うには、ブラウザでマイクの利用を許可してください。文字でも会話できます。' : '音声を聞き取れませんでした。もう一度試すか、文字で入力してください。'); } };
    try { rec.start(); setListening(true); setError(''); } catch { stopListening(); setListening(false); setError('音声入力を開始できませんでした。文字で入力してください。'); }
  }
  const bubble = (content, translation, tip, key) => <div className="assistant-row" key={key}><Avatar avatar={avatar} className="message-character"/><div className="assistant-message"><div className="bubble"><p>{content}</p>{showTranslation && <p className="translation">{translation}</p>}<button className="text-button" aria-label="返事を読み上げる" onClick={() => speakReply(content)}><Volume2 size={15}/> 聞く</button></div>{tip && <div className="chat-tip"><Sparkles size={14}/>{tip}</div>}</div></div>;
  return <div className={`conversation-workspace ${avatarSettings ? 'settings-open' : ''}`}>
    {avatarFocus && <AvatarFocus avatar={avatar} speaking={speaking} preparing={preparingVoice} cue={speechCue} onClose={() => setAvatarFocus(false)} onSpeak={() => speaking || preparingVoice ? stopSpeech() : speakReply(sceneInfo.intro)}/>}
    {avatarSaveError && <p className="notice" role="alert">アバター設定を保存できませんでした。この画面では引き続き使えます。</p>}
    {avatarSettings && <section className="avatar-settings" id="avatar-settings" aria-label="アバター設定"><div className="avatar-settings-heading"><div><span className="eyebrow">YOUR CONVERSATION PARTNER</span><h2>いっしょに話す、あなただけの相棒。</h2></div><button className="icon-button" aria-label="アバター設定を閉じる" onClick={() => setAvatarSettings(false)}><X size={18}/></button></div>
      <fieldset className="avatar-choices"><legend>アバターを選ぶ</legend><div>{avatarPresets.map(p => <button key={p.id} disabled={uploading} aria-pressed={avatar.kind === p.id} className={avatar.kind === p.id ? 'selected' : ''} onClick={() => { stopSpeech(); setAvatar(v => ({...v,kind:p.id,name:p.name,image:''})); setAvatarError(''); }}><Avatar avatar={{kind:p.id,name:p.name}}/><span>{p.label}</span>{avatar.kind === p.id && <Check size={12}/>}</button>)}</div></fieldset>
      <section className="saved-avatars" aria-label="追加したアバター"><h3>追加したアバター <span>{savedAvatars.length} / 8</span></h3><p>写真を追加して、話す相手を選べます。名前・声・写真の位置もそれぞれ保存されます。</p>
        {savedAvatars.length > 0 && <div className="saved-avatar-grid">{savedAvatars.map(entry => <div className="saved-avatar-card" key={entry.id}><button className="saved-avatar-select" disabled={uploading} aria-label={`${entry.avatar.name}と話す`} aria-pressed={avatar.kind === 'custom' && avatar.image === entry.avatar.image} onClick={() => chooseSavedAvatar(entry)}><Avatar avatar={entry.avatar}/><span>{entry.avatar.name}</span></button><button className="saved-avatar-remove" disabled={uploading} aria-label={`${entry.avatar.name}を削除`} onClick={() => setDeletingAvatar(entry)}>削除</button></div>)}</div>}
        {deletingAvatar && <div className="avatar-delete-confirm" role="group" aria-label="アバターの削除確認"><p>「{deletingAvatar.avatar.name}」を削除しますか？元の写真は端末に残ります。</p><button onClick={() => setDeletingAvatar(null)}>やめる</button><button onClick={() => removeSavedAvatar(deletingAvatar)}>削除する</button></div>}
        <label className={`button secondary upload-button ${uploading ? 'uploading' : ''}`}><Upload size={15}/>{uploading ? '追加しています…' : 'アバターを追加'}<input className="visually-hidden" type="file" aria-label="アバターを追加" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} disabled={uploading}/></label>
        <p>PNG・JPEG・WebP / 5MBまで。写真はこの端末のブラウザに保存されます。</p>
        {libraryError && <p className="chat-error" role="alert">{libraryError}</p>}
      </section>
      <div className="avatar-settings-preview"><Avatar avatar={avatar} className="settings-character"/><div><strong>{avatarName}</strong><p>この姿で会話します</p></div></div>
      {avatar.kind === 'custom' && <div className="avatar-frame-controls"><div className="photo-mode-buttons"><button aria-pressed={avatar.photoMode !== 'crop'} onClick={() => setAvatar(v => ({...v,photoMode:'whole'}))}>写真全体を映す</button><button aria-pressed={avatar.photoMode === 'crop'} onClick={() => setAvatar(v => ({...v,photoMode:'crop'}))}>顔を拡大する</button></div><p>{avatar.photoMode === 'crop' ? '顔が見える位置に調整できます' : '元の構図のまま、上半身まで切らずに表示します。'}</p><div hidden={avatar.photoMode !== 'crop'}><label>上下の位置<input aria-label="画像の上下位置" type="range" min="0" max="100" value={avatar.imageY ?? 35} onChange={e => setAvatar(v => ({...v,imageY:Number(e.target.value)}))}/></label><label>左右の位置<input aria-label="画像の左右位置" type="range" min="0" max="100" value={avatar.imageX ?? 50} onChange={e => setAvatar(v => ({...v,imageX:Number(e.target.value)}))}/></label><label>顔の大きさ<input aria-label="画像の拡大率" type="range" min="1" max="2" step="0.05" value={avatar.imageZoom || 1} onChange={e => setAvatar(v => ({...v,imageZoom:Number(e.target.value)}))}/></label></div></div>}
      {avatarError && <p role="alert" className="chat-error">{avatarError}</p>}
      <div className="avatar-fields"><label>相棒の名前<input value={avatar.name} maxLength={24} placeholder="Emma" onChange={e => setAvatar(v => ({...v,name:e.target.value}))}/></label><label>話す声（女性）<select value={selectedVoiceURI} onChange={e => { stopSpeech(); setAvatar(v => ({...v,voiceURI:e.target.value})); }}><option value="">女性の声を自動で選ぶ</option>{femaleVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}</select></label></div>
      <div className="avatar-settings-footer"><label><input type="checkbox" checked={avatar.autoRead} onChange={e => { if (!e.target.checked) stopSpeech(); setAvatar(v => ({...v,autoRead:e.target.checked})); }}/>返事を自動で読み上げる</label><span>変更は自動で保存されます</span></div>
      <button className="button primary avatar-settings-done" onClick={() => setAvatarSettings(false)}>このアバターで話す <ArrowRight size={17}/></button>
    </section>}
    <section className={`conversation-panel has-avatar face-to-face ${avatar.kind === 'custom' && avatar.photoMode !== 'crop' ? 'whole-photo-conversation' : ''} ${historyView ? 'history-view' : ''}`}><div className="scene-tabs" aria-label="会話の場面">{Object.entries(scenes).map(([key, s]) => <button key={key} disabled={busy} className={key === scene ? 'active' : ''} onClick={() => changeScene(key)}><span>{s.icon}</span>{s.title}</button>)}</div>
    <div className={`avatar-stage ${speaking ? 'is-speaking' : ''} ${preparingVoice ? 'is-preparing' : ''} ${listening ? 'is-listening' : ''}`}><div className="avatar-spotlight"><button className="avatar-focus-button" aria-label="アバターを大きく見る" onClick={() => setAvatarFocus(true)}><Avatar avatar={avatar} className="stage-character" speaking={speaking} listening={listening} cue={speechCue} animated/><span>大きく見る</span></button><span className="voice-waves" aria-hidden="true"><i/><i/><i/><i/><i/></span></div><div className="avatar-introduction"><span className="eyebrow">YOUR ENGLISH BUDDY</span><h2>{avatarName}</h2><p role="status" className="avatar-status">{preparingVoice ? '女性の声を探しています…' : speaking ? '話しています…' : listening ? '聞いています。話し終わると自動送信します。' : busy ? '返事を考えています…' : 'あなたと話せるのを楽しみにしています。'}</p><button className="text-button" onClick={() => speaking || preparingVoice ? stopSpeech() : speakReply(sceneInfo.intro)}>{speaking || preparingVoice ? <><Square size={13}/> 読み上げを止める</> : <><Volume2 size={15}/> あいさつを聞く</>}</button></div><button className="avatar-edit-button" aria-label="アバター設定" aria-expanded={avatarSettings} aria-controls="avatar-settings" onClick={() => { stopSpeech(); stopListening(); setListening(false); setAvatarSettings(v => !v); }}><Pencil size={13}/><span>アバター設定</span></button></div>
    <div className="chat-heading"><div className="chat-partner"><Avatar avatar={avatar} className="partner-character"/><div><strong>{avatarName}と英会話</strong><small><span className="online-dot"/>{sceneInfo.role} ・ {mode === 'ai' ? 'AIと自由に会話' : 'ガイド会話'}</small></div></div><div className="chat-tools"><button className="chat-history-toggle" aria-pressed={historyView} onClick={() => setHistoryView(v => !v)}>{historyView ? 'アバターを大きく' : '履歴を広く'}</button><button className={`translation-toggle ${showTranslation ? 'active' : ''}`} onClick={() => setShowTranslation(v => !v)} aria-pressed={showTranslation}>日本語訳</button><button className="icon-button" title="会話をはじめから" aria-label="会話をはじめから" disabled={busy} onClick={() => changeScene(scene)}><RotateCcw size={17}/></button></div></div>
    <div className="chat-messages" ref={scrollRef} aria-live="polite" role="log" aria-label="会話履歴"><div className="chat-date">今日の小さなチャレンジ</div>{bubble(sceneInfo.intro, sceneInfo.translation, '', 'intro')}{messages.map((m, i) => m.role === 'assistant' ? bubble(m.content, m.translation, m.tip, i) : <div className="user-row" key={i}><div className="bubble">{m.content}</div><span className="user-avatar">YOU</span></div>)}{busy && <div className="typing"><span/><span/><span/><small>返事を考えています</small></div>}</div>
    <div className="chat-input-area">{error && <div role="alert" className="chat-error"><p>{error}</p>{canPractice && <button className="text-button" onClick={() => send(draft, true)}>練習会話で続ける <ArrowRight size={14}/></button>}</div>}<div className="suggestions"><span>こんなふうに言ってみよう</span><div>{(suggestions || []).map(s => <button key={s} disabled={busy} onClick={() => send(s)}>{s}<ArrowRight size={13}/></button>)}</div></div><form className="chat-form" onSubmit={e => { e.preventDefault(); send(); }}><button type="button" className={`icon-button mic-button ${listening ? 'listening' : ''}`} disabled={busy} onClick={dictate} aria-label={listening ? '音声入力を停止' : '音声で入力'}>{listening ? <MicOff size={20}/> : <Mic size={20}/>}</button><input ref={inputRef} aria-label="英語のメッセージ" value={draft} onChange={e => setDraft(e.target.value)} placeholder={listening ? '聞いています…' : '英語で話しかけてみよう…'} maxLength={500} disabled={busy}/><button className="send-button" aria-label="メッセージを送信" disabled={busy || !draft.trim()}><Send size={19}/></button></form><p className="input-caption"><Headphones size={12}/> マイクで話すと自動で送信します。もう一度マイクを押すと中止できます。</p></div>
  </section></div>;
}

function Words({ progress }) {
  const [filter, setFilter] = useState('all'), [revealed, setRevealed] = useState([]);
  const available = lessons.filter(l => filter === 'all' || progress.completed.includes(l.id));
  return <><div className="word-toolbar"><span>{available.reduce((n, l) => n + l.words.length, 0)} つのことば</span><div className="segmented"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>すべて</button><button className={filter === 'learned' ? 'active' : ''} onClick={() => setFilter('learned')}>学習済み</button></div></div>{available.length === 0 && <div className="empty-state"><BookOpen size={36}/><h3>はじめのレッスンから。</h3><p>レッスンを終えると、学習したことばがここに集まります。</p></div>}{available.map(l => <section className="word-section" key={l.id}><h3>{l.title}</h3><div className="word-grid">{l.words.map(([en, ja]) => <article className="word-card" key={en}><div><strong>{en}</strong><button className="icon-button" aria-label={`${en}の発音を聞く`} onClick={() => speak(en)}><Volume2 size={17}/></button></div><button className={`reveal-word ${revealed.includes(en) ? 'revealed' : ''}`} aria-label={`${en}の意味を${revealed.includes(en) ? '隠す' : '表示'}`} onClick={() => setRevealed(v => v.includes(en) ? v.filter(w => w !== en) : [...v, en])}>{revealed.includes(en) ? ja : 'タップして意味を見る'}</button></article>)}</div></section>)}</>;
}
function Stats({ progress }) {
  const days = Array.from({length: 7}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return { label: `${d.getMonth() + 1}/${d.getDate()}`, xp: progress.history[localDay(d)] || 0 }; });
  const max = Math.max(30, ...days.map(d => d.xp));
  return <><div className="stats-grid">{[[Zap, progress.xp, '累計 XP'], [Flame, streak(progress.history), '日連続'], [BookOpen, progress.completed.length, '完了レッスン']].map(([Icon, n, label]) => <div className="stat-card" key={label}><Icon size={24}/><strong>{n}</strong><span>{label}</span></div>)}</div><section className="side-card chart-card"><h3>この1週間の学習</h3><p className="muted small-text">毎日の積み重ねを、見えるかたちに。</p><div className="chart">{days.map(d => <div key={d.label} className="chart-column"><span>{d.xp} XP</span><div className="bar-space"><div className={d.xp ? 'bar' : 'bar zero'} style={{height: `${Math.max(3, d.xp / max * 100)}%`}}/></div><small>{d.label}</small></div>)}</div></section><section className="side-card achievement-card"><h3><Trophy size={20}/> あなたのマイルストーン</h3>{[{label: 'はじめの一歩', description: 'レッスンを1つ完了する', done: progress.completed.length > 0}, {label: 'ことばの芽', description: '100 XPを獲得する', done: progress.xp >= 100}, {label: '毎日の習慣', description: '3日連続で学習する', done: streak(progress.history) >= 3}, {label: '小さな冒険家', description: '6つのレッスンをすべて完了する', done: progress.completed.length === lessons.length}].map(a => <div className={`achievement ${a.done ? 'earned' : ''}`} key={a.label}><span><Star size={22}/></span><div><strong>{a.label}</strong><p>{a.description}</p></div>{a.done && <Check size={20}/>}</div>)}</section></>;
}

createRoot(document.getElementById('root')).render(<App/>);
