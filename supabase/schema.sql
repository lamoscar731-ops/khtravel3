-- Run once in the Supabase SQL Editor. The browser uses only a publishable key;
-- all row access is checked by RLS and the authenticated user's JWT.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.shared_trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  trip_data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_trip_members (
  trip_id uuid not null references public.shared_trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists public.shared_trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.shared_trips(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz
);

alter table public.shared_trips enable row level security;
alter table public.shared_trip_members enable row level security;
alter table public.shared_trip_invites enable row level security;

create or replace function public.can_access_shared_trip(p_trip_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.shared_trips t where t.id = p_trip_id and t.owner_id = auth.uid()
    union all
    select 1 from public.shared_trip_members m where m.trip_id = p_trip_id and m.user_id = auth.uid()
  );
$$;

drop policy if exists shared_trips_read on public.shared_trips;
create policy shared_trips_read on public.shared_trips for select to authenticated
  using (public.can_access_shared_trip(id));
drop policy if exists shared_trips_create on public.shared_trips;
create policy shared_trips_create on public.shared_trips for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists shared_trips_update on public.shared_trips;
create policy shared_trips_update on public.shared_trips for update to authenticated
  using (public.can_access_shared_trip(id)) with check (public.can_access_shared_trip(id));

drop policy if exists shared_trip_members_read on public.shared_trip_members;
create policy shared_trip_members_read on public.shared_trip_members for select to authenticated
  using (user_id = auth.uid() or public.can_access_shared_trip(trip_id));
revoke all on public.shared_trip_members from anon, authenticated;
grant select on public.shared_trip_members to authenticated;
revoke all on public.shared_trip_invites from anon, authenticated;

create or replace function public.create_shared_trip_invite(p_trip_id uuid)
returns text language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_token text; v_owner uuid;
begin
  select owner_id into v_owner from public.shared_trips where id = p_trip_id;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'Only the trip owner can create invites'; end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.shared_trip_invites(trip_id, token_hash, created_by, expires_at)
    values (p_trip_id, encode(digest(v_token, 'sha256'), 'hex'), auth.uid(), now() + interval '7 days');
  return v_token;
end;
$$;

create or replace function public.accept_shared_trip_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_trip_id uuid; v_accepted_by uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before accepting an invite'; end if;
  select trip_id, accepted_by into v_trip_id, v_accepted_by
  from public.shared_trip_invites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex') and expires_at > now();
  if v_trip_id is null then raise exception 'Invite is invalid or expired'; end if;
  if v_accepted_by is not null and v_accepted_by <> auth.uid() then raise exception 'Invite has already been used'; end if;
  insert into public.shared_trip_members(trip_id, user_id) values(v_trip_id, auth.uid()) on conflict do nothing;
  update public.shared_trip_invites set accepted_by = auth.uid(), accepted_at = now()
    where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  return v_trip_id;
end;
$$;

create or replace function public.update_shared_trip_if_current(p_trip_id uuid, p_trip_data jsonb, p_expected_updated_at timestamptz)
returns table(applied boolean, trip_data jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.can_access_shared_trip(p_trip_id) then raise exception 'You do not have access to this trip'; end if;
  return query update public.shared_trips t
    set trip_data = p_trip_data, updated_at = clock_timestamp()
    where t.id = p_trip_id and t.updated_at = p_expected_updated_at
    returning true, t.trip_data, t.updated_at;
  if not found then
    return query select false, t.trip_data, t.updated_at from public.shared_trips t where t.id = p_trip_id;
  end if;
end;
$$;

grant select, insert, update on public.shared_trips to authenticated;
revoke all on function public.can_access_shared_trip(uuid) from public, anon;
revoke all on function public.create_shared_trip_invite(uuid) from public, anon;
revoke all on function public.accept_shared_trip_invite(text) from public, anon;
revoke all on function public.update_shared_trip_if_current(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.can_access_shared_trip(uuid) to authenticated;
grant execute on function public.create_shared_trip_invite(uuid) to authenticated;
grant execute on function public.accept_shared_trip_invite(text) to authenticated;
grant execute on function public.update_shared_trip_if_current(uuid, jsonb, timestamptz) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.shared_trips;
exception when duplicate_object then null;
end $$;
