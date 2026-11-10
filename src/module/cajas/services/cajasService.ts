import axios from "axios";
import type { InterfaceCajas } from "../Interfaces/InterfaceCajas";

const API = import.meta.env.VITE_API_URL;

export const obtenerCajas = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/cajas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener cajas:", error);
        throw error;
    }
};

export const obtenerCajaId = async (token: string, id: number) => {
    try {
        const result = await axios.post(`${API}/api/cajas/buscar/${id}`,{}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener caja:", error);
        throw error;
    }
};

export const crearCaja = async (token: string, caja: InterfaceCajas) => {
    try {
        const result = await axios.post(`${API}/api/cajas`, caja, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al crear caja:", error);
        throw error;
    }
};

export const actualizarCaja = async (token: string, caja: InterfaceCajas) => {
    try {
        const result = await axios.put(`${API}/api/cajas`, caja, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al actualizar caja:", error);
        throw error;
    }
};

export const cerrarCaja = async (token: string, id: number) => {
    try {
        const result = await axios.put(`${API}/api/cajas/cerrar/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al cerrar caja:", error);
        throw error;
    }
};

export const reabrirCaja = async (token: string, id: number) => {
    try {
        const result = await axios.put(`${API}/api/cajas/reabrir/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al reabrir caja:", error);
        throw error;
    }
};

export const obtenerCajaLogueada = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/cajas/activa`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener caja logueada:", error);
        throw error;
    }
};

export const loguearCaja = async (token: string, cajaId: number | null) => {
    try {
        const result = await axios.post(`${API}/api/cajas/loguear`, { cajaId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al loguear caja:", error);
        throw error;
    }
};

