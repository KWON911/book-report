create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_id uuid not null references classes(id),
  number int not null,
  unique (name, class_id, number)
);

create table book_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  title text not null,
  author text,
  summary text,
  impression text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  teacher_comment text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
