import { List, PlusCircle, User } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import ActionBanner from "../../../components/utils/ActionBanner";
import { useUsuarios } from "../hooks/useUsuarios";
import { UsuariosList } from "../components/UsuariosList";
import { useEffect, useState } from "react";
import Loading from "../../../components/utils/Loading";
import FormUsuarios from "../components/FormUsuarios";
import { showAlert } from "../../../components/utils/Procesando";
import { useGrupoPrivilegios } from "../../grupoPrivilegios/hooks/useGrupoPrivilegios";
import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";

const UsuariosPage = () => {
    const { cargarGrupos, gruposPrivilegios } = useGrupoPrivilegios();
    const navigate = useNavigate();
    const { usuarios,
        usuarioSeleccionado,
        cambiarPassword,
        cambiarPasswordAdmin,
        loading: loadingUser,
        cargarUsuarios,
        cargarUsuarioPorId,
        guardarUsuario } = useUsuarios();
    const [activeTab, setActiveTab] = useState('lista');
    useEffect(() => {
        cargarUsuarios();
        cargarGrupos();
    }, []);

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    //Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_usuarios");
    const puedeAgregar = tienePermiso("agregar_usuario");
    const puedeEditar = tienePermiso("editar_usuario");

    const puedeGuardar = 1 ? puedeEditar : puedeAgregar;


    if (!usuarios) {
        return <Loading />
    }

    if (!puedeVerPagina) {
        navigate("/dashboard");
    }
    return (
        <>
            <PageBanner
                icon={<User />}
                title="Usuarios"
                subtitle="Consulte y gestione los usuarios"
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
                                                <FormUsuarios
                                                    usuarioSelect={usuarioSeleccionado || null}
                                                    guardarUsuario={guardarUsuario}
                                                    grupoPrivilegios={gruposPrivilegios}
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
                                            <UsuariosList
                                                datos={usuarios || []}
                                                cargarUsuario={cargarUsuarioPorId}
                                                activeBar={activarBar}
                                                cambiarPasswordAmin={cambiarPasswordAdmin}
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

export default UsuariosPage;