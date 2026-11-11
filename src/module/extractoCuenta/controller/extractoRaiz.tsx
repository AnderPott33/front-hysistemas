import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExtractoCuenta } from "../hooks/useExtractoCuenta";
import ExtractoFiltros from "./extractoFiltros";
import { useCajas } from "../../cajas/hooks/useCajas";
import { useCuentas } from "../../cuentas/hooks/useCuentas";
import { useMoneda } from "../../moneda/hooks/useMoneda";
import { useEmpresa } from "../../empresa/hooks/useEmpresa";
import { useCaja } from "../../../context/CajaContext";
import ExtractoTable from "./extractoTable";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import Loading from "../../../components/utils/Loading";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, ChevronDown, CornerUpLeft, Plus } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import SaqueBancoModal from "./saqueBancoModal";
import DepositoBancoModal from "./depositoBancoModal";
import TransferenciaBancoModal from "./transferenciaBancoModal";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../components/utils/Procesando";

export type TipoOperacionBanco = "DEPOSITO_BANCO" | "SAQUE_BANCO" | 'TRANSFERENCIA_BANCO';

interface OpcionOperacion {
    tipo: TipoOperacionBanco;
    label: string;
    descripcion: string;
    icon: React.ReactNode;
}

const OPCIONES_OPERACION: OpcionOperacion[] = [
    {
        tipo: "DEPOSITO_BANCO",
        label: "Depósito Banco",
        descripcion: "Ingreso de fondos a la cuenta bancaria",
        icon: <ArrowDownToLine size={18} />,
    },
    {
        tipo: "SAQUE_BANCO",
        label: "Saque Banco",
        descripcion: "Egreso de fondos desde la cuenta bancaria",
        icon: <ArrowUpFromLine size={18} />,
    },
    {
        tipo: "TRANSFERENCIA_BANCO",
        label: "Transferencia",
        descripcion: "Traslado entre cajas o entre cuentas bancarias",
        icon: <ArrowLeftRight size={18} />,
    },
];

interface BotonNuevaOperacionProps {
    onSeleccionar: (tipo: TipoOperacionBanco) => void;
}

