import type { StampKind } from '@/constants/nikonyu';
import { ARTICLES, type Article, type AvatarKind, type SceneName } from '@/data/articles';
import type { ApiArticle, ApiComment, ArticleDetailResponse, ArticleListResponse } from '@/lib/api-types';
import type { ArticlePhoto } from '@/server/photos';
import { db, HttpError, isDbConfigured, must } from '@/server/supabase';

const STAMP_KINDS: StampKind[] = ['hokko', 'sugoi', 'kusu', 'jin'];

type ArticleRow = {
  id: string;
  featured_date: string | null;
  featured_rank: number | null;
  category: ApiArticle['category'];
  region: string;
  minutes: number;
  title: string;
  lead: string;
  summary: string[];
  body: string[];
  source_name: string;
  source_url: string | null;
  scene: SceneName;
  scene_caption: string;
  photo: ArticlePhoto | null;
  seed_stamps: Partial<Record<StampKind, number>>;
};

type CommentRow = {
  id: string;
  article_id: string;
  user_id: string | null;
  author_name: string;
  avatar: AvatarKind;
  body: string;
  seed_thanks: number;
  created_at: string;
  users: { picture: string | null } | null;
};

function toApiArticle(row: ArticleRow, counts: Map<string, number>, mine: Set<string>, commentCount: number): ApiArticle {
  const stamps = Object.fromEntries(
    STAMP_KINDS.map((k) => [k, (row.seed_stamps[k] ?? 0) + (counts.get(`${row.id}:${k}`) ?? 0)])
  ) as Record<StampKind, number>;
  return {
    id: row.id,
    featuredDate: row.featured_date,
    category: row.category,
    region: row.region,
    minutes: row.minutes,
    title: row.title,
    lead: row.lead,
    summary: row.summary,
    body: row.body,
    source: row.source_name,
    sourceUrl: row.source_url,
    scene: row.scene,
    sceneCaption: row.scene_caption,
    photo: row.photo ?? null,
    stamps,
    myStamps: STAMP_KINDS.filter((k) => mine.has(`${row.id}:${k}`)),
    commentCount,
  };
}

async function stampInfo(ids: string[], actor: string | null) {
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  if (ids.length === 0) return { counts, mine };
  const rows = must(await db().from('stamp_counts').select('article_id, kind, n').in('article_id', ids));
  for (const r of rows) counts.set(`${r.article_id}:${r.kind}`, r.n);
  if (actor) {
    const own = must(await db().from('stamps').select('article_id, kind').eq('actor', actor).in('article_id', ids));
    for (const r of own) mine.add(`${r.article_id}:${r.kind}`);
  }
  return { counts, mine };
}

export async function listArticles(actor: string | null): Promise<ArticleListResponse> {
  if (!isDbConfigured()) return sampleList();

  const rows = must(
    await db()
      .from('articles')
      .select('*')
      .not('featured_date', 'is', null)
      .order('featured_date', { ascending: false })
      .order('featured_rank', { ascending: true })
      .limit(40)
  ) as ArticleRow[];
  const ids = rows.map((r) => r.id);
  const { counts, mine } = await stampInfo(ids, actor);

  const commentCounts = new Map<string, number>();
  if (ids.length > 0) {
    const cs = must(await db().from('comments').select('article_id').eq('hidden', false).in('article_id', ids));
    for (const c of cs) commentCounts.set(c.article_id, (commentCounts.get(c.article_id) ?? 0) + 1);
  }

  const latest = rows[0]?.featured_date ?? null;
  const all = rows.map((r) => toApiArticle(r, counts, mine, commentCounts.get(r.id) ?? 0));
  return {
    today: all.filter((a) => a.featuredDate === latest).slice(0, 5),
    archive: all.filter((a) => a.featuredDate !== latest),
    sample: false,
  };
}

export async function getArticleDetail(id: string, actor: string | null, userId: string | null): Promise<ArticleDetailResponse> {
  if (!isDbConfigured()) return sampleDetail(id);

  const rows = must(await db().from('articles').select('*').eq('id', id).limit(1)) as ArticleRow[];
  const row = rows[0];
  if (!row) throw new HttpError(404, '記事が見つかりませんでした');

  const commentRows = must(
    await db()
      .from('comments')
      .select('id, article_id, user_id, author_name, avatar, body, seed_thanks, created_at, users (picture)')
      .eq('article_id', id)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(100)
  ) as unknown as CommentRow[];
  const commentIds = commentRows.map((c) => c.id);

  const thanksCounts = new Map<string, number>();
  const thankedByMe = new Set<string>();
  const reportedByMe = new Set<string>();
  if (commentIds.length > 0) {
    for (const t of must(await db().from('thanks_counts').select('comment_id, n').in('comment_id', commentIds))) {
      thanksCounts.set(t.comment_id, t.n);
    }
    if (actor) {
      for (const t of must(await db().from('thanks').select('comment_id').eq('actor', actor).in('comment_id', commentIds))) {
        thankedByMe.add(t.comment_id);
      }
      for (const r of must(await db().from('reports').select('comment_id').eq('actor', actor).in('comment_id', commentIds))) {
        reportedByMe.add(r.comment_id);
      }
    }
  }

  const comments: ApiComment[] = commentRows
    .filter((c) => !reportedByMe.has(c.id))
    .map((c) => ({
      id: c.id,
      author: c.author_name,
      avatar: c.avatar,
      picture: c.users?.picture ?? null,
      createdAt: c.created_at,
      text: c.body,
      thanks: c.seed_thanks + (thanksCounts.get(c.id) ?? 0),
      thankedByMe: thankedByMe.has(c.id),
      mine: userId !== null && c.user_id === userId,
    }));

  const { counts, mine } = await stampInfo([id], actor);
  return { article: toApiArticle(row, counts, mine, comments.length), comments, sample: false };
}

// ---- データベースが未設定のときに使うサンプル（読み取り専用） ----

function sampleArticle(a: Article): ApiArticle {
  return {
    id: a.id,
    featuredDate: a.day,
    category: a.category,
    region: a.region,
    minutes: a.minutes,
    title: a.title,
    lead: a.lead,
    summary: a.summary,
    body: a.body,
    source: a.source,
    sourceUrl: null,
    scene: a.scene,
    sceneCaption: a.sceneCaption,
    photo: null,
    stamps: a.stamps,
    myStamps: [],
    commentCount: a.comments.length,
  };
}

function sampleList(): ArticleListResponse {
  return {
    today: ARTICLES.filter((a) => a.day === 'today').map(sampleArticle),
    archive: ARTICLES.filter((a) => a.day === 'yesterday').map(sampleArticle),
    sample: true,
  };
}

function sampleDetail(id: string): ArticleDetailResponse {
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) throw new HttpError(404, '記事が見つかりませんでした');
  const now = Date.now();
  return {
    article: sampleArticle(a),
    comments: a.comments.map((c) => ({
      id: c.id,
      author: c.author,
      avatar: c.avatar,
      picture: null,
      createdAt: new Date(now - c.minutesAgo * 60_000).toISOString(),
      text: c.text,
      thanks: c.thanks,
      thankedByMe: false,
      mine: false,
    })),
    sample: true,
  };
}
