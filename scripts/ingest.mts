// 海外のいいニュースを取り込むスクリプト。
//   npm run ingest              … 各情報源の新しい記事を判定・要約して保存し、今日の5本を選ぶ
//   npm run ingest -- --limit 6 … AIに送る記事の数を減らす（無料枠の上限対策）
//   npm run ingest -- --dry-run … 保存せずに結果だけ表示する
//   npm run ingest -- --refresh-today … 今日の5本を、新しく取り込んだ記事を優先して選び直す
//
// 1. RSS から新しい記事を集める（判定済みのURLは飛ばす）
// 2. Gemini が掲載基準で「載せる・載せない」とカテゴリを決め、日本語の要約を書く
// 3. 載せる記事を Supabase に保存し、今日の5本がまだなければ選ぶ
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

import { GEMINI_MODELS, generateJson } from '../src/server/gemini.ts';

// 各情報源の新しい記事から交互に判定する。同じ記事が複数のRSSにあっても、URLで重複を除く
const FEEDS = [
  { name: 'Good News Network', url: 'https://www.goodnewsnetwork.org/feed/' },
  { name: 'SoraNews24', url: 'https://soranews24.com/feed/' }, // にっぽん・くすっ
  { name: 'Positive News', url: 'https://www.positive.news/feed/' },
  { name: 'UPI Odd News', url: 'https://rss.upi.com/news/odd_news.rss' }, // くすっ・もふもふ（事故なども混ざるのでAIが外す）
  { name: 'Good News Network', url: 'https://www.goodnewsnetwork.org/category/news/animals/feed/' }, // もふもふ
  { name: 'Good News Network', url: 'https://www.goodnewsnetwork.org/category/news/laughs/feed/' }, // くすっ
  { name: 'Sunny Skyz', url: 'https://www.sunnyskyz.com/rss_tebow.php' }, // ほっこり・もふもふ
  { name: 'Upworthy', url: 'https://www.upworthy.com/rss' }, // ほっこり
  { name: 'Good Good Good', url: 'https://www.goodgoodgood.co/articles/rss.xml' }, // すごい・ほっこり
  { name: 'Reasons to be Cheerful', url: 'https://reasonstobecheerful.world/feed/' }, // すごい
];

// ニュースではない決まった連載やまとめ記事は、AIに送る前に見出しで外す
const SKIP_TITLES = [/^Good News in History/i, /^What went right this week/i];

const CATEGORIES = ['sugoi', 'hokkori', 'kusu', 'iyashi', 'mofu', 'nippon'] as const;
type Category = (typeof CATEGORIES)[number];

// 実写写真に切り替えるまでの仮の挿絵（カテゴリごと）
const SCENE: Record<Category, { scene: string; caption: string }> = {
  sugoi: { scene: 'grad', caption: 'イメージ：がんばった人へのお祝い' },
  hokkori: { scene: 'letters', caption: 'イメージ：届いた手紙' },
  kusu: { scene: 'cat', caption: 'イメージ：のんびりしたネコ' },
  iyashi: { scene: 'aurora', caption: 'イメージ：夜空と山' },
  mofu: { scene: 'dog', caption: 'イメージ：子犬' },
  nippon: { scene: 'fuji', caption: 'イメージ：富士山' },
};

const SYSTEM = `あなたは、世界のいいニュースだけを届ける日本語のニュースアプリ「にこにゅー」の編集者です。
英語の記事を読み、掲載するかどうかを判断して、掲載する場合は日本語の記事を書きます。

掲載基準：
- 載せる：読み終わったときに気分が上向きになる話。災害の後の助け合いのように暗い背景があっても、話の中心が「人の温かさ」ならよい。
- 載せない：死亡や重い病気が話の中心のもの。政治や宗教が絡むもの。誰かを悪者にして成り立つ話（「○○に比べて△△は素晴らしい」など）。商品やサービスの宣伝。
- 迷ったら「この記事を読んだ後、誰かに話したくなるか？」で判断する。

カテゴリ（ひとつ選ぶ）：
- sugoi：偉業、挑戦、記録、発明
- hokkori：人の親切、家族、地域のつながり
- kusu：ちょっと笑える珍しい出来事
- iyashi：絶景、自然、静かで心が落ち着く話
- mofu：動物が主役の話
- nippon：海外から見た日本のいいところ。ただし他の国と比べて下げる話は載せない

日本語の書き方：
- です・ます調。やさしく、短い文で。誇張しない。
- 元の記事にない事実や数字を足さない。本文は翻訳ではなく、自分の言葉での要約にする。
- title：40文字以内。lead：60文字以内の一文。summary：3つ、それぞれ40文字以内。body：2〜3段落、各120文字以内。
- region：「海外・アメリカ」「海外・イギリス」のように国名を入れる。日本の話は「日本（海外メディアより）」。
- 載せない場合は accept=false にして、reason に理由を短く書く（ほかの項目は空でよい）。`;

