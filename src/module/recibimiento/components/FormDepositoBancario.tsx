import { useEffect, useRef, useState } from "react";
import { BadgeDollarSign, Calendar, Check, DollarSign, FileText, Scale, TrendingUp } from "lucide-react";
import type { InterfaceBaja } from "../interfaces/interfaceRecibimiento";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarData, formatarDataHora, formatarDataInput } from "../../../components/utils/Formatadores";

/* ------------------------------------------------------------------ */
/* Constantes y tipos                                                  */
/* ------------------------------------------------------------------ */

const TIPO_BANCO = "Banco";
const noop = () => { };

interface Entidad {
    id: number | string;
    nombre?: string;
}

interface InterfaceFormDepositoBancario {
    openModal: boolean;
    setOpenModal: () => void;
    datosMoneda: InterfaceMoneda[];
    monedaBase: InterfaceMoneda | null;
    monedaMovimiento: InterfaceMoneda | null;
    datosCuentas: InterfaceCuenta[];
    datosCambios: InterfaceTipoCambio[];
    fechaMovimiento: string;
    cargarCuentaPorId: (id: number) => Promise<void>;
    recibeBaja: (datos: InterfaceBaja) => void;
}


/* ------------------------------------------------------------------ */
/* Utilidades puras                                                    */
/* ------------------------------------------------------------------ */

const crearLinea = (monedaMovId: number, fecha: string): InterfaceBaja => {
    const fechaFormateada = fecha ? formatarDataInput(fecha) : "";
    return {
        id: crypto.randomUUID(),
        operacion: 'DEPOSITO',
        moneda_id: monedaMovId,
        naturaleza_financiera: "Débito",
        forma_pago: 'Lanzamiento Bancario',
        categoria_id: null,
        cuenta_id: null,
        valor: 0,
        valor_liquido: 0,
        cambio: 0,
        valor_contable: 0,
        interes: 0,
        descuento: 0,
        valor_convertido: 0,
        titulo_id: null,
        documento_id: null,
        documento: "",
        persona_id: null,
        compensado: Boolean(fechaFormateada),
        emision: fechaFormateada,
        fecha_compensacion: fechaFormateada,
        vencimiento: null,
        observacion: "",
        observacion_auto: "",
    };
};

/** Tasa para convertir 1 unidad de `origen` a `destino`. Devuelve 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (origen === destino) return 1;

    const directo = cambios.find(c => c.moneda_origen === origen && c.moneda_destino === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);

    const inverso = cambios.find(c => c.moneda_origen === destino && c.moneda_destino === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);

    return 0;
};

/** Moneda de la cuenta banco seleccionada. 0 si no hay cuenta. */
const monedaDeCuenta = (cuentas: InterfaceCuenta[], cuentaId: number): number => {
    const cuenta = cuentas.find(c => Number(c.id) === Number(cuentaId));
    return Number(cuenta?.moneda?.id ?? 0);
};

/** Neto de la línea: valor + intereses - descuento */
const valorNeto = (f: InterfaceBaja): number =>
    (Number(f.valor) || 0) + (Number(f.interes) || 0) - (Number(f.descuento) || 0);

/** Coincidencia por código exacto o por nombre parcial */
const coincide = (item: Entidad, termino: string): boolean =>
    String(item.id) === termino || (item.nombre ?? "").toLowerCase().includes(termino.toLowerCase());

/** Texto automático de la línea, con el mismo formato que los demás movimientos */
const generarObservacionAuto = (
    f: InterfaceBaja,
    cuentas: InterfaceCuenta[]
): string => {
    const cuenta = cuentas.find(c => Number(c.id) === Number(f.cuenta_id));
    const nombreCuenta = cuenta?.nombre ?? "Sin cuenta";
    const fecha = f.fecha_compensacion ? ` con compensación ${formatarData(f.fecha_compensacion)}` : "";
    const obs = f.observacion?.trim() ? ` (obs: ${f.observacion.trim()})` : "";

    return `Depósito de dinero en cuenta ${nombreCuenta} referente a Depósito bancario${fecha}${obs}`;
};

/**
 * El valor está en la moneda del movimiento.
 * valor_contable: neto a moneda base.
 * valor_convertido: neto a moneda de la cuenta banco. Si no hay cuenta,
 * usa la moneda del movimiento como respaldo.
 */
