import { redirect } from '@sveltejs/kit';
import { destinoSeguro } from '#lib/server/supabase.js';
import type { RequestHandler } from './$types';

// Supabase vuelve acá después de Google o del enlace del email.
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = destinoSeguro(url.searchParams.get('next'), '/cuenta');

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) redirect(303, next);
	}
	redirect(303, '/ingresar?error=enlace');
};
