-- Leaderboard for storyline daytime pages.
-- Tracks verified player high scores per daytime page and aggregates by scope
-- (journey, country, chapter) with deterministic tie-breaking.

create table public.storyline_pages (
  id text primary key references public.challenge_pages (id) on delete cascade,
  country_id text not null,
  chapter_number integer not null check (chapter_number > 0),
  page_number integer not null check (page_number > 0)
);

-- Catalog of the 37 daytime storyline pages across Singapore, Thailand, and Vietnam
insert into public.storyline_pages (id, country_id, chapter_number, page_number) values
  -- Singapore (9 pages, 3 chapters)
  ('botanic-gardens-heritage', 'singapore', 1, 1),
  ('merlion-park', 'singapore', 1, 2),
  ('marina-bay-sands', 'singapore', 1, 3),
  ('joo-chiat-shophouses', 'singapore', 2, 4),
  ('lau-pa-sat-market', 'singapore', 2, 5),
  ('singapore-river-quay', 'singapore', 2, 6),
  ('buddha-tooth-temple', 'singapore', 3, 7),
  ('gardens-by-the-bay', 'singapore', 3, 8),
  ('marina-bay-skyline', 'singapore', 3, 9),

  -- Thailand (9 pages, 3 chapters)
  ('grand-palace', 'thailand', 1, 1),
  ('wat-pho', 'thailand', 1, 2),
  ('wat-arun', 'thailand', 1, 3),
  ('yaowarat', 'thailand', 2, 4),
  ('damnoen-saduak', 'thailand', 2, 5),
  ('ayutthaya', 'thailand', 2, 6),
  ('chiang-mai', 'thailand', 3, 7),
  ('doi-suthep', 'thailand', 3, 8),
  ('loy-krathong', 'thailand', 3, 9),

  -- Vietnam (19 pages, 5 chapters)
  -- Chapter 1: Bắc Bộ
  ('ho-hoan-kiem', 'vietnam', 1, 1),
  ('ha-long', 'vietnam', 1, 2),
  ('trang-an', 'vietnam', 1, 3),
  ('fansipan', 'vietnam', 1, 4),
  -- Chapter 2: Miền Cao Tây Bắc & Đông Bắc
  ('mu-cang-chai', 'vietnam', 2, 5),
  ('nho-que', 'vietnam', 2, 6),
  ('phong-nha', 'vietnam', 2, 7),
  -- Chapter 3: Miền Trung
  ('hue-citadel', 'vietnam', 3, 8),
  ('ba-na-hills', 'vietnam', 3, 9),
  ('hoi-an', 'vietnam', 3, 10),
  ('ghenh-da-dia', 'vietnam', 3, 11),
  -- Chapter 4: Duyên Hải & Cao Nguyên
  ('ponagar', 'vietnam', 4, 12),
  ('da-lat', 'vietnam', 4, 13),
  ('cao-dai', 'vietnam', 4, 14),
  -- Chapter 5: Nam Bộ
  ('ben-thanh', 'vietnam', 5, 15),
  ('duc-ba', 'vietnam', 5, 16),
  ('cai-rang', 'vietnam', 5, 17),
  ('phu-quoc', 'vietnam', 5, 18),
  ('ca-mau', 'vietnam', 5, 19);

alter table public.storyline_pages enable row level security;
grant select on public.storyline_pages to anon, authenticated;
create policy "Anyone can view storyline pages catalog" on public.storyline_pages
  for select using (true);

-- Public user profiles for ranking display (display_name only, never email)
create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
grant select on public.user_profiles to anon, authenticated;
create policy "Anyone can read user display names" on public.user_profiles
  for select using (true);

-- Per-page storyline high score records
create table public.story_page_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  page_id text not null references public.storyline_pages (id) on delete cascade,
  high_score integer not null check (high_score > 0 and high_score <= 7000),
  stars integer not null check (stars between 1 and 3),
  time_taken integer not null check (time_taken >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, page_id)
);

create index story_page_records_user_idx on public.story_page_records (user_id);
create index story_page_records_page_idx on public.story_page_records (page_id);

alter table public.story_page_records enable row level security;
grant select on public.story_page_records to anon, authenticated;
grant insert, update on public.story_page_records to authenticated;

create policy "Anyone can read story scores" on public.story_page_records
  for select using (true);

