import type { InterfaceBaja, InterfaceBajaCaja } from "../interfaces/interfaceRecibimiento";
import type { InterfaceUsuarios } from "../../usuarios/interfaces/usuariosInterfaces";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceOperacionBaja } from "../../operaciones/interfaces/InterfaceOperacion";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";
import DataTable from "../../../components/utils/DataTable";
import Tarjeta from "../../../components/utils/Tarjeta";
import { TrendingUp, Banknote, ChevronDown, ChevronUp, Coins, FileText, Landmark, Receipt, Trash2, CreditCard, Wallet } from "lucide-react";
import { formatarData, formatarMoeda } from "../../../components/utils/Formatadores";
import { Flag } from "../../../context/FlagsContext";
import { useState } from "react";
import type { InterfaceSubcategoria, tipoCategoria } from "../../categorias/interfaces/InterfaceCategoria";

interface InterfaceTableBaja {
    datosBaja: InterfaceBaja[];
    datosBajaCaja: InterfaceBajaCaja[];
    datosMoneda: InterfaceMoneda[];
    datosOperaciones: InterfaceOperacionBaja[];
    monedaBase: InterfaceMoneda | null;
    datosPersonas: InterfacePersona[];
    monedaMovimiento: InterfaceMoneda | null;
    datosUsuario: InterfaceUsuarios | null;
    datosCuentas: InterfaceCuenta[];
    datosCategorias: InterfaceSubcategoria[];
    datosCambios: InterfaceTipoCambio[];
    abrirModal: () => void;
    abrirModalBanco: () => void;
    abrirModalTarjeta: () => void;
    abrirModalCredito: (naturaleza: 'Crédito' | 'Débito') => void;
    eliminarPagoCaja: () => void;
    eliminarLinea: (id: string) => void;
}

// Tipo de subcategoría que corresponde a cada naturaleza de la baja.
// SUPUESTO: Crédito usa subcategorías de Ingreso y Débito de Gasto. Ajustar si no es así.
const TIPO_POR_NATURALEZA: Record<string, tipoCategoria> = {
    "Crédito": "Ingreso",
    "Débito": "Gasto",
};

interface TotalBadgeProps {
    monto: string;
    variant: "emerald" | "yellow";
    label?: string;
}

const TotalBadge = ({ monto, variant, label = "Total" }: TotalBadgeProps) => (
    <span
        className={`px-3 py-1 rounded-full border text-xs text-sm font-semibold ${variant === "emerald"
            ? "bg-emerald-50 border-emerald-200 text-emerald-500"
            : "bg-amber-50 border-amber-200 text-yellow-500"
            }`}
    >
        {label}: {monto}
    </span>
);

const OperacionBadge = ({ operacion }: { operacion: string }) => {
    if (!operacion) return <>-</>;

    const esIngresoEventual = operacion.trim().toLowerCase() === "ingreso eventual";

    return (
        <span
            className={`px-2 rounded-lg border text-[11px] font-semibold whitespace-nowrap ${esIngresoEventual
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-blue-500/15 border-blue-500/80 text-blue-500"
                }`}
        >
            {operacion}
        </span>
    );
};

// Un id es "guardado" si viene del backend (numérico). Los temporales son UUID.
const esGuardado = (id: unknown): boolean => /^\d+$/.test(String(id ?? ""));

// Id a mostrar en la columna Doc: vacío si no está guardado.
// En bajas de título, el id de baja es el id del título.
const docMostrado = (b: InterfaceBaja): string => {
    if (!esGuardado(b.id)) return "";
    return Number(b.titulo_id) > 0 ? String(b.titulo_id) : String(b.id);
};

// Fecha para celdas: vacía si no hay valor, para no mostrar "Invalid Date".
const fechaCelda = (valor: unknown): string => {
    if (!valor) return "";
    return formatarData(String(valor));
};

const cotizacion = (n: number): string =>
    n.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Tasa para convertir 1 unidad de `origen` a `destino`. Devuelve 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (origen === destino) return 1;

    const directo = cambios.find(c => Number(c.moneda_origen) === origen && Number(c.moneda_destino) === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);

    const inverso = cambios.find(c => Number(c.moneda_origen) === destino && Number(c.moneda_destino) === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);

    return 0;
};

// Monto de la línea en la moneda del movimiento. Si el backend no manda valor_convertido, usa valor_liquido.
const montoEnMonedaMovimiento = (b: InterfaceBaja): number =>
    Number((b as any).valor_liquido ?? b.valor_liquido) || 0;

