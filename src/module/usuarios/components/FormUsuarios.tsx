import { Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react"
import InputERP from "../../../components/utils/InputERP";
import { useEffect, useState } from "react";
import SelectCustom from "../../../components/utils/SelectCustom";
import type { InterfaceUsuarios } from "../interfaces/usuariosInterfaces";
import type { InterfaceGrupoPrivilegios } from "../../grupoPrivilegios/interfaces/grupoPrivilegiosInterfaces";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";

interface InterfaceFormUsuarios {
    usuarioSelect: InterfaceUsuarios | null;
    guardarUsuario: (data: any) => Promise<void>;
    grupoPrivilegios: InterfaceGrupoPrivilegios[] | [];
}

const FormUsuarios = ({ usuarioSelect, guardarUsuario, grupoPrivilegios }: InterfaceFormUsuarios) => {
    const formInicial = {
        id: '',
        nombre: '',
        email: '',
        contrasena: '',
        grupo_privilegios: 0,
        activo: true
    }
    const [formData, setFormData] = useState<InterfaceUsuarios>(formInicial);
    const { user } = useAuth();

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_usuario");
    const puedeEditar = tienePermiso("editar_usuario");
    const puedeInactivar = tienePermiso("inactivar_usuario");

    const puedeGuardar = formData.id ? puedeEditar : puedeAgregar;

    useEffect(() => {
        if (usuarioSelect) {
            setFormData({
                id: Number(usuarioSelect?.id),
                nombre: String(usuarioSelect?.nombre),
                email: String(usuarioSelect?.email),
                grupo_privilegios: Number(usuarioSelect?.grupo_privilegios),
                activo: Number(usuarioSelect?.activo)
            });
        } else {
            setFormData({
                id: '',
                nombre: '',
                email: '',
                contrasena: '',
                grupo_privilegios: 0,
                activo: true
            });
        }
    }, [usuarioSelect])

    const limpiarForm = () => {
        setFormData(formInicial);
    }

    const guardar = () => {
        guardarUsuario(formData);
    }

    const puedeEditarRoot = formData.grupo_privilegios == 0;

    const gruposs = puedeEditarRoot ? grupoPrivilegios : grupoPrivilegios.filter(e => e.id != 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Usuario</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando usuario #${formData.id}` : "Nuevo usuario"}
                        </span>
                        
                    </div>
                </div>
                <button
                        type="button"
                        disabled={formData.id === user?.id}
                        onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                        data-tooltip={`${formData.id === user?.id ? 'El usuario no puede cambiar su proprio estado' : ''}`}
                        className={`flex justify-center w-30 cursor-pointer items-center gap-2 px-4 py-2 font-semibold rounded-xl ${formData.activo ? 'bg-green-100  text-green-600 border-green-600' : 'bg-red-100 text-red-600 border-red-600'} border`}
                    >
                        {formData.activo ? (
                            <>
                                <Power size={20} />
                                <span>Activo</span>
                            </>
                        ) : (
                            <>
                                <PowerOff size={20} />
                                <span>Inactivo</span>
                            </>
                        )}
                    </button>
            </div>

            {/* Campos */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                        <InputERP
                            label="Nombre"
                            type="text"
                            value={formData.nombre}
                            disabled={!puedeGuardar}
                            onChange={e => setFormData({ ...formData, nombre: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="email"
                            label="E-mail"
                            value={formData.email}
                            disabled={!puedeGuardar}
                            onChange={e => setFormData({ ...formData, email: e })}
                        />
                    </div>

                    {!formData.id && (
                        <div className="flex flex-col gap-2">
                            <InputERP
                                label="Contraseña"
                                type="password"
                                disabled={!puedeGuardar}
                                value={formData.contrasena}
                                onChange={e => setFormData({ ...formData, contrasena: e })}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <SelectCustom
                            disabled={!puedeGuardar}
                            label="Grupo Privilegios"
                            isClearable={false}
                            options={gruposs?.map(e => ({ value: e.id, label: e.nombre })) ?? []}
                            value={formData.grupo_privilegios}
                            onChange={e => setFormData({ ...formData, grupo_privilegios: Number(e) })}
                        />
                    </div>


                    
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="button"
                    onClick={() => guardar()}
                    disabled={!puedeGuardar}
                    data-tooltip={
                        puedeGuardar
                            ? (formData.id ? 'Editar Usuario' : 'Agregar Usuario')
                            : 'No tienes los privilegios necesarios'
                    }
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    {formData.id ? (
                        <>
                            <RefreshCcw size={18} />
                            Actualizar
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            Agregar
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={limpiarForm}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-white text-mi-cuarta border border-mi-primera/20 hover:bg-mi-primera/10 transition-all duration-200 active:scale-[0.98]"
                >
                    <Trash2 size={18} />
                    Limpiar
                </button>
            </div>
        </div>
    );
}

export default FormUsuarios;