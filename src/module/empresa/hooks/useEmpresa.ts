import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import { guardarEmpresa, obtenerEmpresa } from "../services/empresaService";

export const useEmpresa = () => {
    const { token } = useAuth();

    const [empresa, setEmpresa] = useState<InterfaceEmpresa | null>(null);

    // Contador de operaciones en curso: loading es true mientras quede alguna pendiente
    const [operacionesPendientes, setOperacionesPendientes] = useState(0);
    const loading = operacionesPendientes > 0;

    const conLoading = async <T,>(operacion: () => Promise<T>): Promise<T> => {
        setOperacionesPendientes((n) => n + 1);
        try {
            return await operacion();
        } finally {
            setOperacionesPendientes((n) => n - 1);
        }
    };

    // ─── Empresa ───────────────────────────────────────────────────────────────

    const cargarEmpresa = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerEmpresa(token));
            setEmpresa(data[0]);
        } catch (error) {
            console.error("Error al cargar empresa:", error);
        }
    };

    const guardarEmpresaFn = async (empresa: InterfaceEmpresa) => {
        if (!token) return;
        try {
            return await conLoading(async () => {
                const result = await guardarEmpresa(token, empresa);
                await cargarEmpresa();
                return result;
            });
        } catch (error) {
            console.error("Error al guardar empresa:", error);
            throw error;
        }
    };

    return {
        empresa,
        guardarEmpresaFn,
        cargarEmpresa,
        loading,
    };
};