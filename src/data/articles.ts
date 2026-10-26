import type { CategoryId, StampKind } from '@/constants/nikonyu';

// 試作用のサンプル記事。実在の出来事ではなく、雰囲気を確かめるための架空の内容。

export type SceneName = 'dog' | 'grad' | 'bus' | 'cat' | 'aurora' | 'letters' | 'otter' | 'fuji';
export type AvatarKind = 'cat' | 'bear' | 'rabbit' | 'chick' | 'fox' | 'you';

export type SeedComment = {
  id: string;
  author: string;
  avatar: AvatarKind;
  minutesAgo: number;
  text: string;
  thanks: number;
};

export type Article = {
  id: string;
  day: 'today' | 'yesterday';
  category: CategoryId;
  region: string;
  minutes: number;
  title: string;
  lead: string;
  summary: [string, string, string];
  body: string[];
  source: string;
  scene: SceneName;
  sceneCaption: string;
  stamps: Record<StampKind, number>;
  comments: SeedComment[];
};

export const ARTICLES: Article[] = [
  {
    id: 'graduation',
    day: 'today',
    category: 'sugoi',
    region: '海外・アメリカ',
    minutes: 1,
    title: '90歳で念願の大学卒業。「学ぶのに遅すぎることはない」',
    lead: '若いころにあきらめた大学に、70年越しで卒業しました。',
    summary: [
      '若いころ家庭の事情で大学をあきらめた女性が、90歳で卒業',
      '孫と同じ年に入学し、オンラインと通学で4年間学んだ',
      '卒業式では、同級生たちから大きな拍手が送られた',
    ],
    body: [
      'アメリカの小さな町に住む女性が、90歳で大学を卒業しました。若いころは家族を支えるために働く必要があり、進学をあきらめていたそうです。',
      '入学を後押ししたのは、同じ年に大学へ進んだ孫でした。授業は主にオンラインで受け、試験の日は家族が車で送り迎えをしました。',
      '卒業式で名前が呼ばれると、会場は大きな拍手に包まれました。「学ぶのに遅すぎることはない。次は何を勉強しようかしら」と笑顔で話しています。',
    ],
    source: '[媒体名]（英語）',
    scene: 'grad',
    sceneCaption: 'イメージ：卒業帽と卒業証書',
    stamps: { hokko: 842, sugoi: 1530, kusu: 21, jin: 498 },
    comments: [
      { id: 'g1', author: 'はるかぜ', avatar: 'rabbit', minutesAgo: 30, text: '「次は何を勉強しようかしら」が最高です。わたしも何か始めたくなりました。', thanks: 18 },
      { id: 'g2', author: 'しろくま', avatar: 'chick', minutesAgo: 75, text: 'お孫さんと一緒に入学っていうのが素敵すぎる…！', thanks: 9 },
    ],
  },
  {
    id: 'bus',
    day: 'today',
    category: 'hokkori',
    region: '国内',
    minutes: 1,
    title: '毎朝のあいさつから5年。バスの運転手さんと小学生の交流',
    lead: '運転手さんの定年の日、子どもたちから手紙が届きました。',
    summary: [
      '毎朝同じバスに乗る小学生が、運転手さんにあいさつを続けた',
      '運転手さんの定年の日、子どもたちが手紙を手渡した',
      '「元気をもらっていたのは自分のほう」と運転手さん',
    ],
    body: [
      'ある町の路線バスで、毎朝同じ便に乗る小学生たちが、運転手さんに元気よくあいさつを続けてきました。',
      '運転手さんが定年を迎えた日、子どもたちは寄せ書きの手紙を用意して、降りるときにそっと手渡しました。',
      '「毎朝の元気をもらっていたのは、わたしのほうでした」。運転手さんは手紙を大切に持ち帰ったそうです。',
    ],
    source: '[媒体名]',
    scene: 'bus',
    sceneCaption: 'イメージ：バスと小学生',
    stamps: { hokko: 2104, sugoi: 210, kusu: 12, jin: 960 },
    comments: [
      { id: 'b1', author: '朝のコーヒー', avatar: 'bear', minutesAgo: 20, text: '毎日続けた5年って本当にすごい。朝から泣きました。', thanks: 14 },
      { id: 'b2', author: 'たまご焼き', avatar: 'fox', minutesAgo: 95, text: 'うちの子にも読ませたいお話です。', thanks: 6 },
    ],
  },
  {
    id: 'puppy',
    day: 'today',
    category: 'mofu',
    region: '海外・アメリカ',
    minutes: 1,
    title: '迷子の子犬、町じゅうで探して3日ぶりに家族のもとへ',
    lead: 'SNSでの呼びかけに、近所の人や小学生たちが次々と協力しました。',
    summary: [
      'アメリカの小さな町で、散歩中の子犬が迷子に',
      '飼い主の呼びかけを見た近所の人や小学生が、3日間さがし続けた',
      '見つけたのはいつもの郵便配達員さん。子犬は元気に家へ帰った',
    ],
    body: [
      'アメリカ・テキサス州の小さな町で、ある家族の子犬が散歩中にリードを抜けて走り去ってしまいました。',
      '飼い主が写真つきでSNSに投稿すると、町の人たちが次々と反応しました。小学校では子どもたちが手描きのポスターを作り、商店の窓にも貼られたそうです。',
      '3日目の朝、子犬を見つけたのはいつもの郵便配達員さん。配達ルートの途中、納屋の陰で丸くなっていたといいます。家族は「町のみんなが家族になってくれたみたい」と話しています。',
    ],
    source: '[媒体名]（英語）',
    scene: 'dog',
    sceneCaption: 'イメージ：家族と再会した子犬',
    stamps: { hokko: 1284, sugoi: 356, kusu: 88, jin: 642 },
    comments: [
      { id: 'p1', author: 'ねこ好きママ', avatar: 'cat', minutesAgo: 12, text: '郵便屋さん、ヒーローすぎる…！町のみんなの優しさに朝から泣きました。', thanks: 12 },
      { id: 'p2', author: '朝のコーヒー', avatar: 'bear', minutesAgo: 25, text: 'ポスターを描いた子どもたち、いい経験になっただろうな。こういう町に住みたい。', thanks: 8 },
      { id: 'p3', author: 'はるかぜ', avatar: 'rabbit', minutesAgo: 40, text: 'うちの犬も一度脱走したことがあるので、見つかったところで声が出ました。よかった！', thanks: 15 },
      { id: 'p4', author: 'しろくま', avatar: 'chick', minutesAgo: 60, text: '「町のみんなが家族になってくれたみたい」って言葉が素敵すぎる。', thanks: 21 },
      { id: 'p5', author: 'たまご焼き', avatar: 'fox', minutesAgo: 120, text: '通勤電車で読んでにやけてしまった。今日もがんばれそう。', thanks: 6 },
    ],
  },
  {
    id: 'shop-cat',
    day: 'today',
    category: 'kusu',
    region: '海外・イギリス',
    minutes: 1,
    title: 'スーパーの「今日の店長おすすめ」、なぜか毎日お店のネコ',
    lead: '店長の遊び心から始まった看板が、町の名物になっています。',
    summary: [
      'イギリスの小さなスーパーで、看板ネコが毎日「おすすめ」に',
      '店長の遊び心から始まり、今では写真を撮りに来る人も',
      'ネコは今日も店先でのんびり昼寝をしている',
    ],
    body: [
      'イギリスの小さなスーパーの入口には、「今日の店長おすすめ」という黒板があります。ところが、そこに書かれているのは毎日お店のネコのことです。',
      '「今日のおすすめ：窓ぎわで寝ているネコ（非売品）」。店長がふざけて書いたのが始まりで、今では黒板を見るために立ち寄る人もいるそうです。',
      '当のネコは人気を気にする様子もなく、今日も店先で昼寝をしています。',
    ],
    source: '[媒体名]（英語）',
    scene: 'cat',
    sceneCaption: 'イメージ：お店の看板ネコ',
    stamps: { hokko: 620, sugoi: 45, kusu: 1890, jin: 30 },
    comments: [
      { id: 'c1', author: 'たまご焼き', avatar: 'fox', minutesAgo: 15, text: '「非売品」で吹き出しました。行ってみたい！', thanks: 11 },
      { id: 'c2', author: 'ねこ好きママ', avatar: 'cat', minutesAgo: 50, text: '毎日おすすめされたい人生でした…', thanks: 7 },
    ],
  },
  {
    id: 'aurora',
    day: 'today',
    category: 'iyashi',
    region: '海外・ノルウェー',
    minutes: 1,
    title: '北欧の夜空にオーロラが満開。写真家が撮った静かな一枚',
    lead: '湖に映るオーロラに、「寒さを忘れるほどだった」と写真家。',
    summary: [
      'ノルウェー北部で、今季いちばんとされるオーロラが観測された',
      '地元の写真家が、湖に映るオーロラを撮影した',
      '「寒さを忘れるほどの美しさだった」と写真家は話す',
    ],
    body: [
      'ノルウェー北部の町で、空いっぱいに広がるオーロラが観測されました。地元では今季いちばんの見ごろだったといいます。',
      '地元の写真家は、風のない夜に湖へ向かい、水面に映る緑の光を撮影しました。',
      '「音のない世界で、空がゆっくり動いていました。寒さを忘れるほどの美しさでした」と話しています。',
    ],
    source: '[媒体名]（英語）',
    scene: 'aurora',
    sceneCaption: 'イメージ：オーロラと山',
    stamps: { hokko: 410, sugoi: 380, kusu: 5, jin: 1320 },
    comments: [
      { id: 'a1', author: 'しろくま', avatar: 'chick', minutesAgo: 35, text: '寝る前に読んで、心が静かになりました。', thanks: 10 },
      { id: 'a2', author: 'はるかぜ', avatar: 'rabbit', minutesAgo: 80, text: 'いつか本物を見に行きたいなあ。', thanks: 4 },
    ],
  },
  {
    id: 'letters',
    day: 'yesterday',
    category: 'hokkori',
    region: '国内',
    minutes: 1,
    title: '落とし物を届けた中学生に、町の人から手紙が100通',
    lead: '交番に財布を届けた中学生のもとに、たくさんの「ありがとう」。',
    summary: [
      '中学生が、拾った財布をすぐに交番へ届けた',
      '持ち主が地元の掲示板でお礼を伝えると、町じゅうに広がった',
      '学校には、町の人から100通近い手紙が届いた',
    ],
    body: [
      'ある町の中学生が、通学路で拾った財布をすぐに交番へ届けました。',
      '持ち主の女性が地元の掲示板にお礼を書き込むと、話は町じゅうに広がりました。',
      '学校には、町の人たちから100通近い手紙が届いたそうです。中学生は「当たり前のことをしただけなのに」と照れくさそうでした。',
    ],
    source: '[媒体名]',
    scene: 'letters',
    sceneCaption: 'イメージ：届いた手紙',
    stamps: { hokko: 1650, sugoi: 520, kusu: 8, jin: 880 },
    comments: [
      { id: 'l1', author: '朝のコーヒー', avatar: 'bear', minutesAgo: 1400, text: '手紙を書いた町の人たちも素敵。', thanks: 13 },
    ],
  },
  {
    id: 'otter',
    day: 'yesterday',
    category: 'mofu',
    region: '海外・アメリカ',
    minutes: 1,
    title: '保護されたラッコの赤ちゃん、水族館ですくすく成長中',
    lead: '浜辺でひとりぼっちだった赤ちゃんが、元気に泳げるように。',
    summary: [
      '浜辺でひとりでいたラッコの赤ちゃんが保護された',
      '水族館のスタッフが、24時間交代でお世話を続けた',
      '今では毛づくろいも上手になり、元気に泳いでいる',
    ],
    body: [
      'アメリカ西海岸の浜辺で、ひとりぼっちのラッコの赤ちゃんが見つかり、近くの水族館に保護されました。',
      'スタッフは24時間交代でミルクをあげ、毛づくろいの練習にも付き合いました。',
      '今では自分で上手に毛づくろいをし、プールを元気に泳ぎ回っているそうです。',
    ],
    source: '[媒体名]（英語）',
    scene: 'otter',
    sceneCaption: 'イメージ：ラッコの親子',
    stamps: { hokko: 980, sugoi: 120, kusu: 64, jin: 410 },
    comments: [
      { id: 'o1', author: 'ねこ好きママ', avatar: 'cat', minutesAgo: 1500, text: '毛づくろいの練習に付き合うスタッフさん、尊い…', thanks: 9 },
    ],
  },
  {
    id: 'wallet',
    day: 'yesterday',
    category: 'nippon',
    region: '日本（海外メディアより）',
    minutes: 1,
    title: '旅行者がなくした財布、駅員さんの手で無事に持ち主のもとへ',
    lead: '海外から来た旅行者が、日本で体験した「小さな奇跡」をSNSで紹介しました。',
    summary: [
      '海外からの旅行者が、駅で財布をなくしてしまった',
      '駅員さんが落とし物の中から見つけ、ホテルまで連絡をくれた',
      '旅行者は「日本の人のやさしさに救われた」とSNSで紹介した',
    ],
    body: [
      '日本を旅行中の海外からの旅行者が、乗り換えの途中で財布をなくしてしまいました。',
      'あきらめかけていたところ、駅員さんが届けられた落とし物の中から財布を見つけ、宿泊先のホテルに連絡をくれたそうです。',
      '旅行者は「中身もそのままだった。日本の人のやさしさに救われた」とSNSで紹介し、多くの人が温かいコメントを寄せています。',
    ],
    source: '[媒体名]（英語）',
    scene: 'fuji',
    sceneCaption: 'イメージ：富士山',
    stamps: { hokko: 1420, sugoi: 760, kusu: 15, jin: 690 },
    comments: [
      { id: 'w1', author: 'はるかぜ', avatar: 'rabbit', minutesAgo: 1300, text: '駅員さん、ありがとう。なんだか誇らしい気持ちになりました。', thanks: 16 },
    ],
  },
];

export const TODAY = ARTICLES.filter((a) => a.day === 'today');

export function findArticle(id: string | undefined) {
  return ARTICLES.find((a) => a.id === id);
}
