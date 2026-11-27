-- =============================================================================
-- Alquilá Sgo · esquema inicial (v1)
--
-- Principio: por defecto nadie lee ni escribe nada. Cada tabla tiene RLS activo
-- y permisos (GRANT) explícitos, así funciona igual tenga o no Supabase activado
-- el acceso automático de la API a tablas nuevas.
--
-- Roles de Supabase: "anon" = visitante sin cuenta, "authenticated" = con cuenta.
-- auth.uid() = id del usuario que hace la consulta.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.tipo_cuenta as enum ('particular', 'inmobiliaria');
create type public.rol_usuario as enum ('usuario', 'admin');
create type public.tipo_propiedad as enum ('departamento', 'casa', 'duplex', 'habitacion', 'otro');
create type public.moneda as enum ('ARS', 'USD');
create type public.si_no_consultar as enum ('si', 'no', 'consultar');
create type public.amueblado as enum ('si', 'no', 'parcial');
-- "vencido" no es un estado: un aviso publicado con vence_el en el pasado deja de verse solo.
create type public.estado_aviso as enum ('borrador', 'publicado', 'pausado', 'alquilado', 'oculto', 'rechazado');
create type public.canal_contacto as enum ('whatsapp', 'formulario', 'compartir');
create type public.motivo_denuncia as enum ('estafa', 'ya_alquilado', 'datos_falsos', 'discriminatorio', 'duplicado', 'otro');
create type public.estado_denuncia as enum ('pendiente', 'revisada', 'descartada');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create function public.tocar_actualizado_el()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_el := now();
  return new;
end;
$$;

-- Las funciones internas marcan la transacción para que los triggers de
-- protección las dejen pasar. Un usuario no puede fijar esta marca: la API
-- solo expone funciones del esquema public.
create function public.es_interno()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('alquila.interno', true), '') = '1';
$$;

-- -----------------------------------------------------------------------------
-- perfiles: una fila por cuenta
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '' check (char_length(nombre) <= 80),
  -- Solo dígitos, con código de país (ej. 5493855123456). Lo carga el usuario, sin verificar.
  whatsapp text check (whatsapp ~ '^[0-9]{10,15}$'),
  tipo public.tipo_cuenta not null default 'particular',
  nombre_comercial text check (char_length(nombre_comercial) <= 100),
  matricula text check (char_length(matricula) <= 50),
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  verificado boolean not null default false,
  rol public.rol_usuario not null default 'usuario',
  creado_el timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);

create trigger perfiles_actualizado_el
  before update on public.perfiles
  for each row execute function public.tocar_actualizado_el();

-- ¿El usuario actual es admin? security definer para poder leer perfiles sin
-- chocar con su propio RLS.
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- Crea el perfil al registrarse (Google o email).
create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80)
  );
  return new;
end;
$$;

create trigger crear_perfil_al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil();

alter table public.perfiles enable row level security;

create policy "perfiles: cada uno ve el suyo; admin ve todos"
  on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy "perfiles: cada uno edita el suyo; admin edita todos"
  on public.perfiles for update to authenticated
  using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

-- rol y verificado no están en la lista: el usuario no los puede cambiar.
-- El rol admin se asigna a mano desde el panel de Supabase.
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, whatsapp, tipo, nombre_comercial, matricula, slug) on public.perfiles to authenticated;

-- -----------------------------------------------------------------------------
-- localidades: lista cerrada de la provincia (se carga aparte)
-- -----------------------------------------------------------------------------
create table public.localidades (
  id integer generated always as identity primary key,
  nombre text not null,
  departamento text not null,
  unique (nombre, departamento)
);

alter table public.localidades enable row level security;

create policy "localidades: todos leen"
  on public.localidades for select to anon, authenticated
  using (true);

revoke all on public.localidades from anon, authenticated;
grant select on public.localidades to anon, authenticated;

