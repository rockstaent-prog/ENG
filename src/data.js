const choice = (prompt, options, answer, english, note) => ({ type: 'choice', prompt, options, answer, english, note });
const order = (prompt, words, answer, note) => ({ type: 'order', prompt, words, answer, english: answer.join(' '), note });

export const lessons = [
  { id: 'hello', title: 'はじめまして', subtitle: 'あいさつから、はじめよう', icon: 'wave', color: 'purple', words: [ ['Hello', 'こんにちは'], ['Thank you', 'ありがとう'], ['Good morning', 'おはよう'], ['Nice to meet you', 'はじめまして'] ], questions: [
    choice('「こんにちは」を英語で言うと？', ['Goodbye', 'Hello', 'Sorry', 'Good night'], 'Hello', 'Hello', 'Hello は、時間を問わず使えるあいさつです。'),
    choice('「ありがとう」を英語で言うと？', ['Please', 'Welcome', 'Thank you', 'Excuse me'], 'Thank you', 'Thank you', 'Thank you に very much を添えると「本当にありがとう」。'),
    order('「私の名前はハナです」を英語にしよう', ['Hana', 'name', 'My', 'is'], ['My', 'name', 'is', 'Hana'], 'My name is … で、自分の名前を伝えられます。'),
    choice('朝のあいさつはどれ？', ['Good evening', 'Good night', 'Goodbye', 'Good morning'], 'Good morning', 'Good morning', 'morning は「朝」。夜のあいさつは Good evening です。'),
    order('「はじめまして」を英語にしよう', ['you', 'Nice', 'meet', 'to'], ['Nice', 'to', 'meet', 'you'], '初めて会った人には Nice to meet you. と伝えましょう。'),
  ] },
  { id: 'cafe', title: 'カフェでひといき', subtitle: 'お気に入りの一杯を注文', icon: 'coffee', color: 'peach', words: [ ['coffee', 'コーヒー'], ['tea', '紅茶・お茶'], ['please', 'お願いします'], ['water', '水'] ], questions: [
    choice('「コーヒー」は英語で？', ['water', 'coffee', 'bread', 'milk'], 'coffee', 'coffee', 'A coffee, please. で「コーヒーを1つお願いします」。'),
    order('「お茶をお願いします」を英語にしよう', ['please', 'Tea'], ['Tea', 'please'], 'please をつけると、丁寧なお願いになります。'),
    choice('Water の意味は？', ['牛乳', 'ジュース', '水', '紅茶'], '水', 'water', 'water は「水」。Can I have some water? でも頼めます。'),
    order('「私はコーヒーが好きです」を英語にしよう', ['coffee', 'I', 'like'], ['I', 'like', 'coffee'], 'I like … で、好きなものを伝えられます。'),
    choice('「おいしい！」と伝えたいときは？', ["It's cold!", "It's delicious!", "It's late!", "It's small!"], "It's delicious!", "It's delicious!", 'delicious は、食べ物や飲み物が「おいしい」という意味です。'),
  ] },
  { id: 'daily', title: 'わたしの毎日', subtitle: 'いつもの日常を英語に', icon: 'sun', color: 'mint', words: [ ['every day', '毎日'], ['read', '読む'], ['work', '働く'], ['breakfast', '朝食'] ], questions: [
    choice('「毎日」は英語で？', ['every day', 'next week', 'last night', 'tomorrow'], 'every day', 'every day', 'every day は「毎日」。習慣を話すときによく使います。'),
    order('「私は本を読みます」を英語にしよう', ['books', 'read', 'I'], ['I', 'read', 'books'], 'read は「読む」。books は book の複数形です。'),
    choice('Breakfast の意味は？', ['昼食', '夕食', 'おやつ', '朝食'], '朝食', 'breakfast', '朝食は breakfast、昼食は lunch、夕食は dinner です。'),
    order('「私は英語を勉強します」を英語にしよう', ['English', 'I', 'study'], ['I', 'study', 'English'], 'study は「勉強する」。言語の名前は大文字で始めます。'),
    choice('「私は歩いて通勤します」はどれ？', ['I walk to work.', 'I like my work.', 'I work at home.', 'I go to sleep.'], 'I walk to work.', 'I walk to work.', 'walk to … で「…へ歩いて行く」という意味になります。'),
  ] },
  { id: 'travel', title: '旅に出よう', subtitle: '新しい景色に出会う英語', icon: 'plane', color: 'blue', words: [ ['station', '駅'], ['ticket', '切符'], ['left', '左'], ['hotel', 'ホテル'] ], questions: [
    choice('「駅」は英語で？', ['airport', 'station', 'school', 'park'], 'station', 'station', 'train station と言うと「鉄道の駅」とはっきり伝わります。'),
    order('「駅はどこですか」を英語にしよう', ['station', 'Where', 'the', 'is'], ['Where', 'is', 'the', 'station'], 'Where is …? は場所をたずねるときの基本表現です。'),
    choice('Turn left. の意味は？', ['まっすぐ進む', '右に曲がる', '左に曲がる', '止まる'], '左に曲がる', 'Turn left.', 'left は「左」、right は「右」です。'),
    order('「切符を1枚お願いします」を英語にしよう', ['ticket', 'One', 'please'], ['One', 'ticket', 'please'], 'One ticket, please. で切符を1枚頼めます。'),
    choice('「手伝ってもらえますか」はどれ？', ['Can you help me?', 'How are you?', 'What is this?', 'See you later.'], 'Can you help me?', 'Can you help me?', '困ったときに使える便利なフレーズです。'),
  ] },
  { id: 'friends', title: 'もっと話そう', subtitle: '好きなことをシェアしよう', icon: 'chat', color: 'pink', words: [ ['music', '音楽'], ['favorite', 'お気に入りの'], ['weekend', '週末'], ['together', '一緒に'] ], questions: [
    choice('「音楽」は英語で？', ['movie', 'music', 'museum', 'market'], 'music', 'music', 'I love music. で「音楽が大好き」と伝えられます。'),
    order('「あなたは何が好きですか」を英語にしよう', ['like', 'What', 'you', 'do'], ['What', 'do', 'you', 'like'], 'What do you like? で相手の好みを聞いてみましょう。'),
    choice('Weekend の意味は？', ['平日', '週末', '今夜', '来年'], '週末', 'weekend', '週末は weekend、平日は weekday です。'),
    order('「一緒に行きましょう」を英語にしよう', ['together', "Let’s", 'go'], ["Let’s", 'go', 'together'], 'Let’s … で「…しましょう」と誘えます。'),
    choice('「いいですね！」はどれ？', ['Sounds good!', 'Never mind.', 'Be careful.', 'Not yet.'], 'Sounds good!', 'Sounds good!', 'Sounds good! は相手の提案に賛成するときに使えます。'),
  ] },
  { id: 'shopping', title: '街でお買いもの', subtitle: '自分の言葉で選んでみよう', icon: 'bag', color: 'peach', words: [ ['price', '値段'], ['size', 'サイズ'], ['small', '小さい'], ['this', 'これ'] ], questions: [
    choice('「値段」は英語で？', ['place', 'price', 'piece', 'please'], 'price', 'price', 'price は「値段」。price tag は「値札」です。'),
    order('「これはいくらですか」を英語にしよう', ['this', 'much', 'How', 'is'], ['How', 'much', 'is', 'this'], 'How much is …? で値段を聞くことができます。'),
    choice('「小さい」は英語で？', ['large', 'long', 'small', 'tall'], 'small', 'small', 'small は「小さい」、large は「大きい」です。'),
    order('「これを買います」を英語にしよう', ['take', 'this', 'I’ll'], ['I’ll', 'take', 'this'], 'I’ll take this. はお店で購入を決めたときの定番表現。'),
    choice('「見ているだけです」はどれ？', ["I'm just looking.", "I'm very hungry.", "It's too late.", "Here you are."], "I'm just looking.", "I'm just looking.", '店員さんに声をかけられたときに使えます。'),
  ] },
];

