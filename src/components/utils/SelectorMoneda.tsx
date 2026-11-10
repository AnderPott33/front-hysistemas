import type { InterfaceMoneda } from "../../module/moneda/interfaces/InterfaceMoneda";

const PAIS_POR_CODIGO: Record<string, string> = {
    PYG: "py",
    USD: "us",
    EUR: "eu",
    BRL: "br",
    ARS: "ar",
};

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
    <div>
        {label && (
            <span className="block text-xs font-semibold text-mi-primera mb-1">{label}</span>
        )}
        <div
            className="grid gap-1 p-1 rounded-xl bg-mi-tercera/10"
            style={{ gridTemplateColumns: `repeat(${Math.max(monedas.length, 1)}, minmax(0, 1fr))` }}
        >
            {monedas.map(m => {
                const id = Number(m.id);
                const activa = monedaId === id;
                const pais = PAIS_POR_CODIGO[m.codigo?.toUpperCase()];

                return (
                    <button
                        key={m.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(id)}
                        className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activa
                            ? "bg-mi-primera text-white shadow-sm"
                            : "text-mi-cuarta hover:bg-mi-primera/10"
                            }`}
                    >
                        {pais ? (
                            <img
                                src={`https://flagcdn.com/w40/${pais}.png`}
                                alt={m.nombre}
                                className="w-5 h-3.5 object-cover rounded-sm border border-black/10"
                            />
                        ) : (
                            <span className="text-[10px] font-bold leading-none">{m.codigo}</span>
                        )}
                        <span className={`text-[11px] leading-none font-medium ${activa ? "text-white" : "text-mi-cuarta/80"}`}>
                            {m.nombre}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

export default SelectorMoneda;