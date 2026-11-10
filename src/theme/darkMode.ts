import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './darkMode.css';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'erp-theme-mode';
const MODE_EVENT = 'erp-theme-mode-change';
const ANIMATION_MS = 350;
const DEFAULT_MODE: ThemeMode = 'light';
const API = import.meta.env.VITE_API_URL;

export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function getLocalThemeMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isValidThemeMode(value) ? value : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function setLocalThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage bloqueado: ignorar */
  }
}

export function applyThemeMode(mode: ThemeMode, animate = false): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('dm-animating');
    window.setTimeout(() => root.classList.remove('dm-animating'), ANIMATION_MS);
  }
  root.classList.toggle('dark', mode === 'dark');
}

/** Llamar antes de renderizar la app (main.tsx), junto a initTheme() */
export function initDarkMode(): void {
  applyThemeMode(getLocalThemeMode());
}

/** Guarda el modo en este navegador y notifica a todos los componentes montados */
export function setGlobalThemeMode(mode: ThemeMode, animate = true): void {
  setLocalThemeMode(mode);
  applyThemeMode(mode, animate);
  window.dispatchEvent(new CustomEvent<ThemeMode>(MODE_EVENT, { detail: mode }));
}

export function useDarkMode() {
  const { user, token } = useAuth();
  const [mode, setMode] = useState<ThemeMode>(getLocalThemeMode);

  // Aplica la clase "dark" en <html> cada vez que cambie el modo
  useLayoutEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  // Escucha cambios globales (por ejemplo, el admin aplicó el modo a todos)
  useEffect(() => {
    const onChange = (e: Event) => setMode((e as CustomEvent<ThemeMode>).detail);
    window.addEventListener(MODE_EVENT, onChange);
    return () => window.removeEventListener(MODE_EVENT, onChange);
  }, []);

  // Si el servidor trae el modo del usuario (login o restauración de sesión), se refleja aquí
  useEffect(() => {
    const serverMode = user?.themeMode;
    if (isValidThemeMode(serverMode)) {
      setGlobalThemeMode(serverMode, false);
    }
  }, [user?.id, user?.themeMode]);

  const changeMode = useCallback(
    async (next: ThemeMode): Promise<void> => {
      const previous = mode;
      setGlobalThemeMode(next);

      if (!user || !token) return;

      try {
        await axios.patch(
          `${API}/api/usuarios/me/preferencias`,
          { themeMode: next },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('No se pudo guardar el modo de tema:', err);
        setGlobalThemeMode(previous);
      }
    },
    [mode, user, token]
  );

  const toggle = useCallback(() => {
    void changeMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, changeMode]);

  return { mode, isDark: mode === 'dark', toggle, changeMode };
}