const TableBaja = ({
    datosBaja,
    abrirModalBanco,
    eliminarLinea,
    eliminarPagoCaja,
    abrirModalTarjeta,
    abrirModalCredito,
    datosCategorias,
    datosPersonas,
    datosBajaCaja,
    monedaBase,
    monedaMovimiento,
    datosMoneda,
    datosCuentas,
    datosCambios,
    abrirModal,
}: InterfaceTableBaja) => {

    const [abiertoCaja, setAbiertoCaja] = useState(true);
    const cantidadCaja = datosBajaCaja.length;
    const monedaMovId = Number(monedaMovimiento?.id ?? 0);

    const nombreCuenta = (id: unknown): string => {
        if (!id) return "";
        const c = datosCuentas.find(c => Number(c.id) === Number(id));
        return c?.nombre ?? "";
    };

    // Filtra por tipo: los ids se repiten entre subcategoria_ingreso y subcategoria_gasto
    const nombreCategoria = (id: unknown, naturaleza: string): string => {
        if (!id) return "";
        const tipo = TIPO_POR_NATURALEZA[naturaleza];
        const c = datosCategorias.find(c =>
            Number(c.id) === Number(id) && (!tipo || c.categoria?.tipo === tipo)
        );
        return c?.nombre ?? "";
    };

    const nombreMoneda = (id: number) =>
        datosMoneda.find(m => Number(m.id) === Number(id))?.codigo ?? "";

    const datosTabla = datosBaja.map(b => {
        const monto = Number(b.valor_liquido) || 0;

        return {
            ...b,
            doc: docMostrado(b),
            operacion: b.operacion ?? "",
            tipoOperacion: b.naturaleza_financiera,
            categoria: nombreCategoria(b.categoria_id, b.naturaleza_financiera),
            cuenta: nombreCuenta(b.cuenta_id),
            moneda: nombreMoneda(b.moneda_id),
            debito: b.naturaleza_financiera === "Débito" ? monto : 0,
            credito: b.naturaleza_financiera === "Crédito" ? monto : 0,
        };
    });

    const datosCreditos = datosTabla.filter(d => d.naturaleza_financiera === "Crédito");
    const datosDebitos = datosTabla.filter(d => d.naturaleza_financiera === "Débito");

    // Totales en moneda del movimiento (no se suman montos de monedas distintas)
    const totalCredito = datosCreditos.reduce((acc, d) => acc + montoEnMonedaMovimiento(d), 0);
    const totalDebito = datosDebitos.reduce((acc, d) => acc + montoEnMonedaMovimiento(d), 0);

    const totalEfectivo = totalCredito - totalDebito;

    // Filas de caja: valor neto (valor - vuelto) convertido a la moneda del movimiento
    const filasCaja = datosBajaCaja.map(c => {
        const moneda = datosMoneda.find(m => Number(m.id) === Number(c.moneda_id)) ?? null;
        const valor = Number(c.valor) || 0;
        const vuelto = Number(c.vuelto) || 0;
        const neto = valor - vuelto;
        const valorConvertido = neto * obtenerTasa(datosCambios, Number(c.moneda_id), monedaMovId);

        return {
            ...c,
            monedaObj: moneda,
            codigo: moneda?.codigo ?? "",
            nombre: moneda?.nombre ?? "",
            neto,
            valorConvertido,
        };
    });

    const totalCajaConvertido = filasCaja.reduce((acc, f) => acc + f.valorConvertido, 0);

    const formatearTotal = (monto: number): string => {
        const moneda = monedaMovimiento ?? monedaBase;
        return moneda ? formatarMoeda(monto, moneda) : monto.toFixed(2);
    };

    const obtenerMoneda = (monedaId: number): InterfaceMoneda | null => {
        const moneda = datosMoneda.find(m => Number(m.id) === Number(monedaId));
        return moneda ?? monedaBase;
    };

    const formatearMonto = (monto: number, monedaId: number): string => {
        const moneda = obtenerMoneda(monedaId);
        if (!moneda) {
            return `${monto.toFixed(2)}`;
        }
        return formatarMoeda(monto, moneda);
    };

    const nombrePersonaPorId = (id: unknown): string => {
        if (id === null || id === undefined || id === "") return "";
        const persona = datosPersonas.find(p => Number(p.id) === Number(id));
        return persona?.nombre ?? "";
    };

    const columnasCreditos = [
        { header: "Doc", accessor: "doc", align: "start" as const },
        {
            header: "Tipo", accessor: "operacion", align: "start" as const,
            cell: (e: any) => <OperacionBadge operacion={e.operacion} />,
        },
        { header: "Factura", accessor: "documento", align: "start" as const },
        {
            header: "Nombre", accessor: "persona_id", align: "start" as const,
            cell: (e: any) => nombrePersonaPorId(e.persona_id),
        },
        {
            header: "Emisión", accessor: "emision", align: "start" as const,
            cell: (e: any) => fechaCelda(e.emision),
        },
        {
            header: "Venc.", accessor: "vencimiento", align: "start" as const,
            cell: (e: any) => fechaCelda(e.vencimiento),
        },
        {
            header: "Comp.", accessor: "fecha_compensacion", align: "start" as const,
            cell: (e: any) => fechaCelda(e.fecha_compensacion),
        },
        { header: "Observación", accessor: "observacion", align: "start" as const },
        {
            header: "Valor", accessor: "valor", align: "right" as const,
            cell: (e: any) => formatearMonto(Number(e.valor_liquido) || 0, Number(e.moneda_id ?? 1)),
        },
        { header: "Categoria", accessor: "categoria", align: "start" as const },
        {
            header: "", accessor: "eliminar", align: "start" as const,
            cell: (e: any) => (
                <button
                    type="button"
                    onClick={() => eliminarLinea(e.id)}
                    className="hover:text-red-600 text-red-500 p-1 rounded-lg"
                >
                    <Trash2 size={15} />
                </button>
            ),
        },
    ];

    const columnasDebitos = [
        { header: "Doc", accessor: "doc", align: "start" as const },
        {
            header: "Tipo", accessor: "operacion", align: "start" as const,
            cell: (e: any) => <OperacionBadge operacion={e.operacion} />,
        },
        {
            header: "Nombre", accessor: "persona_id", align: "start" as const,
            cell: (e: any) => nombrePersonaPorId(e.persona_id),
        },
        {
            header: "Venc.", accessor: "vencimiento", align: "start" as const,
            cell: (e: any) => fechaCelda(e.vencimiento),
        },
        {
            header: "Emisión", accessor: "emision", align: "start" as const,
            cell: (e: any) => fechaCelda(e.emision),
        },
        { header: "Observación", accessor: "observacion", align: "start" as const },
        {
            header: "Valor", accessor: "valor", align: "right" as const,
            cell: (e: any) => formatearMonto(Number(e.valor_liquido) || 0, Number(e.moneda_id ?? 1)),
        },
        { header: "Cuenta", accessor: "cuenta", align: "start" as const },
        {
            header: "", accessor: "eliminar", align: "start" as const,
            cell: (e: any) => (
                <button
                    type="button"
                    onClick={() => eliminarLinea(e.id)}
                    className="hover:text-red-600 text-red-500 p-1 rounded-lg"
                >
                    <Trash2 size={15} />
                </button>
            ),
        },
    ];

    const columnasCaja = [
        {
            header: "Bandera", accessor: "codigo", align: "start" as const,
            cell: (e: any) => e.monedaObj ? (
                <div className="flex items-center p-1 gap-2">
                    <Flag
                        className="rounded-sm border border-mi-tercera shrink-0"
                        country={e.codigo as "PYG"}
                        size={18}
                    />
                    <span className="text-xs text-mi-cuarta/60">{e.nombre}</span>
                </div>
            ) : "—",
        },
        {
            header: "Cotización", accessor: "cambio", align: "right" as const,
            cell: (e: any) => <span className="text-xs">{cotizacion(Number(e.cambio) || 0)}</span>,
        },
        {
            header: "Valor", accessor: "valor", align: "right" as const,
            cell: (e: any) => e.monedaObj
                ? <span className="text-xs">{formatarMoeda(Number(e.valor) || 0, e.monedaObj)}</span>
                : "—",
        },
        {
            header: "Vuelto", accessor: "vuelto", align: "right" as const,
            cell: (e: any) => e.monedaObj
                ? <span className="text-xs">{formatarMoeda(Number(e.vuelto) || 0, e.monedaObj)}</span>
                : "—",
        },
        {
            header: "Valor en Moneda Estándar", accessor: "valor_contable", align: "right" as const,
            cell: (e: any) => monedaBase
                ? <span className="text-xs text-yellow-500">{formatarMoeda(Number(e.valor_contable) || 0, monedaBase)}</span>
                : "—",
        },
    ];

    return (
        <>
            <Tarjeta
                icon={<Receipt size={18} />}
                title="Tipos de Recibo"
                contentPadding="p-0"
                headerAction={<TotalBadge monto={formatearTotal(totalCredito)} variant="emerald" />}
            >
                <DataTable
                    data={datosCreditos}
                    showGlobalSearch={false}
                    pagination={false}
                    showFilters={false}
                    size="sm"
                    iconSinDatos={<FileText size={18} />}
                    textSinDatos="Ningún tipo agregado"
                    columns={columnasCreditos}
                    footer={
                        <div className="p-2">
                            <div className="flex justify-start items-center gap-2">

                            <button
                                type="button"
                                onClick={() => abrirModal()}
                                className="flex justify-center items-center gap-2 text-xs px-2.5 py-1 font-semibold rounded-xl bg-mi-segunda text-white border border-mi-segunda/95 hover:bg-mi-segunda/95 transition-all duration-200 active:scale-[0.98]"
                            >
                                <TrendingUp size={15} />
                                Ingreso Eventual
                            </button>
                            <button
                                type="button"
                                onClick={() => abrirModalCredito("Crédito")}
                                className="flex justify-center items-center gap-2 text-xs px-2.5 py-1 font-semibold rounded-xl bg-mi-segunda text-white border border-mi-segunda/95 hover:bg-mi-segunda/95 transition-all duration-200 active:scale-[0.98]"
                            >
                                <Wallet size={15} />
                                Crédito
                            </button>
                            </div>
                        </div>
                    }
                />
            </Tarjeta>

            <Tarjeta
                icon={<Banknote size={18} />}
                title="Formas de Recibo"
                contentPadding="p-0"
                headerAction={<TotalBadge monto={formatearTotal(totalDebito)} variant="yellow" />}
            >
                <DataTable
                    data={datosDebitos}
                    showGlobalSearch={false}
                    pagination={false}
                    showFilters={false}
                    size="sm"
                    iconSinDatos={<Banknote size={18} />}
                    textSinDatos="Ninguna forma agregada"
                    columns={columnasDebitos}
                    footer={
                        <div className="p-2 flex justify-between">
                            <div className="flex justify-start items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => abrirModalBanco()}
                                    className="flex justify-center items-center gap-2 text-xs px-2.5 py-1 font-semibold rounded-xl bg-mi-segunda text-white border border-mi-segunda/95 hover:bg-mi-segunda/95 transition-all duration-200 active:scale-[0.98]"
                                >
                                    <Landmark size={15} />
                                    Depósito Bancario
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirModalTarjeta()}
                                    className="flex justify-center items-center gap-2 text-xs px-2.5 py-1 font-semibold rounded-xl bg-mi-segunda text-white border border-mi-segunda/95 hover:bg-mi-segunda/95 transition-all duration-200 active:scale-[0.98]"
                                >
                                    <CreditCard size={15} />
                                    Tarjeta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirModalCredito("Débito")}
                                    className="flex justify-center items-center gap-2 text-xs px-2.5 py-1 font-semibold rounded-xl bg-mi-segunda text-white border border-mi-segunda/95 hover:bg-mi-segunda/95 transition-all duration-200 active:scale-[0.98]"
                                >
                                    <Wallet size={15} />
                                    Crédito
                                </button>
                            </div>
                            <div className="flex justify-center items-center">
                                <TotalBadge label="Efectivo" monto={formatearTotal(totalEfectivo)} variant="yellow" />
                            </div>
                        </div>
                    }
                />
            </Tarjeta>

            {datosBajaCaja.length > 0 && (
                <div className="rounded-3xl border border-amber-200 bg-white overflow-hidden shadow-sm">
                    <div
                        onClick={() => setAbiertoCaja(v => !v)}
                        role="button"
                        aria-expanded={abiertoCaja}
                        className="w-full flex items-center justify-between gap-3 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/70 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Coins size={18} className="text-yellow-500" />
                            <span className="font-semibold text-xs text-yellow-500">Valor por Moneda</span>
                            <span className="text-sm text-yellow-500">({cantidadCaja} Artículos)</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-amber-700">
                                {monedaMovimiento
                                    ? formatarMoeda(totalCajaConvertido, monedaMovimiento)
                                    : totalCajaConvertido.toFixed(2)}
                            </span>
                            {abiertoCaja
                                ? <ChevronUp size={18} className="text-yellow-500" />
                                : <ChevronDown size={18} className="text-yellow-500" />
                            }
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    eliminarPagoCaja();
                                }}
                                className="hover:text-red-600 text-red-500 p-1 rounded-lg"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>

                    {abiertoCaja && (
                        <div className="border-t border-amber-200">
                            <DataTable
                                data={filasCaja}
                                showGlobalSearch={false}
                                pagination={false}
                                showFilters={false}
                                columns={columnasCaja}
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default TableBaja;