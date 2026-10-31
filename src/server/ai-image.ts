// 記事のイメージ画像を、Cloudflare Workers AI の画像モデル（FLUX）で作る。
// 取り込みスクリプト（scripts/ingest.mts）から使うので、このファイルでは "@/..." の別名を使わない。
// 無料枠（1日1万ニューロン）の範囲で、1日100枚以上作れる。
// 本物の写真と誤解されないよう、画面では必ず「AI生成イメージ」と表示する（src/components/nikonyu/ui.tsx）。

export const IMAGE_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const FALLBACK_MODEL = '@cf/black-forest-labs/flux-1-schnell';

// AIに画像の指示文を考えてもらうときのルール（取り込みとまとめての画像作りで共通）
export const IMAGE_PROMPT_RULE = `image_prompt：記事に添えるイメージ画像を作るための、英語の指示文（60語以内）。
- 報道写真のような自然な写真にする：「documentary photo, natural light」のように書き、絵やイラストにしない。
- 記事の場所（国や地域）、季節、主役（動物・物・風景）が分かるように具体的に書く。
- 人を入れる場合は、顔が分からないようにする：後ろ姿、遠くの小さな姿、手元だけ。実在の人物や有名人に似せない。
- 文字、看板、ロゴ、ブランド名は入れない。暗い・怖い印象にしない。`;

export function isAiImageConfigured() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
}

async function run(model: string, body: BodyInit, headers: Record<string, string> = {}) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    { method: 'POST', headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, ...headers }, body, signal: AbortSignal.timeout(90_000) }
  );
  const json = (await res.json().catch(() => null)) as { result?: { image?: string }; errors?: { message: string }[] } | null;
  const image = json?.result?.image;
  if (!res.ok || !image) throw new Error(`Workers AI (${model}): ${json?.errors?.[0]?.message ?? `HTTP ${res.status}`}`);
  return Buffer.from(image, 'base64');
}

// 横長（16:9）の画像を作り、画像のデータと種類を返す
export async function generateImage(prompt: string): Promise<{ data: Buffer; contentType: string; model: string }> {
  if (!isAiImageConfigured()) throw new Error('CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_API_TOKEN が設定されていません');
  let data: Buffer;
  let model = IMAGE_MODEL;
  try {
    // FLUX.2 はフォーム形式で受け取る
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('width', '1024');
    form.append('height', '576');
    data = await run(IMAGE_MODEL, form);
  } catch (e) {
    // 内容の確認で止められたときは作り直さない（FLUX.1 は「文字を入れない」などの指示が効きにくく、崩れた看板などが出やすい）
    if (/flagged/i.test((e as Error).message)) throw e;
    // モデルが使えなかったときは、正方形しか作れないが安定している FLUX.1 で作る（画面では横長に切り抜いて表示する）
    console.warn(`   ${(e as Error).message}（${FALLBACK_MODEL} で作り直します）`);
    model = FALLBACK_MODEL;
    data = await run(FALLBACK_MODEL, JSON.stringify({ prompt, steps: 6 }), { 'Content-Type': 'application/json' });
  }
  const contentType = data[0] === 0x89 ? 'image/png' : data[0] === 0x52 ? 'image/webp' : 'image/jpeg';
  return { data, contentType, model };
}
