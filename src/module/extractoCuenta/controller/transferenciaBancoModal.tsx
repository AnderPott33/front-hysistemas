import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeftRight, BriefcaseBusiness, Calendar, Check, DollarSign, FileText, Landmark, Scale, TrendingUp } from "lucide-react";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import type { InterfaceCajas } from "../../cajas/Interfaces/InterfaceCajas";
import type { AsientoNuevo } from "../services/extractoCuentaService";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import SelectCustom from "../../../components/utils/SelectCustom";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarData, formatarDataInput } from "../../../components/utils/Formatadores";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type TipoTransferencia = "BANCO_A_BANCO" | "CAJA_A_CAJA";
type CampoOrigenDestino = "origen" | "destino";
type Naturaleza = AsientoNuevo["naturaleza"];

interface FormTransferencia {
    tipo: TipoTransferencia;
    origenId: number;
    destinoId: number;
    monedaOrigenId: number;
    monedaDestinoId: number;
    valor: number;
    fecha: string;
    observacion: string;
}

/** Un lado de la transferencia (caja o cuenta) ya resuelto con su moneda */
interface LadoTransferencia {
    id: number;
    nombre: string;
    monedaId: number;
    esCaja: boolean;
}

interface InterfaceTransferenciaBancoModal {
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

const OPCIONES_TIPO = [
    { value: "BANCO_A_BANCO", label: "Banco a banco" },
    { value: "CAJA_A_CAJA", label: "Caja a caja" },
];

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

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/** Igual que en el controlador: valor_convertido solo se informa cuando difiere del valor contable */
const valorConvertidoSi = (valor: number, valorContable: number) =>
    valor === valorContable ? null : valorContable;

/**
 * Dos asientos con la misma fecha e histórico:
 * - origen con naturaleza Crédito (sale el dinero), en la moneda del origen
 * - destino con naturaleza Débito (entra el dinero), en la moneda del destino
 * Cada lado se valúa en moneda base con su propio tipo de cambio.
 * Las cajas usan forma de pago Efectivo; las cuentas, Lanzamiento Bancario.
 */
const construirAsientos = (
    form: FormTransferencia,
    origen: LadoTransferencia,
    destino: LadoTransferencia,
    cajaEnUso: number,
    valorDestino: number,
    tasaBaseOrigen: number,
    tasaBaseDestino: number
): AsientoNuevo[] => {
    const obs = form.observacion.trim() ? ` (obs: ${form.observacion.trim()})` : "";
    const historico =
        form.tipo === "CAJA_A_CAJA"
            ? `Transferencia de caja ${origen.nombre} a caja ${destino.nombre} referente a Transferencia entre cajas con fecha ${formatarData(form.fecha)}${obs}`
            : `Transferencia de cuenta ${origen.nombre} a cuenta ${destino.nombre} referente a Transferencia bancaria con compensación ${formatarData(form.fecha)}${obs}`;

    const armar = (lado: LadoTransferencia, naturaleza: Naturaleza, valor: number, tasaBase: number): AsientoNuevo => {
        const valorContable = redondear2(valor * tasaBase);

        return {
            movimientoId: null,
            tipoAsiento: "TRANSFERENCIA",
            forma_pago: lado.esCaja ? "Efectivo" : "Lanzamiento Bancario",
            cajaMovimiento: cajaEnUso,
            cajaId: lado.esCaja ? lado.id : null,
            cuentaId: lado.esCaja ? null : lado.id,
            subcategoriaId: null,
            naturaleza,
            monedaId: lado.monedaId,
            valor,
            tipoCambioId: null,
            cambio: tasaBase,
            valorConvertido: valorConvertidoSi(valor, valorContable),
            valorContable,
            personaId: null,
            tituloId: null,
            documentoId: null,
            documento: null,
            vencimiento: null,
            historico,
            fechaContable: form.fecha,
        };
    };

    return [
        armar(origen, "Crédito", form.valor, tasaBaseOrigen),
        armar(destino, "Débito", valorDestino, tasaBaseDestino),
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

const TransferenciaBancoModal = ({
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
}: InterfaceTransferenciaBancoModal) => {
    const monedaBaseId = Number(monedaBase?.id ?? 0);
    const cajaEnUso = Number(cajaLogueada?.id ?? 0);

    const formularioInicial = (): FormTransferencia => ({
        tipo: "BANCO_A_BANCO",
        origenId: 0,
        destinoId: 0,
        monedaOrigenId: monedaBaseId,
        monedaDestinoId: monedaBaseId,
        valor: 0,
        fecha: fechaMovimiento ? formatarDataInput(fechaMovimiento) : "",
        observacion: "",
    });

    const [form, setForm] = useState<FormTransferencia>(formularioInicial);
    const [selectorCuenta, setSelectorCuenta] = useState<CampoOrigenDestino | null>(null);
    const [enviando, setEnviando] = useState(false);

    // Cada vez que se abre el modal, arranca limpio con la fecha del movimiento
    useEffect(() => {
        if (openModal) setForm(formularioInicial());
    }, [openModal]);

    const esCajaACaja = form.tipo === "CAJA_A_CAJA";

    /* ---------- Listas ---------- */

    const cuentas = datosCuentas.filter(c => c.activo);
    const cajas = datosCajas;

    const opcionesCuenta: SearchOption[] = [...cuentas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(c => ({ id: c.id, texto: `${c.nombre}` }));

    const opcionesCaja: SearchOption[] = [...cajas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(c => ({ id: c.id, texto: `${c.descripcion}` }));

    const opcionesMoneda = datosMonedas.map(m => ({ value: Number(m.id), label: m.nombre }));

    /* ---------- Lados resueltos ---------- */

    // En caja a caja la moneda la elige el usuario; en banco a banco viene de la cuenta.
     /* ---------- Lados resueltos ---------- */

    // En caja a caja la moneda la elige el usuario; en banco a banco viene de la cuenta.
    const ladoDesde = (campo: CampoOrigenDestino): LadoTransferencia | null => {
        const id = campo === "origen" ? form.origenId : form.destinoId;

        if (esCajaACaja) {
            const monedaId = campo === "origen" ? form.monedaOrigenId : form.monedaDestinoId;
            const caja = cajas.find(c => Number(c.id) === id);
            return caja
                ? {
                    id: Number(caja.id),
                    nombre: caja.descripcion ?? `Caja ${caja.id}`,
                    monedaId,
                    esCaja: true,
                }
                : null;
        }

        const cuenta = cuentas.find(c => Number(c.id) === id);
        return cuenta
            ? {
                id: Number(cuenta.id),
                nombre: cuenta.nombre ?? `Cuenta ${cuenta.id}`,
                monedaId: Number(cuenta.moneda?.id ?? 0),
                esCaja: false,
            }
            : null;
    };

    const origenLado = ladoDesde("origen");
    const destinoLado = ladoDesde("destino");

    /* ---------- Conversiones ---------- */

    const monedaOrigenId = origenLado?.monedaId ?? 0;
    const monedaDestinoId = destinoLado?.monedaId ?? 0;
    const monedaOrigen = datosMonedas.find(m => Number(m.id) === monedaOrigenId);
    const monedaDestino = datosMonedas.find(m => Number(m.id) === monedaDestinoId);

    // Origen -> destino: convierte el valor de salida al valor de entrada
    const tasaDestino = obtenerTasa(datosCambios, monedaOrigenId, monedaDestinoId);
    const valorDestino = redondear2(form.valor * tasaDestino);
    const mostrarDestino = !!origenLado && !!destinoLado && monedaOrigenId !== monedaDestinoId;

    // Cada moneda -> base: alimenta valor_contable de su propio asiento
    const tasaBaseOrigen = obtenerTasa(datosCambios, monedaOrigenId, monedaBaseId);
    const tasaBaseDestino = obtenerTasa(datosCambios, monedaDestinoId, monedaBaseId);

    /* ---------- Selección ---------- */

    const asignar = (campo: CampoOrigenDestino, id: number) => {
        setForm(f => (campo === "origen" ? { ...f, origenId: id } : { ...f, destinoId: id }));
    };

    const buscarPorTexto = <T,>(
        lista: T[],
        term: string,
        id: (item: T) => number | string,
        texto: (item: T) => string | undefined
    ): T | undefined => {
        const t = term.trim();
        return t ? lista.find(item => coincideTexto(id(item), texto(item), t)) : undefined;
    };

    const handleSelectCuenta = (campo: CampoOrigenDestino, option: SearchOption) => {
        const cuenta = cuentas.find(c => String(c.id) === String(option.id));
        if (cuenta) asignar(campo, Number(cuenta.id));
        cargarCuentaPorId(Number(option.id));
    };

    const buscarCuenta = (campo: CampoOrigenDestino, term: string) => {
        const cuenta = buscarPorTexto(cuentas, term, c => c.id, c => c.nombre);
        asignar(campo, cuenta ? Number(cuenta.id) : 0);
        if (cuenta) cargarCuentaPorId(Number(cuenta.id));
    };

    const handleSeleccionarCuentaDesdeTabla = (cuenta: InterfaceCuenta) => {
        if (!selectorCuenta) return;
        asignar(selectorCuenta, Number(cuenta.id));
        cargarCuentaPorId(Number(cuenta.id));
        setSelectorCuenta(null);
    };

    const handleSelectCaja = (campo: CampoOrigenDestino, option: SearchOption) => {
        const caja = cajas.find(c => String(c.id) === String(option.id));
        asignar(campo, caja ? Number(caja.id) : 0);
    };

    const buscarCaja = (campo: CampoOrigenDestino, term: string) => {
        const caja = buscarPorTexto(cajas, term, c => c.id, c => c.descripcion);
        asignar(campo, caja ? Number(caja.id) : 0);
    };

    /* ---------- Cambio de tipo ---------- */

    const cambiarTipo = (tipo: TipoTransferencia) => {
        setForm(f => ({
            ...formularioInicial(),
            tipo,
            fecha: f.fecha,
            observacion: f.observacion,
        }));
    };

    /* ---------- Confirmar / Cancelar ---------- */

    const resetear = () => setForm(formularioInicial());

    /** Devuelve los asientos listos o el mensaje de error a mostrar. */
    const prepararAsientos = (): AsientoNuevo[] | string => {
        if (!cajaEnUso) return "No hay una caja en uso para registrar la transferencia";
        if (!origenLado) return esCajaACaja ? "Falta seleccionar la caja origen" : "Falta seleccionar la cuenta origen";
        if (!destinoLado) return esCajaACaja ? "Falta seleccionar la caja destino" : "Falta seleccionar la cuenta destino";
        if (origenLado.id === destinoLado.id) {
            return esCajaACaja
                ? "La caja origen y destino no pueden ser la misma"
                : "La cuenta origen y destino no pueden ser la misma";
        }
        if (!form.valor || form.valor <= 0) return "El valor debe ser mayor a cero";
        if (!form.fecha) return "Falta la fecha de compensación";
        if (!monedaOrigenId || !monedaDestinoId) return "Falta seleccionar la moneda";
        if (!tasaBaseOrigen || !tasaBaseDestino) return "No existe tipo de cambio hacia la moneda base";
        if (mostrarDestino && !tasaDestino) return "No existe tipo de cambio entre las monedas seleccionadas";
        if (valorDestino <= 0) return "El valor destino resultó en cero. Revise el valor o el tipo de cambio";

        return construirAsientos(
            form,
            origenLado,
            destinoLado,
            cajaEnUso,
            valorDestino,
            tasaBaseOrigen,
            tasaBaseDestino
        );
    };

    const confirmar = async () => {
        if (enviando) return;

        const resultado = prepararAsientos();
        if (typeof resultado === "string") {
            showAlert(resultado, "warning");
            return;
        }

        try {
            setEnviando(true);
            await recibeAsientos(resultado);
            resetear();
            setOpenModal();
        } catch (error) {
            console.error("Error al registrar la transferencia:", error);
            const mensaje = axios.isAxiosError(error)
                ? (error.response?.data as { message?: string } | undefined)?.message
                : undefined;
            showAlert(mensaje ?? "No se pudo registrar la transferencia. Intente nuevamente.", "error");
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
            if (selectorCuenta) return;
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                void confirmarRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openModal, selectorCuenta]);

    /* ---------- Render ---------- */

    return (
        <>
            <ModalGeneral
                icon={<ArrowLeftRight size={18} />}
                title="Transferencia"
                subtitle={esCajaACaja ? "Registre un traslado entre cajas" : "Registre un traslado entre cuentas bancarias"}
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
                    {/* Tipo de transferencia */}
                    <SelectCustom
                        options={OPCIONES_TIPO}
                        label="Tipo de transferencia"
                        value={form.tipo}
                        isClearable={false}
                        searchable={false}
                        onChange={e => cambiarTipo(String(e) as TipoTransferencia)}
                    />

                    {esCajaACaja ? (
                        <>
                            {/* Caja origen | Caja destino */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputERP
                                    type="searchNumber"
                                    label="Caja Origen"
                                    icon={<BriefcaseBusiness size={18} />}
                                    value={form.origenId}
                                    onChange={e => asignar("origen", Number(e) || 0)}
                                    searchOptions={opcionesCaja}
                                    searchColumns={[
                                        { key: "id", label: "CÓDIGO", width: "100px" },
                                        { key: "texto", label: "DESCRIPCIÓN", width: "1fr" },
                                    ]}
                                    onSelectOption={opt => handleSelectCaja("origen", opt)}
                                    onEnterPress={t => buscarCaja("origen", t)}
                                    onBlur={t => buscarCaja("origen", t)}
                                    displayMode="id-text"
                                    searchMinChars={1}
                                    showSearch={true}
                                    placeholder="Seleccione la caja origen"
                                />

                                <InputERP
                                    type="searchNumber"
                                    label="Caja Destino"
                                    icon={<TrendingUp size={18} />}
                                    value={form.destinoId}
                                    onChange={e => asignar("destino", Number(e) || 0)}
                                    searchOptions={opcionesCaja}
                                    searchColumns={[
                                        { key: "id", label: "CÓDIGO", width: "100px" },
                                        { key: "texto", label: "DESCRIPCIÓN", width: "1fr" },
                                    ]}
                                    onSelectOption={opt => handleSelectCaja("destino", opt)}
                                    onEnterPress={t => buscarCaja("destino", t)}
                                    onBlur={t => buscarCaja("destino", t)}
                                    displayMode="id-text"
                                    searchMinChars={1}
                                    showSearch={true}
                                    placeholder="Seleccione la caja destino"
                                />
                            </div>

                            {/* Moneda origen | Moneda destino */}
                            <div className="grid grid-cols-2 gap-4">
                                <SelectCustom
                                    options={opcionesMoneda}
                                    label="Moneda origen"
                                    value={form.monedaOrigenId}
                                    isClearable={false}
                                    searchable={false}
                                    onChange={e => setForm(f => ({ ...f, monedaOrigenId: Number(e) }))}
                                />

                                <SelectCustom
                                    options={opcionesMoneda}
                                    label="Moneda destino"
                                    value={form.monedaDestinoId}
                                    isClearable={false}
                                    searchable={false}
                                    onChange={e => setForm(f => ({ ...f, monedaDestinoId: Number(e) }))}
                                />
                            </div>

                            {/* Fecha | Valor (en moneda origen) */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputERP
                                    type="date"
                                    label="Fecha *"
                                    icon={<Calendar size={18} />}
                                    value={form.fecha}
                                    onChange={e => setForm(f => ({ ...f, fecha: String(e) }))}
                                />

                                <InputERP
                                    type="currency"
                                    moneda={monedaOrigen}
                                    label="Valor *"
                                    icon={<DollarSign size={18} />}
                                    value={form.valor}
                                    onChange={e => setForm(f => ({ ...f, valor: Number(e) || 0 }))}
                                />
                            </div>

                            {/* Valor destino (solo si las monedas difieren) */}
                            {mostrarDestino && (
                                <InputERP
                                    type="currency"
                                    moneda={monedaDestino}
                                    label="Valor Destino"
                                    icon={<DollarSign size={18} />}
                                    value={valorDestino}
                                    readOnly
                                    onChange={noop}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {/* Cuenta origen | Cuenta destino */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputERP
                                    type="searchNumber"
                                    label="Cuenta Origen"
                                    icon={<Landmark size={18} />}
                                    value={form.origenId}
                                    onChange={e => asignar("origen", Number(e) || 0)}
                                    searchOptions={opcionesCuenta}
                                    searchColumns={[
                                        { key: "id", label: "CÓDIGO", width: "100px" },
                                        { key: "texto", label: "NOMBRE", width: "1fr" },
                                    ]}
                                    onSelectOption={opt => handleSelectCuenta("origen", opt)}
                                    onEnterPress={t => buscarCuenta("origen", t)}
                                    onBlur={t => buscarCuenta("origen", t)}
                                    onSearchClick={() => setSelectorCuenta("origen")}
                                    displayMode="id-text"
                                    searchMinChars={1}
                                    showSearch={true}
                                    placeholder="Seleccione la cuenta origen"
                                />

                                <InputERP
                                    type="searchNumber"
                                    label="Cuenta Destino"
                                    icon={<TrendingUp size={18} />}
                                    value={form.destinoId}
                                    onChange={e => asignar("destino", Number(e) || 0)}
                                    searchOptions={opcionesCuenta}
                                    searchColumns={[
                                        { key: "id", label: "CÓDIGO", width: "100px" },
                                        { key: "texto", label: "NOMBRE", width: "1fr" },
                                    ]}
                                    onSelectOption={opt => handleSelectCuenta("destino", opt)}
                                    onEnterPress={t => buscarCuenta("destino", t)}
                                    onBlur={t => buscarCuenta("destino", t)}
                                    onSearchClick={() => setSelectorCuenta("destino")}
                                    displayMode="id-text"
                                    searchMinChars={1}
                                    showSearch={true}
                                    placeholder="Seleccione la cuenta destino"
                                />
                            </div>

                            {/* Fecha | Valor (en moneda de la cuenta origen) */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputERP
                                    type="date"
                                    label="Fecha *"
                                    icon={<Calendar size={18} />}
                                    value={form.fecha}
                                    onChange={e => setForm(f => ({ ...f, fecha: String(e) }))}
                                />

                                <InputERP
                                    type="currency"
                                    moneda={monedaOrigen}
                                    label="Valor *"
                                    icon={<DollarSign size={18} />}
                                    value={form.valor}
                                    onChange={e => setForm(f => ({ ...f, valor: Number(e) || 0 }))}
                                />
                            </div>

                            {/* Valor destino (solo si las monedas difieren) */}
                            {mostrarDestino && (
                                <InputERP
                                    type="currency"
                                    moneda={monedaDestino}
                                    label="Valor Destino"
                                    icon={<DollarSign size={18} />}
                                    value={valorDestino}
                                    readOnly
                                    onChange={noop}
                                />
                            )}
                        </>
                    )}

                    {/* Observación */}
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
                isOpen={selectorCuenta !== null}
                cuentas={cuentas}
                onClose={() => setSelectorCuenta(null)}
                onSelect={handleSeleccionarCuentaDesdeTabla}
            />
        </>
    );
};

export default TransferenciaBancoModal;