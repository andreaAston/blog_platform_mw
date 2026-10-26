-- =====================================================================
-- Blog platform schema (PostgreSQL / Supabase)
-- Run in the Supabase SQL editor, or with:  npm run db:schema
-- WARNING: this drops and recreates every table (development use only).
-- =====================================================================

drop table if exists likes      cascade;
drop table if exists comments   cascade;
drop table if exists post_tags  cascade;
drop table if exists tags       cascade;
drop table if exists posts      cascade;
drop table if exists users      cascade;
drop type  if exists post_status;
drop type  if exists user_role;
drop function if exists set_updated_at();
drop function if exists comments_enforce_one_level();

create type user_role   as enum ('reader', 'author', 'admin');
create type post_status as enum ('draft', 'published');

-- ---------- users ----------
create table users (
  id            integer generated always as identity primary key,
  name          text        not null check (char_length(name) between 2 and 60),
  email         text        not null check (email = lower(email)),
  password_hash text        not null,                 -- bcrypt hash, never the password
  role          user_role   not null default 'reader',
  created_at    timestamptz not null default now()
);
create unique index users_email_key on users (email);

-- ---------- posts ----------
create table posts (
  id              integer generated always as identity primary key,
  author_id       integer     not null references users(id) on delete cascade,
  title           text        not null check (char_length(title) between 3 and 150),
  excerpt         text        not null default '' check (char_length(excerpt) <= 300),
  content         text        not null default '',    -- raw Markdown
  cover_image_url text,
  status          post_status not null default 'draft',
  view_count      integer     not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index posts_feed_idx   on posts (status, published_at desc);
create index posts_author_idx on posts (author_id);

-- ---------- tags (many-to-many with posts) ----------
create table tags (
  id   integer generated always as identity primary key,
  name text not null check (name = lower(name) and char_length(name) between 2 and 30)
);
create unique index tags_name_key on tags (name);

create table post_tags (
  post_id integer not null references posts(id) on delete cascade,
  tag_id  integer not null references tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);
create index post_tags_tag_idx on post_tags (tag_id);

-- ---------- comments (one level of replies) ----------
create table comments (
  id         integer generated always as identity primary key,
  post_id    integer     not null references posts(id)    on delete cascade,
  user_id    integer     not null references users(id)    on delete cascade,
  parent_id  integer              references comments(id) on delete cascade,
  body       text        not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_post_idx   on comments (post_id, created_at);
create index comments_parent_idx on comments (parent_id);

-- ---------- likes: one per user per post (composite primary key) ----------
create table likes (
  user_id    integer     not null references users(id) on delete cascade,
  post_id    integer     not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index likes_post_idx on likes (post_id);

-- ---------- triggers ----------
-- Bump updated_at only when the post's content changes (not on view_count updates).
create function set_updated_at() returns trigger language plpgsql as $$
begin
  if row(new.title, new.excerpt, new.content, new.cover_image_url, new.status)
     is distinct from
     row(old.title, old.excerpt, old.content, old.cover_image_url, old.status) then
    new.updated_at = now();
  end if;
  return new;
end $$;

create trigger posts_set_updated_at
  before update on posts
  for each row execute function set_updated_at();

-- A reply's parent must be a top-level comment on the SAME post.
create function comments_enforce_one_level() returns trigger language plpgsql as $$
declare
  parent_row comments%rowtype;
begin
  if new.parent_id is not null then
    select * into parent_row from comments where id = new.parent_id;
    if parent_row.parent_id is not null then
      raise exception 'Replies can only be one level deep';
    end if;
    if parent_row.post_id <> new.post_id then
      raise exception 'A reply must belong to the same post as its parent';
    end if;
  end if;
  return new;
end $$;

create trigger comments_one_level
  before insert on comments
  for each row execute function comments_enforce_one_level();

-- ---------- Supabase hardening ----------
-- Supabase exposes public tables through its auto-generated REST API.
-- Row Level Security with NO policies blocks that API completely.
-- Our Express server connects with the database role (which bypasses RLS),
-- so the app keeps working and every rule is enforced in our own API.
alter table users     enable row level security;
alter table posts     enable row level security;
alter table tags      enable row level security;
alter table post_tags enable row level security;
alter table comments  enable row level security;
alter table likes     enable row level security;
