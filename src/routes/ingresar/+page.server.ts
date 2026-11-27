import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { destinoSeguro } from '#lib/server/supabase.js';
import { texto } from '#lib/formulario.js';
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

	email: async ({ locals, url, request }) => {
		const form = await request.formData();
		const email = texto(form, 'email').toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
			return fail(400, { email, mensaje: 'Revisá el email.' });
		}
		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: urlDeVuelta(url, form) }
		});
		if (error) {
			return fail(error.status === 429 ? 429 : 500, {
				email,
				mensaje:
					error.status === 429
						? 'Pediste muchos enlaces seguidos. Esperá unos minutos.'
						: 'No pudimos enviar el email. Probá de nuevo.'
			});
		}
		return { enviado: email };
	}
};
