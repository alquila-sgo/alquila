/**
 * Convierte lo que escribe la persona al formato de wa.me para Argentina:
 * 549 + código de área sin 0 + número sin 15 (10 dígitos en total después de 549).
 * Devuelve null si no se puede interpretar con seguridad.
 */
export function normalizarWhatsapp(entrada: string): string | null {
	let d = entrada.replace(/\D/g, '');
	if (d.startsWith('549')) d = d.slice(3);
	else if (d.startsWith('54')) d = d.slice(2);
	if (d.startsWith('0')) d = d.slice(1);
	return /^[1-9]\d{9}$/.test(d) ? `549${d}` : null;
}

/** 5493854123456 → "385 412-3456" aprox., solo para mostrar. */
export function mostrarWhatsapp(numero: string | null): string {
	if (!numero) return '';
	return numero.startsWith('549') ? numero.slice(3) : numero;
}
