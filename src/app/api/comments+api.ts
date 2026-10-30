import type { PostCommentResponse } from '@/lib/api-types';
import { requireUser } from '@/server/actor';
import { db, handle, HttpError, must } from '@/server/supabase';
import { checkTone } from '@/server/tone';

const MAX_LENGTH = 60;

// ひとことを投稿する。トゲがあれば保存せず、ふくまるの言い換え案を返す
export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const { articleId, text } = (await request.json()) as { articleId?: string; text?: string };
  const body = (text ?? '').trim();
  if (!articleId || !body) throw new HttpError(400, 'ひとことが空です');
  if (body.length > MAX_LENGTH) throw new HttpError(400, `ひとことは${MAX_LENGTH}文字までです`);

  const articles = must(await db().from('articles').select('title').eq('id', articleId).limit(1));
  if (!articles[0]) throw new HttpError(404, '記事が見つかりませんでした');

  const tone = await checkTone(body, articles[0].title);
  if (!tone.ok) {
    return Response.json({ status: 'suggest', suggestion: tone.suggestion, byAi: tone.byAi } satisfies PostCommentResponse);
  }

  const [row] = must(
    await db()
      .from('comments')
      .insert({ article_id: articleId, user_id: user.id, author_name: user.name, avatar: 'you', body })
      .select('id, created_at')
  );
  return Response.json({
    status: 'posted',
    comment: {
      id: row.id,
      author: user.name,
      avatar: 'you',
      picture: user.picture,
      createdAt: row.created_at,
      text: body,
      thanks: 0,
      thankedByMe: false,
      mine: true,
    },
  } satisfies PostCommentResponse);
});
