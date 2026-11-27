-- Pruebas de reglas de seguridad. Correr después de 00_simular_supabase.sql y la migración.
\set ON_ERROR_STOP 1
\set QUIET 1
create schema pruebas;
grant usage on schema pruebas to anon, authenticated;
create function pruebas.falla(q text, msg text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK falla esperada [%]: %', msg, sqlerrm; return; end;
  raise exception 'DEBIA FALLAR [%]: %', msg, q;
end $$;
create function pruebas.igual(a anyelement, b anyelement, msg text) returns void language plpgsql as $$
begin if a is distinct from b then raise exception 'FALLO [%]: % <> %', msg, a, b; end if; raise notice 'OK [%]', msg; end $$;
grant execute on all functions in schema pruebas to anon, authenticated;
create function pruebas.como(uid text, rol text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(uid,''), false); execute 'set role ' || rol; end $$;

-- usuarios: A dueño, B otro, C, D (denunciantes), ADM admin
insert into auth.users (id, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a', '{"full_name":"Ana Paz"}'),
 ('00000000-0000-0000-0000-00000000000b', '{}'),
 ('00000000-0000-0000-0000-00000000000c', '{}'),
 ('00000000-0000-0000-0000-00000000000d', '{}'),
 ('00000000-0000-0000-0000-0000000000ad', '{}');
update perfiles set rol='admin' where id='00000000-0000-0000-0000-0000000000ad';
insert into localidades (nombre, departamento) values ('Santiago del Estero','Capital');
select pruebas.igual((select nombre from perfiles where id='00000000-0000-0000-0000-00000000000a'), 'Ana Paz', 'perfil creado al registrarse');

-- ===== A crea un aviso =====
select pruebas.como('00000000-0000-0000-0000-00000000000a','authenticated');
select pruebas.falla($$update perfiles set rol='admin' where id=auth.uid()$$, 'usuario no puede hacerse admin');
select pruebas.falla($$update perfiles set verificado=true where id=auth.uid()$$, 'usuario no puede auto-verificarse');
update perfiles set whatsapp='5493855000000' where id=auth.uid();
insert into avisos (id, titulo, tipo_propiedad, localidad_id, descripcion, precio, moneda, ambientes, dormitorios, mascotas, estado, revisado, anunciante_id)
values ('11111111-1111-1111-1111-111111111111','Depto lindo en el centro','departamento',1,'Departamento luminoso a dos cuadras de la plaza',350000,'ARS',2,1,'si','publicado',true,'00000000-0000-0000-0000-00000000000b');
reset role;
select pruebas.igual((select estado::text||'/'||revisado||'/'||anunciante_id from avisos), 'borrador/false/00000000-0000-0000-0000-00000000000a', 'insert fuerza borrador, dueño y revisado');
select pruebas.como('00000000-0000-0000-0000-00000000000a','authenticated');
select pruebas.falla($$insert into avisos (titulo, tipo_propiedad, localidad_id, descripcion, consultar_precio, precio, moneda, ambientes, dormitorios, mascotas) values ('Casa grande con patio','casa',1,'Casa con patio y cochera cerca del parque', true, 100, 'ARS',3,2,'no')$$, 'precio + consultar precio a la vez');
select pruebas.falla($$update avisos set estado='publicado'$$, 'publicar sin fotos');
insert into fotos (aviso_id, clave) values
 ('11111111-1111-1111-1111-111111111111','avisos/11111111-1111-1111-1111-111111111111/1.webp'),
 ('11111111-1111-1111-1111-111111111111','avisos/11111111-1111-1111-1111-111111111111/2.webp'),
 ('11111111-1111-1111-1111-111111111111','avisos/11111111-1111-1111-1111-111111111111/3.webp');
select pruebas.falla($$insert into fotos (aviso_id, clave) values ('11111111-1111-1111-1111-111111111111','avisos/otro/4.webp')$$, 'clave fuera de la carpeta del aviso');
select pruebas.falla($$update avisos set estado='publicado'$$, 'publicar sin pin');
select pruebas.falla($$insert into avisos_privado (aviso_id, lat, lng) values ('11111111-1111-1111-1111-111111111111', -34.6, -58.4)$$, 'pin fuera de la provincia');
insert into avisos_privado (aviso_id, direccion, lat, lng) values ('11111111-1111-1111-1111-111111111111', 'Av. Belgrano 100', -27.7834, -64.2642);
update avisos set estado='publicado';
select pruebas.igual((select vence_el > now() + interval '29 days' from avisos), true, 'publicar fija vencimiento a 30 dias');
select pruebas.igual((select round((6371000*2*asin(sqrt(power(sin(radians(lat_publica+27.7834)/2),2)+cos(radians(-27.7834))*cos(radians(lat_publica))*power(sin(radians(lng_publica+64.2642)/2),2))))::numeric) between 100 and 250 from avisos), true, 'ubicacion publica corrida 100-250 m');
select pruebas.falla($$update avisos set lat_publica=-27.7834$$, 'x') where false;
update avisos set lat_publica=-27.7834, denuncias_count=0, revisado=true;
reset role;
select pruebas.igual((select lat_publica <> -27.7834 and not revisado from avisos), true, 'dueño no puede tocar ubicacion publica ni revisado');
select pruebas.como('00000000-0000-0000-0000-00000000000a','authenticated');
select pruebas.falla($$delete from fotos where clave like '%/1.webp'$$, 'publicado no baja de 3 fotos');
select pruebas.falla($$update avisos set estado='oculto'$$, 'dueño no puede poner oculto');

-- ===== visitante sin cuenta =====
select pruebas.como(null,'anon');
select pruebas.igual((select count(*) from avisos), 1::bigint, 'anon ve aviso publicado');
select pruebas.igual((select count(*) from fotos), 3::bigint, 'anon ve fotos');
select pruebas.falla($$select * from avisos_privado$$, 'anon no lee direccion');
select pruebas.falla($$select * from perfiles$$, 'anon no lee perfiles');
select pruebas.falla($$select obtener_whatsapp('11111111-1111-1111-1111-111111111111')$$, 'anon no ve whatsapp');
select pruebas.falla($$insert into consultas (aviso_id, nombre, mensaje) values ('11111111-1111-1111-1111-111111111111','Juan','Hola, sigue disponible?')$$, 'anon no manda formulario');
select registrar_compartido('11111111-1111-1111-1111-111111111111');
select pruebas.igual((select nombre_publico from anunciante_publico('00000000-0000-0000-0000-00000000000a')), 'Ana', 'nombre publico solo primer nombre');
select pruebas.falla($$select * from eventos_contacto$$, 'anon no lee eventos');

-- ===== B (otro usuario) =====
select pruebas.como('00000000-0000-0000-0000-00000000000b','authenticated');
select pruebas.igual((select count(*) from avisos_privado), 0::bigint, 'B no ve direccion ajena');
select pruebas.igual((select count(*) from perfiles), 1::bigint, 'B solo ve su perfil');
select pruebas.igual(obtener_whatsapp('11111111-1111-1111-1111-111111111111'), '5493855000000', 'B registrado ve whatsapp');
update avisos set titulo='hackeado por B 123';
delete from avisos;
reset role;
select pruebas.igual((select titulo from avisos), 'Depto lindo en el centro', 'B no edita ni borra aviso ajeno');
select pruebas.como('00000000-0000-0000-0000-00000000000b','authenticated');
insert into consultas (aviso_id, nombre, telefono, mensaje) values ('11111111-1111-1111-1111-111111111111','Beto','3855111111','Hola, sigue disponible?');
insert into favoritos (aviso_id) values ('11111111-1111-1111-1111-111111111111');
select pruebas.falla($$update consultas set leida=true$$, 'x') where false;
update consultas set leida=true;
reset role;
select pruebas.igual((select leida from consultas), false, 'remitente no marca leida');
select pruebas.como('00000000-0000-0000-0000-00000000000a','authenticated');
select pruebas.igual((select count(*) from consultas), 1::bigint, 'dueño ve la consulta');
select pruebas.igual((select count(*) from favoritos), 0::bigint, 'A no ve favoritos de B');
update consultas set leida=true;
select pruebas.falla($$update consultas set mensaje='cambiado'$$, 'dueño no edita mensaje');
reset role;
select pruebas.igual((select leida from consultas), true, 'dueño marca leida');
select pruebas.igual((select count(*) from eventos_contacto), 3::bigint, 'eventos: compartir + whatsapp + formulario');

-- ===== denuncias =====
select pruebas.como('00000000-0000-0000-0000-00000000000b','authenticated');
insert into denuncias (aviso_id, motivo) values ('11111111-1111-1111-1111-111111111111','estafa');
select pruebas.falla($$insert into denuncias (aviso_id, motivo) values ('11111111-1111-1111-1111-111111111111','estafa')$$, 'una denuncia por persona');
select pruebas.como('00000000-0000-0000-0000-00000000000c','authenticated');
insert into denuncias (aviso_id, motivo) values ('11111111-1111-1111-1111-111111111111','estafa');
select pruebas.igual((select count(*) from denuncias), 1::bigint, 'C solo ve su denuncia');
select pruebas.como('00000000-0000-0000-0000-00000000000d','authenticated');
insert into denuncias (aviso_id, motivo) values ('11111111-1111-1111-1111-111111111111','datos_falsos');
select pruebas.igual((select count(*) from avisos), 0::bigint, 'con 3 denuncias el aviso se oculta');
select pruebas.como('00000000-0000-0000-0000-00000000000a','authenticated');
select pruebas.falla($$update avisos set estado='publicado'$$, 'dueño no reactiva aviso oculto');
select pruebas.como('00000000-0000-0000-0000-0000000000ad','authenticated');
update denuncias set estado='descartada';
update avisos set estado='publicado', revisado=true;
select pruebas.igual((select estado::text||'/'||denuncias_count from avisos), 'publicado/0', 'admin reactiva y resuelve denuncias');
select pruebas.igual((select count(*) from avisos_privado), 1::bigint, 'admin ve direccion');

-- ===== renovar y vencer =====
reset role;
update avisos set vence_el = now() - interval '1 day';
select pruebas.como(null,'anon');
select pruebas.igual((select count(*) from avisos), 0::bigint, 'aviso vencido no se ve');
select pruebas.como('00000000-0000-0000-0000-00000000000a','authenticated');
update avisos set vence_el = now() + interval '5 years';
select pruebas.igual((select vence_el between now() + interval '29 days' and now() + interval '31 days' from avisos), true, 'renovar = 30 dias, no mas');
-- ===== borrar aviso entero (cascada de fotos) =====
delete from avisos;
reset role;
select pruebas.igual((select count(*) from fotos), 0::bigint, 'borrar aviso borra fotos');
\echo TODAS_LAS_PRUEBAS_OK
