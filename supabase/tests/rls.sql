\set ON_ERROR_STOP on
\echo '--- anon: prayer wall'
set role anon;
select public.submit_prayer_request('Strength for finals', 'Exams start Monday', 'Academics') as code \gset
select :'code' ~ '^PW-[A-Z0-9]{6}$' as code_format_ok;
select public.pray_for(id) as prays from public.prayer_wall_public limit 1;
select count(*) as direct_table_rows_visible_to_anon from public.prayer_requests;
select topic, status from public.lookup_prayer_by_code(:'code');
select public.submit_testimony(:'code', 'God came through, I passed every paper!') is not null as testimony_ok;
select status from public.prayer_wall_public;
select topic from public.testimonies_public;
\echo '--- anon: welfare request'
select id as rice from public.welfare_items where name like 'Rice%' \gset
select id as gari from public.welfare_items where name like 'Gari%' \gset
select public.submit_welfare_request('Ama Owusu','0244000000','Africa Hall B12','', jsonb_build_array(jsonb_build_object('item_id', :'rice', 'qty', 1), jsonb_build_object('item_id', :'gari', 'qty', 2))) as wcode \gset
select qty_available from public.welfare_items where id = :'rice';
select status, items from public.welfare_request_status(:'wcode');
do $$ begin perform public.submit_welfare_request('Kofi','0200000000','', '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.welfare_items where name like 'Rice%'), 'qty', 5))); raise exception 'limit not enforced'; exception when others then raise notice 'expected: %', sqlerrm; end $$;
\echo '--- anon: shop order'
select id as tee from public.products where slug='theme-tee' \gset
select * from public.create_order('Ama Owusu','ama@example.com','0244000000','', jsonb_build_array(jsonb_build_object('product_id', :'tee', 'qty', 2, 'option', 'M'))) \gset
select :subtotal = 160 as subtotal_ok, stock from public.products where id = :'tee';
select status from public.order_status(:'order_no', 'ama@example.com');
reset role;

\echo '--- users & roles'
insert into auth.users (email, raw_user_meta_data) values ('admin@phanet.test', '{"full_name":"Efua Asante"}') returning id as admin_id \gset
insert into auth.users (email, raw_user_meta_data) values ('leader@phanet.test', '{"full_name":"Yaw Owusu"}') returning id as leader_id \gset
insert into auth.users (email, raw_user_meta_data) values ('student@phanet.test', '{"full_name":"Ama Owusu"}') returning id as student_id \gset
select count(*) as profiles_created from public.profiles;
select public.grant_role_by_email('admin@phanet.test','admin');
select public.grant_role_by_email('admin@phanet.test','finance_head');
select public.grant_role_by_email('leader@phanet.test','leader');

\echo '--- admin/database: members'
set role authenticated; select set_config('request.jwt.claim.sub', :'admin_id', false);
insert into public.members (first_name,last_name,phone,hall,programme,year_of_study,user_id) values ('Yaw','Owusu','0240000001','Unity','Pharmacy','300', :'leader_id') returning id as leader_member \gset
insert into public.members (first_name,last_name,phone,hall,programme,year_of_study,leader_id) values ('Ama','Owusu','0240000002','Africa','Nursing','200', :'leader_member') returning id as sheep1 \gset
insert into public.members (first_name,last_name,phone,hall,programme,year_of_study) values ('Kojo','Antwi','0240000003','Katanga','Civil Eng','400') returning id as other \gset
select member_code ~ '^PHA-\d{4}-\d{4}$' as code_ok from public.members where id = :'sheep1';
select member_id = :'leader_member' as profile_linked from public.profiles where id = :'leader_id';
select full_name, phone from public.search_members('owu');
insert into public.events (title, starts_at) values ('Midweek Altar', now()) returning id as ev \gset

\echo '--- finance ladder'
insert into public.transactions (kind,category,amount,channel,status,payee_name,description) values ('expense','Sound hire',1500,'cash','pending','DJ Kay','Midweek Altar') returning id as e1, approver_role \gset
insert into public.transactions (kind,category,amount,channel,status,payee_name) values ('expense','Retreat venue',3000,'bank','pending','Hotel') returning id as e2, approver_role \gset
insert into public.transactions (kind,category,amount,channel,status,payee_name) values ('expense','Missions bus',6000,'bank','pending','STC') returning id as e3, approver_role \gset
select approver_role, amount from public.transactions where kind='expense' order by amount;
reset role;
insert into auth.users (email) values ('fh@phanet.test') returning id as fh_id \gset
select public.grant_role_by_email('fh@phanet.test','finance_head');
select set_config('t.e1', :'e1', false), set_config('t.e2', :'e2', false), set_config('t.e3', :'e3', false);
set role authenticated; select set_config('request.jwt.claim.sub', :'leader_id', false);
do $$ begin perform public.decide_expense(current_setting('t.e1')::uuid, 'approved'); raise exception 'leader approved an expense!'; exception when others then raise notice 'expected: %', sqlerrm; end $$;
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'fh_id', false);
do $$ begin perform public.decide_expense(current_setting('t.e2')::uuid, 'approved'); raise exception 'finance head approved a GH₵3000 expense!'; exception when others then raise notice 'expected: %', sqlerrm; end $$;
do $$ begin perform public.decide_expense(current_setting('t.e3')::uuid, 'approved'); raise exception 'finance head approved a GH₵6000 expense!'; exception when others then raise notice 'expected: %', sqlerrm; end $$;
select status, approver_role from public.decide_expense(:'e1','approved','ok');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'admin_id', false);
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'admin_id', false);
select status from public.mark_expense_paid(:'e1','momo_mtn');
select count(*) as pending_left from public.transactions where status='pending';

