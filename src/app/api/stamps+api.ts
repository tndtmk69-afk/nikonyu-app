import type { StampKind } from '@/constants/nikonyu';
import { requireActor } from '@/server/actor';
import { db, handle, HttpError, must } from '@/server/supabase';

const KINDS: StampKind[] = ['hokko', 'sugoi', 'kusu', 'jin'];

// スタンプを押す・取り消す（ログインなしで使える）
export const POST = handle(async (request) => {
  const { actor } = await requireActor(request);
  const { articleId, kind } = (await request.json()) as { articleId?: string; kind?: StampKind };
  if (!articleId || !kind || !KINDS.includes(kind)) throw new HttpError(400, 'スタンプの指定が正しくありません');

  const key = { article_id: articleId, actor, kind };
  const existing = must(await db().from('stamps').select('kind').match(key).limit(1));
  if (existing.length > 0) {
    must(await db().from('stamps').delete().match(key));
    return Response.json({ on: false });
  }
  must(await db().from('stamps').insert(key));
  return Response.json({ on: true });
});