-- -----------------------------------------------------------------------------
-- avisos
-- -----------------------------------------------------------------------------
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  anunciante_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  estado public.estado_aviso not null default 'borrador',

  titulo text not null check (char_length(titulo) between 10 and 100),
  tipo_propiedad public.tipo_propiedad not null,
  localidad_id integer not null references public.localidades (id),
  barrio text check (char_length(barrio) <= 80),
  descripcion text not null check (char_length(descripcion) between 20 and 3000),

  -- Precio: o "Consultar precio", o monto + moneda.
  consultar_precio boolean not null default false,
  precio numeric(14, 2) check (precio > 0),
  moneda public.moneda,
  expensas numeric(14, 2) check (expensas >= 0),
  sin_expensas boolean not null default false,
  ajuste text check (char_length(ajuste) <= 120),

  ambientes smallint not null check (ambientes between 1 and 20),
  dormitorios smallint not null check (dormitorios between 0 and 20),
  banos smallint check (banos between 0 and 10),
  superficie_m2 integer check (superficie_m2 between 1 and 100000),

  mascotas public.si_no_consultar not null,
  amueblado public.amueblado,
  garantias text[] not null default '{}'
    check (garantias <@ array['propietaria', 'seguro_caucion', 'recibo_sueldo']),
  meses_deposito smallint check (meses_deposito between 0 and 12),
  requisitos text check (char_length(requisitos) <= 500),
  disponible_desde date,

  agua boolean not null default false,
  luz boolean not null default false,
  gas_natural boolean not null default false,
  internet boolean not null default false,
  aire_acondicionado boolean not null default false,
  cochera boolean not null default false,
  patio boolean not null default false,
  pileta boolean not null default false,

  contacto_whatsapp boolean not null default true,
  contacto_formulario boolean not null default true,

  -- Ubicación pública. La calcula la base a partir del pin exacto (avisos_privado).
  lat_publica double precision,
  lng_publica double precision,
  ubicacion_exacta boolean not null default false,

  -- Control (solo los cambia la base o el admin)
  publicado_el timestamptz,
  vence_el timestamptz,
  revisado boolean not null default false,
  denuncias_count integer not null default 0,
  creado_el timestamptz not null default now(),
  actualizado_el timestamptz not null default now(),

  constraint precio_coherente check (
    (consultar_precio and precio is null)
    or (not consultar_precio and precio is not null and moneda is not null)
  ),
  constraint algun_contacto check (contacto_whatsapp or contacto_formulario)
);

create index avisos_visibles_idx on public.avisos (estado, vence_el);
create index avisos_localidad_idx on public.avisos (localidad_id);
create index avisos_anunciante_idx on public.avisos (anunciante_id);
create index avisos_precio_idx on public.avisos (moneda, precio);

create trigger avisos_actualizado_el
  before update on public.avisos
  for each row execute function public.tocar_actualizado_el();

-- Reglas que el anunciante no puede saltear.
create function public.avisos_proteger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cant_fotos integer;
begin
  if public.es_interno() or public.es_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.anunciante_id := auth.uid();
    new.estado := 'borrador';
    new.publicado_el := null;
    new.vence_el := null;
    new.revisado := false;
    new.denuncias_count := 0;
    new.lat_publica := null;
    new.lng_publica := null;
    return new;
  end if;

  -- UPDATE: campos que solo maneja la base
  new.anunciante_id := old.anunciante_id;
  new.revisado := old.revisado;
  new.denuncias_count := old.denuncias_count;
  new.publicado_el := old.publicado_el;
  new.lat_publica := old.lat_publica;
  new.lng_publica := old.lng_publica;

  -- Un aviso oculto o rechazado solo lo libera el admin.
  if old.estado in ('oculto', 'rechazado') and new.estado is distinct from old.estado then
    raise exception 'Este aviso está en revisión. Escribinos para reactivarlo.';
  end if;
  if new.estado in ('oculto', 'rechazado') and new.estado is distinct from old.estado then
    raise exception 'Estado no permitido';
  end if;

  -- Cualquier cambio de vence_el pedido por el dueño = renovar 30 días.
  if new.vence_el is distinct from old.vence_el then
    if old.estado <> 'publicado' then
      raise exception 'Solo se pueden renovar avisos publicados';
    end if;
    new.vence_el := now() + interval '30 days';
  end if;

  -- Pasar a publicado (o republicar desde pausado): validar y fijar fechas.
  if new.estado = 'publicado' and old.estado <> 'publicado' then
    select count(*) into cant_fotos from public.fotos where aviso_id = new.id;
    if cant_fotos < 3 then
      raise exception 'El aviso necesita al menos 3 fotos';
    end if;
    if not exists (select 1 from public.avisos_privado where aviso_id = new.id) then
      raise exception 'Falta marcar la ubicación en el mapa';
    end if;
    if new.contacto_whatsapp and not exists (
      select 1 from public.perfiles where id = new.anunciante_id and whatsapp is not null
    ) then
      raise exception 'Cargá tu número de WhatsApp en tu perfil o desactivá ese contacto';
    end if;
    new.publicado_el := coalesce(old.publicado_el, now());
    new.vence_el := now() + interval '30 days';
  end if;

  return new;
