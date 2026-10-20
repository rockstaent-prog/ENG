import React, { useEffect, useRef, useState } from 'react';
import { avatarPose, portraitMesh, drawPortrait, easeActivity } from './avatar-motion';

// Animate the selected photo itself. Keep its original frame and identity;
// never substitute the generated Emma face or its expression patches.
export default function OriginalPhotoAvatar({ image, speaking, listening, cue, framing = {}, onError }) {
  const crop = framing.photoMode === 'crop', imageX = framing.imageX ?? 50, imageY = framing.imageY ?? 35, zoom = framing.imageZoom || 1;
  const outputRef = useRef(null), state = useRef({speaking,listening,cue});
  const [ready,setReady] = useState(false);
  state.current = {speaking,listening,cue};
  useEffect(() => {
    let disposed=false, request, previous=0, activity=0, attention=0;
    const source=new Image(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const mesh=portraitMesh(); setReady(false);
    source.onload=()=>{
      if(disposed || !outputRef.current) return;
      const output=outputRef.current, ctx=output.getContext('2d');
      if(!ctx) return;
      const factor=Math.min(1,768/Math.max(source.naturalWidth,source.naturalHeight));
      output.width=crop ? 512 : Math.max(1,Math.round(source.naturalWidth*factor));
      output.height=crop ? 512 : Math.max(1,Math.round(source.naturalHeight*factor));
      const texture=document.createElement('canvas');texture.width=output.width;texture.height=output.height;
      if (crop) {
        const cover = Math.max(512/source.naturalWidth,512/source.naturalHeight);
        const width = source.naturalWidth*cover, height = source.naturalHeight*cover;
        texture.getContext('2d').drawImage(source,((512-width)*imageX/100-256)*zoom+256,((512-height)*imageY/100-256)*zoom+256,width*zoom,height*zoom);
      } else texture.getContext('2d').drawImage(source,0,0,texture.width,texture.height);
      function paint(now){
        if(disposed) return;
        request=requestAnimationFrame(paint);
        if(document.hidden || now-previous<40) return;
        const delta=Math.min(0.1,(now-previous)/1000);previous=now;
        activity=easeActivity(activity,Number(state.current.speaking),delta);
        attention=easeActivity(attention,Number(state.current.listening),delta);
        const pose=avatarPose(now,activity,attention,state.current.cue?.boundary ? (now-state.current.cue.at)/1000 : 10,reduced.matches);
        ctx.clearRect(0,0,output.width,output.height);
        // Margin keeps every edge of the original inside the canvas in motion.
        if(reduced.matches) ctx.drawImage(texture,0,0);
        else drawPortrait(ctx,texture,mesh,pose,output.width,{height:output.height,scale:crop ? 1.045 : 0.94,upperBody:!crop});
        output.dataset.headTurn=pose.turn.toFixed(5);output.dataset.shoulderShift=pose.sway.toFixed(5);
        output.dataset.ready='true';
      }
      paint(performance.now());setReady(true);
    };
    source.src=image;
    return ()=>{disposed=true;cancelAnimationFrame(request);source.onload=null;};
  },[image,crop,imageX,imageY,zoom]);
  return <span className={`custom-photo original-photo ${crop?'crop-photo':'whole-photo'} ${ready?'ready':''}`} style={{'--photo-x':`${imageX}%`,'--photo-y':`${imageY}%`,'--photo-zoom':zoom}}><img src={image} alt="" onError={onError}/><canvas ref={outputRef} className="original-photo-canvas" data-ready={ready} aria-hidden="true"/></span>;
}
