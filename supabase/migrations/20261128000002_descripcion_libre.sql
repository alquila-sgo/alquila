-- La descripción pasa a ser libre: sin mínimo de letras y opcional.
alter table public.avisos alter column descripcion drop not null;
alter table public.avisos drop constraint if exists avisos_descripcion_check;
alter table public.avisos
  add constraint avisos_descripcion_check check (char_length(descripcion) <= 3000);
