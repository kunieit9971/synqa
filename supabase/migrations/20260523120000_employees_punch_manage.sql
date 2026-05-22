-- 打刻画面から社員の追加・名前変更・無効化（ログイン済み全員）

drop policy if exists employees_insert_admin on public.employees;
drop policy if exists employees_update_admin on public.employees;

create policy employees_insert_member on public.employees
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id());

create policy employees_update_member on public.employees
  for update to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
