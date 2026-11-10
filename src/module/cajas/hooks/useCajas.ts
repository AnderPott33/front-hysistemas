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
    const [loading, setLoading] = useState<boolean>(false);

    const cargarCajas = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerCajas(token);
            setCajas(data || []);
        } catch (error) {
            console.error("Error al cargar cajas:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCajaPorId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerCajaId(token, id);
            setCajaSeleccionada(data || []);
        } catch (error) {
            console.error(`Error al cargar caja ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarCaja = async (caja: InterfaceCajas) => {
        if (!token) return;
        try {
            setLoading(true);
            let data;

            if (caja.id) {
                data = await actualizarCaja(token, caja);
            } else {
                data = await crearCaja(token, caja);
            }

            await cargarCajas();
            setCajaSeleccionada(data);
            /* console.log(data); */
            loguearCajaUsuario(data.id)
            return data;
        } catch (error) {
            console.error("Error al guardar caja:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const cerrarCajaId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await cerrarCaja(token, id);
            await cargarCajas();
            if (cajaSeleccionada?.id === id) {
                setCajaSeleccionada(data);
            }
            // Recargar el contexto global de CajaContext
            await recargarCaja();
            return data;
        } catch (error) {
            console.error("Error al cerrar caja:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const reabrirCajaId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await reabrirCaja(token, id);
            await cargarCajas();
            if (cajaSeleccionada?.id === id) {
                setCajaSeleccionada(data);
            }
            // Recargar el contexto global de CajaContext
            await recargarCaja();
            return data;
        } catch (error) {
            console.error("Error al reabrir caja:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const cargarCajaLogueada = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerCajaLogueada(token);
            setCajaLogueada(data);
        } catch (error) {
            console.error("Error al cargar caja logueada:", error);
        } finally {
            setLoading(false);
        }
    };

    const loguearCajaUsuario = async (cajaId: number | null) => {
        if (!token) return;
        try {
            const data = await loguearCaja(token, cajaId);
            await cargarCajaLogueada();
            // Recargar el contexto global de CajaContext
            await recargarCaja();
            if (cajaId) {
                showAlert(`Caja ${cajaId} logueada`, 'success')
            }else{
                showAlert(`Caja deslogueada`, 'success')
            }
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
