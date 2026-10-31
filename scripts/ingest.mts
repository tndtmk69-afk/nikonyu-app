// 海外のいいニュースを取り込むスクリプト。
//   npm run ingest              … 各情報源の新しい記事を判定・要約して保存し、今日の5本を選ぶ
//   npm run ingest -- --limit 6 … AIに送る記事の数を減らす（無料枠の上限対策）
//   npm run ingest -- --dry-run … 保存せずに結果だけ表示する
//   npm run ingest -- --refresh-today … 今日の5本を、新しく取り込んだ記事を優先して選び直す
//   npm run ingest -- --photos-only … 記事は取り込まず、画像のない記事に画像を付ける
//   npm run ingest -- --photos-only --redo … 画像のある記事も含めて、画像を付け直す
//   npm run ingest -- --rewrite … 取り込み済みの記事を、元記事を読み直して書き直す（画像も付け直す）
//
// 1. RSS から新しい記事を集める（判定済みのURLは飛ばす）
// 2. 元記事のページを読み、Gemini が掲載基準で「載せる・載せない」とカテゴリを決め、日本語の記事を書く
// 3. 画像を付けて Supabase に保存し、今日の5本がまだなければ選ぶ。画像は次の順に試す：
//    元記事の写真 → 記事に出てくる実在の場所・生きものの写真（Wikimedia Commons）→ AIで作った画像
//    → 雰囲気の合う Commons の写真 → 挿絵
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

import { GEMINI_MODELS, generateJson } from '../src/server/gemini.ts';
import { generateImage, IMAGE_PROMPT_RULE, isAiImageConfigured } from '../src/server/ai-image.ts';
import { findPhotoCandidates, PHOTO_QUERY_RULE, type ArticlePhoto } from '../src/server/photos.ts';

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

// 画像が見つからなかったときの挿絵（カテゴリごと）
const SCENE: Record<Category, { scene: string; caption: string }> = {
  sugoi: { scene: 'grad', caption: 'イメージ：がんばった人へのお祝い' },
  hokkori: { scene: 'letters', caption: 'イメージ：届いた手紙' },
  kusu: { scene: 'cat', caption: 'イメージ：のんびりしたネコ' },
  iyashi: { scene: 'aurora', caption: 'イメージ：夜空と山' },
  mofu: { scene: 'dog', caption: 'イメージ：子犬' },
  nippon: { scene: 'fuji', caption: 'イメージ：富士山' },
};

const SUBJECT_RULE = `subject_query：記事の中心に、実在する特定の場所・建物・生きものの種類・自然現象があれば、その英語の正式名（例："Hikone Castle", "Yellowstone National Park", "Aurora borealis", "Sea otter"）。写真を探すのに使う。人名、商品名、架空のキャラクターは入れない。特にないときは空文字。`;

const WRITING_RULE = `日本語の書き方：
- です・ます調。やさしく、読みやすい文で。誇張しない。
- 元の記事にない事実や数字を足さない。翻訳ではなく、元の記事の事実をもとに自分の言葉で組み立て直す。
- title：40文字以内。lead：60文字以内の一文。summary：記事の要点を3つ、それぞれ40文字以内。
- body：入力の「本文の目安」の字数で書く（目安の8割〜1.2倍）。目安は元の記事の長さから決めてある。
  長く書くときは、背景・経緯・くわしい様子・関係者の言葉・その後や広がりを盛り込む（水増しや繰り返しはしない）。
  元の記事に本当に情報が足りないときだけ、目安より短くしてよい。元の記事の文の並びをなぞらない。
  関係者の言葉は、短く要約して「〜と話しています」のように紹介する（長い引用はしない）。
  1段落は200文字以内。最初の段落で何が起きたかを伝え、そのあとで背景やくわしい様子、最後にその後や広がりを書く。
- region：「海外・アメリカ」「海外・イギリス」のように国名を入れる。日本の話は「日本（海外メディアより）」。`;

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

${WRITING_RULE}
- 載せない場合は accept=false にして、reason に理由を短く書く（ほかの項目は空でよい）。

${SUBJECT_RULE}

${IMAGE_PROMPT_RULE}

