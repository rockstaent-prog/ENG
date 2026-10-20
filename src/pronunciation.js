// General American examples. IPA is a reference; the Japanese directions and
// spoken whole words are the primary teaching tools, not katakana spellings.
export const pronunciationLessons = [
  {
    id:'rl', title:'R と L を言い分ける', sound:'/r/ ・ /l/', summary:'舌を上あごにつけるか、つけないか。',
    steps:['R：舌先を上あごにつけず、舌を少し後ろへ引きます。唇を軽く丸め、声を出します。','L：舌先を上の前歯のすぐ後ろの歯ぐきにつけます。舌の両側から声を通します。','日本語のラ行のように舌で一瞬はじかず、R と L の始まりを少し長めに確かめます。'],
    check:'R では舌先を離し、L では歯ぐきにつけられた？',
    examples:[
      {text:'right',ipa:'/raɪt/',meaning:'右・正しい',focus:'R：舌先をつけずに始める。最後の t の後に「オ」を足さない。'},
      {text:'light',ipa:'/laɪt/',meaning:'光・軽い',focus:'L：舌先を上の歯ぐきにつけてから、離して「アイ」へ。'},
      {text:'Turn right at the light.',ipa:'/tɝn raɪt æt ðə laɪt/',meaning:'信号を右に曲がってください。',focus:'right と light の出だしを意識して、ゆっくり言い分けよう。'},
    ],
  },
  {
    id:'th', title:'TH の息と声', sound:'/θ/ ・ /ð/', summary:'舌先と前歯の間から、息を細く通す。',
    steps:['舌先を上下の前歯の間に軽く出すか、上の前歯の裏に軽く添えます。強くかみません。','/θ/：声を出さず、息だけをすき間から通します。thanks の最初の音です。','/ð/：同じ位置で声も出します。のどに手を当てると振動を感じます。this の最初の音です。'],
    check:'thanks は息だけ、this はのどが振動する音になった？',
    examples:[
      {text:'thanks',ipa:'/θæŋks/',meaning:'ありがとう',focus:'最初を「サ」や「ス」にせず、舌先のそばから息を出す。'},
      {text:'this',ipa:'/ðɪs/',meaning:'これ・この',focus:'舌先を同じ位置に置き、声を加える。「ディス」と区切らない。'},
      {text:'Thank you for this.',ipa:'/θæŋk ju fər ðɪs/',meaning:'これをありがとう。',focus:'Thank は息だけ、this は声あり。二つの TH を比べよう。'},
    ],
  },
  {
    id:'fv', title:'F と V の出し方', sound:'/f/ ・ /v/', summary:'上の前歯を、下唇に軽く当てる。',
    steps:['上の前歯を下唇の内側に軽く当てます。唇を強くかまず、息の通り道を残します。','F：声を出さず、息をすき間から続けて出します。日本語の「フ」のように両唇を丸めません。','V：同じ口の形に声を加えます。下唇やのどの振動を感じながら、B のように唇を閉じ切らないようにします。'],
    check:'F と V で口の形を保ち、声の有無だけ変えられた？',
    examples:[
      {text:'fan',ipa:'/fæn/',meaning:'扇風機・ファン',focus:'上の前歯と下唇で、息だけの f を作る。'},
      {text:'van',ipa:'/væn/',meaning:'バン・小型の車',focus:'f と同じ形に声を加える。最初を「バ」にしない。'},
      {text:'Five very fresh apples.',ipa:'/faɪv ˈvɛri frɛʃ ˈæpəlz/',meaning:'とても新鮮なリンゴを五つ。',focus:'Five の最初は f、最後は v。very は声あり、fresh は息だけで始める。'},
    ],
  },
  {
    id:'vowels', title:'二つの「ア」を聞き分ける', sound:'/æ/ ・ /ʌ/', summary:'口を広めに開く音と、力を抜く音。',
    steps:['/æ/：舌を前寄りに低く置き、口を広めに開きます。「エ」の位置からあごを下げる感じで、一つの音にします。','/ʌ/：唇や舌の力を抜き、口を軽く開いて短く発音します。/æ/ より口の開きは小さめです。','cap と cup を交互に聞き、真ん中の母音だけを変えてみましょう。どちらも最後の p の後に「ウ」を足しません。'],
    check:'cap と cup で口の開きと舌の位置を変えられた？',
    examples:[
      {text:'cap',ipa:'/kæp/',meaning:'帽子',focus:'口を広めに開いた æ。二つの音「エ・ア」に分けず一息で。'},
      {text:'cup',ipa:'/kʌp/',meaning:'カップ',focus:'力を抜いた短い ʌ。日本語の「カップ」の小さい「ッ」を強く入れない。'},
      {text:'A black cup.',ipa:'/ə blæk kʌp/',meaning:'黒いカップ。',focus:'black の æ は広めに、cup の ʌ は力を抜いて比べる。'},
    ],
  },
  {
    id:'stress', title:'強く読む場所をつかむ', sound:'強弱のリズム', summary:'全部を同じ強さにせず、目立つ音を一つ作る。',
    steps:['単語には目立たせる音のまとまりがあります。発音記号の「ˈ」は、その後を強く読む目印です。','banana は真ん中の NA を少し長く、はっきり。前後は力を抜いて短く言います。','英文では伝えたい語を目立たせます。ここでは coffee と please を軽く強調し、他を短くつなげてみます。'],
    check:'強い部分をはっきり、弱い部分を短く言えた？',
    examples:[
      {text:'banana',ipa:'/bəˈnænə/',meaning:'バナナ',rhythm:'ba · NA · na',focus:'真ん中の NA が主役。最初と最後の母音は力を抜く。'},
      {text:'coffee',ipa:'/ˈkɔfi/',meaning:'コーヒー',rhythm:'COF · fee',focus:'最初を強めに。日本語の「コーヒー」のように全部を長く伸ばさない。'},
      {text:'A coffee, please.',ipa:'/ə ˈkɔfi pliz/',meaning:'コーヒーを一つお願いします。',rhythm:'a · COFfee · PLEASE',focus:'a は短く、coffee をはっきり。please で丁寧に締める。'},
    ],
  },
  {
    id:'linking', title:'単語をつないで話す', sound:'子音 → 母音', summary:'単語の間に余分な母音や長い間を入れない。',
    steps:['単語の最後が子音で、次の単語が母音で始まるときは、そのまま滑らかにつなげられます。','pick it up は pick‿it‿up と一息で。k や t の後に日本語の「ウ」や「オ」を足さず、次の母音へ移ります。','速くする必要はありません。ゆっくりでも、単語の間を切りすぎないことから始めましょう。'],
    check:'子音の後に余分な母音を足さず、次の単語につなげられた？',
    examples:[
      {text:'pick it',ipa:'/pɪk ɪt/',meaning:'それを選ぶ・取る',rhythm:'pick‿it',focus:'pick の k を、it の i へ直接つなげる。'},
      {text:'an apple',ipa:'/ən ˈæpəl/',meaning:'リンゴを一つ',rhythm:'an‿apple',focus:'an の n のあと、間を空けずに apple の æ へ。'},
      {text:'Pick it up.',ipa:'/pɪk ɪt ʌp/',meaning:'それを拾って。',rhythm:'pick‿it‿up',focus:'k → i、t → u をつなぐ。「ピック・イット・アップ」と一語ずつ区切らない。'},
    ],
  },
];

export const pronunciationStorageKey = 'komorebi-pronunciation';
export function readPronunciationProgress(storage) {
  try {
    const value = JSON.parse(storage.getItem(pronunciationStorageKey));
    return Array.isArray(value) ? [...new Set(value.filter(id => pronunciationLessons.some(lesson => lesson.id === id)))] : [];
  } catch { return []; }
}
