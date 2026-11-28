import {
	AMUEBLADO,
	GARANTIAS,
	MAX_TITULO,
	LIMITES_PROVINCIA,
	montoATexto,
	SERVICIOS,
	TIPOS_PROPIEDAD,
	type ValoresAviso
} from '#lib/avisos.js';
import { texto } from '#lib/formulario.js';

const valoresDe = (lista: readonly (readonly [string, string])[]) => lista.map(([v]) => v);

/** Lee el formulario tal cual (para poder volver a mostrarlo si hay errores). */
export function leerFormularioAviso(f: FormData): ValoresAviso {
	const marcado = (c: string) => f.get(c) === 'on';
	const varios = (c: string, permitidos: string[]) =>
		f
			.getAll(c)
			.filter((v): v is string => typeof v === 'string')
			.filter((v) => permitidos.includes(v));
	return {
		titulo: texto(f, 'titulo'),
		tipo_propiedad: texto(f, 'tipo_propiedad'),
		tipo_otro: texto(f, 'tipo_otro'),
		localidad_id: texto(f, 'localidad_id'),
		localidad_otra: texto(f, 'localidad_otra'),
		barrio: texto(f, 'barrio'),
		descripcion: texto(f, 'descripcion'),
		consultar_precio: marcado('consultar_precio'),
		precio: texto(f, 'precio'),
		moneda: texto(f, 'moneda'),
		expensas: texto(f, 'expensas'),
		sin_expensas: marcado('sin_expensas'),
		ajuste: texto(f, 'ajuste'),
		cocina: texto(f, 'cocina'),
		cocina_comedor: texto(f, 'cocina_comedor'),
		comedor: texto(f, 'comedor'),
		dormitorios: texto(f, 'dormitorios'),
		banos: texto(f, 'banos'),
		superficie_m2: texto(f, 'superficie_m2'),
		mascotas: texto(f, 'mascotas'),
		estudiantes: texto(f, 'estudiantes'),
		max_adultos: texto(f, 'max_adultos'),
		max_ninos: texto(f, 'max_ninos'),
		sin_limite_personas: marcado('sin_limite_personas'),
		fumadores: texto(f, 'fumadores'),
		amueblado: texto(f, 'amueblado'),
		garantias: varios('garantias', valoresDe(GARANTIAS)),
		meses_deposito: texto(f, 'meses_deposito'),
		requisitos: texto(f, 'requisitos'),
		disponible_desde: texto(f, 'disponible_desde'),
		servicios: varios('servicios', valoresDe(SERVICIOS)),
		otros_servicios: texto(f, 'otros_servicios'),
		contacto_whatsapp: marcado('contacto_whatsapp'),
		contacto_formulario: marcado('contacto_formulario'),
		lat: texto(f, 'lat'),
		lng: texto(f, 'lng'),
		direccion: texto(f, 'direccion'),
		// Siempre se muestra la zona aproximada (unos 300 m).
		mostrar_exacta: false
	};
}

