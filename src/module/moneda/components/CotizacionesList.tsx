import { List, Pen, Plus } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../interfaces/InterfaceMoneda";
import { Flag } from "../../../context/FlagsContext";
import { formatarData, formatarMoeda } from "../../../components/utils/Formatadores";

interface InterfaceCotizacionesList {
    datos: InterfaceTipoCambio[];
    datosMonedas: InterfaceMoneda[];
    cargarCotizacion: (cotizacion: InterfaceTipoCambio | null) => void;
    activeBar: (tab: string) => void;
}

export const CotizacionesList = ({ datos, datosMonedas, cargarCotizacion, activeBar }: InterfaceCotizacionesList) => {

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("puede_agregar_cotizacion");
    const puedeEditar = tienePermiso("puede_editar_cotizacion");
    const { isAdmin } = useAuth();

    const editarCotizacion = (cotizacion: InterfaceTipoCambio) => {
        cargarCotizacion(cotizacion);
        activeBar('registroCotizacion');
    };

    const nuevaCotizacion = () => {
        cargarCotizacion(null);
        activeBar('registroCotizacion');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <List size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Cotizaciones</span>
                        <span className="text-xs text-mi-cuarta/50">Administra las cotizaciones del sistema</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={nuevaCotizacion}
                    disabled={!puedeAgregar}
                    data-tooltip={puedeAgregar ? 'Agregar Cotización' : 'No tienes los privilegios necesarios'}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nueva Cotización
                </button>
            </div>

            {/* Tabla */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable
                    data={datos}
                    /* showGlobalSearch */
                    showFilters={false}
                    columns={[
                        { header: "#", accessor: "id", align: "start", sortable: true, filterable: true },
                        {
                            header: "Grupo", accessor: "grupo_id", align: "center", sortable: false,
                            cell: e => e.grupo_id ? (
                                <span
                                    className="font-mono text-xs text-mi-cuarta/60"
                                    title={String(e.grupo_id)}
                                >
                                    {String(e.grupo_id).slice(0, 8)}
                                </span>
                            ) : (
                                <span className="text-mi-cuarta/30">—</span>
                            )
                        },
                        {
                            header: "Moneda Origen", accessor: "moneda_origen", align: "start", sortable: true,
                            cell: e => {
                                const moneda = datosMonedas.find(ee => ee.id === e.moneda_origen)
                                return (
                                    <div className="flex gap-2 justify-start items-center ">
                                        <Flag
                                            className="rounded-sm border border-mi-primera"
                                            country={moneda?.codigo as 'PYG'}
                                            size={30}
                                        />
                                        <span>{moneda?.nombre}</span>
                                    </div>
                                )
                            }
                        },
                        {
                            header: "Moneda Destino", accessor: "moneda_destino", align: "start", sortable: true,
                            cell: e => {
                                const moneda = datosMonedas.find(ee => ee.id === e.moneda_destino)
                                return (
                                    <div className="flex gap-2 justify-start items-center ">
                                        <Flag
                                            className="rounded-sm border border-mi-primera"
                                            country={moneda?.codigo as 'PYG'}
                                            size={30}
                                        />
                                        <span>{moneda?.nombre}</span>
                                    </div>
                                )
                            }
                        },
                        {
                            header: "Cotización", accessor: "valor", align: "right", sortable: true,
                            cell: e => {
                                const moneda = datosMonedas.find(ee => ee.id === e.moneda_destino)
                                return (
                                    <div className="flex gap-2 justify-end items-center ">
                                        <span>{formatarMoeda(e.valor, moneda)}</span>
                                    </div>
                                )
                            }
                        },
                        {
                            header: "Fecha", accessor: "fecha", align: "right", sortable: true,
                            cell: e => {
                                return (
                                    <div className="flex gap-2 justify-end items-center ">
                                        <span>{formatarData(e.fecha)}</span>
                                    </div>
                                )
                            }
                        },
                        {
                            header: "Estado",
                            accessor: "activo",
                            align: "center",
                            width: "100px",
                            sortable: true,
                            filterable: true,
                            cell: row => (
                                <span className="flex justify-center items-center">
                                    {row.activo ? (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                            Activa
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200">
                                            Inactiva
                                        </span>
                                    )}
                                </span>
                            )
                        },
                        {
                            header: "Acciones",
                            accessor: "Acciones",
                            align: "center",
                            cell: e => (
                                <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                        type="button"
                                        onClick={() => editarCotizacion(e)}
                                        disabled={!puedeEditar}
                                        data-tooltip={
                                            puedeEditar
                                                ? 'Editar Cotización'
                                                : 'No tienes los privilegios necesarios'
                                        }
                                        className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Pen size={18} />
                                    </button>
                                </div>
                            )
                        },
                    ]}
                />
            </div>
        </div>
    );
}