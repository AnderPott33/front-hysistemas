import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface TarjetaProps {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  className?: string;
  headerClassName?: string;
  childrenClassName?: string;
  contentPadding?: string;
  headerAction?: React.ReactNode;

  // 👇 Soporte para colapsar
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  collapsedContentPadding?: string;
}

export const Tarjeta: React.FC<TarjetaProps> = ({
  icon,
  title,
  children,
  variant = 'default',
  className = '',
  headerClassName = '',
  childrenClassName = '',
  contentPadding = 'p-5',
  headerAction,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
  collapsedContentPadding = 'p-2',
}) => {
  const isCollapsed = collapsible && collapsed;

  const headerColorMap = {
    default: 'bg-mi-primera/10 border-mi-primera text-mi-cuarta dark:bg-mi-primera/5 dark:border-mi-tercera/40 dark:text-dm-text',
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    danger: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-600',
  };

  const iconColorMap = {
    default: 'text-mi-primera dark:text-mi-tercera',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-500',
  };

  return (
    <div
      className={`
        flex flex-col min-w-0
        rounded-3xl border border-mi-tercera/15
        dark:border-mi-tercera/30
        overflow-hidden
        bg-white dark:bg-dm-surface
        shadow-lg shadow-mi-primera/10
        dark:shadow-black/30
        ${className}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex gap-3 px-4 py-4
          font-semibold text-mi-cuarta
          border-b border-mi-primera/10 dark:border-mi-tercera/30
          ${isCollapsed ? 'flex-col items-center' : 'flex-row items-center justify-between'}
          ${headerColorMap[variant]}
          ${headerClassName}
        `}
      >
        {/* Lado izquierdo: icono + título */}
        <div className={`flex min-w-0 gap-3 ${isCollapsed ? 'flex-col items-center' : 'items-center'}`}>
          {icon && (
            <span className={`text-lg shrink-0 ${iconColorMap[variant]}`}>{icon}</span>
          )}
          <span
            className={`text-base whitespace-nowrap ${
              isCollapsed ? '[writing-mode:vertical-rl] rotate-180' : 'truncate'
            }`}
          >
            {title}
          </span>
        </div>

        {/* Lado derecho: acciones */}
        <div className={`flex items-center gap-1 shrink-0 ${isCollapsed ? 'flex-col' : ''}`}>
          {!isCollapsed && headerAction && <div>{headerAction}</div>}

          {collapsible && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? 'Expandir' : 'Contraer'}
              className="p-1.5 rounded-lg text-mi-cuarta/60 hover:text-mi-cuarta hover:bg-mi-primera/20 transition-all"
            >
              <ChevronLeft
                size={16}
                className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Contenido: siempre se renderiza, el padre decide qué mostrar según `collapsed` */}
      <div
        className={`
          flex flex-col gap-5 min-w-0 flex-1
          text-mi-cuarta dark:text-dm-text
          ${isCollapsed ? collapsedContentPadding : contentPadding}
          ${childrenClassName}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default Tarjeta;