-- PHANET KNUST programs for 2026/27, replacing the placeholder programs from seed.sql.
-- The weekly main meeting is the Gathering of the Adelphos on Saturdays (no Wednesday meeting).
delete from public.programs where slug in ('dawn-watch', 'midweek-altar', 'outreach-day');

insert into public.programs (slug, name, tagline, description, schedule_label, sort_order, is_active) values
  ('gathering-of-the-adelphos', 'Gathering of the Adelphos', 'Our main weekly meeting.', 'Adelphos is the Greek word for brother. Every Saturday afternoon we gather as one family to worship, pray and study the Word together.', 'Every Saturday · 2:30–5:30pm', 1, true),
  ('night-of-solemnities', 'Night of Solemnities', 'A monthly all-night of prayer with Dr. Godfred Bonnah Nkansah.', 'Once a month we stay up through the night to worship, intercede and hear the Word with our founder, Dr. Godfred Bonnah Nkansah.', 'Monthly · All night', 2, true),
  ('academic-excellence-retreat', 'Academic Excellence Retreat', 'Praying over our studies, and learning to study well.', 'A retreat each semester where we pray for our academic work, share study habits that work and encourage one another to excel.', 'Once each semester', 3, true),
  ('prophetic-convocation', 'Prophetic Convocation', 'Worship, the Word and prayer for the season ahead.', 'A gathering each semester for worship, prophetic ministry and prayer over the semester ahead.', 'Once each semester', 4, true),
  ('business-masterclass', 'Business Masterclass', 'Equipping emissaries for the marketplace.', 'A yearly masterclass on entrepreneurship, brand strategy and growing a business, so we can serve God well in the marketplace.', 'Once each year', 5, true)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description,
  schedule_label = excluded.schedule_label, sort_order = excluded.sort_order, is_active = true;

-- The "live" button pointed at a Wednesday meeting; point it at the Saturday gathering.
insert into public.site_settings (key, value) values
  ('live', '{"label":"SATURDAYS · 2:30PM","title":"Gathering of the Adelphos","url":"https://youtube.com/@phanetknust"}')
on conflict (key) do update set value = excluded.value, updated_at = now();
