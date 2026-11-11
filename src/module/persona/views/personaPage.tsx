import { List, PlusCircle, Users } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import ActionBanner from "../../../components/utils/ActionBanner";
import { useEffect, useState } from "react";
import Loading from "../../../components/utils/Loading";
import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { usePersona } from "../hooks/usePersona";
import { PersonasList } from "../components/PersonasList";
import FormPersonas from "../components/FormPersonas";

const PersonasPage = () => {
    const navigate = useNavigate();
    const {
        personas,
        cargarPersonas,
        cargarPersonaId,
        personaSeleccionada,
        guardarPersona,
        loading,
    } = usePersona();

    const [activeTab, setActiveTab] = useState('lista');

    //Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_personas");
    const puedeAgregar = tienePermiso("agregar_personas");
    const puedeEditar = tienePermiso("editar_personas");

    // Revisá esta condición: antes era `1 ? puedeEditar : puedeAgregar`
    const puedeGuardar = puedeEditar;

    useEffect(() => {
        cargarPersonas();
    }, []);

    useEffect(() => {
        if (!puedeVerPagina) navigate("/dashboard");
    }, [puedeVerPagina, navigate]);

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    if (!puedeVerPagina) return null;

    return (
        <>
            {loading && <Loading />}

            <PageBanner
                icon={<Users />}
                title="Persona"
                subtitle="Consulte y gestione las persona"
                size="md"
                children={
                    <ActionBanner
                        activeTab={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId)}
                        tabs={[
                            {
                                id: 'registro',
                                label: 'Registro',
                                disabled: !puedeGuardar,
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <FormPersonas
                                            PersonaSelect={personaSeleccionada}
                                            guardarPersona={guardarPersona}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'lista',
                                label: 'Lista',
                                icon: <List className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <PersonasList
                                            datos={personas}
                                            cargarPersona={cargarPersonaId}
                                            activeBar={activarBar}
                                        />
                                    </div>
                                )
                            }
                        ]}
                    />
                }
            />

            <GlobalTooltip />
        </>
    );
};

export default PersonasPage;