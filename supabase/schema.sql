-- Run this once in the Supabase SQL editor.
-- Then, in Authentication settings, turn off public sign-ups and create one owner user.

create table if not exists public.books (
  id uuid primary key,
  ol_key text not null default '',
  title text not null,
  author text not null default '',
  cover_url text not null default '',
  genre text not null default '',
  blurb text not null default '',
  status text not null check (status in ('read', 'tbr')),
  rating integer check (rating is null or (rating between 1 and 5)),
  review text not null default '',
  note text not null default '',
  details_fetched boolean not null default false,
  genre_ready boolean not null default false,
  about_checked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.books to anon, authenticated;

drop policy if exists "anyone can read books" on public.books;
drop policy if exists "visitors add tbr books" on public.books;
drop policy if exists "owner adds books" on public.books;
drop policy if exists "visitors update tbr books" on public.books;
drop policy if exists "owner updates books" on public.books;
drop policy if exists "visitors delete tbr books" on public.books;
drop policy if exists "owner deletes books" on public.books;

create policy "anyone can read books"
  on public.books for select
  to anon, authenticated
  using (true);

create policy "visitors add tbr books"
  on public.books for insert
  to anon
  with check (
    status = 'tbr'
    and rating is null
    and review = ''
  );

create policy "owner adds books"
  on public.books for insert
  to authenticated
  with check (true);

create policy "visitors update tbr books"
  on public.books for update
  to anon
  using (status = 'tbr')
  with check (
    status = 'tbr'
    and rating is null
    and review = ''
  );

create policy "owner updates books"
  on public.books for update
  to authenticated
  using (true)
  with check (true);

create policy "visitors delete tbr books"
  on public.books for delete
  to anon
  using (status = 'tbr');

create policy "owner deletes books"
  on public.books for delete
  to authenticated
  using (true);

alter table public.books drop constraint if exists books_text_limits;
alter table public.books add constraint books_text_limits check (
  char_length(title) between 1 and 400
  and char_length(author) <= 400
  and char_length(genre) <= 500
  and char_length(blurb) <= 20000
  and char_length(review) <= 8000
  and char_length(note) <= 4000
  and char_length(ol_key) <= 40
  and (ol_key = '' or ol_key ~ '^/works/OL[0-9]+W$')
  and (cover_url = '' or cover_url ~ '^https://covers\.openlibrary\.org/b/id/[0-9]+-L\.jpg$')
);

do $$
begin
  alter publication supabase_realtime add table public.books;
exception
  when duplicate_object then null;
end $$;
