import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BadgeDollarSign, BriefcaseBusiness, Calendar, Check, DollarSign, FileText, Scale, TrendingUp } from "lucide-react";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import type { InterfaceCajas } from "../../cajas/Interfaces/InterfaceCajas";
import type { AsientoNuevo } from "../services/extractoCuentaService";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import SelectCustom from "../../../components/utils/SelectCustom";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarData, formatarDataHora, formatarDataInput } from "../../../components/utils/Formatadores";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

interface FormDeposito {
    cajaId: number;
    monedaId: number;
    cuentaId: number;
    valor: number;
    fecha: string;
    observacion: string;
}

interface InterfaceDepositoBancoModal {
    openModal: boolean;
    setOpenModal: () => void;
    cajaLogueada: InterfaceCajas | null;
    datosCajas: InterfaceCajas[];
    datosCuentas: InterfaceCuenta[];
    datosMonedas: InterfaceMoneda[];
    monedaBase: InterfaceMoneda | null;
    datosCambios: InterfaceTipoCambio[];
    fechaMovimiento: string;
    cargarCuentaPorId: (id: number) => Promise<void>;
    recibeAsientos: (asientos: AsientoNuevo[]) => Promise<void> | void;
}

/* ------------------------------------------------------------------ */
/* Utilidades puras                                                    */
/* ------------------------------------------------------------------ */

const noop = () => { };

/** Tasa para convertir 1 unidad de `origen` a `destino`. Devuelve 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (!origen || !destino) return 0;
    if (origen === destino) return 1;

    const directo = cambios.find(c => c.moneda_origen === origen && c.moneda_destino === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);

    const inverso = cambios.find(c => c.moneda_origen === destino && c.moneda_destino === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);

    return 0;
};

/** Coincidencia por código exacto o por texto parcial */
const coincideTexto = (id: number | string, texto: string | undefined, termino: string): boolean =>
    String(id) === termino || (texto ?? "").toLowerCase().includes(termino.toLowerCase());

