// 記事のイメージ写真を Wikimedia Commons から探す。
// 取り込みスクリプト（scripts/ingest.mts）から使うので、このファイルでは "@/..." の別名を使わない。
// 企画書「写真素材サービス」のルール：人の顔やロゴが写る写真は避け、撮影者とライセンスを表記する。
// Pexels は新しいAPIキーの発行を止めていて、Unsplash の API は自動での利用を想定していない。
// Openverse は応答が遅く失敗が多かったため、その元データのひとつである Commons を直接使う（キー不要）。

export type ArticlePhoto = {
  id: string; // Commons のファイル名
  src: string; // Commons が縮小した画像（幅800px）
  alt: string; // 写真のタイトル
  creator: string | null;
  license: string; // 例："CC BY 4.0"
  licenseUrl: string | null;
  pageUrl: string; // 写真の説明ページ
  ai?: boolean; // AIで作った画像（src/server/ai-image.ts）。画面で「AI生成イメージ」と表示する
};

// AIに検索語を考えてもらうときのルール（取り込みとまとめての写真付けで共通）
export const PHOTO_QUERY_RULE = `photo_queries：記事の雰囲気に合う写真を探すための英語の検索語を3つ。それぞれ1〜3語。
- 人の顔が写りにくいものを選ぶ：動物、風景、植物、食べ物、道具や物、手元、後ろ姿など。
- 具体的なものから順に並べ、最後の1つは見つかりやすい一般的な言葉にする（例："puppy grass", "puppy", "dog"）。
- 固有名詞、ブランド名、人名は入れない。`;

// タイトルにこれらの言葉がある画像は、人の顔や文字・ロゴが写っているか、写真ではないか、
// いいニュースに合わない（軍事、事故など）可能性が高いので使わない
const AVOID =
  /\b(man|men|woman|women|person|people|boys?|girls?|child|children|kids?|baby|toddler|teens?|teenagers?|youth|faces?|portraits?|selfie|couples?|family|crowd|group|team|players?|party|dance|lady|guy|students?|workers?|owners?|farmers?|visitors?|logos?|brand|signs?|text|posters?|illustrations?|drawings?|paintings?|engravings?|sculptures?|statues?|plates?|maps?|diagrams?|charts?|graphs?|figures?|screenshots?|stamps?|coins?|banknotes?|military|navy|army|war|weapons?|soldiers?|aircraft|fighter|police|protests?|smoking|cigarettes?|fatal|crash(es)?|accidents?|death|dead|injur\w*)\b/i;

// 商用で使えて、改変（縮小・切り抜き）もでき、表記以外の条件がないライセンスだけを使う（CC BY-SA は使わない）
const ALLOWED_LICENSE = /^(CC0|Public domain|PD|CC BY \d(\.\d)?)$/i;

const USER_AGENT = 'nikonyu-prototype/0.1 (https://nikonyu.expo.app)';

type CommonsPage = {
  title: string;
  index: number;
  imageinfo?: {
    width: number;
    height: number;
    thumburl: string;
    descriptionurl: string;
    extmetadata: Record<string, { value: string } | undefined>;
  }[];
};

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// 写真の候補を集める。exclude に入っている写真（最近使ったもの）は避ける。
// Commons の検索は説明文にも当たって関係のない写真が出やすい（"cat" でライオンなど）ので、
// 各検索語で「タイトルに検索語が全部入っている写真」を集め、最後の一般的な言葉では広く探す。
// どれが記事に合うかは、呼び出す側（取り込みスクリプト）でAIに選んでもらう
export async function findPhotoCandidates(queries: string[], exclude: Set<string>, perQuery = 3): Promise<ArticlePhoto[]> {
  const list = queries.map((q) => q.trim().toLowerCase()).filter(Boolean);
  const found = new Map<string, ArticlePhoto>();
  const add = (photos: ArticlePhoto[]) => photos.forEach((p) => found.set(p.id, p));
  for (const query of list) {
    const words = query.split(/\s+/).map((w) => w.replace(/[^a-z0-9-]/g, '')).filter(Boolean);
    add(await search(words.map((w) => `intitle:${w}`).join(' '), exclude, perQuery));
  }
  const last = list.at(-1);
  if (last) add(await search(last, exclude, perQuery));
  return [...found.values()];
}

async function search(text: string, exclude: Set<string>, max: number): Promise<ArticlePhoto[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6', // ファイル
    gsrlimit: '30',
    gsrsearch: `${text} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '800',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ObjectName',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Wikimedia Commons: HTTP ${res.status}`);
  const json = (await res.json()) as { query?: { pages: Record<string, CommonsPage> } };
  const pages = Object.values(json.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const photos: ArticlePhoto[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || exclude.has(page.title)) continue;
    const meta = info.extmetadata;
    const license = meta.LicenseShortName?.value ?? '';
    const name = stripHtml(meta.ObjectName?.value ?? page.title.replace(/^File:/, '').replace(/\.\w+$/, ''));
    // 横長で、ある程度大きい写真だけ（古い図版や小さな画像を避ける）
    const landscape = info.width >= 1200 && info.width >= info.height * 1.2;
    if (!landscape || !ALLOWED_LICENSE.test(license) || AVOID.test(`${name} ${page.title}`)) continue;
    photos.push({
      id: page.title,
      src: info.thumburl,
      alt: name,
      creator: meta.Artist ? stripHtml(meta.Artist.value).slice(0, 60) || null : null,
      license,
      licenseUrl: meta.LicenseUrl?.value ?? null,
      pageUrl: info.descriptionurl,
    });
    if (photos.length >= max) break;
  }
  return photos;
}
