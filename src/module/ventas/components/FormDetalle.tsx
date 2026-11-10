/* import { useEffect, useState } from "react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceOperacionBaja } from "../../operaciones/interfaces/InterfaceOperacion";
import type { InterfaceArticulo, InterfaceDetalleTransaccion } from "../interfaces/interfaceTransaccion";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";
import { showAlert } from "../../../components/utils/Procesando";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import { Plus, RefreshCw } from "lucide-react";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { formatarMoeda } from "../../../components/utils/Formatadores";

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
}

const FormDetalle = ({
    enviarDetalle,
    formInicialDetalle,
    personas,
    monedas,
    articulos,
    operacionSeleccionada,
    cargarArticuloRap,
    calcularSubtotal,
    editandoId = null,
    onEditarLinea,
    detalle
}: InterfaceFormDetalle) => {

    const [buscarArt, setBuscarArt] = useState('');
    const [cantidadArt, setCantidadArt] = useState('');
    const [formDetalle, setFormDetalle] = useState<InterfaceDetalleTransaccion>(formInicialDetalle);
    const [openModalArticulo, setOpenModalArticulo] = useState(false);

    useEffect(() => {
        setFormDetalle(formInicialDetalle);
        if (editandoId && formInicialDetalle.articulo_id) {
            setBuscarArt(String(formInicialDetalle.articulo_id));
            setCantidadArt(String(formInicialDetalle.cantidad || ''));
        } else {
            setBuscarArt('');
            setCantidadArt('');
        }
    }, [editandoId, formInicialDetalle]);

    // Recalcular cuando cambia la cantidad en modo edición
    useEffect(() => {
        if (editandoId && formDetalle.precio_unitario > 0) {
            const cantidadArticulo = Number(formDetalle.cantidad || 0);
            const precioVenta = Number(formDetalle.precio_unitario || 0);
            const ivaPorc = Number(formDetalle.iva || 0);
            const descuento = Number(formDetalle.valor_descuento || 0);
            const subtotalCalc = (cantidadArticulo * precioVenta) - descuento;
            const ivaCalc = Math.round(subtotalCalc / (ivaPorc === 10 ? 11 : 21));

            setFormDetalle(prev => ({
                ...prev,
                valor_iva: ivaCalc,
                valor_total: subtotalCalc
            }));
        }
    }, [formDetalle.cantidad, formDetalle.precio_unitario, editandoId]);

    const cargarArticuloRapp = async () => {
        const partes = buscarArt.split('*');
        let cantidad = Number(cantidadArt) || 1;
        let id = null;

        if (partes.length === 2) {
            cantidad = Number(partes[0]) || 1;
            id = Number(partes[1]);
        } else if (partes.length === 1) {
            id = Number(partes[0]);
        }

        if (!id || id <= 0) {
            showAlert('Debes ingresar un ID válido', 'warning');
            return;
        }

        try {
            const data = await cargarArticuloRap(Number(cantidad), Number(id));


            if (!data) {
                showAlert('Artículo no encontrado', 'warning');
            } else {
                const cantidadArticulo = Number(data?.cantidad_solicitada || cantidad || 1);
                const precioVenta = Number(data?.precio_venta || 0);
                const ivaPorc = Number(data?.iva_porcentaje || 0);
                const descuento = 0;
                const subtotalCalc = cantidadArticulo * precioVenta - descuento;
                const ivaCalc = Math.round(subtotalCalc / (ivaPorc === 10 ? 11 : 21));
                const totalCalc = subtotalCalc;

                 console.log({
                     "Cant": cantidadArticulo,
                     "precioVenta": precioVenta,
                     "iva%": ivaPorc,
                     "valor_iva": ivaCalc,
                     "valorTotal": totalCalc
                 })

                const agregando = {
                    id: editandoId || crypto.randomUUID(),
                    transaccion_id: 0,
                    numero_linea: editandoId ? formDetalle.numero_linea : (detalle.length || 0) + 1,
                    descripcion: data?.nombre || '',
                    cantidad: cantidadArticulo,
                    iva: Number(ivaPorc),
                    valor_iva: ivaCalc,
                    valor_descuento: 0,
                    articulo_id: Number(data?.id),
                    precio_unitario: precioVenta,
                    valor_total: totalCalc,
                    categoria_gasto_ingreso: operacionSeleccionada?.modulo === 'Venta' ? Number(operacionSeleccionada?.categoria_id) : Number('')
                };

                setFormDetalle(agregando);

                if (!editandoId) {
                    await agregarLinea(agregando);
                }
                showAlert('Artículo cargado correctamente', 'success');
            }
            setBuscarArt('');
            setCantidadArt('');
        } catch (err) {
            console.error("Error al cargar artículo:", err);
            showAlert('Error al cargar el artículo', 'error');
        }
    }

    const agregarLinea = async (data?: InterfaceDetalleTransaccion) => {
        const dataToSave = data || formDetalle;

        // Validar que hay artículo y cantidad válida
        if (!dataToSave.articulo_id || dataToSave.articulo_id <= 0) {
            showAlert('Debes cargar un artículo válido', 'warning');
            return;
        }

        if (!dataToSave.cantidad || dataToSave.cantidad <= 0) {
            showAlert('Debes ingresar una cantidad válida', 'warning');
            return;
        }

        if (!dataToSave.precio_unitario || dataToSave.precio_unitario <= 0) {
            showAlert('El artículo debe tener un precio válido', 'warning');
            return;
        }

        try {
            // Asegurar que los cálculos están correctos
            const cantidadArticulo = Number(dataToSave.cantidad || 1);
            const precioVenta = Number(dataToSave.precio_unitario || 0);
            const ivaPorc = Number(dataToSave.iva || 0);
            const descuento = Number(dataToSave.valor_descuento || 0);
            const subtotalCalc = (cantidadArticulo * precioVenta) - descuento;
            const ivaCalc = Math.round(subtotalCalc / (ivaPorc === 10 ? 11 : 21));
            const totalCalc = subtotalCalc;

            // Generar ID único si no existe (agregar nuevo) o mantener si existe (editar)
            const idFinal = dataToSave.id || crypto.randomUUID();

            const dataFinal = {
                ...dataToSave,
                id: idFinal,
                numero_linea: editandoId ? dataToSave.numero_linea : (detalle.length || 0) + 1,
                cantidad: cantidadArticulo,
                valor_iva: ivaCalc,
                valor_total: totalCalc
            };

            await enviarDetalle(dataFinal);

            // Limpiar formulario
            setFormDetalle(formInicialDetalle);
            setBuscarArt('');
            setCantidadArt('');

            if (onEditarLinea) {
                onEditarLinea(null);
            }

            showAlert(editandoId ? 'Línea actualizada correctamente' : 'Línea agregada correctamente', 'success');
        } catch (err) {
            console.error("Error al agregar línea:", err);
            showAlert('Error al agregar la línea', 'error');
        }
    }

    const handleSelectOption = (option: SearchOption) => {

        const cantidad = Number(cantidadArt) || 1;
        const articulo = articulos.find(a => a.id === option.id);

        if (articulo) {
            const precioVenta = Number(articulo.precio_venta || 0);
            const ivaPorc = Number(articulo.iva_porcentaje || 0);
            const descuento = 0;
            const subtotalCalc = (cantidad * precioVenta) - descuento;
           const ivaCalc = Math.round(subtotalCalc / (ivaPorc === 10 ? 11 : 21));
            const totalCalc = subtotalCalc;

            setFormDetalle(prev => ({
                ...prev,
                articulo_id: Number(option.id),
                cantidad: cantidad,
                descripcion: articulo.nombre || '',
                precio_unitario: precioVenta,
                iva: Number(ivaPorc),
                valor_iva: ivaCalc,
                valor_total: totalCalc
            }));
        }
    };

    const handleCancelarEdicion = () => {
        setFormDetalle(formInicialDetalle);
        setBuscarArt('');
        setCantidadArt('');
        if (onEditarLinea) {
            onEditarLinea(null);
        }
    };

    const opciones: SearchOption[] = [...articulos]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(e => ({ id: e.id, texto: e.nombre }));

    const handleSeleccionar = (articulo: InterfaceArticulo) => {
        const optionF: SearchOption = { id: Number(articulo.id), texto: String(articulo.nombre) }

        setBuscarArt(String(articulo.id))
        setCantidadArt(String(1))
        handleSelectOption(optionF)
        setOpenModalArticulo(false);
    };
 

    return (
        <div className="p-3">
            <div className="grid grid-cols-7 justify-center items-center gap-2">
                <div className="flex-1 col-span-4">
                    <span className="text-sm font-semibold text-gray-700">
                        {editandoId ? 'Cambiar Artículo' : 'Buscar Artículo'}
                    </span>
                    <InputERP
                        type="searchNumber"
                        value={buscarArt}
                        onChange={e => setBuscarArt(e)}
                        searchOptions={opciones}
                        onSelectOption={handleSelectOption}
                        searchMinChars={1}
                        onEnterPress={cargarArticuloRapp}
                        onSearchClick={() => setOpenModalArticulo(true)}
                        displayMode="text"
                        showSearch={true}
                        placeholder={editandoId ? "Buscar nuevo artículo" : "Buscar artículo o id"}
                    />
                </div>
                <div className="flex-1 col-span-2">
                    <span className="text-sm font-semibold text-gray-700">Cantidad</span>
                    <InputERP
                        type="number"
                        value={cantidadArt}
                        onChange={e => {
                            setCantidadArt(e);
                            // Actualizar cantidad en formDetalle si ya hay artículo seleccionado
                            if (formDetalle.articulo_id) {
                                const cantidad = Number(e) || 1;
                                const precioVenta = Number(formDetalle.precio_unitario || 0);
                                const ivaPorc = Number(formDetalle.iva || 0);
                                const descuento = Number(formDetalle.valor_descuento || 0);
                                const subtotalCalc = (cantidad * precioVenta) - descuento;
                                const ivaCalc = Math.round(subtotalCalc / (ivaPorc === 10 ? 11 : 21));

                                setFormDetalle(prev => ({
                                    ...prev,
                                    cantidad: cantidad,
                                    valor_iva: ivaCalc,
                                    valor_total: subtotalCalc
                                }));
                            }
                        }}
                        placeholder="Cantidad"
                    />
                </div>
                <div className="flex-1 col-span-1 flex gap-1">
                    <button
                        onClick={() => agregarLinea()}
                        className="flex justify-center items-center mt-6 w-full gap-2 px-4 py-2.5 font-semibold rounded-xl bg-[#188180] text-white hover:bg-[#126563] transition-colors"
                        title={editandoId ? "Actualizar línea" : "Agregar línea"}
                    >
                        {editandoId ? <RefreshCw size={20} /> : <Plus size={20} />}
                    </button>
                    {editandoId && (
                        <button
                            onClick={handleCancelarEdicion}
                            className="flex justify-center items-center mt-6 px-4 py-2.5 font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Cancelar edición"
                        >
                            X
                        </button>
                    )}
                </div>
            </div>
            <div>
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
                                cell: e => {
                                    return (
                                        <span>{Number(e.iva_porcentaje)}%</span>
                                    )
                                }
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
            </div>
        </div>
    );
}

export default FormDetalle; */