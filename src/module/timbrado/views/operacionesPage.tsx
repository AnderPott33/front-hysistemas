/* import { List, Move, PlusCircle } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import { useOperacion } from "../hooks/useOperacion";
import { useEffect, useState } from "react";
import ActionBanner from "../../../components/utils/ActionBanner";
import OperacionesTable from "../components/OperacionesTable";
import FormOperaciones from "../components/FormOperaciones";
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";

const OperacionesPage = () => {
    const [activeTab, setActiveTab] = useState('registro');
    const { operaciones, operacionSeleccionada, cargarOperacionId, cargarOperaciones, agregarActualizarOperacionFn } = useOperacion();
    const [recargar, setRecargar] = useState(false);

    const cargar = async () => {
        await cargarOperaciones()
    }

    useEffect(() => {
        cargar();
    }, []);

    const activarBar = (tab: string) => {
        setActiveTab(tab);
    };

    const guardarOperacion = async (operacion: InterfaceOperacionBaja) => {
        await agregarActualizarOperacionFn(operacion)
        await cargar()
    }


   


    return (
        <>
            <PageBanner
                icon={<Move />}
                title="Operaciones"
                subtitle="Las operaciones se utilizan para las emisiones y la recepción de billetes fiscales."
            />
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
                                        <FormOperaciones
                                            operacionSeleccionada={operacionSeleccionada}
                                            guardarOperacion={guardarOperacion}
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
                                        <OperacionesTable
                                            operaciones={operaciones}
                                            obtenerOperacion={cargarOperacionId}
                                            activeBar={activarBar}
                                        />
                                    </div>
                                </>
                            )
                        }
                    ]
                }
            />
        </>
    );
}
export default OperacionesPage; */