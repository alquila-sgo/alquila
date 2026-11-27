/**
 * Achica y comprime una foto en el celular antes de subirla
 * (lado mayor 1600 px, WebP o JPEG). Ahorra datos en zonas con mala señal.
 */
export async function comprimirFoto(archivo: File, ladoMax = 1600): Promise<Blob> {
	const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
	const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
	const ancho = Math.round(bitmap.width * escala);
	const alto = Math.round(bitmap.height * escala);

	const canvas = document.createElement('canvas');
	canvas.width = ancho;
	canvas.height = alto;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('El navegador no puede procesar imágenes');
	ctx.drawImage(bitmap, 0, 0, ancho, alto);
	bitmap.close();

	const aBlob = (tipo: string, calidad: number) =>
		new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, calidad));

	// Algunos navegadores no generan WebP y devuelven PNG: en ese caso, JPEG.
	const webp = await aBlob('image/webp', 0.8);
	if (webp && webp.type === 'image/webp') return webp;
	const jpeg = await aBlob('image/jpeg', 0.82);
	if (!jpeg) throw new Error('No se pudo comprimir la foto');
	return jpeg;
}
