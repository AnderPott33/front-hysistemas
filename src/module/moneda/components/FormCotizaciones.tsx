import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import InputERP from "../../../components/utils/InputERP";
import SelectCustom from "../../../components/utils/SelectCustom";
import { usePermisos } from "../../../context/PermisosContext";
import { Flag } from "../../../context/FlagsContext";
import { formatarDataInput } from "../../../components/utils/Formatadores";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../interfaces/InterfaceMoneda";

interface InterfaceFormCotizaciones {
    cotizacionSelect: InterfaceTipoCambio | null;
    datosMonedas: InterfaceMoneda[];
    datosCotizaciones: InterfaceTipoCambio[];
    guardarCotizacion: (data: any[]) => Promise<void>;
    obtenerCotizacion: (origen: string, destino: string) => Promise<number | null>;
}

// Pares que aparecen por defecto en un registro nuevo (origen, destino)
const PARES_DEFAULT: [string, string][] = [
    ["USD", "PYG"],
    ["BRL", "PYG"],
    ["USD", "BRL"],
];

const SIMBOLO: Record<string, string> = { USD: "$", BRL: "R$", PYG: "Gs" };

type Par = { origen: number; destino: number };

const FormCotizaciones = ({
    cotizacionSelect,
    datosMonedas,
    datosCotizaciones,
    guardarCotizacion,
    obtenerCotizacion,
}: InterfaceFormCotizaciones) => {
    const { tienePermiso } = usePermisos();
    const puedeAgregar = tienePermiso("puede_agregar_cotizacion");
    const puedeEditar = tienePermiso("puede_editar_cotizacion");
    const puedeGuardar = puedeAgregar || puedeEditar;

    const porCodigo = (codigo: string) => datosMonedas.find(m => m.codigo === codigo);
    const buscar = (id: number) => datosMonedas.find(m => m.id === id);
    const clave = (o: number, d: number) => `${o}-${d}`;

    const paresDefault = (): Par[] =>
        PARES_DEFAULT
            .map(([o, d]) => {
                const origen = porCodigo(o);
                const destino = porCodigo(d);
                return origen && destino ? { origen: origen.id, destino: destino.id } : null;
            })
            .filter(Boolean) as Par[];

    const [pares, setPares] = useState<Par[]>([]);
    const [valores, setValores] = useState<Record<string, any>>({});
    // Cotizaciones existentes del conjunto que se edita, indexadas por par
    const [existentes, setExistentes] = useState<Record<string, InterfaceTipoCambio>>({});
    const [nuevoOrigen, setNuevoOrigen] = useState<number | undefined>();
    const [nuevoDestino, setNuevoDestino] = useState<number | undefined>();

    // Pares con una consulta a la API en curso, para no repetir llamadas
    const pendientes = useRef<Set<string>>(new Set());

    // Carga el conjunto al editar, o los pares por defecto al crear
    useEffect(() => {
        if (cotizacionSelect) {
            const fecha = formatarDataInput(cotizacionSelect.fecha);
            const grupo = datosCotizaciones.filter(c => formatarDataInput(c.fecha) === fecha);
            const lista = grupo.some(c => Number(c.id) === Number(cotizacionSelect.id))
                ? grupo
                : [...grupo, cotizacionSelect];

            const nuevosPares: Par[] = [];
            const nuevosValores: Record<string, any> = {};
            const nuevosExistentes: Record<string, InterfaceTipoCambio> = {};

            lista.forEach(c => {
                const o = Number(c.moneda_origen);
                const d = Number(c.moneda_destino);
                const k = clave(o, d);
                if (!nuevosPares.some(p => p.origen === o && p.destino === d)) {
                    nuevosPares.push({ origen: o, destino: d });
                }
                nuevosValores[k] = Number(c.valor);
                nuevosExistentes[k] = c;
            });

            setPares(nuevosPares);
            setValores(nuevosValores);
            setExistentes(nuevosExistentes);
        } else {
            setPares(paresDefault());
            setValores({});
            setExistentes({});
        }
    }, [cotizacionSelect, datosMonedas.length, datosCotizaciones]);

    // Consulta a la API los pares que no tienen valor todavía
    useEffect(() => {
        pares.forEach(p => {
            const k = clave(p.origen, p.destino);
            if (existentes[k] || valores[k] !== undefined || pendientes.current.has(k)) return;

            const codigoOrigen = buscar(p.origen)?.codigo;
            const codigoDestino = buscar(p.destino)?.codigo;
            if (!codigoOrigen || !codigoDestino) return;

            pendientes.current.add(k);
            obtenerCotizacion(codigoOrigen, codigoDestino)
                .then(valor => {
                    if (valor !== null) {
                        // Solo rellena si el usuario no escribió nada mientras tanto
                        setValores(prev => (prev[k] === undefined ? { ...prev, [k]: valor } : prev));
                    }
                })
                .catch(err => console.error(`Error al obtener cotización ${codigoOrigen}-${codigoDestino}`, err))
                .finally(() => pendientes.current.delete(k));
        });
    }, [pares, existentes]);

    const agregarPar = () => {
        if (!nuevoOrigen || !nuevoDestino || nuevoOrigen === nuevoDestino) return;
        const existe = pares.some(p => p.origen === nuevoOrigen && p.destino === nuevoDestino);
        if (!existe) setPares([...pares, { origen: nuevoOrigen, destino: nuevoDestino }]);
        setNuevoOrigen(undefined);
        setNuevoDestino(undefined);
    };

    const quitarPar = (o: number, d: number) => {
        const k = clave(o, d);
        setPares(prev => prev.filter(p => !(p.origen === o && p.destino === d)));
        setValores(prev => {
            const copia = { ...prev };
            delete copia[k];
            return copia;
        });
        setExistentes(prev => {
            const copia = { ...prev };
            delete copia[k];
            return copia;
        });
    };

    const guardarTodos = async () => {
        const hoy = formatarDataInput(new Date());
        const items = pares
            .filter(p => Number(valores[clave(p.origen, p.destino)]) > 0)
            .map(p => {
                const k = clave(p.origen, p.destino);
                const existente = existentes[k];
                return {
                    id: existente ? Number(existente.id) : '',
                    moneda_origen: p.origen,
                    moneda_destino: p.destino,
                    valor: valores[k],
                    fecha: existente ? formatarDataInput(existente.fecha) : hoy,
                    activo: existente ? Boolean(existente.activo) : true,
                };
            });
        await guardarCotizacion(items);
    };

    const hayValores = pares.some(p => Number(valores[clave(p.origen, p.destino)]) > 0);
    const editando = cotizacionSelect
        ? clave(Number(cotizacionSelect.moneda_origen), Number(cotizacionSelect.moneda_destino))
        : null;

    const opciones = (lista: InterfaceMoneda[]) =>
        lista.map(e => ({
            value: e.id,
            label: (
                <div className="flex items-center gap-2">
                    <Flag className="rounded-sm border border-mi-primera" country={e.codigo as 'PYG'} size={20} />
                    <span>{e.nombre}</span>
                </div>
            ),
        }));

    return (
        <div className="space-y-4">
            <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-mi-primera/5 text-mi-cuarta/60">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Par de Monedas</th>
                                <th className="px-6 py-3 font-semibold">Moneda Origen</th>
                                <th className="px-6 py-3 font-semibold">Moneda Destino</th>
                                <th className="px-6 py-3 font-semibold">Valor</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-mi-primera/10">
                            {pares.map(p => {
                                const origen: InterfaceMoneda | undefined = buscar(p.origen);
                                const destino: InterfaceMoneda | undefined = buscar(p.destino);
                                if (!origen || !destino) return null;
                                const k = clave(p.origen, p.destino);
                    
                                
                                const esEditando = k === editando;
                                return (
                                    <tr key={k} className={esEditando ? "bg-mi-primera/10" : "hover:bg-mi-primera/5"}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Flag className="rounded-sm border border-mi-primera" country={origen.codigo as 'PYG'} size={32} />
                                                <span className="text-mi-cuarta/50">x</span>
                                                <Flag className="rounded-sm border border-mi-primera" country={destino.codigo as 'PYG'} size={32} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-mi-cuarta">{origen.nombre}</span>{" "}
                                            <span className="text-mi-cuarta/50">({SIMBOLO[origen.simbolo] ?? origen.simbolo})</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-mi-cuarta">{destino.nombre}</span>{" "}
                                            <span className="text-mi-cuarta/50">({SIMBOLO[destino.simbolo] ?? destino.simbolo})</span>
                                        </td>
                                        <td className="px-6 py-4 min-w-[180px]">
                                            <InputERP
                                                type="currency"
                                                moneda={destino}
                                                disabled={!puedeGuardar}
                                                value={valores[k] ?? 0}
                                                onChange={(e: any) => setValores(prev => ({ ...prev, [k]: e }))}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => quitarPar(p.origen, p.destino)}
                                                disabled={!puedeGuardar}
                                                className="p-2 rounded-lg text-mi-cuarta/50 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                title="Quitar par"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Agregar otro par */}
            {datosMonedas.length >= 2 && (
                <div className="rounded-3xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10 p-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                    <SelectCustom
                        label="Otra moneda origen"
                        isClearable
                        disabled={!puedeGuardar}
                        options={opciones(datosMonedas)}
                        value={nuevoOrigen}
                        onChange={e => setNuevoOrigen(Number(e))}
                    />
                    <SelectCustom
                        label="Otra moneda destino"
                        isClearable
                        disabled={!puedeGuardar}
                        options={opciones(datosMonedas)}
                        value={nuevoDestino}
                        onChange={e => setNuevoDestino(Number(e))}
                    />
                    <button
                        type="button"
                        onClick={agregarPar}
                        disabled={!puedeGuardar || !nuevoOrigen || !nuevoDestino}
                        className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-white text-mi-cuarta border border-mi-primera/20 hover:bg-mi-primera/10 disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Agregar par
                    </button>
                </div>
            )}

            {/* Acción */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={guardarTodos}
                    disabled={!puedeGuardar || !hayValores}
                    className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                    <Plus size={18} />
                    {cotizacionSelect ? "Actualizar cotizaciones" : "Guardar cotizaciones"}
                </button>
            </div>
        </div>
    );
}

export default FormCotizaciones;