import { useEffect } from 'react';

export default function useMobileViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let width = window.innerWidth, fullHeight = window.innerHeight;
    const update = () => {
      const height = Math.round(viewport?.height || window.innerHeight);
      const input = document.activeElement;
      const typing = input?.tagName === 'TEXTAREA' || (input?.tagName === 'INPUT' && !['checkbox','radio','file','button'].includes(input.type));
      if (Math.abs(width - window.innerWidth) > 50) { width = window.innerWidth; fullHeight = window.innerHeight; }
      if (!typing) fullHeight = Math.max(fullHeight, height);
      const keyboard = typing && Math.max(window.innerHeight, fullHeight) - height > 100;
      root.style.setProperty('--app-viewport-height', `${height}px`);
      root.classList.toggle('keyboard-open', keyboard);
    };
    update();
    viewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      root.style.removeProperty('--app-viewport-height');
      root.classList.remove('keyboard-open');
    };
  }, []);
}
