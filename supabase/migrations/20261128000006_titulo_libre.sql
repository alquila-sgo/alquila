-- El título ya no pide un mínimo de letras (la app sugiere "Casa, 4 dormitorios").
alter table public.avisos drop constraint if exists avisos_titulo_check;
alter table public.avisos
  add constraint avisos_titulo_check check (char_length(titulo) between 1 and 200);
