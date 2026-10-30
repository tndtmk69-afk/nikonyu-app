import { requireActor } from '@/server/actor';
import { db, handle, HttpError, must } from '@/server/supabase';

// ひとことに「ありがとう」を押す・取り消す
export const POST = handle(async (request) => {
  const { actor } = await requireActor(request);
  const { commentId } = (await request.json()) as { commentId?: string };
  if (!commentId) throw new HttpError(400, 'ひとことの指定がありません');

  const key = { comment_id: commentId, actor };
  const existing = must(await db().from('thanks').select('comment_id').match(key).limit(1));
  if (existing.length > 0) {
    must(await db().from('thanks').delete().match(key));
    return Response.json({ on: false });
  }
  must(await db().from('thanks').insert(key));
  return Response.json({ on: true });
});
