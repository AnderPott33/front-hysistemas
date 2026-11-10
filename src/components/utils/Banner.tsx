import { useState, type ReactNode } from "react";

type BannerSize = "sm" | "md" | "lg";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  /** Botones o cualquier elemento que va a la derecha del banner */
  actions?: ReactNode;
  /** Elementos que se muestran dentro del header, a la derecha (antes de `actions`) */
  headerChildren?: ReactNode;
  /** sm: compacto · md: intermedio con subtítulo · lg: grande */
  size?: BannerSize;
  /** Altura de la onda en px (sobrescribe la del tamaño) */
  waveHeight?: number;
  /** Distancia en px entre el fin de la onda y el contenido (sobrescribe la del tamaño) */
  contentGap?: number;
  showToggle?: boolean;
  /** Clases de padding del contenido. Por defecto "px-6 pb-6". Usa "p-0" para quitarlo. */
  contentPadding?: string;
  children?: ReactNode;
}

interface SizeConfig {
  header: string;
  iconBox: string;
  iconScale: string;
  title: string;
  wave: number;
  gap: number;
  showSubtitle: boolean;
}

const sizeStyles: Record<BannerSize, SizeConfig> = {
  sm: {
    header: "px-5 py-3",
    iconBox: "w-9 h-9",
    iconScale: "scale-100",
    title: "text-base font-bold",
    wave: 28,
    gap: 2,
    showSubtitle: false,
  },
  md: {
    header: "px-6 pt-5 pb-8",
    iconBox: "w-12 h-12",
    iconScale: "scale-110",
    title: "text-xl font-bold",
    wave: 40,
    gap: 2,
    showSubtitle: true,
  },
  lg: {
    header: "px-8 pt-7 pb-12",
    iconBox: "w-16 h-16",
    iconScale: "scale-125",
    title: "text-2xl font-bold",
    wave: 56,
    gap: 2,
    showSubtitle: true,
  },
};

/**
 * Curva con altura en px. viewBox y altura renderizada son iguales,
 * así la forma no se aplasta sin importar el tamaño del banner.
 */
function wavePath(h: number) {
  const amp = h * 0.6;
  return `M0,${amp} C360,${h * 1.2} 1080,${-h * 0.2} 1440,${amp} L1440,${h} L0,${h} Z`;
}

export default function PageBanner({
  title,
  subtitle,
  icon,
  actions,
  headerChildren,
  size = "lg",
  waveHeight,
  contentGap,
  showToggle = false,
  contentPadding = "px-6 pb-6",
  children,
}: PageBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const s = sizeStyles[size];
  const h = waveHeight ?? s.wave;
  const gap = contentGap ?? s.gap;

  return (
    <>
      {/* Toggle - Opcional */}
      {showToggle && (
        <div className="flex mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-mi-primera/30 bg-white text-mi-segunda shadow-sm transition-all hover:bg-mi-primera/10"
          >
            <span className="text-mi-tercera">{isExpanded ? "−" : "+"}</span>
            <span>{title}</span>
          </button>
        </div>
      )}

      <div className="rounded-3xl overflow-hidden shadow-sm">
        {/* Banner */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${showToggle && !isExpanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
        >
          <div className="overflow-hidden">
            <header className={`relative overflow-hidden bg-mi-gradient text-white ${s.header}`}>
              {/* Círculos decorativos */}
              <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute top-8 right-40 w-24 h-24 rounded-full bg-white/10" />

              <div className="relative flex flex-wrap items-center justify-between gap-4 min-w-0">
                {/* Izquierda: icono + texto */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`flex items-center justify-center flex-shrink-0 rounded-full bg-white/20 backdrop-blur-sm shadow-md ${s.iconBox}`}
                  >
                    <div className={`text-white ${s.iconScale}`}>{icon}</div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h1 className={`${s.title} tracking-tight leading-tight text-white truncate`}>
                      {title}
                    </h1>
                    {subtitle && s.showSubtitle && (
                      <p className="text-sm text-white/80 truncate">{subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Derecha: elementos del header + acciones */}
                {(headerChildren || actions) && (
                  <div className="relative flex items-center gap-2 flex-wrap justify-end">
                    {headerChildren}
                    {actions}
                  </div>
                )}
              </div>

              {/* Onda inferior: alto en px = h, viewBox = h, así no se deforma */}
              <svg
                className="pointer-events-none absolute bottom-0 left-0 w-full text-slate-50"
                style={{ height: h }}
                viewBox={`0 0 1440 ${h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path fill="currentColor" d={wavePath(h)} />
              </svg>
            </header>
          </div>
        </div>

        {/* Contenido: div transparente a `gap` px del fin de la onda */}
        {children && (
          <main className={`bg-slate-50 ${contentPadding}`}>
            <div className="bg-transparent">
              <div>
                {children}
              </div>
            </div>
          </main>
        )}
      </div>
    </>
  );
}