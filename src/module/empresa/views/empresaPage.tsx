import { BriefcaseBusiness, Check, CircleAlert, DollarSign, FileCog, Landmark, SlidersHorizontal } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import ActionBanner from "../../../components/utils/ActionBanner";
import { useEffect, useState, useCallback } from "react";
import FormInformacionGeneral from "../components/formInfoGeneral";
import { useEmpresa } from "../hooks/useEmpresa";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import FormInformacionDelNegocio from "../components/formInfoDelNegocio";
import FormActividadEconomica from "../components/formActividadEconomica";
import FormDTE from "../components/formDTE";
import FormOtros from "../components/formOtros";
import { showAlert } from "../../../components/utils/Procesando";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import Loading from "../../../components/utils/Loading";

const EmpresaPage = () => {
    const { empresa, guardarEmpresaFn, cargarEmpresa, loading } = useEmpresa();
    const [activeTab, setActiveTab] = useState('informacion_general');
    const formInicial: InterfaceEmpresa = {
        id: '',
        ruc: '',
        fantasia: '',
        razon_social: '',
        direccion: '',
        telefono: '',
        email: '',
        ciudad: '',
        departamento: '',
        pais: '',
        moneda_base: 1,
        id_csc: undefined,
        csc: '',
        contrasena_certificado: '',
        regimen_contable: '',
        cliente_predeterminado: undefined,
        operacion_preseleccionada_compra: undefined,
        operacion_preseleccionada_venta: undefined,
        operacion_preseleccionada_nota_fiscal: undefined,
        activo: true,
        actividad_economica: []
    };
    const [formData, setFormData] = useState<InterfaceEmpresa>(formInicial);

    useEffect(() => {
        cargarEmpresa();
    }, []);

    const actualizar = async () => {
        if (empresa) {
            setFormData(empresa);
        }
    }
    useEffect(() => {
        actualizar()
    }, [empresa]);

    const recibirDatos = useCallback((empresaRec: InterfaceEmpresa) => {
        setFormData(empresaRec);
    }, []);

    const guardarCompleto = async () => {
        const result = await guardarEmpresaFn(formData)

        showAlert(result?.data.message, result?.data.type)

        actualizar()
    }

    const yaTieneEmpresa = empresa;

    return (
        <>
            {loading && <Loading />}

            <PageBanner
                icon={<Landmark />}
                title="Empresa"
                subtitle="Gestione la información y preferencias de su empresa"
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
                                            id: 'informacion_general',
                                            label: 'Información General',
                                            icon: <CircleAlert className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">
                                                    <FormInformacionGeneral
                                                        empresa={empresa}
                                                        formInicial={formInicial}
                                                        recibirInfoGeneral={recibirDatos}
                                                    />
                                                </div>
                                            )
                                        },
                                        {
                                            id: 'informacion_del_negocio',
                                            label: 'Información Del Negocio',
                                            disabled: !yaTieneEmpresa,
                                            icon: <BriefcaseBusiness className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">
                                                    <FormInformacionDelNegocio
                                                        empresa={empresa}
                                                        formInicial={formInicial}
                                                        recibirInfoDelNegocio={recibirDatos}
                                                    />
                                                </div>
                                            )
                                        },
                                        {
                                            id: 'actividad_economica',
                                            label: 'Actividad Económica',
                                            disabled: !yaTieneEmpresa,
                                            icon: <DollarSign className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">
                                                    <FormActividadEconomica
                                                        empresa={empresa}
                                                        formInicial={formInicial}
                                                        recibirActividadEconomica={recibirDatos}
                                                    />
                                                </div>
                                            )
                                        },
                                        {
                                            id: 'dte',
                                            label: 'DTE',
                                            disabled: !yaTieneEmpresa,
                                            icon: <FileCog className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">
                                                    <FormDTE
                                                        empresa={empresa}
                                                        formInicial={formInicial}
                                                        recibirDTE={recibirDatos}
                                                    />
                                                </div>
                                            )
                                        },
                                        {
                                            id: 'otros',
                                            label: 'Otros',
                                            disabled: !yaTieneEmpresa,
                                            icon: <SlidersHorizontal className="w-4 h-4" />,
                                            content: (
                                                <div className="bg-white rounded-2xl shadow-md  p-3">
                                                    <FormOtros
                                                        empresa={empresa}
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

export default EmpresaPage;