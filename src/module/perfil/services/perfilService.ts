import axios from "axios";
import type { InterfacePerfil  } from "../interfaces/interfacePerfil";

const API = import.meta.env.VITE_API_URL;

export const obtenerUsuarioId = async (token: string, id: number) => {
    const result = await axios.get(`${API}/api/usuarios/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result.data;
};

export const guardarPerfil = async (token: string, perfil: InterfacePerfil) => {
    const result = await axios.post(`${API}/api/ususarios/perfil`, perfil, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return result;
};
