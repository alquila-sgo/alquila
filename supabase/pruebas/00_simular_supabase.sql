-- Simula lo mínimo de Supabase para probar la migración en un Postgres local.
do $$ begin create role anon nologin; exception when others then null; end $$; do $$ begin create role authenticated nologin; exception when others then null; end $$;
create schema auth;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Simula a Supabase: acceso automático a tablas nuevas
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
