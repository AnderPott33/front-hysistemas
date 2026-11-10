import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import { guardarEmpresa, obtenerEmpresa } from "../services/empresaService";


export const useEmpresa = () => {
    const { token } = useAuth();

    const [empresa, setEmpresa] = useState<InterfaceEmpresa | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // ─── Empresa ───────────────────────────────────────────────────────────────

    const cargarEmpresa = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerEmpresa(token);
            setEmpresa(data[0]);
        } catch (error) {
            console.error("Error al cargar monedas:", error);
        } finally {
            setLoading(false);
        }
    };


    const guardarEmpresaFn = async (empresa: InterfaceEmpresa) => {
        if (!token) return;
        try {
            setLoading(true);
           const result = await guardarEmpresa(token, empresa);
            await cargarEmpresa();
            return result;
        } catch (error) {
            console.error("Error al guardar empresa:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };


    return {
        empresa, guardarEmpresaFn, cargarEmpresa, loading
    };
};
