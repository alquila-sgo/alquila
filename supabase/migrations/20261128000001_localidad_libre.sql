-- "Otra" localidad en texto libre: el aviso tiene una localidad de la lista
-- o un nombre escrito por la persona (al menos una de las dos).
alter table public.avisos alter column localidad_id drop not null;
alter table public.avisos
  add column if not exists localidad_otra text
  check (char_length(localidad_otra) between 2 and 80);
alter table public.avisos
  add constraint avisos_localidad_presente
  check (localidad_id is not null or localidad_otra is not null);
