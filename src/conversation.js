export const scenes = {
  cafe: { title: 'カフェで注文', icon: '☕', role: 'バリスタ', intro: 'Hi! Welcome to Maple Café. What would you like to drink?', translation: 'こんにちは！メープルカフェへようこそ。お飲み物は何にしますか？', suggestions: ["I'd like a coffee, please.", 'Can I have some tea?', 'What do you recommend?'] },
  travel: { title: '旅先で道案内', icon: '🧳', role: '街の案内人', intro: 'Hello! You look a little lost. Where would you like to go?', translation: 'こんにちは！道に迷いましたか？どこへ行きたいですか？', suggestions: ['Where is the station?', 'How can I get to the park?', 'Is there a café nearby?'] },
  friends: { title: 'はじめての友だち', icon: '👋', role: 'Alex', intro: "Hi there! I'm Alex. What's your name?", translation: 'やあ！アレックスです。あなたの名前は？', suggestions: ["My name is Hana.", "Hi, I'm Yuki. Nice to meet you!", "Hello! How are you?"] },
};

export function guidedReply(scene, input, step = 0) {
  const text = input.toLowerCase().trim();
  const say = (reply, translation, suggestions, tip = '') => ({ reply, translation, suggestions, tip, mode: 'guided' });
  if (/^(bye|goodbye|see you)|good night/.test(text)) return say('It was lovely talking to you. See you next time!', 'お話しできて楽しかったです。また会いましょう！', ['Thank you! See you!', 'Can we practice again?']);
  if (/thank/.test(text) && !/how much|price|cost|no[, ]|can i|coffee|tea|water/.test(text)) return say("You're welcome! Is there anything else I can help you with?", 'どういたしまして！ほかに何かお手伝いできますか？', scene === 'cafe' ? ['How much is it?', "That's all, thank you."] : ['Thank you. Goodbye!', 'Can you tell me more?']);
  if (/sorry|understand|repeat|slow|わから|もう一度/.test(text)) return say(scene === 'cafe' ? 'Of course! Would you like coffee or tea?' : scene === 'travel' ? 'Of course! Where do you want to go? The station or the park?' : 'Of course! My name is Alex. What is your name?', 'もちろん！ゆっくり、簡単な言葉でもう一度聞きますね。', scenes[scene].suggestions, '聞き取れないときは “Could you say that again?” が便利です。');
  if (scene === 'cafe') {
    if (/recommend|popular|おすすめ/.test(text)) return say('Our latte is very popular! It has espresso and warm milk. Would you like to try one?', 'ラテがとても人気です！エスプレッソと温かいミルクが入っています。試してみますか？', ["Yes, a latte, please.", "I'd prefer tea."]);
    if (/\bcard\b|\bcash\b/.test(text)) return say("Perfect! Here's your drink. Enjoy your day!", 'かしこまりました！こちらがお飲み物です。素敵な一日を！', ['Thank you so much!', 'It smells delicious!']);
    if (/much|price|cost|pay/.test(text)) return say("It's four dollars. You can pay by card or cash. Which would you prefer?", '4ドルです。カードでも現金でもお支払いいただけます。どちらにしますか？', ["I'll pay by card.", 'Cash, please.']);
    if (/coffee|tea|latte|cappuccino|water|juice|milk|espresso|コーヒー|お茶/.test(text)) {
      const drink = text.match(/coffee|tea|latte|cappuccino|water|juice|milk|espresso/)?.[0] || 'drink';
      return say(`One ${drink}, coming right up! Would you like it hot or iced?`, `${drink}を1つですね！ホットとアイス、どちらにしますか？`, ['Hot, please.', "I'd like it iced, please."], /please/.test(text) ? '“please” を使って丁寧に注文できています！' : '“I’d like a …, please.” と言うと、丁寧に注文できます。');
    }
    if (/hot|iced|cold/.test(text)) return say(`Great! ${/hot/.test(text) ? 'A hot drink' : 'An iced drink'} it is. Would you like anything to eat with that?`, 'かしこまりました。一緒に何か食べるものはいかがですか？', ['A croissant, please.', 'No, thank you. How much is it?']);
    if (/croissant|cake|sandwich|bread/.test(text)) return say("Excellent choice! I'll add that to your order. Will that be all?", 'いいですね！ご注文に追加します。以上でよろしいですか？', ["Yes, that's all. How much is it?", 'Can I have some water too?']);
    if (/yes|no|all|sure|okay|ok/.test(text)) return say("All right! Your total is four dollars. Would you like to pay by card?", 'かしこまりました！合計4ドルです。カードでお支払いですか？', ['Yes, by card, please.', 'Can I pay in cash?']);
    return say("Let's practice ordering a drink. You can say, “I'd like a coffee, please.” What would you like?", '飲み物の注文を練習しましょう。「コーヒーをお願いします」と言えます。何にしますか？', scenes.cafe.suggestions, 'このガイド会話では、飲み物の注文・おすすめ・値段・支払いを練習できます。');
  }
  if (scene === 'travel') {
    if (/ticket|buy/.test(text)) return say('You can buy a ticket at the machine inside the station. A day pass costs eight dollars.', '駅の中の券売機で買えます。1日券は8ドルです。', ['One day pass, please.', 'Thank you for your help!']);
    if (/station|train/.test(text)) return say("The station is two blocks from here. Go straight, then turn left. Are you taking a train today?", '駅はここから2ブロック先です。まっすぐ進んで左に曲がってください。今日は電車に乗るのですか？', ['Yes. Where can I buy a ticket?', 'How long does it take to walk there?']);
    if (/park|café|cafe|hotel|museum/.test(text)) { const place = text.match(/park|café|cafe|hotel|museum/)[0]; return say(`The ${place} is just around the corner, on your right. It's a five-minute walk.`, `${place}は角を曲がった右側にあります。歩いて5分です。`, ['Is it open now?', 'Thank you! Is it easy to find?']); }
    if (/long|far|walk|time/.test(text)) return say("It's about a ten-minute walk. You can also take bus number five.", '歩いて10分ほどです。5番のバスでも行けます。', ['Where is the bus stop?', "I'll walk. Thank you!"]);
    if (/bus/.test(text)) return say('The bus stop is across the street, next to the bakery. A ticket is two dollars.', 'バス停は道の向こう側、パン屋さんの隣です。乗車券は2ドルです。', ['Thank you for your help!', 'Can I pay by card?']);
    if (/open|yes|easy/.test(text)) return say("Yes! It's open until six today. Look for the big green sign at the entrance.", 'はい！今日は6時まで開いています。入り口の大きな緑の看板が目印です。', ['That sounds great. Thank you!', 'How can I get to the station?']);
    return say('Which place are you looking for? I can help you find the station, a café, a hotel, or the park.', 'どの場所を探していますか？駅、カフェ、ホテル、公園への行き方を案内できます。', scenes.travel.suggestions, '“Where is …?” で、行きたい場所をたずねてみましょう。');
  }
  if (/name is|i am |i'm |i’m /.test(text) && !/fine|good|happy|tired|from|hungry|well/.test(text)) {
    return say("Nice to meet you! I'm from Canada. Where are you from?", 'はじめまして！私はカナダ出身です。あなたはどこの出身ですか？', ["I'm from Japan.", 'I live in Tokyo.']);
  }
  if (/from|japan|tokyo|osaka|live/.test(text)) return say("Japan sounds wonderful! I'd love to visit someday. What do you like to do in your free time?", '日本は素敵ですね！いつか訪れてみたいです。暇なときは何をするのが好きですか？', ['I like listening to music.', 'I enjoy cooking.', 'I like reading books.']);
  if (/pop|jazz|rock|instrument/.test(text)) return say('Great choice! Music brings people together. Do you go to concerts, or do you prefer listening at home?', 'いいですね！音楽は人をつなぎます。コンサートに行きますか？それとも家で聴くのが好きですか？', ['I listen at home.', 'I love concerts.', 'What do you do on weekends?']);
  if (/music|song|sing/.test(text)) return say('I love music too! I listen to jazz when I cook. What kind of music do you like?', '私も音楽が大好きです！料理中にジャズを聴きます。どんな音楽が好きですか？', ['I like pop music.', 'My favorite is jazz.', 'Do you play an instrument?']);
  if (/cook|food|eat/.test(text)) return say('That sounds fun! My favorite food is pasta. What food do you like?', '楽しそうですね！私はパスタが大好きです。好きな食べ物は何ですか？', ['I love sushi.', 'I like pizza.', 'Can you cook Japanese food?']);
  if (/book|read|movie|film/.test(text)) return say('I enjoy stories too! Do you prefer reading at home or going to the movies?', '私も物語が好きです！家で本を読むのと、映画館に行くのでは、どちらが好きですか？', ['I prefer reading at home.', 'I love going to the movies.', 'What do you do on weekends?']);
  if (/weekend|hobby|free time|sport/.test(text)) return say('On weekends, I like hiking and taking photos. Would you like to go for a walk sometime?', '週末はハイキングや写真を撮るのが好きです。今度一緒に散歩しませんか？', ["Sounds good! Let's go together.", 'Where do you like to walk?']);
  if (/how are|hello|^hi\b|fine|good|well/.test(text)) return say("I'm doing well, thanks! It's a lovely day. What do you like to do on weekends?", '元気です、ありがとう！いい天気ですね。週末は何をするのが好きですか？', ['I like reading.', 'I play tennis.', 'I listen to music.']);
  return say(step % 2 ? "Let's talk about your favorites. What food, music, or movies do you like?" : 'Tell me a little about yourself! Where are you from, and what do you like to do?', '好きなものや出身地について、もう少しお話ししてみましょう。', ['I like cooking.', "I'm from Japan.", 'I love music.'], 'ガイド会話では、自己紹介・出身地・趣味・好きなものについて練習できます。');
}
