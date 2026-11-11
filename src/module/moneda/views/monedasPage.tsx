import { CircleDollarSign, List, PlusCircle } from "lucide-react";
import ActionBanner from "../../../components/utils/ActionBanner";
import PageBanner from "../../../components/utils/Banner";
import { useEffect, useState } from "react";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import Loading from "../../../components/utils/Loading";
import { useMoneda } from "../hooks/useMoneda";
import { MonedasList } from "../components/MonedasList";
import FormMonedas from "../components/FormMonedas";
import { CotizacionesList } from "../components/CotizacionesList";
import FormCotizaciones from "../components/FormCotizaciones";
import type { InterfaceTipoCambio } from "../interfaces/InterfaceMoneda";
import { showAlert } from "../../../components/utils/Procesando";
import { useEmpresa } from "../../empresa/hooks/useEmpresa";

const MonedasPage = () => {
    const { empresa, cargarEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState('registroCotizacion');

    // Cotización seleccionada para editar (null = registro nuevo)
    const [cotizacionSelect, setCotizacionSelect] = useState<InterfaceTipoCambio | null>(null);

    const cargarCotizacion = (cotizacion: InterfaceTipoCambio | null) => {
        setCotizacionSelect(cotizacion);
    };

    const {
        monedas, cargarMonedas, monedaSeleccionada, cargarMonedaPorId,
        obtenerSimbolo, obtenerCotizacion, guardarMonedaFn,
        tiposCambio, cargarTiposCambio, guardarTipoCambioFn,
        loading,
    } = useMoneda();

    const cargarDatos = async () => {
        await cargarMonedas();
        await cargarTiposCambio();
        await cargarEmpresa();
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Al guardar, se recarga la lista y el formulario vuelve a modo "nuevo"
    const guardarCotizacion = async (items: any[]) => {
        for (const item of items) {
            await guardarTipoCambioFn(item);
        }
        showAlert('Cotizaciones actualizadas', 'success');
        await cargarTiposCambio();
        setCotizacionSelect(null);
    };

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    const cambiarTab = (tabId: string) => {
        // Si el usuario entra manualmente a registrar, no debe quedar una edición previa cargada
        if (tabId === 'registroCotizacion') {
            setCotizacionSelect(null);
        }
        setActiveTab(tabId);
    };

    return (
        <>
            {loading && <Loading />}

            <PageBanner
                icon={<CircleDollarSign />}
                title="Monedas y Cotización"
                subtitle="Consulte y gestione las monedas y cotizaciones del sistema"
                size="md"
                children={
                    <ActionBanner
                        activeTab={activeTab}
                        onTabChange={cambiarTab}
                        tabs={[
                            {
                                id: 'registroMoneda',
                                label: 'Registro Moneda',
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <FormMonedas
                                            datosEmpresa={empresa || null}
                                            monedaSelect={monedaSeleccionada || null}
                                            obtenerSimbolo={obtenerSimbolo}
                                            guardarMoneda={guardarMonedaFn}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'listaMoneda',
                                label: 'Lista Monedas',
                                icon: <List className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <MonedasList
                                            datos={monedas || []}
                                            cargarMoneda={cargarMonedaPorId}
                                            activeBar={activarBar}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'registroCotizacion',
                                label: 'Registro Cotización',
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <FormCotizaciones
                                            cotizacionSelect={cotizacionSelect}
                                            datosMonedas={monedas || []}
                                            datosCotizaciones={tiposCambio || []}
                                            guardarCotizacion={guardarCotizacion}
                                            obtenerCotizacion={obtenerCotizacion}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'listaCotizacion',
                                label: 'Lista Cotizaciones',
                                icon: <List className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <CotizacionesList
                                            datos={tiposCambio || []}
                                            datosMonedas={monedas || []}
                                            cargarCotizacion={cargarCotizacion}
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

export default MonedasPage;