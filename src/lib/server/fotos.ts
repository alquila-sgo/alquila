import { env } from 'cloudflare:workers';

/** Bucket de R2 con las fotos (definido en wrangler.jsonc como FOTOS). */
export function bucket(): R2Bucket {
	return env.FOTOS;
}

export const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB (las fotos llegan comprimidas)

/** Revisa los primeros bytes para confirmar que es WebP o JPEG de verdad. */
export function tipoReal(bytes: Uint8Array): 'image/webp' | 'image/jpeg' | null {
	if (bytes.length > 12) {
		const riff = String.fromCharCode(...bytes.slice(0, 4));
		const webp = String.fromCharCode(...bytes.slice(8, 12));
		if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
	}
	if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'image/jpeg';
	}
	return null;
}

/** Borra de R2 todas las fotos de un aviso. */
export async function borrarCarpetaDelAviso(avisoId: string) {
	const b = bucket();
	let cursor: string | undefined;
	do {
		const lista = await b.list({ prefix: `avisos/${avisoId}/`, cursor });
		if (lista.objects.length) await b.delete(lista.objects.map((o) => o.key));
		cursor = lista.truncated ? lista.cursor : undefined;
	} while (cursor);
}
