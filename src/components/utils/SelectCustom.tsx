import {
    useState, useRef, useEffect,
    type KeyboardEvent, type ReactNode, type CSSProperties
} from "react";
import ReactDOM from "react-dom";
import { ChevronDown, X } from "lucide-react";

type Option = {
    label: ReactNode;
    value: string | number;
    searchTerms?: string;
};

export type SelectSize = "sm" | "mid" | "md";

type SelectCustomProps = {
    options: Option[];
    value: string | number | null | undefined;
    onChange: (value: string | number | "") => void;
    placeholder?: string;
    /** Etiqueta flotante: centrada sin valor, arriba a la izquierda con valor o abierto */
    label?: string;
    isClearable?: boolean;
    disabled?: boolean;
    searchable?: boolean;
    icon?: ReactNode;
    /** Clases extra para el contenedor exterior (igual que InputERP) */
    className?: string;
    /** Clases extra para el disparador interno (la caja visible) */
    triggerClassName?: string;
    /** Clases extra para la etiqueta flotante */
    labelClassName?: string;
    /** Clases extra para el panel desplegable */
    dropdownClassName?: string;
    /** Tamaño visual: 'sm' (28px), 'mid' (36px) o 'md' (44px). Por defecto: "md" */
    size?: SelectSize;
};

const SIZE_CLASSES = {
    sm: {
        height: "h-7",
        radius: "rounded-xl",
        text: "text-xs",
        padX: "px-2.5",
        py: "py-1",
        pt: "pt-3",
        iconPad: "px-2",
        iconBox: "w-3.5 h-3.5",
        iconPx: 14,
        labelFloat: "top-0.5 text-[9px]",
        labelRest: "text-xs",
        itemPad: "px-2 py-1",
        searchPad: "px-2.5 py-1",
        emptyPad: "py-3",
        headerText: "text-[10px]",
    },
    mid: {
        height: "h-9",
        radius: "rounded-xl",
        text: "text-sm",
        padX: "px-3",
        py: "py-1.5",
        pt: "pt-3.5",
        iconPad: "px-2.5",
        iconBox: "w-4 h-4",
        iconPx: 16,
        labelFloat: "top-1 text-[10px]",
        labelRest: "text-sm",
        itemPad: "px-3 py-1.5",
        searchPad: "px-3 py-1.5",
        emptyPad: "py-4",
        headerText: "text-[11px]",
    },
    md: {
        height: "h-11",
        radius: "rounded-xl",
        text: "text-[15px]",
        padX: "px-4",
        py: "py-2.5",
        pt: "pt-4",
        iconPad: "px-3",
        iconBox: "w-[18px] h-[18px]",
        iconPx: 18,
        labelFloat: "top-1.5 text-[10px]",
        labelRest: "text-[15px]",
        itemPad: "px-3.5 py-2.5",
        searchPad: "px-4 py-2",
        emptyPad: "py-5",
        headerText: "text-[11px]",
    },
} as const;

export default function SelectCustom({
    options = [],
    value,
    onChange,
    placeholder = "Seleccione",
    label,
    isClearable = true,
    disabled = false,
    searchable = true,
    icon,
    className = "",
    triggerClassName = "",
    labelClassName = "",
    dropdownClassName = "",
    size = "md",
}: SelectCustomProps) {
    const S = SIZE_CLASSES[size];

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

    const triggerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selected = options.find((opt) => opt.value === value);
    const hasLabel = !!label;
    const floated = hasLabel && (open || !!selected);

    const filtered = searchable
        ? options.filter((opt) => {
            const term =
                opt.searchTerms ||
                (typeof opt.label === "string" ? opt.label : "");
            return term.toLowerCase().includes(search.toLowerCase());
        })
        : options;

    const calcPosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownHeight = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownStyle({
            position: "fixed",
            width: rect.width,
            left: rect.left,
            zIndex: 99999,
            ...(openUp
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }),
        });
    };

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        calcPosition();
        window.addEventListener("scroll", calcPosition, true);
        window.addEventListener("resize", calcPosition);
        return () => {
            window.removeEventListener("scroll", calcPosition, true);
            window.removeEventListener("resize", calcPosition);
        };
    }, [open]);

    useEffect(() => setHighlightIndex(0), [search]);

    useEffect(() => {
        if (!listRef.current) return;
        const item = listRef.current.querySelectorAll("[data-option]")[highlightIndex] as HTMLElement;
        item?.scrollIntoView({ block: "nearest" });
    }, [highlightIndex]);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
        if (disabled) return;
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                e.preventDefault();
                setOpen(true);
                calcPosition();
            }
            return;
        }
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIndex((p) => Math.min(p + 1, filtered.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIndex((p) => Math.max(p - 1, 0)); }
        if (e.key === "Enter") {
            e.preventDefault();
            const opt = filtered[highlightIndex];
            if (opt) { onChange(opt.value); setOpen(false); setSearch(""); }
        }
        if (e.key === "Escape") { setOpen(false); setSearch(""); }
    };

    const handleToggle = () => {
        if (disabled) return;
        if (!open) calcPosition();
        setOpen((p) => !p);
    };

    const labelClass = floated
        ? `${S.labelFloat} font-semibold tracking-wide text-mi-tercera/80`
        : `top-1/2 -translate-y-1/2 ${S.labelRest} font-medium text-mi-cuarta/50`;

    const valuePad = hasLabel
        ? (floated ? `${S.padX} ${S.pt} pb-0` : `${S.padX} ${S.py}`)
        : `${S.padX} ${S.py}`;

    return (
        <div className={`relative ${S.text} ${className}`}>
            <div
                ref={triggerRef}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={handleKeyDown}
                onClick={handleToggle}
                className={`
                    relative flex items-stretch w-full overflow-visible transition-all duration-200
                    ${S.height} ${S.radius}
                    ${disabled
                        ? "bg-mi-primera/5 border border-mi-primera/15 text-mi-cuarta/40 cursor-not-allowed"
                        : `bg-white border border-mi-primera/20 text-mi-cuarta shadow-sm hover:shadow-md hover:border-mi-primera/40 cursor-pointer
                           focus-within:border-mi-tercera focus-within:ring-2 focus-within:ring-mi-primera/30`}
                    ${open && !disabled ? "border-mi-tercera ring-2 ring-mi-primera/30" : ""}
                    ${triggerClassName}
                `}
            >
                {icon && (
                    <div className={`
                        flex items-center justify-center ${S.iconPad} border-r flex-shrink-0 ${S.radius} rounded-r-none
                        ${disabled
                            ? "bg-mi-primera/5 border-mi-primera/15 text-mi-cuarta/40"
                            : "bg-mi-primera/5 border-mi-primera/20 text-mi-tercera/70 hover:text-mi-tercera hover:bg-mi-primera/10"}
                    `}>
                        <span className={`${S.iconBox} flex items-center justify-center`}>
                            {icon}
                        </span>
                    </div>
                )}

                <div className="relative flex-1 min-w-0 flex items-center">
                    {hasLabel && (
                        <span
                            className={`pointer-events-none absolute left-4 max-w-[calc(100%-2rem)] truncate leading-none transition-all duration-200 ease-out ${labelClass} ${labelClassName}`}
                        >
                            {label}
                        </span>
                    )}
                    <div
                        className={`flex-1 w-full truncate flex items-center leading-none
                            ${valuePad}
                            ${!selected ? "text-mi-cuarta/40" : "text-mi-cuarta font-medium"}
                            ${hasLabel && !floated ? "invisible" : ""}`}
                    >
                        {selected ? selected.label : placeholder}
                    </div>
                    {hasLabel && !floated && (
                        <div className="absolute inset-0" />
                    )}
                </div>

                <div className={`flex items-stretch border-l border-mi-primera/20 flex-shrink-0 ${S.radius} rounded-l-none`}>
                    {isClearable && selected && !disabled && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(""); }}
                            className={`flex items-center justify-center ${S.iconPad} text-mi-cuarta/40 hover:bg-mi-primera/10 hover:text-mi-tercera transition-colors border-r border-mi-primera/20 rounded-l-none`}
                            tabIndex={-1}
                        >
                            <X size={S.iconPx} />
                        </button>
                    )}
                    <div className={`flex items-center justify-center ${S.iconPad} transition-colors ${S.radius} rounded-l-none
                        ${disabled
                            ? "text-mi-cuarta/40 cursor-not-allowed"
                            : "text-mi-tercera/70 hover:text-mi-tercera hover:bg-mi-primera/10 cursor-pointer"}`}
                    >
                        <ChevronDown
                            size={S.iconPx}
                            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                    </div>
                </div>
            </div>

            {open && !disabled && ReactDOM.createPortal(
                <div
                    ref={listRef}
                    style={dropdownStyle}
                    className={`
                        bg-white border border-mi-primera/20 ${S.radius} shadow-2xl shadow-mi-cuarta/20
                        select-none animate-in fade-in zoom-in-95 duration-150 overflow-hidden p-1.5
                        ${dropdownClassName}
                    `}
                >
                    {searchable && (
                        <div className="p-1 pb-1.5">
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Filtrar..."
                                className={`
                                    w-full ${S.text} ${S.searchPad} rounded-lg outline-none
                                    bg-mi-primera/5 border border-mi-primera/15 text-mi-cuarta
                                    placeholder:text-mi-cuarta/40
                                    focus:bg-white focus:border-mi-tercera focus:ring-2 focus:ring-mi-primera/30
                                    transition-all
                                `}
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                        {filtered.length > 0 ? (
                            filtered.map((opt, index) => {
                                const isHighlighted = index === highlightIndex;
                                const isSelected = value === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        data-option
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onChange(opt.value);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        onMouseEnter={() => setHighlightIndex(index)}
                                        className={`
                                            ${S.itemPad} ${S.text} flex items-center gap-2 select-none
                                            rounded-lg cursor-pointer transition-all duration-150
                                            ${isHighlighted
                                                ? "bg-mi-gradient text-white font-semibold shadow-md shadow-mi-tercera/25"
                                                : isSelected
                                                    ? "bg-mi-primera/15 text-mi-tercera font-semibold"
                                                    : "text-mi-cuarta/80 hover:bg-mi-primera/10 hover:text-mi-tercera"}
                                        `}
                                    >
                                        <div className="flex-1 truncate">{opt.label}</div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={`text-center text-mi-cuarta/40 italic ${S.emptyPad} ${S.text}`}>
                                Sin resultados
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}