import React, { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Eye, EyeOff, Calendar, Paperclip, Search, Edit2, ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';
import type { InterfaceMoneda } from '../../module/moneda/interfaces/InterfaceMoneda';

type InputType =
  | 'text' | 'currency' | 'number' | 'date' | 'datetime-local'
  | 'password' | 'checkbox' | 'email' | 'tel' | 'url' | 'search'
  | 'searchNumber' | 'color' | 'range' | 'file' | 'time' | 'month'
  | 'textarea' | 'radio' | 'checkbox-group';

export type DisplayMode = 'id' | 'text' | 'id-text';
export type CheckboxGroupMode = 'single' | 'multiple';
export type InputSize = 'sm' | 'mid' | 'md';

export interface SearchOption {
  id: string | number;
  texto: string;
  [extra: string]: any;
}

export interface SearchColumn {
  /** Clave del campo dentro de la opción (ej: 'id', 'texto', 'ruc', 'imagen') */
  key: string;
  /** Encabezado de la columna */
  label: string;
  /** Ancho CSS de la columna (ej: '110px', '1fr'). Por defecto '1fr' */
  width?: string;
  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right';
  /** Render personalizado de la celda (ej: avatar, badge, formato especial) */
  render?: (option: SearchOption) => React.ReactNode;
}

export interface RadioOption { value: string | number; label: string; }
export interface CheckboxOption { value: string | number; label: string; }

export interface Moneda {
  id: number | string;
  codigo: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
  creado_en?: string;
}

interface InputERPProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange' | 'value' | 'onBlur' | 'max' | 'min' | 'size'> {
  icon?: React.ReactNode;
  /** Etiqueta flotante: centrada si el campo está vacío, arriba a la izquierda si tiene valor o foco */
  label?: string;
  type?: InputType;
  value?: any;
  moneda?: InterfaceMoneda;
  onChange: (newValue: any) => void;
  onEnterPress?: (searchTerm: string) => void;
  onBlur?: (searchTerm: string) => void;
  rows?: number;
  showSearch?: boolean;
  showEdit?: boolean;
  /** Muestra botón para limpiar el valor en campos de búsqueda. Por defecto: false */
  isCleable?: boolean;
  onSearchClick?: () => void;
  onEditClick?: () => void;
  searchOptions?: SearchOption[];
  onSelectOption?: (option: SearchOption) => void;
  searchMinChars?: number;
  searchTooltip?: string;
  editTooltip?: string;
  displayMode?: DisplayMode;
  /** Columnas visibles en la lista de búsqueda. Por defecto: CÓDIGO y NOMBRE */
  searchColumns?: SearchColumn[];
  /** Abre la lista con todas las opciones al hacer clic. Por defecto: true */
  searchOpenOnClick?: boolean;
  /** Muestra/abre la lista de resultados al escribir o hacer clic. Por defecto: true */
  showSearchList?: boolean;
  /** Texto de la acción al pie de la lista (ej: "Agregar Persona") */
  searchFooterLabel?: string;
  onSearchFooterClick?: () => void;
  phoneMask?: string;
  radioOptions?: RadioOption[];
  radioDirection?: 'horizontal' | 'vertical';
  radioGap?: string;
  radioColumns?: number;
  checkboxOptions?: CheckboxOption[];
  checkedValues?: (string | number)[];
  checkboxDirection?: 'horizontal' | 'vertical';
  checkboxGap?: string;
  checkboxColumns?: number;
  checkboxMode?: CheckboxGroupMode;
  max?: number | string;
  min?: number | string;

  /** Tamaño visual: 'sm' (28px), 'mid' (36px) o 'md' (44px). Por defecto: "md" */
  size?: InputSize;
  /** Clases extra para el contenedor exterior (igual que SelectCustom) */
  className?: string;
  /** Clases extra para el <input> o <textarea> interno */
  inputClassName?: string;
  /** Clases extra para la etiqueta flotante */
  labelClassName?: string;
  /** Clases extra para el panel desplegable de búsqueda */
  dropdownClassName?: string;
}

const DEFAULT_SEARCH_COLUMNS: SearchColumn[] = [
  { key: 'id', label: 'CÓDIGO', width: '110px' },
  { key: 'texto', label: 'NOMBRE', width: '1fr' },
];

const SIZE_CLASSES = {
  sm: {
    height: 'h-7',
    radius: 'rounded-xl',
    text: 'text-xs',
    padX: 'px-2.5',
    py: 'py-1',
    pt: 'pt-3',
    iconPad: 'px-2',
    iconBox: 'w-3.5 h-3.5',
    iconPx: 14,
    labelFloat: 'top-0.5 text-[9px]',
    labelRest: 'text-xs',
  },
  mid: {
    height: 'h-9',
    radius: 'rounded-xl',
    text: 'text-sm',
    padX: 'px-3',
    py: 'py-1.5',
    pt: 'pt-3.5',
    iconPad: 'px-2.5',
    iconBox: 'w-4 h-4',
    iconPx: 16,
    labelFloat: 'top-1 text-[10px]',
    labelRest: 'text-sm',
  },
  md: {
    height: 'h-11',
    radius: 'rounded-xl',
    text: 'text-[15px]',
    padX: 'px-4',
    py: 'py-2.5',
    pt: 'pt-4',
    iconPad: 'px-3',
    iconBox: 'w-[18px] h-[18px]',
    iconPx: 18,
    labelFloat: 'top-1.5 text-[10px]',
    labelRest: 'text-[15px]',
  },
} as const;

function buildDisplay(option: SearchOption, mode: DisplayMode): string {
  switch (mode) {
    case 'id':      return String(option.id);
    case 'text':    return option.texto;
    case 'id-text': return option.texto ? `${option.id} - ${option.texto}` : String(option.id);
  }
}

function matchesTerm(option: SearchOption, term: string, columns: SearchColumn[]): boolean {
  if (String(option.id).toLowerCase().includes(term)) return true;
  if (String(option.texto ?? '').toLowerCase().includes(term)) return true;
  return columns.some(c => {
    const v = option[c.key];
    return v !== undefined && v !== null && String(v).toLowerCase().includes(term);
  });
}

