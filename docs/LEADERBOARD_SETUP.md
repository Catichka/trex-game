# Leaderboard setup (Supabase)

The game reads and writes the `scores` table in the Supabase project `zaujmeukeugxvjtzaspp` with the public anon key in `game.js`. That key is public by design, so the database itself has to decide what visitors may do.

## One-time setup

Open the project at supabase.com → **SQL Editor** → **New query**, paste this and press **Run**. It is safe to run more than once.

```sql
-- Table (skipped if it already exists).
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  name       text        not null,
  score      integer     not null,
  created_at timestamptz not null default now()
);

-- Reject obviously fake rows: names 1–12 characters, scores in a playable range.
alter table public.scores drop constraint if exists scores_name_len;
alter table public.scores add constraint scores_name_len check (char_length(name) between 1 and 12);
alter table public.scores drop constraint if exists scores_score_range;
alter table public.scores add constraint scores_score_range check (score between 1 and 200000);

-- Visitors may read and add scores, never edit or delete them.
alter table public.scores enable row level security;
drop policy if exists "scores are public" on public.scores;
create policy "scores are public" on public.scores for select to anon using (true);
drop policy if exists "anyone can add a score" on public.scores;
create policy "anyone can add a score" on public.scores for insert to anon with check (true);
grant select, insert on public.scores to anon;

-- Fast top-10 query.
create index if not exists scores_score_desc on public.scores (score desc);

-- One row per game run: each save carries a random run id, and a retried save
-- with the same id is ignored (POST ?on_conflict=client_id, ignore-duplicates).
alter table public.scores add column if not exists client_id uuid;
alter table public.scores drop constraint if exists scores_client_id_key;
alter table public.scores add constraint scores_client_id_key unique (client_id);
grant insert (client_id) on public.scores to anon;
```

If the constraint lines fail with "violated by some row", old test rows are out of range: run `delete from public.scores where score < 1 or score > 200000 or char_length(name) not between 1 and 12;` and run the setup again.

## Free-plan pausing

Supabase pauses free projects after about a week with no activity. A paused project makes the Hall of Fame say "Couldn't reach the leaderboard." Restore it from the project's dashboard; the scores are kept.

## Limits

Anyone who reads the page source can still post a made-up score within the allowed range. Stopping that needs a server-side check (an Edge Function that compares the score with play time), which is planned for the leaderboard milestone. For a link shared with friends, the setup above is enough.
