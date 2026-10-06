-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('member-photos', 'member-photos', false),
  ('resources', 'resources', true),
  ('course-media', 'course-media', true),
  ('products', 'products', true),
  ('welfare', 'welfare', true),
  ('site', 'site', true)
on conflict (id) do nothing;

-- member photos: only database/admin (and leaders for their sheep via signed URLs created server-side)
create policy "member-photos: staff read" on storage.objects for select using (bucket_id = 'member-photos' and public.has_any_role('admin','database','leader','usher'));
create policy "member-photos: database write" on storage.objects for insert with check (bucket_id = 'member-photos' and public.has_any_role('admin','database'));
create policy "member-photos: database update" on storage.objects for update using (bucket_id = 'member-photos' and public.has_any_role('admin','database'));
create policy "member-photos: database delete" on storage.objects for delete using (bucket_id = 'member-photos' and public.has_any_role('admin','database'));

-- public buckets: anyone reads, admins (and the relevant team) write
create policy "public buckets read" on storage.objects for select using (bucket_id in ('resources','course-media','products','welfare','site'));
create policy "admin writes public buckets" on storage.objects for insert with check (bucket_id in ('resources','course-media','products','site') and public.is_admin());
create policy "admin updates public buckets" on storage.objects for update using (bucket_id in ('resources','course-media','products','site') and public.is_admin());
create policy "admin deletes public buckets" on storage.objects for delete using (bucket_id in ('resources','course-media','products','site') and public.is_admin());
create policy "welfare team writes welfare bucket" on storage.objects for insert with check (bucket_id = 'welfare' and public.has_any_role('admin','welfare'));
create policy "welfare team updates welfare bucket" on storage.objects for update using (bucket_id = 'welfare' and public.has_any_role('admin','welfare'));
create policy "welfare team deletes welfare bucket" on storage.objects for delete using (bucket_id = 'welfare' and public.has_any_role('admin','welfare'));
