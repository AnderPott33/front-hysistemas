import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Trash2, CircleX } from "lucide-react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";

import { showAlert } from "../../../components/utils/Procesando";
import { formatarDataHora, formatarDataInput } from "../../../components/utils/Formatadores";
import { usePermisos } from "../../../context/PermisosContext";
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";
import SelectCustom from "../../../components/utils/SelectCustom";
import { useCategoriaGastoIngreso } from "../../categoriaGastoIngreso/hooks/useCategoriaGastoIngreso";
import { useAlmacen } from "../../almacen/hooks/useOperacion";

interface FormOperacionesProps {
    operacionSeleccionada: InterfaceOperacionBaja | null;
    guardarOperacion: (operacion: InterfaceOperacionBaja) => Promise<void>;
    activeBar?: (tab: string) => void;
}

const FormInicial: InterfaceOperacionBaja = {
    id: 0,
    descripcion: '',
    modulo: 'Ingreso',
    tipo_operacion: 'Ingreso',
    naturaleza_financiera: 'Entrada',
    genera_documento_legal: false,
    timbrado: 0,
    exige_persona: false,
    exige_categoria: false,
    exige_articulos: false,
    exige_almacen: false,
    genera_movimiento_stock: false,
    tipo_movimiento_stock: '',
    genera_movimiento_financiero_categoria: false,
    genera_movimiento_financiero_cuenta: false,
    activo: true
};