${PHOTO_QUERY_RULE}`;

// 文字列には必ず maxLength を付ける（付けないと同じ言葉を繰り返して止まらなくなる）
const IMAGE_PROMPT_SCHEMA = { type: 'string', maxLength: 500 };
const PHOTO_QUERIES_SCHEMA = { type: 'array', items: { type: 'string', maxLength: 40 }, minItems: 1, maxItems: 3 };
const SUBJECT_SCHEMA = { type: 'string', maxLength: 60 };
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
    body: { type: 'array', items: { type: 'string', maxLength: 220 }, minItems: 1, maxItems: 6 },
    subject_query: SUBJECT_SCHEMA,
    image_prompt: IMAGE_PROMPT_SCHEMA,
    photo_queries: PHOTO_QUERIES_SCHEMA,
  },
  // 全部を必須にする（載せない記事でも埋めてもらい、こちらで無視する）。必須でないと、載せる記事でも項目が抜けることがある
  required: ['accept', 'reason', 'category', 'region', 'title', 'lead', 'summary', 'body', 'subject_query', 'image_prompt', 'photo_queries'],
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
  subject_query?: string;
  image_prompt?: string;
  photo_queries?: string[];
};

type ImagePlan = Pick<Judged, 'subject_query' | 'image_prompt' | 'photo_queries'>;

type Candidate = { feed: string; feedUrl: string; url: string; title: string; text: string; published: number };

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REFRESH_TODAY = args.includes('--refresh-today');
const PHOTOS_ONLY = args.includes('--photos-only');
const REDO_PHOTOS = args.includes('--redo');
const REWRITE = args.includes('--rewrite');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex >= 0 ? Number(args[limitIndex + 1]) : 15;
const WAIT_MS = 5000; // 無料枠の「1分あたりの回数」を超えないように、1件ごとに少し待つ
const USER_AGENT = 'nikonyu-prototype/0.1';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) fail('SUPABASE_URL と SUPABASE_SECRET_KEY を .env.local に書いてください');
if (!process.env.GEMINI_API_KEY) fail('GEMINI_API_KEY を .env.local に書いてください');
if (!isAiImageConfigured()) console.warn('△ CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN がないので、画像はAIで作りません');
const db = createClient(url!, key!, { auth: { persistSession: false } });

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const wait = () => new Promise((r) => setTimeout(r, WAIT_MS));

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
  const res = await fetch(feed.url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
  const xml = new XMLParser({ ignoreAttributes: true }).parse(await res.text());
  const items = [xml?.rss?.channel?.item ?? []].flat();
  return items.map((item: Record<string, string>) => ({
    feed: feed.name,
    feedUrl: feed.url,
    url: String(item.link),
    title: stripHtml(String(item.title ?? '')),
    text: stripHtml(String(item['content:encoded'] ?? item.description ?? '')).slice(0, 12000),
    published: Date.parse(String(item.pubDate ?? '')) || 0,
  }));
}

const meta = (html: string, name: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i'))?.[1];

// 元記事のページから、本文の段落と、記事の写真（SNSでリンクを貼ったときに出る og:image）を読み取る
async function fetchArticlePage(pageUrl: string): Promise<{ text: string; image: string | null }> {
  try {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return { text: '', image: null };
    const html = await res.text();
    const description = meta(html, 'og:description') ?? '';
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripHtml(m[1])).filter((p) => p.length > 40);
    const image = meta(html, 'og:image') ?? meta(html, 'twitter:image') ?? null;
    return { text: stripHtml([description, ...paragraphs].join(' ')).slice(0, 12000), image: image?.replace(/&amp;/g, '&') ?? null };
  } catch {
    return { text: '', image: null };
  }
}

function articleId(c: Candidate) {
  let h = 0;
  for (const ch of c.url) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${h.toString(36)}`;
}

// 本文の字数の目安。英語の元記事の4分の1の字数を、300〜1000字の範囲で（翻訳にならない分量）
const targetLength = (sourceText: string) => Math.min(1000, Math.max(300, Math.round(sourceText.length / 4 / 50) * 50));

// 1分で500字読める目安
const readingMinutes = (body: string[]) => Math.max(1, Math.round(body.join('').length / 500));

// ---- 画像 ----

