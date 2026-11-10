import { useEffect, useMemo, useState, type ReactNode } from "react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import type { InterfaceCajas } from "../../cajas/Interfaces/InterfaceCajas";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import { BriefcaseBusiness, TrendingUp } from "lucide-react";
import SelectCustom from "../../../components/utils/SelectCustom";

interface InterfaceExtractoFiltros {
    filtrarExtracto: (consolidado: boolean, moneda_id: number | null, fecha_inicio: string, fecha_fin: string, entidad?: string, caja_id?: number | null, cuenta_id?: number | null) => void;
    datosCajas: InterfaceCajas[];
    datosCuentas: InterfaceCuenta[];
    cargarCuentaPorId: (id: number) => void;
    cargarCajaPorId: (id: number) => void;
    datosMonedas: InterfaceMoneda[];
    cajaLogueada: InterfaceCajas | null;
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

const ExtractoFiltros = ({ filtrarExtracto, cargarCuentaPorId, cargarCajaPorId, datosCajas, cajaLogueada, datosCuentas, datosMonedas }: InterfaceExtractoFiltros) => {

    const cajaLogueadaId = cajaLogueada ? Number(cajaLogueada.id) : null;

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

    // Única fuente de consultas: solo se dispara con filtros válidos
    useEffect(() => {
        if (!filtros.fecha_inicio || !filtros.fecha_fin) return;
        if (filtros.entidad === 'Caja' && !filtros.caja_id) return;
        if (filtros.entidad === 'Cuenta' && !filtros.cuenta_id) return;

        filtrarExtracto(
            filtros.consolidado,
            filtros.moneda_id,
            filtros.fecha_inicio,
            filtros.fecha_fin,
            filtros.entidad,
            filtros.caja_id,
            filtros.cuenta_id
        );
    }, [filtros]);

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

    const CampoCheck = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
        <div className={`flex items-center justify-between gap-3 rounded-xl border border-mi-primera/15 bg-mi-primera/[0.03] px-3 py-1.5 ${className}`}>
            <label className="text-sm font-semibold text-mi-primera">{label}</label>
            {children}
        </div>
    );

    return (
        <>
            <div className="px-2 pb-3 gap-2 grid grid-cols-12">
                <div className="grid grid-cols-1 gap-2 col-span-2">
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
                <div className="grid grid-cols-1 gap-2 col-span-7">
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
                <div className="grid grid-cols-1 gap-2 col-span-2">
                    <SelectCustom
                        options={datosMonedas.map(e => ({ value: Number(e.id), label: e.nombre }))}
                        value={filtros.moneda_id ?? 0}
                        size="mid"
                        isClearable={false}
                        disabled={!filtros.caja_id}
                        searchable={false}
                        onChange={e => setFiltros(f => ({ ...f, moneda_id: Number(e) }))}
                    />
                    <div className="flex gap-2 justify-center items-center text-sm">
                        <CampoCheck label="Considerar Apertura"
                            children={
                                <InputERP
                                    type="checkbox"
                                    size="mid"
                                    value={filtros.consolidado}
                                    onChange={e => setFiltros(f => ({ ...f, consolidado: Boolean(e) }))}
                                />
                            }
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExtractoFiltros;