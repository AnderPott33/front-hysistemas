import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export interface InterfaceSaldoCredito {
    moneda_id: number;
    codigo: string;
    nombre: string;
    simbolo: string;
    decimales: number;
    saldo: number;
}

export interface InterfaceCreditoPersona {
    persona_id: number;
    limite_credito: number;
    deuda_base: number;
    bloqueado: boolean;
    saldos: InterfaceSaldoCredito[];
}

export interface LineaCreditoNueva {
    moneda_id: number;
    naturaleza: "Credito" | "Debito";
    valor: number;
    cambio: number;
    observacion?: string | null;
}

export const obtenerCreditoPersona = async (token: string, personaId: number) => {
    const { data } = await axios.get<InterfaceCreditoPersona>(
        `${API}/api/personas/${personaId}/credito`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
};

export const registrarCreditoPersona = async (
    token: string,
    personaId: number,
    payload: { grupo_id: string; tipo: string; movimiento_id?: number | null; lineas: LineaCreditoNueva[] }
) => {
    const { data } = await axios.post(`${API}/api/personas/${personaId}/credito`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return data;
};
