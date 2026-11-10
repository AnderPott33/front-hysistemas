/* import { useEffect, useState, type ReactNode } from "react";
import { Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarDataHora } from "../../../components/utils/Formatadores";
import { usePermisos } from "../../../context/PermisosContext";
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";
import SelectCustom from "../../../components/utils/SelectCustom";
import { useAlmacen } from "../../almacen/hooks/useOperacion";
import { useTimbrado } from "../../timbrado/hooks/useTimbrado";
import { useCuentas } from "../../cuentas/hooks/useCuentas";
import type { tipoCuenta } from "../../cuentas/interfaces/InterfaceCuenta";

const TIPOS_CUENTA: { value: tipoCuenta; label: string }[] = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Banco', label: 'Banco' },
];

interface FormOperacionesProps {
    operacionSeleccionada: InterfaceOperacionBaja | null;
    guardarOperacion: (operacion: InterfaceOperacionBaja) => Promise<void>;
    activeBar?: (tab: string) => void;
    operaciones: InterfaceOperacionBaja[];
    cargarOperacionId: (id: number) => Promise<void>;
}

const FormInicial: InterfaceOperacionBaja = {
    id: 0,
    descripcion: '',
    modulo: 'Financiero',
    tipo_operacion: 'Débito',
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
    tipo_cuenta: '',
    activo: true
};

// Separador de sección con línea degradada morada
const Seccion = ({ titulo }: { titulo: string }) => (
    <div className="col-span-12 flex items-center gap-4 pt-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mi-tercera/40 to-transparent" />
        <span className="text-[11px] font-bold tracking-widest uppercase text-mi-tercera">{titulo}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mi-tercera/40 to-transparent" />
    </div>
);

// Contenedor de campo con etiqueta
const Campo = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-sm font-semibold text-mi-cuarta">{label}</label>
        {children}
    </div>
);

// Fila de checkbox con etiqueta a la izquierda
const CampoCheck = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
    <div className={`flex items-center justify-between gap-3 rounded-xl border border-mi-primera/15 bg-mi-primera/[0.03] px-3.5 py-2.5 ${className}`}>
        <label className="text-sm font-semibold text-mi-cuarta">{label}</label>
        {children}
    </div>
);

const FormOperaciones: React.FC<FormOperacionesProps> = ({
    operacionSeleccionada,
    guardarOperacion,
    operaciones,
    cargarOperacionId
}) => {

    const { cargarCuentasAnalitica, cuentasAnalitica } = useCuentas();
    const { timbrados, cargarTimbrados } = useTimbrado();
    const { almacenes, cargarAlmacenes } = useAlmacen();
    const [formData, setFormData] = useState<InterfaceOperacionBaja>(FormInicial);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        cargarCuentasAnalitica();
        cargarAlmacenes();
        cargarTimbrados();
    }, []);

    const limpiarFormulario = () => {
        setFormData(FormInicial);
    };

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

    const buscarYCargar = (term: string) => {
        const t = term.trim();

        if (!t) {
            limpiarFormulario();
            return;
        }

        const encontrado = operaciones.find(
            p => String(p.id) === t ||
                p.descripcion?.toLowerCase().includes(t.toLowerCase())
        );

        if (encontrado) {
            setFormData({
                ...encontrado
            });
            if (String(encontrado.id) !== String(formData.id)) {
                cargarOperacionId(Number(encontrado.id));
            }
        } else {
            limpiarFormulario();
        }
    };

    const cargarDesdeListado = (id: string | number) => {
        const encontrado = operaciones.find(p => String(p.id) === String(id));
        if (encontrado) {
            setFormData({
                ...encontrado
            });
            return true;
        }
        return false;
    };

    const handleSelectOption = (option: SearchOption) => {
        cargarDesdeListado(option.id);
        cargarOperacionId(Number(option.id));
    };

    const opciones: SearchOption[] = [...operaciones]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(e => ({ id: e.id, texto: e.descripcion || '' }));


    const cuentasGI = cuentasAnalitica.filter(e => e.tipo === 'Gasto' || e.tipo === 'Ingreso')

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAbrir = tienePermiso("agregar_caja");

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Operación</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando operación #${formData.id}` : "Nueva operación"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                   
                    <Campo label="" className="md:col-span-6">
                        <div className={`grid gap-2 ${formData.creado_en ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <InputERP
                                type="searchNumber"
                                value={formData.id}
                                label="Id"
                                onChange={(e) => setFormData({ ...formData, id: e })}
                                searchOptions={opciones}
                                onSelectOption={handleSelectOption}
                                displayMode="id-text"
                                searchMinChars={1}
                                showSearch={false}
                                onEnterPress={buscarYCargar}
                            
                                placeholder="Ingresa ID o descripción..."
                            />
                            {formData.creado_en && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-mi-primera/10 border border-mi-primera/20">
                                    <span className="text-xs font-semibold text-mi-cuarta/70">Creado en:</span>
                                    <span className="text-xs text-mi-cuarta">{formatarDataHora(formData.creado_en)}</span>
                                </div>
                            )}
                        </div>
                    </Campo>

                    <Campo label="" className="md:col-span-6">
                        <InputERP
                            type="text"
                            label="Descripción"
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e })}
                            placeholder="Descripción de la operación"
                        />
                    </Campo>

                    
                    <Seccion titulo="Informaciones Fundamentales" />

                    <Campo label="" className="md:col-span-3">
                        <SelectCustom
                            label="Módulo"
                            options={[
                                { value: 'Financiero', label: 'Financiero' },
                                { value: 'Compra', label: 'Compra' },
                                { value: 'Venta', label: 'Venta' },
                            ]}
                            value={formData.modulo}
                            isClearable={false}
                            searchable={false}
                            onChange={e => setFormData({ ...formData, modulo: e as 'Financiero' })}
                            placeholder="Módulo de la operación"
                        />
                    </Campo>

                    <Campo label="" className="md:col-span-3">
                        <SelectCustom
                            label="Naturaleza Contable"
                            options={[
                                { value: 'Débito', label: 'Débito' },
                                { value: 'Crédito', label: 'Crédito' },
                            ]}
                            value={formData.tipo_operacion}
                            isClearable={false}
                            searchable={false}
                            onChange={e => setFormData({ ...formData, tipo_operacion: e as 'Débito' })}
                            placeholder="Naturaleza Contable"
                        />
                    </Campo>

                    <Campo label="" className="md:col-span-3">
                        <SelectCustom
                            label="Naturaleza Financiera"
                            options={[
                                { value: 'Entrada', label: 'Entrada' },
                                { value: 'Salida', label: 'Salida' },
                            ]}
                            value={formData.naturaleza_financiera}
                            isClearable={false}
                            searchable={false}
                            onChange={e => setFormData({ ...formData, naturaleza_financiera: e as 'Salida' })}
                            placeholder="Naturaleza Financiera"
                        />
                    </Campo>

                    <div className="md:col-span-3 flex flex-col items-center justify-end">

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, activo: !formData.activo })}
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

                
                    <Seccion titulo="Información Legal" />

                    <div className="md:col-span-4 flex flex-col justify-end">
                        <CampoCheck label="Genera Documento Legal">
                            <InputERP
                                type="checkbox"
                                value={formData.genera_documento_legal}
                                onChange={e => setFormData({
                                    ...formData,
                                    genera_documento_legal: Boolean(e),
                                    exige_persona: Boolean(e)
                                })}
                            />
                        </CampoCheck>
                    </div>

                    <Campo label="" className="md:col-span-4">
                        <SelectCustom
                            label="Timbrado"
                            options={timbrados.map(e => ({
                                value: Number(e.timbrado),
                                label: `Timbrado: ${e.timbrado} Nº: ${String(e.sucursal).padStart(3, '0')}-${String(e.punto_expedicion).padStart(3, '0')}-${String(e.proximo_numero).padStart(7, '0')}`
                            }))}
                            value={Number(formData.timbrado)}
                            isClearable={!formData.genera_documento_legal}
                            searchable={false}
                            onChange={e => setFormData({ ...formData, timbrado: Number(e) })}
                            placeholder="Timbrado"
                        />
                    </Campo>

                    <div className="md:col-span-4 flex flex-col justify-end">
                        <CampoCheck label="Exige Persona">
                            <InputERP
                                type="checkbox"
                                value={formData.exige_persona}
                                disabled={formData.genera_documento_legal}
                                onChange={e => setFormData({ ...formData, exige_persona: e })}
                            />
                        </CampoCheck>
                    </div>

                   
                    <Seccion titulo="Stock y Almacén" />

                    <div className="md:col-span-3 flex flex-col justify-end">
                        <CampoCheck label="Genera Movimiento Stock">
                            <InputERP
                                type="checkbox"
                                value={formData.genera_movimiento_stock}
                                onChange={e => setFormData({
                                    ...formData,
                                    genera_movimiento_stock: e,
                                    tipo_movimiento_stock: 'Entrada',
                                    exige_almacen: true
                                })}
                            />
                        </CampoCheck>
                    </div>

                    <Campo label="" className="md:col-span-3">
                        <SelectCustom
                            label="Tipo Movimiento Stock"
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
                    </Campo>

                    <div className="md:col-span-3 flex flex-col justify-end">
                        <CampoCheck label="Exige Almacén">
                            <InputERP
                                type="checkbox"
                                value={formData.exige_almacen}
                                onChange={e => setFormData({
                                    ...formData,
                                    exige_almacen: e,
                                    tipo_movimiento_stock: 'Entrada'
                                })}
                            />
                        </CampoCheck>
                    </div>

                    <Campo label="" className="md:col-span-3">
                        <SelectCustom
                            label="Almacén"
                            options={almacenes.map(e => ({ value: Number(e.id), label: e.nombre }))}
                            value={Number(formData.almacen_id)}
                            searchable={false}
                            isClearable={!formData.genera_movimiento_stock}
                            onChange={e => setFormData({ ...formData, almacen_id: Number(e) })}
                            placeholder="Almacén"
                        />
                    </Campo>

                  
                    <Seccion titulo="Financiero Categoría / Cuenta" />

                    <div className="md:col-span-4 flex flex-col justify-end">
                        <CampoCheck label="Genera Movimiento Financiero Gasto/Ingreso">
                            <InputERP
                                type="checkbox"
                                value={formData.genera_movimiento_financiero_categoria}
                                onChange={e => setFormData({
                                    ...formData,
                                    genera_movimiento_financiero_categoria: Boolean(e)
                                })}
                            />
                        </CampoCheck>
                    </div>

                    <div className="md:col-span-4 flex flex-col justify-end">
                        <CampoCheck label="Genera Movimiento Financiero Cuenta">
                            <InputERP
                                type="checkbox"
                                value={formData.genera_movimiento_financiero_cuenta}
                                onChange={e => setFormData({
                                    ...formData,
                                    genera_movimiento_financiero_cuenta: Boolean(e)
                                })}
                            />
                        </CampoCheck>
                    </div>
                    <div className="md:col-span-4 flex flex-col justify-end">
                        <Campo label="">
                            <SelectCustom
                                label="Tipo Cuenta"
                                options={TIPOS_CUENTA}
                                isClearable={false}
                                value={formData.tipo_cuenta}
                                onChange={e => setFormData({
                                    ...formData,
                                    tipo_cuenta: String(e)
                                })}
                            />
                        </Campo>
                    </div>

                    <Campo label="" className="md:col-span-4">
                        <SelectCustom
                            label="Categoría Gasto/Ingreso"
                            options={cuentasAnalitica.map(e => ({ value: Number(e.id), label: e.nombre }))}
                            value={Number(formData.categoria_id)}
                            searchable={false}
                            isClearable={!formData.genera_movimiento_stock}
                            onChange={e => setFormData({ ...formData, categoria_id: Number(e) })}
                            placeholder="Categoría Gasto/Ingreso"
                        />
                    </Campo>
                </div>
            </div>

            
            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="submit"
                    disabled={!puedeAbrir || isLoading}
                    data-tooltip={!puedeAbrir ? 'No tienes privilegios necesarios' : formData.id ? 'Editar Operación' : 'Agregar Operación'}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-2xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
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
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-2xl bg-white text-mi-cuarta border border-mi-primera/20 hover:bg-mi-primera/10 transition-all duration-200 active:scale-[0.98]"
                >
                    <Trash2 size={18} />
                    Limpiar
                </button>
            </div>
        </form>
    );
};

export default FormOperaciones; */