function applyPhoneMask(input: string, mask: string): string {
  if (!input) return '';
  const prefixEnd = mask.indexOf('#');
  const prefixStr = prefixEnd >= 0 ? mask.slice(0, prefixEnd) : '';
  const prefixDigs = prefixStr.replace(/\D/g, '');
  let digits = input.replace(/\D/g, '');
  if (digits.length <= prefixDigs.length && prefixDigs.startsWith(digits)) return '';
  if (prefixDigs && digits.startsWith(prefixDigs)) digits = digits.slice(prefixDigs.length);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.length) return '';
  let result = '';
  let dIdx = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === '#') {
      if (dIdx < digits.length) result += digits[dIdx++];
      else break;
    } else result += mask[i];
  }
  return result;
}

function buildDateString(digits: string, withTime: boolean): string {
  const maxDigits = withTime ? 12 : 8;
  const d = digits.slice(0, maxDigits);
  let r = '';
  for (let i = 0; i < d.length; i++) {
    if (i === 2 || i === 4) r += '/';
    else if (withTime && i === 8) r += ' ';
    else if (withTime && i === 10) r += ':';
    r += d[i];
  }
  return r;
}

function extractDigits(s: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const withTime = /T\d{2}:\d{2}/.test(s);
    const datePart = s.split('T')[0];
    const [year, month, day] = datePart.split('-');
    let result = day + month + year;
    if (withTime) {
      const timePart = s.split('T')[1];
      const [hour, min] = timePart.split(':');
      result += hour + min;
    }
    return result;
  }
  if (/^\d{8,12}$/.test(s)) {
    if (s.length === 8) {
      return s.slice(6, 8) + s.slice(4, 6) + s.slice(0, 4);
    } else if (s.length === 12) {
      return s.slice(6, 8) + s.slice(4, 6) + s.slice(0, 4) + s.slice(8, 12);
    }
  }
  return s.replace(/\D/g, '');
}

function parseDisplay(s: string, withTime: boolean) {
  if (!s) return null;
  const pat = withTime
    ? /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/
    : /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const m = s.match(pat);
  if (!m) return null;
  const day = +m[1], month = +m[2], year = +m[3];
  const hour = withTime ? +m[4] : 0;
  const min = withTime ? +m[5] : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (withTime && (hour > 23 || min > 59)) return null;
  return { day, month, year, hour, min };
}

function parseDisplayToISO(s: string, withTime: boolean): string {
  if (!s) return '';
  const parsed = parseDisplay(s, withTime);
  if (!parsed) return '';
  const { day, month, year, hour, min } = parsed;
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!withTime) return isoDate;
  return `${isoDate}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function toDisplayStr(value: any, withTime: boolean): string {
  if (!value && value !== 0) return '';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      if (withTime) return `${day}/${month}/${year} 00:00`;
      return `${day}/${month}/${year}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const [datePart, timePart] = value.split('T');
      const [year, month, day] = datePart.split('-');
      const [hour, min] = timePart.split(':');
      return `${day}/${month}/${year} ${hour}:${min}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      if (withTime) return `${value} 00:00`;
      return value;
    }
    if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(value)) return value;
    if (/^\d{8}$/.test(value)) {
      const year = value.slice(0, 4);
      const month = value.slice(4, 6);
      const day = value.slice(6, 8);
      if (withTime) return `${day}/${month}/${year} 00:00`;
      return `${day}/${month}/${year}`;
    }
    if (/^\d{12}$/.test(value)) {
      const year = value.slice(0, 4);
      const month = value.slice(4, 6);
      const day = value.slice(6, 8);
      const hour = value.slice(8, 10);
      const minute = value.slice(10, 12);
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) return formatDateObj(d, withTime);
    return value;
  }
  if (value instanceof Date && !isNaN(value.getTime())) return formatDateObj(value, withTime);
  return '';
}

function formatDateObj(d: Date, withTime: boolean): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (!withTime) return `${dd}/${mm}/${yyyy}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CAL_WIDTH = 320;
const CAL_GAP = 8;
const CAL_PAD = 8;

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHex(v: string): string {
  if (!HEX_RE.test(v)) return v;
  if (v.length === 4) {
    return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  }
  return v;
}

