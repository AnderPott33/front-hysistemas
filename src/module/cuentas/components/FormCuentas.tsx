import { DollarSign, IdCard, Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react";
import InputERP from "../../../components/utils/InputERP";
import { useEffect, useState, type ReactNode } from "react";
import SelectCustom from "../../../components/utils/SelectCustom";
import type { InterfaceCuenta, InterfaceCuentaForm, tipoCuenta } from "../interfaces/InterfaceCuenta";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import { Flag } from "../../../context/FlagsContext";
import Tarjeta from "../../../components/utils/Tarjeta";
import { showAlert } from "../../../components/utils/Procesando";

interface InterfaceFormCuentas {
    cuentaSelect: InterfaceCuenta | null;
    guardarCuenta: (data: InterfaceCuentaForm) => Promise<unknown>;
    monedas: InterfaceMoneda[];
}

const TIPOS_CUENTA: { value: tipoCuenta; label: string }[] = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Banco', label: 'Banco' },
];

const FORM_INICIAL: InterfaceCuentaForm = {
    id: undefined,
    nombre: '',
    tipo: 'Banco',
    permite_lanzamiento_tarjeta: false,
    banco_nombre: '',
    numero_cuenta: '',
    saldo_inicial: 0,
    moneda_id: 1,
    activo: true,
};

const FormCuentas = ({ cuentaSelect, guardarCuenta, monedas }: InterfaceFormCuentas) => {
    const [formData, setFormData] = useState<InterfaceCuentaForm>(FORM_INICIAL);
    const { isAdmin } = useAuth();

    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_cuenta");
    const puedeEditar = tienePermiso("editar_cuenta");

    const puedeGuardar = formData.id ? puedeEditar : puedeAgregar;

    useEffect(() => {
        if (cuentaSelect) {
            setFormData({
                id: Number(cuentaSelect.id),
                nombre: String(cuentaSelect.nombre || ''),
                permite_lanzamiento_tarjeta: cuentaSelect.permite_lanzamiento_tarjeta,
                tipo: cuentaSelect.tipo ?? 'Banco',
                banco_nombre: String(cuentaSelect.banco_nombre || ''),
                numero_cuenta: String(cuentaSelect.numero_cuenta || ''),
                saldo_inicial: Number(cuentaSelect.saldo_inicial ?? 0),
                moneda_id: Number(cuentaSelect.moneda_id || cuentaSelect.moneda?.id || 1),
                activo: Boolean(cuentaSelect.activo),
            });
        } else {
            setFormData(FORM_INICIAL);
        }
    }, [cuentaSelect]);

    const limpiarForm = () => {
        setFormData(FORM_INICIAL);
    };

    const guardar = async () => {
        if (!formData.nombre?.trim()) {
            showAlert('El nombre es requerido', 'warning');
            return;
        }
        if (!formData.tipo) {
            showAlert('El tipo de cuenta es requerido', 'warning');
            return;
        }
        if (!formData.moneda_id || isNaN(formData.moneda_id)) {
            showAlert('La moneda es requerida y debe ser válida', 'warning');
            return;
        }
        if (isNaN(formData.saldo_inicial)) {
            showAlert('El saldo inicial debe ser un número', 'warning');
            return;
        }

        const esBanco = formData.tipo === 'Banco';

        await guardarCuenta({
            ...formData,
            banco_nombre: esBanco ? formData.banco_nombre?.trim() || null : null,
            numero_cuenta: esBanco ? formData.numero_cuenta?.trim() || null : null,
        });

        if (!formData.id) limpiarForm();
    };
    const CampoCheck = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
        <div className={`flex items-center justify-between gap-3 rounded-xl border border-mi-primera/15 bg-mi-primera/[0.03] px-3.5 py-2.5 ${className}`}>
            <label className="text-sm font-semibold text-mi-primera">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Cuenta</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando cuenta #${formData.id}` : "Nueva cuenta"}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Tarjeta icon={<IdCard size={18} />} title="Datos de la Cuenta">
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
                            <SelectCustom
                                label="Tipo"
                                options={TIPOS_CUENTA}
                                isClearable={false}
                                disabled={!isAdmin}
                                value={formData.tipo}
                                onChange={e => setFormData({
                                    ...formData,
                                    tipo: e as tipoCuenta
                                })}
                            />
                        </div>
                    </div>

                    {formData.tipo === 'Banco' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <InputERP
                                    label="Banco"
                                    type="text"
                                    value={formData.banco_nombre ?? ''}
                                    disabled={!puedeGuardar}
                                    onChange={e => setFormData({ ...formData, banco_nombre: e })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <InputERP
                                    label="Número Cuenta"
                                    type="text"
                                    value={formData.numero_cuenta ?? ''}
                                    disabled={!puedeGuardar}
                                    onChange={e => setFormData({ ...formData, numero_cuenta: e })}
                                />
                            </div>
                            <div className="flex-1 flex-col gap-2">
                                <CampoCheck label="Permite Lanzamiento en Tarjeta">
                                    <InputERP
                                        type="checkbox"
                                        value={formData.permite_lanzamiento_tarjeta}
                                        disabled={!puedeGuardar}
                                        onChange={e => setFormData({
                                            ...formData,
                                            permite_lanzamiento_tarjeta: Boolean(e)
                                        })}
                                    />
                                </CampoCheck>
                            </div>
                        </div>
                    )}
                </Tarjeta>

                <Tarjeta icon={<DollarSign size={18} />} title="Valores">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <SelectCustom
                                label="Moneda"
                                options={monedas.map(e => ({
                                    value: Number(e.id),
                                    label: (
                                        <div className="flex items-center gap-2">
                                            <Flag
                                                className="rounded-sm border border-mi-tercera"
                                                country={e.codigo as 'PYG'}
                                                size={20}
                                            />
                                            <span>{e.nombre}</span>
                                        </div>
                                    )
                                }))}
                                isClearable={false}
                                disabled={!puedeGuardar}
                                value={formData.moneda_id}
                                onChange={e => setFormData({
                                    ...formData,
                                    moneda_id: Number(e)
                                })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <InputERP
                                label="Saldo Inicial"
                                type="number"
                                value={String(formData.saldo_inicial ?? '')}
                                disabled={!puedeGuardar || true}
                                data-tooltip={'Esta función aún no esta disponible!'}
                                onChange={e => setFormData({ ...formData, saldo_inicial: Number(e) })}
                            />
                        </div>
                    </div>
                </Tarjeta>
            </div>

            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="button"
                    onClick={() => guardar()}
                    disabled={!puedeGuardar}
                    data-tooltip={
                        puedeGuardar
                            ? (formData.id ? 'Editar Cuenta' : 'Agregar Cuenta')
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

export default FormCuentas;
