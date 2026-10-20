const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const {createServer}=await import('vite');
  const {pronunciationLessons}=await import('../src/pronunciation.js');
  const server=await createServer({server:{host:'127.0.0.1',port:0}});
  await server.listen();let browser;
  const url=`http://127.0.0.1:${server.httpServer.address().port}/?screen=pronunciation`,errors=[];
  try{
    const executablePath=process.env.BROWSER_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
    browser=await chromium.launch({executablePath,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
    for(const [width,height] of [[320,568],[390,844],[844,390]]){
      const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,permissions:['microphone']});
      await context.addInitScript(()=>{
        window.pronVoices=[{name:'Microsoft Sonia Online (Natural)',lang:'en-GB',voiceURI:'sonia'},{name:'Microsoft Aria Online (Natural)',lang:'en-US',voiceURI:'aria'}];
        Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
        Object.defineProperty(window,'speechSynthesis',{value:Object.assign(new EventTarget(),{getVoices:()=>window.pronVoices,cancel(){window.pronUtterance=null;},speak(utterance){window.pronUtterance=utterance;utterance.onstart?.({});}})});
        localStorage.setItem('komorebi-avatar',JSON.stringify({kind:'portrait',name:'Emma',voiceURI:'sonia'}));
        window.pronStreams=[];window.pronBytes=0;
        const getUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia=async constraints=>{
          if(window.pronDeny)throw new DOMException('Permission denied','NotAllowedError');
          const stream=await getUserMedia(constraints);window.pronStreams.push(stream);
          if(window.pronHold)return new Promise(resolve=>{window.pronResolve=()=>resolve(stream);});
          return stream;
        };
        const start=MediaRecorder.prototype.start;
        MediaRecorder.prototype.start=function(...args){window.pronRecorder=this;window.pronBytes=0;this.addEventListener('dataavailable',event=>window.pronBytes+=event.data.size);return start.apply(this,args);};
      });
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.goto(url);
      await page.getByRole('heading',{name:'英語の音を、口から覚えよう。',exact:true}).waitFor();
      const nav=page.getByRole('navigation',{name:'モバイルメニュー'});
      assert.equal(await nav.getByRole('button').count(),5);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      for(const button of await nav.getByRole('button').all()){
        const box=await button.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.width>=44,'five navigation targets fit the phone');
      }
      const first=pronunciationLessons[0];
      await page.getByRole('button',{name:`${first.title}を練習する`,exact:true}).click();
      const practice=page.getByRole('region',{name:'発音の練習',exact:true});
      assert.equal(await page.locator('.pronunciation-guide li').count(),3);
      assert.equal(await page.getByRole('button',{name:'次の練習へ',exact:true}).isEnabled(),false,'practice requires a self-check');
      await page.getByRole('button',{name:'お手本を聞く',exact:true}).click();
      await page.getByRole('status').getByText('お手本を再生中',{exact:false}).waitFor();
      assert.deepEqual(await page.evaluate(()=>({text:window.pronUtterance.text,rate:window.pronUtterance.rate,voice:window.pronUtterance.voice.voiceURI})),{text:'right',rate:0.9,voice:'aria'});
      await page.getByRole('button',{name:'ゆっくり聞く',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.pronUtterance.rate),0.65);
      await page.getByRole('button',{name:'自分の声を録音する',exact:true}).click();
      await page.getByRole('button',{name:'録音を止める',exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>window.pronUtterance),null,'recording stops the model to avoid feedback');
      assert.equal(await page.getByRole('button',{name:'お手本を聞く',exact:true}).isEnabled(),false);
      await page.waitForFunction(()=>window.pronBytes>0);
      await page.getByRole('button',{name:'録音を止める',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);
      assert.ok(await page.locator('audio').evaluate(audio=>audio.src.startsWith('blob:')&&audio.duration>0));
      assert.ok(await page.evaluate(()=>window.pronStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))),'all microphone tracks stop after recording');
      await page.locator('audio').evaluate(audio=>audio.play());
      await page.waitForFunction(()=>document.querySelector('audio').currentTime>0);
      assert.equal(await page.evaluate(()=>Object.values(localStorage).some(value=>value.includes('blob:'))),false,'recordings are not stored');
      await page.getByRole('button',{name:'お手本を聞く',exact:true}).click();
      assert.equal(await page.locator('audio').evaluate(audio=>audio.paused),true);
      await page.getByRole('button',{name:'お手本を止める',exact:true}).click();
      fs.mkdirSync('test-results',{recursive:true});
      await page.screenshot({path:`test-results/pronunciation-${width}.png`,fullPage:true});
      for(let i=0;i<3;i++){
        assert.equal(await practice.getByRole('heading',{level:3}).innerText(),first.examples[i].text);
        await page.getByRole('checkbox').check();
        await page.getByRole('button',{name:i===2?'練習を終える':'次の練習へ',exact:true}).click();
      }
      await page.getByText('1 / 6 レッスン練習済み',{exact:true}).waitFor();
      // Finish every lesson at the smallest size, including every teaching example.
      if(width===320)for(const lesson of pronunciationLessons.slice(1)){
        await page.getByRole('button',{name:`${lesson.title}を練習する`,exact:true}).click();
        for(let i=0;i<3;i++){
          await page.getByRole('button',{name:'お手本を聞く',exact:true}).click();
          assert.equal(await page.evaluate(()=>window.pronUtterance.text),lesson.examples[i].text);
          await page.getByRole('checkbox').check();
          await page.getByRole('button',{name:i===2?'練習を終える':'次の練習へ',exact:true}).click();
        }
      }
      await page.reload();
      await page.getByText(`${width===320?6:1} / 6 レッスン練習済み`,{exact:true}).waitFor();
      await page.getByRole('button',{name:`${first.title}を練習する`,exact:true}).click();
      // Denial and cancellation after a delayed microphone grant are recoverable.
      await page.evaluate(()=>window.pronDeny=true);
      await page.getByRole('button',{name:'自分の声を録音する',exact:true}).click();
      await page.getByRole('alert').getByText(/マイクの利用が許可されていません/).waitFor();
      await page.evaluate(()=>{window.pronDeny=false;window.pronHold=true;});
      await page.getByRole('button',{name:'自分の声を録音する',exact:true}).click();
      await page.waitForFunction(()=>!!window.pronResolve);
      await nav.getByRole('button',{name:'単語帳',exact:true}).click();
      await page.evaluate(()=>window.pronResolve());
      await page.waitForFunction(()=>window.pronStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended')));
      await nav.getByRole('button',{name:'発音',exact:true}).click();
      await page.getByRole('button',{name:`${first.title}を練習する`,exact:true}).click();
      await page.evaluate(()=>{window.pronHold=false;window.pronVoices=[];});
      await page.getByRole('button',{name:'お手本を聞く',exact:true}).click();
      await page.getByRole('alert').getByText(/女性の英語音声が見つかりません/).waitFor();
      assert.equal(await page.evaluate(()=>window.pronUtterance),null);
      await page.evaluate(()=>window.pronVoices=[{name:'Microsoft Aria Online (Natural)',lang:'en-US',voiceURI:'aria'}]);
      await page.getByRole('button',{name:'自分の声を録音する',exact:true}).click();
      await page.getByRole('button',{name:'録音を止める',exact:true}).waitFor();
      if(width===320){
        await page.getByRole('button',{name:'もう一度録音する',exact:true}).waitFor({timeout:20000});
        assert.ok(await page.evaluate(()=>window.pronStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))),'15-second recording limit releases the microphone');
        await page.getByRole('button',{name:'もう一度録音する',exact:true}).click();
        await page.getByRole('button',{name:'録音を止める',exact:true}).waitFor();
      }
      await nav.getByRole('button',{name:'会話する',exact:true}).click();
      assert.ok(await page.evaluate(()=>window.pronStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))));
      console.log(`PASS: ${width}×${height}: pronunciation teaching, normal/slow model, female US voice, native recording/playback with fake audio device, saved completion, permission denial and late-grant/unmount cleanup (speech simulated)`);
      await context.close();
    }
    assert.deepEqual(errors,[]);
  }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
