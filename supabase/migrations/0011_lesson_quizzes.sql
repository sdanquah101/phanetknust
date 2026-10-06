-- PHANET Academy: a quiz after every lesson.
-- * quizzes.lesson_id: a quiz can belong to one lesson (lesson quiz) or to none (optional final quiz, one per course).
-- * Lessons unlock in order. A lesson with a quiz is completed only by passing its quiz; the server enforces this.
-- * A certificate is issued when every lesson is complete and the final quiz (if the course has one) is passed.

alter table public.quizzes add column if not exists lesson_id uuid references public.lessons(id) on delete cascade;
alter table public.quizzes drop constraint if exists quizzes_course_id_key;
create unique index if not exists quizzes_one_per_lesson on public.quizzes (lesson_id) where lesson_id is not null;
create unique index if not exists quizzes_one_final_per_course on public.quizzes (course_id) where lesson_id is null;

-- A lesson "has a quiz" once its quiz has at least one question (an empty quiz never blocks students).
create or replace function public.lesson_has_quiz(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.quizzes q join public.quiz_questions qq on qq.quiz_id = q.id where q.lesson_id = p_lesson);
$$;

-- Students may mark a lesson complete themselves only when it has no quiz; quiz lessons are completed by submit_quiz_attempt.
drop policy if exists "progress: own" on public.lesson_progress;
drop policy if exists "progress: own read" on public.lesson_progress;
drop policy if exists "progress: own insert (no quiz)" on public.lesson_progress;
drop policy if exists "progress: admin manage" on public.lesson_progress;
drop policy if exists "progress: admin delete" on public.lesson_progress;
create policy "progress: own read" on public.lesson_progress for select using (user_id = auth.uid() or public.is_admin());
create policy "progress: own insert (no quiz)" on public.lesson_progress for insert with check (
  public.is_admin() or (user_id = auth.uid() and not public.lesson_has_quiz(lesson_progress.lesson_id))
);
create policy "progress: admin manage" on public.lesson_progress for update using (public.is_admin()) with check (public.is_admin());
create policy "progress: admin delete" on public.lesson_progress for delete using (public.is_admin());

-- Has the current user finished every lesson before this one?
create or replace function public.lesson_unlocked(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.lessons prev
    join public.lessons cur on cur.id = p_lesson and prev.course_id = cur.course_id
    where (prev.sort_order, prev.created_at, prev.id) < (cur.sort_order, cur.created_at, cur.id)
      and not exists (select 1 from public.lesson_progress lp where lp.lesson_id = prev.id and lp.user_id = auth.uid())
  );
$$;

-- Issue the certificate if the user has met every requirement. Returns the code, or null.
create or replace function public.maybe_issue_certificate(p_course uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_lessons int; v_done int; v_final uuid; v_name text; v_code text;
begin
  select count(*) into v_lessons from public.lessons where course_id = p_course;
  select count(*) into v_done from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
    where l.course_id = p_course and lp.user_id = auth.uid();
  if v_lessons = 0 or v_done < v_lessons then return null; end if;
  select id into v_final from public.quizzes where course_id = p_course and lesson_id is null;
  if v_final is not null and not exists (select 1 from public.quiz_attempts where quiz_id = v_final and user_id = auth.uid() and passed) then
    return null;
  end if;
  select coalesce(nullif(trim(full_name), ''), email) into v_name from public.profiles where id = auth.uid();
  insert into public.certificates (code, user_id, course_id, recipient_name)
    values ('PA-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)), auth.uid(), p_course, coalesce(v_name, 'PHANET Academy student'))
    on conflict (user_id, course_id) do nothing;
  update public.enrollments set completed_at = coalesce(completed_at, now()) where user_id = auth.uid() and course_id = p_course;
  select code into v_code from public.certificates where user_id = auth.uid() and course_id = p_course;
  return v_code;
end $$;

-- Grade a quiz (lesson or final). Answers never leave the server; the result lists which questions were wrong.
create or replace function public.submit_quiz_attempt(p_quiz uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_quiz public.quizzes; v_course public.courses; q record;
  v_total int := 0; v_correct int := 0; v_score int; v_passed boolean; v_wrong uuid[] := '{}';
  v_attempt uuid; v_cert text; v_next uuid; v_lessons int; v_done int;
begin
  if auth.uid() is null then raise exception 'Sign in to take the quiz'; end if;
  select * into v_quiz from public.quizzes where id = p_quiz;
  if v_quiz.id is null then raise exception 'Quiz not found'; end if;
  select * into v_course from public.courses where id = v_quiz.course_id;
  if not (v_course.is_published or public.is_admin()) then raise exception 'Quiz not found'; end if;

  if v_quiz.lesson_id is not null then
    if not public.lesson_unlocked(v_quiz.lesson_id) then raise exception 'Finish the earlier lessons first'; end if;
  else
    select count(*) into v_lessons from public.lessons where course_id = v_course.id;
    select count(*) into v_done from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
      where l.course_id = v_course.id and lp.user_id = auth.uid();
    if v_done < v_lessons then raise exception 'Finish every lesson before the final quiz'; end if;
  end if;

  for q in select id, correct_index from public.quiz_questions where quiz_id = p_quiz order by sort_order loop
    v_total := v_total + 1;
    if (p_answers->>(q.id::text))::int = q.correct_index then v_correct := v_correct + 1;
    else v_wrong := v_wrong || q.id; end if;
  end loop;
  if v_total = 0 then raise exception 'This quiz has no questions yet'; end if;

  v_score := round(100.0 * v_correct / v_total);
  v_passed := v_score >= v_course.pass_mark;
  insert into public.quiz_attempts (user_id, quiz_id, answers, score, passed)
    values (auth.uid(), p_quiz, p_answers, v_score, v_passed) returning id into v_attempt;
  insert into public.enrollments (user_id, course_id) values (auth.uid(), v_course.id) on conflict do nothing;

  if v_passed and v_quiz.lesson_id is not null then
    insert into public.lesson_progress (user_id, lesson_id) values (auth.uid(), v_quiz.lesson_id) on conflict do nothing;
    select l.id into v_next from public.lessons l join public.lessons cur on cur.id = v_quiz.lesson_id
      where l.course_id = cur.course_id and (l.sort_order, l.created_at, l.id) > (cur.sort_order, cur.created_at, cur.id)
      order by l.sort_order, l.created_at, l.id limit 1;
  end if;
  if v_passed then v_cert := public.maybe_issue_certificate(v_course.id); end if;

  return jsonb_build_object(
    'attempt_id', v_attempt, 'score', v_score, 'passed', v_passed, 'correct', v_correct, 'total', v_total,
    'wrong', to_jsonb(v_wrong), 'lesson_id', v_quiz.lesson_id, 'next_lesson_id', v_next, 'certificate_code', v_cert
  );
end $$;

-- Lessons without a quiz still issue the certificate when the last one is marked complete.
create or replace function public.complete_lesson(p_lesson uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_course uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if public.lesson_has_quiz(p_lesson) then raise exception 'Pass this lesson''s quiz to complete it'; end if;
  if not public.lesson_unlocked(p_lesson) then raise exception 'Finish the earlier lessons first'; end if;
  select course_id into v_course from public.lessons where id = p_lesson;
  insert into public.lesson_progress (user_id, lesson_id) values (auth.uid(), p_lesson) on conflict do nothing;
  insert into public.enrollments (user_id, course_id) values (auth.uid(), v_course) on conflict do nothing;
  return jsonb_build_object('certificate_code', public.maybe_issue_certificate(v_course));
end $$;
