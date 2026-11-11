import Swal, { type SweetAlertIcon } from 'sweetalert2';

/* ============================================================================
 * Constantes
 * ========================================================================== */

const FALLBACK_BASE = '#9942f0';
const SENTINEL_COLOR = '#010203';
const LOADER_CLOSE_DELAY_MS = 2500;
const TOAST_TIMEOUT_MS = 3000;
const DEFAULT_TOAST_TYPE = 'success';
const TOAST_WAVE_HEIGHT = 12;

const COLOR_ERROR = '#dc2626';
const COLOR_ERROR_BORDER = '#f87171';
const COLOR_WARNING_BG = '#d97706';
const COLOR_WARNING_BORDER = '#fbbf24';
const COLOR_WHITE = '#ffffff';

const ICON_PATHS = {
    success: 'm4.5 12.75 6 6 9-13.5',
    info: 'm11.25 11.25.041-.02a.75.75 0 1 1 .084 1.496l-.076.001a.75.75 0 0 1-.084-1.495l.076-.001zm7.5 0c.414 0 .75.336.75.75s-.336.75-.75.75S17.25 12.914 17.25 12.5s.336-.75.75-.75zM6 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z',
    error: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
} as const;

type ToastType = keyof typeof ICON_PATHS;

/* ============================================================================
 * Utilidades de color
 * ========================================================================== */

type Rgb = [number, number, number];

interface Paleta {
    cuarta: string;
    segunda: string;
    tercera: string;
    primera: string;
    gradient: string;
}

const isHex = (value: string): boolean =>
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

const parseHex = (hex: string): Rgb => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (rgb: number[]): string =>
    '#' + rgb
        .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0'))
        .join('');

/** Equivalente a color-mix(in srgb, base X%, black). Solo se usa como respaldo. */
const mixWithBlack = (rgb: Rgb, percent: number): Rgb =>
    [rgb[0] * percent / 100, rgb[1] * percent / 100, rgb[2] * percent / 100];

