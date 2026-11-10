import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceCuenta, InterfaceCuentaForm } from "../interfaces/InterfaceCuenta";
import { actualizarCuenta, obtenerCuentaId, obtenerCuentas } from "../services/cuentasService";
import { showAlert } from "../../../components/utils/Procesando";

export const useCuentas = () => {
    const { token } = useAuth();

    const [cuentas, setCuentas] = useState<InterfaceCuenta[]>([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState<InterfaceCuenta | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const cargarCuentas = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerCuentas(token);
            setCuentas(data);
        } catch (error) {
            console.error("Error al cargar cuentas:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCuentaPorId = async (id: number) => {
        if (!token) return;
        if (!id) {
            setCuentaSeleccionada(null);
            return;
        }
        try {
            setLoading(true);
            const data = await obtenerCuentaId(token, id);
            setCuentaSeleccionada(data);
        } catch (error) {
            console.error(`Error al cargar la cuenta ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarCuenta = async (cuenta: InterfaceCuentaForm) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await actualizarCuenta(token, cuenta);
            await cargarCuentas();
            showAlert(data.message, 'success');
            return data;
        } catch (error) {
            console.error("Error al crear/actualizar cuenta:", error);
            showAlert('Error al crear/actualizar cuenta', 'error');
        } finally {
            setLoading(false);
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
