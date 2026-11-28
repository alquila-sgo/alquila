import { error, fail, redirect } from '@sveltejs/kit';
import { mensajeDeError } from '#lib/server/avisos.js';
import type { Actions, PageServerLoad } from './$types';

export interface AvisoPublico {
	id: string;
	anunciante_id: string;
	estado: string;
	vence_el: string | null;
	titulo: string;
	tipo_propiedad: string;
	localidad_otra: string | null;
	barrio: string | null;
	descripcion: string | null;
	consultar_precio: boolean;
	precio: number | null;
	moneda: 'ARS' | 'USD' | null;
	expensas: number | null;
	sin_expensas: boolean;
	ambientes: number;
	dormitorios: number;
	banos: number | null;
	superficie_m2: number | null;
	mascotas: string;
	amueblado: string | null;
	garantias: string[];
	meses_deposito: number | null;
	requisitos: string | null;
	agua: boolean;
	luz: boolean;
	gas_natural: boolean;
	internet: boolean;
	aire_acondicionado: boolean;
	cochera: boolean;
	patio: boolean;
	pileta: boolean;
	otros_servicios: string | null;
	contacto_whatsapp: boolean;
	lat_publica: number | null;
	lng_publica: number | null;
	ubicacion_exacta: boolean;
	localidades: { nombre: string } | null;
	fotos: { id: string; clave: string; orden: number }[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
	// El RLS deja ver los avisos publicados y vigentes, y los propios (para la vista previa).
	const [{ data: aviso }, usuario] = await Promise.all([
		locals.supabase
			.from('avisos')
			.select('*, localidades(nombre), fotos(id, clave, orden)')
			.eq('id', params.id)
			.maybeSingle<AvisoPublico>(),
		locals.usuario()
	]);
	if (!aviso) error(404, 'Este aviso no existe o ya no está publicado.');

	aviso.fotos.sort((a, b) => a.orden - b.orden);
	const visible =
		aviso.estado === 'publicado' && !!aviso.vence_el && new Date(aviso.vence_el) > new Date();
	return { aviso, visible, esMio: usuario?.id === aviso.anunciante_id };
};

export const actions: Actions = {
	// El número se pide a la base (exige cuenta y registra el contacto); nunca va en la página.
	whatsapp: async ({ locals, params, url }) => {
		const usuario = await locals.usuario();
		if (!usuario) redirect(303, `/ingresar?next=${encodeURIComponent(url.pathname)}`);
		const r = await locals.supabase.rpc('obtener_whatsapp', { p_aviso: params.id });
		const numero: unknown = r.data;
		const e = r.error;
		if (e || typeof numero !== 'string') {
			return fail(400, { mensaje: mensajeDeError(e) || 'No se pudo abrir WhatsApp.' });
		}
		const texto = `Hola, vi tu aviso en Alquilá Sgo: ${url.origin}/aviso/${params.id}`;
		redirect(303, `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`);
	}
};
