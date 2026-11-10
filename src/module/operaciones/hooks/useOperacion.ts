import { useState } from "react";
import { useAuth } from "../../../context/AuthContext"
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";

import { showAlert } from "../../../components/utils/Procesando";
import { crearActualizarOperacion, obtenerOperaciones, obtenerOperacionId } from "../services/operacionService";

export const useOperacion = () => {
    const { token } = useAuth();

    // 1. Tipado de estados añadido para aprovechar la interfaz
    const [operaciones, setOperaciones] = useState<InterfaceOperacionBaja[]>([]);

    const [operacionSeleccionada, setOperacionSeleccionada] = useState<InterfaceOperacionBaja | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const agregarActualizarOperacionFn = async (operacion: InterfaceOperacionBaja) => {
        if (!token) return
        try {
            setLoading(true);
            const data = await crearActualizarOperacion(operacion, token);
            return data
        } catch (error) {
            console.error("Error al procesar Operación:", error);
        } finally {
            setLoading(false);
        }
    }

    const cargarOperaciones = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerOperaciones(token);
            setOperaciones(data); // Asegúrate de que el backend devuelve un arreglo
            return data
        } catch (error) {
            console.error("Error al cargar Operaciones:", error);
        } finally {
            // 2. Uso de finally en lugar de setTimeout
            setLoading(false);
        }
    }
    const cargarOperacionId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerOperacionId(token, id);
            setOperacionSeleccionada(data);
            console.log(data);
            
        } catch (error) {
            console.error("Error al cargar Operacion:", error);
        } finally {
            setLoading(false);
        }
    }

    // 4. Exportamos cargarOperacionesPorId en el return
    return { operaciones, cargarOperaciones, operacionSeleccionada, agregarActualizarOperacionFn, cargarOperacionId, loading };
}