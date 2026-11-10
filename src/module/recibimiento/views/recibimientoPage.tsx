import PageBanner from "../../../components/utils/Banner";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { CornerUpLeft } from "lucide-react";
import FormFinanciero from "../components/FormFinanciero";

const RecibimientoPage = () => {

    return (
        <>
            <PageBanner
                icon={<CornerUpLeft />}
                title="Recibir Valores"
                subtitle="Registre los recebimientos de valores"
                size="md"
                contentPadding={'0px'}
                children={
                    <>
                        <FormFinanciero />
                    </>
                }
            />
            <GlobalTooltip />
        </>
    );
}

export default RecibimientoPage;
