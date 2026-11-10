/* import { Trash2 } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import { formatarMoeda } from "../../../components/utils/Formatadores";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceDetalleTransaccion } from "../interfaces/interfaceTransaccion";
import type { InterfaceCategoriaGastoIngreso } from "../../categoriaGastoIngreso/interfaces/InterfaceCategoriaGastoIngreso";

interface InterfaceTableDetalle {
    datosDetalle: InterfaceDetalleTransaccion[];
    monedaSeleccionada: InterfaceMoneda;
    onEliminarLinea?: (id: string) => void;
    onEditarLinea?: (detalle: InterfaceDetalleTransaccion) => void;
    categoriasGastoIngreso: InterfaceCategoriaGastoIngreso[];
}

const TableDetalle = ({ datosDetalle, monedaSeleccionada, categoriasGastoIngreso, onEliminarLinea, onEditarLinea }: InterfaceTableDetalle) => {

    const calcularSubtotal = () => datosDetalle.reduce((sum, item) => sum + ((item.cantidad * item.precio_unitario) - (item.valor_descuento || 0)), 0);
    const calcularSubtotalCantidad = () => datosDetalle.reduce((sum, item) => sum + (item.cantidad || 0), 0);

    return (
        <div>
            
            <DataTable<InterfaceDetalleTransaccion>
                data={datosDetalle}
                columns={[
                    { header: "#", accessor: "numero_linea" },
                    {
                        header: "Item", accessor: "categoria_articulo",
                        cell: e => {
                            const categoriaSele = categoriasGastoIngreso?.find(ee => ee.id === e.categoria_gasto_ingreso);
                            const mostrando = e.articulo_id ? `${e.articulo_id} - ${e.descripcion}` : `${categoriaSele?.id} - ${categoriaSele?.nombre}`;
                            return <span>{mostrando}</span>
                        }
                    },
                    { header: "Ctd", align: 'center', accessor: "cantidad" },
                    {
                        header: "Precio Uni", align: 'right', accessor: "precio_unitario",
                        cell: e => formatarMoeda(e.precio_unitario, monedaSeleccionada)
                    },
                    {
                        header: "Des", align: 'right', accessor: "descuento_valor",
                        cell: e => {
                            return (
                                <span className="text-red-500">{formatarMoeda(e.valor_descuento, monedaSeleccionada)}</span>
                            )
                        }
                    },
                    {
                        header: "IVA", accessor: "iva_porcentaje",
                        cell: e => {
                            return (
                                <span>{`${e.iva}%`}</span>
                            )
                        }
                    },

                    {
                        header: "Valor IVA", align: 'right', accessor: "valor_iva",
                        cell: e => formatarMoeda(e.valor_iva, monedaSeleccionada)
                    },
                    {
                        header: "Total", align: 'right', accessor: "valor_total",
                        cell: e => formatarMoeda(e.valor_total, monedaSeleccionada)
                    },
                    {
                        header: "Acción",
                        accessor: "id",
                        cell: (value) => (
                            <button
                                onClick={() => onEliminarLinea?.(value.id as string)}
                                className="flex items-center gap-1 px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar línea"
                            >
                                <Trash2 size={16} />
                            </button>
                        ),
                    },
                ]}
                footer={[
                    <div className="grid grid-cols-9 bg-gray-50 text-gray-700 font-medium py-3 px-4">
                        <span className="col-span-3"></span>
                        <span className="col-span-1 flex justify-center  text-sm items-center">{calcularSubtotalCantidad()}</span>
                        <span className="col-span-3"></span>
                        <span className="col-span-1 flex justify-end text-sm items-center">{formatarMoeda(calcularSubtotal(), monedaSeleccionada)}</span>
                        <span className="col-span-1"></span>
                    </div>
                ]}
                showGlobalSearch={false}
                pagination={false}
                selectable={false}
                showFilters={false}
                onRowClick={onEditarLinea}
            />
           
        </div>
    );
}

export default TableDetalle; */