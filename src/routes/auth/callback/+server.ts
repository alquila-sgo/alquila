import { redirect } from '@sveltejs/kit';
import { destinoSeguro } from '#lib/server/supabase.js';
import { exigirDatos } from '#lib/server/perfil.js';
import type { RequestHandler } from './$types';

// Supabase vuelve acá después de Google o del enlace del email.
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = destinoSeguro(url.searchParams.get('next'), '/cuenta');

	if (code) {
		const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Cuenta nueva: primero sus datos (nombre, WhatsApp y foto), después a donde iba.
			// Si viene a crear su contraseña, los datos se piden después (desde /clave).
			if (!next.startsWith('/clave')) await exigirDatos(locals, data.user.id, next);
			redirect(303, next);
		}
	}
	redirect(303, '/ingresar?error=enlace');
};
