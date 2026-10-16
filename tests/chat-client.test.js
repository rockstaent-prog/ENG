import test from 'node:test';
import assert from 'node:assert/strict';
import { requestChatReply } from '../src/chat-client.js';

const payload = { scene: 'friends', partnerName: 'Nora', messages: [{ role: 'user', content: 'Could you repeat?' }] };

test('missing API on plain static hosting keeps a named practice conversation working', async () => {
  for (const response of [new Response('', {status:404}), new Response('<html>App</html>', {headers:{'Content-Type':'text/html'}})]) {
    const answer = await requestChatReply(payload, { fetcher: async () => response });
    assert.equal(answer.browserOnly, true);
    assert.match(answer.reply, /My name is Nora/);
    assert.equal(answer.mode, 'guided');
  }
});

test('invalid or empty server answers report readable failures instead of breaking the chat', async () => {
  for (const answer of [null, {}, { reply:'', translation:'', suggestions:[] }, {reply:'Hi',translation:'やあ',suggestions:[{}]}]) {
    await assert.rejects(requestChatReply(payload, { fetcher: async () => Response.json(answer) }), /返事を読み込めませんでした/);
  }
  await assert.rejects(requestChatReply(payload, { fetcher: async () => new Response('bad json', {headers:{'Content-Type':'application/json'}}) }), /返事を読み込めませんでした/);
});

test('server errors keep the retry message and do not silently switch an AI conversation', async () => {
  await assert.rejects(requestChatReply(payload, { fetcher: async () => Response.json({error:'もう一度送信してください。'}, {status:502}) }), /もう一度送信/);
});

const pendingFetch = (_url, {signal}) => new Promise((_, reject) => {
  const abort = () => reject(new DOMException('Canceled', 'AbortError'));
  if (signal.aborted) abort(); else signal.addEventListener('abort', abort, {once:true});
});

test('a stalled reply times out with a recovery message', async () => {
  await assert.rejects(requestChatReply(payload, { fetcher: pendingFetch, timeoutMs: 15 }), /返事に時間がかかっています/);
});

test('leaving the page aborts a pending reply without a timeout error', async () => {
  const controller = new AbortController();
  const reply = requestChatReply(payload, { fetcher: pendingFetch, signal:controller.signal });
  controller.abort();
  await assert.rejects(reply, { name: 'AbortError' });
});

test('valid AI replies remain usable and network failures have a practice recovery message', async () => {
  const answer = {reply:'Hello!',translation:'こんにちは！',suggestions:['Hi!'],tip:'',mode:'ai'};
  assert.deepEqual(await requestChatReply(payload, {fetcher:async()=>Response.json(answer)}), answer);
  await assert.rejects(requestChatReply(payload, {fetcher:async()=>{throw new TypeError('Failed to fetch');}}), /練習会話で続けて/);
});
