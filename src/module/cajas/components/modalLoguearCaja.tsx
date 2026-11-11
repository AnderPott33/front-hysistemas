import { Key, Check } from "lucide-react";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import { useCajas } from "../hooks/useCajas";
import { formatarDataHora } from "../../../components/utils/Formatadores";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceCajas } from "../Interfaces/InterfaceCajas";
import { useEffect, useState } from "react";
import { useCaja } from "../../../context/CajaContext";
import { showAlert } from "../../../components/utils/Procesando";

export interface ModalLoguearCajaProps {
    isOpen: boolean;
    onClose: () => void;
    cajaActualId?: number | null;
}

const ModalLoguearCaja: React.FC<ModalLoguearCajaProps> = ({
    isOpen,
    onClose,
    cajaActualId,
}) => {
    const [cajaSelect, setCajaSelect] = useState<InterfaceCajas | null>(null);
    const { cajas, cargarCajas } = useCajas(); // ajusta al nombre real de la lista en CajaContext
    useEffect(() => {
        cargarCajas()
    }, [isOpen])

    useEffect(() => {
        setCajaSelect(null)
    }, [isOpen])

    const { caja, seleccionarCaja } = useCaja();
    const cajasAbiertas = cajas.filter((c) => c.estado === "Abierta");

    const handleSelect = (caja: InterfaceCajas) => {

        setCajaSelect(caja);

    };
    const estaActiva = Boolean(caja);
    return (
        <ModalGeneral
            isOpen={isOpen}
            onClose={onClose}
            title="Loguear Caja"
            subtitle="Selecciona una caja abierta para continuar"
            icon={<Key size={20} />}
            width="1200px"
            sizeBanner={'sm'}
            childrenPadding={false}
            maxHeight="600px"
            children={
                <>
                    <div className="grid gap-2 px-3 ">
                        <div className="pt-2">
                            <div
                            className={` flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${estaActiva
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}
                        >
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${estaActiva ? "bg-green-600" : "bg-red-600"
                                    }`}
                            >
                                {estaActiva ? "Caja Activa" : "Caja Offline"}
                            </span>

                            {estaActiva && (
                                <span className="text-sm">
                                    Caja: {caja!.id}
                                    {caja!.descripcion ? ` - ${caja!.descripcion}` : ""}
                                </span>
                            )}
                        </div>
                        </div>
                        <div className="rounded-3xl bg-mi-segunda/50 border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                            <DataTable<InterfaceCajas>
                                data={cajasAbiertas}
                                pagination={false}
                                showFilters={false}
                                columns={[
                                    {
                                        header: "#",
                                        accessor: "id",
                                        align: "start",
                                        width: "100px",
                                        sortable: true,
                                        filterable: false
                                    },
                                    {
                                        header: "Descripción",
                                        accessor: "descripcion",
                                        align: "start",
                                        width: "200px",
                                        sortable: true,
                                        filterable: false
                                    },
                                    {
                                        header: "Apertura",
                                        accessor: "apertura",
                                        align: "center",
                                        sortable: true,
                                        filterable: false,
                                        cell: (row) => formatarDataHora(row.apertura)
                                    },

                                    {
                                        header: "Estado",
                                        accessor: "estado",
                                        align: "center",
                                        width: "100px",
                                        sortable: true,
                                        filterable: false,
                                        cell: (row) => (
                                            <span className="flex justify-center items-center">
                                                {row.estado === 'Abierta' ? (
                                                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                        Abierta
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200">
                                                        Cerrada
                                                    </span>
                                                )}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Usuario",
                                        accessor: "usuario",
                                        align: "center",
                                        sortable: true,
                                        filterable: false
                                    },
                                ]}
                                showGlobalSearch={false}
                                onRowClick={(row: InterfaceCajas) => handleSelect(row)}
                                initialPageSize={10}
                                selectable={false}
                            />
                        </div>
                        <div className="flex gap-2 justify-between items-center pb-3  flex-wrap pt-4">
                            <button
                                onClick={() => {
                                    seleccionarCaja(Number(cajaSelect?.id))
                                    showAlert(`Caja ${cajaSelect?.id} logueada`, 'success')
                                    onClose()
                                }}
                                disabled={!cajaSelect}
                                className="flex justify-center items-center gap-2 px-2 py-1 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                            >
                                <Key size={18} />
                                Loguear Caja {cajaSelect ? cajaSelect?.id : ''}
                            </button>
                            <button
                                onClick={() => {
                                    seleccionarCaja(Number(''))
                                    showAlert(`Caja deslogueada`, 'success')
                                    onClose()
                                }}
                                disabled={!caja}
                                className={`flex justify-center items-center gap-2 px-2 py-1  font-semibold rounded-xl bg-orange-500 text-white shadow-md shadow-mi-cuarta/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
                            >
                                <Key size={18} /> Desloguear Caja {caja ? caja.id : ''}
                            </button>
                        </div>
                    </div>
                </>
            }
        />
    );
};

export default ModalLoguearCaja;