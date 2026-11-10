import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
type ModalPosition = 'center' | 'top' | 'bottom';

type BannerSize = 'sm' | 'md' | 'lg';

interface SizeConfig {
    header: string;
    iconBox: string;
    iconScale: string;
    title: string;
    wave: number;
    showSubtitle: boolean;
}

const sizeStyles: Record<BannerSize, SizeConfig> = {
    sm: {
        header: 'px-5 pt-4',
        iconBox: 'w-12 h-12',
        iconScale: 'scale-120',
        title: 'text-base font-bold',
        wave: 28,
        showSubtitle: true,
    },
    md: {
        header: 'px-6 pt-6',
        iconBox: 'w-16 h-16',
        iconScale: 'scale-130',
        title: 'text-xl font-bold',
        wave: 40,
        showSubtitle: true,
    },
    lg: {
        header: 'px-8 pt-8',
        iconBox: 'w-20 h-20',
        iconScale: 'scale-155',
        title: 'text-2xl font-bold',
        wave: 56,
        showSubtitle: true,
    },
};

interface ModalAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    /** Contenido a la izquierda del botón de cerrar en el encabezado (inputs, campos, etc.) */
    headerExtra?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    actions?: ModalAction[];
    width?: string;
    height?: string;
    size?: ModalSize;
    sizeBanner?: BannerSize;
    maxHeight?: string;
    position?: ModalPosition;
    closeOnOverlay?: boolean;
    closeOnEsc?: boolean;
    lockScroll?: boolean;
    childrenPadding?: boolean;
    showCloseButton?: boolean;
    overlayBlur?: boolean;
    scrollableBody?: boolean;
    /** Altura de la onda inferior del encabezado en px. Si no se pasa, usa la del tamaño (sizeBanner). */
    waveHeight?: number;
    ariaLabel?: string;
    ariaDescribedBy?: string;
}

const SIZE_MAP: Record<string, string> = {
    xs: '320px',
    sm: '440px',
    md: '560px',
    lg: '720px',
    xl: '900px',
    '2xl': '1100px',
    full: '100%',
};

function resolveWidth(width?: string, size?: ModalSize): string {
    if (width) return width;
    if (size) return SIZE_MAP[size] ?? size;
    return SIZE_MAP['md'];
}

/**
 * Onda con viewBox igual a la altura renderizada, para que no se deforme.
 */
function wavePath(h: number) {
    const amp = h * 0.6;
    return `M0,${amp} C360,${h * 1.2} 1080,${-h * 0.2} 1440,${amp} L1440,${h} L0,${h} Z`;
}

const ACTION_VARIANTS: Record<string, string> = {
    primary: `
        bg-mi-gradient text-white border-transparent
        shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40
        focus-visible:ring-2 focus-visible:ring-mi-primera focus-visible:ring-offset-2
    `,
    secondary: `
        bg-white text-mi-cuarta border-mi-primera/20
        hover:bg-mi-primera/10 active:bg-mi-primera/15
        focus-visible:ring-2 focus-visible:ring-mi-primera focus-visible:ring-offset-2
    `,
    danger: `
        bg-red-600 text-white border-transparent
        shadow-md shadow-red-600/20 hover:bg-red-700 active:bg-red-800
        focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
    `,
    ghost: `
        bg-transparent text-mi-cuarta/70 border-transparent
        hover:bg-mi-primera/10 hover:text-mi-tercera active:bg-mi-primera/15
        focus-visible:ring-2 focus-visible:ring-mi-primera focus-visible:ring-offset-2
    `,
};

