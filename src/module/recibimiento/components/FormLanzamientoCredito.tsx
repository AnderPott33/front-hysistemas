import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ClipboardList, CreditCard, DollarSign, FileText, MessageSquare, Settings, User, Users, Wallet } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceBaja } from "../interfaces/interfaceRecibimiento";
import {
    OPERACION_LANZAMIENTO_CREDITO,
    FORMA_PAGO_LANZAMIENTO_CREDITO,
} from "../interfaces/interfaceRecibimiento";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarDataInput } from "../../../components/utils/Formatadores";
import {
    obtenerCreditoPersona,
    type InterfaceCreditoPersona,
} from "../services/recibimientoService";
import SelectorMoneda from "../../../components/utils/SelectorMoneda";

/* ------------------------------------------------------------------ */
/* Constantes y tipos                                                  */
/* ------------------------------------------------------------------ */

type Naturaleza = "Crédito" | "Débito";
type TipoPersona = "Cliente" | "Proveedor";
type PestanaDetalle = "detalles" | "otros";

interface Entidad {
    id: number | string;
    nombre?: string;
}

interface InterfaceFormLanzamientoCredito {
    openModal: boolean;
    datosBaja: InterfaceBaja[];
    setOpenModal: () => void;
    naturaleza: Naturaleza;
    datosPersonas: InterfacePersona[];
    datosMoneda: InterfaceMoneda[];
    cargarPersonaPorId: (id: number) => Promise<void>;
    datosCambios: InterfaceTipoCambio[];
    monedaBase: InterfaceMoneda | null;
    monedaMovimiento: InterfaceMoneda | null;
    cambiarMoneda: (moneda: InterfaceMoneda) => void;
    fechaMovimiento: string;
    recibeBaja: (datos: InterfaceBaja) => void;
    verExtracto?: (personaId: number) => void;
}

/* ------------------------------------------------------------------ */
/* Utilidades puras                                                    */
/* ------------------------------------------------------------------ */

const formatear = (n: number, simbolo = "") =>
    `${simbolo} ${n.toLocaleString("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`.trim();

/** Tasa para convertir 1 unidad de `origen` a `destino`. Devuelve 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (!origen || !destino) return 0;
    if (origen === destino) return 1;

    const directo = cambios.find(c => Number(c.moneda_origen) === origen && Number(c.moneda_destino) === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);

    const inverso = cambios.find(c => Number(c.moneda_origen) === destino && Number(c.moneda_destino) === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);

    return 0;
};

/** Coincidencia por código exacto o por nombre parcial */
const coincide = (item: Entidad, termino: string): boolean =>
    String(item.id) === termino || (item.nombre ?? "").toLowerCase().includes(termino.toLowerCase());

const crearLinea = (monedaMovId: number, fecha: string, naturaleza: Naturaleza): InterfaceBaja => ({
    id: crypto.randomUUID(),
    operacion: 'CREDITO',
    moneda_id: monedaMovId,
    naturaleza_financiera: naturaleza,
    forma_pago: FORMA_PAGO_LANZAMIENTO_CREDITO,
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
    compensado: false,
    emision: fecha ? formatarDataInput(fecha) : "",
    fecha_compensacion: null,
    vencimiento: null,
    observacion: "",
    observacion_auto: "",
});

/** Texto automático de la línea, con el mismo formato que los demás movimientos */
const generarObservacionAuto = (f: InterfaceBaja, personas: InterfacePersona[]): string => {
    const persona = personas.find(p => Number(p.id) === Number(f.persona_id));
    const nombrePersona = persona?.nombre ?? "Sin persona";
    const preposicion = f.naturaleza_financiera === "Crédito" ? "a" : "de";
    const doc = f.documento?.trim() ? ` (doc: ${f.documento.trim()})` : "";
    const obs = f.observacion?.trim() ? ` (obs: ${f.observacion.trim()})` : "";

    return `Lanzamiento de crédito ${preposicion} ${nombrePersona} referente a Crédito de persona${doc}${obs}`;
};

