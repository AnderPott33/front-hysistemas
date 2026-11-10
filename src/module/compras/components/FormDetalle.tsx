/* import { useEffect, useRef, useState } from "react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceOperacionBaja } from "../../operaciones/interfaces/InterfaceOperacion";
import type { InterfaceArticulo, InterfaceDetalleTransaccion } from "../interfaces/interfaceTransaccion";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";
import { showAlert } from "../../../components/utils/Procesando";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { formatarMoeda } from "../../../components/utils/Formatadores";
import { Box, Calculator, Plus, RefreshCw, Search, ShoppingCart, TrendingUp } from "lucide-react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import { useMoneda } from "../../moneda/hooks/useMoneda";


const C = {
    base: "#35b9ac",
    dark: "#1f8f85",
    darker: "#166f67",
    soft: "#eefaf8",
};

interface InterfaceFormDetalle {
    enviarDetalle: (detalle: InterfaceDetalleTransaccion) => Promise<void>;
    formInicialDetalle: InterfaceDetalleTransaccion;
    personas: InterfacePersona[];
    monedas: InterfaceMoneda[];
    operacionSeleccionada: InterfaceOperacionBaja | null;
    calcularSubtotal: () => number;
    cargarArticuloRap: (cantidad: number, id: number) => Promise<any>;
    editandoId?: string | null;
    onEditarLinea?: (detalle: InterfaceDetalleTransaccion | null) => void;
    detalle: InterfaceDetalleTransaccion[];
    articulos: InterfaceArticulo[];
 
    onAnadirArticulo?: () => void;
}

const calcIva = (total: number, ivaPorc: number) =>
    ivaPorc === 10 ? Math.round(total / 11) : ivaPorc === 5 ? Math.round(total / 21) : 0;

const Tarjeta = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-4 py-3 font-semibold text-gray-700 border-b border-gray-200" style={{ background: C.soft }}>
            <span style={{ color: C.base }}>{icon}</span>
            {title}
        </div>
        <div className="p-5 flex flex-col gap-5">{children}</div>
    </div>
);

const FormDetalle = ({
    enviarDetalle,
    formInicialDetalle,
    articulos,
    operacionSeleccionada,
    cargarArticuloRap,
    editandoId = null,
    onEditarLinea,
    onAnadirArticulo,
    detalle,
}: InterfaceFormDetalle) => {
    const { monedasA, cargarMonedasActivas } = useMoneda()
    const [buscarArt, setBuscarArt] = useState('');
    const [cantidadArt, setCantidadArt] = useState('');
    const [totalArt, setTotalArt] = useState('');
    const [nuevoPrecio, setNuevoPrecio] = useState('');
    const [formDetalle, setFormDetalle] = useState<InterfaceDetalleTransaccion>(formInicialDetalle);
    const [openModalForm, setOpenModalForm] = useState(false);
    const [openModalArticulo, setOpenModalArticulo] = useState(false);
    const cantidadRef = useRef<HTMLDivElement>(null);
    const monedaUsada = monedasA[0];

    useEffect(() => {
        cargarMonedasActivas()
    }, [])
    const articuloActual = articulos.find(a => Number(a.id) === Number(formDetalle.articulo_id));

    
    const cantidad = Number(cantidadArt) || 0;
    const total = Number(totalArt) || 0;
    const unitario = cantidad > 0 ? Math.round((total / cantidad) * 100) / 100 : 0;
    const ivaPorc = Number(formDetalle.iva || 0);
    const valorIva = calcIva(total, ivaPorc);

    const resetCampos = () => {
        setBuscarArt('');
        setCantidadArt('');
        setTotalArt('');
        setNuevoPrecio('');
    };

    useEffect(() => {
        setFormDetalle(formInicialDetalle);
        if (editandoId && formInicialDetalle.articulo_id) {
            setBuscarArt(formInicialDetalle.descripcion || String(formInicialDetalle.articulo_id));
            setCantidadArt(String(formInicialDetalle.cantidad || ''));
            setTotalArt(String(formInicialDetalle.valor_total || ''));
            setNuevoPrecio(String((formInicialDetalle as any).nuevo_precio_venta || ''));
            setOpenModalForm(true);
        } else {
            resetCampos();
        }
    }, [editandoId, formInicialDetalle]);


    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault();
                setOpenModalForm(true);
                return;
            }
            if (!openModalForm || openModalArticulo) return;
            if (e.key === 'Escape' && !e.defaultPrevented) limpiar();
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                agregarLinea();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const limpiar = () => {
        setFormDetalle(formInicialDetalle);
        resetCampos();
        setOpenModalForm(false);
        onEditarLinea?.(null);
    };

    const enfocarCantidad = () => setTimeout(() => {
        const input = cantidadRef.current?.querySelector('input');
        input?.focus();
        input?.select();
    }, 50);

    
    const cargarPorId = async (id: number, cant: number) => {
        try {
            const data = await cargarArticuloRap(Number(cant), Number(id));
            if (!data) {
                showAlert('Artículo no encontrado', 'warning');
                return;
            }

            const cantidadArticulo = Number(data?.cantidad_solicitada || cant || 1);
            const precio = Number(data?.precio_compra || 0);
            const ivaArt = Number(data?.iva_porcentaje || 0);
            const totalCalc = Math.round(cantidadArticulo * precio * 100) / 100;

            setFormDetalle(prev => ({
                ...prev,
                articulo_id: Number(data?.id),
                descripcion: data?.nombre || '',
                iva: ivaArt,
                categoria_gasto_ingreso: operacionSeleccionada?.modulo === 'Compra'
                    ? Number(operacionSeleccionada?.categoria_id)
                    : Number('')
            }));
            // InputERP muestra "id - nombre" a partir del id
            setBuscarArt(String(data?.id ?? id));
            setCantidadArt(String(cantidadArticulo));
            setTotalArt(totalCalc > 0 ? String(totalCalc) : '');   // el unitario se recalcula solo (total / cantidad)
            setNuevoPrecio(data?.precio_venta || '');
            enfocarCantidad();
        } catch (err) {
            console.error("Error al cargar artículo:", err);
            showAlert('Error al cargar el artículo', 'error');
        }
    };

 
    const cargarArticuloRapp = async (termino?: string) => {
        const texto = String(termino ?? buscarArt).trim();

        // Si ya está cargado ese artículo, solo ir a cantidad
        if (formDetalle.articulo_id && texto === String(formDetalle.articulo_id)) {
            enfocarCantidad();
            return;
        }

        const partes = texto.split('*');
        let cant = cantidad || 1;
        let id: number | null = null;

        if (partes.length === 2) {
            cant = Number(partes[0]) || 1;
            id = Number(partes[1]);
        } else if (partes.length === 1) {
            id = Number(partes[0]);
        }

        if (!id || id <= 0) {
            showAlert('Debes ingresar un ID válido', 'warning');
            return;
        }

        await cargarPorId(id, cant);
    };

   
    const handleSelectOption = (option: SearchOption) => {
        cargarPorId(Number(option.id), Number(cantidadArt) || 1);
    };

    const handleSeleccionar = (articulo: InterfaceArticulo) => {
        setOpenModalArticulo(false);
        cargarPorId(Number(articulo.id), Number(cantidadArt) || 1);
    };

    const agregarLinea = async () => {
        if (!formDetalle.articulo_id || formDetalle.articulo_id <= 0) {
            showAlert('Debes seleccionar un artículo', 'warning');
            return;
        }
        if (cantidad <= 0) {
            showAlert('Debes ingresar una cantidad válida', 'warning');
            return;
        }
        if (total <= 0) {
            showAlert('Debes ingresar el valor total', 'warning');
            return;
        }

        try {
            await enviarDetalle({
                ...formDetalle,
                id: formDetalle.id || crypto.randomUUID(),
                numero_linea: editandoId ? formDetalle.numero_linea : (detalle.length || 0) + 1,
                cantidad,
                precio_unitario: unitario,
                valor_iva: valorIva,
                valor_descuento: Number(formDetalle.valor_descuento || 0),
                valor_total: total,
                // nuevo precio de venta (0 = no se modifica)
                nuevo_precio_venta: Number(nuevoPrecio) || 0,
            } as InterfaceDetalleTransaccion);

            limpiar();
            showAlert(editandoId ? 'Línea actualizada correctamente' : 'Línea agregada correctamente', 'success');
        } catch (err) {
            console.error("Error al agregar línea:", err);
            showAlert('Error al agregar la línea', 'error');
        }
    };

    const handleAnadir = () => {
        if (onAnadirArticulo) onAnadirArticulo();
        else showAlert('Acción "Añadir Artículo" no configurada', 'info');
    };

    const opciones: SearchOption[] = [...articulos]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(e => ({ id: e.id, texto: e.nombre }));

    return (
        <div className="p-3">
           
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Box size={16} style={{ color: C.base }} />
                Seleccionar Artículo (F3)
                <span className="text-red-500">*</span>
            </label>
            <button
                type="button"
                onClick={() => setOpenModalForm(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white text-left font-bold transition-shadow hover:shadow-md"
                style={{ border: `1px solid ${C.base}`, color: C.dark }}
            >
                <Search size={20} style={{ color: C.base }} />
                {formDetalle.descripcion || 'Seleccionar Artículo'}
            </button>

            
            <ModalGeneral
                title='Seleccione Articulo'
                isOpen={openModalForm}
                onClose={() => setOpenModalForm(false)}
                width='1700px'
                height='650px'
                childrenPadding={false}
                closeOnEsc={false}
                showCloseButton={false}
                children={
                    <>
                        <div className="px-3 pb-4 pt-2 flex flex-col gap-4">
                           
                            <div>
                                <label className="flex items-center gap-1.5 font-semibold text-gray-800 mb-1">
                                    <Box size={16} style={{ color: C.base }} />
                                    Artículo<span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <InputERP
                                            autoFocus
                                            type="searchNumber"
                                            value={buscarArt}
                                            displayMode='id-text'
                                            searchOptions={opciones}
                                            searchMinChars={1}
                                            onChange={e => setBuscarArt(e)}
                                            onSelectOption={handleSelectOption}
                                            onEnterPress={cargarArticuloRapp}
                                            showSearch={true}
                                            onSearchClick={() => setOpenModalArticulo(true)}
                                            placeholder="Haga clic para seleccionar un artículo..."
                                        />
                                    </div>
                                     <button
                                        type="button"
                                        onClick={handleAnadir}
                                        className="flex items-center gap-2 px-5 h-[46px] rounded-xl font-bold text-white whitespace-nowrap transition hover:brightness-90"
                                        style={{ background: C.base }}
                                    >
                                        <Plus size={20} />
                                        Añadir Artículo
                                    </button> 
                                </div>
                            </div>

                          
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-5 items-start">
                                <Tarjeta icon={<ShoppingCart size={18} />} title="Datos de la Compra">
                                    <div className="p-3 grid gap-3">
                                        <div>
                                            <label className="block text-[15px] font-semibold text-gray-800 mb-1.5">
                                                Cantidad<span className="text-red-500">*</span>
                                            </label>
                                            <div ref={cantidadRef}>
                                                <InputERP
                                                    type="number"
                                                    min={0}
                                                    value={cantidadArt}
                                                    onChange={v => setCantidadArt(String(v))}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[15px] font-semibold text-gray-800 mb-1.5">
                                                Valor total <span className=" text-xs"></span>
                                            </label>
                                            <div>
                                                <InputERP
                                                    type="currency"
                                                    moneda={monedaUsada}
                                                    icon={<Calculator size={15} />}
                                                    value={totalArt}
                                                    onChange={e => setTotalArt(e)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[15px] font-semibold text-gray-800 mb-1.5">
                                                Valor Unitário <span className=" text-xs">(calculado automáticamente)</span>
                                            </label>
                                            <div>
                                                <InputERP
                                                    type="currency"
                                                    moneda={monedaUsada}
                                                    disabled
                                                    icon={<Calculator size={15} />}
                                                    value={unitario}
                                                    onChange={() => alert}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Tarjeta>

                                <Tarjeta icon={<TrendingUp size={18} />} title="Referencia de Precios">
                                    <div className="p-3 grid gap-3">
                                        <div>
                                            <label className="block text-[15px] font-semibold text-gray-800 mb-1.5">
                                                Costo anterior <span className=" text-xs"></span>
                                            </label>
                                            <div>
                                                <InputERP
                                                    type="currency"
                                                    moneda={monedaUsada}
                                                    disabled
                                                    icon={<Calculator size={15} />}
                                                    value={articuloActual?.precio_compra}
                                                    onChange={() => alert}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[15px] font-semibold text-gray-800 mb-1.5">
                                                Precio de venta actual <span className=" text-xs"></span>
                                            </label>
                                            <div>
                                                <InputERP
                                                    type="currency"
                                                    moneda={monedaUsada}
                                                    disabled
                                                    icon={<Calculator size={15} />}
                                                    value={articuloActual?.precio_venta}
                                                    onChange={() => alert}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[15px] font-semibold text-gray-800 mb-1.5">
                                                Nuevo precio de venta <span className=" text-xs"></span>
                                            </label>
                                            <div>
                                                <InputERP
                                                    type="currency"
                                                    moneda={monedaUsada}
                                                    icon={<Calculator size={15} />}
                                                    value={nuevoPrecio}
                                                    onChange={(e) => setNuevoPrecio(e)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Tarjeta>
                            </div>
                        </div>
                    </>
                }
                footer={
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={limpiar}
                            className="flex gap-2 justify-center items-center text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:brightness-90 focus:ring-2 focus:ring-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: C.darker }}
                        >
                            Cancelar (Esc)
                        </button>
                        <button
                            type="button"
                            onClick={agregarLinea}
                            className="flex gap-2 justify-center items-center text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:brightness-90 focus:ring-2 focus:ring-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: C.base }}
                        >
                            {editandoId ? <RefreshCw size={20} /> : <Plus size={20} />}
                            {editandoId ? 'Actualizar' : 'Agregar'} (Ctrl+Enter)
                        </button>
                    </div>
                }
            />

          
            <ModalGeneral
                title='Buscar Articulo'
                isOpen={openModalArticulo}
                onClose={() => setOpenModalArticulo(false)}
                width='1700px'
                height='500px'
                childrenPadding={false}
                showCloseButton={false}
            >
                <DataTable<InterfaceArticulo>
                    data={articulos}
                    columns={[
                        { header: "ID", accessor: "id", align: 'start', width: '70px', sortable: true },
                        { header: "Nombre", accessor: "nombre", align: 'start', width: '90px', sortable: true },
                        {
                            header: "IVA", accessor: "iva_porcentaje", align: 'right', width: '90px', sortable: true,
                            cell: e => <span>{Number(e.iva_porcentaje)}%</span>
                        },
                        {
                            header: "Costo", accessor: "precio_compra", align: 'right', width: '90px', sortable: true,
                            cell: e => formatarMoeda(e.precio_compra)
                        },
                        {
                            header: "Precio", accessor: "precio_venta", align: 'right', width: '90px', sortable: true,
                            cell: e => formatarMoeda(e.precio_venta)
                        },
                    ]}
                    showGlobalSearch={true}
                    globalSearchPlaceholder="Buscar por todos los campos!"
                    initialPageSize={7}
                    selectable={false}
                    showFilters={false}
                    onRowClick={row => handleSeleccionar(row)}
                />
            </ModalGeneral>
        </div >
    );
};

export default FormDetalle; */