end;
$$;

create trigger avisos_proteger
  before insert or update on public.avisos
  for each row execute function public.avisos_proteger();

alter table public.avisos enable row level security;

create policy "avisos: publicados y vigentes, o propios, o admin"
  on public.avisos for select to anon, authenticated
  using (
    (estado = 'publicado' and vence_el > now())
    or anunciante_id = auth.uid()
    or public.es_admin()
  );

create policy "avisos: crear solo como uno mismo"
  on public.avisos for insert to authenticated
  with check (anunciante_id = auth.uid());

create policy "avisos: editar el dueño o el admin"
  on public.avisos for update to authenticated
  using (anunciante_id = auth.uid() or public.es_admin())
  with check (anunciante_id = auth.uid() or public.es_admin());

create policy "avisos: borrar el dueño o el admin"
  on public.avisos for delete to authenticated
  using (anunciante_id = auth.uid() or public.es_admin());

revoke all on public.avisos from anon, authenticated;
grant select on public.avisos to anon, authenticated;
grant insert, update, delete on public.avisos to authenticated;

-- -----------------------------------------------------------------------------
-- avisos_privado: dirección y pin exacto (solo dueño y admin)
-- -----------------------------------------------------------------------------
create table public.avisos_privado (
  aviso_id uuid primary key references public.avisos (id) on delete cascade,
  direccion text check (char_length(direccion) <= 200),
  -- Caja aproximada de la provincia de Santiago del Estero, con margen.
  lat double precision not null check (lat between -30.5 and -25.0),
  lng double precision not null check (lng between -65.5 and -61.0),
  mostrar_exacta boolean not null default false
);

-- Calcula la ubicación pública: si el dueño no eligió mostrarla exacta, se
-- corre el punto entre 100 y 250 m. El corrimiento sale del id del aviso, así
-- siempre es el mismo y no se puede adivinar el punto real promediando.
create function public.calcular_ubicacion_publica()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := md5(new.aviso_id::text);
  u1 double precision := ('x' || substr(h, 1, 8))::bit(32)::bigint / 4294967295.0;
  u2 double precision := ('x' || substr(h, 9, 8))::bit(32)::bigint / 4294967295.0;
  angulo double precision := 2 * pi() * u1;
  metros double precision := 100 + 150 * u2;
begin
  perform set_config('alquila.interno', '1', true);
  if new.mostrar_exacta then
    update public.avisos
      set lat_publica = new.lat, lng_publica = new.lng, ubicacion_exacta = true
      where id = new.aviso_id;
  else
    update public.avisos
      set lat_publica = new.lat + (metros * sin(angulo)) / 111320.0,
          lng_publica = new.lng + (metros * cos(angulo)) / (111320.0 * cos(radians(new.lat))),
          ubicacion_exacta = false
      where id = new.aviso_id;
  end if;
  perform set_config('alquila.interno', '', true);
  return new;
end;
$$;

create trigger avisos_privado_ubicacion
  after insert or update on public.avisos_privado
  for each row execute function public.calcular_ubicacion_publica();

alter table public.avisos_privado enable row level security;

create policy "avisos_privado: solo el dueño del aviso o el admin"
  on public.avisos_privado for all to authenticated
  using (
    public.es_admin()
    or exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid())
  )
  with check (
    public.es_admin()
    or exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid())
  );

