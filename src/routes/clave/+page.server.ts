import { fail, redirect } from '@sveltejs/kit';
import { exigirDatos } from '#lib/server/perfil.js';
import { exigirUsuario } from '#lib/server/sesion.js';
import { destinoSeguro } from '#lib/server/supabase.js';
import { texto } from '#lib/formulario.js';
import type { Actions, PageServerLoad } from './$types';

// Después de verificar el email: crea su contraseña (o una nueva, si la olvidó).
export const load: PageServerLoad = async ({ locals, url }) => {
	const usuario = await exigirUsuario(locals, url);
	return { email: usuario.email, next: destinoSeguro(url.searchParams.get('next'), '/cuenta') };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const usuario = await locals.usuario();
		if (!usuario) return fail(401, { mensaje: 'Tu sesión venció. Volvé a ingresar.' });

		const f = await request.formData();
		const clave = f.get('clave');
		const repetida = f.get('repetida');
		if (typeof clave !== 'string' || clave.length < 8) {
			return fail(400, { mensaje: 'La contraseña tiene que tener al menos 8 caracteres.' });
		}
		if (clave.length > 72) return fail(400, { mensaje: 'Máximo 72 caracteres.' });
		if (clave !== repetida) return fail(400, { mensaje: 'Las dos contraseñas no coinciden.' });

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
