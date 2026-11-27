import type { Handle } from '@sveltejs/kit/hooks';
import { crearClienteSupabase } from '#lib/server/supabase.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = crearClienteSupabase(event.cookies, (h) => event.setHeaders(h));

	// getClaims verifica la firma del token: no confiar en la cookie sin verificar.
	event.locals.usuario = async () => {
		const { data, error } = await event.locals.supabase.auth.getClaims();
		if (error || !data) return null;
		const c = data.claims;
		return { id: c.sub, email: typeof c.email === 'string' ? c.email : null };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
