import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Cookies } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$app/env/public';

/** Cliente de Supabase para una sola petición: lee y escribe la sesión en cookies. */
export function crearClienteSupabase(
	cookies: Cookies,
	setHeaders: (headers: Record<string, string>) => void
) {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		throw new Error(
			'Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example)'
		);
	}
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (aEscribir, headers) => {
				for (const { name, value, options } of aEscribir) {
					cookies.set(name, value, { ...options, path: '/' });
				}
				// Evita que un CDN guarde una respuesta con la sesión de otra persona.
				if (headers && Object.keys(headers).length > 0) setHeaders(headers);
			}
		}
	});
}

/** Solo permite volver a rutas internas (evita redirecciones a otros sitios). */
export function destinoSeguro(next: string | null | undefined, porDefecto = '/'): string {
	if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
		return porDefecto;
	}
	return next;
}

/**
 * Cliente solo para mandar el mail de verificación con el flujo "implicit": el enlace
 * devuelve la sesión en la dirección (#access_token…), así que sirve desde cualquier
 * dispositivo. (El flujo normal, PKCE, solo funciona en el mismo navegador que lo pidió.)
 */
export function crearClienteParaEnlace() {
	return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false }
	});
}
