-- La ubicación pública siempre es aproximada (unos 300 m): ya no se puede elegir
-- mostrar el lugar exacto. Los avisos que la mostraban exacta pasan a aproximada.
alter table public.avisos_privado
  drop constraint if exists avisos_privado_siempre_aproximada;

update public.avisos_privado set mostrar_exacta = false where mostrar_exacta;

alter table public.avisos_privado
  add constraint avisos_privado_siempre_aproximada check (mostrar_exacta = false);
