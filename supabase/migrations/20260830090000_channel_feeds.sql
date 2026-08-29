-- =============================================================================
-- Channel import feed URLs — dedicated, config-only storage (bugfix).
--
-- The Booking/Airbnb iCal URL used to live in calendar_syncs.feed_url, the SAME
-- row that recordSyncRun() upserts on every sync. Any sync that ran without
-- re-passing the URL (the "skipped / not configured" path especially) wiped the
-- saved value to NULL, so the admin fields went blank after a refresh.
--
-- The URL is CONFIGURATION (user-owned, authoritative). calendar_syncs stays as
-- SYNC TELEMETRY only. They must never share a write path again.
-- =============================================================================

create table channel_feeds (
  property_id  uuid not null references properties(id) on delete cascade,
  channel      text not null,            -- 'booking' | 'airbnb'
  url          text not null check (url <> ''),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (property_id, channel)
);

-- Preserve anything already saved in the old location.
insert into channel_feeds (property_id, channel, url)
select property_id, channel, feed_url
from calendar_syncs
where direction = 'import'
  and feed_url is not null
  and feed_url <> ''
on conflict (property_id, channel) do nothing;

create trigger channel_feeds_touch before update on channel_feeds
  for each row execute function touch_updated_at();

alter table channel_feeds enable row level security;
-- Service-role only (like every other operational table, D-005).

-- calendar_syncs.feed_url is now vestigial telemetry; recordSyncRun() no longer
-- writes it. Leave the column (harmless) so getSyncRows() keeps mapping.