interface CalendarPopupProps {
  display: string;
  withTime: boolean;
  onSelect: (display: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPopupPointerDown: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function CalendarPopup({ display, withTime, onSelect, containerRef, onPopupPointerDown, inputRef }: CalendarPopupProps) {
  const parsed = parseDisplay(display, withTime);
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth() + 1);
  const [selDay, setSelDay] = useState<number | null>(parsed?.day ?? null);
  const [selMonth, setSelMonth] = useState<number | null>(parsed?.month ?? null);
  const [selYear, setSelYear] = useState<number | null>(parsed?.year ?? null);
  const [hour, setHour] = useState(parsed?.hour ?? 0);
  const [minute, setMinute] = useState(parsed?.min ?? 0);

  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  const calcPos = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const field = (input.closest('[data-erp-field]') as HTMLElement | null) ?? input;
    const r = field.getBoundingClientRect();
    const popH = containerRef.current?.offsetHeight ?? (withTime ? 440 : 380);

    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < popH + CAL_GAP + CAL_PAD && spaceAbove > spaceBelow;

    let left = r.left;
    const maxLeft = window.innerWidth - CAL_WIDTH - CAL_PAD;
    if (left > maxLeft) left = maxLeft;
    if (left < CAL_PAD) left = CAL_PAD;

    const top = openUp
      ? Math.max(CAL_PAD, r.top - popH - CAL_GAP)
      : r.bottom + CAL_GAP;

    setPos({ top, left });
  }, [inputRef, containerRef, withTime]);

  useLayoutEffect(() => {
    calcPos();
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [calcPos]);

  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const firstDOW = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

  const prevMonth = () => viewMonth === 1 ? (setViewMonth(12), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 12 ? (setViewMonth(1), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const selectDay = (d: number) => {
    setSelDay(d);
    setSelMonth(viewMonth);
    setSelYear(viewYear);
    if (!withTime) {
      const displayStr = `${String(d).padStart(2, '0')}/${String(viewMonth).padStart(2, '0')}/${viewYear}`;
      onSelect(parseDisplayToISO(displayStr, false));
    }
  };

  const confirmDateTime = () => {
    if (!selDay || !selMonth || !selYear) return;
    const displayStr = `${String(selDay).padStart(2, '0')}/${String(selMonth).padStart(2, '0')}/${selYear}` +
      ` ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onSelect(parseDisplayToISO(displayStr, true));
  };

  const goToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth() + 1);
    setSelDay(t.getDate());
    setSelMonth(t.getMonth() + 1);
    setSelYear(t.getFullYear());
    if (!withTime) {
      const today = `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
      onSelect(parseDisplayToISO(today, false));
    } else {
      setHour(t.getHours());
      setMinute(t.getMinutes());
    }
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startBlank = firstDOW(viewYear, viewMonth);
  const isSelected = (d: number) => d === selDay && viewMonth === selMonth && viewYear === selYear;
  const isToday = (d: number) => d === now.getDate() && viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  return ReactDOM.createPortal(
    <div
      ref={containerRef}
      onMouseDownCapture={onPopupPointerDown}
      className="fixed w-[320px] bg-white rounded-xl border border-mi-primera/15 shadow-xl shadow-mi-cuarta/15 p-4 select-none"
      style={{ top: pos.top, left: pos.left, zIndex: 99999 }}
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={prevMonth}
          className="p-1.5 rounded-lg text-mi-cuarta/60 hover:bg-mi-primera/10 hover:text-mi-tercera transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-mi-cuarta">
          {MESES_ES[viewMonth - 1]} {viewYear}
        </span>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={nextMonth}
          className="p-1.5 rounded-lg text-mi-cuarta/60 hover:bg-mi-primera/10 hover:text-mi-tercera transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {DIAS_ES.map(d => (
          <div key={d} className="text-center text-xs font-medium text-mi-cuarta/50 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startBlank }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
          <div key={d} className="flex justify-center">
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => selectDay(d)}
              className={`w-9 h-9 rounded-full text-sm transition-all flex items-center justify-center
                ${isSelected(d)
                  ? 'bg-mi-gradient text-white font-semibold shadow-md shadow-mi-tercera/30'
                  : isToday(d)
                    ? 'ring-1 ring-mi-primera text-mi-tercera font-semibold'
                    : 'text-mi-cuarta/80 hover:bg-mi-primera/10 hover:text-mi-tercera'}`}
            >
              {d}
            </button>
          </div>
        ))}
      </div>

      {withTime && (
        <div className="mt-3 pt-3 border-t border-mi-primera/10 flex items-center gap-1.5">
          <Clock size={14} className="text-mi-tercera/60 flex-shrink-0" />
          <input type="number" min={0} max={23}
            value={String(hour).padStart(2, '0')}
            onMouseDown={e => e.stopPropagation()}
            onChange={e => setHour(Math.min(23, Math.max(0, +e.target.value || 0)))}
            className="w-11 text-center text-xs text-mi-cuarta bg-mi-primera/5 border border-mi-primera/20 rounded-lg px-1 py-1.5 outline-none focus:border-mi-tercera focus:ring-2 focus:ring-mi-primera/30 transition-all" />
          <span className="text-mi-cuarta/50 font-semibold text-sm">:</span>
          <input type="number" min={0} max={59}
            value={String(minute).padStart(2, '0')}
            onMouseDown={e => e.stopPropagation()}
            onChange={e => setMinute(Math.min(59, Math.max(0, +e.target.value || 0)))}
            className="w-11 text-center text-xs text-mi-cuarta bg-mi-primera/5 border border-mi-primera/20 rounded-lg px-1 py-1.5 outline-none focus:border-mi-tercera focus:ring-2 focus:ring-mi-primera/30 transition-all" />
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={confirmDateTime}
            disabled={!selDay}
            className="ml-auto text-xs px-3.5 py-1.5 bg-mi-gradient text-white rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold">
            OK
          </button>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-mi-primera/10 flex justify-between items-center">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={goToday}
          className="text-xs font-semibold text-mi-tercera hover:text-mi-segunda px-2 py-1 rounded-lg hover:bg-mi-primera/10 transition-colors">
          Hoy
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => onSelect('')}
          className="text-xs font-semibold text-mi-cuarta/50 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
          Limpiar
        </button>
      </div>
    </div>,
    document.body
  );
}

interface ColorFieldProps {
  label?: string;
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  size?: InputSize;
}

function ColorField({ label, value, onChange, disabled, readOnly, className = '', inputClassName = '', labelClassName = '', size = 'md' }: ColorFieldProps) {
  const [draft, setDraft] = useState<string>(value ?? '');
  const [focused, setFocused] = useState(false);
  const locked = disabled || readOnly;
  const hasLabel = !!label;
  const S = SIZE_CLASSES[size];

  useEffect(() => {
    if (!focused) setDraft(value ?? '');
  }, [value, focused]);

  const valid = HEX_RE.test(draft);
  const hasValue = draft !== '';
  const floated = hasLabel && (focused || hasValue);
  const swatchColor = valid
    ? normalizeHex(draft)
    : (HEX_RE.test(value ?? '') ? normalizeHex(value as string) : 'transparent');

  const pickerValue = valid && draft.length === 7
    ? draft
    : (HEX_RE.test(value ?? '') && (value as string).length === 7 ? (value as string) : '#000000');

  const inputPad = hasLabel
    ? (floated ? `${S.padX} ${S.pt} pb-0` : `${S.padX} ${S.py}`)
    : `${S.padX} ${S.py}`;

  return (
    <div
      data-erp-field
      className={`relative flex items-stretch w-full ${S.height} ${S.radius} border transition-all duration-200
        ${disabled
          ? 'bg-mi-primera/5 border-mi-primera/15 text-mi-cuarta/40 cursor-not-allowed'
          : 'bg-white border-mi-primera/20 text-mi-cuarta shadow-sm hover:shadow-md hover:border-mi-primera/40 focus-within:border-mi-tercera focus-within:ring-2 focus-within:ring-mi-primera/30'}
        ${className}`}
      style={{ overflow: 'hidden' }}
    >
      <label className={`relative flex items-center ${S.iconPad} border-r ${S.radius} rounded-r-none flex-shrink-0 transition-colors
        ${disabled
          ? 'bg-mi-primera/5 border-mi-primera/15 cursor-not-allowed'
          : 'bg-mi-primera/5 border-mi-primera/20 cursor-pointer hover:bg-mi-primera/10'}`}>
        <span
          className={`${S.iconBox} rounded-md border border-black/10 shadow-inner`}
          style={{ backgroundColor: swatchColor }}
        />
        <input
          type="color"
          value={pickerValue}
          disabled={locked}
          onChange={e => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </label>

      <div className="flex-1 flex items-center min-w-0 relative">
        {hasLabel && (
          <span
            className={`pointer-events-none absolute left-4 max-w-[calc(100%-2rem)] truncate leading-none transition-all duration-200 ease-out
              ${floated ? S.labelFloat : `top-1/2 -translate-y-1/2 ${S.labelRest}`} font-semibold
              ${disabled
                ? 'text-mi-cuarta/40'
                : floated ? 'text-mi-tercera/80' : 'text-mi-cuarta/50'}
              ${labelClassName}`}
          >
            {label}
          </span>
        )}
        <input
          type="text"
          value={draft}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={floated ? '#RRGGBB' : undefined}
          maxLength={7}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (valid) {
              const normalized = normalizeHex(draft);
              setDraft(normalized);
              onChange(normalized);
            } else {
              setDraft(value ?? '');
            }
          }}
          onChange={e => {
            const v = e.target.value.trim();
            setDraft(v);
            if (HEX_RE.test(v)) onChange(normalizeHex(v));
          }}
          className={`w-full h-full bg-transparent outline-none ${inputPad} ${S.text} leading-none font-mono uppercase
            text-mi-cuarta placeholder:text-mi-cuarta/40 disabled:cursor-not-allowed ${inputClassName}`}
        />
      </div>
    </div>
  );
}

