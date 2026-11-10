import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import InputERP from "../../../components/utils/InputERP";
import { useEffect, useState } from "react";
import type { InterfaceGrupoPrivilegios, PrivilegiosDisponibles } from "../interfaces/grupoPrivilegiosInterfaces";

interface InterfaceFormGrupoPrivilegios {
    grupoSelect: InterfaceGrupoPrivilegios | null;
    guardarGrupo: (data: any) => Promise<void>;
}

const PRIVILEGIOS_DISPONIBLES: PrivilegiosDisponibles = {
    dashboard: {
        label: 'Dashboard',
        acciones: [
            { clave: 'ver_dashboard', label: 'Dashboard' }
        ]
    },
    personas: {
        label: 'Personas',
        acciones: [
            { clave: 'pagina_personas', label: 'Página de Personas' },
            { clave: 'crear_persona', label: 'Crear Personas' },
            { clave: 'editar_persona', label: 'Editar Personas' },
            { clave: 'inactivar_persona', label: 'Inactivar Personas' },
        ]
    },

    /* clientes: {
        label: 'Clientes',
        acciones: [
            { clave: 'ver_clientes', label: 'Clientes' },
            { clave: 'ver_marcas', label: 'Marcas' }
        ]
    }, */

    /* cuentas: {
        label: 'Cuentas',
        acciones: [
            { clave: 'ver_cuentas', label: 'Cuentas' },
            { clave: 'ver_resumen_cuentas', label: 'Resumen de Cuentas' },
            { clave: 'cancelar_nota', label: 'Permitir Cancelar Nota' }
        ]
    }, */

    /* finanzas: {
        label: 'Finanzas',
        acciones: [
            { clave: 'ver_extracciones', label: 'Extracto de Cuentas' },
            { clave: 'ver_transferencias', label: 'Transferencias' },
            { clave: 'ver_indicaciones', label: 'Indicaciones' },
            { clave: 'ver_gastos', label: 'Gastos' }
        ]
    }, */
    cajas: {
        label: 'Cajas',
        acciones: [
            { clave: 'pagina_cajas', label: 'Página de Cajas' },
            { clave: 'loguear_caja', label: 'Loguear Caja' },
            { clave: 'agregar_caja', label: 'Abrir Caja' },
            { clave: 'cerrar_caja', label: 'Cerrar/Reabrir Caja' },
            { clave: 'cambiar_fecha_caja', label: 'Cambiar Fecha Caja' },
            { clave: 'editar_caja', label: 'Editar Caja' },
        ]
    },
    ventas: {
        label: 'Ventas',
        acciones: [
            { clave: 'pagina_ventas', label: 'Página de Ventas' },
        ]
    },
    monedasYCotizaciones: {
        label: 'Monedas y Cotizaciones',
        acciones: [
            { clave: 'pagina_monedas', label: 'Página de Monedas y Cotizaciones' },
            { clave: 'puede_agregar_moneda', label: 'Puede agregar moneda' },
            { clave: 'puede_editar_moneda', label: 'Puede editar moneda' },
            { clave: 'puede_agregar_cotizacion', label: 'Puede agregar cotización' },
            { clave: 'puede_editar_cotizacion', label: 'Puede editar cotización' },
        ]
    },
    cuentas: {
        label: 'Cuentas',
        acciones: [
            { clave: 'pagina_cuentas', label: 'Página de Cuentas' },
            { clave: 'agregar_cuenta', label: 'Puede agregar cuenta' },
            { clave: 'editar_cuenta', label: 'Puede editar cuenta' },
        ]
    },
    usuarios: {
        label: 'Usuarios',
        acciones: [
            { clave: 'pagina_usuarios', label: 'Página de Usuarios' },
            { clave: 'agregar_usuario', label: 'Agregar Usuario' },
            { clave: 'editar_usuario', label: 'Editar Usuario' },
            { clave: 'cambiar_contrasena', label: 'Editar Contraseña Usuario' },
            { clave: 'inactivar_usuario', label: 'Inactivar Usuario' },
        ]
    },
    operaciones: {
        label: 'Operaciones',
        acciones: [
            { clave: 'pagina_operaciones', label: 'Página de Operaciones' },
            { clave: 'agregar_operacion', label: 'Agregar Operación' },
            { clave: 'editar_operacion', label: 'Editar Operación' },
        ]
    },
    privilegios: {
        label: 'Privilegios',
        acciones: [
            { clave: 'pagina_privilegios', label: 'Página de Privilegios' },
        ]
    },
    recibir_valores: {
        label: 'Recibir Valores',
        acciones: [
            { clave: 'pagina_recibimiento', label: 'Página de Recibir Valores' },
        ]
    },
    pagar_valores: {
        label: 'Pagar Valores',
        acciones: [
            { clave: 'pagina_pago', label: 'Página de Pagar Valores' },
        ]
    },
    empresa: {
        label: 'Empresa',
        acciones: [
            { clave: 'pagina_empresa', label: 'Página Empresa' },
         ]
    },
    perfil: {
        label: 'Perfil',
        acciones: [
            { clave: 'pagina_perfil', label: 'Página Perfil' },
            { clave: 'perfil_altera_color_del_sistema', label: 'Puede seleccionar color para la interface del sistema' },
            { clave: 'perfil_altera_tema_del_sistema', label: 'Puede seleccionar tema para la interface del sistema' },
        ]
    },
};

