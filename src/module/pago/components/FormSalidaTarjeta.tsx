import { useEffect, useRef, useState } from "react";
import { Calendar, Check, CreditCard, DollarSign, FileText, Scale, TrendingUp, User } from "lucide-react";
import type { InterfaceBaja } from "../interfaces/interfacePago";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarData } from "../../../components/utils/Formatadores";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";

/* ------------------------------------------------------------------ */
/* Constantes y tipos                                                  */
/* ------------------------------------------------------------------ */

const noop = () => { };

interface Entidad {
    id: number | string;
    nombre?: string;
}

interface InterfaceFormSalidaTarjeta {
    openModal: boolean;
    setOpenModal: () => void;
    datosMoneda: InterfaceMoneda[];
    monedaBase: InterfaceMoneda | null;
    monedaMovimiento: InterfaceMoneda | null;
    datosPersonas: InterfacePersona[];
    datosCuentas: InterfaceCuenta[];
    datosCambios: InterfaceTipoCambio[];
    fechaMovimiento: string;
    cargarCuentaPorId: (id: number) => Promise<void>;
    cargarPersonaPorId: (id: number) => Promise<void>;
    recibeBaja: (datos: InterfaceBaja) => void;
}

/* ------------------------------------------------------------------ */
/* Utilidades puras                                                    */
/* ------------------------------------------------------------------ */

/**
 * Normaliza cualquier fecha (YYYY-MM-DD, YYYY-MM-DDTHH:mm, timestamptz ISO) a YYYY-MM-DD,
 * que es lo que espera el input type="date" y la columna date del backend.
 * Devuelve "" si no se puede interpretar.
 */
