import { getActor } from '@/server/actor';
import { getArticleDetail } from '@/server/articles';
import { handle } from '@/server/supabase';

// 記事1本と、そのひとこと
export async function GET(request: Request, params: Record<string, string>) {
  return handle(async (req) => {
    const { actor, user } = await getActor(req);
    return Response.json(await getArticleDetail(params.id, actor, user?.id ?? null));
  })(request);
}
