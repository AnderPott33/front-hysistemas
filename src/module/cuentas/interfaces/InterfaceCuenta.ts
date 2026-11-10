import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";

export type tipoCuenta = 'Efectivo' | 'Banco';

export interface InterfaceCuenta {
    id: number;
    nombre: string;
    tipo: tipoCuenta;
    banco_nombre?: string | null;
    permite_lanzamiento_tarjeta: boolean;
    numero_cuenta?: string | null;
    saldo_inicial: number | string;
    saldo_actual?: number | string | null;
    moneda_id?: number | null;
    moneda?: InterfaceMoneda | null;
    activo: boolean;
    creado_en?: string;
    actualizado_en?: string;
}

export interface InterfaceCuentaForm {
    id?: number;
    nombre: string;
    tipo: tipoCuenta;
    permite_lanzamiento_tarjeta: boolean;
    banco_nombre?: string | null;
    numero_cuenta?: string | null;
    saldo_inicial: number;
    moneda_id: number;
    activo: boolean;
}
