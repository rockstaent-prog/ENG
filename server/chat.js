import { scenes, guidedReply } from '../src/conversation.js';

export function chatMiddleware(apiKey) {
  return async (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (path === '/api/chat/status' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ mode: apiKey ? 'ai' : 'guided' }));
    }
    if (path !== '/api/chat') return next();
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'POSTを使用してください。' })); }
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 24000) { res.statusCode = 413; return res.end(JSON.stringify({ error: '会話が長すぎます。新しい会話を始めてください。' })); }
      }
      const { scene, messages, partnerName } = JSON.parse(body);
      if (partnerName !== undefined && (typeof partnerName !== 'string' || partnerName.length > 24)) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'アバターの名前を確認してください。' })); }
      const name = partnerName?.trim() || 'Alex';
      if (!scenes[scene] || !Array.isArray(messages) || !messages.length || messages.length > 24 || messages.some(m => !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 1000) || messages.at(-1).role !== 'user' || !messages.at(-1).content.trim()) {
        res.statusCode = 400; return res.end(JSON.stringify({ error: 'メッセージを確認してください。' }));
      }
      if (!apiKey) {
        const reply = guidedReply(scene, messages.at(-1).content, messages.filter(m => m.role === 'user').length);
        reply.reply = reply.reply.replace(/\bAlex\b/g, () => name);
        reply.translation = reply.translation.replace(/アレックス/g, () => name);
        return res.end(JSON.stringify(reply));
      }
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(25000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, max_tokens: 500, messages: [
          { role: 'system', content: `You are a kind English conversation partner for a Japanese beginner. Your name is ${JSON.stringify(name)}. Roleplay as ${scene === 'friends' ? 'a new friend' : scenes[scene].role} in scenario ${scenes[scene].title}. Reply naturally to the learner in 1-3 short English sentences at A1-A2 level, ask a follow-up question. Return JSON with reply (English), translation (Japanese translation of reply), suggestions (2-3 short possible English learner replies), tip (brief Japanese correction or encouragement, empty string if unnecessary). Never claim to perform real transactions. Keep the conversation educational.` },
          ...messages,
        ] }),
      });
      if (!upstream.ok) throw new Error('upstream');
      const result = await upstream.json();
      const answer = JSON.parse(result.choices[0].message.content);
      if (typeof answer.reply !== 'string' || typeof answer.translation !== 'string' || !Array.isArray(answer.suggestions) || answer.suggestions.some(s => typeof s !== 'string')) throw new Error('format');
      res.end(JSON.stringify({ reply: answer.reply, translation: answer.translation, suggestions: answer.suggestions.slice(0, 3), tip: typeof answer.tip === 'string' ? answer.tip : '', mode: 'ai' }));
    } catch (error) {
      res.statusCode = error instanceof SyntaxError ? 400 : 502;
      res.end(JSON.stringify({ error: error instanceof SyntaxError ? 'メッセージの形式を確認してください。' : '返事を取得できませんでした。少し待ってから、もう一度送信してください。' }));
    }
  };
}
