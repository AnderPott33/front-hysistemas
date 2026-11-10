import { List, Pen, Plus } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceSubcategoria, tipoCategoria } from "../interfaces/InterfaceCategoria";
import { usePermisos } from "../../../context/PermisosContext";

interface InterfaceSubcategoriasList {
    datos: InterfaceSubcategoria[];
    tipo: tipoCategoria;
    onEditar: (subcategoria: InterfaceSubcategoria) => void;
    onNuevo: () => void;
}

export const SubcategoriasList = ({ datos, tipo, onEditar, onNuevo }: InterfaceSubcategoriasList) => {
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_subcategoria");
    const puedeEditar = tienePermiso("editar_subcategoria");

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <List size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Subcategorías</span>
                        <span className="text-xs text-mi-cuarta/50">{`Subcategorías de ${tipo.toLowerCase()} agrupadas por categoría`}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onNuevo}
                    disabled={!puedeAgregar}
                    data-tooltip={puedeAgregar ? 'Agregar Subcategoría' : 'No tienes los privilegios necesarios'}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nueva Subcategoría
                </button>
            </div>

            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable
                    data={datos}
                    showGlobalSearch
                    showFilters={false}
                    columns={[
                        { header: "#", accessor: "id", align: "center", width: '30px', sortable: true },
                        { header: "Código", accessor: "codigo", align: "start", width: '90px', sortable: true },
                        { header: "Nombre", accessor: "nombre", align: "start", sortable: true },
                        {
                            header: "Categoría", accessor: "categoria", align: "start", sortable: false,
                            cell: e => (
                                <div className="flex flex-col">
                                    <span className="font-semibold">{e.categoria?.nombre}</span>
                                    <span className="text-xs text-mi-cuarta/60">{e.categoria?.tipo}</span>
                                </div>
                            )
                        },
                        { header: "Descripción", accessor: "descripcion", align: "start", sortable: false },
                        {
                            header: "Estado", accessor: "activo", align: "center", width: "100px", sortable: true, filterable: true,
                            cell: row => (
                                <span className="flex justify-center items-center">
                                    {row.activo ? (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">Activo</span>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200">Inactivo</span>
                                    )}
                                </span>
                            )
                        },
                        {
                            header: "Acciones", accessor: "Acciones", align: "center",
                            cell: e => (
                                <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                        type="button"
                                        onClick={() => onEditar(e)}
                                        disabled={!puedeEditar}
                                        data-tooltip={!puedeEditar ? 'No tienes los privilegios necesarios' : 'Editar Subcategoría'}
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
};
