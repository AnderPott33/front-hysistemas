import { useEffect, useMemo, useState, type ReactNode } from "react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import type { InterfaceCajas } from "../../cajas/Interfaces/InterfaceCajas";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import { BriefcaseBusiness, CalendarRange, FileText, TrendingUp, Settings2 } from "lucide-react";
import SelectCustom from "../../../components/utils/SelectCustom";

interface InterfaceExtractoFiltros {
    datosCajas: InterfaceCajas[];
    datosCuentas: InterfaceCuenta[];
    cargarCuentaPorId: (id: number) => void;
    cargarCajaPorId: (id: number) => void;
    datosMonedas: InterfaceMoneda[];
    cajaLogueada: InterfaceCajas | null;
    onGenerarInforme?: (filtros: FiltrosExtracto) => void;
    onGenerarDRE?: (anio: number, moneda_id: number | null) => void;
}

interface FiltrosExtracto {
    moneda_id: number | null;
    entidad: 'Caja' | 'Cuenta';
    caja_id: number | null;
    cuenta_id: number | null;
    fecha_inicio: string;
    fecha_fin: string;
    consolidado: boolean;
}

const fechaHoyLocal = (): string => {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
};

const FILTROS_INICIALES: FiltrosExtracto = {
    moneda_id: 1,
    entidad: 'Caja',
    caja_id: null,
    cuenta_id: null,
    fecha_inicio: '',
    fecha_fin: '',
    consolidado: false,
};

const construirFiltrosIniciales = (cajaId: number | null): FiltrosExtracto => {
    const hoy = fechaHoyLocal();
    return {
        ...FILTROS_INICIALES,
        entidad: 'Caja',
        caja_id: cajaId,
        cuenta_id: null,
        fecha_inicio: hoy,
        fecha_fin: hoy,
    };
};

// Encabezado de cada bloque de filtros
const SeccionTitulo = ({ icon, titulo }: { icon: ReactNode; titulo: string }) => (
    <div className="flex items-center gap-2 mb-3">
        <span className="text-mi-primera/70">{icon}</span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-mi-primera/70">{titulo}</h3>
    </div>
);

// Fila con etiqueta a la izquierda y control a la derecha (definido fuera del componente para no remontarlo en cada render)
const CampoCheck = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-mi-primera/15 bg-mi-primera/[0.03] px-3 py-2">
        <label className="text-sm font-semibold text-mi-primera">{label}</label>
        {children}
    </div>
);

