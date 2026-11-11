import { useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCotizacion } from "../../../context/CotizacionContext";
import type { InterfaceMoneda, InterfaceTipoCambio, MonedaAPIP } from "../interfaces/InterfaceMoneda";
import {
    obtenerMonedas, obtenerMonedaId, guardarMoneda,
    obtenerTiposCambio, obtenerTipoCambioId, guardarTipoCambio, obtenerTipoCambioVigente,
    obtenerMonedasActivas,
    obtenerSimboloMoneda,
    obtenerCotizacionPorPar,
    cambiosHoy
} from "../services/monedaService";
import { showAlert } from "../../../components/utils/Procesando";

export const useMoneda = () => {
    const { token } = useAuth();
    const { refrescar: refrescarCotizacion } = useCotizacion();

    const [monedas, setMonedas] = useState<InterfaceMoneda[]>([]);
    const [monedasA, setMonedasA] = useState<InterfaceMoneda[]>([]);
    const [monedaSeleccionada, setMonedaSeleccionada] = useState<InterfaceMoneda | null>(null);
    const [tiposCambio, setTiposCambio] = useState<InterfaceTipoCambio[]>([]);
    const [cambioVigente, setCambioVigente] = useState<InterfaceTipoCambio[]>([]);
    const [cotizacionHOY, setCotizacionHOY] = useState('verificando');
    const [tipoCambioSeleccionado, setTipoCambioSeleccionado] = useState<InterfaceTipoCambio | null>(null);

    // Contador de operaciones en curso: loading es true mientras quede alguna pendiente
    const [operacionesPendientes, setOperacionesPendientes] = useState(0);
    const loading = operacionesPendientes > 0;

    const conLoading = useCallback(async <T,>(operacion: () => Promise<T>): Promise<T> => {
        setOperacionesPendientes((n) => n + 1);
        try {
            return await operacion();
        } finally {
            setOperacionesPendientes((n) => n - 1);
        }
    }, []);

    // ─── Moneda ───────────────────────────────────────────────────────────────

    const hayCotizacion = useCallback(async (): Promise<boolean> => {
        if (!token) throw new Error("Sin token");
        try {
            const dataRegistro: any = await conLoading(() => cambiosHoy(token));
            const hayRegistro = dataRegistro?.hay_tipo_cambio_hoy ?? dataRegistro?.data?.hay_tipo_cambio_hoy;

            if (!hayRegistro) {
                setCotizacionHOY('sin_cotizacion');
                showAlert("No hay registro de cotización para hoy", 'warning');
                return false;
            }

            setCotizacionHOY('ok');
            return true;
        } catch (error) {
            console.error("[hayCotizacion] Error:", error);
            throw error;
        }
    }, [token, conLoading]);

    const cargarMonedas = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerMonedas(token));
            setMonedas(data);
        } catch (error) {
            console.error("Error al cargar monedas:", error);
        }
    };

    const cargarMonedasActivas = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerMonedasActivas(token));
            setMonedasA(data);
        } catch (error) {
            console.error("Error al cargar monedas activas:", error);
        }
    };

    const cargarMonedaPorId = async (id: number) => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerMonedaId(token, id));
            setMonedaSeleccionada(data);
        } catch (error) {
            console.error(`Error al cargar moneda ${id}:`, error);
        }
    };

    const guardarMonedaFn = async (moneda: InterfaceMoneda) => {
        if (!token) return;
        try {
            const data = await conLoading(async () => {
                const respuesta = await guardarMoneda(token, moneda);
                await cargarMonedas();
                return respuesta;
            });
            showAlert(data.mensaje, 'success');
            return data;
        } catch (error) {
            console.error("Error al guardar moneda:", error);
            showAlert("Error al guardar moneda", 'error');
            throw error;
        }
    };

    // ─── Tipo de cambio ───────────────────────────────────────────────────────

    const cargarTiposCambio = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerTiposCambio(token));
            setTiposCambio(data);
            hayCotizacion();
        } catch (error) {
            console.error("Error al cargar tipos de cambio:", error);
        }
    };

    const buscarCambioVigente = async (origen: number, destino: number, fecha: string) => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerTipoCambioVigente(token, origen, destino, fecha));
            setCambioVigente(data);
        } catch (error) {
            console.error("Error al cargar cambio:", error);
        }
    };

    const cargarTipoCambioPorId = async (id: number) => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerTipoCambioId(token, id));
            setTipoCambioSeleccionado(data);
        } catch (error) {
            console.error(`Error al cargar tipo de cambio ${id}:`, error);
        }
    };

    const guardarTipoCambioFn = async (tipoCambio: InterfaceTipoCambio) => {
        if (!token) return;
        try {
            const data = await conLoading(async () => {
                const respuesta = await guardarTipoCambio(token, tipoCambio);
                console.log('📊 Refrescando cotización tras guardar tipo de cambio...');
                await refrescarCotizacion();
                return respuesta;
            });
            showAlert('Cotización guardada exitosamente', 'success');
            return data;
        } catch (error) {
            console.error("Error al guardar tipo de cambio:", error);
            showAlert('No se pudo guardar la cotización', 'error');
            throw error;
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

    const obtenerSimbolo = async (codigo: string): Promise<MonedaAPIP | null> => {
        try {
            return await obtenerSimboloMoneda(codigo);
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