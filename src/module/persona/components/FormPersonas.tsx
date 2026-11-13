import { useRef, useState, useEffect } from "react";
import { FileUser, MapPinSearch, MessageSquare, Plus, Power, PowerOff, RefreshCcw, Trash2 } from "lucide-react";
import InputERP from "../../../components/utils/InputERP";
import SelectCustom from "../../../components/utils/SelectCustom";
import type { InterfacePersona, TipoPersona } from "../interfaces/InterfacePersona";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";
import Tarjeta from "../../../components/utils/Tarjeta";
import { usePersona } from "../hooks/usePersona";
import { showAlert, confirmar } from "../../../components/utils/Procesando";
import type { InterfaceDatosPersonaRuc } from "../services/personaService";

interface InterfaceFormPersonas {
    PersonaSelect: InterfacePersona | null;
    guardarPersona: (data: any) => Promise<void>;
}

const OPCIONES_TIPO_PERSONA = [
    { value: "Física", label: "Física" },
    { value: "Jurídica", label: "Jurídica" },
];

const OPCIONES_CATEGORIA = [
    { value: "Cliente", label: "Cliente" },
    { value: "Proveedor", label: "Proveedor" },
];

const formInicial = {
    id: "",
    tipo_persona: "Física" as TipoPersona,
    nombre: "",
    razon_social: "",
    cedula: null,
    ruc: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "",
    categoria: "Cliente",
    activo: true,
    observacion: "",
    limite_credito: null,
};

/** Quita el dígito verificador: "6357507-8" => "6357507" */
const rucSinDv = (ruc: string): string => ruc.split("-")[0].replace(/\D/g, "");

