-- Synqa: マルチテナント勤怠 初期スキーマ

create extension if not exists "pgcrypto";

-- 会社（テナント）
create table if not exists public.tenants (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- 会社設定（休憩・締め期間・管理者PW・所定労働など）
create table if not exists public.tenant_settings (
  tenant_id text primary key references public.tenants (id) on delete cascade,
  standard_work_minutes_per_day integer not null default 420,
  admin_password_hash text not null default '',
  period_mode text not null default 'calendar_month'
    check (period_mode in ('calendar_month', 'anchor_day')),
  period_anchor_day integer not null default 1
    check (period_anchor_day >= 1 and period_anchor_day <= 28),
  break_windows jsonb not null default '[
    {"startHour":10,"startMinute":0,"endHour":10,"endMinute":30},
    {"startHour":12,"startMinute":0,"endHour":13,"endMinute":0},
    {"startHour":15,"startMinute":30,"endHour":16,"endMinute":0}
  ]'::jsonb,
  monthly_overtime_limit_hours integer not null default 20,
  updated_at timestamptz not null default now()
);

-- 打刻対象の社員（表示名）
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  display_name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists employees_tenant_idx on public.employees (tenant_id);

-- ログインユーザー ↔ 会社
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tenant_id text not null references public.tenants (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  display_name text not null default '',
  employee_id uuid references public.employees (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_tenant_idx on public.profiles (tenant_id);

-- 打刻
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  clock_in_lat double precision not null default 0,
  clock_in_lng double precision not null default 0,
  clock_out_lat double precision,
  clock_out_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_one_per_day unique (tenant_id, employee_id, work_date)
);

create index if not exists attendance_records_tenant_date_idx
  on public.attendance_records (tenant_id, work_date desc);

-- 現在ユーザーのテナント
create or replace function public.current_tenant_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$;

-- RLS
alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.employees enable row level security;
alter table public.profiles enable row level security;
alter table public.attendance_records enable row level security;

create policy tenants_select_own on public.tenants for select to authenticated
  using (id = public.current_tenant_id());

create policy tenant_settings_select on public.tenant_settings for select to authenticated
  using (tenant_id = public.current_tenant_id());

create policy tenant_settings_update_admin on public.tenant_settings for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_profile_role() = 'admin')
  with check (tenant_id = public.current_tenant_id());

create policy employees_select on public.employees for select to authenticated
  using (tenant_id = public.current_tenant_id());

create policy employees_insert_admin on public.employees for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.current_profile_role() = 'admin');

create policy employees_update_admin on public.employees for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_profile_role() = 'admin');

create policy employees_delete_admin on public.employees for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_profile_role() = 'admin');

create policy profiles_select_own on public.profiles for select to authenticated
  using (user_id = auth.uid() or tenant_id = public.current_tenant_id());

create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy attendance_select on public.attendance_records for select to authenticated
  using (tenant_id = public.current_tenant_id());

create policy attendance_insert on public.attendance_records for insert to authenticated
  with check (tenant_id = public.current_tenant_id());

create policy attendance_update_admin on public.attendance_records for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_profile_role() = 'admin');

create policy attendance_delete_admin on public.attendance_records for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_profile_role() = 'admin');

-- 新規会社登録（初回管理者）
create or replace function public.register_new_tenant(
  p_slug text,
  p_company_name text,
  p_user_display_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles where user_id = v_uid) then
    raise exception 'already_registered';
  end if;
  v_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9_-]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if length(v_slug) < 2 then
    raise exception 'invalid_slug';
  end if;
  if exists (select 1 from public.tenants where id = v_slug) then
    raise exception 'tenant_exists';
  end if;
  insert into public.tenants (id, name) values (v_slug, trim(p_company_name));
  insert into public.tenant_settings (tenant_id) values (v_slug);
  insert into public.profiles (user_id, tenant_id, role, display_name)
  values (v_uid, v_slug, 'admin', coalesce(nullif(trim(p_user_display_name), ''), '管理者'));
end;
$$;

-- 既存会社に参加（メンバー）
create or replace function public.join_tenant(
  p_slug text,
  p_user_display_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles where user_id = v_uid) then
    raise exception 'already_registered';
  end if;
  v_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9_-]', '-', 'g'));
  if not exists (select 1 from public.tenants where id = v_slug) then
    raise exception 'tenant_not_found';
  end if;
  insert into public.profiles (user_id, tenant_id, role, display_name)
  values (v_uid, v_slug, 'member', coalesce(nullif(trim(p_user_display_name), ''), 'ユーザー'));
end;
$$;

grant execute on function public.register_new_tenant(text, text, text) to authenticated;
grant execute on function public.join_tenant(text, text) to authenticated;
