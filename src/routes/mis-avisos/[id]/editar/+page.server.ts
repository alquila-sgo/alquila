import { error, fail, redirect } from '@sveltejs/kit';
import type { Localidad } from '#lib/avisos.js';
import {
	filaAValores,
	leerFormularioAviso,
	mensajeDeError,
	validarAviso
} from '#lib/server/avisos.js';
import { exigirUsuario } from '#lib/server/sesion.js';
import type { Actions, PageServerLoad } from './$types';

type Privado = { lat: number; lng: number; direccion: string | null; mostrar_exacta: boolean };

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const usuario = await exigirUsuario(locals, url);
	const [{ data: aviso }, { data: privado }, { data: localidades }] = await Promise.all([
		locals.supabase
			.from('avisos')
			.select('*')
			.eq('id', params.id)
			.eq('anunciante_id', usuario.id)
			.maybeSingle<Record<string, unknown>>(),
		locals.supabase
			.from('avisos_privado')
			.select('lat, lng, direccion, mostrar_exacta')
			.eq('aviso_id', params.id)
			.maybeSingle<Privado>(),
		locals.supabase
			.from('localidades')
			.select('id, nombre, departamento')
			.order('nombre')
			.returns<Localidad[]>()
	]);
	if (!aviso) error(404, 'Aviso no encontrado');
	return { id: params.id, inicial: filaAValores(aviso, privado), localidades: localidades ?? [] };
};

export const actions: Actions = {
	default: async ({ locals, request, params, url }) => {
		const usuario = await exigirUsuario(locals, url);
		const valores = leerFormularioAviso(await request.formData());
		const r = validarAviso(valores);
		if (!r.ok) return fail(400, { valores, errores: r.errores });

		const { data, error: e } = await locals.supabase
			.from('avisos')
			.update(r.datos.aviso)
			.eq('id', params.id)
			.eq('anunciante_id', usuario.id)
			.select('id');
		if (e || !data?.length) {
			return fail(400, {
				valores,
				errores: {},
				mensaje: mensajeDeError(e) || 'No se pudo guardar.'
			});
		}

		const { error: e2 } = await locals.supabase
			.from('avisos_privado')
			.upsert({ aviso_id: params.id, ...r.datos.privado });
		if (e2) return fail(400, { valores, errores: {}, mensaje: mensajeDeError(e2) });

		redirect(303, `/mis-avisos/${params.id}`);
	}
};