// 元記事の写真。ロゴや決まった画像（サイト共通の画像）は使わない。画像として開けるかも確かめる
async function sourcePhoto(image: string | null, article: { title: string; sourceUrl: string; sourceName: string }): Promise<ArticlePhoto | null> {
  if (!image || !/^https:\/\//.test(image) || /logo|icon|favicon|default|placeholder|avatar/i.test(image)) return null;
  try {
    const res = await fetch(image, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(15_000) });
    const type = res.headers.get('content-type') ?? '';
    const size = Number(res.headers.get('content-length') ?? '0');
    if (!res.ok || !type.startsWith('image/') || (size > 0 && size < 15_000)) return null;
  } catch {
    return null;
  }
  console.log('   画像：元記事の写真を使います');
  return {
    id: `src:${image}`,
    src: image,
    alt: `元記事の写真：${article.title}`,
    creator: article.sourceName.replace(/（英語）$/, ''),
    license: '元記事より',
    licenseUrl: null,
    pageUrl: article.sourceUrl,
    source: true,
  };
}

// 作った画像を置く Supabase Storage のバケット（だれでも読める）
const IMAGE_BUCKET = 'article-images';
let bucketReady = false;

// AIで画像を作って Storage に置く。作れなかったら null
async function makeAiImage(prompt: string | undefined, article: { id: string; title: string }): Promise<ArticlePhoto | null> {
  if (!isAiImageConfigured() || !prompt) return null;
  if (DRY_RUN) {
    console.log(`   画像の指示文：${prompt}`);
    return null;
  }
  try {
    if (!bucketReady) {
      const { data } = await db.storage.getBucket(IMAGE_BUCKET);
      if (!data) {
        const { error } = await db.storage.createBucket(IMAGE_BUCKET, { public: true });
        if (error) throw new Error(`Storage のバケットを作れませんでした：${error.message}`);
      }
      bucketReady = true;
    }
    const { data, contentType, model } = await generateImage(prompt);
    const path = `${article.id}.${contentType.split('/')[1]}`;
    const { error } = await db.storage.from(IMAGE_BUCKET).upload(path, data, { contentType, upsert: true });
    if (error) throw new Error(`画像を保存できませんでした：${error.message}`);
    const { publicUrl } = db.storage.from(IMAGE_BUCKET).getPublicUrl(path).data;
    console.log(`   画像：AIで作りました（${model}）`);
    return {
      id: `ai:${article.id}`,
      src: `${publicUrl}?v=${Date.now()}`, // 作り直したときに古い画像が表示されないように
      alt: `AIで作ったイメージ画像：${article.title}`,
      creator: null,
      license: 'AI生成',
      licenseUrl: null,
      pageUrl: '',
      ai: true,
    };
  } catch (e) {
    console.warn(`   AIで画像を作れませんでした：${(e as Error).message}`);
    return null;
  }
}

// 写真の候補から、記事に合うものをAIに1枚選んでもらう
const PHOTO_PICK_SYSTEM = `ニュースアプリ「にこにゅー」の記事に添える写真を選びます。
候補の写真のタイトルを見て、記事の内容や雰囲気に一番合うものを1つ選び、その番号を index に入れてください。
選ばないもの：
- 人が主役に見える写真（集合写真、イベントの来場者など）
- 記事と違う国や場所の写真だと誤解されるもの（日本の記事に外国の名所など）
- 記事とほとんど関係のないもの、事故や軍事などの暗い印象のもの
合うものがなければ index を -1 にしてください。`;

// 同じ写真が続かないよう、最近の記事で使った写真は避ける
let usedPhotos: Set<string> | null = null;

