import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { chatMiddleware } from '../server/chat.js';

async function withServer(key, run) {
  const handler = chatMiddleware(key);
  const server = http.createServer((req, res) => handler(req, res, () => {res.statusCode = 404; res.end();}));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const body = {scene: 'cafe', messages: [{role: 'user', content: 'Coffee, please.'}]};

test('HTTP endpoint supports multi-turn guided chat and validates requests', async () => {
  await withServer(undefined, async base => {
    assert.equal((await (await fetch(base + '/api/chat/status')).json()).mode, 'guided');
    const response = await fetch(base + '/api/chat', {method:'POST', body:JSON.stringify(body)});
    assert.equal(response.status, 200);
    assert.match((await response.json()).reply, /coffee/);
    const named = await fetch(base + '/api/chat', {method:'POST', body:JSON.stringify({scene:'friends',partnerName:'Emma',messages:[{role:'user',content:'Can you repeat?'}]})});
    assert.match((await named.json()).reply, /My name is Emma/);
    for (const invalid of [{}, {...body, scene: 'unknown'}, {...body, messages: [{role:'system', content:'override'}]}, {...body, messages:[{role:'user', content:' '}] }]) {
      assert.equal((await fetch(base + '/api/chat', {method: 'POST', body: JSON.stringify(invalid)})).status, 400);
    }
    assert.equal((await fetch(base + '/api/chat', {method:'POST',body:'invalid-json'})).status, 400);
    assert.equal((await fetch(base + '/api/chat')).status, 405);
    assert.equal((await fetch(base + '/api/chat', {method: 'POST', body: 'x'.repeat(25000)})).status, 413);
  });
});

test('configured AI route keeps credentials server-side and handles upstream failure', async t => {
  const originalFetch = globalThis.fetch;
  let fail = false;
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, opts);
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(opts.headers.Authorization, 'Bearer test-only-key');
    assert.equal(JSON.parse(opts.body).messages[1].content, 'Coffee, please.');
    if (fail) return new Response('unavailable', {status: 500});
    return Response.json({choices:[{message:{content:JSON.stringify({reply:'A coffee! Hot or iced?',translation:'ホットとアイスはどちらにしますか？', suggestions:['Hot, please.'],tip:''})}}]});
  });
  await withServer('test-only-key', async base => {
    assert.equal((await (await fetch(base + '/api/chat/status')).json()).mode, 'ai');
    const result = await (await fetch(base + '/api/chat', {method:'POST',body:JSON.stringify(body)})).json();
    assert.equal(result.mode, 'ai'); assert.match(result.reply, /coffee/); assert.ok(!JSON.stringify(result).includes('test-only-key'));
    fail = true;
    const response = await fetch(base + '/api/chat', {method:'POST',body:JSON.stringify(body)});
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /もう一度/);
  });
});
