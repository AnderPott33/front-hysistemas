import { useState } from "react";

import { BookAlert, Home, Info } from "lucide-react";
import PageBanner from "../components/utils/Banner";

const Dashboard = () => {

    return (
        <>
            <PageBanner
                icon={<Home />}
                title="Dashboard"
                subtitle="Visualice un panorama del estado de la empresa"
                size="md"
                children={
                    <>
                        <p className="text-mi-primera italic text-center px-3 flex justify-center items-center gap-2 py-2 bg-mi-primera/15 rounded-2xl"> <BookAlert size={25} /> Aqui estarán datos gerenciales</p>
                    </>
                }
            />
        </>
    )
};

export default Dashboard;
