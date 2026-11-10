import axios from "axios";
/* import type { InterfaceTimbrado } from "../interfaces/InterfaceTimbrado"; */

const API = import.meta.env.VITE_API_URL;

// ─── Timbrado ───────────────────────────────────────────────────────────────

export const crearActualizarTimbrado = async (timbrado: string, token: string) => {
    try {
        const result = await axios.post(`${API}/api/timbrado`, timbrado, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result;
    } catch (error) {
        console.error("Error al procesar Timbrado:", error);
        throw error;
    }
}

export const obtenerTimbrados = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/timbrado`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener timbradoes:", error);
        throw error;
    }
};

export const obtenerTimbradoId = async (token: string, id: number) => {
    try {
        const result = await axios.get(`${API}/api/timbrado/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener Timbrado:", error);
        throw error;
    }
};
