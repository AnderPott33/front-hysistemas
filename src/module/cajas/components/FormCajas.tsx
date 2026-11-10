import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Trash2, CircleX, Lock, LockOpen } from "lucide-react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import { type InterfaceCajas } from "../Interfaces/InterfaceCajas";
import { useAuth } from "../../../context/AuthContext";
import { showAlert } from "../../../components/utils/Procesando";
import { formatarDataHora, formatarDataInput } from "../../../components/utils/Formatadores";
import { useCaja } from "../../../context/CajaContext";
import { usePermisos } from "../../../context/PermisosContext";
import Loading from "../../../components/utils/Loading";

interface FormCajasProps {
    datos: InterfaceCajas[];
    cajaSeleccionada: InterfaceCajas | null;
    obtenerCaja: (id: number) => Promise<void>;
    guardarCaja: (data: InterfaceCajas) => Promise<void>;
    cerrarReabrir: (id: number, estado: string) => Promise<void>;
    recargar: boolean;
    activeBar?: (tab: string) => void;
}

const FormInicial: InterfaceCajas = {
    id: Number(''),
    estado: "Abierta",
    apertura: formatarDataInput(new Date()),
    cierre: null,
    descripcion: "",
    usuario_id: undefined,
    usuario: ""
};

const FormCajas: React.FC<FormCajasProps> = ({
    datos,
    cajaSeleccionada,
    obtenerCaja,
    guardarCaja,
    cerrarReabrir,
    recargar,
    activeBar
}) => {
    const { user, loading: loadingUser } = useAuth();
    const { caja, loading: loadingCaja } = useCaja();

    const [formData, setFormData] = useState<InterfaceCajas>({
        ...FormInicial,
        usuario_id: user?.id,
        usuario: user?.nombre
    });

    const limpiarFormulario = () => {
        setFormData({
            ...FormInicial,
            usuario_id: user?.id,
            usuario: user?.nombre,
            apertura: formatarDataInput(new Date())
        });
    };

    useEffect(() => {
        if (caja?.id) {
            obtenerCaja(Number(caja?.id));
        }
    }, [caja?.id]);

    useEffect(() => {
        if (cajaSeleccionada && cajaSeleccionada.id) {
            setFormData({
                ...cajaSeleccionada,
                apertura: formatarDataInput(cajaSeleccionada.apertura),
                usuario_id: cajaSeleccionada.usuario_id || user?.id,
                usuario: cajaSeleccionada.usuario || user?.nombre
            });
        }
    }, [cajaSeleccionada, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.apertura) {
            showAlert("Fecha de apertura requerida", "warning");
            return;
        }
        try {
            // formData.apertura viene como "YYYY-MM-DDTHH:mm" sin huso horario.
            // Se le agrega explícitamente el offset de Paraguay (-03:00) antes
            // de enviarlo, para que el backend no lo interprete como UTC.
            const payload = {
                ...formData,
                apertura: `${formData.apertura}:00-03:00`
            };
            await guardarCaja(payload);
            limpiarFormulario();
        } catch (error) {
            console.error(error);
            showAlert("Error al guardar la caja", "error");
        }
    };

    const handleCerrarReabrir = async () => {
        if (!formData.id) {
            showAlert("Debes seleccionar una caja", "warning");
            return;
        }
        try {
            await cerrarReabrir(Number(formData.id), formData.estado);
        } catch (error) {
            console.error(error);
            showAlert("Error al cambiar el estado de la caja", "error");
        }
    };

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeCambiarFecha = tienePermiso("cambiar_fecha_caja");
    const puedeCerrar = tienePermiso("cerrar_caja");
    const puedeAbrir = tienePermiso("agregar_caja");
    const puedeEditar = tienePermiso("editar_caja");

    const estadoBadgeColor = formData.estado === "Abierta"
        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
        : "bg-orange-50 text-orange-600 border border-orange-200";

    const buscarYCargar = (term: string) => {
        const t = term.trim();

        if (!t) {
            limpiarFormulario();
            return;
        }

        const encontrado = datos.find(
            p => String(p.id) === t ||
                p.descripcion?.toLowerCase().includes(t.toLowerCase())
        );

        if (encontrado) {
            setFormData({
                ...encontrado,
                usuario_id: encontrado.usuario_id || user?.id,
                usuario: encontrado.usuario || user?.nombre,
                apertura: formatarDataInput(encontrado.apertura),
            });
            if (String(encontrado.id) !== String(formData.id)) {
                obtenerCaja(Number(encontrado.id));
            }
        } else {
            limpiarFormulario();
        }
    };

    const cargarDesdeListado = (id: string | number) => {
        const encontrado = datos.find(p => String(p.id) === String(id));
        if (encontrado) {
            setFormData({
                ...encontrado,
                usuario_id: encontrado.usuario_id || user?.id,
                usuario: encontrado.usuario || user?.nombre,
                apertura: formatarDataInput(encontrado.apertura),
            });
            return true;
        }
        return false;
    };

    const handleSelectOption = (option: SearchOption) => {
        cargarDesdeListado(option.id);
        obtenerCaja(Number(option.id));
    };

    const opciones: SearchOption[] = [...datos]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(e => ({ id: e.id, texto: e.descripcion || '' }));


    // Si no trae datos queda cargando
    if (loadingCaja || loadingUser) {
        <Loading />;
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Header del formulario */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <Plus size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Caja</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando caja #${formData.id}` : "Nueva caja"}
                        </span>
                    </div>
                </div>

                {/* Estado */}
                {formData.id ? (
                    <span className={`inline-flex items-center px-3 py-1.5 gap-2 rounded-xl text-xs font-semibold ${estadoBadgeColor}`}>
                        {formData.estado === "Abierta" ? <LockOpen size={18} /> : <Lock size={18} />} {formData.estado || ""}
                    </span>
                ) : null}
            </div>

            {/* Campos */}
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-6 lg:p-8">
                {/* Campos principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* ID */}
                    <div className="flex flex-col gap-2">

                        <InputERP
                            type="searchNumber"
                            label="ID"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e })}
                            searchOptions={opciones}
                            onSelectOption={handleSelectOption}
                            displayMode="id-text"
                            searchMinChars={1}
                            showSearch={false}
                            onEnterPress={buscarYCargar}
                            placeholder="Ingresa ID o descripción..."
                        />

                    </div>

                    {/* Usuario */}
                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="text"
                            label="Usuario"
                            readOnly
                            value={formData.usuario || ""}
                            onChange={() => { }}
                            placeholder="Usuario actual"
                        />
                    </div>

                    {/* Apertura */}
                    <div className="flex flex-col gap-2">
                        <InputERP
                            label="Apertura"
                            type="datetime-local"
                            value={formData.apertura}
                            readOnly={!puedeCambiarFecha || !puedeEditar}
                            data-tooltip={`${!puedeEditar && !puedeCambiarFecha ? 'No tenes los privilegios necesarios' : ""}`}
                            onChange={(e) => setFormData({ ...formData, apertura: e })}
                        />
                    </div>

                    {/* Cierre */}
                    <div className="flex flex-col gap-2">
                        <div className={`grid gap-2 ${formData.creado_en ? "grid-cols-2" : "grid-cols-1"}`}>
                            {formData.creado_en && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-mi-primera/10 border border-mi-primera/20">
                                    <span className="text-xs font-semibold text-mi-cuarta/70">Creado en:</span>
                                    <span className="text-xs text-mi-cuarta">{formatarDataHora(formData.creado_en)}</span>
                                </div>
                            )}
                            <InputERP
                                label="Cierre"
                                type="datetime-local"
                                readOnly
                                value={formData.cierre || ""}
                                onChange={() => { }}
                                placeholder="Aún no cerrada"
                            />
                        </div>
                    </div>
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-2 mt-5">
                    <InputERP
                        type="textarea"
                        label="Descripción"
                        value={formData.descripcion || ""}
                        disabled={!puedeEditar}
                        data-tooltip={`${!puedeEditar ? 'No tenes los privilegios necesarios' : ""}`}
                        onChange={(e) => setFormData({ ...formData, descripcion: e })}
                        rows={3}
                    />
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="submit"
                    disabled={!puedeAbrir}
                    data-tooltip={`${!puedeAbrir ? "No tienes privilegios necesarios" : formData.id ? "Editar Caja" : "Abrir Caja"}`}
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
                    onClick={handleCerrarReabrir}
                    disabled={!formData.id || !puedeCerrar}
                    data-tooltip={
                        !formData.id
                            ? "Seleccione una caja para realizar esta acción"
                            : !puedeCerrar
                                ? "No tienes privilegios necesarios"
                                : formData.estado === "Abierta"
                                    ? "Cerrar Caja"
                                    : "Reabrir Caja"
                    }
                    className={`flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl ${formData.estado === "Abierta" ? 'bg-orange-500' : 'bg-green-500'} text-white shadow-md shadow-mi-cuarta/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
                >
                    {formData.estado === "Abierta" ? <Lock size={18} /> : <LockOpen size={18} />}
                    {formData.estado === "Abierta" ? "Cerrar" : "Reabrir"} Caja
                </button>

                <button
                    type="button"
                    onClick={limpiarFormulario}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-white text-mi-cuarta border border-mi-primera/20 hover:bg-mi-primera/10 transition-all duration-200 active:scale-[0.98]"
                >
                    <Trash2 size={18} />
                    Limpiar
                </button>
            </div>
        </form>
    );
};

export default FormCajas;