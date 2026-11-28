import { fail, redirect } from '@sveltejs/kit';
import { normalizarWhatsapp } from '#lib/whatsapp.js';
import { texto } from '#lib/formulario.js';
import type { Perfil } from '#lib/tipos.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const usuario = await locals.usuario();
	if (!usuario) redirect(303, `/ingresar?next=${encodeURIComponent(url.pathname)}`);

	const { data: perfil, error } = await locals.supabase
		.from('perfiles')
		.select('nombre, whatsapp, tipo, nombre_comercial, matricula, verificado')
		.eq('id', usuario.id)
		.single<Perfil>();
	if (error) throw new Error(`No se pudo leer el perfil: ${error.message}`);

	return { perfil };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });

		const f = await request.formData();
		const nombre = texto(f, 'nombre');
		const whatsappTexto = texto(f, 'whatsapp');
		const tipo = f.get('tipo') === 'inmobiliaria' ? 'inmobiliaria' : 'particular';
		const nombreComercial = texto(f, 'nombre_comercial');
		const matricula = texto(f, 'matricula');

		const errores: Record<string, string> = {};
		if (nombre.length < 2 || nombre.length > 80) errores.nombre = 'Escribí tu nombre.';
		const whatsapp = whatsappTexto ? normalizarWhatsapp(whatsappTexto) : null;
		if (whatsappTexto && !whatsapp) {
			errores.whatsapp = 'Escribí código de área sin 0 y número sin 15. Ej: 385 4123456';
		}
		if (tipo === 'inmobiliaria' && (nombreComercial.length < 2 || nombreComercial.length > 100)) {
			errores.nombre_comercial = 'Escribí el nombre de la inmobiliaria.';
		}
		if (matricula.length > 50) errores.matricula = 'Máximo 50 caracteres.';
		if (Object.keys(errores).length) return fail(400, { errores });

		const { error } = await locals.supabase
			.from('perfiles')
			.update({
				nombre,
				whatsapp,
				tipo,
				nombre_comercial: tipo === 'inmobiliaria' ? nombreComercial : null,
				matricula: tipo === 'inmobiliaria' && matricula ? matricula : null
			})
			.eq('id', usuario.id);
		if (error) return fail(500, { mensaje: 'No se pudo guardar. Probá de nuevo.' });

		// Guardado: directo a la portada.
		redirect(303, '/');
	}
};