/** Número entero dentro de un rango, o undefined si está vacío. null = inválido. */
function entero(v: string, min: number, max: number): number | undefined | null {
	if (v === '') return undefined;
	const n = Number(v);
	return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Monto con hasta 2 decimales. Acepta "350.000" o "350000,50". */
function monto(v: string): number | undefined | null {
	if (v === '') return undefined;
	const limpio = v.replace(/\./g, '').replace(',', '.');
	const n = Number(limpio);
	return Number.isFinite(n) && n >= 0 && n < 1e12 ? Math.round(n * 100) / 100 : null;
}

export interface AvisoValidado {
	aviso: Record<string, unknown>;
	privado: { lat: number; lng: number; direccion: string | null; mostrar_exacta: boolean };
}

/** Valida y arma las filas para avisos y avisos_privado. */
export function validarAviso(
	v: ValoresAviso
): { ok: true; datos: AvisoValidado } | { ok: false; errores: Record<string, string> } {
	const e: Record<string, string> = {};

	if (!v.titulo) e.titulo = 'Escribí un título.';
	else if (v.titulo.length > MAX_TITULO) e.titulo = `Máximo ${MAX_TITULO} caracteres.`;
	// 'duplex' ya no se ofrece, pero los avisos viejos lo pueden tener.
	if (![...valoresDe(TIPOS_PROPIEDAD), 'duplex'].includes(v.tipo_propiedad))
		e.tipo_propiedad = 'Elegí un tipo.';
	const tipoOtro = v.tipo_propiedad === 'otro' ? v.tipo_otro : '';
	if (v.tipo_propiedad === 'otro' && tipoOtro.length < 2) {
		e.tipo_propiedad = 'Escribí qué alquilás.';
	} else if (tipoOtro.length > 60) e.tipo_propiedad = 'Máximo 60 caracteres.';
	// Una localidad de la lista o, si eligió "Otra", el nombre que escribió.
	const localidad = entero(v.localidad_id, 1, 1e9) || null;
	const otra = localidad ? '' : v.localidad_otra;
	if (!localidad && otra.length < 2) e.localidad_id = 'Elegí o escribí la localidad.';
	else if (otra.length > 80) e.localidad_id = 'Máximo 80 caracteres.';
	if (v.barrio.length > 80) e.barrio = 'Máximo 80 caracteres.';
	if (v.descripcion.length > 1000) {
		e.descripcion = 'Máximo 1000 caracteres.';
	}

	const precio = monto(v.precio);
	if (!v.consultar_precio) {
		if (!precio) e.precio = 'Escribí el precio o marcá "Consultar precio".';
		if (!['ARS', 'USD'].includes(v.moneda)) e.moneda = 'Elegí la moneda.';
	}
	const expensas = v.sin_expensas ? undefined : monto(v.expensas);
	if (expensas === null) e.expensas = 'Monto inválido.';
	else if (!v.sin_expensas && !expensas) {
		e.expensas = 'Indicá cuánto cobrás de expensas o marcá que no cobrás.';
	}
	if (v.ajuste.length > 120) e.ajuste = 'Máximo 120 caracteres.';

	const cocina = entero(v.cocina, 0, 10);
	if (cocina === null) e.cocina = 'Entre 0 y 10.';
	const cocinaComedor = entero(v.cocina_comedor, 0, 10);
	if (cocinaComedor === null) e.cocina_comedor = 'Entre 0 y 10.';
	const comedor = entero(v.comedor, 0, 10);
	if (comedor === null) e.comedor = 'Entre 0 y 10.';
	const dormitorios = entero(v.dormitorios, 0, 20);
	if (dormitorios === undefined || dormitorios === null) e.dormitorios = 'Entre 0 y 20.';
	// Ya no se pregunta: se calcula (dormitorios + comedores), mínimo 1.
	const ambientes = Math.min(
		20,
		Math.max(1, (dormitorios ?? 0) + (comedor ?? 0) + (cocinaComedor ?? 0))
	);
	const banos = entero(v.banos, 0, 10);
	if (banos === null) e.banos = 'Entre 0 y 10.';
	const superficie = entero(v.superficie_m2, 1, 100000);
	if (superficie === null) e.superficie_m2 = 'Número entero de m².';

	if (v.amueblado && !valoresDe(AMUEBLADO).includes(v.amueblado)) e.amueblado = 'Opción inválida.';
	const meses = entero(v.meses_deposito, 0, 12);
	if (meses === null) e.meses_deposito = 'Entre 0 y 12.';
	if (v.otros_servicios.length > 200) e.otros_servicios = 'Máximo 200 caracteres.';
	if (v.requisitos.length > 500) e.requisitos = 'Máximo 500 caracteres.';
	if (v.disponible_desde && !/^\d{4}-\d{2}-\d{2}$/.test(v.disponible_desde)) {
		e.disponible_desde = 'Fecha inválida.';
	}

	if (!v.contacto_whatsapp && !v.contacto_formulario) {
		e.contacto = 'Elegí al menos una forma de contacto.';
	}

	const lat = Number(v.lat);
	const lng = Number(v.lng);
	const L = LIMITES_PROVINCIA;
	if (
		v.lat === '' ||
		v.lng === '' ||
		!(lat >= L.latMin && lat <= L.latMax && lng >= L.lngMin && lng <= L.lngMax)
	) {
		e.ubicacion = 'Marcá en el mapa dónde está la propiedad (dentro de la provincia).';
	}
	if (v.direccion.length > 200) e.direccion = 'Máximo 200 caracteres.';

	if (Object.keys(e).length) return { ok: false, errores: e };

	const servicios = Object.fromEntries(
		valoresDe(SERVICIOS).map((s) => [s, v.servicios.includes(s)])
	);

	return {
		ok: true,
		datos: {
			aviso: {
				titulo: v.titulo,
				tipo_propiedad: v.tipo_propiedad,
				tipo_otro: tipoOtro || null,
				localidad_id: localidad,
				localidad_otra: otra || null,
				barrio: v.barrio || null,
				descripcion: v.descripcion || null,
				consultar_precio: v.consultar_precio,
				precio: v.consultar_precio ? null : precio,
				moneda: v.consultar_precio ? null : v.moneda,
				expensas: expensas ?? null,
				sin_expensas: v.sin_expensas,
				ajuste: v.ajuste || null,
				ambientes,
				cocina: cocina ?? 0,
				cocina_comedor: cocinaComedor ?? 0,
				comedor: comedor ?? 0,
				dormitorios,
				banos: banos ?? null,
				superficie_m2: superficie ?? null,
				amueblado: v.amueblado || null,
				garantias: v.garantias,
				meses_deposito: meses ?? null,
				requisitos: v.requisitos || null,
				disponible_desde: v.disponible_desde || null,
				...servicios,
				otros_servicios: v.otros_servicios || null,
				contacto_whatsapp: v.contacto_whatsapp,
				contacto_formulario: v.contacto_formulario
			},
			privado: {
				lat: Math.round(lat * 1e6) / 1e6,
				lng: Math.round(lng * 1e6) / 1e6,
				direccion: v.direccion || null,
				mostrar_exacta: v.mostrar_exacta
			}
		}
	};
}

/** Convierte una fila de la base (aviso + privado) a valores de formulario, para editar. */
export function filaAValores(
	a: Record<string, unknown>,
	p: { lat: number; lng: number; direccion: string | null; mostrar_exacta: boolean } | null
): ValoresAviso {
	const s = (x: unknown) => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : '');
	return {
		titulo: s(a.titulo),
		tipo_propiedad: s(a.tipo_propiedad),
		tipo_otro: s(a.tipo_otro),
		localidad_id: s(a.localidad_id),
		localidad_otra: s(a.localidad_otra),
		barrio: s(a.barrio),
		descripcion: s(a.descripcion),
		consultar_precio: a.consultar_precio === true,
		precio: montoATexto(a.precio),
		moneda: s(a.moneda) || 'ARS',
		expensas: montoATexto(a.expensas),
		sin_expensas: a.sin_expensas === true,
		ajuste: s(a.ajuste),
		cocina: s(a.cocina),
		cocina_comedor: s(a.cocina_comedor),
		comedor: s(a.comedor),
		dormitorios: s(a.dormitorios),
		banos: s(a.banos),
		superficie_m2: s(a.superficie_m2),
		// 'consultar' (avisos viejos) cuenta como sin responder.
		mascotas: a.mascotas === 'consultar' ? '' : s(a.mascotas),
		estudiantes: a.estudiantes === 'consultar' ? '' : s(a.estudiantes),
		max_adultos: s(a.max_adultos),
		max_ninos: s(a.max_ninos),
		sin_limite_personas: a.sin_limite_personas === true,
		fumadores: a.fumadores === 'consultar' ? '' : s(a.fumadores),
		amueblado: s(a.amueblado),
		garantias: Array.isArray(a.garantias) ? (a.garantias as string[]) : [],
		meses_deposito: s(a.meses_deposito) || '0',
		requisitos: s(a.requisitos),
		disponible_desde: s(a.disponible_desde),
		servicios: valoresDe(SERVICIOS).filter((x) => a[x] === true),
		otros_servicios: s(a.otros_servicios),
		contacto_whatsapp: a.contacto_whatsapp === true,
		contacto_formulario: a.contacto_formulario === true,
		lat: p ? String(p.lat) : '',
		lng: p ? String(p.lng) : '',
		direccion: p?.direccion ?? '',
		mostrar_exacta: p?.mostrar_exacta === true
	};
}

/** Convierte un error de Postgres (por ejemplo de un trigger) en un mensaje para la persona. */
export function mensajeDeError(error: { message: string; code?: string } | null): string {
	if (!error) return '';
	// Los triggers propios lanzan mensajes en castellano pensados para mostrar (código P0001).
	if (error.code === 'P0001') return error.message;
	return 'No se pudo guardar. Probá de nuevo.';
}