const aFechaISO = (valor?: string | null): string => {
    if (!valor) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(valor)) return valor.slice(0, 10);

    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return "";

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const crearLinea = (monedaMovId: number, fecha: string): InterfaceBaja => {
    const emision = aFechaISO(fecha);
    return {
        id: crypto.randomUUID(),
        operacion: "TARJETA",
        moneda_id: monedaMovId,
        naturaleza_financiera: "Crédito",
        forma_pago: "Tarjeta",
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
        // La tarjeta nunca compensa en el momento: se liquida en el vencimiento
        compensado: false,
        emision,
        fecha_compensacion: null,
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
    cuentas: InterfaceCuenta[],
    personas: InterfacePersona[]
): string => {
    const persona = personas.find(p => Number(p.id) === Number(f.persona_id))?.nombre;
    const de = persona ? ` de ${persona}` : "";
    const cuenta = cuentas.find(c => Number(c.id) === Number(f.cuenta_id));
    const nombreCuenta = cuenta?.nombre ?? "Sin cuenta";
    const venc = f.vencimiento ? ` con vencimiento ${formatarData(f.vencimiento)}` : "";
    const obs = f.observacion?.trim() ? ` (obs: ${f.observacion.trim()})` : "";

    return `Boleto tarjeta${de} en cuenta ${nombreCuenta} referente a Tarjeta${venc}${obs}`;
};

/**
 * El valor está en la moneda del movimiento.
 * valor_contable: neto a moneda base.
 * valor_convertido: neto a moneda de la cuenta banco. Si no hay cuenta,
 * usa la moneda del movimiento como respaldo.
 * La tarjeta siempre queda sin compensar: la compensación se da al liquidar.
 */
const recalcular = (
    f: InterfaceBaja,
    monedaMovId: number,
    cuentas: InterfaceCuenta[],
    personas: InterfacePersona[],
    cambios: InterfaceTipoCambio[]
): InterfaceBaja => {
    const neto = valorNeto(f);
    const monedaCuentaId = monedaDeCuenta(cuentas, Number(f.cuenta_id)) || monedaMovId;
    return {
        ...f,
        moneda_id: monedaMovId,
        compensado: false,
        fecha_compensacion: null,
        valor_contable: neto * (Number(f.cambio) || 0),
        valor_convertido: neto * obtenerTasa(cambios, monedaMovId, monedaCuentaId),
        observacion_auto: generarObservacionAuto(f, cuentas, personas),
    };
};

/* ------------------------------------------------------------------ */
/* Subcomponentes                                                      */
/* ------------------------------------------------------------------ */

interface ModalSeleccionPersonaProps {
    isOpen: boolean;
    personas: InterfacePersona[];
    onClose: () => void;
    onSelect: (persona: InterfacePersona) => void;
}

const ModalSeleccionPersona = ({ isOpen, personas, onClose, onSelect }: ModalSeleccionPersonaProps) => (
    <ModalGeneral
        title="Seleccionar Persona"
        isOpen={isOpen}
        icon={<User size={18} />}
        onClose={onClose}
        width="950px"
        sizeBanner="sm"
        childrenPadding={false}
    >
        <DataTable<InterfacePersona>
            data={personas}
            columns={[
                { header: "ID", accessor: "id", align: "start", width: "90px", sortable: true, filterable: true },
                { header: "Nombre", accessor: "nombre", align: "start", sortable: true, filterable: true },
                { header: "RUC", accessor: "ruc", align: "center", sortable: true, filterable: true },
            ]}
            showGlobalSearch={true}
            globalSearchPlaceholder="Buscar por todos los campos!"
            initialPageSize={10}
            selectable={false}
            onRowClick={onSelect}
        />
    </ModalGeneral>
);

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

const FormSalidaTarjeta = ({
    openModal,
    setOpenModal,
    datosMoneda,
    datosPersonas,
    monedaBase,
    monedaMovimiento,
    datosCuentas,
    datosCambios,
    fechaMovimiento,
    cargarCuentaPorId,
    cargarPersonaPorId,
    recibeBaja,
}: InterfaceFormSalidaTarjeta) => {
    const monedaBaseId = Number(monedaBase?.id ?? 0);
    const monedaMovId = Number(monedaMovimiento?.id ?? 0);

    const [linea, setLinea] = useState<InterfaceBaja>(() => crearLinea(monedaMovId, fechaMovimiento));
    const [modalCuentas, setModalCuentas] = useState(false);
    const [modalPersonas, setModalPersonas] = useState(false);

    const cuentas = datosCuentas.filter(c => c.activo && c.permite_lanzamiento_tarjeta);
    const monedaCuentaId = monedaDeCuenta(datosCuentas, Number(linea.cuenta_id));
    const monedaCuenta = datosMoneda.find(m => Number(m.id) === monedaCuentaId);
    const mostrarConversion = linea.cuenta_id !== 0 && monedaCuentaId !== monedaMovId;
    const monedaMovInput = monedaCuenta ?? undefined;

    /* ---------- Efectos ---------- */

    // Recalcular montos y observación automática cuando cambian cuentas, moneda o tipos de cambio
    useEffect(() => {
        setLinea(f => recalcular(f, monedaMovId, datosCuentas, datosPersonas, datosCambios));
    }, [monedaMovId, datosCuentas, datosCambios]);

    // Sincronizar la emisión cuando cambia la fecha del movimiento
    useEffect(() => {
        const emision = aFechaISO(fechaMovimiento);
        if (!emision) return;
        setLinea(f => ({ ...f, emision }));
    }, [fechaMovimiento]);

    /* ---------- Acciones de edición ---------- */

    const actualizar = (cambios: Partial<InterfaceBaja>) =>
        setLinea(f => recalcular({ ...f, ...cambios }, monedaMovId, datosCuentas, datosPersonas, datosCambios));

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

    /* ---------- Persona ---------- */

    const opcionesPersona: SearchOption[] = [...datosPersonas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(p => ({ id: p.id, texto: `${p.nombre}`, ruc: p.ruc }));

    const handleSelectPersona = (option: SearchOption) => {
        actualizar({ persona_id: Number(option.id) });
        cargarPersonaPorId(Number(option.id));
    };

    const buscarPersona = (term: string) => {
        const t = term.trim();
        const persona = t ? datosPersonas.find(p => coincide(p, t)) : undefined;

        if (!persona) {
            actualizar({ persona_id: null });
            return;
        }

        actualizar({ persona_id: Number(persona.id) });
        if (String(persona.id) !== String(linea.persona_id)) {
            cargarPersonaPorId(Number(persona.id));
        }
    };

    const handleSeleccionarPersonaModal = (persona: InterfacePersona) => {
        actualizar({ persona_id: Number(persona.id) });
        cargarPersonaPorId(Number(persona.id));
        setModalPersonas(false);
    };

    /* ---------- Confirmar / Cancelar ---------- */

    const confirmar = () => {
        if (!linea.cuenta_id) {
            showAlert("Falta seleccionar la cuenta tarjeta", "warning");
            return;
        }
        if (!linea.persona_id) {
            showAlert("Persona es obligatoria para boleto tarjeta", "warning");
            return;
        }
        if (!linea.valor) {
            showAlert("Valores no están informados", "warning");
            return;
        }

        const emision = aFechaISO(linea.emision);
        const vencimiento = aFechaISO(linea.vencimiento);

        if (!vencimiento) {
            showAlert("Falta seleccionar el vencimiento del boleto", "warning");
            return;
        }
        if (emision && vencimiento < emision) {
            showAlert("El vencimiento no puede ser anterior a la emisión", "warning");
            return;
        }

        recibeBaja(
            recalcular(
                { ...linea, emision, vencimiento },
                monedaMovId,
                datosCuentas,
                datosPersonas,
                datosCambios
            )
        );
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
            // No confirmar si el selector de cuentas o personas está encima
            if (modalCuentas || modalPersonas) return;

            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                confirmarRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openModal, modalCuentas, modalPersonas]);

    /* ---------- Render ---------- */

    return (
        <>
            <ModalGeneral
                icon={<CreditCard size={18} />}
                title="Tarjeta"
                subtitle="Informe los datos del boleto de tarjeta"
                isOpen={openModal}
                childrenPadding={false}
                width="600px"
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
                        label="Persona"
                        icon={<User size={18} />}
                        value={linea.persona_id}
                        isCleable={false}
                        onChange={e => actualizar({ persona_id: Number(e) || null })}
                        searchOptions={opcionesPersona}
                        searchColumns={[
                            { key: "id", label: "CÓDIGO", width: "100px" },
                            { key: "texto", label: "NOMBRE", width: "1fr" },
                            { key: "ruc", label: "RUC", width: "1fr" },
                        ]}
                        onSelectOption={handleSelectPersona}
                        onEnterPress={buscarPersona}
                        onBlur={buscarPersona}
                        onSearchClick={() => setModalPersonas(true)}
                        displayMode="id-text"
                        searchMinChars={1}
                        showSearch={true}
                        placeholder="Seleccione la persona"
                    />

                    <InputERP
                        type="searchNumber"
                        label="Cuenta Tarjeta"
                        icon={<TrendingUp size={18} />}
                        value={linea.cuenta_id}
                        onChange={e => actualizar({ cuenta_id: Number(e) || 0 })}
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
                        placeholder="Seleccione la cuenta tarjeta"
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
                        <InputERP
                            type="currency"
                            moneda={monedaMovInput}
                            label="Valor Convertido"
                            icon={<DollarSign size={18} />}
                            value={linea.valor_convertido}
                            readOnly
                            onChange={noop}
                        />
                    )}

                    <InputERP
                        type="date"
                        label="Vencimiento *"
                        icon={<Calendar size={18} />}
                        value={aFechaISO(linea.vencimiento)}
                        onChange={e => actualizar({ vencimiento: aFechaISO(String(e)) || null })}
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
            <ModalSeleccionPersona
                isOpen={modalPersonas}
                personas={datosPersonas}
                onClose={() => setModalPersonas(false)}
                onSelect={handleSeleccionarPersonaModal}
            />
        </>
    );
};

export default FormSalidaTarjeta;