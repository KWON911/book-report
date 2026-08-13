-- Table names are prefixed with book_report_ because this app shares a
-- Supabase project with other apps that already have tables named
-- `students`, `classes`, etc.

create table book_report_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table book_report_students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_id uuid not null references book_report_classes(id),
  number int not null,
  unique (name, class_id, number)
);

create table book_report_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references book_report_students(id),
  title text not null,
  author text,
  summary text,
  impression text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  teacher_comment text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

-- Row Level Security
--
-- IMPORTANT TRADEOFF: this app's Next.js API routes talk to Supabase using only
-- the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) — there is no service-role
-- key set up for server-only access. That means all authorization (student
-- identification, teacher password/session checks, the restriction that only
-- the teacher-review route may set status to approved/rejected, etc.) happens
-- in the Next.js route handlers, not in the database. The anon key is exposed
-- to the browser, so anyone with it can call the Supabase REST API directly.
--
-- The policies below are intentionally permissive for the anon role (allowing
-- the select/insert/update operations the app needs) so that RLS is at least
-- enabled instead of leaving tables fully open with the default "no RLS" state.
-- This does NOT fully close the hole: a motivated user could still bypass the
-- Next.js route logic (e.g. approve their own report) by calling Supabase
-- directly. For a small classroom-scale deployment tracked by name/class/number
-- (not real auth) this is treated as an acceptable tradeoff. A production
-- deployment beyond this scale should introduce a service-role key used only
-- server-side, with RLS policies that deny the anon role entirely and enforce
-- authorization (e.g. status transitions) at the database layer.

alter table book_report_classes enable row level security;
alter table book_report_students enable row level security;
alter table book_report_entries enable row level security;

create policy "anon can select book_report_classes" on book_report_classes
  for select to anon using (true);
create policy "anon can insert book_report_classes" on book_report_classes
  for insert to anon with check (true);

create policy "anon can select book_report_students" on book_report_students
  for select to anon using (true);
create policy "anon can insert book_report_students" on book_report_students
  for insert to anon with check (true);
create policy "anon can delete book_report_students" on book_report_students
  for delete to anon using (true);

create policy "anon can select book_report_entries" on book_report_entries
  for select to anon using (true);
create policy "anon can insert book_report_entries" on book_report_entries
  for insert to anon with check (true);
create policy "anon can update book_report_entries" on book_report_entries
  for update to anon using (true) with check (true);
create policy "anon can delete book_report_entries" on book_report_entries
  for delete to anon using (true);
