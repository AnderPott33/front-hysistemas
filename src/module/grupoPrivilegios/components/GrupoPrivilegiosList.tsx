import { List, Pen, Plus } from "lucide-react";
import type { InterfaceGrupoPrivilegios } from "../interfaces/grupoPrivilegiosInterfaces";
import DataTable from "../../../components/utils/DataTable";

interface IGrupoPrivilegiosList {
    grupos: InterfaceGrupoPrivilegios[];
    onSelect: (grupo: InterfaceGrupoPrivilegios) => void;
    onDelete: (id: number) => void;
    nuevoGrupo: () => void;
    loading: boolean;
}

const GrupoPrivilegiosList = ({ grupos, onSelect, nuevoGrupo }: IGrupoPrivilegiosList) => {
    const sinElRoot = grupos.filter(e => Number(e.id) > 0);

    const contarMarcadas = (grupo: InterfaceGrupoPrivilegios) =>
        grupo.privilegios?.reduce((acc, p) => acc + p.acciones.filter(a => a.marcada).length, 0) ?? 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <List size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Privilegios</span>
                        <span className="text-xs text-mi-cuarta/50">Administra los grupos de privilegios</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={nuevoGrupo}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nuevo Grupo
                </button>
            </div>

            {/* Tabla */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable
                    data={sinElRoot}
                    showGlobalSearch
                    showFilters={false}
                    columns={[
                        { header: "#", accessor: "id", align: "start", sortable: true },
                        { header: "Nombre", accessor: "nombre", align: "start", sortable: true },
                        {
                            header: "Privilegios",
                            accessor: "privilegios",
                            align: "center",
                            sortable: true,
                            cell: e => {
                                const total = contarMarcadas(e);
                                return (
                                    <div className="flex flex-wrap justify-center gap-1.5">
                                        {total > 0 ? (
                                            <>
                                                {e.privilegios.map(priv =>
                                                    priv.acciones
                                                        .filter(a => a.marcada)
                                                        .slice(0, 2)
                                                        .map(accion => (
                                                            <span
                                                                key={`${priv.modulo}-${accion.clave}`}
                                                                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-mi-primera/15 text-mi-tercera border border-mi-primera/25"
                                                            >
                                                                {accion.label}
                                                            </span>
                                                        ))
                                                )}
                                                {total > 2 && (
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-mi-cuarta/5 text-mi-cuarta/60">
                                                        +{total - 2} más
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs italic text-mi-cuarta/40">Sin privilegios</span>
                                        )}
                                    </div>
                                );
                            }
                        },
                        {
                            header: "Acciones",
                            accessor: "Acciones",
                            align: "center",
                            cell: e => (
                                <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(e)}
                                        className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors"
                                        data-tooltip="Editar Grupo"
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

export default GrupoPrivilegiosList;