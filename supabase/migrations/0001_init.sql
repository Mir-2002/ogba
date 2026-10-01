-- Safe to re-run: tables/buckets use if-not-exists and policies are dropped
-- before being recreated.

-- Save states table: one row per (user, rom, slot). The blob itself lives in
-- Storage; this table only tracks metadata + where to find it.
create table if not exists public.saves (
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rom_id       text not null,
  slot_number  smallint not null check (slot_number between 1 and 3),
  rom_title    text not null,
  size_bytes   int,
  storage_path text not null,
  saved_at     timestamptz not null default now(),
  primary key (user_id, rom_id, slot_number)
);

alter table public.saves enable row level security;

drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own"
  on public.saves for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own"
  on public.saves for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own"
  on public.saves for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_delete_own" on public.saves;
create policy "saves_delete_own"
  on public.saves for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Private bucket for the compressed save-state blobs. Objects are keyed as
-- <user_id>/<rom_id>/<slot>.state.gz so the folder-name policy below can
-- scope access to the owning user.
insert into storage.buckets (id, name, public)
values ('save-states', 'save-states', false)
on conflict do nothing;

drop policy if exists "save_states_select_own" on storage.objects;
create policy "save_states_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'save-states'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "save_states_insert_own" on storage.objects;
create policy "save_states_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'save-states'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "save_states_update_own" on storage.objects;
create policy "save_states_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'save-states'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'save-states'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "save_states_delete_own" on storage.objects;
create policy "save_states_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'save-states'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
