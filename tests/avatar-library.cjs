const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const {createServer} = await import('vite');
  const server = await createServer({server:{host:'127.0.0.1',port:0}});
  await server.listen(); let browser;
  const url = `http://127.0.0.1:${server.httpServer.address().port}/?screen=talk`;
  const errors = [];
  try {
    const executablePath = process.env.BROWSER_EXECUTABLE || ['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
    browser = await chromium.launch({executablePath,args:['--no-sandbox']});
    for (const [width,height] of [[320,568],[390,844],[844,390]]) {
      const page = await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
      page.on('pageerror',e => errors.push(e.message));
      await page.addInitScript(() => {
        Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text;}}});
        Object.defineProperty(window,'speechSynthesis',{value:Object.assign(new EventTarget(),{
          getVoices:() => [{name:'Microsoft Aria Online (Natural)',lang:'en-US',voiceURI:'aria'},{name:'Microsoft Jenny Online (Natural)',lang:'en-US',voiceURI:'jenny'}],
          cancel(){window.testSpeech=null;},
          speak(utterance){window.testSpeech=utterance;utterance.onstart?.({});},
        })});
      });
      await page.goto(url);
      const photos = await page.evaluate(() => ['#bd7b8f','#6d9b87','#b7a56d'].map(color => {
        const canvas=document.createElement('canvas');canvas.width=240;canvas.height=440;
        const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,240,440);
        ctx.fillStyle='#fff';ctx.fillRect(75,60,90,120);ctx.fillRect(45,210,150,220);
        return canvas.toDataURL('image/png');
      }));
      // Migrate an existing single-photo setting without losing its picture.
      await page.evaluate(image => localStorage.setItem('komorebi-avatar',JSON.stringify({kind:'custom',image,name:'Nora',voiceURI:'aria',autoRead:false,photoMode:'whole'})),photos[0]);
      await page.reload();
      await page.getByRole('button',{name:'アバター設定',exact:true}).click();
      const collection=page.getByRole('region',{name:'追加したアバター',exact:true});
      await collection.getByRole('button',{name:'Noraと話す',exact:true}).waitFor();
      const upload = async (index, succeeds=true) => {
        await page.getByLabel('アバターを追加',{exact:true}).setInputFiles({name:`partner-${index}.png`,mimeType:'image/png',buffer:Buffer.from(photos[index].split(',')[1],'base64')});
        if(succeeds)await page.waitForFunction(image=>JSON.parse(localStorage.getItem('komorebi-avatar')).image===image&&!document.querySelector('.saved-avatars input[type=file]').disabled,photos[index]);
      };
      await upload(1);
      await page.getByLabel('相棒の名前').fill('Sara');
      await page.getByLabel('話す声（女性）').selectOption('jenny');
      await page.getByRole('button',{name:'顔を拡大する',exact:true}).click();
      await page.getByLabel('画像の上下位置').fill('28');
      await page.getByLabel('画像の拡大率').fill('1.3');
      await collection.getByRole('button',{name:'Saraと話す',exact:true}).waitFor();
      await upload(2);
      await page.getByLabel('相棒の名前').fill('Mia');
      await upload(1);
      assert.equal(await collection.locator('.saved-avatar-select').count(),3,'adding the same photo selects its saved partner without duplication');
      assert.equal(await page.getByLabel('相棒の名前').inputValue(),'Sara');
      await collection.getByRole('button',{name:'Noraと話す',exact:true}).click();
      assert.equal(await page.getByLabel('話す声（女性）').inputValue(),'aria');
      assert.equal(await page.getByRole('button',{name:'写真全体を映す',exact:true}).getAttribute('aria-pressed'),'true');
      await collection.getByRole('button',{name:'Saraと話す',exact:true}).click();
      assert.equal(await page.getByLabel('話す声（女性）').inputValue(),'jenny');
      assert.equal(await page.getByLabel('画像の上下位置').inputValue(),'28');
      assert.equal(await page.getByLabel('画像の拡大率').inputValue(),'1.3');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('komorebi-avatar')).image),photos[1]);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'gallery fits phone width');
      fs.mkdirSync('test-results',{recursive:true});
      await page.screenshot({path:`test-results/avatar-library-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:'このアバターで話す',exact:true}).click();
      await page.locator('.original-photo-canvas[data-ready="true"]').waitFor();
      assert.equal(await page.locator('.original-photo-canvas').evaluate(canvas=>canvas.width),512,'crop also uses the animated photo renderer');
      await page.getByRole('button',{name:'あいさつを聞く',exact:false}).click();
      await page.locator('.avatar-stage.is-speaking').waitFor();
      assert.equal(await page.evaluate(()=>window.testSpeech.voice.voiceURI),'jenny');
      const initial=await page.locator('.original-photo-canvas').getAttribute('data-head-turn');
      await page.waitForFunction(value=>document.querySelector('.original-photo-canvas').dataset.headTurn!==value,initial);
      const pixels=await page.locator('.original-photo-canvas').evaluate(canvas=>[...canvas.getContext('2d').getImageData(0,0,512,512).data].reduce((hash,value)=>(hash*31+value)>>>0,0));
      await page.waitForFunction(hash=>{const canvas=document.querySelector('.original-photo-canvas');return [...canvas.getContext('2d').getImageData(0,0,512,512).data].reduce((sum,value)=>(sum*31+value)>>>0,0)!==hash;},pixels);
      assert.equal(await page.locator('.stage-character').evaluate(el=>getComputedStyle(el).animationName),'none','photo frame does not rock as a whole');
      assert.equal(await page.locator('.portrait-canvas').count(),0,'custom photo never borrows the generated Emma face');
      await page.getByRole('button',{name:'読み上げを止める',exact:false}).click();
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.querySelector('.original-photo-canvas').dataset.headTurn==='0.00000');
      assert.equal(await page.locator('.original-photo-canvas').getAttribute('data-shoulder-shift'),'0.00000');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.reload();
      await page.getByText('Saraと英会話',{exact:true}).waitFor();
      await page.getByRole('button',{name:'アバター設定',exact:true}).click();
      assert.equal(await collection.locator('.saved-avatar-select').count(),3);
      await collection.getByRole('button',{name:'Miaを削除',exact:true}).click();
      await page.getByRole('button',{name:'やめる',exact:true}).click();
      assert.equal(await collection.locator('.saved-avatar-select').count(),3);
      await collection.getByRole('button',{name:'Miaを削除',exact:true}).click();
      await page.getByRole('button',{name:'削除する',exact:true}).click();
      assert.equal(await collection.locator('.saved-avatar-select').count(),2);
      // Failed persistence must leave both the old collection and active photo intact.
      await page.evaluate(()=>{
        window.originalSetItem=Storage.prototype.setItem;
        Storage.prototype.setItem=function(key,value){if(key==='komorebi-avatar-library')throw new DOMException('Quota exceeded','QuotaExceededError');return window.originalSetItem.call(this,key,value);};
      });
      await upload(2,false);
      await page.getByRole('alert').getByText(/アバターを保存できませんでした/).waitFor();
      assert.equal(await collection.locator('.saved-avatar-select').count(),2);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('komorebi-avatar')).name),'Sara');
      await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
      await collection.getByRole('button',{name:'Saraを削除',exact:true}).click();
      await page.getByRole('button',{name:'削除する',exact:true}).click();
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('komorebi-avatar')).kind),'portrait');
      await page.reload();
      await page.getByRole('button',{name:'アバター設定',exact:true}).click();
      assert.equal(await collection.locator('.saved-avatar-select').count(),1,'deleted active avatar is not resurrected on restart');
      console.log(`PASS: ${width}×${height}: migrate, add three photos, switch voice/framing, animate crop, reduced motion, reload, delete/cancel and recover from full storage (speech simulated)`);
      await page.close();
    }
    assert.deepEqual(errors,[]);
  } finally {await browser?.close();await server.close();}
})().catch(error=>{
  console.error(error);
  if(process.env.GITHUB_ACTIONS==='true')console.error(`::error::${String(error.stack||error).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A')}`);
  process.exitCode=1;
});
