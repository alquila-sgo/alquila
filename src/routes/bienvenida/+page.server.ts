import { fail, redirect } from '@sveltejs/kit';
import { leerPerfil } from '#lib/server/perfil.js';
import { exigirUsuario } from '#lib/server/sesion.js';
import { destinoSeguro } from '#lib/server/supabase.js';
import { normalizarWhatsapp } from '#lib/whatsapp.js';
import { texto } from '#lib/formulario.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const usuario = await exigirUsuario(locals, url);
	const perfil = await leerPerfil(locals, usuario.id);
	return {
		nombre: perfil?.nombre ?? '',
		whatsapp: perfil?.whatsapp ?? null,
		next: destinoSeguro(url.searchParams.get('next'), '/')
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });

		const f = await request.formData();
		const nombre = texto(f, 'nombre');
		const whatsappTexto = texto(f, 'whatsapp');
		const errores: Record<string, string> = {};
		if (nombre.length < 2 || nombre.length > 80) errores.nombre = 'Escribí tu nombre.';
		const whatsapp = whatsappTexto ? normalizarWhatsapp(whatsappTexto) : null;
		if (whatsappTexto && !whatsapp) errores.whatsapp = 'Código de área sin 0 y número sin 15.';
		if (Object.keys(errores).length) return fail(400, { nombre, whatsappTexto, errores });

		const cambios: Record<string, unknown> = { nombre, datos_listos: true };
		if (whatsapp) cambios.whatsapp = whatsapp;
		const { error } = await locals.supabase.from('perfiles').update(cambios).eq('id', usuario.id);
		if (error) return fail(500, { nombre, whatsappTexto, mensaje: 'No se pudo guardar.' });

		redirect(303, destinoSeguro(texto(f, 'next'), '/'));
	}
};
