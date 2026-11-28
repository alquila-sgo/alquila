import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { crearClienteParaEnlace, destinoSeguro } from '#lib/server/supabase.js';
import { texto } from '#lib/formulario.js';
import { exigirDatos } from '#lib/server/perfil.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (await locals.usuario()) redirect(303, destinoSeguro(url.searchParams.get('next'), '/cuenta'));
	return {
		error: url.searchParams.get('error'),
		next: destinoSeguro(url.searchParams.get('next'), '/cuenta')
	};
};

// El "next" viaja en un campo oculto: la URL de la acción (?/email) no conserva la consulta.
function urlDeVuelta(url: URL, form: FormData) {
	const next = destinoSeguro(texto(form, 'next'), '/cuenta');
	return `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export const actions: Actions = {
	google: async ({ locals, url, request }) => {
		const form = await request.formData();
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: urlDeVuelta(url, form) }
		});
		if (error || !data.url)
			return fail(500, { mensaje: 'No pudimos conectar con Google. Probá de nuevo.' });
		// Kit exige declarar a qué sitio externo se redirige: solo a Supabase.
		redirect(303, data.url, { external: [new URL(PUBLIC_SUPABASE_URL).origin] });
	},

	// Paso 1: el email. Si ya tiene contraseña se la pedimos; si no, mandamos el enlace
	// de verificación y después de abrirlo crea su contraseña en /clave.
	email: async ({ locals, url, request }) => {
		const form = await request.formData();
		const email = texto(form, 'email').toLowerCase();
		if (!emailValido(email)) return fail(400, { email, mensaje: 'Revisá el email.' });

		const r = await locals.supabase.rpc('estado_email', { p_email: email });
		const estado: unknown = r.data;
		if (estado === 'clave') return { email, pideClave: true };
		return enviarEnlace(url, form, email);
	},

	clave: async ({ locals, request }) => {
		const form = await request.formData();
		const email = texto(form, 'email').toLowerCase();
		const clave = form.get('clave');
		if (!emailValido(email) || typeof clave !== 'string' || !clave) {
			return fail(400, { email, pideClave: true, mensaje: 'Escribí tu contraseña.' });
		}
		const { data, error } = await locals.supabase.auth.signInWithPassword({
			email,
			password: clave
		});
		if (error) {
			return fail(error.status === 429 ? 429 : 400, {
				email,
				pideClave: true,
				mensaje:
					error.status === 429
						? 'Muchos intentos seguidos. Esperá unos minutos.'
						: 'La contraseña no es correcta.'
			});
		}
		const next = destinoSeguro(texto(form, 'next'), '/cuenta');
		await exigirDatos(locals, data.user.id, next);
		redirect(303, next);
	},

	// Volver a escribir otro email.
	cambiar: async ({ request }) => ({ email: texto(await request.formData(), 'email') }),

	// Olvidó la contraseña: el mismo enlace, que lo lleva a crear una nueva.
	olvide: async ({ url, request }) => {
		const form = await request.formData();
		const email = texto(form, 'email').toLowerCase();
		if (!emailValido(email)) return fail(400, { email, mensaje: 'Revisá el email.' });
		return enviarEnlace(url, form, email);
	}
};

function emailValido(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function enviarEnlace(url: URL, form: FormData, email: string) {
	const next = destinoSeguro(texto(form, 'next'), '/cuenta');
	const vuelta = `${url.origin}/auth/callback?next=${encodeURIComponent(`/clave?next=${encodeURIComponent(next)}`)}`;
	const { error } = await crearClienteParaEnlace().auth.signInWithOtp({
		email,
		options: { emailRedirectTo: vuelta }
	});
	if (error) {
		return fail(error.status === 429 ? 429 : 500, {
			email,
			mensaje:
				error.status === 429
					? 'Pediste muchos emails seguidos. Esperá unos minutos.'
					: 'No pudimos enviar el email. Probá de nuevo.'
		});
	}
	return { enviado: email };
}
