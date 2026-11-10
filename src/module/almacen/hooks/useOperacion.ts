import { useState } from "react";
import { useAuth } from "../../../context/AuthContext"
import type { InterfaceAlmacen } from "../interfaces/InterfaceAlmacen";

import { showAlert } from "../../../components/utils/Procesando";
import { crearActualizarAlmacen, obtenerAlmacenes, obtenerAlmacenId } from "../services/almacenService";

export const useAlmacen = () => {
    const { token } = useAuth();

    // 1. Tipado de estados añadido para aprovechar la interfaz
    const [almacenes, setAlmacenes] = useState<InterfaceAlmacen[]>([]);

    const [almacenSeleccionado, setAlmacenSeleccionado] = useState<InterfaceAlmacen | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const agregarActualizarAlmacenFn = async (almacen: InterfaceAlmacen) => {
        if (!token) return
        try {
            setLoading(true);
            const data = await crearActualizarAlmacen(almacen, token);
            return data
        } catch (error) {
            console.error("Error al procesar Almacén:", error);
        } finally {
            setLoading(false);
        }
    }

    const cargarAlmacenes = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerAlmacenes(token);
            setAlmacenes(data); // Asegúrate de que el backend devuelve un arreglo
            return data
        } catch (error) {
            console.error("Error al cargar Almacenes:", error);
        } finally {
            // 2. Uso de finally en lugar de setTimeout
            setLoading(false);
        }
    }
    const cargarAlmacenId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerAlmacenId(token, id);
            setAlmacenSeleccionado(data);
            console.log(data);

        } catch (error) {
            console.error("Error al cargar Almacen:", error);
        } finally {
            setLoading(false);
        }
    }

    // 4. Exportamos cargarOperacionesPorId en el return
    return { almacenes, cargarAlmacenes, almacenSeleccionado, agregarActualizarAlmacenFn, cargarAlmacenId, loading };
}