-- Para el ingreso con email: ¿la cuenta existe y ya tiene contraseña?
-- 'clave' = pedir contraseña; 'sin_clave' (entró con Google o enlace) o 'nuevo' = mandar enlace.
-- Ojo: permite saber si un email está registrado. Se acepta a cambio de un ingreso más simple.
create or replace function public.estado_email(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when u.id is null then 'nuevo'
    when coalesce(u.encrypted_password, '') <> '' then 'clave'
    else 'sin_clave'
  end
  from (select 1) x
  left join auth.users u on lower(u.email) = lower(p_email) and u.deleted_at is null;
$$;

revoke execute on function public.estado_email(text) from public;
grant execute on function public.estado_email(text) to anon, authenticated;
