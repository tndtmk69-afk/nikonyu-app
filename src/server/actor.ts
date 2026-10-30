import { db, HttpError, isDbConfigured, must } from '@/server/supabase';

export type SessionUser = { id: string; name: string; picture: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_DAYS = 30;

// ログイン中ならそのユーザー、そうでなければ null
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !isDbConfigured()) return null;
  const rows = must(
    await db()
      .from('sessions')
      .select('expires_at, users (id, name, picture)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
  );
  const user = rows[0]?.users as unknown as SessionUser | undefined;
  return user ?? null;
}

// スタンプや「ありがとう」を押した人の識別子。ログイン中はユーザー、未ログインは端末ID
export async function getActor(request: Request) {
  const user = await getSessionUser(request);
  if (user) return { actor: `user:${user.id}`, user };
  const device = request.headers.get('x-device-id');
  if (device && UUID.test(device)) return { actor: `device:${device}`, user: null };
  return { actor: null, user: null };
}

export async function requireActor(request: Request) {
  const result = await getActor(request);
  if (!result.actor) throw new HttpError(400, '端末を識別できませんでした。ページを読み込み直してください');
  return result as { actor: string; user: SessionUser | null };
}

export async function requireUser(request: Request) {
  const user = await getSessionUser(request);
  if (!user) throw new HttpError(401, 'ひとことを書くには、LINEでログインしてください');
  return user;
}

// LINEでログインした人を登録（2回目以降は名前と画像を更新）して、セッションを発行する
export async function createSession(profile: { lineUserId: string; name: string; picture?: string }) {
  const [user] = must(
    await db()
      .from('users')
      .upsert(
        { line_user_id: profile.lineUserId, name: profile.name, picture: profile.picture ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'line_user_id' }
      )
      .select('id')
  );
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  must(await db().from('sessions').insert({ token, user_id: user.id, expires_at: expires }));
  return token;
}
