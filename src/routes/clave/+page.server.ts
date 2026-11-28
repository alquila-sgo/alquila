import { fail, redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import { exigirDatos } from '#lib/server/perfil.js';
import { destinoSeguro } from '#lib/server/supabase.js';
import { texto } from '#lib/formulario.js';
import type { Actions, PageServerLoad } from './$types';

const TIPOS: EmailOtpType[] = ['email', 'signup', 'magiclink', 'recovery'];

// Crear contraseña. Llega desde el enlace del mail (con token_hash, en cualquier
// dispositivo) o con la sesión ya abierta.
export const load: PageServerLoad = async ({ locals, url }) => {
	const tokenHash = url.searchParams.get('token_hash') ?? '';
	const next = destinoSeguro(url.searchParams.get('next'), '/cuenta');
	if (tokenHash) {
		const tipo = url.searchParams.get('type') ?? 'email';
		return { tokenHash, tipo, email: null, next };
	}
	// Sin sesión: la trae el enlace después del # (la lee la página en el navegador).
	const usuario = await locals.usuario();
	return { tokenHash: '', tipo: '', email: usuario?.email ?? null, next };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const f = await request.formData();
		const clave = f.get('clave');
		const repetida = f.get('repetida');
		// Primero se revisa la contraseña: así el enlace no se gasta si hay un error de tipeo.
		if (typeof clave !== 'string' || clave.length < 8) {
			return fail(400, { mensaje: 'La contraseña tiene que tener al menos 8 caracteres.' });
		}
		if (clave.length > 72) return fail(400, { mensaje: 'Máximo 72 caracteres.' });
		if (clave !== repetida) return fail(400, { mensaje: 'Las dos contraseñas no coinciden.' });

		const tokenHash = texto(f, 'token_hash');
		const accessToken = texto(f, 'access_token');
		const refreshToken = texto(f, 'refresh_token');
		if (accessToken && refreshToken) {
			// Si había otra cuenta abierta en este dispositivo, se cierra para dar lugar a esta.
			if (await locals.usuario()) await locals.supabase.auth.signOut({ scope: 'local' });
			const { error } = await locals.supabase.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken
			});
			if (error) {
				return fail(400, {
					vencido: true,
					mensaje: 'El enlace venció o ya se usó. Pedí uno nuevo desde Ingresar.'
				});
			}
		} else if (tokenHash) {
			// Si había otra cuenta abierta en este dispositivo, se cierra para dar lugar a esta.
			if (await locals.usuario()) await locals.supabase.auth.signOut({ scope: 'local' });
			const tipo = texto(f, 'tipo');
			const { error } = await locals.supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: TIPOS.includes(tipo) ? tipo : 'email'
			});
			if (error) {
				return fail(400, {
					vencido: true,
					mensaje: 'El enlace venció o ya se usó. Pedí uno nuevo desde Ingresar.'
				});
			}
		}

		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });

		const { error } = await locals.supabase.auth.updateUser({ password: clave });
		if (error) {
			return fail(400, {
				mensaje:
					error.code === 'same_password'
						? 'Es igual a la anterior. Elegí otra.'
						: error.code === 'weak_password'
							? 'Es muy fácil de adivinar. Probá con otra más larga.'
							: 'No se pudo guardar. Probá de nuevo.'
			});
		}

		const next = destinoSeguro(texto(f, 'next'), '/cuenta');
		await exigirDatos(locals, usuario.id, next);
		redirect(303, next);
	}
};
