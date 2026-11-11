import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceCuenta, InterfaceCuentaForm } from "../interfaces/InterfaceCuenta";
import { actualizarCuenta, obtenerCuentaId, obtenerCuentas } from "../services/cuentasService";
import { showAlert } from "../../../components/utils/Procesando";

export const useCuentas = () => {
    const { token } = useAuth();

    const [cuentas, setCuentas] = useState<InterfaceCuenta[]>([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState<InterfaceCuenta | null>(null);

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

    const cargarCuentas = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerCuentas(token));
            setCuentas(data);
        } catch (error) {
            console.error("Error al cargar cuentas:", error);
        }
    };

    const cargarCuentaPorId = async (id: number) => {
        if (!token) return;
        if (!id) {
            setCuentaSeleccionada(null);
            return;
        }
        try {
            const data = await conLoading(() => obtenerCuentaId(token, id));
            setCuentaSeleccionada(data);
        } catch (error) {
            console.error(`Error al cargar la cuenta ${id}:`, error);
        }
    };

    const guardarCuenta = async (cuenta: InterfaceCuentaForm) => {
        if (!token) return;
        try {
            const data = await conLoading(async () => {
                const respuesta = await actualizarCuenta(token, cuenta);
                await cargarCuentas();
                return respuesta;
            });
            showAlert(data.message, 'success');
            return data;
        } catch (error) {
            console.error("Error al crear/actualizar cuenta:", error);
            showAlert('Error al crear/actualizar cuenta', 'error');
        }
    };

    return {
        cuentas,
        cargarCuentas,
        cuentaSeleccionada,
        cargarCuentaPorId,
        loading,
        guardarCuenta,
    };
};