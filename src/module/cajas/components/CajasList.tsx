import { useEffect, useState } from "react";
import { Plus, List, Pen, Key } from "lucide-react";
import { type InterfaceCajas } from "../Interfaces/InterfaceCajas";
import { useAuth } from "../../../context/AuthContext";
import DataTable from "../../../components/utils/DataTable";
import { formatarDataHora } from "../../../components/utils/Formatadores";
import { useCaja } from "../../../context/CajaContext";
import Loading from "../../../components/utils/Loading";
import { usePermisos } from "../../../context/PermisosContext";

interface CajasListProps {
    datos: InterfaceCajas[];
    cajaSeleccionada: InterfaceCajas | null;
    obtenerCaja: (id: number) => Promise<void>;
    activeBar: (tab: string) => void;
    loguearCaja: (id: number) => void;
}

const FormInicial: InterfaceCajas = {
    id: Number(''),
    estado: "Abierta",
    apertura: new Date(),
    cierre: null,
    descripcion: "",
    usuario_id: undefined,
    usuario: ""
};

const CajasList: React.FC<CajasListProps> = ({
    datos,
    cajaSeleccionada,
    obtenerCaja,
    activeBar,
    loguearCaja
}) => {
    const { user } = useAuth();
    const { caja } = useCaja();
    const [formData, setFormData] = useState<InterfaceCajas>({
        ...FormInicial,
        usuario_id: user?.id,
        usuario: user?.nombre
    });
    const [cargando, setCargando] = useState(true);

    const limpiarFormulario = () => {
        setFormData({
            ...FormInicial,
            usuario_id: user?.id,
            usuario: user?.nombre,
            apertura: formatarDataHora(new Date())
        });
    };

    useEffect(() => {
        setCargando(true);
        if (caja?.id) {
            obtenerCaja(Number(caja?.id));
        }
        setCargando(false);
    }, [caja?.id]);

    useEffect(() => {
        setCargando(true);
        if (cajaSeleccionada && cajaSeleccionada.id) {
            setFormData({
                ...cajaSeleccionada,
                apertura: formatarDataHora(cajaSeleccionada.apertura),
                usuario_id: cajaSeleccionada.usuario_id || user?.id,
                usuario: cajaSeleccionada.usuario || user?.nombre
            });
        }
        setCargando(false);
    }, [cajaSeleccionada, user]);

    const handleSeleccionar = (subtipo: InterfaceCajas) => {
        setCargando(true);
        setFormData(subtipo);
        obtenerCaja(Number(subtipo.id));
        setCargando(false);
    };

    const handleEditar = (caja: InterfaceCajas) => {
        setCargando(true);
        handleSeleccionar(caja);
        activeBar('registro');
        setCargando(false);
    };

    const nuevaCaja = () => {
        setCargando(true);
        limpiarFormulario();
        activeBar('registro');
        setCargando(false);
    };

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeLoguearCaja = tienePermiso("loguear_caja");
    const puedeAbrirCaja = tienePermiso("agregar_caja");
    const puedeEditarCaja = tienePermiso("editar_caja");

    if (cargando) return <Loading />;

    return (
        <div className="space-y-4">
            {/* Header de la lista */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <List size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Cajas</span>
                        <span className="text-xs text-mi-cuarta/50">Administra las cajas del sistema</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => nuevaCaja()}
                        disabled={!puedeAbrirCaja}
                        data-tooltip={`${!puedeAbrirCaja ? 'No tienes los privilegios necesarios' : 'Agregar nueva caja'}`}
                        className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl font-semibold  bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Nueva Caja
                    </button>

                    <button
                        onClick={() => loguearCaja(Number(null))}
                        disabled={!caja}
                        data-tooltip={`${!caja ? 'No cuentas con caja logueada' : `Desloguear Caja ${caja?.id}`}`}
                        className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl font-semibold  bg-mi-cuarta text-white shadow-md shadow-mi-cuarta/30 hover:bg-mi-segunda transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        <Key size={18} />
                        Desloguear Caja
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable<InterfaceCajas>
                    data={datos}
                    size="md"
                    columns={[
                        {
                            header: "#",
                            accessor: "id",
                            align: "start",
                            width: "100px",
                            sortable: true,
                            filterable: true
                        },
                        {
                            header: "Descripción",
                            accessor: "descripcion",
                            align: "start",
                            width: "200px",
                            sortable: true,
                            filterable: true
                        },
                        {
                            header: "Apertura",
                            accessor: "apertura",
                            align: "center",
                            sortable: true,
                            filterable: true,
                            cell: (row) => formatarDataHora(row.apertura)
                        },
                        {
                            header: "Cierre",
                            accessor: "cierre",
                            align: "center",
                            sortable: true,
                            filterable: true,
                            cell: (row) => (row.cierre ? formatarDataHora(row.cierre) : "-")
                        },
                        {
                            header: "Estado",
                            accessor: "estado",
                            align: "center",
                            width: "100px",
                            sortable: true,
                            filterable: true,
                            cell: (row) => (
                                <span className="flex justify-center items-center">
                                    {row.estado === 'Abierta' ? (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                            Abierta
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200">
                                            Cerrada
                                        </span>
                                    )}
                                </span>
                            )
                        },
                        {
                            header: "Usuario",
                            accessor: "usuario",
                            align: "center",
                            sortable: true,
                            filterable: true
                        },
                        {
                            header: "Acciones",
                            accessor: "Acciones",
                            align: "center",
                            sortable: false,
                            cell: (row) => {
                                return (
                                    <div className="flex gap-1.5 justify-center items-center">
                                        <button
                                            onClick={() => handleEditar(row)}
                                            disabled={!puedeEditarCaja}
                                            className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            data-tooltip={`${!puedeEditarCaja ? 'No tienes privilegios necesarios' : 'Editar Caja'}`}
                                        >
                                            <Pen size={18} />
                                        </button>
                                        <button
                                            onClick={() => loguearCaja(Number(row?.id))}
                                            disabled={row.estado == 'Cerrada' || caja?.id == row.id || !puedeLoguearCaja}
                                            className="p-2 cursor-pointer  text-mi-tercera hover:bg-mi-primera/15 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            data-tooltip={`${caja?.id == row.id ? 'Caja ya logueada' : row.estado == 'Cerrada' ? 'Caja cerrada no se puede loguear' : !puedeLoguearCaja ? 'No tienes los privilegios necesarios' : 'Loguear Caja'}`}
                                        >
                                            <Key size={18} />
                                        </button>
                                        <button
                                            onClick={() => loguearCaja(Number(null))}
                                            disabled={!caja || caja?.id != row.id}
                                            className="p-2 cursor-pointer text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            data-tooltip={`${caja?.id != row.id ? 'Solo se puede desloguear la caja logueada' : 'Desloguear Caja'}`}
                                        >
                                            <Key size={18} />
                                        </button>
                                    </div>
                                );
                            }
                        }
                    ]}
                    showGlobalSearch={true}
                    globalSearchPlaceholder="Buscar por todos los campos!"
                    initialPageSize={10}
                    selectable={false}
                />
            </div>
        </div>
    );
};

export default CajasList;