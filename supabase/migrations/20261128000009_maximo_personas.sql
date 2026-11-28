-- Máximo de personas (adultos y niños) o sin límite. Nulos en avisos viejos = no se muestra.
-- "¿Acepta menores?" se reemplaza por "¿Acepta estudiantes?" (la columna menores queda sin uso).
alter table public.avisos
  add column if not exists max_adultos smallint check (max_adultos between 1 and 20),
  add column if not exists max_ninos smallint check (max_ninos between 0 and 20),
  add column if not exists sin_limite_personas boolean not null default false,
  add column if not exists estudiantes public.si_no_consultar;