revoke all on public.avisos_privado from anon, authenticated;
grant select, insert, update, delete on public.avisos_privado to authenticated;

-- -----------------------------------------------------------------------------
-- fotos (los archivos están en Cloudflare R2; acá solo la referencia)
-- -----------------------------------------------------------------------------
create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  clave text not null unique,
  orden smallint not null default 0,
  ancho integer check (ancho > 0),
  alto integer check (alto > 0),
  creado_el timestamptz not null default now(),
  -- La clave del archivo tiene que estar dentro de la carpeta del aviso.
  constraint clave_del_aviso check (
    clave ~ ('^avisos/' || aviso_id::text || '/[A-Za-z0-9._-]{1,100}$')
  )
);

create index fotos_aviso_idx on public.fotos (aviso_id, orden);

create function public.fotos_limites()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  est public.estado_aviso;
  cant integer;
begin
  if tg_op = 'INSERT' then
    select count(*) into cant from public.fotos where aviso_id = new.aviso_id;
    if cant >= 15 then
      raise exception 'Máximo 15 fotos por aviso';
    end if;
    return new;
  end if;

  -- DELETE: un aviso publicado no puede quedar con menos de 3 fotos.
  -- (Si se está borrando el aviso entero, ya no existe y se deja pasar.)
  select estado into est from public.avisos where id = old.aviso_id;
  if est = 'publicado' then
    select count(*) into cant from public.fotos where aviso_id = old.aviso_id;
    if cant <= 3 then
      raise exception 'Un aviso publicado necesita al menos 3 fotos';
    end if;
  end if;
  return old;
end;
$$;

create trigger fotos_limites
  before insert or delete on public.fotos
  for each row execute function public.fotos_limites();

alter table public.fotos enable row level security;

-- La subconsulta respeta el RLS de avisos: solo se ven fotos de avisos visibles.
create policy "fotos: visibles si el aviso es visible"
  on public.fotos for select to anon, authenticated
  using (exists (select 1 from public.avisos a where a.id = aviso_id));

create policy "fotos: el dueño del aviso las gestiona"
  on public.fotos for insert to authenticated
  with check (exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid()));

create policy "fotos: el dueño del aviso las reordena"
  on public.fotos for update to authenticated
  using (exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid()))
  with check (exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid()));

create policy "fotos: el dueño del aviso o el admin las borran"
  on public.fotos for delete to authenticated
  using (
    public.es_admin()
    or exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid())
  );

revoke all on public.fotos from anon, authenticated;
grant select on public.fotos to anon, authenticated;
grant insert, delete on public.fotos to authenticated;
grant update (orden) on public.fotos to authenticated;

-- -----------------------------------------------------------------------------
-- favoritos
-- -----------------------------------------------------------------------------
create table public.favoritos (
  usuario_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  creado_el timestamptz not null default now(),
  primary key (usuario_id, aviso_id)
);

alter table public.favoritos enable row level security;

create policy "favoritos: cada uno los suyos"
  on public.favoritos for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

revoke all on public.favoritos from anon, authenticated;
grant select, insert, delete on public.favoritos to authenticated;

-- -----------------------------------------------------------------------------
-- eventos_contacto: cada clic de contacto (para medir; solo lo ve el admin)
-- -----------------------------------------------------------------------------
create table public.eventos_contacto (
  id bigint generated always as identity primary key,
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  usuario_id uuid references public.perfiles (id) on delete set null,
  canal public.canal_contacto not null,
  creado_el timestamptz not null default now()
);

create index eventos_contacto_aviso_idx on public.eventos_contacto (aviso_id, creado_el);
create index eventos_contacto_usuario_idx on public.eventos_contacto (usuario_id, creado_el);

alter table public.eventos_contacto enable row level security;

create policy "eventos_contacto: solo admin lee"
  on public.eventos_contacto for select to authenticated
  using (public.es_admin());

-- Nadie inserta directo: solo las funciones de abajo.
revoke all on public.eventos_contacto from anon, authenticated;
grant select on public.eventos_contacto to authenticated;

