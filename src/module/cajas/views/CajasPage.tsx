import { useEffect, useState } from "react";
import PageBanner from "../../../components/utils/Banner";
import { BriefcaseBusiness, List, Plus, PlusCircle } from "lucide-react";
import ActionBanner from "../../../components/utils/ActionBanner";
import FormCajas from "../components/FormCajas";
import { useCajas } from "../hooks/useCajas";
import { showAlert } from "../../../components/utils/Procesando";
import CajasList from "../components/CajasList";
import { formatarDataHora } from "../../../components/utils/Formatadores";
import type { InterfaceCajas } from "../Interfaces/InterfaceCajas";
import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";


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
        loguearCajaUsuario
    } = useCajas();
    const navigate = useNavigate();

    //Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_cajas");
    const puedeAgregar = tienePermiso("agregar_caja");
    const puedeeditar = tienePermiso("editar_caja");

    const habilitarRegistro = 1 ? puedeeditar : puedeAgregar;

    const [activeTab, setActiveTab] = useState(habilitarRegistro ? 'registro' : 'lista');
    const [recargar, setRecargar] = useState(false);
    const FormInicial: InterfaceCajas = {
        id: Number(''),
        estado: "Abierta",
        apertura: new Date(),
        cierre: null,
        descripcion: "",
        usuario_id: undefined,
        usuario: ""
    };
    const [datosList, setCajasList] = useState(FormInicial);

    useEffect(() => {
        cargarCajas();
    }, []);

    const handleSubmit = async (formData: any) => {
        try {
            await guardarCaja(formData);
            showAlert(
                formData.id ? "Caja actualizada con éxito" : "Caja creada con éxito",
                "success"
            );
            setRecargar(!recargar);
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
                cargarCajas();
            } else {
                await reabrirCajaId(id);
                showAlert("Caja reabierta con éxito", "success");
                cargarCajas();
            }
            await cargarCajaPorId(id);
            setRecargar(!recargar);
        } catch (error) {
            showAlert("Error al actualizar estado", "error");
            console.error(error);
        }
    };

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    if (!puedeVerPagina) {
        navigate("/dashboard");
    }

    return (
        <>
            <PageBanner
                icon={<BriefcaseBusiness />}
                showToggle={false}
                title="Cajas"
                subtitle="Registre y/o actualice las cajas."
                size={'md'}
                children={
                    <>
                        <ActionBanner
                            activeTab={activeTab}
                            onTabChange={(tabId) => setActiveTab(tabId)}
                            tabs={[
                                {
                                    id: 'registro',
                                    label: 'Registro',
                                    /* disabled: !habilitarRegistro, */
                                    icon: <PlusCircle className="w-4 h-4" />,
                                    content: (
                                        <>
                                            <div className="py-2">
                                                <FormCajas
                                                    datos={cajas}
                                                    cajaSeleccionada={cajaSeleccionada}
                                                    obtenerCaja={cargarCajaPorId}
                                                    guardarCaja={handleSubmit}
                                                    cerrarReabrir={handleCerrarReabrir}
                                                    recargar={recargar}
                                                    activeBar={activarBar}
                                                />
                                            </div>
                                        </>
                                    )
                                },
                                {
                                    id: 'lista',
                                    label: 'Lista',
                                    icon: <List className="w-4 h-4" />,
                                    content: (
                                        <>
                                            <div className="py-2">
                                                <CajasList
                                                    datos={cajas}
                                                    cajaSeleccionada={cajaSeleccionada}
                                                    obtenerCaja={cargarCajaPorId}
                                                    activeBar={activarBar}
                                                    loguearCaja={loguearCajaUsuario}
                                                />
                                            </div>
                                        </>
                                    )
                                }
                            ]}
                        />
                    </>
                }
            />
    <GlobalTooltip />
        </>
    );
};

export default CajasPage;
