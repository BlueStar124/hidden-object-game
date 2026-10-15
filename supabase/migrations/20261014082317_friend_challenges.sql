-- Published friend hunts use bundled paintings and sprites; no artwork is stored here.
create table public.challenge_pages (
  id text primary key,
  content_version integer not null default 1 check (content_version > 0)
);

create table public.challenge_sprites (
  id text primary key
);

insert into public.challenge_pages (id) values
  ('ayutthaya'),
  ('ba-na-hills'),
  ('ben-thanh'),
  ('ben-thanh-night'),
  ('botanic-gardens-heritage'),
  ('buddha-tooth-temple'),
  ('cai-rang'),
  ('ca-mau'),
  ('cao-dai'),
  ('chiang-mai'),
  ('da-lat'),
  ('da-lat-night'),
  ('damnoen-saduak'),
  ('doi-suthep'),
  ('doi-suthep-night'),
  ('duc-ba'),
  ('fansipan'),
  ('gardens-by-the-bay'),
  ('gardens-by-the-bay-night'),
  ('ghenh-da-dia'),
  ('grand-palace'),
  ('ha-long'),
  ('ha-long-night'),
  ('ho-hoan-kiem'),
  ('hoi-an'),
  ('hoi-an-night'),
  ('hue-citadel'),
  ('joo-chiat-shophouses'),
  ('lau-pa-sat-market'),
  ('lau-pa-sat-market-night'),
  ('loy-krathong'),
  ('marina-bay-sands'),
  ('marina-bay-skyline'),
  ('merlion-park'),
  ('mu-cang-chai'),
  ('nho-que'),
  ('nho-que-night'),
  ('phong-nha'),
  ('phu-quoc'),
  ('ponagar'),
  ('singapore-river-quay'),
  ('singapore-river-quay-night'),
  ('trang-an'),
  ('wat-arun'),
  ('wat-arun-night'),
  ('wat-pho'),
  ('yaowarat'),
  ('yaowarat-night');

insert into public.challenge_sprites (id) values
  ('cat'),
  ('dog'),
  ('owl'),
  ('dove'),
  ('butterfly'),
  ('squirrel'),
  ('turtle'),
  ('key'),
  ('compass'),
  ('letter'),
  ('pocket-watch'),
  ('quill'),
  ('teacup'),
  ('coin-pouch'),
  ('spyglass'),
  ('vase'),
  ('scroll'),
  ('magnifying-glass'),
  ('gecko'),
  ('chameleon'),
  ('frog'),
  ('snail'),
  ('ladybug'),
  ('mouse'),
  ('koi'),
  ('crab'),
  ('otter'),
  ('kingfisher'),
  ('bat'),
  ('monkey'),
  ('moth'),
  ('dragonfly'),
  ('spider'),
  ('paper-crane'),
  ('paper-boat'),
  ('heron'),
  ('hornbill'),
  ('pangolin'),
  ('monitor-lizard'),
  ('jellyfish'),
  ('seahorse'),
  ('mantis'),
  ('firefly'),
  ('civet'),
  ('sunbird'),
  ('slow-loris'),
  ('colugo'),
  ('stick-insect'),
  ('saola'),
  ('water-buffalo'),
  ('golden-turtle'),
  ('dong-tao-chicken'),
  ('hmong-dog'),
  ('langur'),
  ('highland-elephant'),
  ('mudskipper'),
  ('ca-mau-crab'),
  ('phu-quoc-dog'),
  ('dugong'),
  ('durian'),
  ('fortune-cat'),
  ('red-envelope'),
  ('tiffin'),
  ('satay'),
  ('kite'),
  ('vintage-camera'),
  ('hourglass'),
  ('deerstalker'),
  ('conical-hat'),
  ('lantern'),
  ('cyclo'),
  ('water-puppet'),
  ('khen'),
  ('cham-statue'),
  ('gong'),
  ('dragon-boat'),
  ('dan-bau'),
  ('banh-mi'),
  ('coffee-phin'),
  ('sampan'),
  ('dong-son-drum'),
  ('pho-bowl'),
  ('brocade'),
  ('basket-boat'),
  ('ao-dai'),
  ('t-rung'),
  ('nghe'),
  ('red-crowned-crane'),
  ('dong-ho-pig'),
  ('bamboo-dragonfly'),
  ('black-carp'),
  ('giant-water-bug'),
  ('green-peafowl'),
  ('pygmy-loris'),
  ('gray-shanked-douc'),
  ('binturong'),
  ('indochinese-tiger'),
  ('white-cheeked-gibbon'),
  ('flying-squirrel'),
  ('treeshrew'),
  ('water-rail'),
  ('tiger-prawn'),
  ('climbing-perch'),
  ('giant-featherback'),
  ('mangrove-clam'),
  ('pearl-oyster'),
  ('horned-owl'),
  ('centipede'),
  ('silver-pheasant'),
  ('bamboo-rat'),
  ('river-snail'),
  ('crane-statue'),
  ('ly-dragon'),
  ('hoan-kiem-sword'),
  ('star-lantern'),
  ('bamboo-flute'),
  ('to-he'),
  ('non-quai-thao'),
  ('lotus-flower'),
  ('banh-chung'),
  ('bat-trang-pottery'),
  ('bamboo-basket'),
  ('h-mong-flute'),
  ('terraced-sheaf'),
  ('champa-relief'),
  ('hue-kite'),
  ('incense-burner'),
  ('palm-leaf-fan'),
  ('cham-lamp'),
  ('royal-umbrella'),
  ('sea-shell-curtain'),
  ('highland-crossbow'),
  ('southern-scarf'),
  ('dan-kim'),
  ('clay-piggy'),
  ('coconut-candy'),
  ('betta'),
  ('crocodile'),
  ('giant-catfish'),
  ('river-prawn'),
  ('stingray'),
  ('goldfish'),
  ('flying-snake'),
  ('flying-lizard'),
  ('scorpion'),
  ('elephant'),
  ('gibbon'),
  ('sun-bear'),
  ('porcupine'),
  ('siamese-cat'),
  ('duck'),
  ('rooster'),
  ('peacock'),
  ('myna'),
  ('swallow'),
  ('rhino-beetle'),
  ('cicada'),
  ('bee'),
  ('lantern-bug'),
  ('parakeet'),
  ('temple-bell'),
  ('naga-head'),
  ('khon-mask'),
  ('spirit-house'),
  ('lotus-bud'),
  ('longtail-boat'),
  ('royal-barge'),
  ('krathong'),
  ('sky-lantern'),
  ('clay-lamp'),
  ('jasmine-garland'),
  ('paper-umbrella'),
  ('long-drum'),
  ('tuk-tuk'),
  ('boxing-gloves'),
  ('mango-sticky-rice'),
  ('coconut'),
  ('thai-tea'),
  ('mangosteen'),
  ('noodle-bowl'),
  ('mortar-pestle'),
  ('abacus'),
  ('palm-leaf-book'),
  ('kratip'),
  ('treasure-map');