-- ¿El aviso está publicado y vigente? (sin depender del RLS de quien llama)
create function public.aviso_visible(p_aviso uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.avisos
    where id = p_aviso and estado = 'publicado' and vence_el > now()
  );
$$;

-- Devuelve el WhatsApp del anunciante. Exige cuenta y registra el clic.
-- Límite: 60 números por usuario por día, para frenar a quien junta teléfonos.
create function public.obtener_whatsapp(p_aviso uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  numero text;
  usados integer;
begin
  if auth.uid() is null then
    raise exception 'Necesitás ingresar para ver el WhatsApp';
  end if;

  select p.whatsapp into numero
  from public.avisos a
  join public.perfiles p on p.id = a.anunciante_id
  where a.id = p_aviso
    and a.estado = 'publicado'
    and a.vence_el > now()
    and a.contacto_whatsapp;

  if numero is null then
    raise exception 'Este aviso no tiene WhatsApp disponible';
  end if;

  select count(*) into usados
  from public.eventos_contacto
  where usuario_id = auth.uid() and canal = 'whatsapp' and creado_el > now() - interval '1 day';
  if usados >= 60 then
    raise exception 'Llegaste al límite diario de contactos. Probá mañana.';
  end if;

  insert into public.eventos_contacto (aviso_id, usuario_id, canal)
  values (p_aviso, auth.uid(), 'whatsapp');

  return numero;
end;
$$;

-- Registra que alguien compartió un aviso (puede ser sin cuenta).
create function public.registrar_compartido(p_aviso uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.aviso_visible(p_aviso) then
    insert into public.eventos_contacto (aviso_id, usuario_id, canal)
    values (p_aviso, auth.uid(), 'compartir');
  end if;
end;
$$;

revoke execute on function public.obtener_whatsapp(uuid) from public, anon;
grant execute on function public.obtener_whatsapp(uuid) to authenticated;
revoke execute on function public.registrar_compartido(uuid) from public;
grant execute on function public.registrar_compartido(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- consultas: el formulario de contacto (exige cuenta)
-- -----------------------------------------------------------------------------
create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  remitente_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 80),
  telefono text check (telefono ~ '^[0-9]{8,15}$'),
  mensaje text not null check (char_length(mensaje) between 5 and 1000),
  leida boolean not null default false,
  creado_el timestamptz not null default now()
);

create index consultas_aviso_idx on public.consultas (aviso_id, creado_el desc);
create index consultas_remitente_idx on public.consultas (remitente_id, creado_el);

-- Valida, limita (20 por día por usuario) y registra el contacto.
create function public.consultas_validar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  enviadas integer;
begin
  new.remitente_id := auth.uid();
  new.leida := false;

  if not exists (
    select 1 from public.avisos
    where id = new.aviso_id and estado = 'publicado' and vence_el > now() and contacto_formulario
  ) then
    raise exception 'Este aviso no recibe consultas';
  end if;

  select count(*) into enviadas
  from public.consultas
  where remitente_id = auth.uid() and creado_el > now() - interval '1 day';
  if enviadas >= 20 then
    raise exception 'Llegaste al límite diario de consultas. Probá mañana.';
  end if;

  insert into public.eventos_contacto (aviso_id, usuario_id, canal)
  values (new.aviso_id, auth.uid(), 'formulario');

  return new;
end;
$$;

create trigger consultas_validar
  before insert on public.consultas
  for each row execute function public.consultas_validar();

alter table public.consultas enable row level security;

create policy "consultas: enviar con cuenta"
  on public.consultas for insert to authenticated
  with check (remitente_id = auth.uid());

create policy "consultas: remitente, dueño del aviso o admin"
  on public.consultas for select to authenticated
  using (
    remitente_id = auth.uid()
    or public.es_admin()
    or exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid())
  );

create policy "consultas: el dueño del aviso la marca como leída"
  on public.consultas for update to authenticated
  using (exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid()))
  with check (exists (select 1 from public.avisos a where a.id = aviso_id and a.anunciante_id = auth.uid()));