async function pickPhoto(queries: string[] | undefined, article: { title: string; lead: string }, label: string): Promise<ArticlePhoto | null> {
  if (!queries?.filter(Boolean).length) return null;
  if (!usedPhotos) {
    const { data } = REDO_PHOTOS || REWRITE
      ? { data: [] }
      : await db.from('articles').select('photo').not('photo', 'is', null).order('created_at', { ascending: false }).limit(200);
    usedPhotos = new Set((data ?? []).map((r) => (r.photo as ArticlePhoto).id));
  }
  try {
    const candidates = await findPhotoCandidates(queries, usedPhotos);
    let photo: ArticlePhoto | null = null;
    if (candidates.length > 0) {
      const { index } = await generateJson<{ index: number }>({
        model: GEMINI_MODELS.fast,
        system: PHOTO_PICK_SYSTEM,
        input: `見出し：${article.title}\nリード：${article.lead}\n\n候補：\n${candidates.map((c, i) => `${i}. ${c.alt}`).join('\n')}`,
        schema: { type: 'object', properties: { index: { type: 'integer' } }, required: ['index'] },
        maxOutputTokens: 64,
      });
      photo = candidates[index] ?? null;
    }
    if (photo) {
      usedPhotos.add(photo.id);
      console.log(`   画像：${label}（${photo.alt}）`);
    }
    return photo;
  } catch (e) {
    console.warn(`   写真を探せませんでした（${label}）：${(e as Error).message}`);
    return null;
  }
}

// 画像を決める（順番はファイルの先頭のとおり）
async function chooseImage(
  plan: ImagePlan,
  article: { id: string; title: string; lead: string; sourceUrl: string | null; sourceName: string; pageImage: string | null }
): Promise<ArticlePhoto | null> {
  return (
    (article.sourceUrl ? await sourcePhoto(article.pageImage, { ...article, sourceUrl: article.sourceUrl }) : null) ??
    (plan.subject_query ? await pickPhoto([plan.subject_query], article, `実在の写真「${plan.subject_query}」`) : null) ??
    (await makeAiImage(plan.image_prompt, article)) ??
    (await pickPhoto(plan.photo_queries, article, '雰囲気の合う写真'))
  );
}

// ---- 既存の記事の画像の付け直し・書き直し ----

type StoredArticle = { id: string; title: string; lead: string; region: string; body: string[]; source_name: string; source_url: string | null };

// 画像のない記事に、あとから画像を付ける
async function addMissingPhotos() {
  let query = db.from('articles').select('id, title, lead, region, body, source_name, source_url');
  if (!REDO_PHOTOS) query = query.is('photo', null);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(LIMIT);
  if (error) fail(`記事を読めませんでした: ${error.message}`);
  console.log(`${REDO_PHOTOS ? '画像を付け直す記事' : '画像のない記事'}：${data.length}件\n`);
  let added = 0;
  for (const [i, a] of (data as StoredArticle[]).entries()) {
    if (i > 0) await wait();
    console.log(`・${a.title}`);
    let plan: ImagePlan;
    try {
      plan = await generateJson<ImagePlan>({
        model: GEMINI_MODELS.fast,
        system: `ニュース記事に添える画像の探し方を考えます。\n${SUBJECT_RULE}\n\n${IMAGE_PROMPT_RULE}\n\n${PHOTO_QUERY_RULE}`,
        input: `見出し：${a.title}\n地域：${a.region}\nリード：${a.lead}\n本文：${a.body.join('\n')}`,
        schema: {
          type: 'object',
          properties: { subject_query: SUBJECT_SCHEMA, image_prompt: IMAGE_PROMPT_SCHEMA, photo_queries: PHOTO_QUERIES_SCHEMA },
          required: ['subject_query', 'image_prompt', 'photo_queries'],
        },
        maxOutputTokens: 512,
      });
    } catch (e) {
      console.warn(`   AIが画像の探し方を考えられませんでした：${(e as Error).message}`);
      continue;
    }
    const pageImage = a.source_url ? (await fetchArticlePage(a.source_url)).image : null;
    const photo = await chooseImage(plan, { ...a, sourceUrl: a.source_url, sourceName: a.source_name, pageImage });
    if (DRY_RUN || (!photo && !REDO_PHOTOS)) continue;
    const { error: updateError } = await db.from('articles').update({ photo }).eq('id', a.id);
    if (updateError) console.warn(`   保存に失敗しました：${updateError.message}`);
    else added++;
  }
  console.log(DRY_RUN ? '\n（--dry-run のため保存していません）' : `\n画像を付けた記事：${added}件`);
}

