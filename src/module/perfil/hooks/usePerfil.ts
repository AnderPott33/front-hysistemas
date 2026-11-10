import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { guardarPerfil, obtenerUsuarioId } from "../services/perfilService";
import type { InterfacePerfil } from "../interfaces/interfacePerfil";


export const usePerfil = () => {
    const { token } = useAuth();

    const [perfil, setPerfil] = useState<InterfacePerfil | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // ─── Empresa ───────────────────────────────────────────────────────────────

    const cargarPerfil = async (id : number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerUsuarioId(token, id);
            setPerfil(data[0]);
        } catch (error) {
            console.error("Error al cargar perfil:", error);
        } finally {
            setLoading(false);
        }
    };


    const guardarPerfilFn = async (perfil: InterfacePerfil) => {
        if (!token) return;
        try {
            setLoading(true);
           const result = await guardarPerfil(token, perfil);
            return result;
        } catch (error) {
            console.error("Error al guardar perfil:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };


    return {
        perfil, guardarPerfilFn, cargarPerfil, loading
    };
};
