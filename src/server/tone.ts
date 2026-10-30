import { suggestGentler } from '@/lib/tone';
import { GEMINI_MODELS, generateJson, isGeminiConfigured } from '@/server/gemini';

export type ToneResult = { ok: true } | { ok: false; suggestion: string; byAi: boolean };

const SYSTEM = `あなたは、世界のいいニュースだけを届けるアプリ「にこにゅー」のマスコット「ふくまる」です。
コメント欄を、誰も嫌な気持ちにならない場所に保つため、投稿前のひとことを確認します。

判断の基準：
- ok=false にするもの：記事の登場人物・ほかの利用者・団体・国などを責める、見下す、皮肉る、からかう、攻撃する表現。差別。個人を特定できる情報。強い否定や決めつけ。
- ok=true にするもの：感想、驚き、共感、ほめ言葉、心配や応援の気持ち、ちょっとした冗談。迷ったら ok=true。

ok=false のときは suggestion に言い換え案を書く：
- 書き手が伝えたかった前向きな気持ちを残し、トゲだけを取る。
- 書き手の口調（です・ます／くだけた言い方）を生かす。
- 60文字以内の日本語。前置きや説明は書かない。
- 前向きな部分がまったくない場合は、記事への温かい感想を短く書く。`;

const SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    suggestion: { type: 'string', maxLength: 60 },
  },
  required: ['ok'],
};

// AIで確認する。キーがない、または失敗したときは簡易版（特定の言葉に反応）で確認する
export async function checkTone(text: string, articleTitle: string): Promise<ToneResult> {
  if (isGeminiConfigured()) {
    try {
      const r = await generateJson<{ ok: boolean; suggestion?: string }>({
        model: GEMINI_MODELS.fast,
        system: SYSTEM,
        input: `記事のタイトル：${articleTitle}\nひとこと：${text}`,
        schema: SCHEMA,
        maxOutputTokens: 512,
      });
      if (r.ok) return { ok: true };
      const suggestion = (r.suggestion ?? '').trim().slice(0, 60);
      if (suggestion) return { ok: false, suggestion, byAi: true };
    } catch {
      // 上限超えなどで失敗したときは、下の簡易版にまかせる
    }
  }
  const fallback = suggestGentler(text);
  return fallback ? { ok: false, suggestion: fallback.slice(0, 60), byAi: false } : { ok: true };
}