// 取り込み済みの記事を、元記事を読み直して書き直す（カテゴリ、今日の5本、スタンプ、ひとことはそのまま）
async function rewriteArticles() {
  const { data, error } = await db
    .from('articles')
    .select('id, title, lead, region, body, source_name, source_url')
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) fail(`記事を読めませんでした: ${error.message}`);
  console.log(`書き直す記事：${data.length}件\n`);
  let done = 0;
  for (const [i, a] of (data as StoredArticle[]).entries()) {
    if (i > 0) await wait();
    console.log(`・${a.title}`);
    const page = await fetchArticlePage(a.source_url!);
    if (page.text.length < 200) {
      console.log('   元記事を読み取れなかったので飛ばします');
      continue;
    }
    let written: Judged;
    try {
      written = await generateJson<Judged>({
        model: GEMINI_MODELS.smart,
        system: `${SYSTEM}\n\nこの記事は掲載が決まっています。accept は true にして、日本語の記事を書いてください。`,
        input: `情報源：${a.source_name}\n本文の目安：約${targetLength(page.text)}字\n本文：${page.text}`,
        schema: SCHEMA,
        maxOutputTokens: 4096,
      });
    } catch (e) {
      console.warn(`   AIが書き直せませんでした：${(e as Error).message}`);
      continue;
    }
    if (!written.title || !written.lead || written.summary?.length !== 3 || !written.body?.length) {
      console.log('   項目がそろわなかったので飛ばします');
      continue;
    }
    console.log(`   → ${written.title}（${written.body.join('').length}字）`);
    const photo = await chooseImage(written, {
      id: a.id,
      title: written.title,
      lead: written.lead,
      sourceUrl: a.source_url,
      sourceName: a.source_name,
      pageImage: page.image,
    });
    if (DRY_RUN) continue;
    const { error: updateError } = await db
      .from('articles')
      .update({
        title: written.title,
        lead: written.lead,
        summary: written.summary,
        body: written.body,
        region: written.region || a.region,
        minutes: readingMinutes(written.body),
        photo,
      })
      .eq('id', a.id);
    if (updateError) console.warn(`   保存に失敗しました：${updateError.message}`);
    else done++;
  }
  console.log(DRY_RUN ? '\n（--dry-run のため保存していません）' : `\n書き直した記事：${done}件`);
}

function todayJst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function main() {
  if (PHOTOS_ONLY) return addMissingPhotos();
  if (REWRITE) return rewriteArticles();

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

  // 2. 判定・執筆
  const accepted: { id: string; category: Category }[] = [];
  for (const [i, c] of queue.entries()) {
    if (i > 0) await wait();
    // RSSの本文が途中までのこともあるので、ページの本文と長い方を使う。写真もページから取る
    const page = await fetchArticlePage(c.url);
    if (page.text.length > c.text.length) c.text = page.text;
    if (c.text.length < 80) {
      console.log(`△ [${c.feed}] ${c.title}\n   本文を読み取れなかったので飛ばします`);
      continue;
    }
    let judged: Judged;
    try {
      judged = await generateJson<Judged>({
        model: GEMINI_MODELS.smart,
        system: SYSTEM,
        input: `情報源：${c.feed}\n見出し：${c.title}\n本文の目安：約${targetLength(c.text)}字\n本文：${c.text}`,
        schema: SCHEMA,
        maxOutputTokens: 4096,
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
      console.log(`△ [${c.feed}] ${c.title}\n   載せる判定でしたが、記事の項目がそろわなかったので次回に回します`);
      continue;
    }

    const category = judged.category!;
    const id = articleId(c);
    const sourceName = `${c.feed}（英語）`;
    console.log(`○ [${c.feed}] ${c.title}\n   → ${judged.title}（${category}、${judged.body!.join('').length}字）`);
    const photo = await chooseImage(judged, {
      id,
      title: judged.title!,
      lead: judged.lead!,
      sourceUrl: c.url,
      sourceName,
      pageImage: page.image,
    });
    if (DRY_RUN) continue;

    const { error } = await db.from('articles').insert({
      id,
      category,
      region: judged.region || '海外',
      minutes: readingMinutes(judged.body!),
      title: judged.title,
      lead: judged.lead,
      summary: judged.summary,
      body: judged.body,
      source_name: sourceName,
      source_url: c.url,
      scene: SCENE[category].scene,
      scene_caption: SCENE[category].caption,
      photo,
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
