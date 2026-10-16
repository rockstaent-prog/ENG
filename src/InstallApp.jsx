import React, { useEffect, useRef, useState } from 'react';
import { Download, X, Smartphone, Check, Share } from 'lucide-react';
import { phonePlatform, isAppWindow, registerMobileApp } from './install';

export default function InstallApp() {
  const [open, setOpen] = useState(false), [installed, setInstalled] = useState(isAppWindow);
  const [prompt, setPrompt] = useState(null), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [platform, setPlatform] = useState(phonePlatform), [saving, setSaving] = useState(false);
  const dialog = useRef(null), trigger = useRef(null);
  const available = import.meta.env.PROD && import.meta.env.MODE !== 'standalone' && 'serviceWorker' in navigator && window.isSecureContext && /^https?:$/.test(location.protocol);
  useEffect(() => {
    let active = true;
    const beforeInstall = event => { event.preventDefault(); setPrompt(event); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); setOpen(false); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    if (import.meta.env.PROD && available) registerMobileApp(() => { if (active) setReady(true); }).catch(() => { if (active) setError('保存の準備ができませんでした。通信できる場所でもう一度開いてください。'); });
    return () => { active = false; window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.focus();
    return () => { document.body.style.overflow = previous; trigger.current?.focus(); };
  }, [open]);
  async function install() {
    if (!prompt || saving) return;
    setSaving(true); setError('');
    try {
      await prompt.prompt(); const choice = await prompt.userChoice;
      setPrompt(null);
      if (choice.outcome === 'accepted') setOpen(false);
    } catch { setPrompt(null); setError('下の手順でホーム画面に追加できます。'); }
    finally { setSaving(false); }
  }
  function keydown(event) {
    if (event.key === 'Escape') setOpen(false);
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.current.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <>
    <button ref={trigger} className="install-app-button" onClick={() => setOpen(true)} aria-label={installed ? '携帯への保存を確認' : '携帯に保存'}><Smartphone size={19}/><span>{installed ? '保存済み' : '携帯に保存'}</span></button>
    {open && <div className="mobile-dialog-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}><section className="mobile-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title" tabIndex={-1} ref={dialog} onKeyDown={keydown}>
      <button className="icon-button dialog-close" aria-label="保存の案内を閉じる" onClick={() => setOpen(false)}><X size={22}/></button>
      <div className="install-icon"><Smartphone size={32}/></div><h2 id="install-title">こもれびを携帯に保存</h2>
      <p className="install-description">ホーム画面のアイコンから、<br/>いつでもEmmaと英語を練習できます。</p>
      {installed ? <p className="install-ready"><Check size={18}/> ホーム画面に追加されています</p> : !available ? <p className="install-description">携帯への保存には、公開したアプリをSafariまたはChromeで開いてください。ZIP内のファイルからは追加できません。</p> : <>
        {prompt && <button className="button primary install-now" disabled={saving} onClick={install}><Download size={18}/>{saving ? '保存しています…' : '携帯に保存する'}</button>}
        <div className="install-platforms" aria-label="携帯の種類"><button aria-pressed={platform === 'ios'} onClick={() => setPlatform('ios')}>iPhone</button><button aria-pressed={platform === 'android'} onClick={() => setPlatform('android')}>Android</button></div>
        {platform === 'ios' ? <ol className="install-steps"><li><span>1</span><p>このページを<strong>Safari</strong>で開く</p></li><li><span>2</span><p><Share size={17}/> <strong>共有</strong>を押す</p></li><li><span>3</span><p><strong>ホーム画面に追加</strong> → <strong>追加</strong></p></li></ol> : <ol className="install-steps"><li><span>1</span><p>このページを<strong>Chrome</strong>で開く</p></li><li><span>2</span><p>右上の<strong>︙</strong>を押す</p></li><li><span>3</span><p><strong>ホーム画面に追加</strong> → <strong>インストール</strong></p></li></ol>}
        <p className={ready ? 'install-ready' : 'install-saving'} role="status">{ready ? <><Check size={17}/> この端末でオフライン起動の準備ができました</> : 'オフラインで使えるように準備しています…'}</p>
        <p className="install-note">保存後は学習と練習会話を通信なしでも使えます。音声とマイクは端末や通信状態によって使えない場合があります。</p>
      </>}
      {error && <p className="chat-error" role="alert">{error}</p>}
    </section></div>}
  </>;
}
