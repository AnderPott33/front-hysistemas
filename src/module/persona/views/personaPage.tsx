import { List, PlusCircle, User, Users } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import ActionBanner from "../../../components/utils/ActionBanner";
import { useEffect, useState } from "react";
import Loading from "../../../components/utils/Loading";
import { showAlert } from "../../../components/utils/Procesando";
import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { usePersona } from "../hooks/usePersona";
import { PersonasList } from "../components/PersonasList";
import FormPersonas from "../components/FormPersonas";

const PersonasPage = () => {
    const navigate = useNavigate();
    /*  const { cargarGrupos, gruposPrivilegios } = useGrupoPrivilegios(); */
    const { personas, cargarPersonas, cargarPersonaId, personaSeleccionada, guardarPersona, loading: loadingPersona } = usePersona();
    const [activeTab, setActiveTab] = useState('lista');
    useEffect(() => {
        cargarPersonas();
    }, []);

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    //Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_personas");
    const puedeAgregar = tienePermiso("agregar_personas");
    const puedeEditar = tienePermiso("editar_personas");
    const puedeInactivar = tienePermiso("inactivar_personas");

    const puedeGuardar = 1 ? puedeEditar : puedeAgregar;


    if (!personas) {
        return <Loading />
    }

    if (!puedeVerPagina) {
        navigate("/dashboard");
    }
    return (
        <>
            <PageBanner
                icon={<Users />}
                title="Persona"
                subtitle="Consulte y gestione las persona"
                size="md"
                children={

                    <ActionBanner
                        activeTab={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId)}
                        tabs={
                            [
                                {
                                    id: 'registro',
                                    label: 'Registro',
                                    disabled: !puedeGuardar,
                                    icon: <PlusCircle className="w-4 h-4" />,
                                    content: (
                                        <>
                                            <div className="py-2">
                                                <FormPersonas
                                                    PersonaSelect={personaSeleccionada}
                                                    guardarPersona={guardarPersona}
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
                                        <div className="py-2">
                                            <PersonasList
                                                datos={personas}
                                                cargarPersona={cargarPersonaId}
                                                activeBar={activarBar}
                                            />
                                        </div>
                                    )
                                }
                            ]
                        }
                    />
                }
            />

            <GlobalTooltip />
        </>
    );
}

export default PersonasPage;