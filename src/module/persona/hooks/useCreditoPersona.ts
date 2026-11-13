import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    obtenerCreditoPersona,
    registrarCreditoPersona,
    type InterfaceCreditoPersona,
    type LineaCreditoNueva,
} from "../services/creditoPersonaService";
import { showAlert } from "../../../components/utils/Procesando";

export const useCreditoPersona = () => {
    const { token } = useAuth();
    const [credito, setCredito] = useState<InterfaceCreditoPersona | null>(null);
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

    const cargarCredito = async (personaId: number) => {
        if (!token || !personaId) return;
        try {
            const data = await conLoading(() => obtenerCreditoPersona(token, personaId));
            setCredito(data);
        } catch (error) {
            console.error("Error al cargar crédito:", error);
            showAlert("No se pudo cargar el crédito de la persona", "error");
        }
    };

    const guardarCredito = async (
        personaId: number,
        lineas: LineaCreditoNueva[],
        tipo = "AJUSTE",
        movimientoId?: number | null
    ) => {
        if (!token) return false;
        try {
            await conLoading(async () => {
                await registrarCreditoPersona(token, personaId, {
                    grupo_id: crypto.randomUUID(),
                    tipo,
                    movimiento_id: movimientoId ?? null,
                    lineas,
                });
                const data = await obtenerCreditoPersona(token, personaId);
                setCredito(data);
            });
            showAlert("Crédito registrado", "success");
            return true;
        } catch (error: any) {
            const mensaje = error?.response?.data?.error ?? "No se pudo registrar el crédito";
            showAlert(mensaje, "error");
            return false;
        }
    };

    return { credito, loading, cargarCredito, guardarCredito };
};
