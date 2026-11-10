import { List, Pen, Plus } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";
import { usePermisos } from "../../../context/PermisosContext";

interface InterfaceOperacionesTable {
    operaciones: InterfaceOperacionBaja[];
    obtenerOperacion: (id: number) => Promise<void>;
    activeBar: (tab: string) => void;
}

const OperacionesTable = ({ operaciones, obtenerOperacion, activeBar }: InterfaceOperacionesTable) => {

    const { tienePermiso } = usePermisos();
        const puedeVerPagina = tienePermiso("pagina_operaciones");
        const puedeAgregar = tienePermiso("agregar_operacion");
        const puedeEditar = tienePermiso("editar_operacion");

    const nuevaOperacion = () => {
        obtenerOperacion(0);
        activeBar('registro');
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
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Operaciones</span>
                        <span className="text-xs text-mi-cuarta/50">Administra las operaciones del sistema</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={nuevaOperacion}
                    /* disabled={!puedeAgregar} */
                    data-tooltip={/* puedeAgregar */ 1 == 1 ? 'Agregar Operación' : 'No tienes los privilegios necesarios'}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nueva Operación
                </button>
            </div>

            {/* Tabla */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable<InterfaceOperacionBaja>
                    data={operaciones}
                    columns={[
                        { header: "#", accessor: "id", sortable: true, filterable: false },
                        { header: "Descripción", accessor: "descripcion", sortable: true, filterable: false },
                        { header: "Módulo", accessor: "modulo", sortable: true, filterable: false },
                        {
                            header: "Acciones",
                            accessor: "acciones",
                            align: "center",
                            sortable: false,
                            filterable: false,
                            cell: e => (
                                <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            obtenerOperacion(e.id);
                                            activeBar("registro");
                                        }}
                                        data-tooltip="Editar Operación"
                                        className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors"
                                    >
                                        <Pen size={18} />
                                    </button>
                                </div>
                            )
                        },
                    ]}
                    showGlobalSearch={true}
                    pagination={false}
                    selectable={false}
                    showFilters={false}
                />
            </div>
        </div>
    );
};

export default OperacionesTable;