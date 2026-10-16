const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const http = require('node:http');

(async () => {
  // Copy only the delivered HTML into an otherwise empty directory, as after download.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'komorebi-download-'));
  const file = path.join(directory, 'komorebi.html');
  fs.copyFileSync('preview/komorebi.html', file);
  let browser, server;
  let appURL = pathToFileURL(file).href;
  let fileNavigationVerified = true;
  const errors = [], network = [], otherFiles = [];
  try {
    const executablePath = process.env.BROWSER_EXECUTABLE || ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
    browser = await chromium.launch({executablePath,args:['--no-sandbox']});
    async function newPage() {
      const result = await browser.newPage({viewport:{width:1280,height:1000},locale:'ja-JP'});
      result.on('pageerror',e=>errors.push(e.message));
      result.on('request',request=>{
        if (/^https?:/.test(request.url()) && request.url() !== appURL) network.push(request.url());
        if (request.url().startsWith('file:') && request.url() !== pathToFileURL(file).href) otherFiles.push(request.url());
      });
      await result.route('**/*',route=> /^https?:/.test(route.request().url()) && route.request().url() !== appURL ? route.abort() : route.continue());
      return result;
    }
    let page = await newPage();
    try { await page.goto(appURL); }
    catch(error) {
      if (!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR')) throw error;
      fileNavigationVerified = false;
      console.log('SKIP: file:// navigation is blocked by the managed browser policy; testing the same single HTML over HTTP instead.');
      server = http.createServer((req,res)=>{
        if(req.url !== '/komorebi.html'){res.writeHead(404);return res.end();}
        res.setHeader('Content-Type','text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
      });
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      appURL = `http://127.0.0.1:${server.address().port}/komorebi.html`;
      await page.close(); page = await newPage();
      await page.goto(appURL);
    }
    await page.getByRole('heading',{name:'今日も、ひとつ成長しよう。'}).waitFor();
    const nav=page.getByRole('navigation',{name:'メインメニュー',exact:true});
    await nav.getByRole('button',{name:'会話する'}).click();
    const portrait=page.locator('.stage-character img');
    assert.ok((await portrait.getAttribute('src')).startsWith('data:image/png;base64,'));
    await portrait.evaluate(image=>image.decode());
    assert.ok(await portrait.evaluate(image=>image.naturalWidth>0));
    await page.getByRole('button',{name:'アバター設定',exact:true}).click();
    await page.getByLabel('返事を自動で読み上げる').uncheck();
    await page.getByLabel('相棒の名前').fill('Nora');
    await page.getByRole('button',{name:'アバター設定を閉じる'}).click();
    await page.getByLabel('英語のメッセージ').fill("I'd like tea, please.");
    await page.getByRole('button',{name:'メッセージを送信'}).click();
    await page.getByText('One tea, coming right up! Would you like it hot or iced?',{exact:true}).waitFor();
    await page.getByLabel('英語のメッセージ').fill('Iced, please.');
    await page.getByRole('button',{name:'メッセージを送信'}).click();
    await page.getByText('Great! An iced drink it is. Would you like anything to eat with that?',{exact:true}).waitFor();
    await page.getByRole('button',{name:'はじめての友だち',exact:false}).click();
    await page.getByLabel('英語のメッセージ').fill('Could you repeat?');
    await page.getByRole('button',{name:'メッセージを送信'}).click();
    await page.getByText('Of course! My name is Nora. What is your name?',{exact:true}).waitFor();
    console.log(`PASS: single HTML ${fileNavigationVerified ? 'opens directly from file://' : 'is served without any auxiliary files'}, displays embedded Emma portrait and supports multi-turn named-avatar conversation without an API`);

    await nav.getByRole('button',{name:'学習する',exact:true}).click();
    await page.getByRole('button',{name:'レッスンをはじめる',exact:true}).click();
    const dialog=page.getByRole('dialog');
    const {lessons}=await import('../src/data.js');
    for (const [index,q] of lessons[0].questions.entries()) {
      if(q.type==='choice') await dialog.getByRole('button',{name:`${q.options.indexOf(q.answer)+1} ${q.answer}`,exact:true}).click();
      else for(const word of q.answer) await dialog.locator('.word-bank').getByRole('button',{name:word,exact:true}).click();
      await dialog.getByRole('button',{name:'答え合わせ'}).click();
      await dialog.getByRole('button',{name:index===4?'結果を見る':'次へ進む'}).click();
    }
    await dialog.getByText('+35',{exact:true}).waitFor();
    await dialog.getByRole('button',{name:'学びの道のりに戻る'}).click();
    assert.ok(await page.getByRole('button',{name:'カフェでひといきをはじめる'}).isVisible());
    await page.reload();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('komorebi-progress')).xp),35);
    await nav.getByRole('button',{name:'単語帳',exact:true}).click();
    await page.getByRole('button',{name:'学習済み',exact:true}).click();
    assert.equal(await page.locator('.word-card').count(),4);
    await nav.getByRole('button',{name:'学習の記録',exact:true}).click();
    assert.equal(await page.locator('.achievement.earned').count(),1);
    await nav.getByRole('button',{name:'会話する'}).click();
    assert.ok(await page.getByText('Noraと英会話',{exact:true}).isVisible());
    fs.mkdirSync('test-results',{recursive:true});
    await page.screenshot({path:'test-results/standalone-working.png',fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(network,[]);assert.deepEqual(otherFiles,[]);
    console.log('PASS: single-file app completes all five lesson questions, unlocks next lesson, persists XP/avatar settings across reload, and displays learned words and achievements');
    console.log('PASS: zero external network requests, zero additional files required, zero JavaScript errors');
  } finally {await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
