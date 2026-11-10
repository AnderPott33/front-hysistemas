import { useEffect, useState } from "react";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import InputERP from "../../../components/utils/InputERP";

interface InterfaceFormInformacionGeneral {
    formInicial: InterfaceEmpresa;
    empresa: InterfaceEmpresa | null;
    recibirInfoGeneral: (empresa: InterfaceEmpresa) => void;
}

const FormInformacionGeneral = ({ formInicial, empresa, recibirInfoGeneral }: InterfaceFormInformacionGeneral) => {
    const [formInfoGeneral, setFormInfoGeneral] = useState<InterfaceEmpresa>(formInicial);

    useEffect(() => {
        if (empresa) {
            setFormInfoGeneral(empresa);
        }
    }, [empresa]);

    useEffect(() => {
        recibirInfoGeneral(formInfoGeneral)
    }, [formInfoGeneral, recibirInfoGeneral])

    return (
        <>
            <div className="p-2 grid grid-cols-2 gap-3">
                <div>
                    <div>
                        <InputERP
                            label="Fantasía"
                            type="text"
                            value={formInfoGeneral.fantasia}
                            onChange={e => setFormInfoGeneral({ ...formInfoGeneral, fantasia: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            label="E-mail"
                            type="text"
                            value={formInfoGeneral.email}
                            onChange={e => setFormInfoGeneral({ ...formInfoGeneral, email: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            label="Teléfono"
                            type="tel"
                            phoneMask="+595 ### ### ###"
                            value={formInfoGeneral.telefono}
                            onChange={e => setFormInfoGeneral({ ...formInfoGeneral, telefono: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            label="Dirección"
                            type="text"
                            value={formInfoGeneral.direccion}
                            onChange={e => setFormInfoGeneral({ ...formInfoGeneral, direccion: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            type="text"
                            label="Ciudad"
                            value={formInfoGeneral.ciudad}
                            onChange={e => setFormInfoGeneral({ ...formInfoGeneral, ciudad: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            type="text"
                            label="Departamento"
                            value={formInfoGeneral.departamento}
                            onChange={e => setFormInfoGeneral({ ...formInfoGeneral, departamento: e })}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default FormInformacionGeneral;