export const initialProgress = { completed: [], xp: 0, history: {}, mistakes: [], best: {} };
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function streak(history, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!history[localDay(date)]) date.setDate(date.getDate() - 1);
  let count = 0;
  while (history[localDay(date)]) { count++; date.setDate(date.getDate() - 1); }
  return count;
}
export function awardProgress(progress, lessonId, correct, total, mistakes, date = new Date()) {
  const earned = correct * 5 + 10;
  const day = localDay(date);
  const fresh = mistakes.map(q => ({ ...q, key: q.prompt }));
  const answered = lessons.find(l => l.id === lessonId)?.questions.map(q => q.prompt) ?? [];
  const old = lessonId === 'review' ? [] : progress.mistakes.filter(q => !answered.includes(q.prompt));
  return {
    ...progress,
    completed: lessonId === 'review' ? progress.completed : [...new Set([...progress.completed, lessonId])],
    xp: progress.xp + earned,
    history: { ...progress.history, [day]: (progress.history[day] || 0) + earned },
    mistakes: [...old, ...fresh].filter((q, i, arr) => arr.findIndex(v => v.prompt === q.prompt) === i),
    best: { ...progress.best, [lessonId]: Math.max(progress.best[lessonId] || 0, Math.round(correct / total * 100)) },
  };
}
export function readProgress(storage) {
  try {
    const p = JSON.parse(storage.getItem('komorebi-progress'));
    if (!p || !Array.isArray(p.completed) || !Number.isFinite(p.xp) || p.xp < 0 || !p.history || typeof p.history !== 'object' || Array.isArray(p.history) || !Array.isArray(p.mistakes) || !p.best || typeof p.best !== 'object') return structuredClone(initialProgress);
    // Rebuild saved reviews from current lesson questions. Stored objects may be
    // damaged or belong to an older version and must never become React children.
    const questions = lessons.flatMap(l => l.questions);
    const reviews = p.mistakes.map(q => questions.find(current => current.prompt === q?.prompt)).filter(Boolean);
    const finite = value => Number.isFinite(value) && value >= 0;
    return {
      completed: [...new Set(p.completed.filter(id => lessons.some(l => l.id === id)))],
      xp: p.xp,
      history: Object.fromEntries(Object.entries(p.history).filter(([day, value]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && finite(value))),
      mistakes: [...new Set(reviews)],
      best: Object.fromEntries(Object.entries(p.best).filter(([id, value]) => (id === 'review' || lessons.some(l => l.id === id)) && finite(value) && value <= 100)),
    };
  } catch { return structuredClone(initialProgress); }
}
