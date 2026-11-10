import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

type TipState = {
    text: string;
    top: number;
    left: number;
    placeAbove: boolean;
};

export default function GlobalTooltip() {
    const [tip, setTip] = useState<TipState | null>(null);

    useEffect(() => {
        let current: HTMLElement | null = null;

        const findTarget = (node: EventTarget | null): HTMLElement | null => {
            if (!(node instanceof Element)) return null;
            return node.closest<HTMLElement>("[data-tooltip]");
        };

        const show = (el: HTMLElement) => {
            const text = el.dataset.tooltip;
            if (!text) return;
            const r = el.getBoundingClientRect();
            // Si el elemento está muy arriba, el tooltip se muestra debajo
            const placeAbove = r.top > 64;
            current = el;
            setTip({
                text,
                left: r.left + r.width / 2,
                top: placeAbove ? r.top - 10 : r.bottom + 10,
                placeAbove,
            });
        };

        const hide = () => {
            current = null;
            setTip(null);
        };

        const onOver = (e: MouseEvent) => {
            const el = findTarget(e.target);
            if (!el) return;
            if (el === current) return;
            show(el);
        };

        const onOut = (e: MouseEvent) => {
            const el = findTarget(e.target);
            if (!el || el !== current) return;
            const to = e.relatedTarget as Node | null;
            if (to && el.contains(to)) return; // sigue dentro del mismo elemento
            hide();
        };

        document.addEventListener("mouseover", onOver, true);
        document.addEventListener("mouseout", onOut, true);
        document.addEventListener("mousedown", hide, true);
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);

        return () => {
            document.removeEventListener("mouseover", onOver, true);
            document.removeEventListener("mouseout", onOut, true);
            document.removeEventListener("mousedown", hide, true);
            window.removeEventListener("scroll", hide, true);
            window.removeEventListener("resize", hide);
        };
    }, []);

    if (!tip) return null;

    return ReactDOM.createPortal(
        <div
            role="tooltip"
            className="pointer-events-none fixed z-[999999] max-w-xs"
            style={{
                top: tip.top,
                left: tip.left,
                transform: tip.placeAbove
                    ? "translate(-50%, -100%)"
                    : "translate(-50%, 0)",
            }}
        >
            <div
                className="relative rounded-xl bg-mi-cuarta px-3 py-2 text-xs font-medium leading-snug text-white shadow-xl shadow-mi-cuarta/30 border border-white/10 whitespace-normal"
            >
                {tip.text}
            </div>
            {/* Flecha */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 bg-mi-cuarta border-white/10
                    ${tip.placeAbove
                        ? "bottom-[-5px] border-r border-b"
                        : "top-[-5px] border-l border-t"}`}
            />
        </div>,
        document.body
    );
}