// 文字列には必ず maxLength を付ける（付けないと同じ言葉を繰り返して止まらなくなる）
const SCHEMA = {
  type: 'object',
  properties: {
    accept: { type: 'boolean' },
    reason: { type: 'string', maxLength: 80 },
    category: { type: 'string', enum: [...CATEGORIES] },
    region: { type: 'string', maxLength: 20 },
    title: { type: 'string', maxLength: 40 },
    lead: { type: 'string', maxLength: 60 },
    summary: { type: 'array', items: { type: 'string', maxLength: 40 }, minItems: 3, maxItems: 3 },
    body: { type: 'array', items: { type: 'string', maxLength: 160 }, minItems: 1, maxItems: 3 },
  },
  // 全部を必須にする（載せない記事でも埋めてもらい、こちらで無視する）。必須でないと、載せる記事でも項目が抜けることがある
  required: ['accept', 'reason', 'category', 'region', 'title', 'lead', 'summary', 'body'],
};

type Judged = {
  accept: boolean;
  reason: string;
  category?: Category;
  region?: string;
  title?: string;
  lead?: string;
  summary?: string[];
  body?: string[];
};

type Candidate = { feed: string; feedUrl: string; url: string; title: string; text: string; published: number };

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REFRESH_TODAY = args.includes('--refresh-today');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex >= 0 ? Number(args[limitIndex + 1]) : 15;
const WAIT_MS = 5000; // 無料枠の「1分あたりの回数」を超えないように、1件ごとに少し待つ

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) fail('SUPABASE_URL と SUPABASE_SECRET_KEY を .env.local に書いてください');
if (!process.env.GEMINI_API_KEY) fail('GEMINI_API_KEY を .env.local に書いてください');
const db = createClient(url!, key!, { auth: { persistSession: false } });

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<Candidate[]> {
  const res = await fetch(feed.url, { headers: { 'User-Agent': 'nikonyu-prototype/0.1' } });
  if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
  const xml = new XMLParser({ ignoreAttributes: true }).parse(await res.text());
  const items = [xml?.rss?.channel?.item ?? []].flat();
  return items.map((item: Record<string, string>) => ({
    feed: feed.name,
    feedUrl: feed.url,
    url: String(item.link),
    title: stripHtml(String(item.title ?? '')),
    text: stripHtml(String(item['content:encoded'] ?? item.description ?? '')).slice(0, 6000),
    published: Date.parse(String(item.pubDate ?? '')) || 0,
  }));
}

// RSSに本文が入っていない情報源（Sunny Skyz など）は、記事のページから本文の段落を読み取る
async function fetchArticleText(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'nikonyu-prototype/0.1' } });
    if (!res.ok) return '';
    const html = await res.text();
    const description = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] ?? '';
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripHtml(m[1])).filter((p) => p.length > 40);
    return stripHtml([description, ...paragraphs].join(' ')).slice(0, 6000);
  } catch {
    return '';
  }
}

