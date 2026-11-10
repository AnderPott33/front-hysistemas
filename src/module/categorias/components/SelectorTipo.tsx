import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { tipoCategoria } from "../interfaces/InterfaceCategoria";

interface InterfaceSelectorTipo {
    value: tipoCategoria;
    onChange: (tipo: tipoCategoria) => void;
}

const OPCIONES: { value: tipoCategoria; label: string; icon: JSX.Element }[] = [
    { value: 'Ingreso', label: 'Ingresos', icon: <ArrowDownCircle size={18} /> },
    { value: 'Gasto', label: 'Gastos', icon: <ArrowUpCircle size={18} /> },
];

export const SelectorTipo = ({ value, onChange }: InterfaceSelectorTipo) => {
    return (
        <div className="inline-flex p-1 gap-1 rounded-2xl bg-white border border-mi-primera/15 shadow-lg shadow-mi-cuarta/10">
            {OPCIONES.map(op => {
                const activo = value === op.value;
                return (
                    <button
                        key={op.value}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => onChange(op.value)}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] ${
                            activo
                                ? 'bg-mi-gradient text-white shadow-md shadow-mi-tercera/30'
                                : 'text-mi-cuarta hover:bg-mi-primera/10'
                        }`}
                    >
                        {op.icon}
                        {op.label}
                    </button>
                );
            })}
        </div>
    );
};

export default SelectorTipo;