export default function InputERP({
  icon, label, placeholder, type = 'text', value, moneda,
  onChange, onEnterPress, onBlur,
  className = '', disabled = false, readOnly = false, rows = 3,
  showSearch = false, showEdit = false, isCleable = false, onSearchClick, onEditClick,
  searchOptions = [], onSelectOption, searchMinChars = 1,
  searchTooltip = 'Buscar', editTooltip = 'Editar',
  displayMode = 'id-text', phoneMask,
  searchColumns, searchOpenOnClick = true,
  showSearchList = true,
  searchFooterLabel, onSearchFooterClick,
  radioOptions = [], radioDirection = 'vertical', radioGap = 'gap-3', radioColumns,
  checkboxOptions = [], checkedValues = [],
  checkboxDirection = 'vertical', checkboxGap = 'gap-3', checkboxColumns,
  checkboxMode = 'multiple',
  max, min,
  size = 'md',
  inputClassName = '',
  labelClassName = '',
  dropdownClassName = '',
  ...props
}: InputERPProps) {

  const S = SIZE_CLASSES[size];
  const sm = size === 'sm';

  const [showPassword, setShowPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [listMode, setListMode] = useState<'all' | 'filter'>('filter');
  const [showCalendar, setShowCalendar] = useState(false);
  const [focused, setFocused] = useState(false);
  const [, forceLayout] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const calendarMouseDownRef = useRef(false);

  const justSelectedRef = useRef(false);
  const internalChangeRef = useRef(false);

  const isDateTime = type === 'datetime-local';
  const isDate = type === 'date' || isDateTime;
  const isSearchType = type === 'search' || type === 'searchNumber';
  const hasLabel = !!label && type !== 'checkbox' && type !== 'radio' && type !== 'checkbox-group';

  const columns = useMemo<SearchColumn[]>(
    () => (searchColumns && searchColumns.length ? searchColumns : DEFAULT_SEARCH_COLUMNS),
    [searchColumns]
  );
  const gridCols = columns.map(c => c.width ?? '1fr').join(' ');

  const [dateDigits, setDateDigits] = useState<string>(() => {
    if (!isDate) return '';
    const display = toDisplayStr(value, isDateTime);
    let digits = extractDigits(display);
    if (isDateTime && digits.length === 8) digits += '0000';
    return digits;
  });

  const dateDisplay = buildDateString(dateDigits, isDateTime);

  const skipSyncRef = useRef(false);
  useEffect(() => {
    if (!isDate) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const display = toDisplayStr(value, isDateTime);
    let digits = extractDigits(display);
    if (isDateTime && digits.length === 8) digits += '0000';
    setDateDigits(digits);
  }, [value]);

  const [inputDisplay, setInputDisplay] = useState<string>(() => {
    if (type !== 'searchNumber') return '';
    const v = value ?? '';
    if (!v) return '';
    const m = searchOptions.find(o => String(o.id) === String(v));
    return m ? buildDisplay(m, displayMode) : String(v);
  });

  useEffect(() => {
    if (type !== 'searchNumber') return;
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    const v = value ?? '';
    if (!v) {
      setInputDisplay('');
      return;
    }
    const m = searchOptions.find(o => String(o.id) === String(v));
    setInputDisplay(m ? buildDisplay(m, displayMode) : String(v));
  }, [value, type, displayMode, searchOptions]);

  // Mantiene el dropdown anclado al campo al hacer scroll o resize
  useEffect(() => {
    if (!showDropdown) return;
    const relayout = () => forceLayout(n => n + 1);
    window.addEventListener('scroll', relayout, true);
    window.addEventListener('resize', relayout);
    return () => {
      window.removeEventListener('scroll', relayout, true);
      window.removeEventListener('resize', relayout);
    };
  }, [showDropdown]);

  // Desplaza la fila resaltada al navegar con flechas
  useEffect(() => {
    if (highlightedIdx < 0 || !dropdownRef.current) return;
    const row = dropdownRef.current.querySelector<HTMLElement>(`[data-idx="${highlightedIdx}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIdx]);

  const getLocaleForCurrency = (codigo: string): string => {
    const localeMap: Record<string, string> = {
      PYG: 'de-DE',
      USD: 'en-US',
      EUR: 'de-DE',
      BRL: 'pt-BR',
      ARS: 'es-AR',
    };
    return localeMap[codigo] || 'de-DE';
  };

  const defaultMoneda: Moneda = {
    id: 0,
    codigo: 'PYG',
    nombre: 'Guaraní paraguayo',
    simbolo: '₲',
    decimales: 0,
    activo: true,
  };

  const config = (() => {
    const m = moneda || defaultMoneda;
    return {
      locale: getLocaleForCurrency(m.codigo),
      symbol: m.simbolo,
      digits: m.decimales,
    };
  })();

  const currentSearchTerm = type === 'searchNumber' ? inputDisplay : String(value ?? '');

  const filteredOptions = useMemo(() => {
    if (!isSearchType || !searchOptions.length) return [];
    if (listMode === 'all') return searchOptions;
    const term = currentSearchTerm.toLowerCase().trim();
    if (term.length < searchMinChars) return [];
    return searchOptions.filter(o => matchesTerm(o, term, columns));
  }, [currentSearchTerm, searchOptions, isSearchType, searchMinChars, listMode, columns]);

  const getDropdownLayout = () => {
    const input = inputRef.current;
    if (!input) return null;
    const anchor = (input.closest('[data-erp-field]') as HTMLElement | null) ?? input;
    const r = anchor.getBoundingClientRect();
    const width = Math.min(Math.max(r.width, 520), window.innerWidth - 16);
    let left = Math.min(r.left, window.innerWidth - width - 8);
    left = Math.max(8, left);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 280 && r.top > spaceBelow;
    return openUp
      ? { left, width, bottom: window.innerHeight - r.top + 4 }
      : { left, width, top: r.bottom + 4 };
  };

  const resolveCurrentId = () => {
    const d = inputRef.current?.value ?? inputDisplay;
    const m = searchOptions.find(o =>
      String(o.id) === d || o.texto === d || buildDisplay(o, displayMode) === d
    );
    return m ? String(m.id) : d;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;

    const newRaw = e.target.value;
    const prevDigits = dateDigits;
    const newDigits = extractDigits(newRaw);

    const prevDisplay = buildDateString(prevDigits, isDateTime);
    const isDeleting = newRaw.length < prevDisplay.length;
    const finalDigits = (isDeleting && newDigits.length === prevDigits.length)
      ? newDigits.slice(0, -1)
      : newDigits;

    skipSyncRef.current = true;
    setDateDigits(finalDigits);

    const displayStr = buildDateString(finalDigits, isDateTime);
    const isoValue = parseDisplayToISO(displayStr, isDateTime);
    onChange(isoValue);
  };

  const handleCalendarSelect = (display: string) => {
    let digits = '';
    if (isDateTime && display.includes('T')) {
      const [datePart, timePart] = display.split('T');
      const [year, month, day] = datePart.split('-');
      const [hour, min] = timePart.split(':');
      digits = day + month + year + hour + min;
    } else {
      digits = extractDigits(display.split('T')[0].replace(/-/g, ''));
    }
    skipSyncRef.current = true;
    setDateDigits(digits);
    onChange(display);
    setShowCalendar(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (disabled || readOnly) return;
    const { value: iv } = e.target;
    const target = e.target as HTMLInputElement;

    switch (type) {
      case 'checkbox':
        onChange(target.checked);
        break;
      case 'radio':
        onChange(target.value);
        break;
      case 'file':
        onChange(target.files?.[0] ?? null);
        break;
      case 'number':
      case 'range': {
        const numValue = iv === '' ? '' : Number(iv);
        if (numValue !== '' && max !== undefined && numValue > Number(max)) {
          onChange(Number(max));
          return;
        }
        if (numValue !== '' && min !== undefined && numValue < Number(min)) {
          onChange(Number(min));
          return;
        }
        onChange(numValue);
        break;
      }
      case 'tel': {
        if (!phoneMask) {
          onChange(iv);
          break;
        }
        const prevTel = String(value ?? '');
        const isDelTel = iv.length < prevTel.length;
        let digits = iv.replace(/\D/g, '');
        const prevDig = prevTel.replace(/\D/g, '');
        if (isDelTel && digits === prevDig) digits = digits.slice(0, -1);
        onChange(applyPhoneMask(digits.length < prevDig.length ? digits : iv, phoneMask));
        break;
      }
      case 'searchNumber':
        internalChangeRef.current = true;
        setInputDisplay(iv);
        onChange(iv);
        setListMode('filter');
        setShowDropdown(showSearchList);
        setHighlightedIdx(-1);
        break;
      case 'search':
        onChange(iv);
        setListMode('filter');
        setShowDropdown(showSearchList);
        setHighlightedIdx(-1);
        break;
      case 'currency': {
        const prevCur = String(displayValue).replace(/\D/g, '');
        let rd = iv.replace(/\D/g, '');
        if (iv.length < String(displayValue).length && rd === prevCur) rd = rd.slice(0, -1);
        if (!rd) {
          onChange('');
          return;
        }
        const finalValue = Number(rd) / Math.pow(10, config.digits);
        if (max !== undefined && finalValue > Number(max)) {
          onChange(Number(max));
          return;
        }
        if (min !== undefined && finalValue < Number(min)) {
          onChange(Number(min));
          return;
        }
        onChange(finalValue);
        break;
      }
      default:
        onChange(iv);
    }
  };

  const handleCheckboxChange = (optVal: string | number, chk: boolean) => {
    if (disabled || readOnly) return;

    if (checkboxMode === 'single') {
      onChange(chk ? optVal : null);
    } else {
      const cur = Array.isArray(checkedValues) ? checkedValues : [];
      onChange(chk ? [...cur, optVal] : cur.filter(v => String(v) !== String(optVal)));
    }
  };

  const handleSelectOption = (option: SearchOption) => {
    justSelectedRef.current = true;
    setInputDisplay(buildDisplay(option, displayMode));
    internalChangeRef.current = true;
    onChange(option.id);
    setShowDropdown(false);
    setHighlightedIdx(-1);
    onSelectOption?.(option);
    setTimeout(() => {
      justSelectedRef.current = false;
    }, 200);
  };

  const limpiarBusqueda = () => {
    if (disabled || readOnly) return;
    setInputDisplay('');
    setShowDropdown(false);
    setHighlightedIdx(-1);
    onChange('');
  };

  const openDropdownAll = () => {
    if (disabled || readOnly || !searchOpenOnClick || !showSearchList) return;
    setListMode('all');
    setShowDropdown(true);
    setHighlightedIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && filteredOptions.length > 0 && highlightedIdx >= 0) {
        handleSelectOption(filteredOptions[highlightedIdx]);
        return;
      }
      setShowDropdown(false);
      setHighlightedIdx(-1);
      onEnterPress?.(type === 'searchNumber' ? resolveCurrentId() : (inputRef.current?.value ?? String(value ?? '')));
      return;
    }
    if (!showDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      openDropdownAll();
      return;
    }
    if (!showDropdown || !filteredOptions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(p => Math.min(p + 1, filteredOptions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(p => Math.max(p - 1, -1));
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowDropdown(false);
      setHighlightedIdx(-1);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setHighlightedIdx(-1);
      if (!justSelectedRef.current) {
        onBlur?.(type === 'searchNumber' ? resolveCurrentId() : (inputRef.current?.value ?? inputDisplay));
      }
    }, 150);
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    };
    if (showDropdown) {
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (!showCalendar) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        calendarRef.current?.contains(t) ||
        inputRef.current?.contains(t) ||
        iconRef.current?.contains(t)
      ) return;
      setShowCalendar(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showCalendar]);

  useEffect(() => {
    if (!showCalendar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalendar(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCalendar]);

  if (type === 'color') {
    return (
      <ColorField
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        inputClassName={inputClassName}
        labelClassName={labelClassName}
        size={size}
      />
    );
  }

  if (type === 'checkbox') {
    return (
      <label
        className={`flex items-center cursor-pointer select-none gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        data-tooltip={(props as any)['data-tooltip']}
      >
        <div className="relative inline-block">
          <input {...(props as any)} type="checkbox" checked={!!value} disabled={disabled} readOnly={readOnly} onChange={handleChange} className="sr-only peer" />
          <div className={`w-6 h-6 rounded-lg transition-all duration-150 border-2 flex items-center justify-center ${!!value ? 'border-mi-tercera bg-mi-gradient shadow-md shadow-mi-tercera/30' : 'border-mi-primera/30 bg-white'}`}>
            {!!value && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
        {placeholder && <span className={`text-[15px] font-medium ${!!value ? 'text-mi-cuarta' : 'text-mi-cuarta/70'} ${labelClassName}`}>{placeholder}</span>}
      </label>
    );
  }

  if (type === 'radio') {
    const cClass = radioColumns && radioColumns > 1
      ? `grid gap-4 ${disabled ? 'opacity-50' : ''} ${className}`
      : `flex ${radioDirection === 'horizontal' ? 'flex-row items-center' : 'flex-col'} ${radioGap} ${disabled ? 'opacity-50' : ''} ${className}`;
    return (
      <div className={cClass} style={radioColumns && radioColumns > 1 ? { gridTemplateColumns: `repeat(${radioColumns},1fr)` } : undefined} data-tooltip={(props as any)['data-tooltip']}>
        {radioOptions.map(opt => (
          <label key={opt.value} className={`flex items-center cursor-pointer select-none gap-3 ${disabled || readOnly ? 'cursor-not-allowed' : ''}`}>
            <div className="relative inline-block">
              <input {...(props as any)} type="radio" name={props.name || 'radio-group'} value={opt.value}
                checked={String(value) === String(opt.value)} disabled={disabled || readOnly} onChange={handleChange} className="sr-only peer" />
              <div className={`w-6 h-6 rounded-full transition-all duration-150 border-2 flex items-center justify-center ${String(value) === String(opt.value) ? 'border-mi-tercera bg-white shadow-sm' : 'border-mi-primera/30 bg-white'}`}>
                {String(value) === String(opt.value) && <div className="w-3 h-3 bg-mi-gradient rounded-full" />}
              </div>
            </div>
            <span className={`text-[15px] font-medium ${String(value) === String(opt.value) ? 'text-mi-cuarta' : 'text-mi-cuarta/70'} ${labelClassName}`}>{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (type === 'checkbox-group') {
    const cClass = checkboxColumns && checkboxColumns > 1
      ? `grid gap-4 ${disabled ? 'opacity-50' : ''} ${className}`
      : `flex ${checkboxDirection === 'horizontal' ? 'flex-row items-center' : 'flex-col'} ${checkboxGap} ${disabled ? 'opacity-50' : ''} ${className}`;

    const getCheckedValues = () => {
      if (checkboxMode === 'single') {
        return value !== null && value !== undefined && value !== '' ? [value] : [];
      }
      return Array.isArray(checkedValues) ? checkedValues : [];
    };

    const cur = getCheckedValues();

    return (
      <div className={cClass} style={checkboxColumns && checkboxColumns > 1 ? { gridTemplateColumns: `repeat(${checkboxColumns},1fr)` } : undefined} data-tooltip={(props as any)['data-tooltip']}>
        {checkboxOptions?.map(opt => {
          const chk = cur.some(v => String(v) === String(opt.value));
          return (
            <label key={opt.value} className={`flex items-center cursor-pointer select-none gap-3 ${disabled || readOnly ? 'cursor-not-allowed' : ''}`}>
              <div className="relative inline-block">
                <input
                  type="checkbox"
                  checked={chk}
                  onChange={e => handleCheckboxChange(opt.value, e.target.checked)}
                  disabled={disabled || readOnly}
                  className="sr-only peer"
                />
                <div className={`w-6 h-6 rounded-lg transition-all duration-150 border-2 flex items-center justify-center ${chk ? 'border-mi-tercera bg-mi-gradient shadow-md shadow-mi-tercera/30' : 'border-mi-primera/30 bg-white'}`}>
                  {chk && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <span className={`text-[15px] font-medium ${chk ? 'text-mi-cuarta' : 'text-mi-cuarta/70'} ${labelClassName}`}>{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  const safeValue = value ?? '';
  let displayValue: any = safeValue;
  if (type === 'currency' && safeValue !== '') {
    displayValue = Number(safeValue).toLocaleString(config.locale, {
      minimumFractionDigits: config.digits,
      maximumFractionDigits: config.digits,
    });
  }
  if (type === 'searchNumber') displayValue = inputDisplay;

  const hasLeftIcon = !!icon || type === 'currency' || isDate || type === 'file';
  const datePlaceholder = isDateTime ? 'DD/MM/YYYY HH:MM' : 'DD/MM/YYYY';

  const hasValue = isDate
    ? dateDigits !== ''
    : type === 'file'
      ? !!value
      : String(displayValue ?? '') !== '';

  const showClear = isCleable && isSearchType && hasValue && !disabled && !readOnly;
  const hasRightActions = showClear
    || ((showSearch || showEdit || type === 'password') && !(isSearchType && !showSearch && !showEdit));
  const floated = hasLabel && (focused || hasValue);

  const actionBtn = `flex items-center justify-center ${S.padX} h-full text-mi-cuarta/40 hover:bg-mi-primera/10 hover:text-mi-tercera transition-colors cursor-pointer`;

  const inputPad = type === 'textarea'
    ? (hasLabel ? `${S.padX} ${S.pt} pb-1.5` : `${S.padX} ${S.py}`)
    : hasLabel
      ? (floated ? `${S.padX} ${S.pt} pb-0` : `${S.padX} ${S.py}`)
      : `${S.padX} ${S.py}`;

  const floatingLabel = hasLabel ? (
    <span
      className={`pointer-events-none absolute left-4 max-w-[calc(100%-2rem)] truncate leading-none transition-all duration-200 ease-out
        ${floated ? S.labelFloat : `top-1/2 -translate-y-1/2 ${S.labelRest}`} font-semibold
        ${disabled
          ? 'text-mi-cuarta/40'
          : floated ? 'text-mi-tercera/80' : 'text-mi-cuarta/50'}
        ${labelClassName}`}
    >
      {label}
    </span>
  ) : null;

  const heightClass = type === 'textarea' ? '' : S.height;
  const dropdownLayout = isSearchType && showDropdown ? getDropdownLayout() : null;

  return (
    <div
      data-erp-field
      className={`
        relative flex items-stretch w-full transition-all duration-200 ${S.radius}
        ${heightClass}
        ${disabled
          ? 'bg-mi-primera/5 border border-mi-primera/15 text-mi-cuarta/40 cursor-not-allowed'
          : `bg-white border border-mi-primera/20 text-mi-cuarta shadow-sm hover:shadow-md hover:border-mi-primera/40
             focus-within:border-mi-tercera focus-within:ring-2 focus-within:ring-mi-primera/30`}
        ${className}
      `}
      style={{ overflow: isSearchType ? 'visible' : 'hidden' }}
      data-tooltip={(props as any)['data-tooltip']}
    >

      {hasLeftIcon && (
        <div
          ref={iconRef}
          className={`flex items-center justify-center ${S.iconPad} border-r flex-shrink-0 ${S.radius} rounded-r-none transition-colors
            ${disabled
              ? 'bg-mi-primera/5 border-mi-primera/15 text-mi-cuarta/40'
              : 'bg-mi-primera/5 border-mi-primera/20 text-mi-tercera/70 hover:text-mi-tercera hover:bg-mi-primera/10'}
            ${type === 'textarea' ? 'self-stretch' : ''}
            ${isDate && !disabled && !readOnly ? 'cursor-pointer' : ''}
          `}
          onMouseDown={e => {
            if (isDate && !disabled && !readOnly) e.preventDefault();
          }}
          onClick={() => {
            if (isDate && !disabled && !readOnly) setShowCalendar(p => !p);
          }}
        >
          {type === 'currency'
            ? <span className={`${S.text} font-semibold leading-none text-mi-tercera`}>{config.symbol}</span>
            : <span className={`${S.iconBox} flex items-center justify-center`}>
                {isDate ? <Calendar size={S.iconPx} />
                  : type === 'file' ? <Paperclip size={S.iconPx} />
                  : icon}
              </span>
          }
        </div>
      )}

      <div className="flex-1 flex items-center min-w-0 relative" style={{ overflow: 'visible' }}>

        {type === 'textarea' ? (
          <>
            {floatingLabel}
            <textarea
              {...(props as any)}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
              value={displayValue}
              onChange={handleChange}
              onFocus={e => { setFocused(true); (props as any).onFocus?.(e); }}
              onBlur={e => { setFocused(false); (props as any).onBlur?.(e); }}
              rows={rows}
              className={`w-full bg-transparent outline-none ${inputPad} ${S.text} leading-relaxed resize-none text-mi-cuarta placeholder:text-mi-cuarta/40 ${inputClassName}`}
            />
          </>
        ) : isDate ? (
          <>
            {floatingLabel}
            <input
              {...(props as any)}
              ref={inputRef}
              type="text"
              inputMode="numeric"
              disabled={disabled}
              readOnly={readOnly}
              placeholder={floated ? (placeholder ?? datePlaceholder) : undefined}
              value={dateDisplay}
              maxLength={isDateTime ? 16 : 10}
              onChange={handleDateChange}
              onFocus={e => { setFocused(true); (props as any).onFocus?.(e); }}
              onBlur={() => {
                if (calendarMouseDownRef.current) {
                  calendarMouseDownRef.current = false;
                  return;
                }
                setFocused(false);
                const iso = parseDisplayToISO(dateDisplay, isDateTime);
                onBlur?.(iso);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const iso = parseDisplayToISO(dateDisplay, isDateTime);
                  onEnterPress?.(iso);
                  setShowCalendar(false);
                }
                if (e.key === 'Tab') setShowCalendar(false);
              }}
              className={`w-full h-full bg-transparent outline-none ${inputPad} ${S.text} leading-none text-mi-cuarta placeholder:text-mi-cuarta/40 disabled:cursor-not-allowed ${inputClassName}`}
            />
            {showCalendar && !disabled && !readOnly && (
              <CalendarPopup
                containerRef={calendarRef}
                display={dateDisplay}
                withTime={isDateTime}
                onSelect={handleCalendarSelect}
                onPopupPointerDown={() => {
                  calendarMouseDownRef.current = true;
                }}
                inputRef={inputRef}
              />
            )}
          </>

        ) : (
          <>
            {floatingLabel}
            <input
              {...(props as any)}
              ref={inputRef}
              type={
                type === 'currency' ? 'text'
                  : type === 'password' && showPassword ? 'text'
                  : type === 'search' ? 'text'
                  : type === 'searchNumber' ? 'text'
                  : type
              }
              disabled={disabled}
              readOnly={readOnly}
              placeholder={floated ? placeholder : undefined}
              {...(type !== 'file' ? { value: displayValue } : {})}
              max={type === 'number' || type === 'range' ? max : undefined}
              min={type === 'number' || type === 'range' ? min : undefined}
              onChange={handleChange}
              onFocus={e => { setFocused(true); (props as any).onFocus?.(e); }}
              onClick={isSearchType ? (e => {
                if (type === 'searchNumber' && inputDisplay) (e.currentTarget as HTMLInputElement).select();
                openDropdownAll();
              }) : undefined}
              onKeyDown={isSearchType ? handleKeyDown : undefined}
              onBlur={isSearchType
                ? () => { setFocused(false); handleBlur(); }
                : () => { setFocused(false); onBlur?.(String(value ?? '')); }}
              className={`w-full h-full bg-transparent outline-none ${inputPad} ${S.text} leading-none text-mi-cuarta placeholder:text-mi-cuarta/40 disabled:cursor-not-allowed font-normal ${inputClassName}`}
            />

            {isSearchType && showDropdown && dropdownLayout && ReactDOM.createPortal(
              <div
                ref={dropdownRef}
                onMouseDown={e => e.preventDefault()}
                className={`fixed bg-white border border-mi-primera/20 ${S.radius} shadow-2xl shadow-mi-cuarta/20 p-1.5 z-[9999] flex flex-col ${dropdownClassName}`}
                style={{
                  left: dropdownLayout.left,
                  width: dropdownLayout.width,
                  top: 'top' in dropdownLayout ? dropdownLayout.top : undefined,
                  bottom: 'bottom' in dropdownLayout ? dropdownLayout.bottom : undefined,
                  maxHeight: 360,
                }}
              >
                <div
                  className={`grid gap-3 px-3.5 py-2 ${sm ? 'text-[10px]' : 'text-[11px]'} font-semibold uppercase tracking-wide text-mi-cuarta/50 border-b border-mi-primera/10`}
                  style={{ gridTemplateColumns: gridCols }}
                >
                  {columns.map(c => (
                    <div
                      key={c.key}
                      className={`truncate ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {c.label}
                    </div>
                  ))}
                </div>

                <div className="overflow-y-auto flex-1 min-h-0">
                  {filteredOptions.length === 0 ? (
                    <div className={`px-3.5 py-3 ${S.text} text-mi-cuarta/50`}>Sin resultados</div>
                  ) : (
                    filteredOptions.map((opt, idx) => {
                      const active = highlightedIdx === idx;
                      return (
                        <div
                          key={`${opt.id}-${idx}`}
                          data-idx={idx}
                          onMouseEnter={() => setHighlightedIdx(idx)}
                          onMouseDown={e => {
                            e.preventDefault();
                            handleSelectOption(opt);
                          }}
                          className={`grid gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${S.text} items-center
                            ${active
                              ? 'bg-mi-gradient text-white font-semibold shadow-md shadow-mi-tercera/25'
                              : 'bg-white text-mi-cuarta/80 hover:bg-mi-primera/10 hover:text-mi-tercera'}`}
                          style={{ gridTemplateColumns: gridCols }}
                        >
                          {columns.map(c => {
                            const cellAlign = c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left';
                            const isIdCol = c.key === 'id';
                            const content = c.render
                              ? c.render(opt)
                              : <span className="truncate">{String(opt[c.key] ?? '')}</span>;
                            return (
                              <div
                                key={c.key}
                                className={`min-w-0 ${cellAlign} ${isIdCol && !active ? 'font-bold text-xs text-mi-tercera' : ''} ${isIdCol && active ? 'font-bold text-xs text-white/80' : ''}`}
                              >
                                {content}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

                {searchFooterLabel && onSearchFooterClick && (
                  <div
                    onMouseDown={e => {
                      e.preventDefault();
                      setShowDropdown(false);
                      onSearchFooterClick();
                    }}
                    className="mt-1.5 pt-2 px-3.5 py-2.5 border-t border-mi-primera/10 flex items-center gap-2 text-sm font-semibold text-mi-tercera cursor-pointer rounded-lg hover:bg-mi-primera/10 transition-colors"
                  >
                    <Plus size={S.iconPx} />
                    <span>{searchFooterLabel}</span>
                  </div>
                )}
              </div>,
              document.body
            )}
          </>
        )}
      </div>

      {hasRightActions && !disabled && (
        <div className={`flex items-center border-l border-mi-primera/20 ${S.radius} rounded-l-none`} style={{ overflow: 'visible' }}>
          {showClear && (
            <button type="button" onClick={limpiarBusqueda} title="Limpiar" tabIndex={-1} data-tooltip="Limpiar" className={actionBtn}>
              <X size={S.iconPx} />
            </button>
          )}
          {showSearch && isSearchType && (
            <button type="button" onClick={onSearchClick} title={searchTooltip} tabIndex={-1} data-tooltip={searchTooltip}
              className={`${actionBtn} ${showClear ? 'border-l border-mi-primera/20' : ''}`}>
              <Search size={S.iconPx} />
            </button>
          )}
          {showEdit && isSearchType && (
            <button type="button" onClick={onEditClick} title={editTooltip} tabIndex={-1} data-tooltip={editTooltip}
              className={`${actionBtn} ${showSearch || showClear ? 'border-l border-mi-primera/20' : ''}`}>
              <Edit2 size={S.iconPx} />
            </button>
          )}
          {showSearch && !isSearchType && (
            <button type="button" onClick={onSearchClick} title={searchTooltip} tabIndex={-1} data-tooltip={searchTooltip} className={actionBtn}>
              <Search size={S.iconPx} />
            </button>
          )}
          {showEdit && !isSearchType && (
            <button type="button" onClick={onEditClick} title={editTooltip} tabIndex={-1} data-tooltip={editTooltip}
              className={`${actionBtn} ${showSearch ? 'border-l border-mi-primera/20' : ''}`}>
              <Edit2 size={S.iconPx} />
            </button>
          )}
          {type === 'password' && !readOnly && (
            <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1} className={actionBtn}>
              {showPassword ? <EyeOff size={S.iconPx} /> : <Eye size={S.iconPx} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}