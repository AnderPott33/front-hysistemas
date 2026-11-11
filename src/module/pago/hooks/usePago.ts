import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    cancelarFinanciero,
    guardarFinanciero,
    obtenerFinancieroId,
    obtenerFinancieros,
} from "../services/pagoService";
import type { InterfacePayload } from "../interfaces/interfacePago";

export const useFinanciero = () => {
    const { token } = useAuth();

    const [financieros, setFinancieros] = useState([]);

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

    const cargarFinancieros = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerFinancieros(token));
            setFinancieros(data.data || []);
        } catch (error) {
            console.error("Error al cargar financieros:", error);
        }
    };

    const cargarFinancierPorId = async (id: number) => {
        if (!token) return;
        try {
            return await conLoading(() => obtenerFinancieroId(token, id));
        } catch (error) {
            console.error(`Error al cargar financiero ${id}:`, error);
        }
    };

    const guardarFinancieroFn = async (payload: InterfacePayload) => {
        if (!token) return;
        try {
            // La recarga del listado va dentro de la misma operación para que el overlay no se apague antes
            return await conLoading(async () => {
                const data = await guardarFinanciero(token, payload);
                await cargarFinancieros();
                return data;
            });
        } catch (error) {
            console.error("Error al procesar financiero:", error);
        }
    };

    // Cancela el movimiento y sus asientos, y refresca el listado
    const cancelarFinancieroFn = async (id: number, motivo: string) => {
        if (!token) throw new Error("No autenticado");
        return await conLoading(async () => {
            const data = await cancelarFinanciero(token, id, motivo);
            await cargarFinancieros();
            return data;
        });
    };

    return {
        guardarFinancieroFn,
        cancelarFinancieroFn,
        loading,
        financieros,
        cargarFinancieros,
        cargarFinancierPorId,
    };
};