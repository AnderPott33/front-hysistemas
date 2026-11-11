import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useCaja } from "../../../context/CajaContext";
import { usePermisos } from "../../../context/PermisosContext";
import { useEmpresa } from "../../empresa/hooks/useEmpresa";
import { useMoneda } from "../../moneda/hooks/useMoneda";
import type { InterfaceBaja, InterfaceBajaCaja, InterfaceDocumento, InterfaceMovimiento, InterfacePayload } from "../interfaces/interfaceRecibimiento";
import { useCuentas } from "../../cuentas/hooks/useCuentas";
import FormEncabezado from "./FormEncabezado";
import FormBaja from "./FormIngresoEventual";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import { useOperacion } from "../../operaciones/hooks/useOperacion";
import type { InterfaceOperacionBaja } from "../../operaciones/interfaces/InterfaceOperacion";
import TableBaja from "./TableBaja";
import { usePersona } from "../../persona/hooks/usePersona";
import ModalCaja from "./ModalCaja";
import FormDepositoBancario from "./FormDepositoBancario";
import { Ban, BrushCleaning, Save, RefreshCw } from "lucide-react";
import { showAlert } from "../../../components/utils/Procesando";
import { useFinanciero } from "../hooks/useRecibimiento";
import { useCategorias } from "../../categorias/hooks/useCategorias";
import FormEntradaTarjeta from "./FormEntradaTarjeta";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import InputERP from "../../../components/utils/InputERP";
import Loading from "../../../components/utils/Loading";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Overlay estable: evita destellos en operaciones cortas              */
/* ------------------------------------------------------------------ */

/**
 * Devuelve true solo si `activo` dura más de `retardo` ms,
 * y lo mantiene visible al menos `minimo` ms para evitar parpadeos.
 */
const useOverlayEstable = (activo: boolean, retardo = 250, minimo = 400): boolean => {
    const [visible, setVisible] = useState(false);
    const desde = useRef<number | null>(null);

    useEffect(() => {
        if (activo) {
            const t = setTimeout(() => {
                desde.current = Date.now();
                setVisible(true);
            }, retardo);
            return () => clearTimeout(t);
        }

        // Si nunca llegó a mostrarse, no hay nada que ocultar
        if (desde.current === null) return;

        const restante = Math.max(0, minimo - (Date.now() - desde.current));
        const t = setTimeout(() => {
            desde.current = null;
            setVisible(false);
        }, restante);
        return () => clearTimeout(t);
    }, [activo, retardo, minimo]);

    return visible;
};

/* ------------------------------------------------------------------ */
/* Utilidades puras (mismas reglas que FormBaja)                       */
/* ------------------------------------------------------------------ */

const TOLERANCIA = 0.01;

const redondear = (n: number): number => Math.round(n * 100) / 100;

/** Tasa para convertir 1 unidad de `origen` a `destino`. Devuelve 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (origen === destino) return 1;

    const directo = cambios.find(c => Number(c.moneda_origen) === origen && Number(c.moneda_destino) === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);

    const inverso = cambios.find(c => Number(c.moneda_origen) === destino && Number(c.moneda_destino) === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);

    return 0;
};

/** Neto de la línea de baja: valor + intereses - descuento */
const valorNeto = (f: InterfaceBaja): number =>
    (Number(f.valor) || 0) + (Number(f.interes) || 0) - (Number(f.descuento) || 0);

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

