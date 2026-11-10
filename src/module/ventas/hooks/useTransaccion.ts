/* import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type {
    InterfaceBaja,
    PayloadTransaccion
} from "../interfaces/interfaceTransaccion";
import {
    crearTransaccion
} from "../services/serviceTransaccion";

export const useTransaccion = () => {
    const { token } = useAuth();

    // Estados
    const [baja, setBaja] = useState<InterfaceBaja[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const crearBajaFn = async (payload: PayloadTransaccion) => {
        if (!token) return;
        try {
            setLoading(true);
            setError(null);
            const data = await crearTransaccion(token, payload);
            return data;
        } catch (error) {
            setError("Error al crear transacción");
            console.error("Error:", err);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        // Transacciones
        crearBajaFn,
        // Estado
        loading,
        error
    };
}; */