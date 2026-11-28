// Opciones y textos compartidos entre el servidor y las páginas.

export const TIPOS_PROPIEDAD = [
	['departamento', 'Departamento'],
	['casa', 'Casa'],
	['monoambiente', 'Monoambiente'],
	['habitacion', 'Habitación'],
	['otro', 'Otro']
] as const;

export const MASCOTAS = [
	['si', 'Sí'],
	['no', 'No'],
	['consultar', 'A consultar']
] as const;

export const AMUEBLADO = [
	['no', 'No'],
	['si', 'Sí'],
	['parcial', 'Parcial']
] as const;

export const GARANTIAS = [
	['propietaria', 'Garante'],
	['recibo_sueldo', 'Recibo de sueldo']
] as const;

export const SERVICIOS = [
	['agua', 'Agua'],
	['luz', 'Luz'],
	['gas_natural', 'Gas natural'],
	['internet', 'Internet'],
	['aire_acondicionado', 'Aire acondicionado'],
	['cochera', 'Cochera'],
	['patio', 'Patio'],
	['pileta', 'Pileta']
] as const;

export const ESTADOS: Record<string, string> = {
	borrador: 'Borrador',
	publicado: 'Publicado',
	pausado: 'Pausado',
	alquilado: 'Alquilado',
	oculto: 'En revisión',
	rechazado: 'Rechazado'
};

/** Caja aproximada de la provincia (igual que en la base de datos). */
export const LIMITES_PROVINCIA = { latMin: -30.5, latMax: -25.0, lngMin: -65.5, lngMax: -61.0 };

/** Centro de Santiago del Estero capital, para abrir el mapa. */
export const CENTRO_CAPITAL = { lat: -27.7951, lng: -64.2615 };

export const MIN_FOTOS = 1;
export const MAX_FOTOS = 15;

/** Valores del formulario de aviso (todo como texto, como viene del form). */
export interface ValoresAviso {
	titulo: string;
	tipo_propiedad: string;
	localidad_id: string;
	localidad_otra: string;
	barrio: string;
	descripcion: string;
	consultar_precio: boolean;
	precio: string;
	moneda: string;
	expensas: string;
	sin_expensas: boolean;
	ajuste: string;
	ambientes: string;
	dormitorios: string;
	banos: string;
	superficie_m2: string;
	mascotas: string;
	amueblado: string;
	garantias: string[];
	meses_deposito: string;
	requisitos: string;
	disponible_desde: string;
	servicios: string[];
	otros_servicios: string;
	contacto_whatsapp: boolean;
	contacto_formulario: boolean;
	lat: string;
	lng: string;
	direccion: string;
	mostrar_exacta: boolean;
}

export const VALORES_VACIOS: ValoresAviso = {
	titulo: '',
	tipo_propiedad: 'departamento',
	localidad_id: '',
	localidad_otra: '',
	barrio: '',
	descripcion: '',
	consultar_precio: false,
	precio: '',
	moneda: 'ARS',
	expensas: '',
	sin_expensas: false,
	ajuste: '',
	ambientes: '1',
	dormitorios: '1',
	banos: '1',
	superficie_m2: '',
	mascotas: 'consultar',
	amueblado: 'no',
	garantias: [],
	meses_deposito: '',
	requisitos: '',
	disponible_desde: '',
	servicios: [],
	otros_servicios: '',
	contacto_whatsapp: true,
	contacto_formulario: true,
	lat: '',
	lng: '',
	direccion: '',
	mostrar_exacta: false
};

export interface Localidad {
	id: number;
	nombre: string;
	departamento: string;
}

/**
 * Pone el punto de miles mientras se escribe un monto: "350000" → "350.000".
 * Acepta decimales con coma ("1500,5" → "1.500,5"), hasta 2.
 */
export function formatearMiles(texto: string): string {
	const [entera = '', ...resto] = texto.replace(/[^\d,]/g, '').split(',');
	const digitos = entera.replace(/^0+(?=\d)/, '');
	const conPuntos = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	return resto.length ? `${conPuntos},${resto.join('').slice(0, 2)}` : conPuntos;
}

/** Número de la base (350000.5) → texto del formulario ("350.000,5"). */
export function montoATexto(n: unknown): string {
	if (n === null || n === undefined || n === '') return '';
	const num = Number(n);
	if (!Number.isFinite(num)) return '';
	return formatearMiles(String(num).replace('.', ','));
}