function articleId(c: Candidate) {
  let h = 0;
  for (const ch of c.url) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${h.toString(36)}`;
}

function todayJst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function main() {
  // 1. 集める
  const all: Candidate[] = [];
  const collected = new Set<string>();
  for (const feed of FEEDS) {
    try {
      const items = (await fetchFeed(feed)).filter((c) => !collected.has(c.url));
      for (const c of items) collected.add(c.url);
      console.log(`・${feed.name}（${new URL(feed.url).pathname}）：${items.length}件`);
      all.push(...items);
    } catch (e) {
      console.warn(`△ ${(e as Error).message}（この情報源は飛ばします）`);
    }
  }

  const urls = all.map((c) => c.url);
  const seen = new Set<string>();
  // URLが多いと問い合わせが長くなりすぎるので、100件ずつに分けて調べる
  for (let i = 0; i < urls.length; i += 100) {
    const chunk = urls.slice(i, i + 100);
    for (const table of ['seen_sources', 'articles'] as const) {
      const column = table === 'seen_sources' ? 'url' : 'source_url';
      const { data, error } = await db.from(table).select(column).in(column, chunk);
      if (error) fail(`${table} を読めませんでした: ${error.message}（supabase/schema.sql を実行しましたか？）`);
      for (const row of data as Record<string, string>[]) seen.add(row[column]);
    }
  }

  // 情報源が偏らないよう、各情報源の新しいものから交互に並べる
  const byFeed = FEEDS.map((f) =>
    all
      .filter((c) => c.feedUrl === f.url && !seen.has(c.url) && c.title && !SKIP_TITLES.some((re) => re.test(c.title)))
      .sort((a, b) => b.published - a.published)
  );
  const queue: Candidate[] = [];
  for (let i = 0; queue.length < LIMIT && byFeed.some((list) => list[i]); i++) {
    for (const list of byFeed) if (list[i] && queue.length < LIMIT) queue.push(list[i]);
  }
  console.log(`\n判定する記事：${queue.length}件（判定済み ${seen.size}件は飛ばしました）\n`);

  // 2. 判定・要約
  const accepted: { id: string; category: Category }[] = [];
  for (const [i, c] of queue.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, WAIT_MS));
    if (c.text.length < 200) c.text = (await fetchArticleText(c.url)) || c.text;
    if (c.text.length < 80) {
      console.log(`△ [${c.feed}] ${c.title}\n   本文を読み取れなかったので飛ばします`);
      continue;
    }
    let judged: Judged;
    try {
      judged = await generateJson<Judged>({
        model: GEMINI_MODELS.smart,
        system: SYSTEM,
        input: `情報源：${c.feed}\n見出し：${c.title}\n本文：${c.text}`,
        schema: SCHEMA,
        maxOutputTokens: 1536,
      });
    } catch (e) {
      console.warn(`△ [${c.feed}] ${c.title}\n   AIの判定に失敗しました：${(e as Error).message}`);
      continue;
    }

    const complete =
      judged.accept && judged.category && CATEGORIES.includes(judged.category) && judged.title && judged.lead &&
      judged.summary?.length === 3 && (judged.body?.length ?? 0) >= 1;
    if (!judged.accept) {
      console.log(`× [${c.feed}] ${c.title}\n   ${judged.reason || '掲載基準に合わないため'}`);
      if (!DRY_RUN) await db.from('seen_sources').upsert({ url: c.url, accepted: false, reason: judged.reason });
      continue;
    }
    if (!complete) {
      // 載せたい記事だが項目がそろわなかった。判定済みにはせず、次回もう一度試す
      console.log(`△ [${c.feed}] ${c.title}\n   載せる判定でしたが、要約の項目がそろわなかったので次回に回します`);
      continue;
    }

    const category = judged.category!;
    const id = articleId(c);
    console.log(`○ [${c.feed}] ${c.title}\n   → ${judged.title}（${category}）`);
    if (DRY_RUN) continue;

    const { error } = await db.from('articles').insert({
      id,
      category,
      region: judged.region || '海外',
      minutes: 1,
      title: judged.title,
      lead: judged.lead,
      summary: judged.summary,
      body: judged.body,
      source_name: `${c.feed}（英語）`,
      source_url: c.url,
      scene: SCENE[category].scene,
      scene_caption: SCENE[category].caption,
    });
    if (error) {
      console.warn(`   保存に失敗しました：${error.message}`);
      continue;
    }
    await db.from('seen_sources').upsert({ url: c.url, accepted: true, reason: judged.reason });
    accepted.push({ id, category });
  }

  // 3. 今日の5本を選ぶ（まだ選んでいなければ）
  if (DRY_RUN) return console.log('\n（--dry-run のため保存していません）');
  const today = todayJst();
  if (REFRESH_TODAY) {
    await db.from('articles').update({ featured_date: null, featured_rank: null }).eq('featured_date', today);
    console.log(`\n今日（${today}）の5本を選び直します`);
  }
  const { count } = await db.from('articles').select('id', { count: 'exact', head: true }).eq('featured_date', today);
  if ((count ?? 0) > 0) {
    console.log(`\n今日（${today}）の5本はもう選ばれています。新しい記事は次回以降の候補になります。`);
    return;
  }
  const { data: pool } = await db
    .from('articles')
    .select('id, category')
    .is('featured_date', null)
    .order('created_at', { ascending: false })
    .limit(30);
  // カテゴリがばらけるように、まず各カテゴリから1本ずつ、足りなければ新しい順に足す
  const picks: string[] = [];
  const used = new Set<string>();
  for (const a of pool ?? []) if (!used.has(a.category) && picks.length < 5) (picks.push(a.id), used.add(a.category));
  for (const a of pool ?? []) if (!picks.includes(a.id) && picks.length < 5) picks.push(a.id);
  for (const [rank, id] of picks.entries()) {
    await db.from('articles').update({ featured_date: today, featured_rank: rank + 1 }).eq('id', id);
  }
  console.log(`\n今回載せた記事：${accepted.length}件`);
  console.log(`今日（${today}）の5本：${picks.length}本を選びました`);
}

main().catch((e) => fail((e as Error).message));
