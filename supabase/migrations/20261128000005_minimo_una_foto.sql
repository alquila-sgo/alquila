-- El mínimo para publicar baja de 3 fotos a 1.

create or replace function public.avisos_proteger()
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
    if cant_fotos < 1 then
      raise exception 'El aviso necesita al menos 1 foto';
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

create or replace function public.fotos_limites()
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

  -- DELETE: un aviso publicado no puede quedar sin fotos.
  -- (Si se está borrando el aviso entero, ya no existe y se deja pasar.)
  select estado into est from public.avisos where id = old.aviso_id;
  if est = 'publicado' then
    select count(*) into cant from public.fotos where aviso_id = old.aviso_id;
    if cant <= 1 then
      raise exception 'Un aviso publicado necesita al menos 1 foto';
    end if;
  end if;
  return old;
end;
$$;
