import { GoogleGenAI } from '@google/genai';

// Gemini API の呼び出し。サーバーと取り込みスクリプト（scripts/ingest.mts）の両方から使うので、
// このファイルでは "@/..." の別名を使わない。
// 注意：無料枠では送った内容がGoogleの製品改善に使われる。一般公開の前に有料枠へ切り替える。

// 無料枠では gemini-3.8-flash が1件に数分かかったため、記事の選定・要約も Flash-Lite で行う。
// 日本語の文字列は、スキーマに maxLength を付けないと同じ言葉を繰り返して止まらなくなることがある。
export const GEMINI_MODELS = {
  fast: 'gemini-3.5-flash-lite', // トーンチェック用
  smart: 'gemini-3.5-flash-lite', // 記事の選定・要約用（有料枠に移ったら gemini-3.8-flash も検討）
} as const;

let client: GoogleGenAI | null = null;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function gemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY が設定されていません');
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// JSONスキーマに沿った答えを返してもらう。
// 答えが止まらなくなることがあるので、長さに上限を付け、考える量も控えめにする。
export async function generateJson<T>(options: {
  model: string;
  system: string;
  input: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
}): Promise<T> {
  // 答えが途中で切れたり壊れたりしたときは、1回だけやり直す
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const interaction = await gemini().interactions.create({
        model: options.model,
        input: options.input,
        system_instruction: options.system,
        response_format: { type: 'text', mime_type: 'application/json', schema: options.schema },
        generation_config: { max_output_tokens: options.maxOutputTokens ?? 2048, thinking_level: 'low' },
      });
      const text = interaction.output_text;
      if (!text) throw new Error('Geminiから答えが返ってきませんでした');
      if (interaction.status && interaction.status !== 'completed') throw new Error(`答えが途中で切れました（${interaction.status}）`);
      return JSON.parse(text) as T;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
