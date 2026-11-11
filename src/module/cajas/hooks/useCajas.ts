import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCaja } from "../../../context/CajaContext";
import type { InterfaceCajas } from "../Interfaces/InterfaceCajas";
import {
    obtenerCajas,
    obtenerCajaId,
    crearCaja,
    actualizarCaja,
    cerrarCaja,
    reabrirCaja,
    obtenerCajaLogueada,
    loguearCaja,
} from "../services/cajasService";
import { showAlert } from "../../../components/utils/Procesando";

export const useCajas = () => {
    const { token } = useAuth();
    const { recargarCaja } = useCaja();

    const [cajas, setCajas] = useState<InterfaceCajas[]>([]);
    const [cajaSeleccionada, setCajaSeleccionada] = useState<InterfaceCajas | null>(null);
    const [cajaLogueada, setCajaLogueada] = useState<InterfaceCajas | null>(null);
    const [saldos, setSaldos] = useState<any[]>([]);

    // Contador de operaciones en curso: loading es true mientras haya alguna pendiente
    const [operacionesPendientes, setOperacionesPendientes] = useState(0);
    const loading = operacionesPendientes > 0;

    // Envuelve cualquier operación async y controla el contador de forma segura
    const conLoading = async <T,>(operacion: () => Promise<T>): Promise<T> => {
        setOperacionesPendientes((n) => n + 1);
        try {
            return await operacion();
        } finally {
            setOperacionesPendientes((n) => n - 1);
        }
    };

    const cargarCajas = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerCajas(token));
            setCajas(data || []);
        } catch (error) {
            console.error("Error al cargar cajas:", error);
        }
    };

    const cargarCajaPorId = async (id: number) => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerCajaId(token, id));
            setCajaSeleccionada(data ?? null);
        } catch (error) {
            console.error(`Error al cargar caja ${id}:`, error);
        }
    };

    const guardarCaja = async (caja: InterfaceCajas) => {
        if (!token) return;
        try {
            const data = await conLoading(() =>
                caja.id ? actualizarCaja(token, caja) : crearCaja(token, caja)
            );

            setCajaSeleccionada(data);
            await cargarCajas();
            await loguearCajaUsuario(data.id); // ahora se espera y sus errores se capturan

            return data;
        } catch (error) {
            console.error("Error al guardar caja:", error);
            throw error;
        }
    };

    const cerrarCajaId = async (id: number) => {
        if (!token) return;
        try {
            const data = await conLoading(() => cerrarCaja(token, id));
            if (cajaSeleccionada?.id === id) {
                setCajaSeleccionada(data);
            }
            await cargarCajas();
            await recargarCaja();
            return data;
        } catch (error) {
            console.error("Error al cerrar caja:", error);
            throw error;
        }
    };

    const reabrirCajaId = async (id: number) => {
        if (!token) return;
        try {
            const data = await conLoading(() => reabrirCaja(token, id));
            if (cajaSeleccionada?.id === id) {
                setCajaSeleccionada(data);
            }
            await cargarCajas();
            await recargarCaja();
            return data;
        } catch (error) {
            console.error("Error al reabrir caja:", error);
            throw error;
        }
    };

    const cargarCajaLogueada = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerCajaLogueada(token));
            setCajaLogueada(data);
        } catch (error) {
            console.error("Error al cargar caja logueada:", error);
        }
    };

    const loguearCajaUsuario = async (cajaId: number | null) => {
        if (!token) return;
        try {
            const data = await conLoading(() => loguearCaja(token, cajaId));
            await cargarCajaLogueada();
            await recargarCaja();
            showAlert(
                cajaId ? `Caja ${cajaId} logueada` : `Caja deslogueada`,
                "success"
            );
            return data;
        } catch (error) {
            console.error("Error al loguear caja:", error);
            throw error;
        }
    };

    return {
        cajas,
        cajaSeleccionada,
        cajaLogueada,
        saldos,
        loading,
        cargarCajas,
        cargarCajaPorId,
        guardarCaja,
        cerrarCajaId,
        reabrirCajaId,
        cargarCajaLogueada,
        loguearCajaUsuario,
    };
};