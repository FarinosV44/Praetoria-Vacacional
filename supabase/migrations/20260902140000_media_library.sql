-- =============================================================================
-- Issue #81 — media library
-- =============================================================================
-- One row per uploaded asset. The file itself lives in the Storage bucket
-- `media` (create it as a PRIVATE bucket; the app serves files through signed
-- URLs minted server-side). `focal_x`/`focal_y` are 0–1 fractions used for
-- object-position when the image is cropped (reuses the ResponsivePhoto model).
--
-- RLS forced, service_role only — every read/write goes through the admin API
-- behind the session gate (D-005).
--
-- Idempotent. Safe to re-run.
-- =============================================================================

create table if not exists media_assets (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null default 'media',
  path         text not null unique,
  filename     text not null,
  mime         text not null,
  size_bytes   bigint not null default 0,
  width        int,
  height       int,
  alt          text not null default '',
  focal_x      real not null default 0.5,
  focal_y      real not null default 0.5,
  tags         text[] not null default '{}',
  uploaded_by  uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists media_assets_created_idx on media_assets (created_at desc);
create index if not exists media_assets_tags_idx on media_assets using gin (tags);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'media_assets_touch') then
    create trigger media_assets_touch before update on media_assets
      for each row execute function touch_updated_at();
  end if;
end $$;

alter table media_assets enable row level security;
alter table media_assets force  row level security;
revoke all on media_assets from anon, authenticated;
grant  all on media_assets to service_role;
