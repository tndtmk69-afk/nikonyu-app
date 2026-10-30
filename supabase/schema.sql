-- にこにゅーのデータベース定義。Supabase の SQL Editor に貼り付けて、一度だけ実行する。
-- アプリからは直接さわらず、サーバー（Expo の API）が秘密鍵でだけ読み書きする。
-- そのため全テーブルで RLS を有効にし、公開キー向けのポリシーは作らない（＝公開キーでは何も読めない）。

create table if not exists articles (
  id            text primary key,
  featured_date date,                -- 「今日の5本」に選ばれた日（日本時間）。選ばれていなければ null
  featured_rank int,                 -- その日の並び順（1〜5）
  category      text not null check (category in ('sugoi', 'hokkori', 'kusu', 'iyashi', 'mofu', 'nippon')),
  region        text not null,
  minutes       int  not null default 1,
  title         text not null,
  lead          text not null,
  summary       jsonb not null,      -- 3行でいうと（文字列3つの配列）
  body          jsonb not null,      -- 本文の段落（文字列の配列）
  source_name   text not null,
  source_url    text unique,
  scene         text not null,       -- 写真がないときの挿絵の名前
  scene_caption text not null,
  photo         jsonb,               -- Wikimedia Commons のイメージ写真（src/server/photos.ts の ArticlePhoto）。見つからなければ null
  seed_stamps   jsonb not null default '{}'::jsonb,  -- サンプル記事の初期スタンプ数
  created_at    timestamptz not null default now()
);
-- 写真の列を追加する前に作ったデータベース向け（この行だけ実行してもよい）
alter table articles add column if not exists photo jsonb;
create index if not exists articles_featured_idx on articles (featured_date desc, featured_rank);

create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  name         text not null,
  picture      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists sessions (
  token      text primary key,
  user_id    uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  article_id  text not null references articles (id) on delete cascade,
  user_id     uuid references users (id) on delete set null,
  author_name text not null,
  avatar      text not null default 'you',
  body        text not null check (char_length(body) between 1 and 60),
  seed_thanks int  not null default 0,
  hidden      boolean not null default false,  -- 通報が一定数たまったら true
  created_at  timestamptz not null default now()
);
create index if not exists comments_article_idx on comments (article_id, created_at desc);

-- actor は「user:<ユーザーID>」か、ログインしていない端末の「device:<端末ID>」
create table if not exists stamps (
  article_id text not null references articles (id) on delete cascade,
  actor      text not null,
  kind       text not null check (kind in ('hokko', 'sugoi', 'kusu', 'jin')),
  created_at timestamptz not null default now(),
  primary key (article_id, actor, kind)
);

create table if not exists thanks (
  comment_id uuid not null references comments (id) on delete cascade,
  actor      text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, actor)
);

create table if not exists reports (
  comment_id uuid not null references comments (id) on delete cascade,
  actor      text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, actor)
);

-- 記事の取り込みで一度判定したURL（載せなかったものも含む）。同じ記事を何度もAIに送らないため
create table if not exists seen_sources (
  url        text primary key,
  accepted   boolean not null,
  reason     text,
  created_at timestamptz not null default now()
);

-- 集計用のビュー。security_invoker にして、呼び出した側の権限（RLS）で動くようにする
create or replace view stamp_counts with (security_invoker = true) as
  select article_id, kind, count(*)::int as n from stamps group by article_id, kind;

create or replace view thanks_counts with (security_invoker = true) as
  select comment_id, count(*)::int as n from thanks group by comment_id;

create or replace view report_counts with (security_invoker = true) as
  select comment_id, count(*)::int as n from reports group by comment_id;

alter table articles     enable row level security;
alter table users        enable row level security;
alter table sessions     enable row level security;
alter table comments     enable row level security;
alter table stamps       enable row level security;
alter table thanks       enable row level security;
alter table reports      enable row level security;
alter table seen_sources enable row level security;
