/* import { List, Pen } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import type { InterfaceOperacionBaja } from "../interfaces/InterfaceOperacion";

interface InterfaceOperacionesTable {
    operaciones: InterfaceOperacionBaja[];
    obtenerOperacion: (id: number) => Promise<void>;
    activeBar: (tab: string) => void;
}

const OperacionesTable = ({ operaciones, obtenerOperacion, activeBar }: InterfaceOperacionesTable) => {
    return (
        <>
            <div>
                <div className="flex justify-between items-center bg-gray-50 rounded-t-xl p-4 shadow-lg">
                    <div className="flex justify-center items-center gap-3">
                        <div className="bg-[#188180]/10 text-[#359bac] rounded-xl p-3">
                            <List size={18} />
                        </div>
                        <span className="font-bold text-lg">Lista De Operaciones</span>
                    </div>
                    <div className="flex gap-2">

                    </div>
                </div>

                <div className="rounded-b-xl bg-white  shadow-lg">

                    <DataTable<InterfaceOperacionBaja>
                        data={operaciones}
                        columns={[
                            { header: "#", accessor: "id", sortable: true, filterable: false },
                            { header: "Descripción", accessor: "descripcion", sortable: true, filterable: false },
                            { header: "Modulo", accessor: "modulo", sortable: true, filterable: false },
                            {
                                header: "Acciones", accessor: "acciones", align: 'center', sortable: true, filterable: false,
                                cell: e => {
                                    return (
                                        <div className="flex gap-1.5 justify-center items-center">
                                            <button
                                                onClick={() => {
                                                    obtenerOperacion(e.id)
                                                    activeBar('registro')
                                                }}
                                               
                                                className="p-2 cursor-pointer text-[#144144] hover:bg-[#359bac]/20 rounded-xl transition-colors"
                                                >
                                                <Pen size={18} />
                                            </button>

                                        </div>
                                    )
                                }
                            },
                        ]}
                        showGlobalSearch={true}
                        pagination={false}
                        selectable={false}
                        showFilters={false}
                    />
                </div>
            </div>
        </>
    );
}
export default OperacionesTable; */