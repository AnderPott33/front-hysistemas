import { useEffect, useRef, useState } from "react";
import { BadgeDollarSign, Check, DollarSign, FileText, MessageSquare, Scale, TrendingDown, TrendingUp, User } from "lucide-react";
import type { InterfaceBaja } from "../interfaces/interfacePago";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceSubcategoria } from "../../categorias/interfaces/InterfaceCategoria";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarDataInput } from "../../../components/utils/Formatadores";
import SelectorMoneda from "../../../components/utils/SelectorMoneda";

/* ------------------------------------------------------------------ */
/* Constantes y tipos                                                  */
/* ------------------------------------------------------------------ */

const TIPO_INGRESO = "Gasto";
const CARD = "p-3 bg-white rounded-2xl border border-mi-tercera/15";

interface Entidad {
    id: number | string;
    nombre?: string;
}

interface InterfaceFormBaja {
    openModal: boolean;
    setOpenModal: () => void;
    datosBaja: InterfaceBaja[];
    datosMoneda: InterfaceMoneda[];
    monedaBase: InterfaceMoneda | null;
    monedaMovimiento: InterfaceMoneda | null;
    datosCategorias: InterfaceSubcategoria[];
    datosPersonas: InterfacePersona[];
    datosCambios: InterfaceTipoCambio[];
    fechaMovimiento: string;
    cargarCuentaPorId: (id: number) => Promise<void>;
    cargarPersonaPorId: (id: number) => Promise<void>;
    recibeBaja: (datos: InterfaceBaja) => void;
}

/* ------------------------------------------------------------------ */
/* Utilidades puras                                                    */
/* ------------------------------------------------------------------ */

const crearLinea = (monedaId: number, fecha: string): InterfaceBaja => ({
    id: crypto.randomUUID(),
    operacion: 'EVENTUAL',
    moneda_id: monedaId,
    forma_pago: '',
    naturaleza_financiera: "Débito",
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
    emision: formatarDataInput(fecha),
    fecha_compensacion: null,
    vencimiento: null,
    observacion: "",
    observacion_auto: "",
});

/** Tasa para convertir 1 unidad de `origen` a `destino`. Devuelve 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (origen === destino) return 1;

    const directo = cambios.find(c => c.moneda_origen === origen && c.moneda_destino === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);

    const inverso = cambios.find(c => c.moneda_origen === destino && c.moneda_destino === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);

    return 0;
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
    personas: InterfacePersona[],
    categorias: InterfaceSubcategoria[]
): string => {
    const persona = personas.find(p => Number(p.id) === Number(f.persona_id))?.nombre;
    const categoria = categorias.find(c => c.categoria?.tipo === 'Gasto' &&  Number(c.id) === Number(f.categoria_id))?.nombre ?? "Sin categoría";
    const de = persona ? ` de ${persona}` : "";
    const factura = f.documento?.trim() ? `, Factura ${f.documento.trim()}` : "";
    const obs = f.observacion?.trim() ? ` (obs: ${f.observacion.trim()})` : "";

    return `Pago de dinero Gastos Eventuales${de} referente a ${categoria}${factura}${obs}`;
};

/**
 * valor_contable: neto a moneda base.
 * valor_convertido: neto a moneda del movimiento. Si la línea ya está en la moneda
 * del movimiento, el cambio es siempre 1.
 * observacion_auto: texto generado a partir de persona, categoría, documento y observación.
 */
const recalcular = (
    f: InterfaceBaja,
    monedaMovId: number,
    cambios: InterfaceTipoCambio[],
    personas: InterfacePersona[],
    categorias: InterfaceSubcategoria[]
): InterfaceBaja => {
    const neto = valorNeto(f);
    const monedaLineaId = Number(f.moneda_id);
    const cambioConversion = monedaLineaId === monedaMovId
        ? 1
        : obtenerTasa(cambios, monedaLineaId, monedaMovId);

    return {
        ...f,
        valor_contable: neto * cambioConversion,
        valor_convertido: neto,
        observacion_auto: generarObservacionAuto(f, personas, categorias),
    };
};

