import { error, json } from '@sveltejs/kit';
import { bucket, TAMANO_MAXIMO, tipoReal } from '#lib/server/fotos.js';
import { mensajeDeError } from '#lib/server/avisos.js';
import type { RequestHandler } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Recibe una foto ya comprimida en el celular y la guarda en R2.
export const POST: RequestHandler = async ({ locals, request }) => {
	const usuario = await locals.usuario();
	if (!usuario) error(401, 'Tu sesión venció. Volvé a ingresar.');

	const largo = Number(request.headers.get('content-length') ?? 0);
	if (largo > TAMANO_MAXIMO + 10_000) error(413, 'La foto es muy pesada.');

	const form = await request.formData();
	const avisoId = form.get('aviso_id');
	const archivo = form.get('archivo');
	if (typeof avisoId !== 'string' || !UUID.test(avisoId)) error(400, 'Aviso inválido.');
	if (!(archivo instanceof File) || archivo.size === 0) error(400, 'Falta la foto.');
	if (archivo.size > TAMANO_MAXIMO) error(413, 'La foto es muy pesada.');

	const bytes = new Uint8Array(await archivo.arrayBuffer());
	const tipo = tipoReal(bytes);
	if (!tipo) error(415, 'Formato no válido. Subí una foto JPG o WebP.');

	// Solo el dueño del aviso (la base lo vuelve a controlar con RLS).
	const { data: aviso } = await locals.supabase
		.from('avisos')
		.select('id')
		.eq('id', avisoId)
		.eq('anunciante_id', usuario.id)
		.maybeSingle();
	if (!aviso) error(404, 'Aviso no encontrado.');

	const { count } = await locals.supabase
		.from('fotos')
		.select('id', { count: 'exact', head: true })
		.eq('aviso_id', avisoId);

	const clave = `avisos/${avisoId}/${crypto.randomUUID()}.${tipo === 'image/webp' ? 'webp' : 'jpg'}`;

	// Primero la fila (la base controla el máximo de 15), después el archivo.
	const { data: fila, error: e } = await locals.supabase
		.from('fotos')
		.insert({ aviso_id: avisoId, clave, orden: count ?? 0 })
		.select('id')
		.single<{ id: string }>();
	if (e) error(400, mensajeDeError(e));

	try {
		await bucket().put(clave, bytes, { httpMetadata: { contentType: tipo } });
	} catch {
		await locals.supabase.from('fotos').delete().eq('id', fila.id);
		error(500, 'No se pudo guardar la foto. Probá de nuevo.');
	}

	return json({ id: fila.id, clave });
};
