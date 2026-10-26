// コメントのトーンチェック（試作の簡易版）。本番ではAIで文脈ごと判断する。
const SHARP_WORDS = ['でしょ', 'ちゃんと', 'ありえない', 'バカ', 'ばか', '最悪', 'うざ', 'キモ', 'きもい', 'どうせ', '意味わからん'];

const isSharp = (s: string) => SHARP_WORDS.some((w) => s.includes(w));

// とげのある言い方なら言い換え案を、問題なければ null を返す
export function suggestGentler(text: string): string | null {
  if (!isSharp(text)) return null;

  const sentences = text
    .replace(/([。！!？?\n])/g, '$1\u0000')
    .split('\u0000')
    .map((s) => s.trim())
    .filter(Boolean);
  let kept = sentences
    .filter((s) => !isSharp(s))
    .map((s) => s.replace(/^(でも|けど|だけど)、?/, ''))
    .join('');

  if (!kept) kept = '読めてよかったです';
  if (!/[。！!？?]$/.test(kept)) kept += '！';
  return kept;
}