const FormPersonas = ({ PersonaSelect, guardarPersona }: InterfaceFormPersonas) => {
    const [formData, setFormData] = useState<InterfacePersona>(formInicial as InterfacePersona);
    const [buscadorRuc, setBuscadorRuc] = useState<string>("");
    const { user } = useAuth();
    const { buscarDatosRuc, loading: buscandoRuc } = usePersona();

    // Caché de consultas al SET: evita repetir el mismo RUC y reduce los 429
    const cacheRuc = useRef(new Map<string, InterfaceDatosPersonaRuc>());

    // Verificación de privilegios
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_personas");
    const puedeEditar = tienePermiso("editar_personas");
    const puedeInactivar = tienePermiso("inactivar_personas");

    const puedeGuardar = formData.id ? puedeEditar : puedeAgregar;
    const esJuridica = formData.tipo_persona === "Jurídica";

    useEffect(() => {
        if (PersonaSelect) {
            setFormData({
                id: Number(PersonaSelect.id),
                tipo_persona: PersonaSelect.tipo_persona as TipoPersona,
                nombre: PersonaSelect.nombre ?? "",
                razon_social: PersonaSelect.razon_social ?? "",
                cedula: PersonaSelect.cedula ? Number(PersonaSelect.cedula) : null,
                ruc: PersonaSelect.ruc ?? "",
                email: PersonaSelect.email ?? "",
                telefono: PersonaSelect.telefono ?? "",
                direccion: PersonaSelect.direccion ?? "",
                ciudad: PersonaSelect.ciudad ?? "",
                departamento: PersonaSelect.departamento ?? "",
                pais: PersonaSelect.pais ?? "",
                categoria: PersonaSelect.categoria ?? "",
                activo: Boolean(PersonaSelect.activo),
                observacion: PersonaSelect.observacion ?? "",
                limite_credito: PersonaSelect.limite_credito != null
                    ? Number(PersonaSelect.limite_credito)
                    : null,
            });
        } else {
            setFormData(formInicial as InterfacePersona);
        }
    }, [PersonaSelect]);

    const limpiarForm = () => {
        setFormData(formInicial as InterfacePersona);
    };

    const guardar = () => {
        guardarPersona(formData);
    };

    /** Busca el RUC (sin DV), pide confirmación y luego completa los datos del SET */
    const buscar = async () => {
        const ruc = rucSinDv(buscadorRuc);
        if (!ruc) {
            showAlert("Ingrese un RUC para buscar", "warning");
            return;
        }
        if (buscandoRuc) return;

        let datos = cacheRuc.current.get(ruc);

        if (!datos) {
            const resultado = await buscarDatosRuc(ruc);
            if (!resultado) {
                showAlert("No se pudo consultar el RUC. Si el SET limitó las consultas, espere unos minutos", "error");
                return;
            }
            datos = resultado;
            cacheRuc.current.set(ruc, resultado);
        }

        const cargar = await confirmar(
            "Datos encontrados en el SET",
            `${datos.nombre} (RUC ${datos.ruc}). ¿Desea cargar estos datos en el formulario?`,
            "Sí, cargar",
            "No"
        );
        if (!cargar) return;

        const encontrado = datos;
        setFormData(prev => ({
            ...prev,
            tipo_persona: encontrado.tipo_persona,
            nombre: encontrado.nombre,
            razon_social: encontrado.razon_social,
            cedula: encontrado.cedula,
            ruc: encontrado.ruc,
            departamento: encontrado.departamento,
            ciudad: encontrado.ciudad,
            activo: encontrado.activo,
        }));
        // El campo de búsqueda usa el RUC sin DV
        setBuscadorRuc(rucSinDv(encontrado.ruc));
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
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Registro de Persona</span>
                        <span className="text-xs text-mi-cuarta/50">
                            {formData.id ? `Editando Persona #${formData.id}` : "Nueva Persona"}
                        </span>
                    </div>
                </div>

                <div>
                    <InputERP
                        label="Buscar RUC SET"
                        type="text"
                        value={buscadorRuc}
                        showSearchList={false}
                        disabled={buscandoRuc}
                        showSearch={true}
                        searchTooltip="Buscar en el SET"
                        onSearchClick={buscar}
                        onEnterPress={buscar}
                        data-tooltip={"Ingrese el RUC con o sin DV para buscar"}
                        onChange={(e) => setBuscadorRuc(String(e))}
                    />
                </div>

                <button
                    type="button"
                    disabled={!puedeInactivar || formData.id === user?.id}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                    data-tooltip={
                        formData.id === user?.id
                            ? "La persona no puede cambiar su propio estado"
                            : !puedeInactivar
                                ? "No tienes los privilegios necesarios"
                                : ""
                    }
                    className={`flex justify-center w-30 cursor-pointer items-center gap-2 px-4 py-2 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${formData.activo
                        ? "bg-green-100 text-green-600 border-green-600"
                        : "bg-red-100 text-red-600 border-red-600"
                        } border`}
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

            {/* Datos generales */}
            <Tarjeta icon={<FileUser size={18} />} title="Datos Personales">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                        <SelectCustom
                            label="Tipo de persona"
                            options={OPCIONES_TIPO_PERSONA}
                            value={formData.tipo_persona}
                            isClearable={false}
                            searchable={false}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, tipo_persona: String(e) as TipoPersona })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <SelectCustom
                            label="Categoría"
                            options={OPCIONES_CATEGORIA}
                            value={formData.categoria}
                            isClearable={false}
                            searchable={false}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, categoria: String(e) })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            label="Nombre"
                            type="text"
                            value={formData.nombre}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, nombre: e })}
                        />
                    </div>

                    {esJuridica && (
                        <div className="flex flex-col gap-2">
                            <InputERP
                                label="Razón social"
                                type="text"
                                value={formData.razon_social}
                                disabled={!puedeGuardar}
                                onChange={(e) => setFormData({ ...formData, razon_social: e })}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="number"
                            label="Cédula"
                            value={formData.cedula}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, cedula: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="text"
                            label="RUC"
                            value={formData.ruc}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, ruc: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="email"
                            label="E-mail"
                            value={formData.email}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, email: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="tel"
                            label="Teléfono"
                            value={formData.telefono}
                            phoneMask="+595 ### ### ###"
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, telefono: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="number"
                            label="Límite de crédito (moneda base)"
                            value={formData.limite_credito}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({
                                ...formData,
                                limite_credito: e === "" || e == null ? null : Number(e),
                            })}
                        />
                    </div>
                </div>
            </Tarjeta>

            {/* Localización */}
            <Tarjeta icon={<MapPinSearch size={18} />} title="Localización">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <InputERP
                            type="text"
                            label="Dirección"
                            value={formData.direccion}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, direccion: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="text"
                            label="Ciudad"
                            value={formData.ciudad}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, ciudad: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="text"
                            label="Departamento"
                            value={formData.departamento}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, departamento: e })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <InputERP
                            type="text"
                            label="País"
                            value={formData.pais}
                            disabled={!puedeGuardar}
                            onChange={(e) => setFormData({ ...formData, pais: e })}
                        />
                    </div>
                </div>
            </Tarjeta>

            {/* Observación */}
            <Tarjeta icon={<MessageSquare size={18} />} title="Observaciones">
                <InputERP
                    type="textarea"
                    label="Observación"
                    rows={3}
                    value={formData.observacion}
                    disabled={!puedeGuardar}
                    onChange={(e) => setFormData({ ...formData, observacion: String(e) })}
                />
            </Tarjeta>

            {/* Acciones */}
            <div className="flex gap-2 justify-end items-center flex-wrap">
                <button
                    type="button"
                    onClick={guardar}
                    disabled={!puedeGuardar}
                    data-tooltip={
                        puedeGuardar
                            ? (formData.id ? "Editar Persona" : "Agregar Persona")
                            : "No tienes los privilegios necesarios"
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

export default FormPersonas;
