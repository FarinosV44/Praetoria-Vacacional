-- Light CMS content overrides (issue #50).
-- A key/value document store the admin panel writes to. Keys are namespaced:
--   property:<slug>          -> { metaTitle?, metaDescription?, h1?, tagline?,
--                                 shortIntro?, highlights?, nearby?, faq? }
--   guide:<propertySlug>:<slug> -> { title?, description?, lead?, status?, order? }
-- The application deep-merges these over the static content in src/content.

create table if not exists content_overrides (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

comment on table content_overrides is
  'Admin-editable overrides deep-merged over static site content (issue #50).';
