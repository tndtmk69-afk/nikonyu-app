// サンプル記事とひとことを Supabase に入れるスクリプト（最初の動作確認用）。
//   npm run seed
// すでに同じIDの記事があれば上書きし、サンプルのひとことは入れ直す。
import { createClient } from '@supabase/supabase-js';

import { ARTICLES } from '../src/data/articles.ts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('✖ SUPABASE_URL と SUPABASE_SECRET_KEY を .env.local に書いてください');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const jst = (offsetDays: number) => new Date(Date.now() + 9 * 3600_000 - offsetDays * 86400_000).toISOString().slice(0, 10);

async function main() {
  const ranks = { today: 0, yesterday: 0 };
  for (const a of ARTICLES) {
    ranks[a.day] += 1;
    const { error } = await db.from('articles').upsert({
      id: a.id,
      featured_date: jst(a.day === 'today' ? 0 : 1),
      featured_rank: ranks[a.day],
      category: a.category,
      region: a.region,
      minutes: a.minutes,
      title: a.title,
      lead: a.lead,
      summary: a.summary,
      body: a.body,
      source_name: a.source,
      source_url: null,
      scene: a.scene,
      scene_caption: a.sceneCaption,
      seed_stamps: a.stamps,
    });
    if (error) throw new Error(`${a.id}: ${error.message}（supabase/schema.sql を実行しましたか？）`);

    await db.from('comments').delete().eq('article_id', a.id).is('user_id', null);
    const now = Date.now();
    const { error: cErr } = await db.from('comments').insert(
      a.comments.map((c) => ({
        article_id: a.id,
        author_name: c.author,
        avatar: c.avatar,
        body: c.text,
        seed_thanks: c.thanks,
        created_at: new Date(now - c.minutesAgo * 60_000).toISOString(),
      }))
    );
    if (cErr) throw new Error(`${a.id} のひとこと: ${cErr.message}`);
    console.log(`・${a.title}`);
  }
  console.log(`\nサンプル記事 ${ARTICLES.length}本を入れました`);
}

main().catch((e) => {
  console.error(`✖ ${(e as Error).message}`);
  process.exit(1);
});