/** Convierte un color con opacidad: '#rrggbb' + 0.35 => 'rgba(r, g, b, 0.35)' */
const alpha = (hex: string, opacity: number): string => {
    const [r, g, b] = parseHex(hex);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

let canvasCtx: CanvasRenderingContext2D | null | undefined;
const getCanvasContext = (): CanvasRenderingContext2D | null => {
    if (canvasCtx === undefined) {
        canvasCtx = document.createElement('canvas').getContext('2d');
    }
    return canvasCtx;
};

/**
 * Convierte cualquier color CSS válido (rgb, color(srgb ...), color-mix, etc.)
 * a hex. El canvas normaliza el color al serializarlo.
 */
const cssColorToHex = (cssColor: string): string | null => {
    const value = cssColor?.trim();
    if (!value) return null;

    const ctx = getCanvasContext();
    if (!ctx) return null;

    ctx.fillStyle = SENTINEL_COLOR;
    ctx.fillStyle = value;
    const normalized = String(ctx.fillStyle);

    // Si el color no era válido, el canvas conserva el valor anterior
    if (normalized === SENTINEL_COLOR && value.toLowerCase() !== SENTINEL_COLOR) return null;

    if (isHex(normalized)) return normalized.toLowerCase();

    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return toHex([Number(match[1]), Number(match[2]), Number(match[3])]);

    return null;
};

/** Lee el color base que aplica applyThemeColor (con fallback). */
const getBaseColor = (): string => {
    const inline = document.documentElement.style.getPropertyValue('--color-base').trim();
    const computed = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-base')
        .trim();
    const value = inline || computed;
    return isHex(value) ? value : FALLBACK_BASE;
};

/** Resuelve una variable CSS del tema (ej. --color-mi-tercera) a hex. */
const resolverVariable = (nombre: string): string | null => {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.color = `var(${nombre})`;
    document.body.appendChild(probe);

    const computed = getComputedStyle(probe).color;
    probe.remove();

    return cssColorToHex(computed);
};

/**
 * Paleta tomada de las variables del @theme. Si alguna no se puede leer,
 * se recalcula con los mismos porcentajes a partir del color base.
 */
const getPalette = (): Paleta => {
    const base = parseHex(getBaseColor());

    const cuarta = resolverVariable('--color-mi-cuarta') ?? toHex(mixWithBlack(base, 25));
    const segunda = resolverVariable('--color-mi-segunda') ?? toHex(mixWithBlack(base, 60));
    const tercera = resolverVariable('--color-mi-tercera') ?? toHex(mixWithBlack(base, 82));
    const primera = resolverVariable('--color-mi-primera') ?? toHex(base);

    return {
        cuarta,
        segunda,
        tercera,
        primera,
        gradient: `linear-gradient(to bottom right, ${cuarta}, ${tercera}, ${primera})`,
    };
};

/* ============================================================================
 * Helpers de estilo
 * ========================================================================== */

const iconSvg = (d: string): string => `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 100%; height: 100%;">
        <path stroke-linecap="round" stroke-linejoin="round" d="${d}" />
    </svg>
`;

const resolveToastType = (icon: SweetAlertIcon): ToastType =>
    (icon in ICON_PATHS ? icon : DEFAULT_TOAST_TYPE) as ToastType;

/** Opciones base compartidas por los modales (no toasts) del ERP */
const modalBase = (MI: Paleta) => ({
    color: COLOR_WHITE,
    background: MI.gradient,
    backdrop: true,
    customClass: {
        popup: 'rounded-3xl shadow-2xl shadow-mi-cuarta/40',
    },
});

/** Misma forma de onda que usa ModalGeneral, con viewBox igual a la altura renderizada */
const wavePath = (h: number): string => {
    const amp = h * 0.6;
    return `M0,${amp} C360,${h * 1.2} 1080,${-h * 0.2} 1440,${amp} L1440,${h} L0,${h} Z`;
};

/**
 * Decoración del toast: dos círculos y una onda inferior, igual que el modal.
 * Todo va con z-index: -1 dentro de un contexto de apilamiento aislado,
 * así queda detrás del texto, el ícono y el botón de cerrar.
 */
const toastDecorHtml = (h: number): string => `
    <div aria-hidden="true" style="position:absolute;top:-1.25rem;right:-1.25rem;width:4rem;height:4rem;border-radius:9999px;background:rgba(255,255,255,0.1);pointer-events:none;z-index:-1;"></div>
    <div aria-hidden="true" style="position:absolute;top:0.4rem;right:3.5rem;width:2rem;height:2rem;border-radius:9999px;background:rgba(255,255,255,0.1);pointer-events:none;z-index:-1;"></div>
    <svg viewBox="0 0 1440 ${h}" preserveAspectRatio="none" aria-hidden="true"
         style="position:absolute;left:0;bottom:0;width:100%;height:${h}px;pointer-events:none;z-index:-1;">
        <path fill="rgba(255,255,255,0.14)" d="${wavePath(h)}" />
    </svg>
`;

/** Icono del toast: tamaño visual reducido, sin tocar el área de lectura */
const styleToastIcon = (iconContainer: HTMLElement, textColor: string): void => {
    Object.assign(iconContainer.style, {
        border: 'none',
        background: alpha(COLOR_WHITE, 0.15),
        boxShadow: 'none',
        color: textColor,
        width: '2rem',
        height: '2rem',
        minWidth: '2rem',
        borderRadius: '10px',
        padding: '0.35rem',
        margin: '0',
    });

    const svg = iconContainer.querySelector('svg');
    if (svg) {
        svg.style.filter = 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))';
    }
};

/** Toast compacto: ícono a la izquierda y texto alineado a la izquierda, centrado verticalmente */
const styleToast = (
    toast: HTMLElement,
    borderColor: string,
    bgColor: string,
    textColor: string,
    MI: Paleta
): void => {
    Object.assign(toast.style, {
        border: `1px solid ${borderColor}`,
        boxShadow: `0 6px 16px ${alpha(MI.cuarta, 0.3)}, 0 0 10px ${alpha(bgColor, 0.25)}`,
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        overflow: 'hidden',
        isolation: 'isolate',
        position: 'relative',
        minWidth: '14rem',
        maxWidth: '22rem',
        alignItems: 'center',
    });

    toast.insertAdjacentHTML('afterbegin', toastDecorHtml(TOAST_WAVE_HEIGHT));

    const iconContainer = toast.querySelector<HTMLElement>('.swal2-icon');
    if (iconContainer) styleToastIcon(iconContainer, textColor);

    // El título se vuelve un contenedor flex con la altura del ícono,
    // así el texto se centra verticalmente sin depender del margen por defecto de SweetAlert
    const titleElement = toast.querySelector<HTMLElement>('.swal2-title');
    if (titleElement) {
        Object.assign(titleElement.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '2rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            lineHeight: '1.3',
            margin: '0 0.5rem',
            padding: '0',
            wordBreak: 'break-word',
            textAlign: 'left',
            flex: '1',
        });
    }

    // El botón conserva un área de toque de 2rem aunque el ícono se vea más chico
    const closeBtn = toast.querySelector<HTMLElement>('.swal2-close');
    if (closeBtn) {
        Object.assign(closeBtn.style, {
            color: textColor,
            opacity: '0.8',
            fontSize: '1.25rem',
            lineHeight: '1',
            margin: '0 0 0 0.25rem',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s',
        });
        closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '1'; });
        closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '0.8'; });
    }
};

