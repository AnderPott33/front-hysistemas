/* import type { InterfaceDetalleTransaccion, InterfacePago, InterfaceTransaccion, PayloadTransaccion } from "../interfaces/interfaceTransaccion";
import FormTransaccion from "./FormTrasaccion";

import { useAuth } from "../../../context/AuthContext";
import { useCaja } from "../../../context/CajaContext";
import { useMoneda } from "../../moneda/hooks/useMoneda";
import { usePersona } from "../../persona/hooks/usePersona";
import { useTransaccion } from "../hooks/useTransaccion";
import { useOperacion } from "../../operaciones/hooks/useOperacion";
import { useEffect, useState } from "react";
import Loading from "../../../components/utils/Loading";
import type { InterfaceOperacionBaja } from "../../operaciones/interfaces/InterfaceOperacion";
import TableDetalle from "./TableDetalle";
import FormDetalle from "./FormDetalle";
import { useCategoriaGastoIngreso } from "../../categoriaGastoIngreso/hooks/useCategoriaGastoIngreso";
import ModalPago from "./ModalPago";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { formatarDataInput, formatarMoeda } from "../../../components/utils/Formatadores";
import { useCuentas } from "../../cuentas/hooks/useCuentas";
import { closeProcesando, procesando, showAlert } from "../../../components/utils/Procesando";
import { useEmpresa } from "../../empresa/hooks/useEmpresa";
import { useTimbrado } from "../../timbrado/hooks/useTimbrado";

const FormsTransaccion = () => {
    const { empresa, cargarEmpresa } = useEmpresa();
   

    // Pre Configs de la Empresa
    const monedaBaseEmpresa = empresa?.moneda_base;
    const operacionBaseEmpresa = empresa?.operacion_preseleccionada_compra;
    const clienteBaseEmpresa = empresa?.cliente_predeterminado;

    const [cargando, setCargando] = useState(true);
    const [operacionSeleccionada, setOperacionSeleccionada] = useState<InterfaceOperacionBaja | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [confirmarPago, setConfirmarPago] = useState(false);

    const { user, loading: loadingUser } = useAuth();
    const { caja, loading: loadingCaja } = useCaja();
    const { operaciones, cargarOperaciones, loading: loadingOperacion } = useOperacion();
    const { monedasA, cargarMonedasActivas, tiposCambio, cargarTiposCambio, loading: loadingMonedas } = useMoneda();
    const { personas, cargarPersonas } = usePersona();
    const { articulos, cargarArticulos, crearTransaccionFn, cargarArticuloRap } = useTransaccion();
    const { cargarCategoriasGastoIngreso, categoriasGastoIngreso } = useCategoriaGastoIngreso();
    const { cuentas, cargarCuentas } = useCuentas()
    const { timbrados, cargarTimbrados } = useTimbrado();

    const [modalPagoAbierto, setModalPagoAbierto] = useState(false);

    const cargarDatosIniciales = async () => {
        await cargarOperaciones();
        await cargarMonedasActivas();
        await cargarTiposCambio();
        await cargarPersonas();
        await cargarArticulos();
        await cargarCategoriasGastoIngreso();
        await cargarCuentas();
        await cargarEmpresa();
        await cargarTimbrados();
        setCargando(false);
    };

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const formInicial: InterfaceTransaccion = {
        id: Number(''),
        caja_id: Number(caja?.id),
        operacion_id: Number(operacionBaseEmpresa),
        timbrado: Number(''),
        tipo_comprobante: '',
        numero_comprobante: '',
        fecha: formatarDataInput(new Date()),
        persona_id: clienteBaseEmpresa || 0,
        usuario_id: Number(user?.id),
        moneda_id: Number(monedaBaseEmpresa),
        estado: 'Efectivado',
        observacion: '',
        valor_subtotal: 0,
        valor_descuento: 0,
        valor_iva: 0,
        valor_total: 0
    };

    const formInicialDetalle: InterfaceDetalleTransaccion = {
        id: '',
        transaccion_id: Number(''),
        numero_linea: Number(''),
        articulo_id: Number(''),
        descripcion: '',
        cantidad: 0,
        precio_unitario: 0,
        nuevo_precio_venta:0,
        iva: 0,
        valor_iva: 0,
        valor_total: 0,
        valor_descuento: 0,
        categoria_gasto_ingreso: Number('')
    };



    const [encabezado, setEncabezado] = useState<InterfaceTransaccion>(formInicial);
    const [formDetalle, setFormDetalle] = useState<InterfaceDetalleTransaccion>(formInicialDetalle);
    const [detalle, setDetalle] = useState<InterfaceDetalleTransaccion[]>([]);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [formPagos, setFormPagos] = useState<InterfacePago[]>([]);

    const monedaSeleccionada = monedasA.find(e => e.id == encabezado.moneda_id) || monedasA[0];

    const calcularSubtotal = () => detalle.reduce((sum, item) => sum + ((item.cantidad * item.precio_unitario)), 0);
    const calcularTotal = () => {
        const subtotal = calcularSubtotal()
        const total = calcularSubtotal() - detalle.reduce((sum, item) => sum + ((item.valor_descuento || 0)), 0);
        const totalIva = detalle.reduce((sum, item) => sum + (item.valor_iva || 0), 0);
        return total;
    };
    
    
        vuelto?: number;
        moneda_vuelto_id?: number;
        tipo_cambio_vuelto?: number;
        valor_vuelto_convertido?: number;
   
    const formInicialPagos: InterfacePago = {
        id: Number(''),
        transaccion_id: Number(''),
        valor: calcularTotal(),
        valor_convertido: calcularTotal(),

        cuenta_id: Number(''),
        forma_pago: String('Efectivo'),
        moneda_id: Number(monedaSeleccionada?.id),
        tipo_cambio: 0,
        vencimiento: '',
        tipo_comprobante: '',
        comprobante: '',
        observacion: ''

    };

    useEffect(() => {
        if (caja?.id && user?.id) {
            setEncabezado(prev => ({
                ...prev,
                caja_id: Number(caja.id),
                usuario_id: Number(user.id)
            }));
        }
    }, [caja?.id, user?.id]);

    // 🎹 Ctrl + Enter para abrir/confirmar modal
   // 🎹 Ctrl + Enter para abrir/confirmar modal
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();

            if (!modalPagoAbierto && detalle.length > 0) {
                if (!enviando) {
                    abrirModalPago();
                }
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [modalPagoAbierto, enviando, detalle]); // ✅ Agregar 'detalle'

    const recibirEncabezado = (encabezadoRec: InterfaceTransaccion) => {
        setEncabezado(encabezadoRec);
        const oper = operaciones.find(e => e.id == encabezadoRec.operacion_id);
        if (oper !== undefined) {
            setOperacionSeleccionada(oper);
        }
    };


    const recibirDetalle = async (detalleRec: InterfaceDetalleTransaccion) => {
        if (editandoId) {
            setDetalle(prev => prev.map(item => item.id === editandoId ? detalleRec : item));
            setEditandoId(null);
            setFormDetalle(formInicialDetalle);
        } else {
            setDetalle(prev => [...prev, detalleRec]);
        }
    };

    const recibirPagos = (pagos: InterfacePago[]) => {
        setFormPagos(pagos);
        setConfirmarPago(true);
        procesarYEnviarPago(pagos)
    };

    const procesarYEnviarPago = async (pagos: InterfacePago[]) => {
        try {
            setEnviando(true);
            procesando()

            if (detalle.length === 0) {
                showAlert('Debe agregar al menos una línea de detalle');
                setEnviando(false);
                return;
            }

            if (!pagos || pagos.length === 0) {
                showAlert('Debe agregar al menos una forma de pago');
                setEnviando(false);
                setTimeout(() => {
                    closeProcesando()
                }, 3000)
                return;
            }

            const payloadCompleto: PayloadTransaccion = {
                formData: encabezado,
                formDetalle: detalle,
                formPago: pagos
            };
            console.log(payloadCompleto);

            const response = await crearTransaccionFn(payloadCompleto);
   

            // ✅ VALIDACIÓN ESTRICTA - Si falla, no continúa
            if (!response) {
                showAlert('Error: Respuesta inválida del servidor');
                closeProcesando();

                return;
            }

            setConfirmarPago(false);
            setModalPagoAbierto(false);

            setEncabezado(formInicial);
            setDetalle([]);
            setFormPagos([]);
            setEditandoId(null);
            setFormDetalle(formInicialDetalle);

            showAlert('Transacción registrada exitosamente');

            await cargarTimbrados()

        } catch (error) {
          
            showAlert('Error al procesar la transacción');
            if (error instanceof Error) {
                console.log(error);
            }
        } finally {
            setEnviando(false);
        }
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
        setFormDetalle(formInicialDetalle);
    };

    const eliminarLinea = (id: string) => {
        if (editandoId === id) {
            setEditandoId(null);
            setFormDetalle(formInicialDetalle);
        }
        setDetalle(prev => prev.filter(item => item.id !== id));
    };

    const editarLinea = (detalleAEditar: InterfaceDetalleTransaccion) => {
        setEditandoId(String(detalleAEditar.id));
        setFormDetalle(detalleAEditar);
    };

    useEffect(() => {
        if (encabezado.valor_descuento && detalle.length > 0) {
            const totalVentas = detalle.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

            if (totalVentas > 0) {
                const porcentajeDescuento = encabezado.valor_descuento / totalVentas;

                const detalleActualizado = detalle.map(item => {
                    const subtotal = item.cantidad * item.precio_unitario;
                    const descuentoAplicado = Math.min(subtotal * porcentajeDescuento, subtotal);
                    const totalLinea = subtotal - descuentoAplicado;

                    return {
                        ...item,
                        valor_descuento: descuentoAplicado,
                        valor_total: totalLinea,
                        valor_iva: totalLinea / (item.iva === 10 ? 11 : 21)
                    };
                });

                setDetalle(detalleActualizado);
            }
        } else if (encabezado.valor_descuento === 0 && detalle.length > 0) {
            const detalleActualizado = detalle.map(item => ({
                ...item,
                valor_descuento: 0,
                valor_total: item.cantidad * item.precio_unitario,
                valor_iva: (item.cantidad * item.precio_unitario) / (item.iva === 10 ? 11 : 21)
            }));

            setDetalle(detalleActualizado);
        }
    }, [encabezado.valor_descuento]);

    const abrirModalPago = () => {
        setModalPagoAbierto(true);
    }

    const cancelarPago = () => {
        setModalPagoAbierto(false);
        setConfirmarPago(false);
    }

    if (cargando || loadingCaja || loadingUser || loadingOperacion || loadingMonedas) return <Loading />;

    return (
        <>
            <div className="grid grid-cols-6 gap-3">
                <div className="col-span-4 grid items-start content-start shadow-md shadow-[#359bac] gap-2 rounded-lg">
                    <div className="shadow-sm">
                        <FormDetalle
                            enviarDetalle={recibirDetalle}
                            formInicialDetalle={formDetalle}
                            personas={personas}
                            cargarArticuloRap={cargarArticuloRap}
                            monedas={monedasA}
                            articulos={articulos}
                            operacionSeleccionada={operacionSeleccionada}
                            editandoId={editandoId}
                            onEditarLinea={(detalleEdit) => {
                                if (detalleEdit === null) {
                                    cancelarEdicion();
                                }
                            }}
                            calcularSubtotal={calcularSubtotal}
                            detalle={detalle}
                        />
                    </div>
                    <div>
                        <TableDetalle
                            datosDetalle={detalle}
                            monedaSeleccionada={monedaSeleccionada}
                            onEliminarLinea={eliminarLinea}
                            categoriasGastoIngreso={categoriasGastoIngreso}
                            onEditarLinea={editarLinea}
                        />
                    </div>
                </div>
                <div className="col-span-2">
                    <FormTransaccion
                        enviarEncabezado={recibirEncabezado}
                        formInicial={formInicial}
                        user={user}
                        personas={personas}
                        caja={caja}
                        monedas={monedasA}
                        operaciones={operaciones}
                        operacionSeleccionada={operacionSeleccionada}
                        calcularSubtotal={calcularSubtotal}
                        calcularTotal={calcularTotal}
                        detalle={detalle}
                        abrirModalPago={abrirModalPago}
                        timbrados={timbrados}
                        cargarTimbrados={cargarTimbrados}
                    />
                </div>
                <div>
                    <ModalGeneral
                        title='Forma de Pago'
                        subtitle={"a pagar: " + formatarMoeda(calcularTotal(), monedaSeleccionada)}
                        isOpen={modalPagoAbierto}
                        onClose={() => setModalPagoAbierto(false)}
                        width='1500px'
                        height='auto'
                        closeOnEsc={false}
                        childrenPadding={false}
                        showCloseButton={false}
                        children={
                            <>
                                <ModalPago
                                    monedas={monedasA}
                                    recibirPagos={recibirPagos}
                                    onCancel={cancelarPago}
                                    cuentas={cuentas}
                                    bajaId={0}
                                    usuarioId={encabezado.usuario_id}
                                    tiposCambio={tiposCambio}
                                    formInicialPagos={formInicialPagos}
                                    monedaSeleccionada={monedaSeleccionada}
                                    valorTotal={calcularTotal()}
                                    confirmar={() => procesarYEnviarPago(formPagos)}
                                />
                            </>
                        }
                    />

                    <ModalGeneral
                        title='Confirmar Transacción'
                        subtitle='¿Deseas finalizar y enviar la transacción?'
                        isOpen={confirmarPago}
                        onClose={cancelarPago}
                        width='600px'
                        height='auto'
                        closeOnEsc={false}
                        showCloseButton={true}
                        children={
                            <div className="p-6 flex flex-col gap-5 bg-white rounded-xl shadow-sm border border-slate-100">
                             
                                <div className="bg-[#35b9ac]/10 p-4 rounded-lg border border-[#35b9ac]/20">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#26897f] mb-3">
                                        Resumen de Operación
                                    </h4>

                                    <div className="space-y-2 text-sm text-slate-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Líneas:</span>
                                            <span className="font-semibold text-slate-800">{detalle.length}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Formas de pago:</span>
                                            <span className="font-semibold text-slate-800">{formPagos.length}</span>
                                        </div>

                                        <hr className="border-t border-[#35b9ac]/20 my-2" />

                                        <div className="flex justify-between items-center pt-1">
                                            <span className="font-medium text-slate-800">Total a pagar:</span>
                                            <span className="text-base font-bold text-[#26897f]">
                                                {formatarMoeda(calcularTotal(), monedaSeleccionada)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            
                                <div className="flex gap-3 justify-end pt-1">
                                    <button
                                        onClick={cancelarPago}
                                        disabled={enviando}
                                        className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:ring-2 focus:ring-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={() => procesarYEnviarPago(formPagos)}
                                        disabled={enviando}
                                        style={{ backgroundColor: '#35b9ac' }}
                                        className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm hover:brightness-95 focus:ring-2 focus:ring-[#35b9ac]/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 flex items-center justify-center min-w-[160px]"
                                    >
                                        {enviando ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Enviando...
                                            </span>
                                        ) : (
                                            'Confirmar y Enviar'
                                        )}
                                    </button>
                                </div>
                            </div>
                        }
                    />
                </div>
            </div>
        </>
    );
};

export default FormsTransaccion; */