const recalcular = (
    f: InterfaceBaja,
    monedaMovId: number,
    cuentas: InterfaceCuenta[],
    cambios: InterfaceTipoCambio[]
): InterfaceBaja => {
    const neto = valorNeto(f);
    const monedaCuentaId = monedaDeCuenta(cuentas, Number(f.cuenta_id)) || monedaMovId;
    return {
        ...f,
        moneda_id: monedaMovId,
        valor_contable: neto * (Number(f.cambio) || 0),
        valor_convertido: neto * obtenerTasa(cambios, monedaMovId, monedaCuentaId),
        observacion_auto: generarObservacionAuto(f, cuentas),
    };
};

/* ------------------------------------------------------------------ */
/* Subcomponentes                                                      */
/* ------------------------------------------------------------------ */

interface ModalSeleccionCuentaProps {
    isOpen: boolean;
    cuentas: InterfaceCuenta[];
    onClose: () => void;
    onSelect: (cuenta: InterfaceCuenta) => void;
}

const ModalSeleccionCuenta = ({ isOpen, cuentas, onClose, onSelect }: ModalSeleccionCuentaProps) => (
    <ModalGeneral
        title="Seleccionar Cuenta"
        isOpen={isOpen}
        icon={<Scale size={18} />}
        onClose={onClose}
        width="950px"
        sizeBanner="sm"
        childrenPadding={false}
    >
        <DataTable<InterfaceCuenta>
            data={cuentas}
            initialPageSize={10}
            columns={[
                { header: "ID", accessor: "id", align: "start", width: "90px", sortable: true, filterable: true },
                { header: "Nombre", accessor: "nombre", align: "start", sortable: true, filterable: true },
                {
                    header: "Moneda",
                    accessor: "moneda",
                    align: "center",
                    sortable: true,
                    filterable: true,
                    cell: e => e.moneda?.codigo,
                },
                { header: "Tipo", accessor: "tipo_cuenta", align: "center", sortable: true, filterable: true },
            ]}
            showGlobalSearch={true}
            globalSearchPlaceholder="Buscar por todos los campos!"
            selectable={false}
            onRowClick={onSelect}
        />
    </ModalGeneral>
);

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