revoke all on public.consultas from anon, authenticated;
grant select, insert on public.consultas to authenticated;
grant update (leida) on public.consultas to authenticated;

-- -----------------------------------------------------------------------------
-- denuncias (exige cuenta; una por persona y aviso)
-- -----------------------------------------------------------------------------
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  denunciante_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  motivo public.motivo_denuncia not null,
  detalle text check (char_length(detalle) <= 1000),
  estado public.estado_denuncia not null default 'pendiente',
  creado_el timestamptz not null default now(),
  unique (aviso_id, denunciante_id)
);

create index denuncias_pendientes_idx on public.denuncias (estado, creado_el);

-- Con 3 denuncias pendientes de personas distintas, el aviso se oculta hasta revisión.
create function public.denuncias_contar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pendientes integer;
begin
  select count(*) into pendientes
  from public.denuncias
  where aviso_id = new.aviso_id and estado = 'pendiente';

  perform set_config('alquila.interno', '1', true);
  update public.avisos
    set denuncias_count = pendientes,
        estado = case when pendientes >= 3 and estado = 'publicado' then 'oculto' else estado end
    where id = new.aviso_id;
  perform set_config('alquila.interno', '', true);
  return null;
end;
$$;

create trigger denuncias_contar
  after insert or update on public.denuncias
  for each row execute function public.denuncias_contar();

create function public.denuncias_preparar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.denunciante_id := auth.uid();
  new.estado := 'pendiente';
  if not exists (select 1 from public.avisos where id = new.aviso_id and estado = 'publicado') then
    raise exception 'Este aviso no se puede denunciar';
  end if;
  return new;
end;
$$;

create trigger denuncias_preparar
  before insert on public.denuncias
  for each row execute function public.denuncias_preparar();

alter table public.denuncias enable row level security;

create policy "denuncias: denunciar con cuenta"
  on public.denuncias for insert to authenticated
  with check (denunciante_id = auth.uid());

create policy "denuncias: las ve quien denunció y el admin"
  on public.denuncias for select to authenticated
  using (denunciante_id = auth.uid() or public.es_admin());

create policy "denuncias: el admin las resuelve"
  on public.denuncias for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

revoke all on public.denuncias from anon, authenticated;
grant select, insert on public.denuncias to authenticated;
grant update (estado) on public.denuncias to authenticated;

-- -----------------------------------------------------------------------------
-- Datos públicos del anunciante (para la ficha y el perfil de inmobiliaria).
-- Sin teléfono. De un particular solo se muestra el primer nombre.
-- Función en vez de vista para no exponer perfiles sin avisos visibles.
-- -----------------------------------------------------------------------------
create function public.anunciante_publico(p_id uuid)
returns table (
  id uuid,
  tipo public.tipo_cuenta,
  nombre_publico text,
  slug text,
  verificado boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.tipo,
    case when p.tipo = 'inmobiliaria' then coalesce(p.nombre_comercial, p.nombre)
         else split_part(p.nombre, ' ', 1) end,
    case when p.tipo = 'inmobiliaria' then p.slug end,
    p.verificado
  from public.perfiles p
  where p.id = p_id
    and (
      p.tipo = 'inmobiliaria'
      or exists (
        select 1 from public.avisos a
        where a.anunciante_id = p.id and a.estado = 'publicado' and a.vence_el > now()
      )
    );
$$;

revoke execute on function public.anunciante_publico(uuid) from public;
grant execute on function public.anunciante_publico(uuid) to anon, authenticated;

-- Las funciones auxiliares no se llaman desde la app.
revoke execute on function public.es_interno() from public, anon, authenticated;
revoke execute on function public.crear_perfil() from public, anon, authenticated;
revoke execute on function public.calcular_ubicacion_publica() from public, anon, authenticated;
revoke execute on function public.avisos_proteger() from public, anon, authenticated;
revoke execute on function public.fotos_limites() from public, anon, authenticated;
revoke execute on function public.consultas_validar() from public, anon, authenticated;
revoke execute on function public.denuncias_contar() from public, anon, authenticated;
revoke execute on function public.denuncias_preparar() from public, anon, authenticated;
