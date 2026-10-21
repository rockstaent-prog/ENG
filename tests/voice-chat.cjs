const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:0}});
  await server.listen();let browser;
  const url=`http://127.0.0.1:${server.httpServer.address().port}/?screen=talk`,errors=[];
  try{
    const executablePath=process.env.BROWSER_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
    browser=await chromium.launch({executablePath,args:['--no-sandbox']});
    for(const webkit of [false,true]){
      const page=await browser.newPage({viewport:webkit?{width:390,height:844}:{width:1280,height:900},isMobile:webkit,hasTouch:webkit});
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(webkit=>{
        window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;
        const Recognition=class{
          constructor(){window.voiceSession=this;}
          start(){if(window.failStart)throw new Error('Start failed');this.result=this.onresult;this.failure=this.onerror;}
          abort(){this.aborted=true;}
        };
        window[webkit?'webkitSpeechRecognition':'SpeechRecognition']=Recognition;
        localStorage.setItem('komorebi-avatar',JSON.stringify({kind:'portrait',name:'Emma',autoRead:false}));
        Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
        Object.defineProperty(window,'speechSynthesis',{value:Object.assign(new EventTarget(),{getVoices:()=>[{name:'Microsoft Aria Online (Natural)',lang:'en-US',voiceURI:'aria'}],cancel(){},speak(utterance){utterance.onstart?.({});}})});
        window.emitSpeech=(text,final=true)=>{const result=[{transcript:text}];result.isFinal=final;window.voiceSession.result({resultIndex:0,results:[result]});};
      },webkit);
      const sent=[];let pending,fail=false,notify;
      const nextRequest=()=>new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error('The recognized message was not sent within 15 seconds')),15000);
        notify=()=>{clearTimeout(timer);resolve();};
      });
      await page.route('**/api/chat',async route=>{
        sent.push(route.request().postDataJSON());
        if(fail)return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Try again'})});
        pending=()=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'I heard you.',translation:'聞こえました。',suggestions:[],mode:'guided'})});
        notify?.();notify=null;
      });
      await page.goto(url);
      const start=()=>page.getByRole('button',{name:'音声で入力',exact:true}).click();
      const input=page.getByLabel('英語のメッセージ');
      await input.fill('Typed draft');
      await start();
      await page.evaluate(()=>window.emitSpeech('Coffee, please.',false));
      assert.equal(sent.length,0);assert.equal(await input.inputValue(),'Typed draft');
      const firstRequest=nextRequest();
      await page.evaluate(()=>{window.emitSpeech('Coffee, please.');window.emitSpeech('Coffee, please.');});
      await firstRequest;
      await page.waitForFunction(()=>document.querySelectorAll('.user-row').length===1);
      await page.locator('.typing').waitFor();
      assert.equal(sent.length,1);assert.equal(sent[0].messages.at(-1).content,'Coffee, please.');
      assert.equal(await page.getByRole('button',{name:'音声で入力',exact:true}).isEnabled(),false);
      assert.equal(await page.evaluate(()=>window.voiceSession.aborted),true);
      await pending();await page.getByText('I heard you.',{exact:true}).waitFor();
      assert.equal(await input.evaluate(element=>document.activeElement===element),false,'voice response does not focus the composer or open the phone keyboard');
      await page.evaluate(()=>window.emitSpeech('Duplicate after response'));
      assert.equal(sent.length,1);
      // Explicit cancellation and UI changes invalidate late recognition callbacks.
      await start();await page.getByRole('button',{name:'音声入力を停止',exact:true}).click();
      await page.evaluate(()=>window.emitSpeech('Canceled text'));assert.equal(sent.length,1);
      await start();await page.getByRole('button',{name:'旅先で道案内',exact:false}).click();
      await page.evaluate(()=>window.emitSpeech('Old scene'));assert.equal(sent.length,1);
      await start();await page.getByRole('button',{name:'あいさつを聞く',exact:false}).click();
      await page.evaluate(()=>window.emitSpeech('Assistant echo'));assert.equal(sent.length,1);
      await start();await page.getByRole('button',{name:'アバター設定',exact:true}).click();
      await page.evaluate(()=>window.emitSpeech('Hidden composer'));assert.equal(sent.length,1);
      await page.getByRole('button',{name:'このアバターで話す',exact:true}).click();
      await start();await page.evaluate(()=>window.emitSpeech('  '));
      await page.getByRole('alert').getByText(/音声を聞き取れませんでした/).waitFor();assert.equal(sent.length,1);
      await start();await page.evaluate(()=>window.voiceSession.failure({error:'not-allowed'}));
      await page.getByRole('alert').getByText(/マイクを使うには/).waitFor();
      await page.evaluate(()=>window.emitSpeech('After recognition error'));assert.equal(sent.length,1);
      await page.evaluate(()=>window.failStart=true);await start();
      await page.getByRole('alert').getByText(/音声入力を開始できませんでした/).waitFor();
      await page.evaluate(()=>window.failStart=false);
      // Failure restores recognized text for the same manual retry flow.
      fail=true;await start();await page.evaluate(()=>window.emitSpeech('Where is the station?'));
      await page.getByRole('alert').getByText(/Try again/).waitFor();
      assert.equal(await input.inputValue(),'Where is the station?');
      assert.equal(await page.locator('.user-row').count(),0,'failed voice send leaves no duplicate bubble');
      fail=false;const retryRequest=nextRequest();await page.getByRole('button',{name:'メッセージを送信',exact:true}).click();await retryRequest;
      await page.locator('.typing').waitFor();await pending();
      await page.getByText('I heard you.',{exact:true}).waitFor();assert.equal(await page.locator('.user-row').count(),1);
      // Leaving the conversation also invalidates the callback.
      await start();await page.getByRole('navigation',{name:webkit?'モバイルメニュー':'メインメニュー',exact:true}).getByRole('button',{name:'発音',exact:true}).click();
      const before=sent.length;await page.evaluate(()=>window.emitSpeech('After leaving'));assert.equal(sent.length,before);
      console.log(`PASS: ${webkit?'mobile webkitSpeechRecognition':'desktop SpeechRecognition'}: final speech sends once, interim/empty/canceled/late results never send, playback avoids echo, start/permission/network errors recover and manual retry works (recognition simulated)`);
      await page.close();
    }
    assert.deepEqual(errors,[]);
  }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);if(process.env.GITHUB_ACTIONS==='true')console.error(`::error::${String(error.stack||error).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A')}`);process.exitCode=1;});
