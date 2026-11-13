import type { InterfaceUsuarios } from "../../usuarios/interfaces/usuariosInterfaces";

export type typeEstado = 'Efectivado' | 'Cancelado' | 'Iniciado';
export type typeAfectado = 'Caja' | 'Cuenta' | '';
export type typeRecibimiento = 'Recibimiento' | 'Pago' | '';

export interface InterfaceMovimiento {
    id: number | string;
    caja_id: number;
    tipo_movimiento: string;
    fecha: string;
    usuario_id: number;
    moneda_id: number;
    usuario?: InterfaceUsuarios | null;
    estado: typeEstado
    motivo_cancelado?: string;
    observacion: string;
    total_credito?: number;
    total_debito?: number;
}

export interface InterfaceBajaCaja {
    id: number | string;
    movimiento_id?: number,
    naturaleza_financiera: string;
    forma_pago: string;
    moneda_id: number,
    caja_id: number,
    valor: number,
    vuelto: number,
    cambio: number,
    valor_contable: number,
}

export interface InterfaceBaja {
    id: number | string;
    operacion: string;
    naturaleza_financiera: string;
    forma_pago: string;
    moneda_id: number;
    cuenta_id?: number | null;
    categoria_id?: number | null;
    valor: number;
    valor_liquido: number;
    cambio: number;
    valor_contable: number;
    valor_convertido: number;
    interes: number;
    descuento: number;
    titulo_id?: number | null;
    documento_id?: number | null;
    documento?: string;
    persona_id?: number | null;
    compensado?: boolean;
    emision: string;
    fecha_compensacion?: string | null;
    vencimiento?: string | null;
    observacion?: string;
    observacion_auto?: string;
}

export interface InterfaceDocumento {
    id: number | string;
    naturaleza_contable: string;
    tipo_documento: string;
    condicion_documento: string;
    numero_documento: string;
    gravadas_0: number;
    gravadas_5: number;
    gravadas_10: number;
    iva_0: number;
    iva_5: number;
    iva_10: number;
    valor_documento: number;
}

export interface InterfacePayload {
    formMovimiento: InterfaceMovimiento | undefined;
    formBaja: InterfaceBaja[];
    formBajaCaja: InterfaceBajaCaja[];
}

/** Operación y forma de pago de los lanzamientos de crédito de persona */
export const OPERACION_LANZAMIENTO_CREDITO = 'LANZAMIENTO_CREDITO';
export const FORMA_PAGO_LANZAMIENTO_CREDITO = 'Lanzamiento Crédito Persona';

export const esLanzamientoCredito = (b: { operacion?: string | null }): boolean =>
    b?.operacion === OPERACION_LANZAMIENTO_CREDITO;