const FormOperaciones: React.FC<FormOperacionesProps> = ({
    operacionSeleccionada,
    guardarOperacion,
    activeBar
}) => {

    const { categoriasGastoIngreso, cargarCategoriasGastoIngreso } = useCategoriaGastoIngreso();
    const { almacenes, cargarAlmacenes } = useAlmacen();
    const [formData, setFormData] = useState<InterfaceOperacionBaja>(FormInicial);
    const [isLoading, setIsLoading] = useState(false); // ✅ Agregar estado de carga

    useEffect(() => {
        cargarCategoriasGastoIngreso();
        cargarAlmacenes();
    }, []);

    const limpiarFormulario = () => {
        setFormData(FormInicial);
    };

    // ✅ useEffect corregido con indentación adecuada
    useEffect(() => {
        if (operacionSeleccionada && operacionSeleccionada?.id) {
            setFormData(operacionSeleccionada);
        } else {
            limpiarFormulario();
        }
    }, [operacionSeleccionada]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);
            await guardarOperacion(formData);
            limpiarFormulario();
            showAlert("Operación guardada exitosamente", "success");
        } catch (error) {
            console.error(error);
            showAlert("Error al guardar la operacion", "error");
        } finally {
            setIsLoading(false);
        }

    };

    // Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeCambiarFecha = tienePermiso("cambiar_fecha_caja");
    const puedeCerrar = tienePermiso("cerrar_caja");
    const puedeAbrir = tienePermiso("agregar_caja");

    // ✅ Si no hay operación seleccionada, mostrar Loading
    /* if (!operacionSeleccionada && formData.id === 0) {
        return <Loading />;
    } */

    return (
        <>
            <form onSubmit={handleSubmit} className="w-full">
                <div className="flex justify-between items-center bg-gray-50 rounded-t-xl p-4 shadow-lg">
                    <div className="flex justify-center items-center gap-3">
                        <div className="bg-[#188180]/10 text-[#359bac] rounded-xl p-3">
                            <Plus size={18} />
                        </div>
                        <span className="font-bold text-lg">Registro De Operación</span>
                    </div>
                </div>
                <div className="rounded-b-xl bg-white p-8 shadow-lg">

                    <div className="grid grid-cols-12 gap-3">
                        {/* ID */}
                        <div className="grid col-span-6 gap-2">
                            <label className="text-sm font-medium text-slate-700">ID</label>
                            <div className={`grid gap-2 ${formData.creado_en ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <InputERP
                                    type="searchNumber"
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e })}
                                    readOnly={true}
                                />
                                {formData.creado_en && (
                                    <div className="flex items-center shadow-sm border border-slate-300 gap-3 p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium text-slate-700">Creado En:</span>
                                        <span className="text-sm text-slate-600">{formatarDataHora(formData.creado_en)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid col-span-6 gap-2">
                            <label className="text-sm font-medium text-slate-700">Descripción</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <InputERP
                                    type="text"
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e })}
                                    placeholder="Descripción de la operación"
                                />
                            </div>
                        </div>
                        <div className="col-span-12 grid grid-cols-12 justify-center items-center">
                            <hr className="col-span-5 font-bold text-[#35b9ac]"></hr>
                            <span className="col-span-2 font-bold text-[#35b9ac] text-center">Informaciones Fundamentales</span>
                            <hr className="col-span-5 font-bold text-[#35b9ac] "></hr>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <label className="text-sm font-medium text-slate-700">Modulo</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={[
                                        { value: 'Ingreso', label: 'Ingreso' },
                                        { value: 'Gasto', label: 'Gasto' },
                                        { value: 'Compra', label: 'Compra' },
                                        { value: 'Venta', label: 'Venta' },
                                    ]}
                                    value={formData.modulo}
                                    isClearable={false}
                                    searchable={false}
                                    onChange={e => setFormData({ ...formData, modulo: e as 'Ingreso' })}
                                    placeholder="Modulo de la operación"
                                />
                            </div>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <label className="text-sm font-medium text-slate-700">Naturaleza Contable</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={[
                                        { value: 'Ingreso', label: 'Ingreso' },
                                        { value: 'Egreso', label: 'Egreso' },
                                    ]}
                                    value={formData.tipo_operacion}
                                    isClearable={false}
                                    searchable={false}
                                    onChange={e => setFormData({ ...formData, tipo_operacion: e as 'Ingreso' })}
                                    placeholder="Naturaleza Contable"
                                />
                            </div>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <label className="text-sm font-medium text-slate-700">Naturaleza Financiera</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={[
                                        { value: 'Entrada', label: 'Entrada' },
                                        { value: 'Salida', label: 'Salida' },
                                    ]}
                                    value={formData.naturaleza_financiera}
                                    isClearable={false}
                                    searchable={false}
                                    onChange={e => setFormData({ ...formData, naturaleza_financiera: e as 'Entrada' })}
                                    placeholder="Naturaleza Financiera"
                                />
                            </div>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">
                                    Activo
                                </label>
                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.activo}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            activo: Boolean(e)
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 grid grid-cols-12 justify-center items-center">
                            <hr className="col-span-5 font-bold text-[#35b9ac]"></hr>
                            <span className="col-span-2 font-bold text-[#35b9ac] text-center">Información Legal</span>
                            <hr className="col-span-5 font-bold text-[#35b9ac] "></hr>
                        </div>
                        <div className="grid col-span-4 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">
                                    Genera Documento Legal
                                </label>
                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.genera_documento_legal}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            genera_documento_legal: Boolean(e),
                                            exige_persona: Boolean(e)
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid col-span-4 gap-2">
                            <label className="text-sm font-medium text-slate-700">Timbrado</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={[
                                        { value: 123456, label: 'Timbrado 001-001-0000236' },
                                        { value: 2568952, label: 'Timbrado 001-001-0000001' },
                                    ]}
                                    value={formData.timbrado}
                                    isClearable={!formData.genera_documento_legal}
                                    searchable={false}
                                    onChange={e => setFormData({
                                        ...formData, timbrado: Number(e)
                                    })}
                                    placeholder="Timbrado"
                                />
                            </div>
                        </div>
                        <div className="grid col-span-4 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">
                                    Exige Persona
                                </label>
                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.exige_persona}
                                        disabled={formData.genera_documento_legal}
                                        onChange={e => setFormData({
                                            ...formData, exige_persona: e
                                        })}

                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 grid grid-cols-12 justify-center items-center">
                            <hr className="col-span-5 font-bold text-[#35b9ac]"></hr>
                            <span className="col-span-2 font-bold text-[#35b9ac] text-center">Stock y Almacén</span>
                            <hr className="col-span-5 font-bold text-[#35b9ac] "></hr>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">Genera Movimiento Stock</label>

                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.genera_movimiento_stock}
                                        onChange={e => setFormData({
                                            ...formData, genera_movimiento_stock: e,
                                            tipo_movimiento_stock: 'Entrada',
                                            exige_almacen: true
                                        })}

                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <label className="text-sm font-medium text-slate-700">Tipo Movimiento Stock</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={[
                                        { value: 'Entrada', label: 'Entrada' },
                                        { value: 'Salida', label: 'Salida' },
                                    ]}
                                    value={formData.tipo_movimiento_stock}
                                    searchable={false}
                                    isClearable={!formData.genera_movimiento_stock}
                                    onChange={e => setFormData({ ...formData, tipo_movimiento_stock: e as 'Entrada' })}
                                    placeholder="Tipo Movimiento Stock"
                                />
                            </div>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">Exige Almacén</label>

                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.exige_almacen}
                                        onChange={e => setFormData({
                                            ...formData, exige_almacen: e,
                                            tipo_movimiento_stock: 'Entrada'
                                        })}

                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid col-span-3 gap-2">
                            <label className="text-sm font-medium text-slate-700">Almacén</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={almacenes.map(e => (
                                        { value: Number(e.id), label: e.nombre }
                                    ))}
                                    value={Number(formData.almacen_id)}
                                    searchable={false}
                                    isClearable={!formData.genera_movimiento_stock}
                                    onChange={e => setFormData({ ...formData, almacen_id: Number(e) })}
                                    placeholder="Almacén"
                                />
                            </div>
                        </div>
                        <div className="col-span-12 grid grid-cols-12 justify-center items-center">
                            <hr className="col-span-5 font-bold text-[#35b9ac]"></hr>
                            <span className="col-span-2 font-bold text-[#35b9ac] text-center">Financiero Categoria/Cuenta</span>
                            <hr className="col-span-5 font-bold text-[#35b9ac] "></hr>
                        </div>
                        <div className="grid col-span-4 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">
                                    Genera Movimiento Financiero Gasto/Ingreso
                                </label>
                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.genera_movimiento_financiero_categoria}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            genera_movimiento_financiero_categoria: Boolean(e)
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid col-span-4 gap-2">
                            <div className="flex gap-2 justify-center items-center">
                                <label className="text-sm font-medium text-slate-700">
                                    Genera Movimiento Financiero Cuenta
                                </label>
                                <div>
                                    <InputERP
                                        type="checkbox"
                                        value={formData.genera_movimiento_financiero_cuenta}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            genera_movimiento_financiero_cuenta: Boolean(e)
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid col-span-4 gap-2">
                            <label className="text-sm font-medium text-slate-700">Categoria Gasto/Ingreso</label>
                            <div className={`grid gap-2 grid-cols-1`}>
                                <SelectCustom
                                    options={categoriasGastoIngreso.map(e => (
                                        { value: Number(e.id), label: e.nombre }
                                    ))}
                                    value={Number(formData.categoria_id)}
                                    searchable={false}
                                    isClearable={!formData.genera_movimiento_stock}
                                    onChange={e => setFormData({ ...formData, categoria_id: Number(e) })}
                                    placeholder="Categoria Gasto/Ingreso"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACCIONES */}
                <div className="flex gap-2 justify-end items-center flex-wrap pt-4">
                    <button
                        type="submit"
                        disabled={!puedeAbrir || isLoading}
                        data-tooltip={`${!puedeAbrir ? 'No tienes privilegios necesarios' : formData.id ? 'Editar Operación' : 'Agregar Operación'}`}
                        className="flex justify-center items-center gap-2 px-4 py-2.5 font-semibold rounded-xl bg-[#188180] text-white disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>Guardando...</>
                        ) : formData.id ? (
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
                        onClick={limpiarFormulario}
                        className="flex justify-center items-center gap-2 px-4 py-2.5 font-semibold rounded-xl bg-slate-400 text-white"
                    >
                        <Trash2 size={18} />
                        Limpiar
                    </button>
                </div>
            </form>
        </>
    );
};

export default FormOperaciones;