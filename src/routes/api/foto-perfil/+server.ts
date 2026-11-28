import { error, json } from '@sveltejs/kit';
import { bucket, TAMANO_MAXIMO, tipoReal } from '#lib/server/fotos.js';
import type { RequestHandler } from './$types';

// Recibe la foto de perfil ya comprimida en el celular, la guarda en R2 y borra la anterior.
export const POST: RequestHandler = async ({ locals, request }) => {
	const usuario = await locals.usuario();
	if (!usuario) error(401, 'Tu sesión venció. Volvé a ingresar.');

	const largo = Number(request.headers.get('content-length') ?? 0);
	if (largo > TAMANO_MAXIMO + 10_000) error(413, 'La foto es muy pesada.');

	const archivo = (await request.formData()).get('archivo');
	if (!(archivo instanceof File) || archivo.size === 0) error(400, 'Falta la foto.');
	if (archivo.size > TAMANO_MAXIMO) error(413, 'La foto es muy pesada.');
	const bytes = new Uint8Array(await archivo.arrayBuffer());
	const tipo = tipoReal(bytes);
	if (!tipo) error(415, 'Formato no válido. Subí una foto JPG o WebP.');

	const { data: antes } = await locals.supabase
		.from('perfiles')
		.select('foto_clave')
		.eq('id', usuario.id)
		.single<{ foto_clave: string | null }>();

	const clave = `perfiles/${usuario.id}/${crypto.randomUUID()}.${tipo === 'image/webp' ? 'webp' : 'jpg'}`;
	await bucket().put(clave, bytes, { httpMetadata: { contentType: tipo } });

	const { error: e } = await locals.supabase
		.from('perfiles')
		.update({ foto_clave: clave })
		.eq('id', usuario.id);
	if (e) {
		await bucket().delete(clave);
		error(500, 'No se pudo guardar la foto. Probá de nuevo.');
	}
	if (antes?.foto_clave) await bucket().delete(antes.foto_clave);
	return json({ clave });
};
