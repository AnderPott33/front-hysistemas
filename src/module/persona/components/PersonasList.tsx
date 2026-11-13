import { List, Pen, Plus, Wallet } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfacePersona } from "../interfaces/InterfacePersona";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";

interface InterfacePersonasList {
    datos: InterfacePersona[];
    cargarPersona: (id: number) => void;
    activeBar: (tab: string) => void;
    onCredito: (persona: InterfacePersona) => void;
}

export const PersonasList = ({ datos, cargarPersona, activeBar, onCredito }: InterfacePersonasList) => {

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_personas");
    const puedeEditar = tienePermiso("editar_personas");
    const { isAdmin } = useAuth();

    const editarPersona = (id: number) => {
        cargarPersona(Number(id));
        activeBar('registro');
    };

    const nuevoPersona = () => {
        cargarPersona(0);
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
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Personas</span>
                        <span className="text-xs text-mi-cuarta/50">Administra las personas del sistema</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={nuevoPersona}
                    disabled={!puedeAgregar}
                    data-tooltip={puedeAgregar ? 'Agregar Persona' : 'No tienes los privilegios necesarios'}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nueva Persona
                </button>
            </div>

            {/* Tabla */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable
                    data={datos}
                    showGlobalSearch
                    showFilters={false}
                    columns={[
                        { header: "#", accessor: "id", align: "start", sortable: true },
                        { header: "Nombre", accessor: "nombre", align: "start", sortable: true },
                        { header: "Cédula", accessor: "cedula", align: "start", sortable: true },
                        { header: "RUC", accessor: "ruc", align: "start", sortable: true },
                        { header: "Teléfono", accessor: "telefono", align: "start", sortable: true },
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
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200">
                                            Inactivo
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
                                        onClick={() => onCredito(e)}
                                        disabled={!puedeEditar}
                                        data-tooltip={puedeEditar ? 'Consultar crédito' : 'No tienes los privilegios necesarios'}
                                        className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Wallet size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editarPersona(Number(e.id))}
                                        disabled={!puedeEditar || (e.id == 1 && !isAdmin)}
                                        data-tooltip={puedeEditar ? 'Editar Persona' : 'No tienes los privilegios necesarios'}
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
