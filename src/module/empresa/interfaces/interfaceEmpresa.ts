export interface InterfaceEmpresa {
    id: number | string;
    ruc?: string;
    fantasia?: string;
    razon_social?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
    moneda_base?: number;
    id_csc?: number;
    csc?: string;
    contrasena_certificado?: string;
    regimen_contable?: string;
    actividad_economica?: InterfaceActividadEconomica[];
    cliente_predeterminado?: number;
    operacion_preseleccionada_compra?: number;
    operacion_preseleccionada_nota_fiscal?: number;
    operacion_preseleccionada_venta?: number;
    operacion_preseleccionada_ingreso?: number;
    operacion_preseleccionada_gasto?: number;
    activo?: boolean;
}

export interface InterfaceActividadEconomica {
    id: number | string;    
    nombre: string;
    fecha_inclusion: string;
}