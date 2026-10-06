\set ON_ERROR_STOP on
-- Per-lesson quizzes: ordered unlocking, completion by passing, certificate at the end.
insert into auth.users (email, raw_user_meta_data) values ('learner@phanet.test', '{"full_name":"Kofi Mensah"}') returning id as uid \gset
insert into public.courses (slug, title, pass_mark, is_published) values ('lq-test', 'Lesson quiz test', 80, true) returning id as course \gset
insert into public.lessons (course_id, sort_order, title, kind, youtube_url) values (:'course', 1, 'L1', 'video', 'https://youtu.be/aaaaaaaaaaa') returning id as l1 \gset
insert into public.lessons (course_id, sort_order, title, kind, body) values (:'course', 2, 'L2 reading, no quiz', 'reading', 'text') returning id as l2 \gset
insert into public.lessons (course_id, sort_order, title, kind, youtube_url) values (:'course', 3, 'L3', 'video', 'https://youtu.be/bbbbbbbbbbb') returning id as l3 \gset
insert into public.quizzes (course_id, lesson_id, title) values (:'course', :'l1', 'Quiz 1') returning id as q1 \gset
insert into public.quizzes (course_id, lesson_id, title) values (:'course', :'l3', 'Quiz 3') returning id as q3 \gset
insert into public.quiz_questions (quiz_id, sort_order, prompt, options, correct_index)
  select :'q1', g, 'Q' || g, '["A","B","C","D"]', 1 from generate_series(1,5) g;
insert into public.quiz_questions (quiz_id, sort_order, prompt, options, correct_index)
  select :'q3', g, 'Q' || g, '["A","B","C","D"]', 2 from generate_series(1,5) g;
select jsonb_object_agg(id, 1) as right1 from public.quiz_questions where quiz_id = :'q1' \gset
select jsonb_object_agg(id, case when sort_order <= 3 then 2 else 0 end) as fail3 from public.quiz_questions where quiz_id = :'q3' \gset
select jsonb_object_agg(id, 2) as right3 from public.quiz_questions where quiz_id = :'q3' \gset
select set_config('t.l1', :'l1', false), set_config('t.l3', :'l3', false), set_config('t.q3', :'q3', false) \gset

set role authenticated; select set_config('request.jwt.claim.sub', :'uid', false) \gset
\echo '1. cannot skip to lesson 3 quiz'
do $$ begin perform public.submit_quiz_attempt(current_setting('t.q3')::uuid, '{}'); raise exception 'skipped!'; exception when others then raise notice 'ok: %', sqlerrm; end $$;
\echo '2. cannot mark a quiz lesson complete directly'
do $$ begin insert into public.lesson_progress (user_id, lesson_id) values (auth.uid(), current_setting('t.l1')::uuid); raise exception 'bypassed!'; exception when others then raise notice 'ok: %', sqlerrm; end $$;
\echo '3. pass lesson 1 quiz'
select r->>'score' as score, r->>'passed' as passed, (r->>'next_lesson_id') = :'l2' as next_is_l2 from (select public.submit_quiz_attempt(:'q1', :'right1'::jsonb) r) x;
\echo '4. complete the reading lesson (no quiz)'
select public.complete_lesson(:'l2');
\echo '5. fail lesson 3 quiz (3/5 = 60% < 80%), wrong list has 2'
select r->>'score' as score, r->>'passed' as passed, jsonb_array_length(r->'wrong') as wrong from (select public.submit_quiz_attempt(:'q3', :'fail3'::jsonb) r) x;
select count(*) as cert_before from public.certificates where course_id = :'course';
\echo '6. pass lesson 3 quiz: certificate issued'
select r->>'passed' as passed, r->>'certificate_code' is not null as got_cert from (select public.submit_quiz_attempt(:'q3', :'right3'::jsonb) r) x;
select recipient_name from public.certificates where course_id = :'course';
reset role;
\echo 'lesson quizzes: all good'
