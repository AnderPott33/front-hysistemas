import { ShoppingCart, PlusCircle, List } from "lucide-react";
import PageBanner from "../../../components/utils/Banner";

import { usePermisos } from "../../../context/PermisosContext";
import { useNavigate } from "react-router-dom";
/* import FormsTransaccion from "../components/FormsTransaccion"; */

const ComprasPage = () => {
    const navigate = useNavigate();

    // Verificación de Privilegios
    const { tienePermiso } = usePermisos();
    const puedeVerPagina = tienePermiso("pagina_ventas");
    const puedeAgregar = tienePermiso("agregar_venta");
    const puedeEditar = tienePermiso("editar_venta");

    const puedeGuardar = puedeEditar || puedeAgregar;

    if (!puedeVerPagina) {
        navigate("/dashboard");
        return null;
    }

    return (
        <>
            <PageBanner
                icon={<ShoppingCart />}
                title="Compras"
                size="md"
                subtitle="Registre y gestione sus compras"
                /*children={

                     <FormsTransaccion /> 
                }*/
            />

        </>
    );
};

export default ComprasPage;