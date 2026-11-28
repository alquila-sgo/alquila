/**
 * Achica y comprime una foto en el celular antes de subirla
 * (lado mayor 1600 px, siempre JPEG). Ahorra datos en zonas con mala señal.
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
	// Fondo blanco: JPEG no tiene transparencia (si no, un PNG queda con fondo negro).
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, ancho, alto);
	ctx.drawImage(bitmap, 0, 0, ancho, alto);
	bitmap.close();

	// Siempre JPEG: se ve en todos lados y es lo que se guarda y se publica.
	const jpeg = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
	if (!jpeg) throw new Error('No se pudo comprimir la foto');
	return jpeg;
}