create table public.page_visits (
  user_id uuid not null references auth.users (id) on delete cascade,
  page_id text not null references public.challenge_pages (id),
  first_seen_at timestamptz not null default now(),
  primary key (user_id, page_id)
);

create table public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  code text not null unique check (code ~ '^H-[0-9A-F]{12}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  page_id text not null references public.challenge_pages (id),
  content_version integer not null check (content_version > 0),
  title text not null check (char_length(title) between 1 and 80),
  objects jsonb not null check (jsonb_typeof(objects) = 'array' and pg_column_size(objects) <= 8192),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (owner_id, request_id)
);

create index friend_challenges_owner_created_idx
  on public.friend_challenges (owner_id, created_at desc);

alter table public.challenge_pages enable row level security;
alter table public.challenge_sprites enable row level security;
alter table public.page_visits enable row level security;
alter table public.friend_challenges enable row level security;

revoke all on public.challenge_pages from anon, authenticated;
revoke all on public.challenge_sprites from anon, authenticated;
revoke all on public.page_visits from anon, authenticated;
revoke all on public.friend_challenges from anon, authenticated;

grant select on public.page_visits to authenticated;
grant select on public.friend_challenges to authenticated;

create policy "Players read their own visits" on public.page_visits
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Authors read their own challenges" on public.friend_challenges
  for select to authenticated using (owner_id = (select auth.uid()));

