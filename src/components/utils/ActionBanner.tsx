import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  content: ReactNode;
  disabled?: boolean;
  disabledMessage?: string;
}

interface ActionBannerProps {
  tabs: Tab[];
  activeTab?: string;
  defaultTab?: string;
  variant?: "default" | "primary" | "success" | "error" | "warning";
  className?: string;
  onTabChange?: (tabId: string) => void;
  showTabs?: boolean;
  disabled?: boolean;
}

export default function ActionBanner({
  tabs,
  activeTab: controlledActiveTab,
  defaultTab,
  variant = "default",
  className = "",
  onTabChange,
  showTabs = true,
  disabled = false,
}: ActionBannerProps) {
  const primerTabHabilitado =
    tabs.find((t) => !t.disabled)?.id || tabs[0]?.id || "";
  const tabInicial =
    defaultTab && !tabs.find((t) => t.id === defaultTab)?.disabled
      ? defaultTab
      : primerTabHabilitado;

  const [internalActiveTab, setInternalActiveTab] = useState(tabInicial);
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const isSingleMode = tabs.length === 1 && !showTabs;

  const handleTabChange = (tab: Tab) => {
    if (disabled || tab.disabled) return;
    if (!controlledActiveTab) setInternalActiveTab(tab.id);
    onTabChange?.(tab.id);
  };

  if (isSingleMode) {
    return (
      <div className={`flex flex-col w-full ${className}`}>
        <div
          aria-disabled={disabled}
          className={`
            bg-white border border-mi-primera/15 rounded-3xl shadow-lg shadow-mi-cuarta/10 p-2
            ${disabled ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          {tabs[0]?.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col w-full ${className} ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Barra de pestañas */}
      <div
        role="tablist"
        className="
          flex items-center gap-1.5 p-1.5
          bg-white border border-mi-primera/15 rounded-2xl shadow-lg shadow-mi-cuarta/10
          overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {tabs.map((tab) => {
          const tabDisabled = disabled || tab.disabled;
          const isActive = activeTab === tab.id && !tabDisabled;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={tabDisabled}
              disabled={tabDisabled}
              onClick={() => handleTabChange(tab)}
              title={
                tabDisabled
                  ? tab.disabledMessage || "No tenés permiso para acceder"
                  : undefined
              }
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl
                text-sm font-semibold whitespace-nowrap
                transition-all duration-200
                ${
                  tabDisabled
                    ? "text-mi-cuarta/30 cursor-not-allowed"
                    : isActive
                      ? "bg-mi-gradient text-white shadow-md shadow-mi-tercera/30"
                      : "cursor-pointer text-mi-cuarta/70 hover:bg-mi-primera/10 hover:text-mi-tercera"
                }
              `}
            >
              {tab.icon && (
                <span className="flex items-center justify-center shrink-0 [&>svg]:size-4">
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={`
                    min-w-5 h-5 px-1.5 rounded-full
                    flex items-center justify-center
                    text-xs font-semibold
                    ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-mi-primera/15 text-mi-tercera"
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            className={`transition-all duration-200 ${
              activeTab === tab.id && !tab.disabled ? "block" : "hidden"
            }`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}