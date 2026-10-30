import { requireActor } from '@/server/actor';
import { db, handle, HttpError, must } from '@/server/supabase';

// 通報が何件たまったら、運営が確認するまで全員に非表示にするか
const AUTO_HIDE_AT = 3;

// ひとことを通報する。通報した人からは、すぐ見えなくなる
export const POST = handle(async (request) => {
  const { actor } = await requireActor(request);
  const { commentId } = (await request.json()) as { commentId?: string };
  if (!commentId) throw new HttpError(400, 'ひとことの指定がありません');

  must(await db().from('reports').upsert({ comment_id: commentId, actor }, { onConflict: 'comment_id,actor', ignoreDuplicates: true }));

  const counts = must(await db().from('report_counts').select('n').eq('comment_id', commentId).limit(1));
  if ((counts[0]?.n ?? 0) >= AUTO_HIDE_AT) {
    must(await db().from('comments').update({ hidden: true }).eq('id', commentId));
  }
  return Response.json({ ok: true });
});