/* ------------------------------------------------------------------ */
/* Subcomponentes                                                      */
/* ------------------------------------------------------------------ */

interface ModalSeleccionCuentaProps {
    isOpen: boolean;
    cuentas: InterfaceSubcategoria[];
    onClose: () => void;
    onSelect: (cuenta: InterfaceSubcategoria) => void;
}
interface ModalSeleccionPersonaProps {
    isOpen: boolean;
    personas: InterfacePersona[];
    onClose: () => void;
    onSelect: (persona: InterfacePersona) => void;
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
        <DataTable<InterfaceSubcategoria>
            data={cuentas}
            columns={[
                { header: "ID", accessor: "id", align: "start", width: "90px", sortable: true, filterable: true },
                { header: "Nombre", accessor: "nombre", align: "start", sortable: true, filterable: true },
                { header: "Tipo", accessor: "tipo_cuenta", align: "center", sortable: true, filterable: true },
            ]}
            showGlobalSearch={true}
            globalSearchPlaceholder="Buscar por todos los campos!"
            initialPageSize={10}
            selectable={false}
            onRowClick={onSelect}
        />
    </ModalGeneral>
);

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

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

const FormBaja = ({
    openModal,
    setOpenModal,
    datosBaja,
    datosMoneda,
    monedaBase,
    monedaMovimiento,
    datosCategorias,
    datosPersonas,
    datosCambios,
    fechaMovimiento,
    cargarCuentaPorId,
    cargarPersonaPorId,
    recibeBaja,
}: InterfaceFormBaja) => {
    const monedaBaseId = Number(monedaBase?.id ?? 0);
    const monedaMovId = Number(monedaMovimiento?.id ?? 0);

    // La moneda de la operación la define la primera línea
    const operacionBloqueada = datosBaja.length > 0;
    const monedaOperacionId = operacionBloqueada ? Number(datosBaja[0].moneda_id) : null;
    const monedaInicialId = monedaOperacionId ?? monedaBaseId;

    const [linea, setLinea] = useState<InterfaceBaja>(() => crearLinea(monedaInicialId, fechaMovimiento));
    const [modalCuentas, setModalCuentas] = useState(false);
    const [modalPersonas, setModalPersonas] = useState(false);

    const monedaId = monedaOperacionId ?? Number(linea.moneda_id);
    const categorias = datosCategorias.filter(c => c.categoria?.tipo === TIPO_INGRESO);
    const monedaSeleccionada = datosMoneda.find(m => Number(m.id) === monedaId);

    /* ---------- Efectos ---------- */

    // Recalcular la línea cuando cambia la moneda del movimiento, los tipos de cambio o los catálogos
    useEffect(() => {
        setLinea(f => recalcular(f, monedaMovId, datosCambios, datosPersonas, datosCategorias));
    }, [monedaMovId, datosCambios, datosPersonas, datosCategorias]);

    // Actualizar la fecha de emisión cuando cambia la fecha del movimiento
    useEffect(() => {
        if (fechaMovimiento) {
            setLinea(f => ({ ...f, emision: formatarDataInput(fechaMovimiento) }));
        }
    }, [fechaMovimiento]);

    // Asignar la moneda inicial cuando ya esté disponible (la base puede cargar después del modal)
    useEffect(() => {
        const monedaEsperadaId = monedaOperacionId ?? monedaBaseId;
        if (!monedaEsperadaId) return;

        setLinea(f => {
            if (Number(f.moneda_id) === monedaEsperadaId) return f;
            return {
                ...f,
                moneda_id: monedaEsperadaId,
                cambio: obtenerTasa(datosCambios, monedaEsperadaId, monedaBaseId),
            };
        });
    }, [monedaOperacionId, monedaBaseId]);

    /* ---------- Acciones de edición ---------- */

    const actualizar = (cambios: Partial<InterfaceBaja>) =>
        setLinea(f => recalcular({ ...f, ...cambios }, monedaMovId, datosCambios, datosPersonas, datosCategorias));

    const cambiarMoneda = (id: number) =>
        actualizar({ moneda_id: id, cambio: obtenerTasa(datosCambios, id, monedaBaseId) });

    const setPersona = (id: number) => actualizar({ persona_id: id });

    /* ---------- Categoría (tipo de ingreso) ---------- */

    const seleccionarCategoria = (cuenta: InterfaceSubcategoria) => {
        /* const monedaCuentaId = Number(cuenta.moneda?.id); */

        /*  if (operacionBloqueada && monedaCuentaId !== monedaOperacionId) {
             showAlert("La moneda de la cuenta no coincide con la moneda de la operación", "warning");
             return;
         } */

        if (linea.cuenta_id) {
            actualizar({ categoria_id: Number(cuenta.id) });
            return;
        }

        actualizar({
            categoria_id: Number(cuenta.id),
            /* moneda_id: monedaCuentaId, */
            cambio: obtenerTasa(datosCambios, Number(monedaSeleccionada?.id), monedaBaseId),
        });
    };

    const opcionesCategoria: SearchOption[] = [...categorias]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(c => ({ id: c.id, texto: `${c.nombre}`, tipo: c.categoria?.tipo }));

    const handleSelectCategoria = (option: SearchOption) => {
        const cuenta = categorias.find(c => String(c.id) === String(option.id));
        if (cuenta) seleccionarCategoria(cuenta);
        cargarCuentaPorId(Number(option.id));
    };

    const buscarCategoria = (term: string) => {
        const t = term.trim();
        const cuenta = t ? categorias.find(c => coincide(c, t)) : undefined;

        if (!cuenta) {
            actualizar({ cuenta_id: 0 });
            return;
        }

        seleccionarCategoria(cuenta);
        if (String(cuenta.id) !== String(linea.cuenta_id)) {
            cargarCuentaPorId(Number(cuenta.id));
        }
    };

    const handleSeleccionarCuentaModal = (cuenta: InterfaceSubcategoria) => {
        seleccionarCategoria(cuenta);
        cargarCuentaPorId(Number(cuenta.id));
        setModalCuentas(false);
    };

    /* ---------- Persona ---------- */

    const opcionesPersona: SearchOption[] = [...datosPersonas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(p => ({ id: p.id, texto: `${p.nombre}`, ruc: p.ruc }));

    const handleSelectPersona = (option: SearchOption) => {
        setPersona(Number(option.id));
        cargarPersonaPorId(Number(option.id));
    };

    const buscarPersona = (term: string) => {
        const t = term.trim();
        const persona = t ? datosPersonas.find(p => coincide(p, t)) : undefined;

        if (!persona) {
            setPersona(0);
            return;
        }

        setPersona(Number(persona.id));
        if (String(persona.id) !== String(linea.persona_id)) {
            cargarPersonaPorId(Number(persona.id));
        }
    };

    const handleSeleccionarPersonaModal = (persona: InterfacePersona) => {
        setPersona(Number(persona.id));
        cargarPersonaPorId(Number(persona.id));
        setModalPersonas(false);
    };

    /* ---------- Confirmar / Cancelar ---------- */

    const confirmar = () => {
        if (!linea.categoria_id) {
            showAlert("Falta seleccionar la categoria afectada", "warning");
            return;
        }
        if (!linea.valor) {
            showAlert("Valores no estan informados", "warning");
            return;
        }

        recibeBaja(
            recalcular(
                { ...linea, moneda_id: monedaId || monedaBaseId },
                monedaMovId,
                datosCambios,
                datosPersonas,
                datosCategorias
            )
        );
        setLinea(crearLinea(monedaInicialId, fechaMovimiento));
        setOpenModal();
    };

    const cancelar = () => {
        setLinea(crearLinea(monedaInicialId, fechaMovimiento));
        setOpenModal();
    };

    useEffect(() => {
        setLinea(f => {
            if (!f.valor) return f;
            const valorLiquido: number = f.valor - f.descuento + f.interes;
            return { ...f, valor_liquido: valorLiquido };
        });
    }, [linea.valor, linea.interes, linea.descuento]);

    // Ctrl+Enter confirma solo mientras este modal está abierto
    const confirmarRef = useRef(confirmar);
    confirmarRef.current = confirmar;

    useEffect(() => {
        if (!openModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // No confirmar si un selector está encima
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
                icon={<TrendingDown size={18} />}
                title="Gasto Eventual"
                subtitle="Registre un nuevo gasto eventual"
                isOpen={openModal}
                childrenPadding={false}
                width="900px"
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
                <div className="p-3 grid gap-3">
                    {/* Cabecera */}
                    <div className={`${CARD} grid gap-2`}>
                        <InputERP
                            type="searchNumber"
                            label="Persona"
                            icon={<User size={18} />}
                            value={linea.persona_id}
                            isCleable={true}
                            onChange={e => setPersona(Number(e))}
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
                            label="Tipo de Gasto"
                            icon={<TrendingUp size={18} />}
                            value={linea.categoria_id}
                            isCleable={true}
                            onChange={e => actualizar({ categoria_id: Number(e) })}
                            searchOptions={opcionesCategoria}
                            searchColumns={[
                                { key: "id", label: "CÓDIGO", width: "100px" },
                                { key: "texto", label: "NOMBRE", width: "1fr" },
                            ]}
                            onSelectOption={handleSelectCategoria}
                            onEnterPress={buscarCategoria}
                            onBlur={buscarCategoria}
                            onSearchClick={() => setModalCuentas(true)}
                            displayMode="id-text"
                            searchMinChars={1}
                            showSearch={true}
                            placeholder="Seleccione el tipo de ingreso"
                        />
                    </div>

                    {/* Detalle */}
                    <div className={`${CARD} grid grid-cols-2 gap-3`}>
                        <div className="grid gap-2 content-start">
                            <InputERP
                                type="text"
                                label="Documento"
                                icon={<FileText size={18} />}
                                value={linea.documento}
                                maxLength={15}
                                onChange={e => actualizar({ documento: String(e) })}
                            />

                            <SelectorMoneda
                                monedas={datosMoneda}
                                monedaId={linea.moneda_id}
                                disabled={operacionBloqueada || Boolean(linea.cuenta_id)}
                                onChange={e => cambiarMoneda(Number(e))}
                            />

                            <InputERP
                                type="currency"
                                moneda={monedaSeleccionada}
                                label="Valor *"
                                icon={<DollarSign size={18} />}
                                value={linea.valor}
                                onChange={e => actualizar({ valor: Number(e) })}
                            />
                        </div>

                        <div className="grid gap-2 content-start">
                            <InputERP
                                type="currency"
                                moneda={monedaSeleccionada}
                                label="Intereses"
                                icon={<DollarSign size={18} />}
                                value={linea.interes}
                                onChange={e => actualizar({ interes: Number(e) })}
                            />
                            <InputERP
                                type="currency"
                                moneda={monedaSeleccionada}
                                label="Descuento"
                                icon={<DollarSign size={18} />}
                                value={linea.descuento}
                                onChange={e => actualizar({ descuento: Number(e) })}
                            />
                            <div className="pb-1"></div>
                            <InputERP
                                type="textarea"
                                label="Observación"
                                icon={<MessageSquare size={18} />}
                                value={linea.observacion}
                                onChange={e => actualizar({ observacion: String(e) })}
                            />
                        </div>
                    </div>
                </div>
            </ModalGeneral>

            <ModalSeleccionCuenta
                isOpen={modalCuentas}
                cuentas={categorias}
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

export default FormBaja;