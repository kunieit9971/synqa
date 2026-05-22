-- UI テーマ色（会社ごと）

alter table public.tenant_settings
  add column if not exists theme_primary_color text not null default '#0066FF',
  add column if not exists theme_accent_color text not null default '#00C9A7';
