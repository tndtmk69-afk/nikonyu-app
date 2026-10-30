import { getActor } from '@/server/actor';
import { listArticles } from '@/server/articles';
import { handle } from '@/server/supabase';

// 今日の5本と、それより前の記事
export const GET = handle(async (request) => {
  const { actor } = await getActor(request);
  return Response.json(await listArticles(actor));
});
