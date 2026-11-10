import axios from "axios";
import type { InterfaceMoneda, InterfaceTipoCambio, MonedaAPI, MonedaAPIP, RespuestaCotizaciones, TipoPrecio } from "../interfaces/InterfaceMoneda";
import { formatarDataInput } from "../../../components/utils/Formatadores";

const API = import.meta.env.VITE_API_URL;
const APICAMBIOS = 'https://www.cambioschaco.com.py/api/branch_office/27/exchange'

// ─── Moneda ───────────────────────────────────────────────────────────────────

export const obtenerMonedas = async (token: string) => {
    const result = await axios.get(`${API}/api/moneda`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};
export const cambiosHoy = async (token: string) => {
    const result = await axios.get(`${API}/api/moneda/cambioHoy`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};
export const obtenerMonedasActivas = async (token: string) => {
    const result = await axios.get(`${API}/api/moneda/activas`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const obtenerMonedaId = async (token: string, id: number) => {
    const result = await axios.get(`${API}/api/moneda/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const guardarMoneda = async (token: string, moneda: InterfaceMoneda) => {
    const result = await axios.post(`${API}/api/moneda`, moneda, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

// ─── Tipo de cambio ───────────────────────────────────────────────────────────

export const obtenerTiposCambio = async (token: string) => {
    const result = await axios.get(`${API}/api/moneda/tipo-cambio`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const obtenerTipoCambioVigente = async (token: string, origen: number, destino: number, fecha: string) => {
    const datosTodos = { origen, destino, fecha };
    const result = await axios.post(`${API}/api/moneda/tipo-cambio/vigente`, datosTodos, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const obtenerTipoCambioId = async (token: string, id: number) => {
    const result = await axios.get(`${API}/api/moneda/tipo-cambio/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const guardarTipoCambio = async (token: string, tipoCambio: InterfaceTipoCambio) => {
    const result = await axios.post(`${API}/api/moneda/tipo-cambio`, tipoCambio, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};


export const obtenerCotizacionActual = async (): Promise<RespuestaCotizaciones | null> => {
    try {
        const { data } = await axios.get<RespuestaCotizaciones>(APICAMBIOS);
        return data;
    } catch (error) {
        console.error("Error al consultar cotizaciones:", error);
        return null;
    }
};

// Precio de una moneda expresado en guaraníes (PYG vale 1)
const precioEnPYG = (items: MonedaAPI[], iso: string, tipo: TipoPrecio): number | null => {
    if (iso === "PYG") return 1;
    const item = items.find(i => i.isoCode === iso);
    if (!item) return null;
    const precio = tipo === "compra" ? item.purchasePrice : item.salePrice;
    return precio > 0 ? precio : null;
};

// Cuántas unidades de "destino" equivalen a 1 unidad de "origen"
export const obtenerCotizacionPorPar = async (
    origen: string,
    destino: string,
    tipo: TipoPrecio = "compra"
): Promise<number | null> => {
    const datos = await obtenerCotizacionActual();
    if (!datos) return null;

    const pOrigen = precioEnPYG(datos.items, origen, tipo);
    const pDestino = precioEnPYG(datos.items, destino, tipo);
    if (!pOrigen || !pDestino) return null;

    return Number((pOrigen / pDestino).toFixed(6));
};

export const obtenerSimboloMoneda = async (
    codigo: string
): Promise<MonedaAPIP | null> => {
    try {
        const { data } = await axios.get<MonedaAPIP>(
            `${APICAMBIOS}currency/${codigo}`
        );

        return data;
    } catch (error) {
        console.error('Error al obtener la moneda:', error);
        return null; // Evita que devuelva undefined
    }
};