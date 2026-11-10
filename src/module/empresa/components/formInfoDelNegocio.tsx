import { useEffect, useState } from "react";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import InputERP from "../../../components/utils/InputERP";
import { useMoneda } from "../../moneda/hooks/useMoneda";
import SelectCustom from "../../../components/utils/SelectCustom";
import { Flag } from "../../../context/FlagsContext";
import { useAuth } from "../../../context/AuthContext";

interface InterfaceFormInformacionDelNegocio {
    formInicial: InterfaceEmpresa;
    empresa: InterfaceEmpresa | null;
    recibirInfoDelNegocio: (empresa: InterfaceEmpresa) => void;
}

const FormInformacionDelNegocio = ({ formInicial, empresa, recibirInfoDelNegocio }: InterfaceFormInformacionDelNegocio) => {

    const { isAdmin } = useAuth()

    const [formInfoDelNegocio, setFormInfoDelNegocio] = useState<InterfaceEmpresa>(formInicial);
    const { monedasA, cargarMonedasActivas } = useMoneda()

    const cargar = async () => {
        await cargarMonedasActivas()
    }
    useEffect(() => {
        cargar()
    }, [])

    // ✅ Cuando empresa se carga, carga los datos locales
    useEffect(() => {
        if (empresa) {
            setFormInfoDelNegocio(empresa);
        }
    }, [empresa]);

    // ✅ Cuando el form local cambia, notifica al padre
    useEffect(() => {
        recibirInfoDelNegocio(formInfoDelNegocio)
    }, [formInfoDelNegocio, recibirInfoDelNegocio])


    return (
        <>
            <div className="p-2 grid grid-cols-2 gap-3">
                <div>
                    <div>
                        <InputERP
                            label="Razón Social"
                            type="text"
                            value={formInfoDelNegocio.razon_social}
                            onChange={e => setFormInfoDelNegocio({ ...formInfoDelNegocio, razon_social: e })}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <InputERP
                            label="RUC"
                            type="text"
                            value={formInfoDelNegocio.ruc}
                            onChange={e => setFormInfoDelNegocio({ ...formInfoDelNegocio, ruc: e })}
                        />
                    </div>
                </div>
                <div>
                    <div
                    data-tooltip={!isAdmin ? 'Solo usuario master puede alterar la moneda base' : ''}
                    >
                        <SelectCustom
                            label="Moneda Base"
                            options={monedasA.map(e => ({
                                value: e.id,
                                label: (
                                    <div className="flex items-center gap-2">
                                        <Flag
                                            className="rounded-sm border border-mi-tercera"
                                            country={e.codigo as 'PYG'}
                                            size={20}
                                        />
                                        <span>{e.nombre}</span>
                                    </div>
                                )
                            }))}
                            isClearable={false}
                            disabled={!isAdmin}
                            
                            value={formInfoDelNegocio.moneda_base}
                            onChange={e => setFormInfoDelNegocio({
                                ...formInfoDelNegocio,
                                moneda_base: Number(e)
                            })}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default FormInformacionDelNegocio;
