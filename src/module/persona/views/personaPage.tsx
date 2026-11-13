import { List, PlusCircle, Users } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import ActionBanner from "../../../components/utils/ActionBanner";
import { useEffect, useMemo, useState } from "react";
import Loading from "../../../components/utils/Loading";
import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { usePersona } from "../hooks/usePersona";
import { useMoneda } from "../../moneda/hooks/useMoneda";
import { useEmpresa } from "../../empresa/hooks/useEmpresa";
import { PersonasList } from "../components/PersonasList";
import FormPersonas from "../components/FormPersonas";
import ModalConsultaCredito from "../components/ModalConsultaCredito";
import type { InterfacePersona } from "../interfaces/InterfacePersona";

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
    const { monedasA, cargarMonedasActivas, tiposCambio, cargarTiposCambio } = useMoneda();
    const { empresa, cargarEmpresa } = useEmpresa();

    const [activeTab, setActiveTab] = useState('lista');
    const [personaCredito, setPersonaCredito] = useState<InterfacePersona | null>(null);

    // Moneda base: la que define la empresa
    const monedaBase = useMemo(
        () => monedasA.find(m => Number(m.id) === Number(empresa?.moneda_base)) ?? null,
        [monedasA, empresa]
    );

    //Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_personas");
    const puedeEditar = tienePermiso("editar_personas");

    const puedeGuardar = puedeEditar;

    useEffect(() => {
        Promise.all([
            cargarPersonas(),
            cargarMonedasActivas(),
            cargarTiposCambio(),
            cargarEmpresa(),
        ]);
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
                                            onCredito={setPersonaCredito}
                                        />
                                    </div>
                                )
                            }
                        ]}
                    />
                }
            />

            <ModalConsultaCredito
                isOpen={!!personaCredito}
                onClose={() => setPersonaCredito(null)}
                personaId={personaCredito ? Number(personaCredito.id) : 0}
                personaNombre={personaCredito?.nombre ?? ""}
                soloConsulta
                monedas={monedasA}
                monedaBase={monedaBase}
                datosCambios={tiposCambio}
            />

            <GlobalTooltip />
        </>
    );
};

export default PersonasPage;
