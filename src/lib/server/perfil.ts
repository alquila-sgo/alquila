import { redirect } from '@sveltejs/kit';

export interface PerfilBasico {
	nombre: string;
	whatsapp: string | null;
	foto_clave: string | null;
	datos_listos: boolean;
}

export async function leerPerfil(locals: App.Locals, id: string) {
	const { data } = await locals.supabase
		.from('perfiles')
		.select('nombre, whatsapp, foto_clave, datos_listos')
		.eq('id', id)
		.maybeSingle<PerfilBasico>();
	return data;
}

/** Foto a mostrar: la subida por la persona o, si no hay, la de Google. */
export function fotoDe(perfil: PerfilBasico | null, fotoGoogle: string | null) {
	return perfil?.foto_clave ? `/fotos/${perfil.foto_clave}` : fotoGoogle;
}

/** Cuenta nueva: primero la pantalla de bienvenida (nombre, WhatsApp y foto). */
export async function exigirDatos(locals: App.Locals, id: string, destino: string) {
	const perfil = await leerPerfil(locals, id);
	if (perfil && !perfil.datos_listos) {
		redirect(303, `/bienvenida?next=${encodeURIComponent(destino)}`);
	}
	return perfil;
}
