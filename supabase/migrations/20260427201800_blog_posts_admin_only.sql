drop policy if exists "blog_posts: staff read all" on public.blog_posts;
drop policy if exists "blog_posts: staff write" on public.blog_posts;

create policy "blog_posts: admin read all"
  on public.blog_posts for select
  to authenticated
  using (public.auth_role() = 'admin');

create policy "blog_posts: admin write"
  on public.blog_posts for all
  to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');