create function public.record_page_visit(p_page_id text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not exists (select 1 from public.challenge_pages where id = p_page_id) then
    return false;
  end if;
  insert into public.page_visits (user_id, page_id)
    values (v_user, p_page_id) on conflict do nothing;
  return true;
end;
$$;

create function public.publish_friend_challenge(
  p_request_id uuid,
  p_page_id text,
  p_content_version integer,
  p_title text,
  p_objects jsonb
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_version integer;
  v_code text;
  v_item jsonb;
  v_ids text[] := array[]::text[];
  v_attempt integer;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_request_id is null then raise exception 'Request ID required' using errcode = '22023'; end if;

  -- Serializing each author's publishes makes the daily cap and retries deterministic.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 61));
  select code into v_code from public.friend_challenges
    where owner_id = v_user and request_id = p_request_id;
  if found then return v_code; end if;

  select content_version into v_version from public.challenge_pages where id = p_page_id;
  if v_version is null or v_version <> p_content_version then
    raise exception 'Unknown page or incompatible content version' using errcode = '22023';
  end if;
  if not exists (select 1 from public.page_visits where user_id = v_user and page_id = p_page_id) then
    raise exception 'Page must be played first' using errcode = '42501';
  end if;
  if (select count(*) from public.friend_challenges
      where owner_id = v_user and created_at >= now() - interval '24 hours') >= 5 then
    raise exception 'Challenge limit reached' using errcode = '22023';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 80 then
    raise exception 'Invalid title' using errcode = '22023';
  end if;
  if jsonb_typeof(p_objects) is distinct from 'array' then
    raise exception 'Objects must be an array' using errcode = '22023';
  end if;
  if pg_catalog.pg_column_size(p_objects) > 8192 or jsonb_array_length(p_objects) not between 1 and 20 then
    raise exception 'Invalid object count or payload size' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_objects) loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or v_item - array['id','spriteType','name','clue','x','y','radius','scale','rotation','flip','camo'] <> '{}'::jsonb then
      raise exception 'Invalid object fields' using errcode = '22023';
    end if;
    if coalesce(v_item->>'id', '') !~ '^[a-z0-9-]{1,40}$'
      or v_item->>'id' = any(v_ids) then
      raise exception 'Invalid or repeated object ID' using errcode = '22023';
    end if;
    v_ids := array_append(v_ids, v_item->>'id');
    if jsonb_typeof(v_item->'spriteType') is distinct from 'string'
      or not exists (select 1 from public.challenge_sprites where id = v_item->>'spriteType') then
      raise exception 'Unknown sprite' using errcode = '22023';
    end if;
    if jsonb_typeof(v_item->'name') is distinct from 'string'
      or char_length(btrim(v_item->>'name')) not between 1 and 80
      or jsonb_typeof(v_item->'clue') is distinct from 'string'
      or char_length(btrim(v_item->>'clue')) not between 1 and 160 then
      raise exception 'Invalid name or clue' using errcode = '22023';
    end if;
    if jsonb_typeof(v_item->'x') is distinct from 'number'
      or jsonb_typeof(v_item->'y') is distinct from 'number'
      or jsonb_typeof(v_item->'radius') is distinct from 'number' then
      raise exception 'Invalid object coordinates' using errcode = '22023';
    end if;
    if (v_item->>'x')::numeric not between 0.10 and 0.90
      or (v_item->>'y')::numeric not between 0.27 and 0.74
      or (v_item->>'radius')::numeric not between 0.01 and 0.06 then
      raise exception 'Object outside the playable painting' using errcode = '22023';
    end if;
    if v_item ? 'scale' and (jsonb_typeof(v_item->'scale') is distinct from 'number'
      or (v_item->>'scale')::numeric not between 0.5 and 2) then
      raise exception 'Invalid object scale' using errcode = '22023';
    end if;
    if v_item ? 'rotation' and (jsonb_typeof(v_item->'rotation') is distinct from 'number'
      or (v_item->>'rotation')::numeric not between -180 and 180) then
      raise exception 'Invalid object rotation' using errcode = '22023';
    end if;
    if v_item ? 'flip' and jsonb_typeof(v_item->'flip') is distinct from 'boolean' then
      raise exception 'Invalid object flip' using errcode = '22023';
    end if;
    if v_item ? 'camo' and (jsonb_typeof(v_item->'camo') is distinct from 'string'
      or v_item->>'camo' not in ('ink', 'chameleon', 'invisible')) then
      raise exception 'Invalid object camouflage' using errcode = '22023';
    end if;
  end loop;

  for v_attempt in 1..3 loop
    begin
      v_code := 'H-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
      insert into public.friend_challenges
        (request_id, code, owner_id, page_id, content_version, title, objects)
        values (p_request_id, v_code, v_user, p_page_id, v_version, btrim(p_title), p_objects);
      return v_code;
    exception when unique_violation then
      -- A code collision is exceptionally rare; retry without changing the request ID.
    end;
  end loop;
  raise exception 'Could not allocate a challenge code' using errcode = '23505';
end;
$$;

create function public.get_friend_challenge(p_code text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select jsonb_build_object(
    'id', c.id, 'code', c.code, 'pageId', c.page_id,
    'contentVersion', c.content_version, 'title', c.title,
    'objects', c.objects, 'createdAt', c.created_at
  ) into v_result
  from public.friend_challenges c
  where c.code = upper(btrim(p_code)) and c.revoked_at is null
    and exists (select 1 from public.page_visits v
      where v.user_id = v_user and v.page_id = c.page_id);
  return v_result;
end;
$$;

create function public.revoke_friend_challenge(p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  update public.friend_challenges
    set revoked_at = coalesce(revoked_at, now())
    where owner_id = v_user and code = upper(btrim(p_code));
  return found;
end;
$$;

revoke execute on function public.record_page_visit(text) from public, anon;
revoke execute on function public.publish_friend_challenge(uuid,text,integer,text,jsonb) from public, anon;
revoke execute on function public.get_friend_challenge(text) from public, anon;
revoke execute on function public.revoke_friend_challenge(text) from public, anon;

grant execute on function public.record_page_visit(text) to authenticated;
grant execute on function public.publish_friend_challenge(uuid,text,integer,text,jsonb) to authenticated;
grant execute on function public.get_friend_challenge(text) to authenticated;
grant execute on function public.revoke_friend_challenge(text) to authenticated;

-- Cloud copies keep a signed-in player's local-first save available across devices.
create table public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save_data jsonb not null check (jsonb_typeof(save_data) = 'object' and pg_column_size(save_data) <= 65536),
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;
revoke all on public.user_progress from anon, authenticated;
grant select, insert, update on public.user_progress to authenticated;

create policy "Players read their own cloud save" on public.user_progress
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Players create their own cloud save" on public.user_progress
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Players update their own cloud save" on public.user_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