const FormFinanciero = () => {
    const { empresa, cargarEmpresa, loading: loadingEmpresa } = useEmpresa();
    const { monedasA, cargarMonedasActivas, tiposCambio, cargarTiposCambio, loading: loadingMonedas } = useMoneda();
    const { operaciones, cargarOperaciones } = useOperacion();
    const { cuentas, cargarCuentas, cargarCuentaPorId, loading: loadingCuentas } = useCuentas();
    const { subcategorias, cargarSubcategorias, loading: loadingCategorias } = useCategorias();
    const { personas, cargarPersonas, cargarPersonaId } = usePersona();
    const {
        loading: loadingFinanciero,
        guardarFinancieroFn,
        cancelarFinancieroFn,
        financieros,
        cargarFinancieros,
        cargarFinancierPorId,
    } = useFinanciero();
    const { user } = useAuth();
    const { caja } = useCaja();
    const { tienePermiso } = usePermisos();
    const [buscador, setBuscador] = useState<number | null>(null);

    // Overlay y botones: se bloquean mientras cualquier hook de la página esté cargando.
    // Si useOperacion o usePersona exponen su propio `loading`, sumalos aquí.
    const cargando =
        loadingFinanciero || loadingEmpresa || loadingMonedas || loadingCuentas || loadingCategorias;

    // Overlay visual estabilizado: no aparece en operaciones cortas ni parpadea al cerrarse
    const mostrarOverlay = useOverlayEstable(cargando);

    const monedaBase: InterfaceMoneda | null = monedasA.find((e: InterfaceMoneda) => e.id === empresa?.moneda_base) || null;
    const operacionesBaja: InterfaceOperacionBaja[] = operaciones.filter((e: InterfaceOperacionBaja) => e.modulo === 'Financiero');

    // Las cargas corren en paralelo para que el loading no baje a false entre una y otra
    const cargarDatos = async () => {
        await Promise.all([
            cargarEmpresa(),
            cargarMonedasActivas(),
            cargarCuentas(),
            cargarOperaciones(),
            cargarTiposCambio(),
            cargarPersonas(),
            cargarFinancieros(),
            cargarSubcategorias(),
        ]);
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const InicialDocumento: InterfaceDocumento = {
        id: '',
        naturaleza_contable: 'Salida',
        tipo_documento: 'Compra',
        condicion_documento: 'Contado',
        numero_documento: '',
        gravadas_0: 0,
        gravadas_5: 0,
        gravadas_10: 0,
        iva_0: 0,
        iva_5: 0,
        iva_10: 0,
        valor_documento: 0
    };

    const [openModalBaja, setOpenModalBaja] = useState(false);
    const [openModalCaja, setOpenModalCaja] = useState(false);
    const [openModalDepositoBancario, setOpenModalDepositoBancario] = useState(false);
    const [openModalTarjeta, setOpenModalTarjeta] = useState(false);
    const [openModalCancelar, setOpenModalCancelar] = useState(false);
    const [motivoCancelacion, setMotivoCancelacion] = useState("");
    const [cancelando, setCancelando] = useState(false);
    const [formMovimiento, setFormMovimiento] = useState<InterfaceMovimiento>();
    const [encabezadoCargado, setEncabezadoCargado] = useState<InterfaceMovimiento>();
    const [formBaja, setFormBaja] = useState<InterfaceBaja[]>([]);
    const [formBajaCaja, setFormBajaCaja] = useState<InterfaceBajaCaja[]>([]);
    const [formDocumento, setFromDocumento] = useState<InterfaceDocumento>(InicialDocumento);

    // Se incrementa al resetear para volver a montar los hijos con estado interno propio
    const [formKey, setFormKey] = useState(0);

    // Moneda completa del encabezado, derivada para que siempre coincida con formMovimiento
    const monedaMovimiento: InterfaceMoneda | null =
        monedasA.find(e => Number(e.id) === Number(formMovimiento?.moneda_id)) ?? null;
    const monedaMovId = Number(monedaMovimiento?.id ?? 0);

    // Fecha del encabezado (emisión de todas las líneas). Vacía hasta que el encabezado emita
    const fechaMovimiento: string = formMovimiento?.fecha ?? '';

    // Un movimiento cancelado no se puede editar ni guardar de nuevo
    const movimientoCancelado = formMovimiento?.estado === 'Cancelado';
    const movimientoGuardado = !!formMovimiento?.id;

    const nombreMoneda = (id: number): string =>
        monedasA.find(m => Number(m.id) === id)?.codigo ?? String(id);

    const abrirCerrarModalBaja = () => {
        setOpenModalBaja(!openModalBaja);
    };
    const abrirCerrarModalCaja = () => {
        setOpenModalCaja(!openModalCaja);
    };
    const abrirCerrarModalDeposito = () => {
        setOpenModalDepositoBancario(!openModalDepositoBancario);
    };
    const abrirCerrarModalTarjeta = () => {
        setOpenModalTarjeta(!openModalTarjeta);
    };

    const recibeBuscador = (buscado: number) => {
        setBuscador(buscado);
    };

    const buscarFinanciero = async (idParam?: number) => {
        const idBuscar = idParam ?? buscador;
        if (!idBuscar) return;
        const respuesta = await cargarFinancierPorId(idBuscar);
        const resultBusqueda = respuesta?.data ?? respuesta;
        if (!resultBusqueda) return;

        const encabezado: InterfaceMovimiento = {
            id: Number(resultBusqueda.id),
            caja_id: Number(resultBusqueda.caja_id),
            fecha: resultBusqueda.fecha,
            tipo_movimiento: resultBusqueda.tipo_movimiento,
            usuario_id: Number(resultBusqueda.usuario_id),
            usuario: resultBusqueda.usuario ?? null,
            moneda_id: Number(resultBusqueda.moneda_id),
            estado: resultBusqueda.estado,
            motivo_cancelado: resultBusqueda.motivo_cancelado ?? '',
            observacion: resultBusqueda.observacion ?? '',
        };
        setFormMovimiento(encabezado);
        setEncabezadoCargado(encabezado);
        setFormBaja(resultBusqueda.bajas ?? []);
        setFormBajaCaja(resultBusqueda.bajas_caja ?? []);
    };

    const recibeEncabezado = (datos: InterfaceMovimiento) => {
        setFormMovimiento(datos);
    };
    const recibeCaja = (datos: InterfaceBajaCaja[]) => {
        setFormBajaCaja(datos);
    };

    const recibeBaja = (datos: InterfaceBaja) => {
        setFormBaja(prev => [...prev, datos]);
    };

    // Restablece el formulario a su estado inicial
    const nuevoFormulario = () => {
        setBuscador(null);
        setOpenModalBaja(false);
        setOpenModalCaja(false);
        setOpenModalDepositoBancario(false);
        setOpenModalTarjeta(false);
        setOpenModalCancelar(false);
        setMotivoCancelacion("");
        setFormMovimiento(undefined);
        setEncabezadoCargado(undefined);
        setFormBaja([]);
        setFormBajaCaja([]);
        setFromDocumento(InicialDocumento);
        setFormKey(k => k + 1);
    };

    const eliminarPagoCaja = () => {
        setFormBajaCaja([]);
    };

    /** Convierte un monto de `monedaOrigenId` a la moneda del movimiento. */
    const convertirAMovimiento = (monto: number, monedaOrigenId: number): number => {
        if (!monto || !monedaMovId) return 0;
        const tasa = obtenerTasa(tiposCambio, monedaOrigenId, monedaMovId);
        return redondear(monto * tasa);
    };

    // Valor que deben cubrir las bajas de caja, en la moneda del movimiento: débito - crédito
    const calcularValorCaja = (): number => {
        const totales = formBaja.reduce(
            (acc, b) => {
                const neto = convertirAMovimiento(valorNeto(b), Number(b.moneda_id));
                if (b.naturaleza_financiera === 'Débito') acc.debito += neto;
                if (b.naturaleza_financiera === 'Crédito') acc.credito += neto;
                return acc;
            },
            { debito: 0, credito: 0 }
        );

        const diferencia = redondear(totales.debito - totales.credito);

        // Solo devuelve valor si el débito es mayor que el crédito
        return diferencia > 0 ? diferencia : 0;
    };

    // Total que cubren las bajas de caja (valor - vuelto), en la moneda del movimiento
    const calcularTotalCaja = (): number =>
        redondear(
            formBajaCaja.reduce((acc, c) => {
                const monedaCajaId = Number(c.moneda_id);
                const valor = convertirAMovimiento(Number(c.valor) || 0, monedaCajaId);
                const vuelto = convertirAMovimiento(Number(c.vuelto) || 0, monedaCajaId);
                return acc + valor - vuelto;
            }, 0)
        );

    // ¿Las bajas de caja cubren exactamente lo que requieren las bajas?
    const cajaBalanceada = (): boolean =>
        Math.abs(calcularValorCaja() - calcularTotalCaja()) < TOLERANCIA;

    // Validación de las líneas (antes de abrir la caja)
    const validarBajas = (): string | null => {
        if (formBaja.length === 0) return 'Agrega al menos una línea';
        if (!formBaja.some(b => Number(b.valor) > 0)) return 'Las líneas deben tener un valor mayor a cero';
        return null;
    };

    // Todas las monedas distintas a la del movimiento deben tener tipo de cambio
    const validarTasas = (): string | null => {
        if (!monedaMovimiento) return 'Completa el encabezado antes de guardar';

        const faltante = [
            ...formBaja.map(b => ({ moneda: Number(b.moneda_id), origen: 'La línea' })),
            ...formBajaCaja.map(c => ({ moneda: Number(c.moneda_id), origen: 'El pago de caja' })),
        ].find(x => x.moneda !== monedaMovId && obtenerTasa(tiposCambio, x.moneda, monedaMovId) <= 0);

        if (faltante) {
            return `${faltante.origen} está en ${nombreMoneda(faltante.moneda)} y no hay tipo de cambio hacia ${nombreMoneda(monedaMovId)}`;
        }
        return null;
    };

    // Validación del balance entre bajas y bajas de caja (antes de guardar)
    const validarBalanceCaja = (): string | null => {
        const requerido = calcularValorCaja();
        const cobrado = calcularTotalCaja();

        if (Math.abs(requerido - cobrado) >= TOLERANCIA) {
            const simbolo = monedaMovimiento?.simbolo ?? monedaMovimiento?.codigo ?? '';
            return `La caja no cuadra: se requiere ${simbolo} ${requerido.toFixed(2)} y la caja tiene ${simbolo} ${cobrado.toFixed(2)}`;
        }
        return null;
    };

    // Ctrl+Enter no actúa si hay un modal abierto
    const hayModalAbierto =
        openModalBaja || openModalDepositoBancario || openModalCaja || openModalTarjeta || openModalCancelar;

    // Ctrl+Enter y el botón Guardar usan esta misma lógica
    const abrirCajaOGuardar = () => {
        if (hayModalAbierto || movimientoCancelado || cargando) return;

        const errorBajas = validarBajas() ?? validarTasas();
        if (errorBajas) {
            showAlert(errorBajas, 'warning');
            return;
        }

        // Abre la caja solo si todavía falta cubrir un valor
        const requiereCaja = calcularValorCaja() > 0;
        if (requiereCaja && !cajaBalanceada()) {
            setOpenModalCaja(true);
            return;
        }

        guardarCompleto();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                abrirCajaOGuardar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hayModalAbierto, formMovimiento, formBaja, formBajaCaja, tiposCambio, cargando]);

    const eliminarLinea = (id: string) => {
        const eliminando = formBaja.filter(e => e.id != id);
        setFormBaja(eliminando);
    };

    const validarFinanciero = (): string | null => {
        if (!formMovimiento) return 'Completa el encabezado antes de guardar';
        return validarBajas() ?? validarTasas() ?? validarBalanceCaja();
    };

    const guardarCompleto = async () => {
        const error = validarFinanciero();
        if (error) {
            showAlert(error, 'warning');
            return;
        }

        const payload: InterfacePayload = {
            formMovimiento: formMovimiento,
            formBaja: formBaja,
            formBajaCaja: formBajaCaja ?? []
        };

        try {
            await guardarFinancieroFn(payload);
            nuevoFormulario();
            cargarDatos();
            showAlert('Financiero guardado con éxito', 'success');
        } catch (error) {
            console.error(error);
            showAlert('No se pudo guardar el financiero', 'warning');
        }
    };

    /* ---------- Cancelación ---------- */

    const abrirModalCancelar = () => {
        if (!movimientoGuardado || movimientoCancelado) return;
        setMotivoCancelacion("");
        setOpenModalCancelar(true);
    };

    const cerrarModalCancelar = () => {
        setOpenModalCancelar(false);
        setMotivoCancelacion("");
    };

    const confirmarCancelacion = async () => {
        if (!formMovimiento?.id || cancelando) return;

        const motivo = motivoCancelacion.trim();
        if (!motivo) {
            showAlert("Ingresa el motivo de cancelación", "warning");
            return;
        }

        try {
            setCancelando(true);
            await cancelarFinancieroFn(Number(formMovimiento.id), motivo);
            cerrarModalCancelar();
            // Recarga el movimiento para mostrar su nuevo estado
            await buscarFinanciero(Number(formMovimiento.id));
            showAlert("Financiero cancelado", "success");
        } catch (error) {
            const mensaje = axios.isAxiosError(error)
                ? (error.response?.data as { message?: string } | undefined)?.message
                : undefined;
            showAlert(mensaje ?? "No se pudo cancelar el financiero", "error");
        } finally {
            setCancelando(false);
        }
    };

    const navigate = useNavigate();

    // Sin caja no se puede registrar un financiero: se redirige a la gestión de cajas
    useEffect(() => {
        if (!caja) {
            showAlert("Debe tener una caja abierta para registrar recibimiento", "warning");
            navigate("/finanzas/cajas", { replace: true });
        }
    }, [caja]);

    return (
        <>
            {mostrarOverlay && <Loading />}

            <div className="flex gap-3 items-stretch px-2 pb-2">
                <div className="shrink-0">
                    <FormEncabezado
                        key={`encabezado-${formKey}`}
                        recibeBuscador={recibeBuscador}
                        buscarFinanciero={buscarFinanciero}
                        datosBaja={formBaja}
                        datosFinancieros={financieros}
                        limpiarFormulario={nuevoFormulario}
                        datosCaja={caja}
                        datosUsuario={user}
                        recibeEncabezado={recibeEncabezado}
                        monedaBase={monedaBase}
                        datosMoneda={monedasA}
                        encabezadoCargado={encabezadoCargado}
                    />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <FormBaja
                        key={`baja-${formKey}`}
                        datosBaja={formBaja}
                        openModal={openModalBaja}
                        setOpenModal={abrirCerrarModalBaja}
                        datosCategorias={subcategorias}
                        datosPersonas={personas}
                        cargarCuentaPorId={cargarCuentaPorId}
                        cargarPersonaPorId={cargarPersonaId}
                        datosCambios={tiposCambio}
                        recibeBaja={recibeBaja}
                        monedaBase={monedaBase}
                        datosMoneda={monedasA}
                        monedaMovimiento={monedaMovimiento}
                        fechaMovimiento={fechaMovimiento}
                    />
                    <FormDepositoBancario
                        key={`deposito-${formKey}`}
                        openModal={openModalDepositoBancario}
                        setOpenModal={abrirCerrarModalDeposito}
                        datosCuentas={cuentas}
                        cargarCuentaPorId={cargarCuentaPorId}
                        datosCambios={tiposCambio}
                        recibeBaja={recibeBaja}
                        monedaBase={monedaBase}
                        datosMoneda={monedasA}
                        monedaMovimiento={monedaMovimiento}
                        fechaMovimiento={fechaMovimiento}
                    />
                    <FormEntradaTarjeta
                        key={`boleta-tarjeta-${formKey}`}
                        openModal={openModalTarjeta}
                        setOpenModal={abrirCerrarModalTarjeta}
                        datosPersonas={personas}
                        cargarPersonaPorId={cargarPersonaId}
                        datosCuentas={cuentas}
                        cargarCuentaPorId={cargarCuentaPorId}
                        datosCambios={tiposCambio}
                        recibeBaja={recibeBaja}
                        monedaBase={monedaBase}
                        datosMoneda={monedasA}
                        monedaMovimiento={monedaMovimiento}
                        fechaMovimiento={fechaMovimiento}
                    />
                    <TableBaja
                        key={`tabla-${formKey}`}
                        datosBaja={formBaja}
                        datosCambios={tiposCambio}
                        eliminarLinea={eliminarLinea}
                        datosBajaCaja={formBajaCaja}
                        datosCuentas={cuentas}
                        datosCategorias={subcategorias}
                        datosPersonas={personas}
                        datosUsuario={user}
                        monedaBase={monedaBase}
                        monedaMovimiento={monedaMovimiento}
                        datosMoneda={monedasA}
                        datosOperaciones={operacionesBaja}
                        abrirModal={abrirCerrarModalBaja}
                        abrirModalBanco={abrirCerrarModalDeposito}
                        abrirModalTarjeta={abrirCerrarModalTarjeta}
                        eliminarPagoCaja={eliminarPagoCaja}
                    />
                    <ModalCaja
                        key={`caja-${formKey}`}
                        valorTotal={calcularValorCaja}
                        naturaleza_financiera={'Débito'}
                        openModal={openModalCaja}
                        setOpenModal={abrirCerrarModalCaja}
                        monedaBase={monedaBase}
                        monedaMovimiento={monedaMovimiento}
                        datosMoneda={monedasA}
                        datosCambios={tiposCambio}
                        cajaId={Number(formMovimiento?.caja_id)}
                        recibeCaja={recibeCaja}
                        guardarCompleto={guardarCompleto}
                    />

                    <ModalGeneral
                        icon={<Ban size={18} />}
                        title="Cancelar Financiero"
                        subtitle={`Movimiento #${formMovimiento?.id ?? ""}`}
                        isOpen={openModalCancelar}
                        childrenPadding={false}
                        width="480px"
                        sizeBanner="sm"
                        closeOnEsc={false}
                        closeOnOverlay={false}
                        onClose={cerrarModalCancelar}
                        footer={
                            <div className="flex gap-2 justify-end items-center flex-wrap">
                                <button
                                    type="button"
                                    onClick={cerrarModalCancelar}
                                    disabled={cancelando}
                                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5 transition-all disabled:opacity-50"
                                >
                                    Volver
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmarCancelacion}
                                    disabled={cancelando || !motivoCancelacion.trim()}
                                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-rose-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Ban size={18} />
                                    {cancelando ? "Cancelando..." : "Confirmar cancelación"}
                                </button>
                            </div>
                        }
                    >
                        <div className="p-5 grid gap-4">
                            <p className="text-sm text-mi-cuarta/70">
                                Se cancelarán el movimiento y todos sus asientos. Las bajas se conservan para auditoría.
                            </p>
                            <InputERP
                                type="textarea"
                                label="Motivo de cancelación *"
                                icon={<Ban size={18} />}
                                value={motivoCancelacion}
                                rows={3}
                                onChange={(e) => setMotivoCancelacion(String(e))}
                            />
                        </div>
                    </ModalGeneral>
                </div>
            </div>

            <div className="p-3 flex justify-start items-center gap-2 bg-mi-primera/5 border-t border-mi-primera/10">
                {movimientoCancelado ? (
                    <span className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                        <Ban size={14} />
                        Cancelado{formMovimiento?.motivo_cancelado ? `: ${formMovimiento.motivo_cancelado}` : ""}
                    </span>
                ) : (
                    <button
                        onClick={() => abrirCajaOGuardar()}
                        disabled={cargando || formBaja.length === 0}
                        className="flex justify-center text-xs items-center gap-2 px-2 py-1.5 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {movimientoGuardado ? (
                            <>
                                <RefreshCw size={16} />
                                Actualizar (Ctrl + ↵)
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Guardar (Ctrl + ↵)
                            </>
                        )}
                    </button>
                )}

                {movimientoGuardado && !movimientoCancelado && (
                    <button
                        type="button"
                        onClick={abrirModalCancelar}
                        disabled={cargando}
                        className="flex justify-center text-xs items-center gap-2 px-2 py-1.5 font-semibold rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    >
                        <Ban size={16} />
                        Cancelar movimiento
                    </button>
                )}

                <button
                    type="button"
                    onClick={nuevoFormulario}
                    className="flex justify-center text-xs items-center gap-2 px-2 py-1.5 font-semibold rounded-xl bg-white text-mi-cuarta border border-mi-primera/20 hover:bg-mi-primera/10 transition-all duration-200 active:scale-[0.98]"
                >
                    <BrushCleaning size={16} />
                    Nuevo
                </button>
            </div>
        </>
    );
};

export default FormFinanciero;