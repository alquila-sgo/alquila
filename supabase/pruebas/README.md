# Pruebas de las reglas de seguridad

Prueban la migración en un Postgres local (no tocan el proyecto real de Supabase).

- `00_simular_supabase.sql`: crea lo mínimo de Supabase (roles `anon` y `authenticated`, `auth.users`, `auth.uid()`).
- `01_reglas_de_seguridad.sql`: simula usuarios (dueño, otro usuario, visitante sin cuenta, admin) y verifica qué puede y qué no puede hacer cada uno. Termina con `TODAS_LAS_PRUEBAS_OK`.

```sh
createdb prueba_alquila
psql -d prueba_alquila -f supabase/pruebas/00_simular_supabase.sql
psql -d prueba_alquila -f supabase/migrations/20261127000000_esquema_inicial.sql
psql -d prueba_alquila -f supabase/pruebas/01_reglas_de_seguridad.sql
```