const FormDepositoBancario = ({
    openModal,
    setOpenModal,
    datosMoneda,
    monedaBase,
    monedaMovimiento,
    datosCuentas,
    datosCambios,
    fechaMovimiento,
    cargarCuentaPorId,
    recibeBaja,
}: InterfaceFormDepositoBancario) => {
    const monedaBaseId = Number(monedaBase?.id ?? 0);
    const monedaMovId = Number(monedaMovimiento?.id ?? 0);

    const [linea, setLinea] = useState<InterfaceBaja>(() => crearLinea(monedaMovId, fechaMovimiento));
    const [modalCuentas, setModalCuentas] = useState(false);

    const cuentas = datosCuentas.filter(c => c.activo);
    const monedaCuentaId = monedaDeCuenta(datosCuentas, Number(linea.cuenta_id));
    const monedaCuenta = datosMoneda.find(m => Number(m.id) === monedaCuentaId);
    const mostrarConversion = linea.cuenta_id !== 0 && monedaCuentaId !== monedaMovId;
    const monedaMovInput = monedaCuenta ?? undefined;

    /* ---------- Efectos ---------- */

    // Recalcular montos y observación automática cuando cambian cuentas, moneda o tipos de cambio
    useEffect(() => {
        setLinea(f => recalcular(f, monedaMovId, datosCuentas, datosCambios));
    }, [monedaMovId, datosCuentas, datosCambios]);

    // Sincronizar fechas cuando cambia la fecha del movimiento
    useEffect(() => {
        if (!fechaMovimiento) return;
        const fecha = formatarDataInput(fechaMovimiento);
        setLinea(f => ({ ...f, emision: fecha, fecha_compensacion: fecha, compensado: true }));
    }, [fechaMovimiento]);

    /* ---------- Acciones de edición ---------- */

    const actualizar = (cambios: Partial<InterfaceBaja>) =>
        setLinea(f => recalcular({ ...f, ...cambios }, monedaMovId, datosCuentas, datosCambios));

    const resetear = () => setLinea(crearLinea(monedaMovId, fechaMovimiento));

    /* ---------- Cuenta banco ---------- */

    const seleccionarCuenta = (cuenta: InterfaceCuenta) => {
        actualizar({
            cuenta_id: Number(cuenta.id),
            cambio: obtenerTasa(datosCambios, monedaMovId, monedaBaseId),
        });
    };

    const limpiarCuenta = () => actualizar({ cuenta_id: 0 });

    const opcionesCuenta: SearchOption[] = [...cuentas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(c => ({ id: c.id, texto: `${c.nombre}` }));

    const handleSelectCuenta = (option: SearchOption) => {
        const cuenta = cuentas.find(c => String(c.id) === String(option.id));
        if (cuenta) seleccionarCuenta(cuenta);
        cargarCuentaPorId(Number(option.id));
    };

    const buscarCuenta = (term: string) => {
        const t = term.trim();
        const cuenta = t ? cuentas.find(c => coincide(c, t)) : undefined;

        if (!cuenta) {
            limpiarCuenta();
            return;
        }

        seleccionarCuenta(cuenta);
        if (String(cuenta.id) !== String(linea.cuenta_id)) {
            cargarCuentaPorId(Number(cuenta.id));
        }
    };

    const handleSeleccionarCuentaModal = (cuenta: InterfaceCuenta) => {
        seleccionarCuenta(cuenta);
        cargarCuentaPorId(Number(cuenta.id));
        setModalCuentas(false);
    };

    /* ---------- Confirmar / Cancelar ---------- */

    const confirmar = () => {
        if (!linea.cuenta_id) {
            showAlert("Falta seleccionar la cuenta banco", "warning");
            return;
        }
        if (!linea.valor) {
            showAlert("Valores no estan informados", "warning");
            return;
        }

        recibeBaja(recalcular(linea, monedaMovId, datosCuentas, datosCambios));
        resetear();
        setOpenModal();
    };

    const cancelar = () => {
        resetear();
        setOpenModal();
    };

    const confirmarRef = useRef(confirmar);
    confirmarRef.current = confirmar;

    useEffect(() => {
        if (!openModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // No confirmar si el selector de cuentas está encima
            if (modalCuentas) return;

            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                confirmarRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openModal, modalCuentas]);

    /* ---------- Render ---------- */

    return (
        <>
            <ModalGeneral
                icon={<BadgeDollarSign size={18} />}
                title="Depósito Bancario"
                subtitle="Registre un crédito (entrada) en cuenta bancaria"
                isOpen={openModal}
                childrenPadding={false}
                width="550px"
                sizeBanner="sm"
                closeOnEsc={false}
                closeOnOverlay={false}
                onClose={setOpenModal}
                footer={
                    <div className="flex gap-2 justify-end items-center flex-wrap">
                        <button
                            type="button"
                            onClick={cancelar}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all"
                        >
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
            >
                <div className="p-5 grid gap-4">
                    <InputERP
                        type="searchNumber"
                        label="Cuenta Banco"
                        icon={<TrendingUp size={18} />}
                        value={linea.cuenta_id}
                        onChange={e => setLinea(f => ({ ...f, cuenta_id: Number(e) || 0 }))}
                        searchOptions={opcionesCuenta}
                        searchColumns={[
                            { key: "id", label: "CÓDIGO", width: "100px" },
                            { key: "texto", label: "NOMBRE", width: "1fr" },
                        ]}
                        onSelectOption={handleSelectCuenta}
                        onEnterPress={buscarCuenta}
                        onBlur={buscarCuenta}
                        onSearchClick={() => setModalCuentas(true)}
                        displayMode="id-text"
                        searchMinChars={1}
                        showSearch={true}
                        placeholder="Seleccione la cuenta banco"
                    />

                    <InputERP
                        type="currency"
                        moneda={monedaMovimiento || monedaCuenta}
                        label="Valor *"
                        icon={<DollarSign size={18} />}
                        value={linea.valor}
                        onChange={e => actualizar({ valor: Number(e), valor_liquido: Number(e) })}
                    />

                    {mostrarConversion && linea.cuenta_id && (
                        <div className="grid grid-cols-1 gap-3">
                            <InputERP
                                type="currency"
                                moneda={monedaMovInput}
                                label="Valor Convertido"
                                icon={<DollarSign size={18} />}
                                value={linea.valor_convertido}
                                readOnly
                                onChange={noop}
                            />
                        </div>
                    )}

                    <InputERP
                        type="date"
                        label="Compensación *"
                        icon={<Calendar size={18} />}
                        value={linea.fecha_compensacion}
                        onChange={e => setLinea(f => ({ ...f, fecha_compensacion: String(e) }))}
                    />
                    <InputERP
                        type="textarea"
                        label="Observación"
                        icon={<FileText size={18} />}
                        value={linea.observacion}
                        rows={3}
                        onChange={e => actualizar({ observacion: String(e) })}
                    />
                </div>
            </ModalGeneral>

            <ModalSeleccionCuenta
                isOpen={modalCuentas}
                cuentas={cuentas}
                onClose={() => setModalCuentas(false)}
                onSelect={handleSeleccionarCuentaModal}
            />
        </>
    );
};

export default FormDepositoBancario;