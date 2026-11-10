import { FolderTree, Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react";
import InputERP from "../../../components/utils/InputERP";
import { useEffect, useState } from "react";
import SelectCustom from "../../../components/utils/SelectCustom";
import Tarjeta from "../../../components/utils/Tarjeta";
import { showAlert } from "../../../components/utils/Procesando";
import { usePermisos } from "../../../context/PermisosContext";
import type {
    InterfaceCategoria,
    InterfaceSubcategoria,
    InterfaceSubcategoriaForm,
} from "../interfaces/InterfaceCategoria";

interface InterfaceFormSubcategorias {
    subcategoriaSelect: InterfaceSubcategoria | null;
    categorias: InterfaceCategoria[];
    guardarSubcategoria: (data: InterfaceSubcategoriaForm) => Promise<boolean>;
}

const FORM_INICIAL: InterfaceSubcategoriaForm = {
    id: undefined,
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true,
    categoria_id: 0,
    tipo_origen: undefined,
};

const FormSubcategorias = ({ subcategoriaSelect, categorias, guardarSubcategoria }: InterfaceFormSubcategorias) => {
    const [formData, setFormData] = useState<InterfaceSubcategoriaForm>(FORM_INICIAL);

    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_subcategoria");
    const puedeEditar = tienePermiso("editar_subcategoria");
    const puedeGuardar = formData.id ? puedeEditar : puedeAgregar;

    useEffect(() => {
        if (subcategoriaSelect) {
            setFormData({
                id: Number(subcategoriaSelect.id),
                codigo: String(subcategoriaSelect.codigo || ''),
                nombre: String(subcategoriaSelect.nombre || ''),
                descripcion: String(subcategoriaSelect.descripcion || ''),
                activo: Boolean(subcategoriaSelect.activo),
                categoria_id: Number(subcategoriaSelect.categoria_id),
                tipo_origen: subcategoriaSelect.categoria?.tipo,
            });
        } else {
            setFormData(FORM_INICIAL);
        }
    }, [subcategoriaSelect]);

    // Si se cambia el tipo y la categoría elegida no pertenece a él, se limpia la selección
    useEffect(() => {
        if (formData.id || !formData.categoria_id) return;
        if (!categorias.some(c => Number(c.id) === formData.categoria_id)) {
            setFormData(prev => ({ ...prev, categoria_id: 0 }));
        }
    }, [categorias, formData.categoria_id, formData.id]);

    const limpiarForm = () => {
        setFormData(FORM_INICIAL);
    };

    const guardar = async () => {
        if (!formData.categoria_id || isNaN(formData.categoria_id)) {
            showAlert('La categoría es requerida', 'warning');
            return;
        }
        if (!formData.nombre?.trim()) {
            showAlert('El nombre es requerido', 'warning');
            return;
        }

        const ok = await guardarSubcategoria({
            ...formData,
            codigo: formData.codigo?.trim() || null,
            descripcion: formData.descripcion?.trim() || null,
        });

        if (ok && !formData.id) limpiarForm();
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Subcategoría</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando subcategoría #${formData.id}` : "Nueva subcategoría"}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    disabled={!puedeGuardar}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    data-tooltip={!puedeGuardar ? 'No tienes los privilegios necesarios' : ''}
                    className={`flex justify-center w-30 cursor-pointer items-center gap-2 px-4 py-2 font-semibold rounded-xl ${formData.activo ? 'bg-green-100 text-green-600 border-green-600' : 'bg-red-100 text-red-600 border-red-600'} border`}
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

            <Tarjeta icon={<FolderTree size={18} />} title="Datos de la Subcategoría">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                        <SelectCustom
                            label="Categoría"
                            options={categorias.map(c => ({
                                value: Number(c.id),
                                label: `${c.nombre} (${c.tipo})`,
                            }))}
                            isClearable={false}
                            disabled={!puedeGuardar}
                            value={formData.categoria_id || null}
                            onChange={e => setFormData({ ...formData, categoria_id: Number(e) })}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <InputERP
                            label="Código"
                            type="text"
                            value={formData.codigo ?? ''}
                            disabled={!puedeGuardar}
                            onChange={e => setFormData({ ...formData, codigo: e })}
                        />
                    </div>
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
                            label="Descripción"
                            type="text"
                            value={formData.descripcion ?? ''}
                            disabled={!puedeGuardar}
                            onChange={e => setFormData({ ...formData, descripcion: e })}
                        />
                    </div>
                </div>
            </Tarjeta>

            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="button"
                    onClick={() => guardar()}
                    disabled={!puedeGuardar}
                    data-tooltip={
                        puedeGuardar
                            ? (formData.id ? 'Editar Subcategoría' : 'Agregar Subcategoría')
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
};

export default FormSubcategorias;
