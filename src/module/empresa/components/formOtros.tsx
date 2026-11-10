import { useEffect, useState } from "react";
import type { InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import SelectCustom from "../../../components/utils/SelectCustom";
import { usePersona } from "../../persona/hooks/usePersona";
import { useOperacion } from "../../operaciones/hooks/useOperacion";
import { useThemeColor } from "../../../theme/useThemeColor";
import ThemePicker from "../../../theme/ThemePicker";
import ThemeAdminPanel from "../../../theme/ThemeAdminPanel";

interface InterfaceFormOtros {
    formInicial: InterfaceEmpresa;
    empresa: InterfaceEmpresa | null;
    recibirOtros: (empresa: InterfaceEmpresa) => void;
}

const FormOtros = ({ formInicial, empresa, recibirOtros }: InterfaceFormOtros) => {
    const { color, changeColor } = useThemeColor();

    const { personas, cargarPersonas } = usePersona();
    const { operaciones, cargarOperaciones } = useOperacion();

    const operacionesCompras = operaciones.filter(e => e.modulo === 'Compra');
    const operacionesVentas = operaciones.filter(e => e.modulo === 'Venta');
    const operacionesGastos = operaciones.filter(e => e.modulo === 'Gasto');
    const operacionesIngresos = operaciones.filter(e => e.modulo === 'Ingreso');

    const [formOtros, setFormOtros] = useState<InterfaceEmpresa>(formInicial);

    useEffect(() => {
        cargarPersonas();
        cargarOperaciones();
    }, []);

    // Cuando empresa se carga, carga los datos locales
    useEffect(() => {
        if (empresa) {
            setFormOtros(empresa);
        }
    }, [empresa]);

    // Cuando el form local cambia, notifica al padre
    useEffect(() => {
        recibirOtros(formOtros);
    }, [formOtros, recibirOtros]);

    return (
        <>
            <div className="p-2 grid grid-cols-2 gap-3">
                <div>
                    <SelectCustom
                        label="Régimen Contable"
                        options={[
                            { value: 'Regime Productor Pequeno Porte', label: 'Regime Productor Pequeno Porte' },
                            { value: 'Regime Productor Medio Porte', label: 'Regime Productor Medio Porte' },
                            { value: 'Regime Contabil', label: 'Regime Contabil' },
                        ]}
                        value={formOtros.regimen_contable}
                        isClearable={false}
                        searchable={false}
                        onChange={e => setFormOtros({ ...formOtros, regimen_contable: String(e) })}
                    />
                </div>

                <div>
                    <SelectCustom
                        label="Cliente Predeterminado"
                        options={personas.map(e => ({ value: Number(e.id), label: e.nombre }))}
                        value={Number(formOtros.cliente_predeterminado)}
                        onChange={e => setFormOtros({ ...formOtros, cliente_predeterminado: Number(e) })}
                    />
                </div>

                <div>
                    <SelectCustom
                        label="Operación Predeterminada Compra"
                        options={operacionesCompras.map(e => ({ value: Number(e.id), label: e.descripcion }))}
                        value={Number(formOtros.operacion_preseleccionada_compra)}
                        onChange={e => setFormOtros({ ...formOtros, operacion_preseleccionada_compra: Number(e) })}
                    />
                </div>

                <div>
                    <SelectCustom
                        label="Operación Predeterminada Venta"
                        options={operacionesVentas.map(e => ({ value: Number(e.id), label: e.descripcion }))}
                        value={Number(formOtros.operacion_preseleccionada_venta)}
                        onChange={e => setFormOtros({ ...formOtros, operacion_preseleccionada_venta: Number(e) })}
                    />
                </div>

                <div>
                    <SelectCustom
                        label="Operación Predeterminada Gasto"
                        options={operacionesGastos.map(e => ({ value: Number(e.id), label: e.descripcion }))}
                        value={Number(formOtros.operacion_preseleccionada_gasto)}
                        onChange={e => setFormOtros({ ...formOtros, operacion_preseleccionada_gasto: Number(e) })}
                    />
                </div>

                <div>
                    <SelectCustom
                        label="Operación Predeterminada Ingreso"
                        options={operacionesIngresos.map(e => ({ value: Number(e.id), label: e.descripcion }))}
                        value={Number(formOtros.operacion_preseleccionada_ingreso)}
                        onChange={e => setFormOtros({ ...formOtros, operacion_preseleccionada_ingreso: Number(e) })}
                    />
                </div>

                <div>
                    <SelectCustom
                        label="Operación Predeterminada Nota Físcal"
                        options={operacionesVentas.map(e => ({ value: Number(e.id), label: e.descripcion }))}
                        value={Number(formOtros.operacion_preseleccionada_nota_fiscal)}
                        onChange={e => setFormOtros({ ...formOtros, operacion_preseleccionada_nota_fiscal: Number(e) })}
                    />
                </div>
            </div>

            <div className="p-2 mt-4 flex flex-col gap-4">
                {/* Solo se muestra si es usuario maestro */}
                <ThemeAdminPanel color={color} />
            </div>
        </>
    );
};

export default FormOtros;