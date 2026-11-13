import type { InterfaceMoneda } from "../../module/moneda/interfaces/InterfaceMoneda";

interface SelectorMonedaProps {
    label?: string;
    monedas: InterfaceMoneda[];
    monedaId: number;
    disabled?: boolean;
    onChange: (monedaId: number) => void;
}

const SelectorMoneda = ({
    label = "Moneda *",
    monedas,
    monedaId,
    disabled = false,
    onChange,
}: SelectorMonedaProps) => (
    <div className="rounded-xl border-2 border-mi-primera/15 px-3 py-2 grid gap-1">
        <span className="text-xs font-semibold text-mi-tercera">Moneda *</span>
        <div className="flex gap-1">
            {monedas.map(m => {
                const id = Number(m.id);
                const activa = monedaId === id;
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => onChange(id)}
                        disabled={disabled}
                        className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${activa ? "bg-mi-gradient text-white" : "bg-mi-primera/5 text-mi-cuarta/70 hover:bg-mi-primera/10"}`}
                    >
                        {m.nombre}
                    </button>
                );
            })}
        </div>
    </div >
);

export default SelectorMoneda;