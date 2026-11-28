import { fotoDe, leerPerfil } from '#lib/server/perfil.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const usuario = await locals.usuario();
	if (!usuario) return { usuario: null };
	const perfil = await leerPerfil(locals, usuario.id);
	return {
		usuario: { ...usuario, foto: fotoDe(perfil, usuario.foto), nombre: perfil?.nombre ?? '' }
	};
};