const ExtractoFiltros = ({ cargarCuentaPorId, cargarCajaPorId, datosCajas, cajaLogueada, datosCuentas, datosMonedas, onGenerarInforme, onGenerarDRE }: InterfaceExtractoFiltros) => {

    const cajaLogueadaId = cajaLogueada ? Number(cajaLogueada.id) : null;

    const [anioDRE, setAnioDRE] = useState<number>(() => new Date().getFullYear());

    // Estado inicial ya armado: la primera consulta sale con los filtros correctos
    const [filtros, setFiltros] = useState<FiltrosExtracto>(() =>
        construirFiltrosIniciales(cajaLogueadaId)
    );

    // Si la caja logueada llega después del primer render, la sincronizamos
    useEffect(() => {
        if (cajaLogueadaId === null) return;
        setFiltros(f => ({
            ...f,
            entidad: 'Caja',
            caja_id: cajaLogueadaId,
            cuenta_id: null,
        }));
    }, [cajaLogueadaId]);

    // Cuentas
    const seleccionarCuenta = (cuenta: InterfaceCuenta) => {
        setFiltros(f => ({
            ...f,
            entidad: 'Cuenta',
            cuenta_id: Number(cuenta.id),
            caja_id: null,
            moneda_id: cuenta.moneda?.id ? Number(cuenta.moneda.id) : f.moneda_id,
        }));
    };

    // Memorizadas para que InputERP no resincronice el texto en cada render
    const opcionesCuenta = useMemo<SearchOption[]>(
        () => [...datosCuentas]
            .sort((a, b) => Number(a.id) - Number(b.id))
            .map(c => ({ id: c.id, texto: `${c.nombre}` })),
        [datosCuentas]
    );

    const handleSelectCuenta = (option: SearchOption) => {
        const cuenta = datosCuentas.find(c => String(c.id) === String(option.id));
        if (cuenta) seleccionarCuenta(cuenta);
        cargarCuentaPorId(Number(option.id));
    };

    // Cajas
    const seleccionarCaja = (caja: InterfaceCajas) => {
        setFiltros(f => ({
            ...f,
            entidad: 'Caja',
            caja_id: Number(caja.id),
            cuenta_id: null,
            moneda_id: 1,
        }));
    };

    const opcionesCaja = useMemo<SearchOption[]>(
        () => [...datosCajas]
            .sort((a, b) => Number(a.id) - Number(b.id))
            .map(c => ({ id: c.id, texto: `${c.descripcion}` })),
        [datosCajas]
    );

    const handleSelectCaja = (option: SearchOption) => {
        const caja = datosCajas.find(c => String(c.id) === String(option.id));
        if (caja) seleccionarCaja(caja);
        cargarCajaPorId(Number(option.id));
    };

    // Al escribir en un campo se limpia siempre el otro, aunque el texto no sea un id
    const onChangeCaja = (e: any) => {
        const id = Number(e) || null;
        setFiltros(f => ({ ...f, caja_id: id, cuenta_id: null }));
    };

    const onChangeCuenta = (e: any) => {
        const id = Number(e) || null;
        setFiltros(f => ({ ...f, cuenta_id: id, caja_id: null }));
    };

    const informeDisponible = !!filtros.fecha_inicio && !!filtros.fecha_fin;
    const dreDisponible = !!anioDRE && !!filtros.moneda_id;

    return (
        <div className="mx-2 mb-3 rounded-2xl border border-mi-primera/15 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

                {/* Período */}
                <section className="lg:col-span-3">
                    <SeccionTitulo icon={<CalendarRange size={15} />} titulo="Período" />
                    <div className="grid grid-cols-1 gap-3">
                        <InputERP
                            label="Fecha Inicial"
                            type="date"
                            size="mid"
                            value={filtros.fecha_inicio}
                            onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e }))}
                        />
                        <InputERP
                            label="Fecha Final"
                            type="date"
                            size="mid"
                            value={filtros.fecha_fin}
                            onChange={e => setFiltros(f => ({ ...f, fecha_fin: e }))}
                        />
                    </div>
                </section>

                {/* Origen */}
                <section className="lg:col-span-5">
                    <SeccionTitulo icon={<BriefcaseBusiness size={15} />} titulo="Origen de fondos" />
                    <div className="grid grid-cols-1 gap-3">
                        <InputERP
                            type="searchNumber"
                            label="Caja"
                            size="mid"
                            icon={<BriefcaseBusiness size={18} />}
                            value={filtros.caja_id ?? ''}
                            onChange={onChangeCaja}
                            searchOptions={opcionesCaja}
                            searchColumns={[
                                { key: "id", label: "CÓDIGO", width: "100px" },
                                { key: "texto", label: "DESCRIPCIÓN", width: "1fr" },
                            ]}
                            onSelectOption={handleSelectCaja}
                            displayMode="id-text"
                            searchMinChars={1}
                            placeholder="Seleccione la caja"
                        />
                        <InputERP
                            type="searchNumber"
                            label="Cuenta Banco"
                            size="mid"
                            icon={<TrendingUp size={18} />}
                            value={filtros.cuenta_id ?? ''}
                            onChange={onChangeCuenta}
                            searchOptions={opcionesCuenta}
                            searchColumns={[
                                { key: "id", label: "CÓDIGO", width: "100px" },
                                { key: "texto", label: "NOMBRE", width: "1fr" },
                            ]}
                            onSelectOption={handleSelectCuenta}
                            displayMode="id-text"
                            searchMinChars={1}
                            placeholder="Seleccione la cuenta banco"
                        />
                    </div>
                </section>

                {/* Opciones */}
                <section className="lg:col-span-4">
                    <SeccionTitulo icon={<Settings2 size={15} />} titulo="Opciones" />
                    <div className="grid grid-cols-1 gap-3">
                        <SelectCustom
                            options={datosMonedas.map(e => ({ value: Number(e.id), label: e.nombre }))}
                            value={filtros.moneda_id ?? 0}
                            size="mid"
                            isClearable={false}
                            disabled={Boolean(filtros.cuenta_id)}
                            searchable={false}
                            onChange={e => setFiltros(f => ({ ...f, moneda_id: Number(e) }))}
                        />
                        <CampoCheck label="Considerar Apertura">
                            <InputERP
                                type="checkbox"
                                size="mid"
                                value={filtros.consolidado}
                                onChange={e => setFiltros(f => ({ ...f, consolidado: Boolean(e) }))}
                            />
                        </CampoCheck>
                    </div>
                </section>
            </div>

            {/* Acciones */}
            {(onGenerarInforme || onGenerarDRE) && (
                <div className="mt-5 flex flex-col gap-3 border-t border-mi-primera/10 pt-4 sm:flex-row sm:items-end sm:justify-end">

                    {onGenerarDRE && (
                        <div className="flex items-end gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-mi-primera/70">Año</label>
                                <input
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={anioDRE}
                                    onChange={e => setAnioDRE(Number(e.target.value))}
                                    className="h-9 w-24 rounded-xl border border-mi-primera/20 bg-white px-3 text-sm text-mi-primera focus:border-mi-primera focus:outline-none focus:ring-2 focus:ring-mi-primera/15"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => onGenerarDRE(anioDRE, filtros.moneda_id)}
                                disabled={!dreDisponible}
                                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-mi-primera bg-white px-4 text-sm font-semibold text-mi-primera transition-all duration-200 hover:bg-mi-primera/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FileText size={16} />
                                DRE mensual
                            </button>
                        </div>
                    )}

                    {onGenerarInforme && (
                        <button
                            type="button"
                            onClick={() => onGenerarInforme(filtros)}
                            disabled={!informeDisponible}
                            className="flex h-9 items-center justify-center gap-2 rounded-xl border border-mi-primera bg-mi-primera px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-mi-primera/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileText size={16} />
                            Generar informe
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExtractoFiltros;