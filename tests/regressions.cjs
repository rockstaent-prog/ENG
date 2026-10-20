const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const { createServer } = await import('vite');
  const { lessons } = await import('../src/data.js');
  const root = path.resolve('dist');
  assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Run npm run build first');
  const dev = await createServer({server:{host:'127.0.0.1',port:4177,strictPort:true}});
  const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png'};
  const staticHost = http.createServer((req, res) => {
    const file = path.resolve(root, decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1)) || 'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);return res.end();}
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  let browser;
  const errors = [];
  try {
    await dev.listen();
    await new Promise(resolve => staticHost.listen(0,'127.0.0.1',resolve));
    browser = await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || ['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p)),args:['--no-sandbox']});
    const newPage = async () => {
      const page = await browser.newPage({viewport:{width:1280,height:900},locale:'ja-JP'});
      page.on('pageerror', e => errors.push(e.message));
      return page;
    };
    const nav = page => page.getByRole('navigation',{name:'メインメニュー',exact:true});
    const openChat = async (page, url) => {
      await page.goto(url);
      await nav(page).getByRole('button',{name:'会話する'}).click();
      await page.getByRole('button',{name:'アバター設定',exact:true}).click();
      await page.getByLabel('返事を自動で読み上げる').uncheck();
      await page.getByRole('button',{name:'アバター設定を閉じる'}).click();
    };
    const send = async (page, text) => {
      await page.getByLabel('英語のメッセージ').fill(text);
      await page.getByRole('button',{name:'メッセージを送信'}).click();
    };

    const hosted = await newPage();
    let attempts = 0;
    hosted.on('request',r=>{if(r.url().endsWith('/api/chat')) attempts++;});
    await openChat(hosted, `http://127.0.0.1:${staticHost.address().port}/`);
    await send(hosted,'Coffee, please.');
    await hosted.getByText('One coffee, coming right up! Would you like it hot or iced?',{exact:true}).waitFor();
    await send(hosted,"I'll pay by card.");
    await hosted.getByText("Perfect! Here's your drink. Enjoy your day!",{exact:true}).waitFor();
    assert.equal(attempts,1,'missing API is detected once, then conversation stays in the browser');
    assert.equal(await hosted.getByRole('alert').count(),0);
    await hosted.close();
    console.log('PASS: ordinary production build works on a plain static host without an API; card payment advances the conversation');

    const stored = await newPage();
    await stored.addInitScript(prompt => localStorage.setItem('komorebi-progress', JSON.stringify({completed:['hello','hello'],xp:35,history:{'2026-10-16':{}},best:{hello:80},mistakes:[{type:'order',prompt:'damaged',words:[{}],answer:[{}]},{prompt,options:[{}]}]})), lessons[0].questions[0].prompt);
    await stored.goto('http://127.0.0.1:4177');
    await stored.getByRole('button',{name:'おさらいする',exact:false}).click();
    await stored.getByRole('dialog').getByRole('button',{name:'2 Hello',exact:true}).click();
    await stored.getByRole('button',{name:'答え合わせ'}).click();
    await stored.getByRole('button',{name:'結果を見る'}).click();
    await stored.getByRole('heading',{name:'よくがんばりました！'}).waitFor();
    await stored.getByRole('button',{name:'学びの道のりに戻る',exact:false}).click();
    const repaired = await stored.evaluate(()=>JSON.parse(localStorage.getItem('komorebi-progress')));
    assert.deepEqual(repaired.completed,['hello']);assert.deepEqual(repaired.mistakes,[]);assert.equal(repaired.xp,50);
    await stored.close();
    console.log('PASS: damaged saved reviews recover, canonical questions are answerable and existing XP is retained');

    const recovery = await newPage();
    await openChat(recovery,'http://127.0.0.1:4177');
    let failedRequests=0;
    await recovery.route('**/api/chat',route=>{failedRequests++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:{broken:true},translation:'',suggestions:[]})});});
    await send(recovery,'Tea, please.');
    await recovery.getByRole('alert').getByText(/返事を読み込めませんでした/).waitFor();
    assert.equal(await recovery.getByLabel('英語のメッセージ').inputValue(),'Tea, please.');
    await recovery.getByRole('button',{name:'練習会話で続ける',exact:false}).click();
    await recovery.getByText('One tea, coming right up! Would you like it hot or iced?',{exact:true}).waitFor();
    assert.equal(failedRequests,1);assert.equal(await recovery.locator('.user-row').count(),1);
    await recovery.close();
    console.log('PASS: malformed replies preserve input and one recovery button continues practice without duplicate messages');

    const mic = await newPage();
    await mic.addInitScript(()=>{
      window.SpeechRecognition=class {
        constructor(){window.lastRecognition=this;}
        start(){window.oldResult=this.onresult;}
        stop(){this.onend?.();}
        abort(){this.aborted=true;}
      };
    });
    await openChat(mic,'http://127.0.0.1:4177');
    await mic.getByRole('button',{name:'音声で入力',exact:true}).click();
    await mic.getByRole('button',{name:'旅先で道案内',exact:false}).click();
    await mic.evaluate(()=>window.oldResult({results:[[{transcript:'late microphone text'}]]}));
    assert.equal(await mic.getByLabel('英語のメッセージ').inputValue(),'');
    assert.equal(await mic.evaluate(()=>window.lastRecognition.aborted),true);
    await mic.getByRole('button',{name:'音声で入力',exact:true}).click();
    await mic.evaluate(()=>window.lastRecognition.onresult({results:[[{transcript:'a'.repeat(700)}]]}));
    await mic.waitForFunction(()=>document.querySelector('.chat-form input').value.length===500);
    assert.equal((await mic.getByLabel('英語のメッセージ').inputValue()).length,500);
    await mic.close();
    console.log('PASS: late microphone results cannot overwrite a new scene and recognized text respects the message limit (microphone simulated)');

    const course = await newPage();
    await course.goto('http://127.0.0.1:4177');
    for (const lesson of lessons) {
      await course.getByRole('button',{name:`${lesson.title}をはじめる`,exact:true}).click();
      const dialog=course.getByRole('dialog');
      for (const [index,question] of lesson.questions.entries()) {
        if(question.type==='choice') await dialog.getByRole('button',{name:`${question.options.indexOf(question.answer)+1} ${question.answer}`,exact:true}).click();
        else for(const word of question.answer) await dialog.locator('.word-bank').getByRole('button',{name:word,exact:true}).click();
        await dialog.getByRole('button',{name:'答え合わせ'}).click();
        await dialog.getByRole('heading',{name:'そのとおり！',exact:false}).waitFor();
        await dialog.getByRole('button',{name:index===lesson.questions.length-1?'結果を見る':'次へ進む'}).click();
      }
      await dialog.getByText('+35',{exact:true}).waitFor();
      await dialog.getByRole('button',{name:'学びの道のりに戻る',exact:false}).click();
    }
    await course.reload();
    const progress=await course.evaluate(()=>JSON.parse(localStorage.getItem('komorebi-progress')));
    assert.equal(progress.xp,210);assert.equal(progress.completed.length,6);assert.deepEqual(progress.mistakes,[]);
    await nav(course).getByRole('button',{name:'単語帳',exact:true}).click();
    await course.getByRole('button',{name:'学習済み',exact:true}).click();
    assert.equal(await course.locator('.word-card').count(),24);
    await nav(course).getByRole('button',{name:'学習の記録',exact:true}).click();
    assert.equal(await course.locator('.achievement.earned').count(),3);
    await course.close();
    console.log('PASS: all 30 questions across six lessons, sequential unlocks, 210 XP persistence, all vocabulary and earned achievements');
    assert.deepEqual(errors,[]);
  } finally {
    await browser?.close(); await dev.close();
    if(staticHost.listening) await new Promise(resolve=>staticHost.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
