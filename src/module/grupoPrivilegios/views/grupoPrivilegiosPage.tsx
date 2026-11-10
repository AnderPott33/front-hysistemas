import { useEffect, useState } from "react";
import { List, Network, Plus, PlusCircle, RefreshCcw } from "lucide-react";
import FormGrupoPrivilegios from "../components/FormGrupoPrivilegios";
import GrupoPrivilegiosList from "../components/GrupoPrivilegiosList";
import { useGrupoPrivilegios } from "../hooks/useGrupoPrivilegios";
import ActionBanner from "../../../components/utils/ActionBanner";
import PageBanner from "../../../components/utils/Banner";

const GrupoPrivilegiosPage = () => {
    const {
        gruposPrivilegios,
        grupoSeleccionado,
        loading,
        cargarGrupos,
        cargarGrupoPorId,
        guardarGrupo,
        borrarGrupo,
    } = useGrupoPrivilegios();

    const [activeTab, setActiveTab] = useState('lista');
    useEffect(() => {
        cargarGrupos();
    }, []);
    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    const handleSelectGrupo = (grupo: any) => {
        cargarGrupoPorId(Number(grupo.id));
        /* setIsFormVisible(true); */
        setActiveTab('registro')
    };

    const handleGuardar = async (grupo: any) => {
        await guardarGrupo(grupo);
        /* setIsFormVisible(false); */
        setActiveTab('lista')
    };

    const handleBorrar = async (id: number) => {
        await borrarGrupo(id);
    };

    const handleNuevo = () => {
        cargarGrupoPorId(0);
        /* setIsFormVisible(true); */
        setActiveTab('registro')
    };

    return (
        <>
            <PageBanner
                icon={<Network />}
                title="Privilegios"
                subtitle="Consulte y gestione los grupos de privilegio"
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
                                    icon: <PlusCircle className="w-4 h-4" />,
                                    content: (
                                        <>
                                            <div className="py-2">
                                                <FormGrupoPrivilegios
                                                    grupoSelect={grupoSeleccionado}
                                                    guardarGrupo={handleGuardar}
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
                                            <GrupoPrivilegiosList
                                                grupos={gruposPrivilegios}
                                                onSelect={handleSelectGrupo}
                                                onDelete={handleBorrar}
                                                nuevoGrupo={handleNuevo}
                                                loading={loading}
                                            />
                                        </div>
                                    )
                                }
                            ]
                        }
                    />
                }
            />
        </>
    );
};

export default GrupoPrivilegiosPage;
