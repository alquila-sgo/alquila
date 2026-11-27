import { exigirUsuario } from '#lib/server/sesion.js';
import type { PageServerLoad } from './$types';

interface Fila {
	id: string;
	titulo: string;
	estado: string;
	vence_el: string | null;
	fotos: { clave: string; orden: number }[];
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const usuario = await exigirUsuario(locals, url);
	const { data, error } = await locals.supabase
		.from('avisos')
		.select('id, titulo, estado, vence_el, fotos(clave, orden)')
		.eq('anunciante_id', usuario.id)
		.order('creado_el', { ascending: false })
		.returns<Fila[]>();
	if (error) throw new Error(`No se pudieron leer tus avisos: ${error.message}`);

	return {
		avisos: data.map((a) => ({
			...a,
			portada: [...a.fotos].sort((x, y) => x.orden - y.orden)[0]?.clave ?? null,
			vencido: a.estado === 'publicado' && !!a.vence_el && new Date(a.vence_el) < new Date()
		}))
	};
};
