/* import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type {
    InterfaceTransaccion,
    InterfaceArticulo,
    PayloadTransaccion
} from "../interfaces/interfaceTransaccion";
import {
    crearTransaccion,
    obtenerArticulos,
    obtenerArticuloRapido
} from "../services/serviceTransaccion";

export const useTransaccion = () => {
    const { token } = useAuth();

    // Estados
    const [transacciones, setTransacciones] = useState<InterfaceTransaccion[]>([]);
    const [transaccionSeleccionada, setTransaccionSeleccionada] = useState<InterfaceTransaccion | null>(null);
    const [articulos, setArticulos] = useState<InterfaceArticulo[]>([]);
    const [articuloRap, setArticuloRap] = useState<InterfaceArticulo>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);



    const crearTransaccionFn = async (payload: PayloadTransaccion) => {
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

    const cargarArticulos = async () => {
        if (!token) return;
        try {
            const data = await obtenerArticulos(token);
            setArticulos(data);
        } catch (err) {
            console.error("Error al cargar artículos:", err);
        }
    };

    const cargarArticuloRap = async (id: number, cantidad: number) => {
        if (!token) return;
        try {
            const data = await obtenerArticuloRapido(token, id, cantidad);
            setArticuloRap(data);
            return data
        } catch (err) {
            console.error("Error al cargar artículos:", err);
        }
    };

    return {
        // Transacciones
        transacciones,
        transaccionSeleccionada,
        crearTransaccionFn,
        articulos,
        articuloRap,
        cargarArticulos,
        cargarArticuloRap,
        // Estado
        loading,
        error
    };
}; */