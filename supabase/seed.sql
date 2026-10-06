-- Optional starter content. Safe to run once on a fresh project.
insert into public.site_settings (key, value) values
  ('theme', '{"year":"2026/2027","title":"Let No Man Despise Thy Youth","reference":"1 Timothy 4:12","tagline":"Raising impactful intercessors who avail themselves to be conduits of the change they pray for."}'),
  ('verse_of_day', '{"text":"Be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.","reference":"1 Timothy 4:12 · KJV"}'),
  ('live', '{"label":"LIVE · WED 7PM","title":"Midweek Altar","url":"https://youtube.com/@phanetknust"}'),
  ('socials', '{"instagram":"https://instagram.com/phanetknust","youtube":"https://youtube.com/@phanetknust","whatsapp":"https://wa.me/233000000000","tiktok":"https://tiktok.com/@phanetknust"}'),
  ('about', '{"mission":"PHANET KNUST (Prayer Haven Network) is a campus fellowship of students who pray, serve and grow together at the Kwame Nkrumah University of Science and Technology.","vision":"A generation of young people who are examples of the believers in word, conduct, love, faith and purity.","values":["Prayer","Word","Service","Community"]}'),
  ('academic', '{"year":"2026/27","semester":1}')
on conflict (key) do update set value = excluded.value;

insert into public.programs (slug, name, tagline, description, schedule_label, location, sort_order) values
  ('dawn-watch', 'Dawn Watch', 'Campus-wide intercession to start the day.', 'Early morning prayer every weekday. Join online or at Unity Hall.', 'MON–FRI · 5:30AM', 'Online + Unity Hall', 1),
  ('midweek-altar', 'Midweek Altar', 'Worship, the word and the wall.', 'Our main night of the week: worship, teaching and corporate prayer at the Great Hall foyer.', 'WED · 7:00PM', 'Great Hall foyer', 2),
  ('outreach-day', 'Outreach Day', 'Hands on in Ayeduase and Bomso.', 'Evangelism and community service around campus. Meet at the main gate.', 'SAT · 9:00AM', 'Main gate', 3)
on conflict (slug) do nothing;

insert into public.giving_funds (slug, name, description, sort_order) values
  ('offering', 'Offering', 'General offering for the running of the fellowship.', 1),
  ('tithe', 'Tithe', 'Bring your tithe into the storehouse.', 2),
  ('sending-fund', 'The Sending fund', 'Missions, outreach and sending workers.', 3),
  ('welfare', 'Welfare', 'Groceries and support for members in need.', 4)
on conflict (slug) do nothing;

insert into public.welfare_items (name, category, unit, qty_available, max_per_request) values
  ('Rice (2kg)', 'Groceries', 'bag', 20, 1),
  ('Gari (1kg)', 'Groceries', 'bag', 30, 2),
  ('Cooking oil (500ml)', 'Groceries', 'bottle', 15, 1),
  ('Tomato paste', 'Groceries', 'tin', 40, 3),
  ('Sardines', 'Groceries', 'tin', 40, 3),
  ('Indomie (pack of 5)', 'Groceries', 'pack', 25, 1),
  ('Sugar (500g)', 'Groceries', 'pack', 20, 1),
  ('Milo sachets', 'Groceries', 'pack', 30, 2),
  ('Bathing soap', 'Toiletries', 'bar', 30, 2),
  ('Toothpaste', 'Toiletries', 'tube', 20, 1),
  ('Sanitary pads', 'Toiletries', 'pack', 30, 2)
on conflict do nothing;

insert into public.products (slug, name, description, price, stock, options, sort_order) values
  ('theme-tee', 'Theme T-shirt 2026/27', 'Royal blue tee with the "Let No Man Despise Thy Youth" print.', 80, 60, '["S","M","L","XL","XXL"]', 1),
  ('theme-hoodie', 'Theme Hoodie', 'Heavyweight hoodie, tangerine print on royal blue.', 180, 25, '["S","M","L","XL"]', 2),
  ('wristband', 'PHANET wristband', 'Silicone wristband with the theme verse.', 10, 300, '[]', 3),
  ('prayer-journal', 'Prayer journal', 'A5 journal with 90 days of prayer prompts.', 45, 80, '[]', 4)
on conflict (slug) do nothing;

with c as (
  insert into public.courses (slug, title, summary, description, format, level, instructor, duration_label, pass_mark, is_published, sort_order)
  values ('foundations-of-prayer', 'Foundations of Prayer', 'Why we pray, how we pray, and how to keep an altar.', 'A five-lesson introduction to a life of prayer for new intercessors. Watch each lesson, then pass the quiz to earn your certificate.', 'video', 'Foundation', 'PHANET Teaching Team', '5 lessons · 2h', 70, true, 1)
  on conflict (slug) do nothing returning id
), l as (
  insert into public.lessons (course_id, sort_order, title, kind, youtube_url, duration_minutes)
  select c.id, s.ord, s.title, 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 20
  from c, (values (1,'Why we pray'),(2,'The pattern of prayer'),(3,'Praying the Word'),(4,'Intercession'),(5,'Keeping your altar')) as s(ord,title)
), q as (
  insert into public.quizzes (course_id, title, instructions) select c.id, 'Final quiz', 'Answer all questions. You need 70% to pass.' from c returning id
)
insert into public.quiz_questions (quiz_id, sort_order, prompt, options, correct_index)
select q.id, s.ord, s.prompt, s.opts::jsonb, s.ans from q, (values
  (1,'According to 1 Timothy 4:12, believers should be an example in how many areas?','["Three","Four","Five","Six"]',2),
  (2,'Which prayer did Jesus teach His disciples?','["The Shepherd''s prayer","The Lord''s prayer","Hannah''s prayer","The Serenity prayer"]',1),
  (3,'Intercession means praying…','["for yourself only","on behalf of others","only in tongues","silently"]',1)
) as s(ord,prompt,opts,ans);

insert into public.resources (title, kind, description, author, youtube_url, sort_order) values
  ('Let No Man Despise Thy Youth — Theme message', 'message', 'The 2026/27 theme message.', 'Ps. Stefan', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1)
on conflict do nothing;
