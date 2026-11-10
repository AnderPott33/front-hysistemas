import { Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react"
import InputERP from "../../../components/utils/InputERP";
import { useEffect, useState } from "react";
import type { InterfaceMoneda, MonedaAPIP } from "../interfaces/InterfaceMoneda";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceEmpresa } from "../../empresa/interfaces/interfaceEmpresa";

interface InterfaceFormMonedas {
    datosEmpresa: InterfaceEmpresa | null;
    monedaSelect: InterfaceMoneda | null;
    guardarMoneda: (data: any) => Promise<void>;
    obtenerSimbolo: (codigo: string) => Promise<MonedaAPIP | null>;
}

const FormMonedas = ({ monedaSelect, obtenerSimbolo, datosEmpresa, guardarMoneda }: InterfaceFormMonedas) => {

    const formInicial = {
        id: '',
        nombre: '',
        codigo: '',
        simbolo: '',
        decimales: 0,
        activo: true
    }

    const monedaBase = datosEmpresa?.moneda_base;

    const [formData, setFormData] = useState<InterfaceMoneda>(formInicial);
    const { user, isAdmin } = useAuth();

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("puede_agregar_moneda");
    const puedeEditar = tienePermiso("puede_editar_moneda");

    const puedeGuardar = formData.id ? puedeEditar : puedeAgregar;

    useEffect(() => {
        if (monedaSelect) {
            setFormData({
                id: Number(monedaSelect?.id),
                nombre: String(monedaSelect?.nombre),
                codigo: String(monedaSelect?.codigo),
                simbolo: String(monedaSelect?.simbolo),
                decimales: Number(monedaSelect?.decimales),
                activo: Boolean(monedaSelect?.activo)
            });
        } else {
            setFormData({
                id: '',
                nombre: '',
                codigo: '',
                simbolo: '',
                decimales: 0,
                activo: true
            });
        }
    }, [monedaSelect])

    const limpiarForm = () => {
        setFormData(formInicial);
    }

    const guardar = () => {
        guardarMoneda(formData);
    }

    const cambiarSimb = async () => {
        const moneda = await obtenerSimbolo(formData.codigo);

        if (moneda) {
            setFormData({
                ...formData,
                simbolo: moneda.symbol
            });
        }
    };

    useEffect(() => {
        if (!formData.codigo) return;

        const timeout = setTimeout(async () => {
            try {
                const moneda = await obtenerSimbolo(formData.codigo);

                // Se não houver resultado, não faz nada
                if (!moneda?.symbol) return;

                setFormData(prev => ({
                    ...prev,
                    simbolo: moneda.symbol
                }));
            } catch (error) {
                console.error(error);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [formData.codigo]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Moneda</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando moneda #${formData.id}` : "Nuevo moneda"}
                        </span>

                    </div>
                </div>
                <button
                    type="button"
                    disabled={formData.id === user?.id}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    data-tooltip={`${formData.id === monedaBase ? 'La moneda base no se puede Inactivar' : ''}`}
                    className={`flex justify-center w-30 cursor-pointer items-center gap-2 px-4 py-2 font-semibold rounded-xl ${formData.activo ? 'bg-green-100  text-green-600 border-green-600' : 'bg-red-100 text-red-600 border-red-600'} border`}
                >
                    {formData.activo ? (
                        <>
                            <Power size={20} />
                            <span>Activa</span>
                        </>
                    ) : (
                        <>
                            <PowerOff size={20} />
                            <span>Inactiva</span>
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
                            disabled={!puedeGuardar || !isAdmin}
                            onChange={e => setFormData({ ...formData, nombre: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="text"
                            label="Código"
                            value={formData.codigo}
                            disabled={!puedeGuardar || !isAdmin}
                            onChange={e => { setFormData({ ...formData, codigo: e }) }}
                        />
                    </div>


                    <div className="flex flex-col gap-2">
                        <InputERP
                            label="Simbolo"
                            type="text"
                            disabled={!puedeGuardar || !isAdmin}
                            value={formData.simbolo}
                            onChange={e => setFormData({ ...formData, simbolo: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            label="Decimales"
                            type="number"
                            disabled={!puedeGuardar || !isAdmin}
                            value={formData.decimales}
                            onChange={e => setFormData({ ...formData, decimales: e })}
                        />
                    </div>



                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="button"
                    onClick={() => guardar()}
                    disabled={!puedeGuardar || !isAdmin}
                    data-tooltip={
                        puedeGuardar || !isAdmin
                            ? (formData.id ? 'Editar Moneda' : 'Agregar Moneda')
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

export default FormMonedas;