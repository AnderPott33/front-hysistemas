import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    cancelarFinanciero,
    guardarFinanciero,
    obtenerFinancieroId,
    obtenerFinancieros,
} from "../services/recibimientoService";
import type { InterfacePayload } from "../interfaces/interfaceRecibimiento";

export const useFinanciero = () => {
    const { token } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [financieros, setFinancieros] = useState([]);

    const cargarFinancieros = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerFinancieros(token);
            setFinancieros(data.data || []);
        } catch (error) {
            console.error("Error al cargar financieros:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarFinancierPorId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerFinancieroId(token, id);
            return data;
        } catch (error) {
            console.error(`Error al cargar financiero ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarFinancieroFn = async (payload: InterfacePayload) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await guardarFinanciero(token, payload);
            return data;
        } catch (error) {
            console.error("Error al procesar financiero:", error);
        } finally {
            setLoading(false);
        }
    };

    // Cancela el movimiento y sus asientos, y refresca el listado
    const cancelarFinancieroFn = async (id: number, motivo: string) => {
        if (!token) throw new Error("No autenticado");
        try {
            setLoading(true);
            const data = await cancelarFinanciero(token, id, motivo);
            await cargarFinancieros();
            return data;
        } finally {
            setLoading(false);
        }
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