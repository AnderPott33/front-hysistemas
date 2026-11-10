import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export type TipoAsiento = "PAGO" | "RECIBIMIENTO" | "SAQUE" | "DEPOSITO" | "TRANSFERENCIA" | "AJUSTE";
export type Naturaleza = "Débito" | "Crédito";

/** Payload que espera POST /api/asientos/asientos (sin usuarioId: lo agrega el backend) */
export interface AsientoNuevo {
    movimientoId?: number | null;
    tipoAsiento: TipoAsiento;
    cajaId?: number | null;
    cuentaId?: number | null;
    forma_pago: string;
    cajaMovimiento?: number;
    subcategoriaId?: number | null;
    naturaleza: Naturaleza;
    monedaId: number;
    valor: number;
    tipoCambioId?: number | null;
    cambio?: number | null;
    valorConvertido?: number | null;
    valorContable: number;
    personaId?: number | null;
    tituloId?: number | null;
    documentoId?: number | null;
    documento?: string | null;
    vencimiento?: string | null;
    historico?: string | null;
    fechaContable?: string | null;
}

export interface InterfaceRegistrarAsientosRespuesta {
    ids: number[];
}

/** Respuesta de GET /api/extractoCajaBanco/cuenta/:id/saldo */
export interface InterfaceSaldoCuentaRespuesta {
    cuenta_id: number;
    saldo: number;
}

export const obtenerExtractoCuenta = async (
    token: string,
    consolidado: boolean,
    moneda_id: number | null,
    fecha_inicio: string,
    fecha_fin: string,
    entidad?: string,
    caja_id?: number | null,
    cuenta_id?: number | null,
) => {
    try {
        const result = await axios.post(
            `${API}/api/extractoCajaBanco`,
            {
                moneda_id,
                fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null,
                entidad: entidad ?? null,
                caja_id: caja_id ?? null,
                cuenta_id: cuenta_id ?? null,
                consolidado: consolidado,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return result.data;
    } catch (error) {
        console.error("Error al obtener extracto caja/banco:", error);
        throw error;
    }
};

export const obtenerSaldoCuenta = async (
    token: string,
    cuentaId: number
): Promise<InterfaceSaldoCuentaRespuesta> => {
    try {
        const result = await axios.get(
            `${API}/api/extractoCajaBanco/cuenta/${cuentaId}/saldo`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return result.data;
    } catch (error) {
        console.error("Error al obtener saldo de la cuenta:", error);
        throw error;
    }
};

export const registrarAsientos = async (
    token: string,
    asientos: AsientoNuevo[]
): Promise<InterfaceRegistrarAsientosRespuesta> => {
    try {
        const result = await axios.post(
            `${API}/api/asientos/asientos`,
            asientos,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return result.data;
    } catch (error) {
        console.error("Error al registrar asientos:", error);
        throw error;
    }
};

import type { InterfaceAsiento } from "../interfaces/extractoCuentaInterface";

/** Respuesta de GET /api/asientos/asientos/:id (asiento con joins de cuenta, caja y usuarios) */
export interface InterfaceAsientoDetalle extends Omit<InterfaceAsiento, "creado_por" | "cancelado_por"> {
    grupo_id: string | null;

    // Puede venir sin estos campos si el backend no los trae; se normalizan en el front
    creado_por: number | null;
    cancelado_por: number | null;

    // Datos de cuenta y caja (join en el backend)
    cuenta_nombre?: string | null;
    cuenta_numero?: string | null;
    cuenta_tipo?: string | null;
    cuenta_banco?: string | null;
    cuenta_moneda_id?: number | null;
    caja_descripcion?: string | null;

    // Datos de usuarios: quien creó y quien canceló
    creado_por_id?: number | null;
    creado_por_nombre?: string | null;
    creado_por_email?: string | null;
    cancelado_por_id?: number | null;
    cancelado_por_nombre?: string | null;
    cancelado_por_email?: string | null;

    /** Todos los asientos del grupo (incluye el propio) */
    grupo?: InterfaceAsientoDetalle[];
}

export const cancelarAsiento = async (
    token: string,
    id: number,
    motivo: string
): Promise<{ message: string; id: number; cancelados: number }> => {
    try {
        const result = await axios.patch(
            `${API}/api/asientos/asientos/${id}/cancelar`,
            { motivo },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return result.data;
    } catch (error) {
        console.error("Error al cancelar asiento:", error);
        throw error;
    }
};

export const obtenerAsiento = async (
    token: string,
    id: number
): Promise<InterfaceAsientoDetalle> => {
    try {
        const result = await axios.get(
            `${API}/api/asientos/asientos/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return result.data;
    } catch (error) {
        console.error("Error al obtener asiento:", error);
        throw error;
    }
};