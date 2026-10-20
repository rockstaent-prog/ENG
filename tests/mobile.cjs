const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');

(async()=>{
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:4176,strictPort:true}});
  await server.listen();let browser;
  const errors=[];
  try{
    const executablePath=process.env.BROWSER_EXECUTABLE||['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
    browser=await chromium.launch({executablePath,args:['--no-sandbox']});
    async function fits(page,label,keyboard=false){
      await page.waitForFunction(()=>{
        const input=document.querySelector('.chat-form input'),nav=document.querySelector('.mobile-nav');
        if(!input)return false;
        const bottom=input.getBoundingClientRect().bottom;
        const limit=getComputedStyle(nav).display==='none'?innerHeight:nav.getBoundingClientRect().top;
        return bottom<=limit+1;
      },null,{timeout:5000});
      assert.equal(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)>innerWidth+1),false,`${label}: no horizontal overflow`);
      const input=await page.getByLabel('英語のメッセージ').boundingBox();
      assert.ok(input && input.y>=0 && input.y+input.height<=await page.evaluate(()=>innerHeight)+1,`${label}: input is visible`);
      assert.ok(await page.locator('.chat-messages').evaluate(el=>el.clientHeight>=38),`${label}: messages remain visible`);
      if(!keyboard)assert.ok(await page.locator('.stage-character').isVisible(),`${label}: avatar is visible`);
      assert.ok(await page.getByLabel('英語のメッセージ').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16),`${label}: input does not trigger iOS zoom`);
    }
    for(const [width,height] of [[320,568],[360,640],[375,667],[390,844],[430,932],[844,390]]){
      const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'ja-JP'});
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4176');
      const nav=page.getByRole('navigation',{name:'モバイルメニュー'});
      for (const label of ['学習する','発音','単語帳','学習の記録']) {
        await nav.getByRole('button',{name:label,exact:true}).click();
        assert.equal(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)>innerWidth+1),false,`${width}x${height}: ${label} fits the phone width`);
      }
      await nav.getByRole('button',{name:'会話する',exact:true}).click();
      await page.locator('.portrait-canvas[data-ready="true"]').waitFor();
      await fits(page,`${width}x${height}`);
      const avatarBox=await page.locator('.avatar-stage .stage-character').boundingBox();
      if(width<=650) assert.ok(avatarBox.width>=width*0.75 && avatarBox.height>=130,`${width}x${height}: large conversation avatar is the default`);
      await page.getByRole('button',{name:'履歴を広く',exact:true}).click();
      await fits(page,`${width}x${height} history view`);
      await page.getByRole('button',{name:'アバターを大きく',exact:true}).click();
      await page.getByRole('button',{name:'アバターを大きく見る',exact:true}).click();
      const enlarged=await page.getByRole('dialog').boundingBox();
      assert.ok(enlarged.x>=0 && enlarged.x+enlarged.width<=width+1,`${width}x${height}: enlarged avatar fits`);
      await page.getByRole('button',{name:'アバターの拡大を閉じる',exact:true}).click();
      await page.getByRole('button',{name:'アバター設定',exact:true}).click();
      await page.getByLabel('相棒の名前').fill('Emma');
      assert.ok(await page.getByLabel('相棒の名前').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
      await page.getByLabel('返事を自動で読み上げる').uncheck();
      await page.getByRole('button',{name:'アバター設定を閉じる'}).click();
      if(width===320 || width===390 || width===844){
        const tall=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=200;canvas.height=600;canvas.getContext('2d').fillRect(0,0,200,600);return canvas.toDataURL('image/png').split(',')[1];});
        await page.getByRole('button',{name:'アバター設定',exact:true}).click();
        await page.getByLabel('アバターを追加',{exact:true}).setInputFiles({name:'upper-body.png',mimeType:'image/png',buffer:Buffer.from(tall,'base64')});
        await page.getByRole('button',{name:'写真全体を映す',exact:true}).waitFor();
        await page.getByRole('button',{name:'アバター設定を閉じる'}).click();
        await page.locator('.original-photo-canvas[data-ready="true"]').waitFor();
        await fits(page,`${width}x${height} whole original photo`);
        await page.getByRole('button',{name:'アバター設定',exact:true}).click();
        await page.getByRole('button',{name:'エマ',exact:false}).click();
        await page.getByRole('button',{name:'アバター設定を閉じる'}).click();
      }
      if(width===390){
        await page.evaluate(()=>document.documentElement.style.setProperty('--safe-bottom','34px'));
        await fits(page,'iPhone-style bottom safe area');
        await page.evaluate(()=>document.documentElement.style.removeProperty('--safe-bottom'));
        await page.getByLabel('英語のメッセージ').fill('Hello');
        await page.setViewportSize({width,height:380});
        await page.waitForFunction(()=>document.documentElement.classList.contains('keyboard-open'));
        await fits(page,'keyboard-sized visible viewport',true);
        assert.ok(await page.locator('.avatar-stage .stage-character').isVisible(),'avatar remains visible with the keyboard');
        assert.equal(await nav.isVisible(),false);
        await page.evaluate(()=>document.activeElement.blur());
        await page.setViewportSize({width,height});
        await page.waitForFunction(()=>!document.documentElement.classList.contains('keyboard-open'));
        await fits(page,'keyboard closed');
        await page.getByLabel('英語のメッセージ').fill('Coffee, please.');
        await page.getByRole('button',{name:'メッセージを送信'}).click();
        await page.getByText('One coffee, coming right up! Would you like it hot or iced?',{exact:true}).waitFor();
        await page.screenshot({path:'test-results/phone-fit.png',fullPage:true});
      }
      console.log(`PASS: ${width}x${height} all five pages fit, visible avatar/input, readable text and usable settings`);
      await page.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: phone keyboard resize and bottom safe area (simulated geometry), no browser exceptions');
  }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
