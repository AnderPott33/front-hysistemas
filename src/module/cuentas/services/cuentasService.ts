import axios from "axios";
import type { InterfaceCuentaForm } from "../interfaces/InterfaceCuenta";

const API = import.meta.env.VITE_API_URL;

export const obtenerCuentas = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/cuentas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener cuentas:", error);
        throw error;
    }
};

export const obtenerCuentaId = async (token: string, id: number) => {
    try {
        const result = await axios.get(`${API}/api/cuentas/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener cuenta:", error);
        throw error;
    }
};

export const obtenerCuentasPorTipo = async (token: string, tipo: string) => {
    try {
        const result = await axios.get(`${API}/api/cuentas/tipo/${tipo}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener cuentas por tipo:", error);
        throw error;
    }
};

export const actualizarCuenta = async (token: string, cuenta: InterfaceCuentaForm) => {
    try {
        const result = await axios.post(`${API}/api/cuentas`, cuenta, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al crear/actualizar cuenta:", error);
        throw error;
    }
};
