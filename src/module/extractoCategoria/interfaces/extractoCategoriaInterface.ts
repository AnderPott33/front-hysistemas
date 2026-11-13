export type tipoEntidadExtracto = 'Caja' | 'Cuenta';

export interface InterfaceExtractoFiltros {
    entidad?: tipoEntidadExtracto | null;
    caja_id?: number | null;
    cuenta_id?: number | null;
    moneda_id?: number | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    consolidado?: boolean | null;
}

export interface InterfaceExtractoSaldoAnterior {
    entidad: tipoEntidadExtracto;
    entidad_id: number;
    moneda_id: number;
    saldo_anterior: number | string;
}

export interface InterfaceExtractoMovimiento {
    id: number | string;
    asiento_id: number | string;
    entidad: tipoEntidadExtracto;
    entidad_id: number;
    moneda_id: number;
    movimiento_id: number | string | null;
    fecha: string | null;
    detalle_id: number | string | null;
    descripcion: string | null;
    descripcion_baja: string | null;
    forma_pago: string | null;
    entrada: number | string | null;
    salida: number | string | null;
    saldo: number | string;

    // Usuario que creó el asiento (join con usuarios en el backend)
    creado_por: number | null;
    creado_por_nombre: string | null;
    creado_por_email: string | null;
}

export interface InterfaceTotalFormaPago {
    forma_pago: string | null;
    saldo_anterior: number | string;
    total_entrada: number | string;
    total_salida: number | string;
    saldo_final: number | string;
}

export interface InterfaceExtractoRespuesta {
    saldos_anteriores: InterfaceExtractoSaldoAnterior[];
    movimientos: InterfaceExtractoMovimiento[];
    totales_forma_pago: InterfaceTotalFormaPago[];
}

export interface InterfaceAsiento {
    id: number;
    movimiento_id: number | null;
    tipo_asiento: string;
    caja_id: number | null;
    cuenta_id: number | null;
    forma_pago: string | null;
    caja_movimiento: number;
    subcategoria_id: number | null;
    naturaleza: "Débito" | "Crédito";
    moneda_id: number;
    valor: number;
    tipo_cambio_id: number | null;
    cambio: number | null;
    valor_convertido: number | null;
    valor_contable: number;
    persona_id: number | null;
    titulo_id: number | null;
    documento_id: number | null;
    documento: string | null;
    vencimiento: string | null;
    historico: string | null;
    emision: string;
    compensacion: string | null;
    fecha_contable: string;
    estado: "Efectivado" | "Cancelado";
    fecha_cancelacion: string | null;
    motivo_cancelacion: string | null;
    cancelado_por: number | null;
    creado_por: number;
    creado_en: string;
    actualizado_por: number | null;
    actualizado_en: string | null;
}