\echo '--- leader portal'
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'leader_id', false);
select count(*) as my_sheep_visible from public.members where leader_id = public.my_member_id();
select count(*) as all_members_visible_to_leader from public.members;
insert into public.followups (sheep_id, leader_id, kind, summary) values (:'sheep1', :'leader_member', 'call', 'Checked in before exams') returning id as fu \gset
do $$ begin insert into public.followups (sheep_id, leader_id, kind, summary) values ((select id from public.members where first_name='Kojo'), public.my_member_id(), 'call', 'x'); raise exception 'followup on non-sheep allowed!'; exception when others then raise notice 'expected: %', sqlerrm; end $$;
insert into public.followup_shares (followup_id, shared_with, note) values (:'fu', :'other', 'FYI');
select count(*) as shares_visible from public.followup_shares;
insert into public.attendance (event_id, member_id, method, marked_by) values (:'ev', :'sheep1', 'leader', auth.uid());
insert into public.sheep_reports (leader_id, sheep_id, week_start, attended, contacted) values (:'leader_member', :'sheep1', date_trunc('week', now())::date, true, true);
select id, full_name from public.list_leaders();

\echo '--- academy'
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'student_id', false);
select id as course from public.courses where slug='foundations-of-prayer' \gset
select count(*) as questions_without_answers from public.quiz_questions_public;
select count(*) as raw_questions_visible_to_student from public.quiz_questions;
select id as quiz from public.quizzes where course_id = :'course' \gset
insert into public.enrollments (user_id, course_id) values (auth.uid(), :'course');
insert into public.lesson_progress (user_id, lesson_id) select auth.uid(), id from public.lessons where course_id = :'course';
reset role;
select jsonb_object_agg(id::text, correct_index) as answers from public.quiz_questions where quiz_id = :'quiz' \gset
set role authenticated; select set_config('request.jwt.claim.sub', :'student_id', false);
select public.submit_quiz_attempt(:'quiz', :'answers'::jsonb) as result \gset
select (:'result'::jsonb)->>'score' as score, (:'result'::jsonb)->>'passed' as passed, (:'result'::jsonb)->>'certificate_code' as cert \gset
select :'score' as score, :'passed' as passed, :'cert' as cert;
select recipient_name, course_title from public.verify_certificate(:'cert');
reset role;
\echo '--- all good'
