import PageBanner from "../../../components/utils/Banner";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { CornerUpLeft, CornerUpRight } from "lucide-react";
import FormFinanciero from "../components/FormFinanciero";

const PagoPage = () => {

    return (
        <>
            <PageBanner
                icon={<CornerUpRight />}
                title="Pagar Valores"
                subtitle="Registre los pagos de valores"
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

export default PagoPage;
