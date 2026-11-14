import { useEffect } from "react";
import { useExtractoCategoria } from "../hooks/useExtractoCategoria";
import ExtractoFiltros from "./extractoFiltros";
import { useCajas } from "../../cajas/hooks/useCajas";
import { useCuentas } from "../../cuentas/hooks/useCuentas";
import { useMoneda } from "../../moneda/hooks/useMoneda";
import { useCaja } from "../../../context/CajaContext";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import Loading from "../../../components/utils/Loading";
import { CornerUpLeft, Tags } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../components/utils/Procesando";
import type { FiltrosInformeSubcategorias } from "../services/extractoCategoriaService";

const ExtractoRaiz = () => {
    const { generarInformeSubcategorias, generarInformeDRE, loading } = useExtractoCategoria();
    const { cajas, cargarCajas, cargarCajaPorId } = useCajas();
    const { caja } = useCaja();
    const { cuentas, cargarCuentas, cargarCuentaPorId } = useCuentas();
    const { monedasA, cargarMonedasActivas } = useMoneda();

    const cajasAbiertas = cajas;
    const cuentasActivas = cuentas.filter(e => e.activo);

    useEffect(() => {
        cargarCajas();
        cargarCuentas();
        cargarMonedasActivas();
    }, []);

    const navigate = useNavigate();

    // Sin caja no se puede consultar: se redirige a la gestión de cajas
    useEffect(() => {
        if (!caja) {
            showAlert("Debe tener una caja abierta para consultar el extracto", "warning");
            navigate("/finanzas/cajas", { replace: true });
        }
    }, [caja]);

    const handleGenerarInforme = async (filtros: FiltrosInformeSubcategorias) => {
        try {
            await generarInformeSubcategorias(filtros);
        } catch (error) {
            console.error(error);
            showAlert("No se pudo generar el informe", "error");
        }
    };

    const handleGenerarDRE = async (anio: number, moneda_id: number | null) => {
        if (!moneda_id) return;
        try {
            await generarInformeDRE({ sucursal_id: null, moneda_id, anio });
        } catch (error) {
            console.error(error);
            showAlert("No se pudo generar el DRE", "error");
        }
    };

    return (
        <>
            {loading && <Loading />}

            <PageBanner
                icon={<Tags />}
                title="Extracto por Categoría"
                size="md"
                contentPadding={"0px"}
                children={
                    <ExtractoFiltros
                        datosCajas={cajasAbiertas}
                        datosCuentas={cuentasActivas}
                        cargarCuentaPorId={cargarCuentaPorId}
                        cargarCajaPorId={cargarCajaPorId}
                        datosMonedas={monedasA}
                        cajaLogueada={caja}
                        onGenerarInforme={handleGenerarInforme}
                        onGenerarDRE={handleGenerarDRE}
                    />
                }
            />
            <GlobalTooltip />
        </>
    );
};

export default ExtractoRaiz;
