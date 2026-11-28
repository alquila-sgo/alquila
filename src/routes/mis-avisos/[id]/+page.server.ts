import { error, fail, isActionFailure, redirect } from '@sveltejs/kit';
import { mensajeDeError } from '#lib/server/avisos.js';
import { bucket, borrarCarpetaDelAviso } from '#lib/server/fotos.js';
import { exigirUsuario } from '#lib/server/sesion.js';
import { texto } from '#lib/formulario.js';
import type { Actions, PageServerLoad } from './$types';

interface Aviso {
	id: string;
	titulo: string;
	estado: string;
	vence_el: string | null;
	anunciante_id: string;
	fotos: { id: string; clave: string; orden: number }[];
}

async function cargar(locals: App.Locals, id: string, usuarioId: string) {
	const { data } = await locals.supabase
		.from('avisos')
		.select('id, titulo, estado, vence_el, anunciante_id, fotos(id, clave, orden)')
		.eq('id', id)
		.eq('anunciante_id', usuarioId)
		.maybeSingle<Aviso>();
	return data;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const usuario = await exigirUsuario(locals, url);
	const aviso = await cargar(locals, params.id, usuario.id);
	if (!aviso) error(404, 'Aviso no encontrado');

	const { data: perfil } = await locals.supabase
		.from('perfiles')
		.select('whatsapp')
		.eq('id', usuario.id)
		.single<{ whatsapp: string | null }>();

	aviso.fotos.sort((a, b) => a.orden - b.orden);
	return {
		aviso,
		tieneWhatsapp: !!perfil?.whatsapp,
		nuevo: url.searchParams.has('nuevo'),
		vencido:
			aviso.estado === 'publicado' && !!aviso.vence_el && new Date(aviso.vence_el) < new Date()
	};
};

/** Cambia el estado (o renueva). Las reglas las aplica la base de datos. */
async function cambiar(locals: App.Locals, id: string, cambios: Record<string, unknown>) {
	const usuario = await locals.usuario();
	if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });
	const { error: e } = await locals.supabase
		.from('avisos')
		.update(cambios)
		.eq('id', id)
		.eq('anunciante_id', usuario.id);
	if (e) return fail(400, { mensaje: mensajeDeError(e) });
	return { ok: true };
}

export const actions: Actions = {
	publicar: async ({ locals, params }) => {
		const r = await cambiar(locals, params.id, { estado: 'publicado' });
		// La página muestra el festejo con esto, sin depender de la dirección.
		return isActionFailure(r) ? r : { ok: true, publicado: true };
	},
	pausar: ({ locals, params }) => cambiar(locals, params.id, { estado: 'pausado' }),
	alquilado: ({ locals, params }) => cambiar(locals, params.id, { estado: 'alquilado' }),
	// La base fija el vencimiento en 30 días desde hoy, sin importar el valor que se mande.
	renovar: ({ locals, params }) =>
		cambiar(locals, params.id, { vence_el: new Date().toISOString() }),

	borrarFoto: async ({ locals, params, request }) => {
		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });
		const fotoId = texto(await request.formData(), 'foto_id');
		const { data: foto, error: e } = await locals.supabase
			.from('fotos')
			.delete()
			.eq('id', fotoId)
			.eq('aviso_id', params.id)
			.select('clave')
			.maybeSingle<{ clave: string }>();
		if (e) return fail(400, { mensaje: mensajeDeError(e) });
		if (foto) await bucket().delete(foto.clave);
		return { ok: true };
	},

	portada: async ({ locals, params, request }) => {
		// Pone la foto elegida primera y corre las demás.
		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });
		const fotoId = texto(await request.formData(), 'foto_id');
		const aviso = await cargar(locals, params.id, usuario.id);
		if (!aviso) return fail(404, { mensaje: 'Aviso no encontrado' });
		const orden = [...aviso.fotos].sort((a, b) => a.orden - b.orden).map((f) => f.id);
		if (!orden.includes(fotoId)) return fail(400, { mensaje: 'Foto inválida' });
		const nuevo = [fotoId, ...orden.filter((x) => x !== fotoId)];
		for (const [i, id] of nuevo.entries()) {
			await locals.supabase.from('fotos').update({ orden: i }).eq('id', id);
		}
		return { ok: true };
	},

	borrar: async ({ locals, params }) => {
		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });
		const { data, error: e } = await locals.supabase
			.from('avisos')
			.delete()
			.eq('id', params.id)
			.eq('anunciante_id', usuario.id)
			.select('id');
		if (e || !data?.length) return fail(400, { mensaje: 'No se pudo borrar.' });
		await borrarCarpetaDelAviso(params.id);
		redirect(303, '/mis-avisos');
	}
};
