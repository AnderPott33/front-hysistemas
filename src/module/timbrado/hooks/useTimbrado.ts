/* import { useState } from "react";
import { useAuth } from "../../../context/AuthContext"
import { crearActualizarTimbrado, obtenerTimbradoId, obtenerTimbrados } from "../services/timbradoService";

export const useTimbrado = () => {
    const { token } = useAuth();

    // 1. Tipado de estados añadido para aprovechar la interfaz
    const [timbrados, setTimbrados] = useState<InterfaceTimbrado[]>([]);

    const [timbradoSeleccionado, setTimbradoSeleccionado] = useState<InterfaceTimbrado | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const agregarActualizarTimbradoFn = async (timbrado: InterfaceTimbrado) => {
        if (!token) return
        try {
            setLoading(true);
            const data = await crearActualizarTimbrado(timbrado, token);
            return data
        } catch (error) {
            console.error("Error al procesar Timbrado:", error);
        } finally {
            setLoading(false);
        }
    }

    const cargarTimbrados = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerTimbrados(token);
            setTimbrados(data); // Asegúrate de que el backend devuelve un arreglo
            return data
        } catch (error) {
            console.error("Error al cargar Timbrados:", error);
        } finally {
            // 2. Uso de finally en lugar de setTimeout
            setLoading(false);
        }
    }

    const cargarTimbradoId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerTimbradoId(token, id);
            setTimbradoSeleccionado(data);
            console.log(data);
            
        } catch (error) {
            console.error("Error al cargar Operacion:", error);
        } finally {
            setLoading(false);
        }
    }

    return { timbrados, cargarTimbrados, timbradoSeleccionado, agregarActualizarTimbradoFn, cargarTimbradoId, loading };
} */