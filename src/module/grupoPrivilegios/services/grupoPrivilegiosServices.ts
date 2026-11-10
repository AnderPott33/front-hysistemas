import axios from "axios";
import { showAlert } from "../../../components/utils/Procesando";
import type { InterfaceGrupoPrivilegios } from "../interfaces/grupoPrivilegiosInterfaces";

const API = import.meta.env.VITE_API_URL;

export const obtenerGruposPrivilegios = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/grupo-privilegios/grupos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener grupos de privilegios:", error);
        throw error;
    }
};

export const obtenerGrupoPrivilegiosId = async (token: string, id: number) => {
    try {
        const result = await axios.get(`${API}/api/grupo-privilegios/grupos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data || [];
    } catch (error) {
        console.error("Error al obtener grupo de privilegios:", error);
        throw error;
    }
};

export const crearGrupoPrivilegios = async (token: string, grupo: any) => {
    try {
        const result = await axios.post(`${API}/api/grupo-privilegios/create`, grupo, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al crear grupo de privilegios:", error);
        throw error;
    }
};

export const actualizarGrupoPrivilegios = async (token: string, id: number, grupo: any) => {
    try {
        const result = await axios.put(`${API}/api/grupo-privilegios/${id}`, grupo, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al actualizar grupo de privilegios:", error);
        throw error;
    }
};

export const eliminarGrupoPrivilegios = async (token: string, id: number) => {
    try {
        const result = await axios.delete(`${API}/api/grupo-privilegios/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al eliminar grupo de privilegios:", error);
        throw error;
    }
};
