import { error } from '@sveltejs/kit';
import { bucket } from '#lib/server/fotos.js';
import type { RequestHandler } from './$types';

const CLAVE = /^(avisos|perfiles)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/;

// Sirve las fotos desde R2. Los nombres son únicos, así que se pueden guardar en caché para siempre.
export const GET: RequestHandler = async ({ params, request }) => {
	if (!CLAVE.test(params.clave)) error(404, 'No encontrada');

	const objeto = await bucket().get(params.clave, {
		onlyIf: request.headers.get('if-none-match')
			? { etagDoesNotMatch: request.headers.get('if-none-match')!.replace(/"/g, '') }
			: undefined
	});
	if (!objeto) error(404, 'No encontrada');

	const headers = new Headers({
		'cache-control': 'public, max-age=31536000, immutable',
		etag: objeto.httpEtag,
		'content-type': objeto.httpMetadata?.contentType ?? 'image/webp',
		'x-content-type-options': 'nosniff'
	});
	if (!('body' in objeto)) return new Response(null, { status: 304, headers });
	return new Response(objeto.body, { headers });
};
