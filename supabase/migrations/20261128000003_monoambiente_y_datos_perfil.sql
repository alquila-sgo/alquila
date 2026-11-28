-- "Monoambiente" reemplaza a "Dúplex" en el formulario. Los avisos viejos con
-- 'duplex' siguen siendo válidos.
alter type public.tipo_propiedad add value if not exists 'monoambiente';

-- Foto de perfil subida por la persona (en R2). Si no hay, se usa la de Google.
alter table public.perfiles
  add column if not exists foto_clave text
  check (foto_clave ~ '^perfiles/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$');

-- false hasta que la persona completa la pantalla de bienvenida (nombre, WhatsApp, foto).
alter table public.perfiles
  add column if not exists datos_listos boolean not null default false;

grant update (foto_clave, datos_listos) on public.perfiles to authenticated;
