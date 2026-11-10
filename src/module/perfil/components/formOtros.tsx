import { useEffect, useState } from "react";
import SelectCustom from "../../../components/utils/SelectCustom";
import { usePersona } from "../../persona/hooks/usePersona";
import { useOperacion } from "../../operaciones/hooks/useOperacion";
import { useThemeColor } from "../../../theme/useThemeColor";
import ThemePicker from "../../../theme/ThemePicker";
import ThemeAdminPanel from "../../../theme/ThemeAdminPanel";
import { usePermisos } from "../../../context/PermisosContext";
import type { InterfacePerfil } from "../interfaces/interfacePerfil";

interface InterfaceFormOtros {
    formInicial: InterfacePerfil;
    empresa: InterfacePerfil | null;
    recibirOtros: (empresa: InterfacePerfil) => void;
}

const FormOtros = ({ formInicial, empresa, recibirOtros }: InterfaceFormOtros) => {
    const { color, changeColor } = useThemeColor();

    const { personas, cargarPersonas } = usePersona();
    const { operaciones, cargarOperaciones } = useOperacion();

    const [formOtros, setFormOtros] = useState<InterfacePerfil>(formInicial);

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

    const { tienePermiso } = usePermisos();
    const puedeAlterarColor = tienePermiso("perfil_altera_color_del_sistema");

    return (
        <>
            <div className="p-2 grid grid-cols-2 gap-3">
                {/*  <div>
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
                </div>*/}
            </div>

            <div data-tooltip={`${!puedeAlterarColor ? 'No posees privilegios suficientes para esta acción' : ''}`} className="p-2 mt-4 flex flex-col gap-4">
                <section className="p-6 bg-white rounded-2xl">
                    <h2 className="text-mi-cuarta font-semibold mb-4">Color del tema</h2>
                    <ThemePicker disabled={!puedeAlterarColor} color={color} onChange={changeColor} />
                </section>
                <span className="italic text-mi-primera">Una vez aplicado el cambio recarge el sistema para asegurar los cambios</span>
            </div>
        </>
    );
};

export default FormOtros;