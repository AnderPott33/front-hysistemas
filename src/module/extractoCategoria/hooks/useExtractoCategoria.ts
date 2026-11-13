import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    obtenerExtractoCategoria,
    obtenerSaldoCuenta,
    obtenerInformeSubcategorias,
    registrarAsientos,
    type FiltrosInformeSubcategorias,
    cancelarAsiento,
    type AsientoNuevo,
} from "../services/extractoCategoriaService";
import type {
    InterfaceExtractoMovimiento,
    InterfaceExtractoSaldoAnterior,
    InterfaceExtractoRespuesta,
    InterfaceTotalFormaPago,
} from "../interfaces/extractoCategoriaInterface";

type ParamsExtracto = [
    consolidado: boolean,
    moneda_id: number | null,
    fecha_inicio: string,
    fecha_fin: string,
    entidad?: string,
    caja_id?: number | null,
    cuenta_id?: number | null,
];

export const useExtractoCategoria = () => {
    const { token } = useAuth();

    const [saldosAnteriores, setSaldosAnteriores] = useState<InterfaceExtractoSaldoAnterior[]>([]);
    const [extractoCategoria, setExtractoCategoria] = useState<InterfaceExtractoMovimiento[]>([]);
    const [totalesFormaPago, setTotalesFormaPago] = useState<InterfaceTotalFormaPago[]>([]);
    const [saldoCuenta, setSaldoCuenta] = useState<number | null>(null);

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

    // Guarda los filtros de la última consulta para recargar el extracto después de guardar
    const ultimaConsulta = useRef<ParamsExtracto | null>(null);

    // Cuenta del último saldo consultado, para recargarlo después de registrar asientos
    const ultimaCuentaSaldo = useRef<number | null>(null);

    const cargarSaldoCuenta = async (cuentaId: number | null | undefined) => {
        if (!token || !cuentaId) {
            ultimaCuentaSaldo.current = null;
            setSaldoCuenta(null);
            return;
        }

        ultimaCuentaSaldo.current = cuentaId;

        try {
            const data = await conLoading(() => obtenerSaldoCuenta(token, cuentaId));
            setSaldoCuenta(Number(data.saldo ?? 0));
            return data ?? 0;
        } catch (error) {
            console.error("Error al cargar saldo de la cuenta:", error);
            setSaldoCuenta(null);
        }
    };

    const cargarExtractoCategoria = async (...params: ParamsExtracto) => {
        ultimaConsulta.current = params;
        if (!token) return;

        const [consolidado, moneda_id, fecha_inicio, fecha_fin, entidad, caja_id, cuenta_id] = params;

        try {
            const data: InterfaceExtractoRespuesta = await conLoading(() =>
                obtenerExtractoCategoria(
                    token, consolidado, moneda_id, fecha_inicio, fecha_fin, entidad, caja_id, cuenta_id
                )
            );
            setSaldosAnteriores(data.saldos_anteriores ?? []);
            setExtractoCategoria(data.movimientos ?? []);
            setTotalesFormaPago(data.totales_forma_pago ?? []);
        } catch (error) {
            console.error("Error al cargar extracto cuenta:", error);
            setSaldosAnteriores([]);
            setExtractoCategoria([]);
            setTotalesFormaPago([]);
        }

        // El saldo de cuenta se consulta solo si el filtro trae una cuenta
        await cargarSaldoCuenta(cuenta_id);
    };

    // Recarga extracto y saldo con los filtros actuales
    const refrescar = async () => {
        if (ultimaConsulta.current) {
            await cargarExtractoCategoria(...ultimaConsulta.current);
        } else {
            await cargarSaldoCuenta(ultimaCuentaSaldo.current);
        }
    };

    const registrarAsientosOperacion = async (asientos: AsientoNuevo[]): Promise<void> => {
        if (!token) throw new Error("No autenticado");
        await conLoading(async () => {
            await registrarAsientos(token, asientos);
            await refrescar();
        });
    };

    const cancelarAsientoOperacion = async (asientoId: number, motivo: string): Promise<void> => {
        if (!token) throw new Error("No autenticado");
        await conLoading(async () => {
            await cancelarAsiento(token, asientoId, motivo);
            await refrescar();
        });
    };

    // Abre el informe en una pestaña nueva. La pestaña se abre antes del await
    // para que el navegador no la bloquee como popup.
    const generarInformeSubcategorias = async (filtros: FiltrosInformeSubcategorias): Promise<void> => {
        if (!token) throw new Error("No autenticado");
        const ventana = window.open("", "_blank");
        try {
            const blob = await conLoading(() => obtenerInformeSubcategorias(token, filtros));
            const url = URL.createObjectURL(blob);
            if (ventana) {
                ventana.location.href = url;
            } else {
                window.open(url, "_blank");
            }
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            ventana?.close();
            throw error;
        }
    };

    return {
        cargarExtractoCategoria,
        registrarAsientosOperacion,
        cancelarAsientoOperacion,
        saldosAnteriores,
        extractoCategoria,
        totalesFormaPago,
        saldoCuenta,
        cargarSaldoCuenta,
        loading,
        generarInformeSubcategorias,
    };
};