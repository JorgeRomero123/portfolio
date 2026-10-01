-- The Game (/the-game): finished races and the opt-in speedrun leaderboard.
-- Run this once in the Supabase SQL Editor. Safe to run again.
--
-- One row per finished race (won or lost), recorded anonymously: outcome, time, losses, stamps and
-- when. No IP, no user agent, nothing personal. A winner may later attach a nickname and a country
-- to their own row, proved by the secret token only their browser holds (we keep its SHA-256 hash).
-- The time is measured by the browser, so it can be forged: the API rejects implausible values and
-- the distribution ignores outliers, but this is a toy leaderboard, not an anti-cheat system.

create table if not exists the_game_runs (
  id           uuid        primary key default gen_random_uuid(),
  outcome      text        not null check (outcome in ('won', 'lost')),
  time_ms      integer     not null check (time_ms between 1000 and 604800000),  -- 1 s .. 7 days
  losses       smallint    not null check (losses between 0 and 9),
  stamps       smallint    not null check (stamps between 0 and 11),
  nickname     text        check (nickname is null or char_length(nickname) between 2 and 20),
  country      text        check (country is null or country ~ '^[A-Z]{2}$'),
  token_hash   text        not null,
  -- Hash of a random key the browser sends with the run, so a retried request can't record it twice.
  nonce_hash   text        not null unique,
  created_at   timestamptz not null default now(),
  nickname_at  timestamptz,
  -- The race rules (components/the-game/race.ts): a win is 11 stamps with at most two losses;
  -- a loss is at most 10 stamps with at least three losses.
  constraint the_game_runs_rules_check check (
    (outcome = 'won' and stamps = 11 and losses <= 2) or
    (outcome = 'lost' and stamps <= 10 and losses >= 3)
  )
);

create index if not exists the_game_runs_wins_idx
  on the_game_runs (time_ms) where outcome = 'won';
create index if not exists the_game_runs_board_idx
  on the_game_runs (time_ms, created_at) where outcome = 'won' and nickname is not null;
create index if not exists the_game_runs_created_idx
  on the_game_runs (created_at desc);

-- Only the API routes (service role key) touch this table: RLS on, no public policies.
alter table the_game_runs enable row level security;

-- ── Record a finished race ──────────────────────────────────────────────────────────────────
-- Returns the run id, or no row when the global write cap (runs per minute) is reached.
-- A repeated nonce returns the existing run and gives it the new token instead of inserting again.
create or replace function the_game_record_run(
  p_outcome         text,
  p_time_ms         integer,
  p_losses          integer,
  p_stamps          integer,
  p_token_hash      text,
  p_nonce_hash      text,
  p_max_per_minute  integer
) returns table (id uuid)
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  update the_game_runs r set token_hash = p_token_hash
    where r.nonce_hash = p_nonce_hash
    returning r.id into v_id;
  if v_id is not null then
    return query select v_id;
    return;
  end if;

  if (select count(*) from the_game_runs r where r.created_at > now() - interval '1 minute') >= p_max_per_minute then
    return;
  end if;

  insert into the_game_runs (outcome, time_ms, losses, stamps, token_hash, nonce_hash)
    values (p_outcome, p_time_ms, p_losses, p_stamps, p_token_hash, p_nonce_hash)
    on conflict (nonce_hash) do update set token_hash = excluded.token_hash
    returning the_game_runs.id into v_id;
  return query select v_id;
end;
$$;

-- ── Everything the results screen needs, in one round trip ──────────────────────────────────
-- runs / wins: all recorded races and wins. times: every winning time in [p_min_ms, p_max_ms],
-- ascending (the API buckets them). mine: the given run's time, outcome and, for a win, its place
-- in the order players beat Jorge (1 = first ever).
create or replace function the_game_summary(p_run uuid, p_min_ms integer, p_max_ms integer)
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'runs',  (select count(*) from the_game_runs),
    'wins',  (select count(*) from the_game_runs where outcome = 'won'),
    'times', coalesce((
      select json_agg(time_ms order by time_ms)
      from the_game_runs
      where outcome = 'won' and time_ms between p_min_ms and p_max_ms
    ), '[]'::json),
    'mine', (
      select json_build_object(
        'time_ms', m.time_ms,
        'outcome', m.outcome,
        'place', case when m.outcome = 'won' then (
          select count(*) from the_game_runs w
          where w.outcome = 'won' and (w.created_at, w.id) <= (m.created_at, m.id)
        ) end
      )
      from the_game_runs m where m.id = p_run
    )
  );
$$;

-- ── Leaderboard ─────────────────────────────────────────────────────────────────────────────
-- Top p_limit named winning runs (fastest first, earliest breaks ties) and, when p_run is named
-- but not in the top, that run's own row and rank. Run ids are never returned; `mine` flags the
-- caller's row.
create or replace function the_game_leaderboard(p_run uuid, p_limit integer)
returns json
language sql
stable
set search_path = public
as $$
  with ranked as (
    select id, nickname, country, time_ms, losses,
           row_number() over (order by time_ms, created_at, id) as rank
    from the_game_runs
    where outcome = 'won' and nickname is not null
  )
  select json_build_object(
    'total', (select count(*) from ranked),
    'top', coalesce((
      select json_agg(json_build_object(
        'rank', rank, 'nickname', nickname, 'country', country,
        'time_ms', time_ms, 'losses', losses, 'mine', id is not distinct from p_run
      ) order by rank)
      from ranked where rank <= p_limit
    ), '[]'::json),
    'me', (
      select json_build_object(
        'rank', rank, 'nickname', nickname, 'country', country,
        'time_ms', time_ms, 'losses', losses, 'mine', true
      )
      from ranked where id = p_run and rank > p_limit
    )
  );
$$;

-- ── Attach a nickname and country to your own winning run ───────────────────────────────────
-- True when the id/token pair matched a won run (and the row was updated).
create or replace function the_game_attach(p_run uuid, p_token_hash text, p_nickname text, p_country text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_rows integer;
begin
  update the_game_runs
     set nickname = p_nickname, country = p_country, nickname_at = now()
   where id = p_run and token_hash = p_token_hash and outcome = 'won';
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- Functions in `public` are callable through the REST API by default. Only the server may call these.
revoke all on function the_game_record_run(text, integer, integer, integer, text, text, integer) from public, anon, authenticated;
revoke all on function the_game_summary(uuid, integer, integer) from public, anon, authenticated;
revoke all on function the_game_leaderboard(uuid, integer) from public, anon, authenticated;
revoke all on function the_game_attach(uuid, text, text, text) from public, anon, authenticated;
grant execute on function the_game_record_run(text, integer, integer, integer, text, text, integer) to service_role;
grant execute on function the_game_summary(uuid, integer, integer) to service_role;
grant execute on function the_game_leaderboard(uuid, integer) to service_role;
grant execute on function the_game_attach(uuid, text, text, text) to service_role;
