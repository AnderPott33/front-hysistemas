export type tipoCategoria = 'Ingreso' | 'Gasto';

export interface InterfaceCategoria {
    id: number;
    codigo?: string | null;
    nombre: string;
    tipo: tipoCategoria;
    activo: boolean;
    creado_en?: string;
    actualizado_en?: string;
}

export interface InterfaceCategoriaForm {
    id?: number;
    codigo?: string | null;
    nombre: string;
    tipo: tipoCategoria;
    activo: boolean;
}

export interface InterfaceSubcategoria {
    id: number;
    codigo?: string | null;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
    categoria_id: number;
    categoria?: {
        id: number;
        codigo?: string | null;
        nombre: string;
        tipo: tipoCategoria;
    } | null;
    creado_en?: string;
    actualizado_en?: string;
}

export interface InterfaceSubcategoriaForm {
    id?: number;
    codigo?: string | null;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
    categoria_id: number;
    // Tipo de la categoría con la que se cargó la fila (determina la tabla actual). Requerido al editar.
    tipo_origen?: tipoCategoria;
}
