import { useEffect, useState } from "react";
import { List, Pen, Plus } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import { formatarMoeda } from "../../../components/utils/Formatadores";
import type { InterfaceCuenta } from "../interfaces/InterfaceCuenta";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import { usePermisos } from "../../../context/PermisosContext";
import { useAuth } from "../../../context/AuthContext";
import { obtenerSaldoCuenta } from "../../extractoCuenta/services/extractoCuentaService";

interface InterfaceCuentasList {
    datos: InterfaceCuenta[];
    cargarCuenta: (id: number) => void;
    activeBar: (tab: string) => void;
}

/** Saldo de una sola cuenta. Cada fila consulta el suyo al montarse. */
const SaldoCuentaCell = ({ cuenta }: { cuenta: InterfaceCuenta }) => {
    const { token } = useAuth();
    const [saldo, setSaldo] = useState<number | null>(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (!token) return;

        let cancelado = false;
        setCargando(true);

        obtenerSaldoCuenta(token, Number(cuenta.id))
            .then((data) => {
                if (!cancelado) setSaldo(Number(data.saldo ?? 0));
            })
            .catch(() => {
                if (!cancelado) setSaldo(null);
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });

        return () => {
            cancelado = true;
        };
    }, [token, cuenta.id]);

    if (cargando) return <span className="text-xs text-mi-cuarta/40">Cargando...</span>;
    if (saldo === null) return <span className="text-xs text-mi-cuarta/40">-</span>;

    return (
        <span className="font-semibold text-mi-tercera">
            {formatarMoeda(saldo, cuenta.moneda as InterfaceMoneda | undefined)}
        </span>
    );
};

export const CuentasList = ({ datos, cargarCuenta, activeBar }: InterfaceCuentasList) => {
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("agregar_cuenta");
    const puedeEditar = tienePermiso("editar_cuenta");
    const { isAdmin } = useAuth();

    const editarCuenta = (id: number) => {
        cargarCuenta(Number(id));
        activeBar("registro");
    };

    const nuevaCuenta = () => {
        cargarCuenta(0);
        activeBar("registro");
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-3xl border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-mi-gradient shadow-md shadow-mi-tercera/30">
                        <List size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-mi-cuarta leading-tight">Lista de Cuentas</span>
                        <span className="text-xs text-mi-cuarta/50">Administra las cuentas de caja y banco</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={nuevaCuenta}
                    disabled={!puedeAgregar}
                    data-tooltip={puedeAgregar ? "Agregar Cuenta" : "No tienes los privilegios necesarios"}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nueva Cuenta
                </button>
            </div>

            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <DataTable
                    data={datos}
                    showGlobalSearch
                    showFilters={false}
                    columns={[
                        { header: "#", accessor: "id", align: "center", width: "30px", sortable: true },
                        {
                            header: "Cuenta", accessor: "nombre", align: "start", sortable: true,
                            cell: e => (
                                <div className="grid grid-cols-1">
                                    <div className="flex gap-2"><span className="font-semibold">Tipo:</span><span>{e.tipo}</span></div>
                                    <div className="flex gap-2"><span className="font-semibold">Nombre:</span><span>{e.nombre}</span></div>
                                    {e.tipo === "Banco" && (
                                        <div className="flex gap-2"><span className="font-semibold">Banco:</span><span>{e.banco_nombre} {e.numero_cuenta ? `(${e.numero_cuenta})` : ""}</span></div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            header: "Moneda", accessor: "moneda", align: "center", width: "90px", sortable: false,
                            cell: e => <span className="font-semibold">{e.moneda?.codigo}</span>,
                        },
                        {
                            header: "Saldo Actual", accessor: "saldo_actual", align: "right", width: "150px", sortable: false,
                            cell: e => <SaldoCuentaCell cuenta={e} />,
                        },
                        {
                            header: "Estado", accessor: "activo", align: "center", width: "100px", sortable: true, filterable: true,
                            cell: row => (
                                <span className="flex justify-center items-center">
                                    {row.activo ? (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200">
                                            Inactivo
                                        </span>
                                    )}
                                </span>
                            ),
                        },
                        {
                            header: "Acciones", accessor: "Acciones", align: "center",
                            cell: e => (
                                <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                        type="button"
                                        onClick={() => editarCuenta(Number(e.id))}
                                        disabled={!puedeEditar || (e.tipo === "Efectivo" && !isAdmin)}
                                        data-tooltip={!puedeEditar ? "No tienes los privilegios necesarios" : "Editar Cuenta"}
                                        className="p-2 cursor-pointer text-mi-segunda hover:bg-mi-primera/15 hover:text-mi-tercera rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Pen size={18} />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
};