import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// サーバー専用。秘密鍵（RLSを通り抜ける）を使うので、src/app/api の中からだけ読み込むこと。

let client: SupabaseClient | null = null;

export function isDbConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new HttpError(503, 'データベースが未設定です（SUPABASE_URL と SUPABASE_SECRET_KEY を .env.local に書いてください）');
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// API のハンドラーを包んで、エラーを JSON で返す
export function handle(fn: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await fn(request);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      const reason = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
      return Response.json({ error: `サーバーでエラーが起きました: ${reason}` }, { status: 500 });
    }
  };
}

// supabase-js の結果からエラーを投げて data だけ取り出す（select しない書き込みでは使わない値）
export function must<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}
