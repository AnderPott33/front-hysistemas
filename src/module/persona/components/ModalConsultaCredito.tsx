import { useEffect, useMemo, useState } from "react";
import { Wallet, Check } from "lucide-react";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import InputERP from "../../../components/utils/InputERP";
import Loading from "../../../components/utils/Loading";
import { showAlert } from "../../../components/utils/Procesando";
import type { InterfaceMoneda, InterfaceTipoCambio } from "../../moneda/interfaces/InterfaceMoneda";
import { useCreditoPersona } from "../hooks/useCreditoPersona";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    personaId: number;
    personaNombre: string;
    soloConsulta?: boolean;
    naturaleza?: "Credito" | "Debito";
    tipo?: string;
    movimientoId?: number | null;
    monedas: InterfaceMoneda[];
    monedaBase: InterfaceMoneda | null;
    datosCambios: InterfaceTipoCambio[];
    onConfirmado?: () => void;
}

interface LineaForm {
    valor: number;
    observacion: string;
}

/** Tasa para convertir 1 unidad de `origen` a `destino`. 0 si no existe. */
const obtenerTasa = (cambios: InterfaceTipoCambio[], origen: number, destino: number): number => {
    if (!origen || !destino) return 0;
    if (origen === destino) return 1;
    const directo = cambios.find(c => Number(c.moneda_origen) === origen && Number(c.moneda_destino) === destino);
    if (directo && Number(directo.valor) > 0) return Number(directo.valor);
    const inverso = cambios.find(c => Number(c.moneda_origen) === destino && Number(c.moneda_destino) === origen);
    if (inverso && Number(inverso.valor) > 0) return 1 / Number(inverso.valor);
    return 0;
};

const formatear = (n: number, simbolo = "") =>
    `${simbolo} ${n.toLocaleString("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`.trim();

const ModalConsultaCredito = ({
    isOpen, onClose, personaId, personaNombre, soloConsulta = false,
    naturaleza, tipo = "AJUSTE", movimientoId, monedas, monedaBase, datosCambios, onConfirmado,
}: Props) => {
    const { credito, loading, cargarCredito, guardarCredito } = useCreditoPersona();
    const [lineas, setLineas] = useState<Record<number, LineaForm>>({});

    useEffect(() => {
        if (isOpen && personaId) {
            cargarCredito(personaId);
            setLineas({});
        }
    }, [isOpen, personaId]);

    const baseId = Number(monedaBase?.id ?? 0);

    const filas = useMemo(() => {
        return monedas.map(m => {
            const id = Number(m.id);
            const saldo = credito?.saldos.find(s => s.moneda_id === id)?.saldo ?? 0;
            const tasa = obtenerTasa(datosCambios, id, baseId);
            const linea = lineas[id] ?? { valor: 0, observacion: "" };
            return {
                moneda: m,
                id,
                saldo,
                tasa,
                valor: linea.valor,
                observacion: linea.observacion,
                convertido: linea.valor * tasa,
            };
        });
    }, [monedas, credito, lineas, datosCambios, baseId]);

    const setLinea = (id: number, cambios: Partial<LineaForm>) =>
        setLineas(prev => ({ ...prev, [id]: { valor: 0, observacion: "", ...prev[id], ...cambios } }));

    const confirmar = async () => {
        if (!naturaleza) return;

        const lineasNuevas = [];
        for (const f of filas.filter(f => f.valor > 0)) {
            if (f.tasa <= 0) {
                showAlert(`No existe tipo de cambio de ${f.moneda.codigo} a ${monedaBase?.codigo ?? "base"}`, "warning");
                return;
            }
            lineasNuevas.push({
                moneda_id: f.id,
                naturaleza,
                valor: f.valor,
                cambio: f.tasa,
                observacion: f.observacion || null,
            });
        }

        if (lineasNuevas.length === 0) {
            showAlert("Ingrese al menos un valor", "warning");
            return;
        }

        const ok = await guardarCredito(personaId, lineasNuevas, tipo, movimientoId);
        if (ok) {
            onConfirmado?.();
            onClose();
        }
    };

    return (
        <ModalGeneral
            icon={<Wallet size={18} />}
            title="Consulta de Crédito"
            subtitle={personaNombre}
            isOpen={isOpen}
            onClose={onClose}
            width="780px"
            sizeBanner="sm"
            childrenPadding={false}
            footer={
                <div className="flex gap-2 justify-end items-center flex-wrap">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 font-semibold rounded-xl border border-mi-primera/20 text-mi-cuarta hover:bg-mi-primera/5"
                    >
                        {soloConsulta ? "Cerrar" : "Cancelar"}
                    </button>
                    {!soloConsulta && (
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md disabled:opacity-50"
                        >
                            <Check size={18} />
                            Confirmar
                        </button>
                    )}
                </div>
            }
        >
            {loading && <Loading />}

            <div className="p-5 grid gap-5">
                {credito?.bloqueado && (
                    <div className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Cliente bloqueado para ventas a crédito por encima del límite · Límite:{" "}
                        <span className="font-mono">{formatear(credito.limite_credito, monedaBase?.simbolo)}</span>
                    </div>
                )}

                <section>
                    <h4 className="font-semibold text-mi-cuarta mb-1">Saldo disponible en crédito</h4>
                    <p className="text-sm text-mi-cuarta/60 mb-3">
                        Saldo que <span className="text-red-500 font-semibold">usted debe</span> a la persona o que{" "}
                        <span className="text-emerald-600 font-semibold">la persona debe</span> a usted.
                    </p>
                    <div className="rounded-2xl border border-mi-primera/15 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-mi-primera/5 text-mi-cuarta/60">
                                <tr>
                                    <th className="px-4 py-2 text-left">Moneda</th>
                                    <th className="px-4 py-2 text-left">Estado</th>
                                    <th className="px-4 py-2 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mi-primera/10">
                                {filas.map(f => (
                                    <tr key={f.id}>
                                        <td className="px-4 py-2 font-semibold">{f.id} - {f.moneda.nombre}</td>
                                        <td className="px-4 py-2">
                                            {f.saldo > 0 && (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600">Usted debe</span>
                                            )}
                                            {f.saldo < 0 && (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-600">La persona debe</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono">{formatear(f.saldo, f.moneda.simbolo)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {!soloConsulta && (
                    <section>
                        <h4 className="font-semibold text-mi-cuarta mb-3">Valor de movimiento</h4>
                        <div className="rounded-2xl border border-mi-primera/15 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-mi-primera/5 text-mi-cuarta/60">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Moneda</th>
                                        <th className="px-4 py-2 text-left">Valor</th>
                                        <th className="px-4 py-2 text-left">Convertido</th>
                                        <th className="px-4 py-2 text-left">Observación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-mi-primera/10">
                                    {filas.map(f => (
                                        <tr key={f.id}>
                                            <td className="px-4 py-2 font-semibold">{f.moneda.simbolo}</td>
                                            <td className="px-4 py-2">
                                                <InputERP
                                                    type="currency"
                                                    moneda={f.moneda}
                                                    value={f.valor}
                                                    onChange={(e: any) => setLinea(f.id, { valor: Number(e) || 0 })}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <InputERP
                                                    type="currency"
                                                    moneda={monedaBase ?? undefined}
                                                    value={f.convertido}
                                                    readOnly
                                                    onChange={() => { }}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <InputERP
                                                    type="text"
                                                    placeholder="Observación"
                                                    value={f.observacion}
                                                    onChange={(e: any) => setLinea(f.id, { observacion: String(e) })}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </ModalGeneral>
    );
};

export default ModalConsultaCredito;
