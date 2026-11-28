-- En vez de preguntar "ambientes", se cuentan cocina, cocina-comedor y comedor
-- (además de baños y dormitorios). La columna ambientes queda y la calcula la app.
alter table public.avisos
  add column if not exists cocina smallint not null default 0 check (cocina between 0 and 10),
  add column if not exists cocina_comedor smallint not null default 0 check (cocina_comedor between 0 and 10),
  add column if not exists comedor smallint not null default 0 check (comedor between 0 and 10);
