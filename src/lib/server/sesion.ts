import { redirect } from '@sveltejs/kit';

/** Devuelve el usuario o redirige a /ingresar y vuelve a la página actual después. */
export async function exigirUsuario(locals: App.Locals, url: URL) {
	const usuario = await locals.usuario();
	if (!usuario) redirect(303, `/ingresar?next=${encodeURIComponent(url.pathname + url.search)}`);
	return usuario;
}