/** Dos asientos con el mismo valor, fecha e histórico: caja Débito y cuenta Crédito */
const construirAsientos = (
    form: FormDeposito,
    cuenta: InterfaceCuenta,
    cambio: number,
    valorConvertido: number,
    valorContable: number
): AsientoNuevo[] => {
    const obs = form.observacion.trim() ? ` (obs: ${form.observacion.trim()})` : "";
    const historico = `Depósito de dinero de cuenta ${cuenta.nombre} referente a Depósito bancario con compensación ${formatarData(form.fecha)}${obs}`;

    const base: Omit<AsientoNuevo, "cajaId" | "cuentaId" | "naturaleza" | "forma_pago"> = {
        movimientoId: null,
        tipoAsiento: "DEPOSITO",
        subcategoriaId: null,
        monedaId: form.monedaId,
        valor: form.valor,
        tipoCambioId: null,
        cambio,
        valorConvertido,
        valorContable,
        personaId: null,
        tituloId: null,
        documentoId: null,
        documento: null,
        vencimiento: null,
        historico,
        fechaContable: form.fecha,
    };

    return [
        { ...base, cajaId: form.cajaId, cuentaId: null, naturaleza: "Crédito", forma_pago: 'Efectivo', cajaMovimiento: form.cajaId, },
        { ...base, cajaId: null, cuentaId: Number(cuenta.id), naturaleza: "Débito", forma_pago: 'Lanzamiento Bancario', cajaMovimiento: form.cajaId, },
    ];
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

const DepositoBancoModal = ({
    openModal,
    setOpenModal,
    cajaLogueada,
    datosCajas,
    datosCuentas,
    datosMonedas,
    monedaBase,
    datosCambios,
    fechaMovimiento,
    cargarCuentaPorId,
    recibeAsientos,
}: InterfaceDepositoBancoModal) => {
    const monedaBaseId = Number(monedaBase?.id ?? 0);

    const formularioInicial = (): FormDeposito => ({
        cajaId: Number(cajaLogueada?.id ?? 0),
        monedaId: monedaBaseId,
        cuentaId: 0,
        valor: 0,
        fecha: fechaMovimiento ? formatarDataInput(fechaMovimiento) : "",
        observacion: "",
    });

    const [form, setForm] = useState<FormDeposito>(formularioInicial);
    const [modalCuentas, setModalCuentas] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Cada vez que se abre el modal, arranca con la caja logueada y su moneda
    useEffect(() => {
        if (openModal) setForm(formularioInicial());
    }, [openModal]);

    /* ---------- Derivados ---------- */

    const cajas = datosCajas;
    const cuentas = datosCuentas.filter(c => c.activo);

    const cajaSeleccionada =
        cajas.find(c => Number(c.id) === form.cajaId) ??
        (cajaLogueada && Number(cajaLogueada.id) === form.cajaId ? cajaLogueada : undefined);

    const cuentaSeleccionada = cuentas.find(c => Number(c.id) === form.cuentaId);
    const monedaCuentaId = Number(cuentaSeleccionada?.moneda?.id ?? 0);
    const monedaCuenta = monedaCuentaId ? (cuentaSeleccionada?.moneda as InterfaceMoneda) : undefined;
    const monedaSeleccionada = datosMonedas.find(m => Number(m.id) === form.monedaId);

    // Tasas desde la moneda elegida: hacia la cuenta (valor convertido) y hacia la base (valor contable)
    const tasaCuenta = obtenerTasa(datosCambios, form.monedaId, monedaCuentaId);
    const tasaBase = obtenerTasa(datosCambios, form.monedaId, monedaBaseId);
    const valorConvertido = form.valor * tasaCuenta;
    const valorContable = form.valor * tasaBase;
    const mostrarConversion = !!cuentaSeleccionada && monedaCuentaId !== form.monedaId;

    const opcionesMoneda = datosMonedas.map(m => ({ value: Number(m.id), label: m.nombre }));

    /* ---------- Caja ---------- */

    const seleccionarCaja = (caja: InterfaceCajas) => {
        setForm(f => ({
            ...f,
            cajaId: Number(caja.id),
            monedaId: monedaBaseId,
        }));
    };

    const opcionesCaja: SearchOption[] = [...cajas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(c => ({ id: c.id, texto: `${c.descripcion}` }));

    const handleSelectCaja = (option: SearchOption) => {
        const caja = cajas.find(c => String(c.id) === String(option.id));
        if (caja) seleccionarCaja(caja);
    };

    const buscarCaja = (term: string) => {
        const t = term.trim();
        const caja = t ? cajas.find(c => coincideTexto(c.id, c.descripcion, t)) : undefined;

        if (!caja) {
            setForm(f => ({ ...f, cajaId: 0 }));
            return;
        }
        seleccionarCaja(caja);
    };

    /* ---------- Cuenta banco ---------- */

    const seleccionarCuenta = (cuenta: InterfaceCuenta) => {
        setForm(f => ({ ...f, cuentaId: Number(cuenta.id) }));
    };

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
        const cuenta = t ? cuentas.find(c => coincideTexto(c.id, c.nombre, t)) : undefined;

        if (!cuenta) {
            setForm(f => ({ ...f, cuentaId: 0 }));
            return;
        }

        seleccionarCuenta(cuenta);
        if (Number(cuenta.id) !== form.cuentaId) {
            cargarCuentaPorId(Number(cuenta.id));
        }
    };

    const handleSeleccionarCuentaModal = (cuenta: InterfaceCuenta) => {
        seleccionarCuenta(cuenta);
        cargarCuentaPorId(Number(cuenta.id));
        setModalCuentas(false);
    };

    /* ---------- Confirmar / Cancelar ---------- */

    const resetear = () => setForm(formularioInicial());

    const confirmar = async () => {
        if (enviando) return;

        if (!cajaSeleccionada) {
            showAlert("Falta seleccionar la caja", "warning");
            return;
        }
        if (!form.monedaId) {
            showAlert("Falta seleccionar la moneda", "warning");
            return;
        }
        if (!cuentaSeleccionada) {
            showAlert("Falta seleccionar la cuenta banco", "warning");
            return;
        }
        if (!form.valor || form.valor <= 0) {
            showAlert("El valor debe ser mayor a cero", "warning");
            return;
        }
        if (!form.fecha) {
            showAlert("Falta la fecha de compensación", "warning");
            return;
        }
        if (!tasaBase || (mostrarConversion && !tasaCuenta)) {
            showAlert("No existe tipo de cambio para las monedas seleccionadas", "warning");
            return;
        }

        const asientos = construirAsientos(form, cuentaSeleccionada, tasaBase, valorConvertido, valorContable);

        try {
            setEnviando(true);
            await recibeAsientos(asientos);
            resetear();
            setOpenModal();
        } catch (error) {
            console.error("Error al registrar el depósito:", error);
            const mensaje = axios.isAxiosError(error)
                ? (error.response?.data as { message?: string } | undefined)?.message
                : undefined;
            showAlert(mensaje ?? "No se pudo registrar el depósito. Intente nuevamente.", "error");
        } finally {
            setEnviando(false);
        }
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
            if (modalCuentas) return;
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                void confirmarRef.current();
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
                subtitle="Registre un crédito desde cuenta bancaria hacia caja"
                isOpen={openModal}
                childrenPadding={false}
                width="720px"
                sizeBanner="sm"
                closeOnEsc={false}
                closeOnOverlay={false}
                onClose={setOpenModal}
                footer={
                    <div className="flex gap-2 justify-end items-center flex-wrap">
                        <button
                            type="button"
                            onClick={cancelar}
                            disabled={enviando}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={enviando}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                        >
                            <Check size={18} />
                            {enviando ? "Registrando..." : "Confirmar"}
                        </button>
                    </div>
                }
            >
                <div className="p-5 grid gap-4">
                    {/* Fila 1: Caja | Fecha */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputERP
                            type="searchNumber"
                            label="Caja"
                            icon={<BriefcaseBusiness size={18} />}
                            value={form.cajaId}
                            onChange={e => setForm(f => ({ ...f, cajaId: Number(e) || 0 }))}
                            searchOptions={opcionesCaja}
                            searchColumns={[
                                { key: "id", label: "CÓDIGO", width: "100px" },
                                { key: "texto", label: "DESCRIPCIÓN", width: "1fr" },
                            ]}
                            onSelectOption={handleSelectCaja}
                            onEnterPress={buscarCaja}
                            onBlur={buscarCaja}
                            displayMode="id-text"
                            searchMinChars={1}
                            showSearch={true}
                            placeholder="Seleccione la caja"
                        />

                        <InputERP
                            type="date"
                            label="Fecha *"
                            icon={<Calendar size={18} />}
                            value={form.fecha}
                            onChange={e => setForm(f => ({ ...f, fecha: String(e) }))}
                        />
                    </div>

                    {/* Fila 2: Cuenta banco (origen) | Moneda (destino) */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputERP
                            type="searchNumber"
                            label="Cuenta Banco"
                            icon={<TrendingUp size={18} />}
                            value={form.cuentaId}
                            onChange={e => setForm(f => ({ ...f, cuentaId: Number(e) || 0 }))}
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

                        <div className="flex flex-col gap-1">
                            <SelectCustom
                                options={opcionesMoneda}
                                label="Moneda"
                                value={form.monedaId}
                                isClearable={false}
                                searchable={false}
                                onChange={e => setForm(f => ({ ...f, monedaId: Number(e) }))}
                            />
                        </div>
                    </div>

                    {/* Fila 3: Valor | Valor convertido */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputERP
                            type="currency"
                            moneda={monedaSeleccionada}
                            label="Valor *"
                            icon={<DollarSign size={18} />}
                            value={form.valor}
                            onChange={e => setForm(f => ({ ...f, valor: Number(e) || 0 }))}
                        />

                        {mostrarConversion && (
                            <InputERP
                                type="currency"
                                moneda={monedaCuenta}
                                label="Valor Convertido"
                                icon={<DollarSign size={18} />}
                                value={valorConvertido}
                                readOnly
                                onChange={noop}
                            />
                        )}
                    </div>

                    {/* Fila 4: Observación */}
                    <InputERP
                        type="textarea"
                        label="Observación"
                        icon={<FileText size={18} />}
                        value={form.observacion}
                        rows={3}
                        onChange={e => setForm(f => ({ ...f, observacion: String(e) }))}
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

export default DepositoBancoModal;