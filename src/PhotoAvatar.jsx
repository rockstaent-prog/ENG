import React, { useEffect, useRef, useState } from 'react';
import { speechPosition } from './speech-motion';

const spriteURL = typeof __AVATAR_SPRITE__ !== 'undefined' ? __AVATAR_SPRITE__ : './avatars/emma-speaking.png';
const SIZE = 512;

function canvas() {
  const result = document.createElement('canvas');
  result.width = SIZE; result.height = SIZE;
  return result;
}

function featurePatch(image, tile, feature) {
  const result = canvas(), ctx = result.getContext('2d');
  const w = image.naturalWidth / 3, h = image.naturalHeight / 2;
  ctx.drawImage(image, (tile % 3) * w, Math.floor(tile / 3) * h, w, h, 0, 0, SIZE, SIZE);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.save();
  if (feature === 'mouth') { ctx.translate(SIZE * 0.49, SIZE * 0.615); ctx.rotate(-0.18); ctx.scale(SIZE * 0.16, SIZE * 0.14); }
  else { ctx.translate(SIZE * 0.435, SIZE * 0.35); ctx.rotate(-0.25); ctx.scale(SIZE * 0.30, SIZE * 0.17); }
  const feather = ctx.createRadialGradient(0, 0, 0.58, 0, 0, 1);
  feather.addColorStop(0, '#fff'); feather.addColorStop(1, '#fff0');
  ctx.fillStyle = feather; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  return result;
}

export default function PhotoAvatar({ image, speaking, cue }) {
  const canvasRef = useRef(null), latest = useRef({ speaking, cue });
  const [ready, setReady] = useState(false);
  latest.current = { speaking, cue };
  useEffect(() => {
    let disposed = false, request, previousTime = 0;
    const imageSheet = new Image();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReady(false);
    imageSheet.onload = () => {
      if (disposed || !canvasRef.current) return;
      const output = canvasRef.current, ctx = output.getContext('2d');
      if (!ctx) return;
      const base = canvas(), baseContext = base.getContext('2d');
      baseContext.drawImage(imageSheet, 0, 0, imageSheet.naturalWidth / 3, imageSheet.naturalHeight / 2, 0, 0, SIZE, SIZE);
      const mouths = Array.from({length: 5}, (_, i) => featurePatch(imageSheet, i, 'mouth'));
      const eyes = featurePatch(imageSheet, 5, 'eyes');
      let from = 0, target = 0, transitionAt = 0;
      let nextBlink = performance.now() + 2700 + Math.random() * 2000;
      function paint(now) {
        if (disposed) return;
        request = requestAnimationFrame(paint);
        if (now - previousTime < 32) return;
        previousTime = now;
        const state = latest.current;
        const pose = state.speaking ? (reduced.matches ? 1 : speechPosition(state.cue, now).shape) : 0;
        if (pose !== target) { from = target; target = pose; transitionAt = now; }
        const blend = Math.min(1, (now - transitionAt) / 75);
        ctx.clearRect(0, 0, SIZE, SIZE); ctx.drawImage(base, 0, 0);
        if (from !== 0 && blend < 1) { ctx.globalAlpha = 1 - blend; ctx.drawImage(mouths[from], 0, 0); }
        if (target !== 0) { ctx.globalAlpha = blend; ctx.drawImage(mouths[target], 0, 0); }
        ctx.globalAlpha = 1;
        let blink = 0;
        if (!reduced.matches && now >= nextBlink) {
          const t = (now - nextBlink) / 190;
          if (t < 1) blink = Math.sin(t * Math.PI);
          else nextBlink = now + 3000 + Math.random() * 2800;
        }
        if (blink > 0) { ctx.globalAlpha = blink; ctx.drawImage(eyes, 0, 0); ctx.globalAlpha = 1; }
        output.dataset.mouthFrame = String(target);
        output.dataset.blinking = String(blink > 0.1);
      }
      paint(performance.now()); setReady(true);
    };
    imageSheet.src = spriteURL;
    return () => { disposed = true; cancelAnimationFrame(request); imageSheet.onload = null; };
  }, []);
  return <span className="photo-performance"><img src={image} alt=""/><canvas ref={canvasRef} width={SIZE} height={SIZE} className={`portrait-canvas ${ready ? 'ready' : ''}`} aria-hidden="true" data-ready={ready}/></span>;
}
