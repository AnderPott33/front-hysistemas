import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    obtenerExtractoCuenta,
    obtenerSaldoCuenta,
    registrarAsientos,
    cancelarAsiento,
    type AsientoNuevo,
} from "../services/extractoCuentaService";
import type {
    InterfaceExtractoMovimiento,
    InterfaceExtractoSaldoAnterior,
    InterfaceExtractoRespuesta,
    InterfaceTotalFormaPago,
} from "../interfaces/extractoCuentaInterface";

type ParamsExtracto = [
    consolidado: boolean,
    moneda_id: number | null,
    fecha_inicio: string,
    fecha_fin: string,
    entidad?: string,
    caja_id?: number | null,
    cuenta_id?: number | null,
];

export const useExtractoCuenta = () => {
    const { token } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [saldosAnteriores, setSaldosAnteriores] = useState<InterfaceExtractoSaldoAnterior[]>([]);
    const [extractoCuenta, setExtractoCuenta] = useState<InterfaceExtractoMovimiento[]>([]);
    const [totalesFormaPago, setTotalesFormaPago] = useState<InterfaceTotalFormaPago[]>([]);
    const [saldoCuenta, setSaldoCuenta] = useState<number | null>(null);

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
            const data = await obtenerSaldoCuenta(token, cuentaId);
            setSaldoCuenta(Number(data.saldo ?? 0));
            return data ?? 0;
        } catch (error) {
            console.error("Error al cargar saldo de la cuenta:", error);
            setSaldoCuenta(null);
        }
    };

    const cargarExtractoCuenta = async (...params: ParamsExtracto) => {
        ultimaConsulta.current = params;
        if (!token) return;

        const [consolidado, moneda_id, fecha_inicio, fecha_fin, entidad, caja_id, cuenta_id] = params;

        try {
            setLoading(true);
            const data: InterfaceExtractoRespuesta = await obtenerExtractoCuenta(
                token, consolidado, moneda_id, fecha_inicio, fecha_fin, entidad, caja_id, cuenta_id
            );
            setSaldosAnteriores(data.saldos_anteriores ?? []);
            setExtractoCuenta(data.movimientos ?? []);
            setTotalesFormaPago(data.totales_forma_pago ?? []);
        } catch (error) {
            console.error("Error al cargar extracto cuenta:", error);
            setSaldosAnteriores([]);
            setExtractoCuenta([]);
            setTotalesFormaPago([]);
        } finally {
            setLoading(false);
        }

        // El saldo de cuenta se consulta solo si el filtro trae una cuenta
        await cargarSaldoCuenta(cuenta_id);
    };

    // Recarga extracto y saldo con los filtros actuales
    const refrescar = async () => {
        if (ultimaConsulta.current) {
            await cargarExtractoCuenta(...ultimaConsulta.current);
        } else {
            await cargarSaldoCuenta(ultimaCuentaSaldo.current);
        }
    };

    const registrarAsientosOperacion = async (asientos: AsientoNuevo[]): Promise<void> => {
        if (!token) throw new Error("No autenticado");
        await registrarAsientos(token, asientos);
        await refrescar();
    };

    const cancelarAsientoOperacion = async (asientoId: number, motivo: string): Promise<void> => {
        if (!token) throw new Error("No autenticado");
        await cancelarAsiento(token, asientoId, motivo);
        await refrescar();
    };

    return {
        cargarExtractoCuenta,
        registrarAsientosOperacion,
        cancelarAsientoOperacion,
        saldosAnteriores,
        extractoCuenta,
        totalesFormaPago,
        saldoCuenta,
        cargarSaldoCuenta,
        loading,
    };
};