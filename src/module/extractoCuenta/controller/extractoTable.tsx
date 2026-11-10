import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { Check, FileText, Printer, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import { formatarDataHora, formatarMoeda } from "../../../components/utils/Formatadores";
import InputERP from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { showAlert } from "../../../components/utils/Procesando";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceExtractoMovimiento, InterfaceExtractoSaldoAnterior } from "../interfaces/extractoCuentaInterface";
import { obtenerAsiento, type InterfaceAsientoDetalle } from "../services/extractoCuentaService";
import DetalleAsientoModal from "./DetalleAsientoModal";

// Nombres de forma de pago tal como los devuelve el backend en totales_forma_pago
const FORMAS_PAGO = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    lanzamientoBancario: "Lanzamiento Bancario",
    chequeDisponible: "Cheque disponible",
    chequePreDatado: "Cheque pre datado",
} as const;

export interface InterfaceTotalFormaPago {
    forma_pago_id?: number | null;
    forma_pago: string | null;
    saldo_anterior: number | string;
    total_entrada: number | string;
    total_salida: number | string;
    saldo_final: number | string;
}

interface InterfaceExtractoTable {
    datosExtracto: InterfaceExtractoMovimiento[];
    datosMonedas: InterfaceMoneda[];
    saldosAnteriores: InterfaceExtractoSaldoAnterior[];
    totalesFormaPago: InterfaceTotalFormaPago[];
    onCancelarAsiento?: (id: number, motivo: string) => Promise<void>;
}

interface InterfaceExtractoHeader {
    saldoApertura: number;
    efectivoInicial: number;
    chequesDisponiblesInicial: number;
    chequesPreDatadosInicial: number;
    monedaReferencia: InterfaceMoneda | undefined;
}

interface InterfaceExtractoFooter {
    totalEntradas: number;
    totalSalidas: number;
    saldoFinal: number;
    efectivoFinal: number;
    chequesDisponiblesFinal: number;
    chequesPreDatadosFinal: number;
    tarjetasFinal: number;
    lanzamientoBancarioFinal: number;
    monedaReferencia: InterfaceMoneda | undefined;
}

const aNumero = (valor: number | string | null | undefined): number | null => {
    if (valor === null || valor === undefined || valor === "") return null;
    const n = Number(valor);
    return Number.isNaN(n) ? null : n;
};

const normalizar = (texto: string | null | undefined) => (texto ?? "").trim().toLowerCase();

// Devuelve el monto de una forma de pago buscada por nombre. Si no existe, devuelve 0.
const montoFormaPago = (
    totales: InterfaceTotalFormaPago[],
    nombre: string,
    campo: "saldo_anterior" | "saldo_final"
): number => {
    const fila = totales.find((t) => normalizar(t.forma_pago) === normalizar(nombre));
    return aNumero(fila?.[campo]) ?? 0;
};

// Anchos de columna: deben coincidir con los `width` de las columnas de DataTable
const ANCHOS_COLUMNAS = ["70px", "70px", "90px", "150px", "300px", "150px", "150px", "150px", "160px"];

const ResumenItem = ({
    label,
    valor,
    claseValor,
    conImprimir = false,
}: {
    label: string;
    valor: ReactNode;
    claseValor: string;
    conImprimir?: boolean;
}) => (
    <div className="flex items-center gap-2">
        <span className="uppercase text-mi-tercera/80">
            {label} <span className={`font-semibold ml-1 ${claseValor}`}>{valor}</span>
        </span>
        {conImprimir && (
            <button
                type="button"
                title="Imprimir"
                className="p-0.5 rounded-full text-mi-cuarta/50 hover:text-mi-tercera hover:bg-white transition-colors"
            >
                <Printer size={14} />
            </button>
        )}
    </div>
);

const Divisor = () => <span className="h-3.5 w-px bg-mi-primera/20" />;

