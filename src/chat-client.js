import { guidedReply } from './conversation.js';

export function browserReply({ scene, partnerName, messages }) {
  const answer = guidedReply(scene, messages.at(-1).content, messages.filter(m => m.role === 'user').length);
  const name = partnerName?.trim() || 'Emma';
  return { ...answer, reply: answer.reply.replace(/\bAlex\b/g, () => name), translation: answer.translation.replace(/アレックス/g, () => name), browserOnly: true };
}

export async function requestChatReply(payload, { signal, fetcher = globalThis.fetch, timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetcher('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify(payload),
    });
    // Plain static hosts have no API; keep the same practice conversation usable.
    if ([404, 405].includes(response.status) || (response.ok && !/\bjson\b/i.test(response.headers.get('content-type') || ''))) return browserReply(payload);
    let data;
    try { data = await response.json(); }
    catch { throw new Error('返事を読み込めませんでした。もう一度送信してください。'); }
    if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : '通信に失敗しました。もう一度送信してください。');
    if (!data || typeof data.reply !== 'string' || !data.reply.trim() || typeof data.translation !== 'string' || !Array.isArray(data.suggestions) || data.suggestions.some(s => typeof s !== 'string')) throw new Error('返事を読み込めませんでした。もう一度送信してください。');
    return { reply: data.reply, translation: data.translation, suggestions: data.suggestions.slice(0, 3), tip: typeof data.tip === 'string' ? data.tip : '', mode: data.mode === 'ai' ? 'ai' : 'guided' };
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');
    if (timedOut) throw new Error('返事に時間がかかっています。もう一度送信するか、練習会話で続けてください。');
    if (error instanceof TypeError) throw new Error('通信できませんでした。接続を確認するか、練習会話で続けてください。');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
