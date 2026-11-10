import axios from "axios";
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";

const API = import.meta.env.VITE_API_URL;

// ─── Operaciones ───────────────────────────────────────────────────────────────

export const crearActualizarOperacion = async (operacion: InterfaceOperacionBaja, token: string) => {
    try {
        const result = await axios.post(`${API}/api/operacion`, operacion, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result;
    } catch (error) {
        console.error("Error al procesar operación:", error);
        throw error;
    }
}

export const obtenerOperaciones = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/operacion`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener operaciones:", error);
        throw error;
    }
};

export const obtenerOperacionId = async (token: string, id: number) => {
    try {
        const result = await axios.get(`${API}/api/operacion/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener operacion:", error);
        throw error;
    }
};
