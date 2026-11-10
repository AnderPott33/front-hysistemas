import { useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCotizacion } from "../../../context/CotizacionContext"; // ✅ Importar
import type { InterfaceMoneda, InterfaceTipoCambio, MonedaAPI, MonedaAPIP } from "../interfaces/InterfaceMoneda";
import {
    obtenerMonedas, obtenerMonedaId, guardarMoneda,
    obtenerTiposCambio, obtenerTipoCambioId, guardarTipoCambio, obtenerTipoCambioVigente,
    obtenerMonedasActivas,
    obtenerCotizacionActual,
    obtenerSimboloMoneda,
    obtenerCotizacionPorPar,
    cambiosHoy
} from "../services/monedaService";
import { showAlert } from "../../../components/utils/Procesando";

export const useMoneda = () => {
    const { token } = useAuth();
    const { refrescar: refrescarCotizacion } = useCotizacion(); // ✅ Obtener refrescar

    const [monedas, setMonedas] = useState<InterfaceMoneda[]>([]);
    const [monedasA, setMonedasA] = useState<InterfaceMoneda[]>([]);
    const [monedaSeleccionada, setMonedaSeleccionada] = useState<InterfaceMoneda | null>(null);
    const [tiposCambio, setTiposCambio] = useState<InterfaceTipoCambio[]>([]);
    const [cambioVigente, setCambioVigente] = useState<InterfaceTipoCambio[]>([]);
    const [cotizacionHOY, setCotizacionHOY] = useState('verificando');
    const [tipoCambioSeleccionado, setTipoCambioSeleccionado] = useState<InterfaceTipoCambio | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // ─── Moneda ───────────────────────────────────────────────────────────────

    // ✅ Envuelto con useCallback para evitar reconstrucción innecesaria
    const hayCotizacion = useCallback(async (): Promise<boolean> => {

        if (!token) throw new Error("Sin token");
        setLoading(true);
        try {
            const dataRegistro: any = await cambiosHoy(token);
            const hayRegistro = dataRegistro?.hay_tipo_cambio_hoy ?? dataRegistro?.data?.hay_tipo_cambio_hoy;

            if (!hayRegistro) {
                setCotizacionHOY('sin_cotizacion')
                showAlert("No hay registro de cotización para hoy", 'warning');
                return false;
            }

            setCotizacionHOY('ok')

            return true;

        } catch (error) {
            console.error("[hayCotizacion] Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [token]); // Solo depende de token

    const cargarMonedas = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerMonedas(token);
            setMonedas(data);
        } catch (error) {
            console.error("Error al cargar monedas:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarMonedasActivas = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerMonedasActivas(token);
            setMonedasA(data);
        } catch (error) {
            console.error("Error al cargar monedas:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarMonedaPorId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerMonedaId(token, id);
            setMonedaSeleccionada(data);
        } catch (error) {
            console.error(`Error al cargar moneda ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarMonedaFn = async (moneda: InterfaceMoneda) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await guardarMoneda(token, moneda);
            await cargarMonedas();
            showAlert(data.mensaje, 'success')
            return data;

        } catch (error) {
            console.error("Error al guardar moneda:", error);
            showAlert("Error al guardar moneda", 'error')
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // ─── Tipo de cambio ───────────────────────────────────────────────────────

    const cargarTiposCambio = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerTiposCambio(token);
            setTiposCambio(data);
            hayCotizacion()
        } catch (error) {
            console.error("Error al cargar tipos de cambio:", error);
        } finally {
            setLoading(false);
        }
    };

    const buscarCambioVigente = async (origen: number, destino: number, fecha: string) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerTipoCambioVigente(token, origen, destino, fecha);
            setCambioVigente(data);
        } catch (error) {
            console.error("Error al cargar cambio:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarTipoCambioPorId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerTipoCambioId(token, id);
            setTipoCambioSeleccionado(data);
        } catch (error) {
            console.error(`Error al cargar tipo de cambio ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarTipoCambioFn = async (tipoCambio: InterfaceTipoCambio) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await guardarTipoCambio(token, tipoCambio);
            
            // ✅ AQUÍ: Refrescar la cotización después de guardar exitosamente
            console.log('📊 Refrescando cotización tras guardar tipo de cambio...');
            await refrescarCotizacion();
            
            showAlert('Cotización guardada exitosamente', 'success');
            return data;
        } catch (error) {
            console.error("Error al guardar tipo de cambio:", error);
            showAlert('No se pudo guardar la cotización', 'error')
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const obtenerCotizacion = async (origen: string, destino: string): Promise<number | null> => {
        try {
            return await obtenerCotizacionPorPar(origen, destino);
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const obtenerSimbolo = async (
        codigo: string
    ): Promise<MonedaAPIP | null> => {
        try {
            const data = await obtenerSimboloMoneda(codigo);
            return data;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    return {
        monedas,
        monedasA,
        obtenerSimbolo,
        cargarMonedasActivas,
        cargarMonedas,
        monedaSeleccionada,
        cargarMonedaPorId,
        guardarMonedaFn,
        tiposCambio,
        cotizacionHOY,
        hayCotizacion,
        cargarTiposCambio,
        tipoCambioSeleccionado,
        cargarTipoCambioPorId,
        guardarTipoCambioFn,
        obtenerCotizacion,
        loading,
        buscarCambioVigente,
        cambioVigente
    };
};