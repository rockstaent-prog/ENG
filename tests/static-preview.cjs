const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const root = path.resolve('dist-preview');
  assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Run npm run build:preview first');
  const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png'};
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/ENG/')) {res.writeHead(404);return res.end();}
    const relative = decodeURIComponent(pathname.slice('/ENG/'.length)) || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);return res.end();}
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const errors = [], failedResponses = [], apiRequests = [];
  try {
    const executablePath = process.env.BROWSER_EXECUTABLE || ['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
    browser = await chromium.launch({executablePath,args:['--no-sandbox']});
    const page = await browser.newPage({viewport:{width:390,height:844},locale:'ja-JP'});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failedResponses.push(r.url());});
    page.on('request',r=>{if(r.url().includes('/api/'))apiRequests.push(r.url());});
    await page.goto(`http://127.0.0.1:${server.address().port}/ENG/`);
    await page.getByRole('heading',{name:'今日も、ひとつ成長しよう。'}).waitFor();
    const nav=page.getByRole('navigation',{name:'モバイルメニュー'});
    await nav.getByRole('button',{name:'会話する',exact:true}).click();
    await page.locator('.stage-character img').evaluate(image=>image.decode());
    assert.ok(await page.locator('.stage-character img').evaluate(image=>image.naturalWidth>0));
    await page.getByRole('button',{name:'アバター設定',exact:true}).click();
    await page.getByLabel('返事を自動で読み上げる').uncheck();
    await page.getByLabel('相棒の名前').fill('Emma');
    await page.getByRole('button',{name:'アバター設定を閉じる'}).click();
    await page.getByRole('button',{name:"I'd like a coffee, please."}).click();
    await page.getByText('One coffee, coming right up! Would you like it hot or iced?',{exact:true}).waitFor();
    await page.getByLabel('英語のメッセージ').fill('Hot, please.');
    await page.getByRole('button',{name:'メッセージを送信'}).click();
    await page.getByText('Great! A hot drink it is. Would you like anything to eat with that?',{exact:true}).waitFor();
    await page.getByRole('button',{name:'はじめての友だち',exact:false}).click();
    await page.getByLabel('英語のメッセージ').fill('Could you repeat?');
    await page.getByRole('button',{name:'メッセージを送信'}).click();
    await page.getByText('Of course! My name is Emma. What is your name?',{exact:true}).waitFor();
    await nav.getByRole('button',{name:'学習する',exact:true}).click();
    await page.getByRole('button',{name:'レッスンをはじめる',exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:'2 Hello',exact:false}).click();
    await page.getByRole('button',{name:'答え合わせ'}).click();
    await page.getByRole('heading',{name:'そのとおり！',exact:false}).waitFor();
    await page.getByRole('button',{name:'レッスンを閉じる'}).click();
    await page.getByRole('button',{name:'終了する',exact:true}).click();
    await nav.getByRole('button',{name:'単語帳',exact:true}).click();
    assert.equal(await page.locator('.word-card').count(),24);
    await nav.getByRole('button',{name:'学習の記録',exact:true}).click();
    await page.getByRole('heading',{name:'この1週間の学習'}).waitFor();
    await page.reload();
    await nav.getByRole('button',{name:'会話する',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const input=await page.getByLabel('英語のメッセージ').boundingBox(), menu=await nav.boundingBox();
    assert.ok(input.y+input.height<menu.y);
    await page.goto(`http://127.0.0.1:${server.address().port}/ENG/?screen=pronunciation`);
    await page.getByRole('heading',{name:'英語の音を、口から覚えよう。',exact:true}).waitFor();
    await page.getByRole('button',{name:'R と L を言い分けるを練習する',exact:true}).click();
    await page.getByText('right',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);assert.deepEqual(failedResponses,[]);assert.deepEqual(apiRequests,[]);
    console.log('PASS: static /ENG/ hosting displays app and avatar, supports multi-turn conversation, naming, lessons, vocabulary, statistics and mobile layout without any API server or failed asset requests');
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
