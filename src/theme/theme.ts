export const DEFAULT_COLOR = '#9942f0';
const STORAGE_KEY = 'erp-theme-color';

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_REGEX.test(value);
}

export function applyThemeColor(color: string): void {
  document.documentElement.style.setProperty('--color-base', color);
}

export function getLocalThemeColor(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && isValidHexColor(value) ? value : null;
  } catch {
    return null;
  }
}

export function setLocalThemeColor(color: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, color);
  } catch {
    /* storage bloqueado: ignorar */
  }
}

// Llamar antes de renderizar la app para evitar parpadeo de color
export function initTheme(): void {
  applyThemeColor(getLocalThemeColor() ?? DEFAULT_COLOR);
}