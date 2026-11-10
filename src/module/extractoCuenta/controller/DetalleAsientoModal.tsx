import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { Check, FileText, Printer, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import { formatarData, formatarDataHora, formatarMoeda } from "../../../components/utils/Formatadores";
import InputERP from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { showAlert } from "../../../components/utils/Procesando";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceExtractoMovimiento, InterfaceExtractoSaldoAnterior } from "../interfaces/extractoCuentaInterface";
import {
    obtenerAsiento,
    type InterfaceAsientoDetalle,
} from "../services/extractoCuentaService";

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
                    claseValor="text-mi-tercera text-base font-bold"
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

/** "Nombre (email)" del usuario; si no vino el join, muestra el id */
const describirUsuario = (nombre?: string | null, email?: string | null, id?: number | null) => {
    if (nombre) return email ? `${nombre} (${email})` : nombre;
    return id ?? "-";
};

const DetalleAsientoModal = ({ asientoId, onClose, onCancelar }: InterfaceDetalleAsientoModal) => {
    const { token } = useAuth();
    const [detalle, setDetalle] = useState<InterfaceAsientoDetalle | null>(null);
    const [cargando, setCargando] = useState(false);
    const [modoCancelar, setModoCancelar] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [enviando, setEnviando] = useState(false);

    // Cada vez que se abre otro asiento, carga su detalle y limpia la cancelación
    useEffect(() => {
        setModoCancelar(false);
        setMotivo("");

        if (asientoId === null || !token) {
            setDetalle(null);
            return;
        }

        let cancelado = false;
        setCargando(true);
        setDetalle(null);

        obtenerAsiento(token, asientoId)
            .then((data) => {
                if (!cancelado) setDetalle(data);
            })
            .catch(() => {
                if (!cancelado) showAlert("No se pudo cargar el asiento", "error");
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });

        return () => {
            cancelado = true;
        };
    }, [asientoId, token]);

    // Solo se cancela si es un asiento sin movimiento y está efectivado
    const puedeCancelar =
        !!detalle && detalle.movimiento_id == null && detalle.estado === "Efectivado";

    const motivoDeshabilitado = !detalle
        ? ""
        : detalle.movimiento_id != null
            ? "El asiento pertenece a un movimiento. Cancelalo desde el movimiento"
            : detalle.estado !== "Efectivado"
                ? "El asiento ya está cancelado"
                : "";

    const cantidadGrupo = detalle?.grupo?.length ?? 1;
    const motivoValido = motivo.trim().length > 0;
    const ubicacion = detalle ? describirUbicacion(detalle) : null;

    const confirmarCancelacion = async () => {
        if (!detalle || !motivoValido || enviando) return;

        try {
            setEnviando(true);
            await onCancelar(detalle.id, motivo.trim());
            onClose();
        } catch (error) {
            const mensaje = axios.isAxiosError(error)
                ? (error.response?.data as { message?: string } | undefined)?.message
                : undefined;
            showAlert(mensaje ?? "No se pudo cancelar el asiento", "error");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <>
        <div>
            <ModalGeneral
            icon={<Receipt size={18} />}
            title={`Asiento #${asientoId ?? ""}`}
            subtitle="Detalle del asiento"
            isOpen={asientoId !== null}
            childrenPadding={false}
            width="1200px"
            sizeBanner="sm"
            closeOnEsc={false}
            closeOnOverlay={false}
            onClose={onClose}
            footer={
                <div className="flex gap-2 justify-end items-center flex-wrap">
                    {modoCancelar ? (
                        <button
                            type="button"
                            onClick={() => {
                                setModoCancelar(false);
                                setMotivo("");
                            }}
                            disabled={enviando}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all disabled:opacity-50"
                        >
                            Volver
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={enviando}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all disabled:opacity-50"
                        >
                            Cerrar
                        </button>
                    )}

                    {modoCancelar ? (
                        <button
                            type="button"
                            onClick={confirmarCancelacion}
                            disabled={!motivoValido || enviando}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-rose-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={18} />
                            {enviando
                                ? "Cancelando..."
                                : `Confirmar cancelación${cantidadGrupo > 1 ? ` (${cantidadGrupo} asientos)` : ""}`}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setModoCancelar(true)}
                            disabled={!puedeCancelar}
                            title={motivoDeshabilitado || "Cancelar asiento y su par"}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Cancelar asiento
                        </button>
                    )}
                </div>
            }
            children={
                <div className="p-5 grid gap-4">
                    {cargando || !detalle || !ubicacion ? (
                        <p className="text-sm text-mi-cuarta/60">Cargando...</p>
                    ) : (
                        <>
                            {/* Cuenta o caja a la que corresponde el asiento */}
                            <div className="rounded-xl border border-mi-primera/15 bg-mi-primera/5 p-4 grid grid-cols-4 gap-4">
                                <div className="col-span-2 flex flex-col gap-0.5">
                                    <span className="text-[11px] uppercase text-mi-tercera/70">{ubicacion.tipo}</span>
                                    <span className="text-base font-semibold text-mi-cuarta">{ubicacion.titulo}</span>
                                    {ubicacion.detalle && (
                                        <span className="text-xs text-mi-cuarta/70">{ubicacion.detalle}</span>
                                    )}
                                </div>
                                <Campo label="Moneda" valor={detalle.cuenta_moneda_id ?? detalle.moneda_id} />
                                <Campo label="Caja en uso" valor={detalle.caja_movimiento} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Campo label="Estado" valor={detalle.estado} />
                                <Campo label="Tipo" valor={detalle.tipo_asiento} />
                                <Campo label="Movimiento" valor={detalle.movimiento_id ?? "Sin movimiento"} />
                                <Campo label="Naturaleza" valor={detalle.naturaleza} />
                                <Campo label="Forma de pago" valor={detalle.forma_pago} />
                                <Campo label="Moneda del asiento" valor={detalle.moneda_id} />
                                <Campo label="Valor" valor={fmtNumero(detalle.valor)} />
                                <Campo label="Cambio" valor={fmtNumero(detalle.cambio)} />
                                <Campo label="Valor convertido" valor={fmtNumero(detalle.valor_convertido)} />
                                <Campo label="Valor contable" valor={fmtNumero(detalle.valor_contable)} />
                                <Campo label="Fecha contable" valor={formatarData(detalle.fecha_contable)} />
                                <Campo label="Vencimiento" valor={formatarData(detalle.vencimiento)} />
                                <Campo label="Documento" valor={detalle.documento} />
                                <Campo label="Persona" valor={detalle.persona_id} />
                                <Campo
                                    label="Creado por"
                                    valor={describirUsuario(detalle.creado_por_nombre, detalle.creado_por_email, detalle.creado_por)}
                                />
                            </div>

                            <Campo label="Histórico" valor={detalle.historico} />

                            {detalle.grupo && detalle.grupo.length > 1 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[11px] uppercase text-mi-tercera/70">
                                        Asientos del grupo (se cancelan juntos)
                                    </span>
                                    <div className="rounded-xl border border-mi-primera/15 divide-y divide-mi-primera/10">
                                        {detalle.grupo.map((g) => {
                                            const u = describirUbicacion(g);
                                            return (
                                                <div key={g.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm items-center">
                                                    <span className="col-span-1">#{g.id}</span>
                                                    <span className="col-span-2">{g.naturaleza}</span>
                                                    <span className="col-span-4 truncate" title={u.titulo}>
                                                        {u.tipo}: {u.titulo}
                                                    </span>
                                                    <span className="col-span-2">{g.forma_pago ?? "-"}</span>
                                                    <span className="col-span-3 text-right">{fmtNumero(g.valor)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {detalle.estado !== "Efectivado" && (
                                <div className="text-sm rounded-xl border border-rose-200 bg-rose-50 text-rose-600 p-3">
                                    <div>Asiento {detalle.estado.toLowerCase()}</div>
                                    {detalle.motivo_cancelacion && (
                                        <div className="text-xs mt-1">Motivo: {detalle.motivo_cancelacion}</div>
                                    )}
                                    {(detalle.cancelado_por_nombre || detalle.cancelado_por_id) && (
                                        <div className="text-xs mt-1">
                                            Cancelado por: {describirUsuario(detalle.cancelado_por_nombre, detalle.cancelado_por_email, detalle.cancelado_por_id)}
                                            {detalle.fecha_cancelacion ? ` · ${fmtFecha(detalle.fecha_cancelacion)}` : ""}
                                        </div>
                                    )}
                                </div>
                            )}

                            {detalle.movimiento_id != null && (
                                <p className="text-xs text-mi-cuarta/60">
                                    Este asiento pertenece al movimiento #{detalle.movimiento_id}. Solo puede cancelarse desde el movimiento.
                                </p>
                            )}

                            {modoCancelar && (
                                <InputERP
                                    type="textarea"
                                    label="Motivo de cancelación *"
                                    icon={<FileText size={18} />}
                                    value={motivo}
                                    rows={3}
                                    onChange={(e) => setMotivo(String(e))}
                                />
                            )}
                        </>
                    )}
                </div>
            }

        />
        </div>
        </>
    );
};
export default DetalleAsientoModal;