const FormGrupoPrivilegios = ({ grupoSelect, guardarGrupo }: InterfaceFormGrupoPrivilegios) => {
    const formInicial: InterfaceGrupoPrivilegios = {
        id: '',
        nombre: '',
        privilegios: Object.entries(PRIVILEGIOS_DISPONIBLES).map(([modulo, data]) => ({
            modulo,
            acciones: data.acciones.map(accion => ({
                ...accion,
                nombre: accion.clave,
                marcada: false
            }))
        }))
    };

    const [formData, setFormData] = useState<InterfaceGrupoPrivilegios>(formInicial);

    // Construye la lista completa de privilegios, marcando las que el grupo ya tiene guardadas.
    const construirPrivilegiosCompletos = (grupo: InterfaceGrupoPrivilegios | null) => {
        return Object.entries(PRIVILEGIOS_DISPONIBLES).map(([modulo, data]) => {
            const moduloGuardado = grupo?.privilegios?.find(p => p.modulo === modulo);

            return {
                modulo,
                acciones: data.acciones.map(accion => {
                    const accionGuardada = moduloGuardado?.acciones.find(
                        a => a.clave === accion.clave
                    );

                    return {
                        ...accion,
                        nombre: accion.clave,
                        marcada: accionGuardada?.marcada ?? false
                    };
                })
            };
        });
    };

    useEffect(() => {
        if (grupoSelect) {
            setFormData({
                id: Number(grupoSelect?.id),
                nombre: String(grupoSelect?.nombre),
                privilegios: construirPrivilegiosCompletos(grupoSelect)
            });
        } else {
            setFormData(formInicial);
        }
    }, [grupoSelect]);

    const limpiarForm = () => {
        setFormData(formInicial);
    };

    const guardar = () => {
        if (!formData.nombre.trim()) {
            alert('El nombre del grupo de privilegios es requerido');
            return;
        }
        guardarGrupo(formData);
    };

    const togglePrivilegio = (modulo: string, clave: string) => {
        setFormData(prev => ({
            ...prev,
            privilegios: prev.privilegios.map(priv => {
                if (priv.modulo === modulo) {
                    return {
                        ...priv,
                        acciones: priv.acciones.map(accion =>
                            accion.clave === clave
                                ? { ...accion, marcada: !accion.marcada }
                                : accion
                        )
                    };
                }
                return priv;
            })
        }));
    };

    const setMarcadasModulo = (modulo: string, marcada: boolean) => {
        setFormData(prev => ({
            ...prev,
            privilegios: prev.privilegios.map(priv =>
                priv.modulo === modulo
                    ? { ...priv, acciones: priv.acciones.map(a => ({ ...a, marcada })) }
                    : priv
            )
        }));
    };

    const seleccionarTodos = () => {
        setFormData(prev => ({
            ...prev,
            privilegios: prev.privilegios.map(priv => ({
                ...priv,
                acciones: priv.acciones.map(a => ({ ...a, marcada: true }))
            }))
        }));
    };
    const revogarTodos = () => {
        setFormData(prev => ({
            ...prev,
            privilegios: prev.privilegios.map(priv => ({
                ...priv,
                acciones: priv.acciones.map(a => ({ ...a, marcada: false }))
            }))
        }));
    };

    const verificarTodosSeleccionados = (modulo: string) => {
        const priv = formData.privilegios.find(p => p.modulo === modulo);
        return priv?.acciones.every(a => a.marcada) ?? false;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Editar Grupo de Privilegios</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Grupo #${formData.id}` : "Nuevo grupo"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-2">
                    <label className="text-sm font-semibold text-mi-cuarta">
                        Nombre del Grupo de Privilegios <span className="text-red-500">*</span>
                    </label>
                    <InputERP
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e })}
                    />
                </div>

                <div>
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <h3 className="font-bold text-base text-mi-cuarta">Privilegios</h3>
                        <div className="grid gap-2 grid-cols-2">
                            <button
                                type="button"
                                onClick={seleccionarTodos}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-mi-tercera border border-mi-primera/25 hover:bg-mi-primera/10 transition-all duration-200 active:scale-[0.98]"
                            >
                                Autorizar Todos
                            </button>
                            <button
                                type="button"
                                onClick={revogarTodos}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-red-600 border border-red-600/25 hover:bg-red-600/10 transition-all duration-200 active:scale-[0.98]"
                            >
                                Revogar Todos
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {formData.privilegios.map((priv) => (
                            <div key={priv.modulo} className="rounded-2xl border border-mi-primera/15 bg-mi-primera/[0.03] p-4">
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-mi-primera/15">
                                    <h4 className="font-semibold text-sm text-mi-tercera">
                                        {PRIVILEGIOS_DISPONIBLES[priv.modulo]?.label || priv.modulo}
                                    </h4>
                                    <input
                                        type="checkbox"
                                        checked={verificarTodosSeleccionados(priv.modulo)}
                                        onChange={e => setMarcadasModulo(priv.modulo, e.target.checked)}
                                        className="w-4 h-4 cursor-pointer accent-mi-tercera"
                                    />
                                </div>

                                <div className="space-y-1">
                                    {priv.acciones.map((accion) => (
                                        <label
                                            key={accion.clave}
                                            className="flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded-xl hover:bg-mi-primera/10 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={accion.marcada}
                                                onChange={() => togglePrivilegio(priv.modulo, accion.clave)}
                                                className="w-4 h-4 cursor-pointer accent-mi-tercera"
                                            />
                                            <span className="text-sm text-mi-cuarta/80">{accion.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="button"
                    onClick={guardar}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 active:scale-[0.98]"
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
};

export default FormGrupoPrivilegios;