const ExtractoHeader = ({
    saldoApertura,
    efectivoInicial,
    chequesDisponiblesInicial,
    chequesPreDatadosInicial,
    monedaReferencia,
}: InterfaceExtractoHeader) => {
    const fmt = (valor: number) => formatarMoeda(valor, monedaReferencia);

    return (
        <div className="flex items-center gap-4 px-4 py-2 text-xs bg-mi-primera/5 border-b border-mi-primera/10">
            <ResumenItem label="Efectivo" valor={fmt(efectivoInicial)} claseValor="text-mi-cuarta" />
            <Divisor />
            <ResumenItem
                label="Cheques disponibles"
                valor={fmt(chequesDisponiblesInicial)}
                claseValor="text-mi-tercera"
            />
            <Divisor />
            <ResumenItem
                label="Cheques pre datados"
                valor={fmt(chequesPreDatadosInicial)}
                claseValor="text-amber-400"
            />
            <div className="ml-auto">
                <ResumenItem
                    label="Saldo de apertura"
                    valor={fmt(saldoApertura)}
                    claseValor=" text-mi-primera font-bold"
                />
            </div>
        </div>
    );
};

const ExtractoFooter = ({
    totalEntradas,
    totalSalidas,
    saldoFinal,
    efectivoFinal,
    chequesDisponiblesFinal,
    chequesPreDatadosFinal,
    tarjetasFinal,
    lanzamientoBancarioFinal,
    monedaReferencia,
}: InterfaceExtractoFooter) => {
    const fmt = (valor: number) => formatarMoeda(valor, monedaReferencia);

    return (
        <div className="flex flex-col">
            {/* Fila TOTALES alineada con las columnas de la tabla */}
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    {ANCHOS_COLUMNAS.map((ancho, i) => (
                        <col key={i} style={{ width: ancho }} />
                    ))}
                </colgroup>
                <tbody>
                    <tr className="bg-mi-primera/10 border-b border-mi-primera/10">
                        <td colSpan={5} className="px-3 py-2 text-left uppercase tracking-wide text-mi-tercera">
                            Totales
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400">
                            {fmt(totalEntradas)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-rose-400">
                            {fmt(-totalSalidas)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-mi-cuarta">
                            {fmt(saldoFinal)}
                        </td>
                        <td />
                    </tr>
                </tbody>
            </table>

            {/* Fila de saldos finales */}
            <div className="flex items-center gap-4 px-4 py-2 text-xs bg-mi-primera/5 border-b border-mi-primera/10">
                <ResumenItem label="Efectivo final" valor={fmt(efectivoFinal)} claseValor="text-mi-cuarta" />
                <Divisor />
                <ResumenItem
                    label="Cheques disp. final"
                    valor={fmt(chequesDisponiblesFinal)}
                    claseValor="text-mi-tercera"
                    conImprimir
                />
                <Divisor />
                <ResumenItem
                    label="Cheques pre dat. final"
                    valor={fmt(chequesPreDatadosFinal)}
                    claseValor="text-amber-400"
                    conImprimir
                />
                <div className="ml-auto">
                    <ResumenItem
                        label="Saldo actual"
                        valor={fmt(saldoFinal)}
                        claseValor="text-mi-tercera text-base font-bold"
                    />
                </div>
            </div>

            {/* Fila de tarjetas y lanzamientos */}
            <div className="flex items-center gap-4 px-4 py-2 text-xs bg-mi-primera/5">
                <ResumenItem
                    label="Tarjetas"
                    valor={fmt(tarjetasFinal)}
                    claseValor="text-mi-tercera"
                    conImprimir
                />
                <Divisor />
                <ResumenItem
                    label="Lanc. bancario"
                    valor={fmt(lanzamientoBancarioFinal)}
                    claseValor="text-mi-tercera"
                    conImprimir
                />
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Modal de detalle y cancelación de asiento                           */
/* ------------------------------------------------------------------ */

interface InterfaceDetalleAsientoModal {
    asientoId: number | null;
    onClose: () => void;
    onCancelar: (id: number, motivo: string) => Promise<void>;
}

const fmtNumero = (valor?: number | string | null) =>
    valor === null || valor === undefined || valor === ""
        ? "-"
        : Number(valor).toLocaleString("es-PY", { maximumFractionDigits: 2 });

const fmtFecha = (valor?: string | null) => (valor ? formatarDataHora(valor) : "-");

const Campo = ({ label, valor }: { label: string; valor: ReactNode }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[11px] uppercase text-mi-tercera/70">{label}</span>
        <span className="text-sm text-mi-cuarta">{valor ?? "-"}</span>
    </div>
);

/** Descripción de la cuenta o caja a la que apunta el asiento */
const describirUbicacion = (a: InterfaceAsientoDetalle) => {
    if (a.cuenta_id != null) {
        const partes = [a.cuenta_tipo, a.cuenta_banco, a.cuenta_numero ? `N° ${a.cuenta_numero}` : null]
            .filter(Boolean)
            .join(" · ");
        return {
            tipo: "Cuenta",
            titulo: `#${a.cuenta_id} ${a.cuenta_nombre ?? ""}`.trim(),
            detalle: partes,
        };
    }
    if (a.caja_id != null) {
        return {
            tipo: "Caja",
            titulo: `#${a.caja_id} ${a.caja_descripcion ?? ""}`.trim(),
            detalle: "",
        };
    }
    return { tipo: "Sin ubicación", titulo: "-", detalle: "" };
};

/** "Nombre (email)" del usuario, o el id si no vino el join */
const describirUsuario = (nombre?: string | null, email?: string | null, id?: number | null) => {
    if (nombre) return email ? `${nombre} (${email})` : nombre;
    return id ?? "-";
};

/* ------------------------------------------------------------------ */
/* Tabla del extracto                                                  */
/* ------------------------------------------------------------------ */

const ExtractoTable = ({
    datosExtracto = [],
    saldosAnteriores = [],
    datosMonedas = [],
    totalesFormaPago = [],
    onCancelarAsiento,
}: InterfaceExtractoTable) => {
    const [asientoId, setAsientoId] = useState<number | null>(null);

    const buscarMoneda = (monedaId: number) =>
        datosMonedas.find((m) => m.id === monedaId);

    // Moneda de referencia para los totales (la del primer movimiento o del saldo de apertura)
    const monedaReferencia = buscarMoneda(
        datosExtracto[0]?.moneda_id ?? saldosAnteriores[0]?.moneda_id ?? 0
    );

    const saldoApertura = saldosAnteriores.reduce(
        (acc, s) => acc + (aNumero(s.saldo_anterior) ?? 0),
        0
    );

    const totalEntradas = datosExtracto.reduce(
        (acc, m) => acc + (aNumero(m.entrada) ?? 0),
        0
    );

    const totalSalidas = datosExtracto.reduce(
        (acc, m) => acc + (aNumero(m.salida) ?? 0),
        0
    );

    // Saldo final: último saldo informado por el extracto o, si no existe, apertura + entradas - salidas
    const ultimoSaldo = [...datosExtracto]
        .reverse()
        .map((m) => aNumero(m.saldo))
        .find((v) => v !== null);

    const saldoFinal = ultimoSaldo ?? saldoApertura + totalEntradas - totalSalidas;

    return (
        <div className="flex flex-col text-sm bg-mi-segunda/15">
            <ExtractoHeader
                saldoApertura={saldoApertura}
                efectivoInicial={montoFormaPago(totalesFormaPago, FORMAS_PAGO.efectivo, "saldo_anterior")}
                chequesDisponiblesInicial={montoFormaPago(totalesFormaPago, FORMAS_PAGO.chequeDisponible, "saldo_anterior")}
                chequesPreDatadosInicial={montoFormaPago(totalesFormaPago, FORMAS_PAGO.chequePreDatado, "saldo_anterior")}
                monedaReferencia={monedaReferencia}
            />

            <DataTable
                size="md"
                data={datosExtracto}
                showFilters={false}
                pagination={false}
                onRowClick={(row) => {
                    if (row.detalle_id != null) setAsientoId(Number(row.detalle_id));
                }}
                footer={
                    <ExtractoFooter
                        totalEntradas={totalEntradas}
                        totalSalidas={totalSalidas}
                        saldoFinal={saldoFinal}
                        efectivoFinal={montoFormaPago(totalesFormaPago, FORMAS_PAGO.efectivo, "saldo_final")}
                        chequesDisponiblesFinal={montoFormaPago(totalesFormaPago, FORMAS_PAGO.chequeDisponible, "saldo_final")}
                        chequesPreDatadosFinal={montoFormaPago(totalesFormaPago, FORMAS_PAGO.chequePreDatado, "saldo_final")}
                        tarjetasFinal={montoFormaPago(totalesFormaPago, FORMAS_PAGO.tarjeta, "saldo_final")}
                        lanzamientoBancarioFinal={montoFormaPago(totalesFormaPago, FORMAS_PAGO.lanzamientoBancario, "saldo_final")}
                        monedaReferencia={monedaReferencia}
                    />
                }
                columns={[
                    {
                        header: "#",
                        accessor: "asiento_id",
                        width: "70px",
                        cell: (e) => e.asiento_id ?? "",
                    },
                    {
                        header: "Ref",
                        accessor: "movimiento_id",
                        width: "70px",
                        cell: (e) => e.movimiento_id ?? "",
                    },
                    {
                        header: "Fecha",
                        accessor: "fecha",
                        width: "90px",
                        align: "center",
                        cell: (e) => (e.fecha ? formatarDataHora(e.fecha) : ""),
                    },
                    {
                        header: "Descripción",
                        accessor: "descripcion",
                        width: "150px",
                        cell: (e) => (
                            <span className={e.detalle_id === null ? "font-semibold" : ""}>
                                {e.descripcion ?? "-"}
                            </span>
                        ),
                    },
                    {
                        header: "Detalle",
                        accessor: "descripcion_baja",
                        width: "300px",
                        cell: (e) => e.descripcion_baja ?? "-",
                    },
                    {
                        header: "Entrada",
                        accessor: "entrada",
                        align: "right",
                        width: "150px",
                        cell: (e) => {
                            const valor = aNumero(e.entrada);
                            if (valor === null) return null;
                            return (
                                <span className="flex items-center justify-end gap-1 text-emerald-400">
                                    <TrendingUp size={13} />
                                    {formatarMoeda(valor, buscarMoneda(e.moneda_id))}
                                </span>
                            );
                        },
                    },
                    {
                        header: "Salida",
                        accessor: "salida",
                        align: "right",
                        width: "150px",
                        cell: (e) => {
                            const valor = aNumero(e.salida);
                            if (valor === null) return null;
                            return (
                                <span className="flex items-center justify-end gap-1 text-rose-400">
                                    <TrendingDown size={13} />
                                    {formatarMoeda(valor, buscarMoneda(e.moneda_id))}
                                </span>
                            );
                        },
                    },
                    {
                        header: "Saldo",
                        accessor: "saldo",
                        align: "right",
                        width: "150px",
                        cell: (e) => {
                            const valor = aNumero(e.saldo);
                            if (valor === null) return null;
                            return formatarMoeda(valor, buscarMoneda(e.moneda_id));
                        },
                    },
                    {
                        header: "Usuario",
                        accessor: "creado_por_nombre",
                        width: "160px",
                        cell: (e) => {
                            const nombre = e.creado_por_nombre ?? (e.creado_por != null ? `#${e.creado_por}` : "-");
                            return (
                                <span className="truncate block" title={e.creado_por_email ?? nombre}>
                                    {nombre}
                                </span>
                            );
                        },
                    },
                ]}
            />

            <DetalleAsientoModal
                asientoId={asientoId}
                onClose={() => setAsientoId(null)}
                onCancelar={async (id, motivo) => {
                    if (!onCancelarAsiento) throw new Error("No hay función de cancelación disponible");
                    await onCancelarAsiento(id, motivo);
                }}
            />
        </div>
    );
};

export default ExtractoTable;