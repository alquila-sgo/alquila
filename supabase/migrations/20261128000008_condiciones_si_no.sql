-- Condiciones con solo Sí o No y opcionales: si no se responde, no se muestra.
-- Los avisos viejos con 'consultar' quedan así en la base; la app los toma como sin responder.
alter table public.avisos alter column mascotas drop not null;
alter table public.avisos
  add column if not exists menores public.si_no_consultar,
  add column if not exists fumadores public.si_no_consultar;
