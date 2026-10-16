import React, { useEffect, useRef, useState } from 'react';
import { avatarPose, portraitMesh, drawPortrait } from './avatar-motion';

// Animate the selected photo itself. Keep its original frame and identity;
// never substitute the generated Emma face or its expression patches.
export default function OriginalPhotoAvatar({ image, speaking, listening, onError }) {
  const outputRef = useRef(null), state = useRef({speaking,listening});
  const [ready,setReady] = useState(false);
  state.current = {speaking,listening};
  useEffect(() => {
    let disposed=false, request, previous=0, activity=0, attention=0;
    const source=new Image(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const mesh=portraitMesh(); setReady(false);
    source.onload=()=>{
      if(disposed || !outputRef.current) return;
      const output=outputRef.current, ctx=output.getContext('2d');
      if(!ctx) return;
      const factor=Math.min(1,768/Math.max(source.naturalWidth,source.naturalHeight));
      output.width=Math.max(1,Math.round(source.naturalWidth*factor));
      output.height=Math.max(1,Math.round(source.naturalHeight*factor));
      const texture=document.createElement('canvas');texture.width=output.width;texture.height=output.height;
      texture.getContext('2d').drawImage(source,0,0,texture.width,texture.height);
      function paint(now){
        if(disposed) return;
        request=requestAnimationFrame(paint);
        if(document.hidden || now-previous<40) return;
        const delta=Math.min(0.1,(now-previous)/1000);previous=now;
        activity+=(Number(state.current.speaking)-activity)*Math.min(1,delta*7);
        attention+=(Number(state.current.listening)-attention)*Math.min(1,delta*5);
        const pose=avatarPose(now,activity,attention,10,reduced.matches);
        ctx.clearRect(0,0,output.width,output.height);
        // Margin keeps every edge of the original inside the canvas in motion.
        if(reduced.matches) ctx.drawImage(texture,0,0);
        else drawPortrait(ctx,texture,mesh,pose,output.width,{height:output.height,scale:0.94,upperBody:true});
        output.dataset.headTurn=pose.turn.toFixed(5);output.dataset.shoulderShift=pose.sway.toFixed(5);
        output.dataset.ready='true';
      }
      paint(performance.now());setReady(true);
    };
    source.src=image;
    return ()=>{disposed=true;cancelAnimationFrame(request);source.onload=null;};
  },[image]);
  return <span className={`custom-photo original-photo ${ready?'ready':''}`}><img src={image} alt="" onError={onError}/><canvas ref={outputRef} className="original-photo-canvas" aria-hidden="true"/></span>;
}
