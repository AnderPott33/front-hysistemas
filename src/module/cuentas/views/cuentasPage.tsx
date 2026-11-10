import { List, PlusCircle, Scale } from "lucide-react";
import ActionBanner from "../../../components/utils/ActionBanner";
import PageBanner from "../../../components/utils/Banner";
import { useEffect, useState } from "react";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { useCuentas } from "../hooks/useCuentas";
import { CuentasList } from "../components/CuentasList";
import FormCuentas from "../components/FormCuentas";
import { useMoneda } from "../../moneda/hooks/useMoneda";

const CuentasPage = () => {
    const [activeTab, setActiveTab] = useState('lista');

    const { cuentas, cargarCuentas, cuentaSeleccionada, cargarCuentaPorId, guardarCuenta } = useCuentas();
    const { monedasA, cargarMonedasActivas } = useMoneda();

    const cargarDatos = async () => {
        await cargarCuentas();
        await cargarMonedasActivas();
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <>
            <PageBanner
                icon={<Scale />}
                title="Cuentas"
                subtitle="Consulte y gestione las cuentas de caja y banco"
                size="md"
                children={
                    <ActionBanner
                        activeTab={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId)}
                        tabs={[
                            {
                                id: 'registro',
                                label: 'Registro',
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2">
                                        <FormCuentas
                                            cuentaSelect={cuentaSeleccionada || null}
                                            guardarCuenta={guardarCuenta}
                                            monedas={monedasA}
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
                                        <CuentasList
                                            datos={cuentas}
                                            cargarCuenta={cargarCuentaPorId}
                                            activeBar={activarBar}
                                        />
                                    </div>
                                )
                            },
                        ]}
                    />
                }
            />

            <GlobalTooltip />
        </>
    );
};

export default CuentasPage;