/* ============================================================================
 * API pública
 * ========================================================================== */

/**
 * Muestra el modal de carga con los colores del ERP.
 */
export const procesando = (mensaje: string = 'Procesando información!'): void => {
    const MI = getPalette();

    Swal.fire({
        ...modalBase(MI),
        title: mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        timerProgressBar: false,
        didOpen: () => {
            Swal.showLoading();
            const loader = document.querySelector<HTMLElement>('.swal2-loader');
            if (loader) {
                loader.style.borderColor = alpha(COLOR_WHITE, 0.25);
                loader.style.borderTopColor = COLOR_WHITE;
            }
        },
    });
};

/**
 * Cierra el modal de carga activo después de un retardo.
 * @param delay Milisegundos antes de cerrar. Por defecto: 2500.
 */
export const closeProcesando = (delay: number = LOADER_CLOSE_DELAY_MS): void => {
    setTimeout(() => Swal.close(), delay);
};

/**
 * Muestra una notificación tipo toast compacta en el estilo del ERP.
 * Mismo timer, posición y comportamiento al pasar el mouse que antes.
 */
export const showAlert = (title: string, icon: SweetAlertIcon = 'success'): void => {
    const MI = getPalette();
    const type = resolveToastType(icon);

    const palettes: Record<ToastType, { border: string; bg: string; text: string }> = {
        success: { border: MI.primera, bg: MI.primera, text: COLOR_WHITE },
        info:    { border: MI.primera, bg: MI.tercera, text: COLOR_WHITE },
        error:   { border: COLOR_ERROR_BORDER, bg: COLOR_ERROR, text: COLOR_WHITE },
        warning: { border: COLOR_WARNING_BORDER, bg: COLOR_WARNING_BG, text: COLOR_WHITE },
    };
    const colors = palettes[type];

    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        padding: '0.6rem 0.75rem',
        showConfirmButton: false,
        showCloseButton: true,
        closeButtonHtml: '&times;',
        closeButtonAriaLabel: 'Cerrar',
        timer: TOAST_TIMEOUT_MS,
        timerProgressBar: true,
        color: colors.text,
        background: colors.bg,
        iconHtml: iconSvg(ICON_PATHS[type]),
        didOpen: (toast: HTMLElement) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
            styleToast(toast, colors.border, colors.bg, colors.text, MI);
        },
    });

    Toast.fire({
        icon,
        title,
        customClass: {
            popup: 'rounded-xl',
            title: 'font-semibold',
            icon: 'm-0',
        },
    });
};

/**
 * Alerta de confirmación con estilos del ERP.
 * Resuelve true si el usuario confirma, false en cualquier otro caso.
 */
export const confirmar = async (
    titulo: string,
    mensaje: string,
    textoConfirmar: string = 'Confirmar',
    textoCancelar: string = 'Cancelar'
): Promise<boolean> => {
    const MI = getPalette();

    const result = await Swal.fire({
        ...modalBase(MI),
        title: titulo,
        text: mensaje,
        icon: 'warning',
        confirmButtonColor: COLOR_ERROR,
        cancelButtonColor: MI.segunda,
        confirmButtonText: textoConfirmar,
        cancelButtonText: textoCancelar,
        showCancelButton: true,
        reverseButtons: true,
        customClass: {
            popup: 'rounded-2xl shadow-2xl shadow-mi-cuarta/40',
            confirmButton: 'px-4 py-2 rounded-xl font-semibold transition-all',
            cancelButton: 'px-4 py-2 rounded-xl font-semibold transition-all',
        },
    });

    return result.isConfirmed;
};

/**
 * Modal de error con detalles opcionales.
 */
export const mostrarError = (titulo: string, mensaje?: string): void => {
    const MI = getPalette();

    Swal.fire({
        ...modalBase(MI),
        title: titulo,
        text: mensaje,
        icon: 'error',
        confirmButtonColor: COLOR_ERROR,
        customClass: {
            popup: 'rounded-3xl shadow-2xl shadow-mi-cuarta/40',
            confirmButton: 'px-6 py-2.5 rounded-2xl font-semibold',
        },
    });
};

/**
 * Modal de éxito con detalles opcionales. Se cierra solo tras 2.5 s.
 */
export const mostrarExito = (titulo: string, mensaje?: string): void => {
    const MI = getPalette();

    Swal.fire({
        ...modalBase(MI),
        title: titulo,
        text: mensaje,
        icon: 'success',
        confirmButtonColor: MI.tercera,
        timer: LOADER_CLOSE_DELAY_MS,
        customClass: {
            popup: 'rounded-3xl shadow-2xl shadow-mi-cuarta/40',
            confirmButton: 'px-6 py-2.5 rounded-2xl font-semibold',
        },
    });
};