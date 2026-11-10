import { useState, useEffect, useRef } from "react";
import { Check, WandSparkles, X } from "lucide-react";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { formatarMoeda } from "../../../components/utils/Formatadores";
import { showAlert } from "../../../components/utils/Procesando";
import { Flag } from "../../../context/FlagsContext";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceBajaCaja } from "../interfaces/interfacePago";
import InputERP from "../../../components/utils/InputERP";

export interface InterfaceModalCaja {
    openModal: boolean;
    setOpenModal: () => void;
    guardarCompleto: () => void;
    naturaleza_financiera: string;
    valorTotal: () => number;
    datosMoneda: InterfaceMoneda[];
    monedaBase: InterfaceMoneda | null;
    monedaMovimiento: InterfaceMoneda | null;
    datosCambios: InterfaceTipoCambio[];
    cajaId: number;
    recibeCaja?: (datos: InterfaceBajaCaja[]) => void;
}

interface FilaValor {
    valor: number;
    vuelto: number;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

// Muestra la cotización con los decimales necesarios, sin alterar el valor usado en los cálculos
const formatearTasa = (tasa: number): string => {
    if (tasa <= 0) return "—";
    const decimales = tasa >= 0.01
        ? 2
        : Math.min(8, Math.ceil(-Math.log10(tasa)) + 2);
    return tasa.toLocaleString("es-PY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimales,
    });
};

// Extrae solo el símbolo de la moneda (ej: "R$") a partir del formato de la app
const simboloMoneda = (moneda: InterfaceMoneda | null): string => {
    if (!moneda) return "";
    return formatarMoeda(0, moneda).replace(/[0-9.,\s]/g, "");
};

const GRID_COLS = "grid-cols-[1.4fr_1fr_1.2fr_auto_1.2fr_1.2fr]";