/**
 * El valor está en la moneda del movimiento.
 * valor_contable: valor a moneda base.
 * valor_convertido: valor en la moneda del movimiento.
 */
const recalcular = (
    f: InterfaceBaja,
    monedaMovId: number,
    personas: InterfacePersona[],
    tasaBase: number
): InterfaceBaja => {
    const valor = Number(f.valor) || 0;
    return {
        ...f,
        moneda_id: monedaMovId,
        valor,
        valor_liquido: valor,
        cambio: tasaBase,
        valor_contable: valor * tasaBase,
        valor_convertido: valor,
        observacion_auto: generarObservacionAuto(f, personas),
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
            initialPageSize={10}
            columns={[
                { header: "ID", accessor: "id", align: "start", width: "90px", sortable: true, filterable: true },
                { header: "Nombre", accessor: "nombre", align: "start", sortable: true, filterable: true },
                { header: "RUC", accessor: "ruc", align: "center", sortable: true, filterable: true },
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

const FormLanzamientoCredito = ({
    openModal,
    setOpenModal,
    datosBaja,
    naturaleza,
    datosPersonas,
    datosMoneda,
    cargarPersonaPorId,
    datosCambios,
    monedaBase,
    monedaMovimiento,
    fechaMovimiento,
    cambiarMoneda,
    recibeBaja,
    verExtracto,
}: InterfaceFormLanzamientoCredito) => {
    const { token } = useAuth();
    const monedaBaseId = Number(monedaBase?.id ?? 0);
    const monedaMovId = Number(monedaMovimiento?.id ?? 0);
    const tasaBase = obtenerTasa(datosCambios, monedaMovId, monedaBaseId);

    const [linea, setLinea] = useState<InterfaceBaja>(() => crearLinea(monedaMovId, fechaMovimiento, naturaleza));
    const [credito, setCredito] = useState<InterfaceCreditoPersona | null>(null);
    const [cargandoCredito, setCargandoCredito] = useState(false);
    const [modalPersonas, setModalPersonas] = useState(false);
    const [tipo, setTipo] = useState<TipoPersona>("Cliente");
    const [pestana, setPestana] = useState<PestanaDetalle>("detalles");
    const operacionBloqueada = datosBaja.length > 0;

    // Al abrir, arranca limpio con la naturaleza y fecha actuales
    useEffect(() => {
        if (openModal) {
            setLinea(crearLinea(monedaMovId, fechaMovimiento, naturaleza));
            setPestana("detalles");
        }
    }, [openModal, naturaleza, monedaMovId, fechaMovimiento]);

    // Recalcular montos y observación automática cuando cambian personas, moneda o tipos de cambio
    useEffect(() => {
        setLinea(f => recalcular(f, monedaMovId, datosPersonas, tasaBase));
    }, [monedaMovId, datosPersonas, tasaBase]);

    // Actualizar la fecha de emisión cuando cambia la fecha del movimiento
    useEffect(() => {
        if (fechaMovimiento) {
            setLinea(f => ({ ...f, emision: formatarDataInput(fechaMovimiento) }));
        }
    }, [fechaMovimiento]);

    // Saldo informativo de la persona seleccionada (no compensa nada)
    useEffect(() => {
        const personaId = Number(linea.persona_id) || 0;
        if (!openModal || !personaId || !token) {
            setCredito(null);
            return;
        }
        let vigente = true;
        setCargandoCredito(true);
        obtenerCreditoPersona(token, personaId)
            .then(d => { if (vigente) setCredito(d); })
            .catch(() => {
                if (vigente) {
                    setCredito(null);
                    showAlert("No se pudo cargar el crédito de la persona", "error");
                }
            })
            .finally(() => { if (vigente) setCargandoCredito(false); });
        return () => { vigente = false; };
    }, [openModal, linea.persona_id, token]);

    /* ---------- Acciones de edición ---------- */

    const actualizar = (cambios: Partial<InterfaceBaja>) =>
        setLinea(f => recalcular({ ...f, ...cambios }, monedaMovId, datosPersonas, tasaBase));

    const resetear = () => setLinea(crearLinea(monedaMovId, fechaMovimiento, naturaleza));

    const saldoPorMoneda = (id: number): number =>
        credito?.saldos.find(s => s.moneda_id === id)?.saldo ?? 0;

    /* ---------- Persona ---------- */

    const opcionesPersona: SearchOption[] = [...datosPersonas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(p => ({ id: p.id, texto: `${p.nombre}`, ruc: p.ruc }));

    const seleccionarPersona = (persona: InterfacePersona) => {
        actualizar({ persona_id: Number(persona.id) });
        cargarPersonaPorId(Number(persona.id));
    };

    const handleSelectPersona = (option: SearchOption) => {
        const persona = datosPersonas.find(p => String(p.id) === String(option.id));
        if (persona) seleccionarPersona(persona);
    };

    const buscarPersona = (term: string) => {
        const t = term.trim();
        const persona = t ? datosPersonas.find(p => coincide(p, t)) : undefined;

        if (!persona) {
            actualizar({ persona_id: null });
            return;
        }

        if (String(persona.id) !== String(linea.persona_id)) {
            seleccionarPersona(persona);
        }
    };

    const handleSeleccionarPersonaModal = (persona: InterfacePersona) => {
        seleccionarPersona(persona);
        setModalPersonas(false);
    };

    /* ---------- Confirmar / Cancelar ---------- */

    const confirmar = () => {
        if (!linea.persona_id) {
            showAlert("La persona es obligatoria para el lanzamiento de crédito", "warning");
            return;
        }
        if (cargandoCredito) {
            showAlert("Espere a que cargue el crédito de la persona", "warning");
            return;
        }
        if (!linea.valor || !(Number(linea.valor) > 0)) {
            showAlert("El valor debe ser mayor a cero", "warning");
            return;
        }
        if (!monedaMovId) {
            showAlert("Seleccione la moneda del lanzamiento", "warning");
            return;
        }
        if (!(tasaBase > 0)) {
            showAlert("No existe tipo de cambio hacia la moneda base", "warning");
            return;
        }

        recibeBaja(recalcular(linea, monedaMovId, datosPersonas, tasaBase));
        resetear();
        setOpenModal();
    };

    const cancelar = () => {
        resetear();
        setOpenModal();
    };

    const confirmarRef = useRef(confirmar);
    confirmarRef.current = confirmar;

    // F10 guarda, Esc cierra (ModalGeneral); no guarda si el selector de personas está abierto
    useEffect(() => {
        if (!openModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (modalPersonas) return;

            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                confirmarRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openModal, modalPersonas]);

    /* ---------- Render ---------- */

    return (
        <>
            <ModalGeneral
                icon={<CreditCard size={18} />}
                title="Crédito"
                subtitle="Gestionar créditos y lanzamientos"
                isOpen={openModal}
                childrenPadding={false}
                width="1000px"
                sizeBanner="sm"
                closeOnEsc={true}
                closeOnOverlay={false}
                onClose={setOpenModal}
                footer={
                    <div className="flex gap-2 justify-end items-center flex-wrap">
                        <button
                            type="button"
                            onClick={cancelar}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all"
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                        >
                            <Check size={18} />
                            Guardar
                        </button>
                    </div>
                }
            >
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* ----- Columna izquierda: persona y saldo ----- */}
                    <div className="grid gap-4 content-start">
                        <InputERP
                            type="searchNumber"
                            label="Persona"
                            icon={<User size={18} />}
                            value={linea.persona_id}
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

                        <div className="rounded-2xl border border-mi-primera/15 overflow-hidden">
                            <div className="px-4 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 font-semibold text-mi-cuarta">
                                    <Wallet size={18} />
                                    Saldo disponible en crédito
                                </div>
                                {/* <button
                                    type="button"
                                    disabled={!linea.persona_id}
                                    onClick={() => verExtracto?.(Number(linea.persona_id))}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-xl bg-mi-gradient text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText size={16} />
                                    Ver Extracto
                                </button> */}
                            </div>

                            <div className="flex gap-2 px-4 pb-3 border-b border-mi-primera/10">
                                {/* <button
                                    type="button"
                                    onClick={() => setPestana("detalles")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${pestana === "detalles" ? "bg-mi-primera/10 text-mi-cuarta" : "text-mi-cuarta/60 hover:bg-mi-primera/5"}`}
                                >
                                    <ClipboardList size={16} />
                                    Detalles
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPestana("otros")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${pestana === "otros" ? "bg-mi-primera/10 text-mi-cuarta" : "text-mi-cuarta/60 hover:bg-mi-primera/5"}`}
                                >
                                    <Settings size={16} />
                                    Otros
                                </button> */}
                            </div>

                            {pestana === "detalles" && (
                                !linea.persona_id ? (
                                    <p className="px-4 py-3 text-sm text-mi-cuarta/60">Seleccione una persona para ver su saldo.</p>
                                ) : cargandoCredito ? (
                                    <p className="px-4 py-3 text-sm text-mi-cuarta/60">Cargando saldo...</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="text-mi-cuarta/60">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Moneda</th>
                                                <th className="px-4 py-2 text-left">Estado actual</th>
                                                <th className="px-4 py-2 text-right">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-mi-primera/10">
                                            {datosMoneda.map(m => {
                                                const id = Number(m.id);
                                                const saldo = saldoPorMoneda(id);
                                                return (
                                                    <tr key={id}>
                                                        <td className="px-4 py-2 font-semibold">{id} - {m.nombre}</td>
                                                        <td className="px-4 py-2">
                                                            {saldo > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600">Usted debe</span>}
                                                            {saldo < 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-600">Persona debe</span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-mono">{formatear(saldo, m.simbolo)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )
                            )}

                            {pestana === "otros" && (
                                <div className="p-4 grid gap-4">
                                    <InputERP
                                        type="date"
                                        label="Fecha *"
                                        icon={<Calendar size={18} />}
                                        value={linea.emision}
                                        onChange={e => actualizar({ emision: String(e) })}
                                    />
                                </div>
                            )}

                            <div className="px-4 py-2 border-t border-mi-primera/10 flex gap-4 text-xs text-mi-cuarta/70">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Usted debe a la persona</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Persona debe a usted</span>
                            </div>
                        </div>
                    </div>

                    {/* ----- Columna derecha: lanzamiento ----- */}
                    <div className="rounded-2xl border border-mi-primera/15 p-4 grid gap-4 content-start">
                        <div className="flex items-center gap-2 font-semibold text-mi-cuarta">
                            <CreditCard size={18} />
                            Lanzamiento
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <SelectorMoneda
                                monedas={datosMoneda}
                                monedaId={Number(linea.moneda_id)}
                                disabled={operacionBloqueada || Boolean(linea.cuenta_id)}
                                onChange={(value) => {
                                    if (value === null) return;
                                    const moneda = datosMoneda.find(m => Number(m.id) === Number(value));
                                    if (moneda) cambiarMoneda(moneda);
                                }}
                            />
                        </div>

                        <InputERP
                            type="text"
                            label="Número Documento"
                            icon={<FileText size={18} />}
                            value={linea.documento}
                            onChange={e => actualizar({ documento: String(e) })}
                        />

                        <InputERP
                            type="currency"
                            moneda={monedaMovimiento ?? undefined}
                            label="Valor"
                            icon={<DollarSign size={18} />}
                            value={linea.valor}
                            onChange={e => actualizar({ valor: Number(e) || 0 })}
                        />

                        <InputERP
                            type="textarea"
                            label="Observación"
                            icon={<MessageSquare size={18} />}
                            value={linea.observacion}
                            rows={3}
                            onChange={e => actualizar({ observacion: String(e) })}
                        />
                    </div>
                </div>
            </ModalGeneral>

            <ModalSeleccionPersona
                isOpen={modalPersonas}
                personas={datosPersonas}
                onClose={() => setModalPersonas(false)}
                onSelect={handleSeleccionarPersonaModal}
            />
        </>
    );
};

export default FormLanzamientoCredito;