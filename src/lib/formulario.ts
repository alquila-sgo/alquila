/** Lee un campo de texto de un formulario (los archivos se ignoran). */
export function texto(form: FormData, campo: string): string {
	const v = form.get(campo);
	return typeof v === 'string' ? v.trim() : '';
}
