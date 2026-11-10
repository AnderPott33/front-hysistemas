import axios from "axios";
import type { InterfaceAlmacen } from "../interfaces/InterfaceAlmacen";

const API = import.meta.env.VITE_API_URL;

// ─── Operaciones ───────────────────────────────────────────────────────────────

export const crearActualizarAlmacen = async (almacen: InterfaceAlmacen, token: string) => {
    try {
        const result = await axios.post(`${API}/api/almacen`, almacen, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result;
    } catch (error) {
        console.error("Error al procesar almacén:", error);
        throw error;
    }
}

export const obtenerAlmacenes = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/almacen`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener almacenes:", error);
        throw error;
    }
};

export const obtenerAlmacenId = async (token: string, id: number) => {
    try {
        const result = await axios.get(`${API}/api/almacen/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener almacen:", error);
        throw error;
    }
};
