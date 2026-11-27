export type TipoCuenta = 'particular' | 'inmobiliaria';

export interface Perfil {
	nombre: string;
	whatsapp: string | null;
	tipo: TipoCuenta;
	nombre_comercial: string | null;
	matricula: string | null;
	verificado: boolean;
}
