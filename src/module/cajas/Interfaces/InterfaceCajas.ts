export interface InterfaceCajas {
    id: number | string;
    estado: string;
    apertura: string | Date;
    cierre?: string | Date | null;
    descripcion?: string;
    usuario_id?: number;
    usuario?: string;
    creado_en?: string;
}