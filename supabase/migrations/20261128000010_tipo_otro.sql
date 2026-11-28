-- Con tipo 'otro', qué es lo que se alquila (ej: dúplex, cabaña).
alter table public.avisos
  add column if not exists tipo_otro text check (char_length(tipo_otro) <= 60);
