-- Texto libre para servicios que no están en la lista (paso "¿Qué tiene?").
alter table public.avisos
  add column if not exists otros_servicios text
  check (char_length(otros_servicios) <= 200);
