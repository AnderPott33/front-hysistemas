import axios from "axios";
import type { InterfaceEmpresa  } from "../interfaces/interfaceEmpresa";

const API = import.meta.env.VITE_API_URL;

// ─── Empresa ───────────────────────────────────────────────────────────────────

export const obtenerEmpresa = async (token: string) => {
    const result = await axios.get(`${API}/api/empresa`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const obtenerEmpresaId = async (token: string, id: number) => {
    const result = await axios.get(`${API}/api/empresa/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const guardarEmpresa = async (token: string, empresa: InterfaceEmpresa) => {
    const result = await axios.post(`${API}/api/empresa`, empresa, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result;
};
