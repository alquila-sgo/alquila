import { fail, redirect } from '@sveltejs/kit';
import { VALORES_VACIOS, type Localidad } from '#lib/avisos.js';
import { leerFormularioAviso, mensajeDeError, validarAviso } from '#lib/server/avisos.js';
import { exigirUsuario } from '#lib/server/sesion.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await exigirUsuario(locals, url);
	const { data: localidades, error } = await locals.supabase
		.from('localidades')
		.select('id, nombre, departamento')
		.order('nombre')
		.returns<Localidad[]>();
	if (error) throw new Error(`No se pudieron leer las localidades: ${error.message}`);
	return { localidades, inicial: VALORES_VACIOS };
};

export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		await exigirUsuario(locals, url);
		const valores = leerFormularioAviso(await request.formData());
		const r = validarAviso(valores);
		if (!r.ok) return fail(400, { valores, errores: r.errores });

		const { data: aviso, error } = await locals.supabase
			.from('avisos')
			.insert(r.datos.aviso)
			.select('id')
			.single<{ id: string }>();
		if (error) return fail(500, { valores, errores: {}, mensaje: mensajeDeError(error) });

		const { error: errorPrivado } = await locals.supabase
			.from('avisos_privado')
			.insert({ aviso_id: aviso.id, ...r.datos.privado });
		if (errorPrivado) {
			await locals.supabase.from('avisos').delete().eq('id', aviso.id);
			return fail(500, { valores, errores: {}, mensaje: mensajeDeError(errorPrivado) });
		}

		redirect(303, `/mis-avisos/${aviso.id}?nuevo=1`);
	}
};