const ModalGeneral: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    headerExtra,
    children,
    footer,
    actions,
    width,
    height,
    size,
    sizeBanner = 'sm',
    maxHeight = '650px',
    position = 'center',
    closeOnOverlay = true,
    closeOnEsc = true,
    lockScroll = true,
    childrenPadding = true,
    showCloseButton = true,
    overlayBlur = true,
    scrollableBody = true,
    waveHeight,
    ariaLabel,
    ariaDescribedBy,
}) => {

    const s = sizeStyles[sizeBanner];
    const h = waveHeight ?? s.wave;
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === 'Escape') onClose();
        };
        if (closeOnEsc) window.addEventListener('keydown', handleEsc);
        if (lockScroll) document.body.style.overflow = 'hidden';
        return () => {
            if (closeOnEsc) window.removeEventListener('keydown', handleEsc);
            if (lockScroll) document.body.style.overflow = '';
        };
    }, [isOpen, onClose, closeOnEsc, lockScroll]);

    useEffect(() => {
        if (!isOpen) return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableSelector = `
            button:not([disabled]),
            [href],
            input:not([disabled]),
            select:not([disabled]),
            textarea:not([disabled]),
            [tabindex]:not([tabindex="-1"])
        `;

        const focusableElements = dialog.querySelectorAll(focusableSelector);
        const focusableArray = Array.from(focusableElements) as HTMLElement[];

        if (focusableArray.length === 0) {
            dialog.focus();
            return;
        }

        const firstElement = focusableArray[0];
        const lastElement = focusableArray[focusableArray.length - 1];
        const previousActiveElement = document.activeElement as HTMLElement;

        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const activeElement = document.activeElement as HTMLElement;

            if (e.shiftKey) {
                if (activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        dialog.addEventListener('keydown', handleKeyDown);

        return () => {
            dialog.removeEventListener('keydown', handleKeyDown);
            if (previousActiveElement) {
                previousActiveElement.focus();
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const dialogStyle: React.CSSProperties = {
        width: resolveWidth(width, size),
        height: height,
        maxHeight: maxHeight,
        outline: 'none',
    };

    const positionClass: Record<ModalPosition, string> = {
        center: 'items-center',
        top: 'items-start pt-16',
        bottom: 'items-end pb-16',
    };

    const hasHeader = title || subtitle || icon || headerExtra || showCloseButton;
    const hasFooter = footer || (actions && actions.length > 0);

    return ReactDOM.createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? title}
            aria-describedby={ariaDescribedBy}
            className={`fixed inset-0 z-500 flex justify-center p-4 ${positionClass[position]} animate-in fade-in duration-200`}
        >
            <div
                aria-hidden="true"
                onClick={closeOnOverlay ? onClose : undefined}
                className={`
                    fixed inset-0 bg-mi-cuarta/50
                    transition-opacity duration-200
                    ${overlayBlur ? 'backdrop-blur-sm' : ''}
                `}
            />

            <div
                ref={dialogRef}
                tabIndex={-1}
                style={dialogStyle}
                className="
                    relative flex flex-col overflow-hidden
                    rounded-3xl shadow-2xl shadow-mi-cuarta/40
                    transition-all duration-200
                    bg-white text-mi-cuarta
                    animate-in zoom-in-95
                "
            >
                {hasHeader && (
                    <div className="relative shrink-0 overflow-hidden bg-mi-gradient text-white">
                        {/* Círculos decorativos */}
                        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                        <div className="pointer-events-none absolute top-6 right-24 w-20 h-20 rounded-full bg-white/10" />

                        <div
                            className={`relative z-10 flex items-center justify-between gap-4 ${s.header}`}
                            style={{ paddingBottom: h + 8 }}
                        >
                            {/* Izquierda: icono + título */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {icon && (
                                    <span className={`shrink-0 flex items-center justify-center ${s.iconBox} rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white shadow-lg`}>
                                        <span className={s.iconScale}>{icon}</span>
                                    </span>
                                )}
                                <div className="min-w-0">
                                    {title && (
                                        <h3 className={`${s.title} leading-tight text-white truncate`}>
                                            {title}
                                        </h3>
                                    )}
                                    {subtitle && s.showSubtitle && (
                                        <p className="text-sm mt-1 leading-snug text-white/75 truncate">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Espacio extra: inputs o campos a la izquierda del botón cerrar */}
                            {headerExtra && (
                                <div className="shrink-0 flex items-center gap-2">
                                    {headerExtra}
                                </div>
                            )}

                            {showCloseButton && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Cerrar modal"
                                    className="
                                        shrink-0 p-2 rounded-xl transition-all duration-150
                                        text-white/70 hover:text-white hover:bg-white/15
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mi-tercera
                                        active:bg-white/25
                                    "
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M1.5 1.5L16.5 16.5M16.5 1.5L1.5 16.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Onda inferior: rellena con blanco para fundirse con el cuerpo */}
                        <svg
                            className="modal-wave pointer-events-none absolute bottom-0 left-0 w-full text-white"
                            style={{ height: h }}
                            viewBox={`0 0 1440 ${h}`}
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <path fill="currentColor" d={wavePath(h)} />
                        </svg>
                    </div>
                )}

                <div className={`
                    flex-1 text-mi-cuarta/80 text-[15px] leading-relaxed
                    ${scrollableBody ? 'overflow-y-auto' : 'overflow-visible'}
                    ${childrenPadding ? 'px-6 pb-6 pt-2' : 'p-0'}
                `}>
                    {children}
                </div>

                {hasFooter && (
                    <div className="shrink-0 px-6 py-4 bg-mi-primera/5 border-t border-mi-primera/10">
                        {footer ? (
                            <div className="flex justify-end gap-3">{footer}</div>
                        ) : (
                            <div className="flex justify-end gap-3 flex-wrap">
                                {actions?.map((action, i) => {
                                    const variant = action.variant ?? 'secondary';
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={action.onClick}
                                            disabled={action.disabled || action.loading}
                                            className={`
                                                inline-flex items-center justify-center gap-2
                                                px-5 py-2.5 rounded-2xl border text-sm font-semibold
                                                transition-all duration-200 active:scale-[0.98]
                                                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                                ${ACTION_VARIANTS[variant]}
                                            `}
                                        >
                                            {action.loading ? (
                                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            ) : action.icon ? (
                                                <span className="w-4 h-4">{action.icon}</span>
                                            ) : null}
                                            <span>{action.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );

};

export default ModalGeneral;