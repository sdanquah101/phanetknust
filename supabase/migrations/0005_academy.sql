-- PHANET Academy: courses (video/audio via YouTube links), quizzes, certificates, downloadable resources
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  cover_url text,
  format text not null default 'video' check (format in ('video','audio','mixed')),
  level text not null default 'Foundation',
  instructor text,
  duration_label text,
  pass_mark int not null default 70 check (pass_mark between 1 and 100),
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  sort_order int not null default 0,
  title text not null,
  kind text not null default 'video' check (kind in ('video','audio','reading')),
  youtube_url text,
  audio_url text,
  body text,
  duration_minutes int,
  created_at timestamptz not null default now()
);
create index on public.lessons (course_id, sort_order);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null unique references public.courses(id) on delete cascade,
  title text not null default 'Final quiz',
  instructions text
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  sort_order int not null default 0,
  prompt text not null,
  options jsonb not null,            -- ["A", "B", "C", "D"]
  correct_index int not null,
  explanation text
);

create table public.enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, course_id)
);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  answers jsonb not null,
  score int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts (user_id, quiz_id, created_at desc);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  recipient_name text not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('book','message','audio','document')),
  description text,
  author text,
  cover_url text,
  file_url text,         -- Supabase storage public URL (PDF / audio)
  youtube_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Students see questions without answers
create or replace view public.quiz_questions_public as
  select id, quiz_id, sort_order, prompt, options from public.quiz_questions;
grant select on public.quiz_questions_public to authenticated;

-- Grade server-side so answers never reach the client; issues certificate when passed and all lessons done.
create or replace function public.submit_quiz_attempt(p_quiz uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_course public.courses; q record; v_total int := 0; v_correct int := 0; v_score int; v_passed boolean;
  v_lessons int; v_done int; v_cert text; v_name text; v_attempt uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to take the quiz'; end if;
  select c.* into v_course from public.courses c join public.quizzes z on z.course_id = c.id where z.id = p_quiz;
  if v_course.id is null then raise exception 'Quiz not found'; end if;
  for q in select id, correct_index from public.quiz_questions where quiz_id = p_quiz order by sort_order loop
    v_total := v_total + 1;
    if (p_answers->>(q.id::text))::int = q.correct_index then v_correct := v_correct + 1; end if;
  end loop;
  if v_total = 0 then raise exception 'This quiz has no questions yet'; end if;
  v_score := round(100.0 * v_correct / v_total);
  v_passed := v_score >= v_course.pass_mark;
  insert into public.quiz_attempts (user_id, quiz_id, answers, score, passed) values (auth.uid(), p_quiz, p_answers, v_score, v_passed) returning id into v_attempt;
  insert into public.enrollments (user_id, course_id) values (auth.uid(), v_course.id) on conflict do nothing;

  select count(*) into v_lessons from public.lessons where course_id = v_course.id;
  select count(*) into v_done from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id where l.course_id = v_course.id and lp.user_id = auth.uid();

  if v_passed and v_done >= v_lessons then
    select coalesce(full_name, email) into v_name from public.profiles where id = auth.uid();
    insert into public.certificates (code, user_id, course_id, recipient_name)
      values ('PA-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,8)), auth.uid(), v_course.id, coalesce(v_name, 'PHANET Academy student'))
      on conflict (user_id, course_id) do nothing;
    update public.enrollments set completed_at = coalesce(completed_at, now()) where user_id = auth.uid() and course_id = v_course.id;
    select code into v_cert from public.certificates where user_id = auth.uid() and course_id = v_course.id;
  end if;
  return jsonb_build_object('attempt_id', v_attempt, 'score', v_score, 'passed', v_passed, 'correct', v_correct, 'total', v_total, 'certificate_code', v_cert, 'lessons_done', v_done, 'lessons_total', v_lessons);
end $$;

-- Public certificate verification
create or replace function public.verify_certificate(p_code text)
returns table (code text, recipient_name text, course_title text, issued_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.code, c.recipient_name, k.title, c.issued_at from public.certificates c join public.courses k on k.id = c.course_id where upper(c.code) = upper(trim(p_code));
$$;

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.resources enable row level security;

create policy "courses: public read published" on public.courses for select using (is_published or public.is_admin());
create policy "courses: admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "lessons: read if course visible" on public.lessons for select using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "lessons: admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "quizzes: read if course visible" on public.quizzes for select using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "quizzes: admin write" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());
create policy "questions: admin only" on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "enroll: own" on public.enrollments for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "progress: own" on public.lesson_progress for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "attempts: own read" on public.quiz_attempts for select using (user_id = auth.uid() or public.is_admin());
create policy "certs: own read" on public.certificates for select using (user_id = auth.uid() or public.is_admin());
create policy "resources: public read" on public.resources for select using (is_published or public.is_admin());
create policy "resources: admin write" on public.resources for all using (public.is_admin()) with check (public.is_admin());
