-- Optional starter content. Safe to run once on a fresh project.
insert into public.site_settings (key, value) values
  ('theme', '{"year": "2026/2027", "title": "Let No Man Despise Thy Youth", "reference": "1 Timothy 4:12", "tagline": "We intercede for our generation, and we avail ourselves to be the solutions to what we pray about."}'),
  ('verse_of_day', '{"text":"Be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.","reference":"1 Timothy 4:12 · KJV"}'),
  ('live', '{"label":"SATURDAYS · 2:30PM","title":"Gathering of the Adelphos","url":"https://youtube.com/@phanetknust"}'),
  ('socials', '{"instagram":"https://instagram.com/phanetknust","youtube":"https://youtube.com/@phanetknust","whatsapp":"https://wa.me/233000000000","tiktok":"https://tiktok.com/@phanetknust"}'),
  ('about', '{"intro": "PHANET KNUST is a Christian youth movement on the KNUST campus. We intercede for our generation, and we avail ourselves to be the solutions to the things we pray about.", "idea": "Intercession is standing before God on behalf of other people. At PHANET it does not stop at asking. When we pray about our campus, our country or our generation, we also make ourselves available, so that if God wants to use someone to solve that problem, He can use us. Like Isaiah, our answer is \"Here am I; send me.\"", "idea_reference": "Isaiah 6:8", "scripture_text": "I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men; for kings, and for all that are in authority; that we may lead a quiet and peaceable life in all godliness and honesty. For this is good and acceptable in the sight of God our Saviour; who will have all men to be saved, and to come unto the knowledge of the truth.", "scripture_reference": "1 Timothy 2:1–4 · KJV", "story": "PHANET is short for Phanerosis Prayer Network International. It started with a small group of intercessors praying for revival in Ghana, led by Dr. Godfred Bonnah Nkansah. Today there are chapters across Ghana, the rest of Africa, the United Kingdom and North America. PHANET KNUST is the university chapter at the Kwame Nkrumah University of Science and Technology.", "mandate": "Raising and deploying Kingdom emissaries to transform every sphere of society.", "vision": "To raise one billion intercessors.", "mission": "To reach the unreached, strengthen the weak and support the strong.", "streams": ["Intercession: We stand in the gap for people, our campus, our nation and those who do not yet know Christ. | 1 Timothy 2:1–2", "Fellowship: We are a family. We carry one another, honour our leaders and make room for newcomers. | Acts 2:42", "The Word: Everything we teach is measured against Scripture and centred on Jesus. | 2 Timothy 3:16", "Witnessing: We pray for the lost, and then we go and tell them. | Acts 1:8"], "values": ["Intercession for the lost: Praying for people who do not know Christ is our heartbeat, not a programme. | 1 Timothy 2:3–4", "Christ-centred teaching: Anchored in Scripture and the person of Jesus. We do not water down the Gospel, and we do not put tradition above the Bible. | Colossians 1:18", "Sacrifice for the Kingdom: Night watches, fasting, missions and giving. We offer our time, comfort, money and ambition. | Romans 12:1", "Love for God and the brethren: Costly, practical love that shapes how we treat newcomers, leaders and one another. | John 13:34–35", "Unity of the Body of Christ: We do not exist to gather a tribe. We serve the whole Church, across denominations, generations and places. | John 17:21"], "emissary": "You do not have to be a pastor in training. Engineers, doctors, teachers, lawyers, business people and parents can all be emissaries. Intercession gives you the burden. Training gives you the ability. God does the sending."}'),
  ('academic', '{"year":"2026/27","semester":1}')
on conflict (key) do update set value = excluded.value;

-- Programs are inserted by migrations/0010_programs_2026.sql

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