const BotonNuevaOperacion = ({ onSeleccionar }: BotonNuevaOperacionProps) => {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null);
    const botonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const calcularPosicion = () => {
        if (!botonRef.current) return;
        const r = botonRef.current.getBoundingClientRect();
        const ANCHO_MENU = 256; // w-64
        setPosicion({
            top: r.bottom + 8,
            left: Math.max(8, r.right - ANCHO_MENU),
        });
    };

    const toggleMenu = () => {
        if (!abierto) calcularPosicion();
        setAbierto(v => !v);
    };

    // Cerrar al hacer clic fuera, al presionar Escape, o al hacer scroll/resize
    useEffect(() => {
        if (!abierto) return;

        const handleClickFuera = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                botonRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) return;
            setAbierto(false);
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setAbierto(false);
        };
        const cerrar = () => setAbierto(false);

        document.addEventListener("mousedown", handleClickFuera);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", cerrar);
        window.addEventListener("scroll", cerrar, true);
        return () => {
            document.removeEventListener("mousedown", handleClickFuera);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", cerrar);
            window.removeEventListener("scroll", cerrar, true);
        };
    }, [abierto]);

    const handleSeleccionar = (tipo: TipoOperacionBanco) => {
        setAbierto(false);
        onSeleccionar(tipo);
    };

    return (
        <>
            <button
                ref={botonRef}
                type="button"
                onClick={toggleMenu}
                aria-haspopup="menu"
                aria-expanded={abierto}
                className="flex justify-center items-center gap-2 px-2 py-1 font-semibold rounded-xl bg-mi-primera text-white border border-mi-primera shadow-md hover:bg-mi-primera/90 transition-all duration-200 active:scale-[0.98]"
            >
                <Plus size={18} />
                Nueva Operación
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
                />
            </button>

            {abierto && posicion && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    style={{
                        position: "fixed",
                        top: posicion.top,
                        left: posicion.left,
                        zIndex: 9999,
                    }}
                    className="w-64 p-1.5 rounded-xl bg-white border border-mi-primera/10 shadow-xl"
                >
                    {OPCIONES_OPERACION.map(op => (
                        <button
                            key={op.tipo}
                            type="button"
                            role="menuitem"
                            onClick={() => handleSeleccionar(op.tipo)}
                            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-mi-cuarta hover:bg-mi-primera/10 transition-colors"
                        >
                            <span className="mt-0.5 text-mi-primera">{op.icon}</span>
                            <span className="flex flex-col">
                                <span className="font-semibold text-sm text-mi-cuarta">{op.label}</span>
                                <span className="text-xs text-mi-cuarta/60">{op.descripcion}</span>
                            </span>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};

const hoyISO = (): string => {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
};

const ExtractoRaiz = () => {
    const {
        cargarExtractoCuenta,
        extractoCuenta,
        saldosAnteriores,
        totalesFormaPago,
        registrarAsientosOperacion,
        cancelarAsientoOperacion,
        loading,
    } = useExtractoCuenta();
    const { cajas, cargarCajas, cargarCajaPorId } = useCajas();
    const { caja } = useCaja();
    const { cuentas, cargarCuentas, cargarCuentaPorId } = useCuentas();
    const { monedasA, cargarMonedasActivas, tiposCambio, cargarTiposCambio } = useMoneda();
    const { empresa, cargarEmpresa } = useEmpresa();

    const cajasAbiertas = cajas.filter(e => e.estado === 'Abierta');
    const cuentasActivas = cuentas.filter(e => e.activo);

    const [modalSaque, setModalSaque] = useState(false);
    const [modalDeposito, setModalDeposito] = useState(false);
    const [modalTransferencia, setModalTransferencia] = useState(false);

    // Moneda base: la que define la empresa
    const monedaBase = monedasA.find(m => Number(m.id) === Number(empresa?.moneda_base)) ?? null;

    const cargarDatosBasicos = async () => {
        await cargarCajas();
        await cargarCuentas();
        await cargarMonedasActivas();
        await cargarEmpresa();
        await cargarTiposCambio();
    };

    useEffect(() => {
        cargarDatosBasicos();
    }, []);

    const handleSeleccionarOperacion = (tipo: TipoOperacionBanco) => {
        if (tipo === "SAQUE_BANCO") {
            setModalSaque(true)
        } else if (tipo === "DEPOSITO_BANCO") {
            setModalDeposito(true);
        } else if (tipo === "TRANSFERENCIA_BANCO") {
            setModalTransferencia(true);
        };
    };

    const navigate = useNavigate();

    // Sin caja no se puede registrar un financiero: se redirige a la gestión de cajas
    useEffect(() => {
        if (!caja) {
            showAlert("Debe tener una caja abierta para consultar extracto", "warning");
            navigate("/finanzas/cajas", { replace: true });
        }
    }, [caja]);

    return (
        <>
            {loading && <Loading />}

            <PageBanner
                icon={<CornerUpLeft />}
                title="Extracto Cuenta"
                size="md"
                contentPadding={"0px"}
                headerChildren={
                    <div>
                        <BotonNuevaOperacion onSeleccionar={handleSeleccionarOperacion} />
                    </div>
                }
                children={
                    <>
                        <ExtractoFiltros
                            filtrarExtracto={cargarExtractoCuenta}
                            datosCajas={cajasAbiertas}
                            datosCuentas={cuentasActivas}
                            cargarCuentaPorId={cargarCuentaPorId}
                            cargarCajaPorId={cargarCajaPorId}
                            datosMonedas={monedasA}
                            cajaLogueada={caja}
                        />
                        <ExtractoTable
                            datosExtracto={extractoCuenta}
                            saldosAnteriores={saldosAnteriores}
                            totalesFormaPago={totalesFormaPago}
                            onCancelarAsiento={cancelarAsientoOperacion}
                            datosMonedas={monedasA}
                        />
                        <SaqueBancoModal
                            openModal={modalSaque}
                            setOpenModal={() => setModalSaque(false)}
                            cajaLogueada={caja}
                            datosCajas={cajasAbiertas}
                            datosCuentas={cuentasActivas}
                            datosMonedas={monedasA}
                            monedaBase={monedaBase}
                            datosCambios={tiposCambio}
                            fechaMovimiento={hoyISO()}
                            cargarCuentaPorId={cargarCuentaPorId}
                            recibeAsientos={registrarAsientosOperacion}
                        />
                        <DepositoBancoModal
                            openModal={modalDeposito}
                            setOpenModal={() => setModalDeposito(false)}
                            cajaLogueada={caja}
                            datosCajas={cajasAbiertas}
                            datosCuentas={cuentasActivas}
                            datosMonedas={monedasA}
                            monedaBase={monedaBase}
                            datosCambios={tiposCambio}
                            fechaMovimiento={hoyISO()}
                            cargarCuentaPorId={cargarCuentaPorId}
                            recibeAsientos={registrarAsientosOperacion}
                        />
                        <TransferenciaBancoModal
                            openModal={modalTransferencia}
                            setOpenModal={() => setModalTransferencia(false)}
                            cajaLogueada={caja}
                            datosCajas={cajasAbiertas}
                            datosCuentas={cuentasActivas}
                            datosMonedas={monedasA}
                            monedaBase={monedaBase}
                            datosCambios={tiposCambio}
                            fechaMovimiento={hoyISO()}
                            cargarCuentaPorId={cargarCuentaPorId}
                            recibeAsientos={registrarAsientosOperacion}
                        />
                    </>
                }
            />
            <GlobalTooltip />
        </>
    );
};

export default ExtractoRaiz;