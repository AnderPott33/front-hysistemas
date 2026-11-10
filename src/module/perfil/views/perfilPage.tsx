import { BriefcaseBusiness, Check, CircleAlert, DollarSign, FileCog, Landmark, SlidersHorizontal, UserPen } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import ActionBanner from "../../../components/utils/ActionBanner";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { InterfacePerfil } from '../interfaces/interfacePerfil'
import FormOtros from "../components/formOtros";
import { showAlert } from "../../../components/utils/Procesando";
import { usePerfil } from "../hooks/usePerfil";
import { useAuth } from "../../../context/AuthContext";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { usePermisos } from "../../../context/PermisosContext";

const PerfilPage = () => {
    const { perfil, guardarPerfilFn, cargarPerfil, loading } = usePerfil();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('informacion_usuario');
    const formInicial: InterfacePerfil = {
        id: '',
        nombre: '',
        email: '',
        contrasena: '',
        theme_color: '',
    };
    const [formData, setFormData] = useState<InterfacePerfil>(formInicial);

    useEffect(() => {
        cargarPerfil(Number(user?.id));
    }, []);

    const actualizar = async () => {
        if (perfil) {
            setFormData(perfil);
        }
    }
    useEffect(() => {
        actualizar()
    }, [perfil]);



    const recibirDatos = useCallback((empresaRec: InterfacePerfil) => {
        setFormData(empresaRec);
    }, []);


    const guardarCompleto = async () => {
        const result = await guardarPerfilFn(formData)

        showAlert(result?.data.message, result?.data.type)

        actualizar()
    }

    const { tienePermiso } = usePermisos();
    const puedeAlterarColor = tienePermiso("perfil_altera_color_del_sistema");

    return (
        <>
            <PageBanner
                icon={<UserPen />}
                title="Perfil Usuario"
                subtitle="Altere las informaciones de su perfil"
                size="md"
                children={
                    <>
                        <div >
                            <ActionBanner
                                activeTab={activeTab}
                                onTabChange={(tabId) => setActiveTab(tabId)}
                                tabs={
                                    [
                                        {
                                            id: 'informacion_usuario',
                                            label: 'Información Usuario',
                                            icon: <CircleAlert className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">

                                                </div>
                                            )
                                        },
                                        {
                                            id: 'configuracion_color',
                                            label: 'Configuración Color',
                                            disabled: !puedeAlterarColor,
                                            icon: <BriefcaseBusiness className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">
                                                    <FormOtros
                                                        empresa={perfil}
                                                        formInicial={formInicial}
                                                        recibirOtros={recibirDatos}
                                                    />
                                                </div>
                                            )
                                        },
                                    ]
                                }
                            />
                        </div>
                        <div className="flex gap-2 justify-end items-center flex-wrap pt-4">
                            <button
                                onClick={() => guardarCompleto()}
                                disabled={loading}
                                className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 active:scale-[0.98]"
                            >
                                <Check size={18} />
                                {loading ? 'Guardando...' : 'Salvar'}
                            </button>
                        </div>
                    </>
                }
            />
            <GlobalTooltip />
        </>
    );
}

export default PerfilPage;
