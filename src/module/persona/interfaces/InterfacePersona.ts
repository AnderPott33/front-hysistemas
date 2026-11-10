export type TipoPersona = 'Física' | 'Jurídica';
export interface InterfacePersona {
    id: number | string;
	tipo_persona: TipoPersona,
	nombre: string,
	razon_social: string,
	cedula: number | null,
	ruc: string,
	email: string,
	telefono: string,
	direccion: string,
	ciudad: string,
	departamento: string,
	pais: string,
	categoria: string,
	activo: boolean,
	observacion: string,
	creado_en?: string,
	actualizado_en?: string,
}

export interface DatosBaja {
    id: string | number;
    estado: string;
    fecha: string;
    moneda_codigo: string | number;
    tipo_cuenta?: string;
    descripcion: string;
    cuenta: string;
    total_valor: number;
}