create policy "Users can insert their own scores" on public.story_page_records
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users can update their own scores" on public.story_page_records
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Record a verified score on a storyline day page
create or replace function public.record_story_score(
  p_page_id text,
  p_score integer,
  p_stars integer default 1,
  p_time integer default 0,
  p_display_name text default null
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not exists (select 1 from public.storyline_pages where id = p_page_id) then
    raise exception 'Invalid storyline day page' using errcode = '22023';
  end if;
  if p_score is null or p_score <= 0 or p_score > 7000 then
    raise exception 'Invalid score' using errcode = '22023';
  end if;
  if p_stars is null or p_stars not between 1 and 3 then
    p_stars := 1;
  end if;
  if p_time is null or p_time < 0 then
    p_time := 0;
  end if;

  v_name := nullif(btrim(p_display_name), '');
  if v_name is null then
    select coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', 'Thám tử ẩn danh')
    into v_name from auth.users where id = v_user;
  end if;
  v_name := coalesce(substr(btrim(coalesce(v_name, 'Thám tử ẩn danh')), 1, 40), 'Thám tử ẩn danh');

  insert into public.user_profiles (user_id, display_name, updated_at)
    values (v_user, v_name, now())
    on conflict (user_id) do update
    set display_name = excluded.display_name, updated_at = now();

  insert into public.story_page_records (user_id, page_id, high_score, stars, time_taken, updated_at)
    values (v_user, p_page_id, p_score, p_stars, p_time, now())
    on conflict (user_id, page_id) do update
    set
      stars = greatest(public.story_page_records.stars, excluded.stars),
      time_taken = case
        when excluded.high_score > public.story_page_records.high_score then excluded.time_taken
        when excluded.high_score = public.story_page_records.high_score then least(public.story_page_records.time_taken, excluded.time_taken)
        else public.story_page_records.time_taken
      end,
      updated_at = case
        when excluded.high_score > public.story_page_records.high_score then now()
        else public.story_page_records.updated_at
      end,
      high_score = greatest(public.story_page_records.high_score, excluded.high_score);

  return true;
end;
$$;

revoke execute on function public.record_story_score(text, integer, integer, integer, text) from public, anon;
grant execute on function public.record_story_score(text, integer, integer, integer, text) to authenticated;

-- Query the top 100 leaderboard for a given scope
create or replace function public.get_leaderboard(
  p_scope text,
  p_country_id text default null,
  p_chapter_number integer default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_scope not in ('journey', 'country', 'chapter') then
    raise exception 'Invalid leaderboard scope' using errcode = '22023';
  end if;

  with scope_pages as (
    select id, country_id, chapter_number
    from public.storyline_pages
    where (p_scope = 'journey')
       or (p_scope = 'country' and country_id = p_country_id)
       or (p_scope = 'chapter' and country_id = p_country_id and chapter_number = p_chapter_number)
  ),
  scope_total as (
    select count(*)::integer as total_pages from scope_pages
  ),
  user_scores as (
    select
      r.user_id,
      sum(r.high_score)::integer as total_score,
      count(r.page_id)::integer as pages_cleared,
      max(r.updated_at) as last_updated
    from public.story_page_records r
    join scope_pages sp on r.page_id = sp.id
    where r.high_score > 0
    group by r.user_id
    having count(r.page_id) >= 1
  ),
  ranked as (
    select
      row_number() over (
        order by us.total_score desc, us.pages_cleared desc, us.last_updated asc, us.user_id asc
      )::integer as rank,
      us.user_id,
      coalesce(up.display_name, 'Thám tử ẩn danh') as display_name,
      us.total_score,
      us.pages_cleared,
      st.total_pages
    from user_scores us
    cross join scope_total st
    left join public.user_profiles up on up.user_id = us.user_id
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'rank', r.rank,
      'userId', r.user_id,
      'displayName', r.display_name,
      'totalScore', r.total_score,
      'pagesCleared', r.pages_cleared,
      'totalPages', r.total_pages
    ) order by r.rank asc
  ), '[]'::jsonb)
  into v_result
  from (
    select * from ranked limit greatest(1, least(coalesce(p_limit, 100), 100))
  ) r;

  return v_result;
end;
$$;

revoke execute on function public.get_leaderboard(text, text, integer, integer) from public;
grant execute on function public.get_leaderboard(text, text, integer, integer) to anon, authenticated;

-- Query a specific user's rank within the scope across all participants
create or replace function public.get_user_leaderboard_rank(
  p_user_id uuid,
  p_scope text,
  p_country_id text default null,
  p_chapter_number integer default null
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_user_id is null then return null; end if;
  if p_scope not in ('journey', 'country', 'chapter') then
    raise exception 'Invalid leaderboard scope' using errcode = '22023';
  end if;

  with scope_pages as (
    select id, country_id, chapter_number
    from public.storyline_pages
    where (p_scope = 'journey')
       or (p_scope = 'country' and country_id = p_country_id)
       or (p_scope = 'chapter' and country_id = p_country_id and chapter_number = p_chapter_number)
  ),
  scope_total as (
    select count(*)::integer as total_pages from scope_pages
  ),
  user_scores as (
    select
      r.user_id,
      sum(r.high_score)::integer as total_score,
      count(r.page_id)::integer as pages_cleared,
      max(r.updated_at) as last_updated
    from public.story_page_records r
    join scope_pages sp on r.page_id = sp.id
    where r.high_score > 0
    group by r.user_id
    having count(r.page_id) >= 1
  ),
  ranked as (
    select
      row_number() over (
        order by us.total_score desc, us.pages_cleared desc, us.last_updated asc, us.user_id asc
      )::integer as rank,
      us.user_id,
      coalesce(up.display_name, 'Thám tử ẩn danh') as display_name,
      us.total_score,
      us.pages_cleared,
      st.total_pages
    from user_scores us
    cross join scope_total st
    left join public.user_profiles up on up.user_id = us.user_id
  )
  select jsonb_build_object(
    'rank', r.rank,
    'userId', r.user_id,
    'displayName', r.display_name,
    'totalScore', r.total_score,
    'pagesCleared', r.pages_cleared,
    'totalPages', r.total_pages
  )
  into v_result
  from ranked r
  where r.user_id = p_user_id;

  return v_result;
end;
$$;

revoke execute on function public.get_user_leaderboard_rank(uuid, text, text, integer) from public;
grant execute on function public.get_user_leaderboard_rank(uuid, text, text, integer) to anon, authenticated;

