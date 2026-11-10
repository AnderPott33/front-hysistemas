import { IdCard, Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react";
import InputERP from "../../../components/utils/InputERP";
import { useEffect, useState } from "react";
import SelectCustom from "../../../components/utils/SelectCustom";
import Tarjeta from "../../../components/utils/Tarjeta";
import { showAlert } from "../../../components/utils/Procesando";
import { usePermisos } from "../../../context/PermisosContext";
import type { InterfaceCategoria, InterfaceCategoriaForm, tipoCategoria } from "../interfaces/InterfaceCategoria";

interface InterfaceFormCategorias {
    categoriaSelect: InterfaceCategoria | null;
    guardarCategoria: (data: InterfaceCategoriaForm) => Promise<boolean>;
    tipoInicial?: tipoCategoria;
}

const TIPOS_CATEGORIA: { value: tipoCategoria; label: string }[] = [
    { value: 'Ingreso', label: 'Ingreso' },
    { value: 'Gasto', label: 'Gasto' },
];

const FORM_INICIAL: InterfaceCategoriaForm = {
    id: undefined,
    codigo: '',
    nombre: '',
    tipo: 'Gasto',
    activo: true,
};

const FormCategorias = ({ categoriaSelect, guardarCategoria, tipoInicial = 'Gasto' }: InterfaceFormCategorias) => {
    const nuevoFormulario = (): InterfaceCategoriaForm => ({ ...FORM_INICIAL, tipo: tipoInicial });
    const [formData, setFormData] = useState<InterfaceCategoriaForm>(nuevoFormulario);

    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_categoria");
    const puedeEditar = tienePermiso("editar_categoria");
    const puedeGuardar = formData.id ? puedeEditar : puedeAgregar;

    useEffect(() => {
        if (categoriaSelect) {
            setFormData({
                id: Number(categoriaSelect.id),
                codigo: String(categoriaSelect.codigo || ''),
                nombre: String(categoriaSelect.nombre || ''),
                tipo: categoriaSelect.tipo ?? 'Gasto',
                activo: Boolean(categoriaSelect.activo),
            });
        } else {
            setFormData(nuevoFormulario());
        }
    }, [categoriaSelect]);

    // Si cambia el tipo seleccionado y no se está editando, el formulario nuevo lo toma
    useEffect(() => {
        if (!formData.id) setFormData(prev => ({ ...prev, tipo: tipoInicial }));
    }, [tipoInicial]);

    const limpiarForm = () => {
        setFormData(nuevoFormulario());
    };

    const guardar = async () => {
        if (!formData.nombre?.trim()) {
            showAlert('El nombre es requerido', 'warning');
            return;
        }
        if (!formData.tipo) {
            showAlert('El tipo es requerido', 'warning');
            return;
        }

        const ok = await guardarCategoria({
            ...formData,
            codigo: formData.codigo?.trim() || null,
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
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Categoría</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando categoría #${formData.id}` : "Nueva categoría"}
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

            <Tarjeta icon={<IdCard size={18} />} title="Datos de la Categoría">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        <SelectCustom
                            label="Tipo"
                            options={TIPOS_CATEGORIA}
                            isClearable={false}
                            disabled={!puedeGuardar}
                            value={formData.tipo}
                            onChange={e => setFormData({ ...formData, tipo: e as tipoCategoria })}
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
                            ? (formData.id ? 'Editar Categoría' : 'Agregar Categoría')
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

export default FormCategorias;
