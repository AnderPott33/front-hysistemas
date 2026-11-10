import { useMemo, useState, useRef, type ReactNode } from "react";
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Search, ChevronsLeft, ChevronsRight, X,
  Inbox,
} from "lucide-react";
import SelectCustom from "./SelectCustom";

export type TableSize = "sm" | "mid" | "md";

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  align?: "start" | "center" | "end" | "right";
  cell?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  initialSort?: { column: string; direction: "ascending" | "descending" } | null;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  showFilters?: boolean;
  showGlobalSearch?: boolean;
  globalSearchPlaceholder?: string;
  pagination?: boolean;
  footer?: ReactNode;
  iconSinDatos?: ReactNode;
  textSinDatos?: string;
  /** Tamaño visual: 'sm' (compacto), 'mid' (intermedio) o 'md' (normal). Por defecto: "md" */
  size?: TableSize;
  /** Clases extra para el contenedor exterior */
  className?: string;
  /** Clases extra para cada celda del encabezado */
  headerClassName?: string;
  /** Clases extra para cada fila del cuerpo */
  rowClassName?: string;
  /** Clases extra para cada celda del cuerpo */
  cellClassName?: string;
  /** Clases extra para la barra de paginación */
  paginationClassName?: string;
}

/**
 * Medidas por tamaño. Cada valor se usa tal cual en el JSX.
 * "md" es el tamaño normal y conserva los valores originales de la tabla.
 */
const TABLE_SIZES = {
  sm: {
    text: "text-xs",
    th: "px-2.5 py-1.5 text-xs",
    td: "px-2.5 py-1 text-xs leading-tight",
    checkTh: "w-9 px-2 py-1.5",
    checkbox: "w-4 h-4",
    sortIcon: 10,
    sortGap: "-space-y-1",
    searchH: "h-8",
    searchPl: "pl-9",
    searchPr: "pr-8",
    searchText: "text-xs",
    searchIcon: 14,
    searchLeft: "left-3",
    clearIcon: 13,
    filterH: "h-5",
    filterPx: "px-2",
    filterText: "text-xs",
    filterWrap: "px-1.5 pt-1 pb-1",
    emptyBox: "w-8 h-8 rounded-2xl",
    emptyIcon: 20,
    emptyText: "text-xs",
    emptyPad: "py-3",
    barPad: "px-3 py-2",
    barLabel: "text-xs",
    pageIcon: 14,
    pageBtn: "p-1",
    divider: "h-3.5",
    footerText: "text-xs",
    select: "mid" as const,
    selectWidth: "w-16",
  },
  mid: {
    text: "text-[11px]",
    th: "px-2 py-1 text-[11px]",
    td: "px-2 py-0.5 text-[11px] leading-tight",
    checkTh: "w-7 px-1.5 py-1",
    checkbox: "w-3.5 h-3.5",
    sortIcon: 9,
    sortGap: "-space-y-1.5",
    searchH: "h-7",
    searchPl: "pl-8",
    searchPr: "pr-7",
    searchText: "text-[11px]",
    searchIcon: 13,
    searchLeft: "left-2.5",
    clearIcon: 12,
    filterH: "h-4",
    filterPx: "px-2",
    filterText: "text-[11px]",
    filterWrap: "px-1.5 pt-0.5 pb-0.5",
    emptyBox: "w-7 h-7 rounded-xl",
    emptyIcon: 18,
    emptyText: "text-[11px]",
    emptyPad: "py-2",
    barPad: "px-2.5 py-1.5",
    barLabel: "text-[11px]",
    pageIcon: 13,
    pageBtn: "p-0.5",
    divider: "h-3",
    footerText: "text-[11px]",
    select: "sm" as const,
    selectWidth: "w-14",
  },
  md: {
    text: "text-sm",
    th: "px-3 py-2 text-sm",
    td: "px-3 py-2 text-sm leading-tight",
    checkTh: "w-10 px-2.5 py-2",
    checkbox: "w-4 h-4",
    sortIcon: 12,
    sortGap: "-space-y-1",
    searchH: "h-10",
    searchPl: "pl-10",
    searchPr: "pr-9",
    searchText: "text-sm",
    searchIcon: 16,
    searchLeft: "left-3.5",
    clearIcon: 14,
    filterH: "h-7",
    filterPx: "px-2.5",
    filterText: "text-sm",
    filterWrap: "px-2 pt-1.5 pb-1.5",
    emptyBox: "w-10 h-10 rounded-xl",
    emptyIcon: 24,
    emptyText: "text-sm",
    emptyPad: "py-4",
    barPad: "px-4 py-2.5",
    barLabel: "text-sm",
    pageIcon: 16,
    pageBtn: "p-1.5",
    divider: "h-4",
    footerText: "text-sm",
    select: "md" as const,
    selectWidth: "w-20",
  },
} as const;

const isEmptyValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "");

export default function DataTable<T extends { id: string | number }>({
  data = [],
  columns = [],
  initialSort = null,
  pageSizeOptions = [10, 20, 50, 100],
  initialPageSize = 20,
  selectable = false,
  selectedIds = [],
  setSelectedIds = () => { },
  onRowClick = () => { },
  onRowDoubleClick = () => { },
  showFilters = true,
  showGlobalSearch = false,
  globalSearchPlaceholder = "Buscar en todos los campos...",
  pagination = true,
  footer,
  iconSinDatos = <Inbox size={18} />,
  textSinDatos = "No hay ítems para mostrar",
  size = "md",
  className = "",
  headerClassName = "",
  rowClassName = "",
  cellClassName = "",
  paginationClassName = "",
}: DataTableProps<T>) {

  const S = TABLE_SIZES[size];

  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string | null;
    direction: "ascending" | "descending";
  }>(initialSort || { column: null, direction: "ascending" });

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSort = (columnId: string) => {
    setSortDescriptor((prev) => ({
      column: columnId,
      direction: prev.column === columnId && prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const globalFiltered = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => {
        let val: any = col.cell ? col.cell(row) : row[col.accessor as keyof T];
        if (typeof val !== "string" && typeof val !== "number") val = row[col.accessor as keyof T];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, globalSearch, columns]);

  const filteredData = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([_, val]) => val.trim() !== "");
    if (!showFilters || activeFilters.length === 0) return globalFiltered;
    return globalFiltered.filter((row) =>
      activeFilters.every(([accessor, filterValue]) => {
        const column = columns.find((c) => c.accessor === accessor);
        if (!column) return true;
        let val: any = column.cell ? column.cell(row) : row[accessor as keyof T];
        if (typeof val !== "string" && typeof val !== "number") val = row[accessor as keyof T];
        return val == null ? false : String(val).toLowerCase().includes(filterValue.toLowerCase().trim());
      })
    );
  }, [globalFiltered, filters, columns, showFilters]);

  const sortedData = useMemo(() => {
    if (!sortDescriptor.column) return filteredData;
    return [...filteredData].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof T];
      const second = b[sortDescriptor.column as keyof T];
      if (first == null) return 1;
      if (second == null) return -1;
      return sortDescriptor.direction === "ascending"
        ? String(first).localeCompare(String(second), "es", { numeric: true })
        : String(second).localeCompare(String(first), "es", { numeric: true });
    });
  }, [filteredData, sortDescriptor]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, pagination]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const clearGlobal = () => {
    setGlobalSearch("");
    setPage(0);
    searchRef.current?.focus();
  };

  const alignClass = (align?: Column<T>["align"]) =>
    align === "center" ? "text-center" : align === "right" || align === "end" ? "text-right" : "text-left";

  const justifyClass = (align?: Column<T>["align"]) =>
    align === "center" ? "justify-center" : align === "right" || align === "end" ? "justify-end" : "";

  return (
    <div className={`flex flex-col h-full overflow-hidden bg-white text-mi-cuarta ${S.text} ${className}`}>

      {showGlobalSearch && (
        <div className={`${S.barPad} border-b border-mi-primera/10`}>
          <div className="relative max-w-sm">
            <Search
              size={S.searchIcon}
              className={`absolute ${S.searchLeft} top-1/2 -translate-y-1/2 text-mi-tercera/60 pointer-events-none`}
            />
            <input
              ref={searchRef}
              type="text"
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setPage(0); }}
              placeholder={globalSearchPlaceholder}
              className={`
                w-full ${S.searchText} text-mi-cuarta placeholder:text-mi-cuarta/40
                bg-mi-primera/5 border border-mi-primera/20 rounded-full
                outline-none transition-all duration-200
                focus:bg-white focus:border-mi-tercera focus:ring-2 focus:ring-mi-primera/30
                ${S.searchH} ${S.searchPl} ${S.searchPr} font-medium
              `}
            />
            {globalSearch && (
              <button
                onClick={clearGlobal}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 ${S.pageBtn} rounded-full text-mi-cuarta/40 hover:text-mi-tercera hover:bg-mi-primera/10 transition-colors`}
                tabIndex={-1}
                aria-label="Limpiar búsqueda"
              >
                <X size={S.clearIcon} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-mi-primera/10">
            <tr>
              {selectable && (
                <th className={`${S.checkTh} text-center`}>
                  <input
                    type="checkbox"
                    className={`${S.checkbox} rounded cursor-pointer accent-mi-tercera`}
                    checked={paginatedData.length > 0 && paginatedData.every((r) => selectedIds.includes(r.id))}
                    onChange={(e) => {
                      const ids = paginatedData.map((r) => r.id);
                      setSelectedIds((prev) =>
                        e.target.checked
                          ? Array.from(new Set([...prev, ...ids]))
                          : prev.filter((id) => !ids.includes(id))
                      );
                    }}
                  />
                </th>
              )}
              {columns.map((col) => {
                const isActive = sortDescriptor.column === String(col.accessor);
                return (
                  <th
                    key={String(col.accessor)}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(String(col.accessor))}
                    className={`
                      ${S.th} font-semibold tracking-wide transition-colors
                      ${isActive ? "bg-mi-tercera text-white" : "text-mi-tercera"}
                      ${col.sortable ? "cursor-pointer hover:bg-mi-primera/20" : ""}
                      ${alignClass(col.align)}
                      ${headerClassName}
                    `}
                  >
                    <div className={`flex items-center gap-1 ${justifyClass(col.align)}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <div className={`flex flex-col ${S.sortGap}`}>
                          <ChevronUp
                            size={S.sortIcon}
                            className={`transition-opacity ${isActive && sortDescriptor.direction === "ascending" ? "opacity-100" : "opacity-40"}`}
                          />
                          <ChevronDown
                            size={S.sortIcon}
                            className={`transition-opacity ${isActive && sortDescriptor.direction === "descending" ? "opacity-100" : "opacity-40"}`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {showFilters && (
              <tr className="bg-white border-b border-mi-primera/10">
                {selectable && <th />}
                {columns.map((col) => (
                  <th key={String(col.accessor)} className={`${S.filterWrap} font-normal`}>
                    {col.filterable ? (
                      <input
                        value={filters[col.accessor as string] || ""}
                        onChange={(e) => {
                          setFilters((prev) => ({ ...prev, [col.accessor as string]: e.target.value }));
                          setPage(0);
                        }}
                        className={`
                          w-full ${S.filterH} ${S.filterPx} ${S.filterText} text-mi-cuarta
                          bg-mi-primera/5 border border-mi-primera/15 rounded-full
                          outline-none transition-all duration-200
                          focus:bg-white focus:border-mi-tercera focus:ring-1 focus:ring-mi-primera/30
                        `}
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={`px-1.5 ${S.emptyPad} text-center`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={`${S.emptyBox} bg-mi-primera/10 flex items-center justify-center text-mi-tercera`}>
                      <span style={{ fontSize: S.emptyIcon }} className="flex items-center justify-center">
                        {iconSinDatos}
                      </span>
                    </div>
                    <p className={`text-mi-tercera ${S.emptyText} font-normal`}>{textSinDatos}</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.map((row, index) => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <tr
                  key={`${row.id}-${index}`}
                  tabIndex={0}
                  onClick={() => onRowClick(row)}
                  onDoubleClick={() => onRowDoubleClick(row, index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onRowDoubleClick(row, index);
                    }
                  }}
                  className={`
                    transition-colors duration-100 cursor-pointer outline-none border-b border-mi-primera/10
                    focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-mi-tercera
                    ${isSelected
                      ? "bg-mi-tercera text-white"
                      : "odd:bg-white even:bg-mi-primera/[0.03] hover:bg-mi-primera/10"}
                    ${rowClassName}
                  `}
                >
                  {selectable && (
                    <td className={`${S.checkTh} text-center`}>
                      <input
                        type="checkbox"
                        className={`${S.checkbox} rounded cursor-pointer accent-mi-tercera`}
                        checked={isSelected}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id]
                          )
                        }
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const raw = col.cell ? col.cell(row) : (row[col.accessor as keyof T] as ReactNode);
                    return (
                      <td
                        key={String(col.accessor)}
                        className={`
                          ${S.td} ${alignClass(col.align)}
                          ${isSelected ? "text-white" : "text-mi-cuarta/85"}
                          ${cellClassName}
                        `}
                      >
                        {isEmptyValue(raw) ? "-" : raw}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className={`flex flex-col sm:flex-row items-center justify-between ${S.barPad} gap-2 border-t border-mi-primera/10 bg-mi-primera/5 ${paginationClassName}`}>
          <div className="flex items-center gap-2">
            <span className={`${S.barLabel} font-semibold text-mi-cuarta/60`}>Mostrar</span>
            <SelectCustom
              options={pageSizeOptions.map((e) => ({ value: e, label: e }))}
              isClearable={false}
              searchable={false}
              size={S.select}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e)); setPage(0); }}
              /* className={S.selectWidth} */
            />
          </div>

          <div className="flex items-center gap-3">
            <span className={`${S.barLabel} font-semibold text-mi-cuarta/60`}>
              Registros:{" "}
              <span className="text-mi-cuarta">
                {sortedData.length > 0 ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, sortedData.length)}
              </span>{" "}
              de <span className="text-mi-cuarta">{sortedData.length}</span>
            </span>
            <div className="flex items-center gap-0.5">
              <PaginationButton size={size} onClick={() => setPage(0)} disabled={page === 0} icon={<ChevronsLeft size={S.pageIcon} />} />
              <PaginationButton size={size} onClick={() => setPage((p) => p - 1)} disabled={page === 0} icon={<ChevronLeft size={S.pageIcon} />} />
              <div className={`${S.divider} w-px bg-mi-primera/20 mx-0.5`} />
              <PaginationButton size={size} onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} icon={<ChevronRight size={S.pageIcon} />} />
              <PaginationButton size={size} onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} icon={<ChevronsRight size={S.pageIcon} />} />
            </div>
          </div>
        </div>
      )}

      {footer && <div className={`border-t border-mi-primera/10 ${S.footerText}`}>{footer}</div>}
    </div>
  );
}

function PaginationButton({
  onClick, disabled, icon, size,
}: { onClick: () => void; disabled: boolean; icon: ReactNode; size: TableSize }) {
  const pad = TABLE_SIZES[size].pageBtn;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${pad} rounded-full text-mi-cuarta/50 hover:text-mi-tercera hover:bg-white
        disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-mi-cuarta/50 disabled:cursor-not-allowed
        transition-colors duration-150
      `}
    >
      {icon}
    </button>
  );
}