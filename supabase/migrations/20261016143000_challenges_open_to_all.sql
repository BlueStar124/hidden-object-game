-- Friend challenges are open to everyone: a player may hide objects on any page, and a friend may
-- play the hunt without having played that page first (the rule asked for a page history that only
-- the client vouched for). Same signatures: the grants of 20261014082317 stay as they are.
-- page_visits and record_page_visit are kept: older apps still call it, and it costs nothing.

create or replace function public.publish_friend_challenge(
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

create or replace function public.get_friend_challenge(p_code text)
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
  where c.code = upper(btrim(p_code)) and c.revoked_at is null;
  return v_result;
end;
$$;
