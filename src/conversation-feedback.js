// These are text-based teaching suggestions, not an acoustic pronunciation
// assessment. Never infer that a sound was wrong from a recognition transcript.
const corrections = [
  [/\bI(?: am|'m|’m) agree\b/i, 'I agree', 'agree は「同意する」という動詞なので、am を置かずに I agree と言えます。'],
  [/\bI very like\b/i, 'I really like', '「とても好き」は I really like … が自然です。very を動詞の前に直接置きません。'],
  [/\bI from\b/i, "I'm from", '出身を言うときは I am from …。会話では I’m from … とつなげられます。'],
  [/^my name (?!is\b|was\b)([a-z][a-z'-]{0,30})([.!]?)$/i, 'My name is $1$2', '名前を伝えるときは My name is … と is を入れます。'],
  [/^I have (\d{1,3}) years old([.!]?)$/i, (_all,age,end)=>`I'm ${age} ${Number(age)===1?'year':'years'} old${end}`, '年齢は have ではなく be 動詞で伝えます。'],
  [/\bI am (go|live|work|like|want)\b(?!ing)/i, 'I $1', 'ふだんの行動や好みを言うこの形では、am を置かずに動詞を続けます。'],
  [/\bI goed\b/i, 'I went', 'go の過去形は went です。過去のことは I went … と言えます。'],
  [/\bdidn't went\b/i, "didn't go", 'didn’t の後ろは動詞の原形 go に戻します。'],
  [/\bdidn't ate\b/i, "didn't eat", 'didn’t の後ろは動詞の原形 eat に戻します。'],
  [/\b(she|he) don't\b/i, '$1 doesn’t', 'she / he を主語にするときは doesn’t を使います。'],
  [/\bI like (play|listen|cook|read|swim)\b(?!ing)/i, (_all,verb) => `I like ${({play:'playing',listen:'listening',cook:'cooking',read:'reading',swim:'swimming'})[verb.toLowerCase()]}`, '「〜するのが好き」は like の後ろを playing などの形にできます。like to play という言い方もできます。'],
  [/^where (?:is )?station([?!.]?)$/i, 'Where is the station$1', '駅をたずねるときは Where is the station? と、is と the を入れます。'],
  [/\bthank you for help\b/i, 'Thank you for your help', '「手伝ってくれてありがとう」は Thank you for your help. と言えます。'],
  [/\bgo to there\b/i, 'go there', 'there は「そこへ」を含むので、この形では to を足さずに go there と言えます。'],
  [/\bwent to there\b/i, 'went there', 'there の前の to を省いて、went there と言えます。'],
];

const soundHints = [
  [/\bthanks?\b/i,'thanks','/θæŋks/','舌先を前歯に軽く添え、最初の TH は声を出さず、息だけを通します。','th'],
  [/\bright\b.*\blight\b|\blight\b.*\bright\b/i,'right. light.','/raɪt/ ・ /laɪt/','right の R は舌先を上あごにつけず、light の L は上の歯ぐきにつけて始めます。','rl'],
  [/\bright\b/i,'right','/raɪt/','R は舌先を上あごにつけずに始めます。最後の t のあとに「オ」を足さず、短く締めます。','rl'],
  [/\blight\b/i,'light','/laɪt/','L は舌先を上の前歯のすぐ後ろの歯ぐきにつけ、そこから次の母音へつなげます。','rl'],
  [/\bvery\b/i,'very','/ˈvɛri/','上の前歯を下唇に軽く当て、声を加えて V を出します。「ベ」にせず、息を止め切らないのがコツです。','fv'],
  [/\bcoffee\b/i,'coffee','/ˈkɔfi/','最初の COF をはっきり、後半は軽く。F は上の前歯と下唇の間から息を出します。','stress'],
  [/\bplease\b/i,'please','/pliz/','p から l へ余分な「ウ」を足さずにつなぎます。最後の z は声を出して短く締めます。','linking'],
  [/\bstation\b/i,'station','/ˈsteɪʃən/','最初の STA を強めに、後ろの tion は力を抜きます。s と t の間に「ウ」を足さずにつなげます。','stress'],
  [/\bfrom\b/i,'from','/frəm/','F は上の前歯と下唇で息を出し、R は舌先を上あごにつけずに続けます。','fv'],
  [/\bapple\b/i,'apple','/ˈæpəl/','最初の æ は舌を前寄りに低く置き、口を広めに開いて一つの母音で出します。','vowels'],
  [/\bthis\b/i,'this','/ðɪs/','舌先を前歯に軽く添え、最初の TH に声を加えます。のどの振動を感じてみましょう。','th'],
];

export function conversationFeedback(input, scene = 'friends') {
  const original = typeof input === 'string' ? input.trim().slice(0,500) : '';
  if (!original || !/[a-z]/i.test(original)) return null;
  let correction = null;
  for (const [pattern,replacement,explanation] of corrections) {
    if (!pattern.test(original)) continue;
    const changed = original.replace(pattern,replacement);
    const suggested = changed[0].toUpperCase()+changed.slice(1);
    correction = {original,suggested,explanation};break;
  }
  const text = correction?.suggested || original;
  let natural = null;
  const negative = /\b(?:no|not|never|don't|doesn't|didn't|can't|cannot)\b/i.test(text.replace(/[’]/g,"'"));
  if (!negative && scene === 'cafe') {
    const simpleOrder=text.match(/^(?:(?:i want|i would like|i'd like|can i have|can i get) )?(?:(?:a|one|some) )?(coffee|tea|water|latte)(?:,? please)?[.!?]?$/i);
    if (simpleOrder) {
      const drink=simpleOrder[1].toLowerCase();
      const example=`I'd like ${drink==='water'?'some':'a'} ${drink}, please.`;
      if (text.toLowerCase().replace(/[.,!?]/g,'')!==example.toLowerCase().replace(/[.,!?]/g,'')) natural={text:example,explanation:'注文では I’d like …, please. と言うと、丁寧でスムーズに伝わります。'};
    }
  }
  if (!negative && scene==='travel' && /^where is the (station|park|hotel|museum)[?.!]?$/i.test(text)) {
    const place=text.match(/\b(station|park|hotel|museum)\b/i)[0].toLowerCase();
    natural={text:`How can I get to the ${place}?`,explanation:'行き方を知りたいときは How can I get to …? という聞き方も自然です。'};
  }
  if (scene==='friends' && /^i(?: am|'m|’m) from ([a-z ]+)[.!]?$/i.test(text)) {
    natural={text:text.replace(/[.!]$/,'')+'. How about you?',explanation:'出身を伝えたあとに How about you?（あなたは？）を添えると、会話が続きやすくなります。'};
  }
  const hint=soundHints.find(([pattern])=>pattern.test(text));
  const pronunciation=hint ? {word:hint[1],ipa:hint[2],tip:hint[3],lessonId:hint[4]} : {word:text.slice(0,120),ipa:'',tip:'伝えたい単語を少しはっきり、その他は軽く。単語の間を切りすぎず、お手本のリズムをまねしてみましょう。',lessonId:'stress'};
  if(hint?.[1]==='thanks' && !/\bthanks\b/i.test(text)){pronunciation.word='thank';pronunciation.ipa='/θæŋk/';}
  return {correction,natural,pronunciation};
}
