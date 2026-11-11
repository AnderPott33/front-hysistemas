import { useEffect, useState } from "react";
import PageBanner from "../../../components/utils/Banner";
import { BriefcaseBusiness, List, PlusCircle } from "lucide-react";
import ActionBanner from "../../../components/utils/ActionBanner";
import FormCajas from "../components/FormCajas";
import { useCajas } from "../hooks/useCajas";
import { showAlert } from "../../../components/utils/Procesando";
import CajasList from "../components/CajasList";
import type { InterfaceCajas } from "../Interfaces/InterfaceCajas";
import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import Loading from "../../../components/utils/Loading";

const FormInicial: InterfaceCajas = {
    id: 0,
    estado: "Abierta",
    apertura: new Date(),
    cierre: null,
    descripcion: "",
    usuario_id: undefined,
    usuario: "",
};

const CajasPage = () => {
    const {
        cajas,
        cajaSeleccionada,
        loading,
        cargarCajas,
        cargarCajaPorId,
        guardarCaja,
        cerrarCajaId,
        reabrirCajaId,
        loguearCajaUsuario,
    } = useCajas();

    const navigate = useNavigate();
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_cajas");
    const puedeAgregar = tienePermiso("agregar_caja");
    const puedeEditar = tienePermiso("editar_caja");

    // Revisá esta condición: antes era `1 ? puedeeditar : puedeAgregar`
    const habilitarRegistro = puedeEditar;

    const [activeTab, setActiveTab] = useState(habilitarRegistro ? "registro" : "lista");
    const [recargar, setRecargar] = useState(false);

    useEffect(() => {
        cargarCajas();
    }, []);

    useEffect(() => {
        if (!puedeVerPagina) navigate("/dashboard");
    }, [puedeVerPagina, navigate]);

    const handleSubmit = async (formData: InterfaceCajas) => {
        try {
            await guardarCaja(formData);
            showAlert(
                formData.id ? "Caja actualizada con éxito" : "Caja creada con éxito",
                "success"
            );
            setRecargar((r) => !r);
        } catch (error) {
            showAlert("Error al guardar caja", "error");
            console.error(error);
        }
    };

    const handleCerrarReabrir = async (id: number, estado: string) => {
        try {
            if (estado === "Abierta") {
                await cerrarCajaId(id);
                showAlert("Caja cerrada con éxito", "success");
            } else {
                await reabrirCajaId(id);
                showAlert("Caja reabierta con éxito", "success");
            }
            setRecargar((r) => !r);
        } catch (error) {
            showAlert("Error al actualizar estado", "error");
            console.error(error);
        }
    };

    if (!puedeVerPagina) return null;

    return (
        <>
            {loading && <Loading />}

            <PageBanner
                icon={<BriefcaseBusiness />}
                showToggle={false}
                title="Cajas"
                subtitle="Registre y/o actualice las cajas."
                size="md"
                children={
                    <ActionBanner
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        tabs={[
                            {
                                id: "registro",
                                label: "Registro",
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <FormCajas
                                            datos={cajas}
                                            cajaSeleccionada={cajaSeleccionada}
                                            obtenerCaja={cargarCajaPorId}
                                            guardarCaja={handleSubmit}
                                            cerrarReabrir={handleCerrarReabrir}
                                            recargar={recargar}
                                            activeBar={setActiveTab}
                                        />
                                    </div>
                                ),
                            },
                            {
                                id: "lista",
                                label: "Lista",
                                icon: <List className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <CajasList
                                            datos={cajas}
                                            cajaSeleccionada={cajaSeleccionada}
                                            obtenerCaja={cargarCajaPorId}
                                            activeBar={setActiveTab}
                                            loguearCaja={loguearCajaUsuario}
                                        />
                                    </div>
                                ),
                            },
                        ]}
                    />
                }
            />
            <GlobalTooltip />
        </>
    );
};

export default CajasPage;