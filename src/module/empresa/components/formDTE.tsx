import { useEffect, useState } from "react";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import InputERP from "../../../components/utils/InputERP";

interface InterfaceFormDTE {
    formInicial: InterfaceEmpresa;
    empresa: InterfaceEmpresa | null;
    recibirDTE: (empresa: InterfaceEmpresa) => void;
}

const FormDTE = ({ formInicial, empresa, recibirDTE }: InterfaceFormDTE) => {

    const [formDTE, setFormDTE] = useState<InterfaceEmpresa>(formInicial);

    // ✅ Cuando empresa se carga, carga los datos locales
    useEffect(() => {
        if (empresa) {
            setFormDTE(empresa);
        }
    }, [empresa]);

    // ✅ Cuando el form local cambia, notifica al padre
    useEffect(() => {
        recibirDTE(formDTE)
    }, [formDTE, recibirDTE])


    return (
        <>
            <div className="p-2 grid grid-cols-2 gap-3">
                <div>
                    <div>
                        <InputERP
                            label="Id CSC"
                            type="number"
                            value={formDTE.id_csc}
                            onChange={e => setFormDTE({ ...formDTE, id_csc: Number(e) })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            label="CSC"
                            type="text"
                            value={formDTE.csc}
                            onChange={e => setFormDTE({ ...formDTE, csc: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            label="Contraseña Certificado"
                            type="password"
                            value={formDTE.contrasena_certificado}
                            onChange={e => setFormDTE({ ...formDTE, contrasena_certificado: e })}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default FormDTE;
