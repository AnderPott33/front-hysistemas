import { Key, List, Pen, Plus } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceUsuarios } from "../interfaces/usuariosInterfaces";
import { useState } from "react";
import { showAlert } from "../../../components/utils/Procesando";
import InputERP from "../../../components/utils/InputERP";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";

interface InterfaceUsuariosList {
    datos: InterfaceUsuarios[];
    cargarUsuario: (id: number) => void;
    activeBar: (tab: string) => void;
    cambiarPasswordAmin: (newPassword: string, userId: number) => Promise<void>;
}

export const UsuariosList = ({ datos, cargarUsuario, activeBar, cambiarPasswordAmin }: InterfaceUsuariosList) => {

    const [idUsuario, setIdUsuario] = useState(Number);
    const [modalContrasena, setModalContrasena] = useState(false);
    const [cambiarPass, setCambiarPass] = useState({
        nuevaPass: '',
        repNuevaPass: ''
    });

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_usuario");
    const puedeEditar = tienePermiso("editar_usuario");
    const puedeCambiarContrasena = tienePermiso("cambiar_contrasena");
    const { isAdmin } = useAuth();

    const editarUsuario = (id: Number) => {
        cargarUsuario(Number(id));
        activeBar('registro');
    };

    const nuevoUsuario = () => {
        cargarUsuario(0);
        activeBar('registro');
    };

    const cambiarContrasena = async () => {
        if (cambiarPass.nuevaPass === cambiarPass.repNuevaPass) {
            await cambiarPasswordAmin(cambiarPass.nuevaPass, Number(idUsuario));
            showAlert('Contraseña alterada con éxito!', 'success');
        } else {
            showAlert('Las contraseñas no coinciden', 'warning');
            return;
        }
        setCambiarPass({ nuevaPass: '', repNuevaPass: '' });
        setModalContrasena(false);
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
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Usuarios</span>
                        <span className="text-xs text-mi-cuarta/50">Administra los usuarios del sistema</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={nuevoUsuario}
                    disabled={!puedeAgregar}
                    data-tooltip={puedeAgregar ? 'Agregar Usuario' : 'No tienes los privilegios necesarios'}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nuevo Usuario
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
                        { header: "E-mail", accessor: "email", align: "start", sortable: true },
                        { header: "Grupo Privilegios", accessor: "rol_nombre", align: "center", sortable: true },
                        {
                            header: "Caja Logueada",
                            accessor: "caja_logueada",
                            align: "center",
                            sortable: true,
                            cell: row => (
                                <span className="flex justify-center items-center">
                                    {row.caja_logueada ? (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-mi-primera/15 text-mi-tercera border border-mi-primera/25">
                                            Caja Logueada: {row.caja_logueada}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                                            Sin Caja Logueada
                                        </span>
                                    )}
                                </span>
                            )
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
                                        onClick={() => editarUsuario(Number(e.id))}
                                        disabled={!puedeEditar || (e.id == 1 && !isAdmin)}
                                        data-tooltip={
                                            puedeEditar && (e.id !== 1 || isAdmin)
                                                ? 'Editar Usuario'
                                                : e.id === 1
                                                    ? 'Solo Usuario Master pueden editar este usuario'
                                                    : 'No tienes los privilegios necesarios'
                                        }
                                        className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Pen size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIdUsuario(Number(e.id));
                                            setModalContrasena(true);
                                        }}
                                        disabled={!puedeCambiarContrasena || (e.id == 1 && !isAdmin)}
                                        data-tooltip={
                                            puedeCambiarContrasena && (e.id !== 1 || isAdmin)
                                                ? 'Cambiar Contraseña'
                                                : e.id === 1
                                                    ? 'Solo Usuario Master pueden alterar contraseña de este usuario'
                                                    : 'No tienes los privilegios necesarios'
                                        }
                                        className="p-2 cursor-pointer text-mi-tercera hover:bg-mi-primera/15 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Key size={18} />
                                    </button>
                                </div>
                            )
                        },
                    ]}
                />
            </div>

            {/* Modal de cambio de contraseña (fuera de las celdas para no re-renderizarlo por fila) */}
            <ModalGeneral
                title="Alterar Contraseña Usuario"
                subtitle="Ingresa y confirma la nueva contraseña"
                icon={<Key size={20} />}
                isOpen={modalContrasena}
                onClose={() => setModalContrasena(false)}
                width="450px"
                actions={[
                    {
                        label: "Alterar Contraseña",
                        variant: "primary",
                        onClick: cambiarContrasena,
                    },
                ]}
            >
                <div className="grid gap-5">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-mi-cuarta">Nueva Contraseña</span>
                        <InputERP
                            type="password"
                            value={cambiarPass.nuevaPass}
                            onChange={e => setCambiarPass({ ...cambiarPass, nuevaPass: e })}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-mi-cuarta">Repita la Nueva Contraseña</span>
                        <InputERP
                            type="password"
                            value={cambiarPass.repNuevaPass}
                            onChange={e => setCambiarPass({ ...cambiarPass, repNuevaPass: e })}
                        />
                    </div>
                </div>
            </ModalGeneral>
        </div>
    );
}