const ModalCaja = ({
    openModal,
    setOpenModal,
    valorTotal,
    naturaleza_financiera,
    datosMoneda,
    monedaBase,
    monedaMovimiento,
    datosCambios,
    cajaId,
    guardarCompleto,
    recibeCaja,
}: InterfaceModalCaja) => {
    const movId = Number(monedaMovimiento?.id ?? monedaBase?.id ?? 0);
    const baseId = Number(monedaBase?.id ?? 0);
    const simboloMov = simboloMoneda(monedaMovimiento);

    // Cuántas unidades de "ori" equivalen a 1 unidad de "des"
    // Ej: 1 Real = 1.080 Gs -> getC(Real, Gs) = 1080
    const getC = (ori: number, des: number): number => {
        if (ori === des) return 1;
        const directo = datosCambios.find(c => c.moneda_origen === ori && c.moneda_destino === des);
        if (directo && Number(directo.valor) > 0) return Number(directo.valor);
        const inverso = datosCambios.find(c => c.moneda_origen === des && c.moneda_destino === ori);
        if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);
        return 0;
    };

    const totalARecibir = valorTotal();

    const [valores, setValores] = useState<Record<number, FilaValor>>({});

    // Pre-llenar valor cuando abre el modal
    useEffect(() => {
        if (openModal && Object.keys(valores).length === 0) {
            // Encontrar la moneda de movimiento
            const monedaMovId = datosMoneda.find(m => Number(m.id) === movId);
            if (monedaMovId) {
                const tasaMov = getC(movId, movId); // Conversión a sí misma = 1
                const valorEnMonedaMov = redondear(totalARecibir / tasaMov);
                setValores({
                    [movId]: {
                        valor: valorEnMonedaMov,
                        vuelto: 0,
                    },
                });
            }
        }
    }, [openModal, movId, datosMoneda, datosCambios, totalARecibir]);

    const setCampo = (monedaId: number, campo: keyof FilaValor, n: number) =>
        setValores(v => ({
            ...v,
            [monedaId]: {
                valor: v[monedaId]?.valor ?? 0,
                vuelto: v[monedaId]?.vuelto ?? 0,
                [campo]: n,
            },
        }));

    // Cada fila: neto = recibido - vuelto en SU moneda (puede ser negativo si solo hay vuelto)
    // tasaMov: cotización a la moneda del movimiento (para mostrar y para el total)
    // cambio: cotización a la moneda base (el que se guarda en la línea)
    const filas = datosMoneda.map(m => {
        const id = Number(m.id);
        const tasaMov = getC(id, movId);
        const cambio = getC(id, baseId);
        const valor = valores[id]?.valor ?? 0;
        const vuelto = valores[id]?.vuelto ?? 0;
        const neto = valor - vuelto;
        return {
            moneda: m,
            id,
            tasa: tasaMov,
            cambio,
            valor,
            vuelto,
            neto,
            convertido: neto * tasaMov,
            contable: neto * cambio,
        };
    });

    // Totales netos: suman todas las monedas, incluido el vuelto entregado en cualquiera
    const totalConvertido = filas.reduce((acc, f) => acc + f.convertido, 0);
    const totalContable = filas.reduce((acc, f) => acc + f.contable, 0);
    const saldoRestante = Math.max(0, redondear(totalARecibir - totalConvertido));

    // Excedente: neto recibido de más (vuelto pendiente de entregar), en moneda del movimiento
    const excedente = Math.max(0, redondear(totalConvertido - totalARecibir));

    // Sugerencia de vuelto por moneda: el excedente expresado en la moneda de cada fila
    const filasConSugerencia = filas.map(f => ({
        ...f,
        sugerenciaVuelto: f.tasa > 0 ? redondear(excedente / f.tasa) : 0,
    }));

    // Sugerencia de valor: el saldo restante expresado en la moneda de cada fila
    const sugerirValor = (monedaId: number, tasa: number) => {
        if (tasa <= 0) return;
        const sugerido = redondear(saldoRestante / tasa);
        setCampo(monedaId, "valor", sugerido);
    };

    const aplicarSugerencia = (monedaId: number, sugerido: number, vueltoActual: number) =>
        setCampo(monedaId, "vuelto", redondear(vueltoActual + sugerido));

    const cerrarYLimpiar = () => {
        setValores({});
        setOpenModal();
    };

    const confirmar = () => {
        if (saldoRestante > 0) {
            showAlert("Falta cubrir el total a recibir", "warning");
            return;
        }

        if (excedente > 0) {
            showAlert("Falta registrar el vuelto", "warning");
            return;
        }

        // Todas las monedas deben tener tipo de cambio, aunque no tengan valor
        if (filas.some(f => f.cambio === 0)) {
            showAlert("Falta el tipo de cambio para una de las monedas", "warning");
            return;
        }

        // Se guardan todas las monedas, con valor 0 si no se usaron
        const lineas = filas.map(f => ({
            naturaleza_financiera: naturaleza_financiera,
            caja_id: cajaId,
            forma_pago: 'Efectivo',
            moneda_id: f.id,
            valor: f.valor,
            vuelto: f.vuelto,
            cambio: f.cambio,
            valor_contable: redondear(f.valor * f.cambio),
        })) as InterfaceBajaCaja[];

        recibeCaja?.(lineas);
        setValores({});
        setOpenModal();
        /* guardarCompleto() */
    };

    const confirmarRef = useRef(confirmar);
    confirmarRef.current = confirmar;

    useEffect(() => {
        if (!openModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                confirmarRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openModal]);

    return (
        <ModalGeneral
            icon={<Check size={18} />}
            title="Informar Valores Pagos"
            subtitle="Informe los valores pagos en cada moneda"
            isOpen={openModal}
            onClose={cerrarYLimpiar}
            width="900px"
            sizeBanner="sm"
            childrenPadding={false}
            closeOnEsc={false}
            closeOnOverlay={false}
            headerExtra={
                <div className="flex justify-end">
                    <div className="px-4 py-2 rounded-xl bg-mi-primera/50 border border-mi-cuarta/20 text-right">
                        <p className="text-[10px] font-semibold uppercase text-gray-200">Total a recibir</p>
                        <p className="text-lg font-bold text-white">
                            {monedaMovimiento ? formatarMoeda(totalARecibir, monedaMovimiento) : totalARecibir.toFixed(2)}
                        </p>
                    </div>
                </div>
            }
            children={
                <div className="p-4 grid gap-4">
                    {/* Tabla de monedas */}
                    <div className="rounded-2xl border border-mi-tercera/15 overflow-hidden">
                        <div className={`grid ${GRID_COLS} gap-3 px-4 py-2 bg-mi-primera/5 text-xs font-semibold uppercase text-mi-primera`}>
                            <span>Bandera</span>
                            <span className="text-right">Cotización</span>
                            <span className="text-right">Valor Recibido</span>
                            <span />
                            <span className="text-right">Saldo a Cobrar</span>
                            <span className="text-right">Vuelto</span>
                        </div>

                        {filasConSugerencia.map(f => {
                            const saldoEnMoneda = f.tasa > 0 ? saldoRestante / f.tasa : 0;
                            const esMovimiento = f.id === movId;
                            return (
                                <div
                                    key={f.id}
                                    className={`grid ${GRID_COLS} gap-3 items-center px-4 py-3 border-t border-mi-primera/10`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Flag
                                            className="rounded-sm border border-mi-tercera"
                                            country={f.moneda.codigo as "PYG"}
                                            size={28}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-mi-cuarta">{f.moneda.codigo}</span>
                                            <span className="text-xs text-mi-cuarta/60">{f.moneda.nombre}</span>
                                        </div>
                                    </div>

                                    <span className="text-right font-mono text-mi-cuarta/70">
                                        {formatearTasa(f.tasa)}
                                        {!esMovimiento && f.tasa > 0 && simboloMov ? ` ${simboloMov}` : ""}
                                    </span>

                                    <InputERP
                                        type="currency"
                                        moneda={f.moneda}
                                        value={f.valor || ""}
                                        placeholder="0"
                                        onFocus={e => e.target.select()}
                                        onChange={e => setCampo(f.id, "valor", Number(e) || 0)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => sugerirValor(f.id, f.tasa)}
                                        disabled={saldoRestante <= 0 || f.tasa <= 0}
                                        title="Sugerir valor con el saldo restante"
                                        className="p-2 rounded-lg text-mi-primera hover:bg-mi-primera/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <WandSparkles size={18} />
                                    </button>

                                    <span className="text-right text-mi-cuarta">
                                        {formatarMoeda(saldoEnMoneda, f.moneda)}
                                    </span>

                                    <div className="flex flex-col gap-1">
                                        <InputERP
                                            type="currency"
                                            moneda={f.moneda}
                                            value={f.vuelto || ""}
                                            placeholder="0"
                                            onFocus={e => e.target.select()}
                                            onChange={e => setCampo(f.id, "vuelto", Number(e) || 0)}
                                        />
                                        {f.sugerenciaVuelto > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => aplicarSugerencia(f.id, f.sugerenciaVuelto, f.vuelto)}
                                                className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                                title="Aplicar vuelto sugerido"
                                            >
                                                <WandSparkles size={12} />
                                                Sugerido: {formatarMoeda(f.sugerenciaVuelto, f.moneda)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Resumen */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                            <p className="text-[10px] font-semibold uppercase text-emerald-700">Total convertido</p>
                            <p className="text-lg font-bold text-emerald-700">
                                {monedaMovimiento ? formatarMoeda(totalConvertido, monedaMovimiento) : totalConvertido.toFixed(2)}
                            </p>
                        </div>
                        {
                            saldoRestante > 0 ?
                                (<div className="px-4 py-3 rounded-2xl bg-amber-50 border border-yellow-200">
                                    <p className="text-[10px] font-semibold uppercase text-yellow-700">Saldo restante</p>
                                    <p className="text-lg font-bold text-yellow-700">
                                        {monedaMovimiento ? formatarMoeda(saldoRestante, monedaMovimiento) : saldoRestante.toFixed(2)}
                                    </p>
                                </div>) : saldoRestante === 0 ? (<div className="px-4 py-3 rounded-2xl bg-white border border-mi-tercera/15">
                                    <p className="text-[10px] font-semibold uppercase text-mi-cuarta/60">Saldo restante</p>
                                    <p className="text-lg font-bold text-mi-cuarta">
                                        {monedaMovimiento ? formatarMoeda(saldoRestante, monedaMovimiento) : saldoRestante.toFixed(2)}
                                    </p>
                                </div>) :
                                    (
                                        <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                                            <p className="text-[10px] font-semibold uppercase text-amber-700">Vuelto pendiente</p>
                                            <p className="text-lg font-bold text-amber-700">
                                                {monedaMovimiento ? formatarMoeda(excedente, monedaMovimiento) : excedente.toFixed(2)}
                                            </p>
                                        </div>)
                        }
                        {/* <div className="px-4 py-3 rounded-2xl bg-mi-primera/5 border border-mi-primera/15">
                            <p className="text-[10px] font-semibold uppercase text-mi-primera">Total contable</p>
                            <p className="text-lg font-bold text-mi-primera">
                                {monedaBase ? formatarMoeda(totalContable, monedaBase) : totalContable.toFixed(2)}
                            </p>
                        </div> */}
                    </div>
                </div>
            }
            footer={
                <div className="flex gap-2 justify-end items-center flex-wrap">
                    <button
                        type="button"
                        onClick={cerrarYLimpiar}
                        className="flex items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all"
                    >
                        <X size={18} />
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={confirmar}
                        className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                    >
                        <Check size={18} />
                        Confirmar
                    </button>
                </div>
            }
        />
    );
};

export default ModalCaja;