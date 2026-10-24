-- Fixes for the story leaderboard (20261018230000_story_leaderboard.sql):
-- 1. Scores are written only by record_story_score: players could PATCH their own rows directly
--    (any score, any stars, an old updated_at that wins every tie).
-- 2. The chapter catalog of Singapore and Thailand did not follow the books (content/countries).
-- 3. One cap of 7000 dropped real scores (a full combo reaches 14–19k): each page now has its own
--    bound, core/leaderboard.maxPageScore over the page's objects and every migrant that can visit it.
-- app/test/leaderboard.test.ts checks this catalog against the books.

/* ---- 1. Writes only through the RPC ---- */

drop policy if exists "Users can insert their own scores" on public.story_page_records;
drop policy if exists "Users can update their own scores" on public.story_page_records;
revoke all on public.story_page_records from anon, authenticated;
revoke all on public.user_profiles from anon, authenticated;
revoke all on public.storyline_pages from anon, authenticated;
grant select on public.story_page_records, public.user_profiles, public.storyline_pages to anon, authenticated;

-- The primary key (user_id, page_id) already serves lookups by user
drop index if exists public.story_page_records_user_idx;

/* ---- 2 & 3. Catalog in book order, with each page's highest possible score ---- */

alter table public.storyline_pages add column max_score integer not null default 7000 check (max_score > 0);

update public.storyline_pages as s
set country_id = v.country_id, chapter_number = v.chapter_number, page_number = v.page_number, max_score = v.max_score
from (values
  ('marina-bay-sands', 'singapore', 1, 1, 18960),
  ('gardens-by-the-bay', 'singapore', 1, 2, 18960),
  ('merlion-park', 'singapore', 1, 3, 18960),
  ('buddha-tooth-temple', 'singapore', 2, 4, 16620),
  ('joo-chiat-shophouses', 'singapore', 2, 5, 16620),
  ('lau-pa-sat-market', 'singapore', 2, 6, 16620),
  ('marina-bay-skyline', 'singapore', 3, 7, 16620),
  ('singapore-river-quay', 'singapore', 3, 8, 19080),
  ('botanic-gardens-heritage', 'singapore', 3, 9, 19560),
  ('wat-arun', 'thailand', 1, 1, 18960),
  ('damnoen-saduak', 'thailand', 1, 2, 18690),
  ('grand-palace', 'thailand', 1, 3, 16620),
  ('wat-pho', 'thailand', 2, 4, 16380),
  ('yaowarat', 'thailand', 2, 5, 16380),
  ('ayutthaya', 'thailand', 2, 6, 16720),
  ('chiang-mai', 'thailand', 3, 7, 16380),
  ('doi-suthep', 'thailand', 3, 8, 18960),
  ('loy-krathong', 'thailand', 3, 9, 16380),
  ('ho-hoan-kiem', 'vietnam', 1, 1, 16620),
  ('ha-long', 'vietnam', 1, 2, 14220),
  ('trang-an', 'vietnam', 1, 3, 14300),
  ('fansipan', 'vietnam', 1, 4, 14430),
  ('mu-cang-chai', 'vietnam', 2, 5, 19080),
  ('nho-que', 'vietnam', 2, 6, 14430),
  ('phong-nha', 'vietnam', 2, 7, 16480),
  ('hue-citadel', 'vietnam', 3, 8, 14220),
  ('ba-na-hills', 'vietnam', 3, 9, 14220),
  ('hoi-an', 'vietnam', 3, 10, 16720),
  ('ghenh-da-dia', 'vietnam', 3, 11, 14430),
  ('ponagar', 'vietnam', 4, 12, 14430),
  ('da-lat', 'vietnam', 4, 13, 16380),
  ('cao-dai', 'vietnam', 4, 14, 14220),
  ('ben-thanh', 'vietnam', 5, 15, 14220),
  ('duc-ba', 'vietnam', 5, 16, 16620),
  ('cai-rang', 'vietnam', 5, 17, 14510),
  ('phu-quoc', 'vietnam', 5, 18, 16620),
  ('ca-mau', 'vietnam', 5, 19, 16720)
) as v (id, country_id, chapter_number, page_number, max_score)
where s.id = v.id;

alter table public.storyline_pages alter column max_score drop default;
alter table public.story_page_records drop constraint if exists story_page_records_high_score_check;
alter table public.story_page_records add constraint story_page_records_high_score_check check (high_score > 0);

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
  v_max integer;
  v_name text;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select max_score into v_max from public.storyline_pages where id = p_page_id;
  if v_max is null then
    raise exception 'Invalid storyline day page' using errcode = '22023';
  end if;
  if p_score is null or p_score <= 0 or p_score > v_max then
    raise exception 'Invalid score' using errcode = '22023';
  end if;
  if p_stars is null or p_stars not between 1 and 3 then
    p_stars := 1;
  end if;
  if p_time is null or p_time < 0 then
    p_time := 0;
  end if;

  -- The in-game name sent by the app; else the one chosen in the profile, never the provider's full name
  v_name := nullif(btrim(p_display_name), '');
  if v_name is null then
    select raw_user_meta_data->>'display_name' into v_name from auth.users where id = v_user;
  end if;
  v_name := coalesce(nullif(substr(btrim(coalesce(v_name, '')), 1, 40), ''), 'Thám tử ẩn danh');

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
