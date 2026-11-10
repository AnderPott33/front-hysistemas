import axios from "axios";
import type { InterfacePayload } from "../interfaces/interfacePago";

const API = import.meta.env.VITE_API_URL;

export const guardarFinanciero = async (token: string, payload: InterfacePayload) => {
    const result = await axios.post(`${API}/api/financiero/guardar`, { payload }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const obtenerFinancieros = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/financiero/financieros`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener Financieros:", error);
        throw error;
    }
};

export const obtenerFinancieroId = async (token: string, id: number) => {
    try {
        const result = await axios.post(`${API}/api/financiero/financiero/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener Financiero:", error);
        throw error;
    }
};

export const cancelarFinanciero = async (token: string, id: number, motivo: string) => {
    try {
        const result = await axios.patch(
            `${API}/api/financiero/financieros/${id}/cancelar`,
            { motivo },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return result.data;
    } catch (error) {
        console.error("Error al cancelar financiero:", error);
        throw error;
    }
};