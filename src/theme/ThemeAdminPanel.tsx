import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ThemePicker from './ThemePicker';
import { applyThemeColor, isValidHexColor, setLocalThemeColor } from './theme';
import {
    applyThemeMode,
    getLocalThemeMode,
    setGlobalThemeMode,
    type ThemeMode,
} from './darkMode';
import { confirmar } from '../components/utils/Procesando';

const API = import.meta.env.VITE_API_URL;

type Status = 'idle' | 'saving' | 'ok' | 'error';

interface ThemeAdminPanelProps {
    color: string;
}

const MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
];

export default function ThemeAdminPanel({ color }: ThemeAdminPanelProps) {
    const { token, isAdmin } = useAuth();
    const [draft, setDraft] = useState<string>(color);
    const [draftMode, setDraftMode] = useState<ThemeMode>(getLocalThemeMode);
    const [status, setStatus] = useState<Status>('idle');

    // Solo usuarios maestros ven el panel. La protección real está en requireMaster (servidor).
    if (!isAdmin || !token) return null;

    const handleColorPreview = (newColor: string) => {
        setDraft(newColor);
        applyThemeColor(newColor); // solo vista previa en esta pantalla
    };

    const handleModePreview = (newMode: ThemeMode) => {
        setDraftMode(newMode);
        applyThemeMode(newMode, true); // solo vista previa, no guarda nada
    };

    // Revierte la vista previa al color y modo guardados
    const revertPreview = () => {
        setDraft(color);
        applyThemeColor(color);
        const savedMode = getLocalThemeMode();
        setDraftMode(savedMode);
        applyThemeMode(savedMode);
    };

    const handleApplyAll = async () => {
        if (!isValidHexColor(draft)) return;

        const ok = await confirmar(
            'Tema global',
            'Este color y modo se aplicarán a TODOS los usuarios. ¿Deseas continuar?',
            'Aplicar',
            'Cancelar'
        );

        if (!ok) {
            revertPreview();
            return;
        }

        setStatus('saving');
        try {
            await axios.patch(
                `${API}/api/usuarios/usuarios/preferencias/todos`,
                { themeColor: draft, themeMode: draftMode },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // El servidor confirmó: guarda el color y modo en este navegador
            setLocalThemeColor(draft);
            applyThemeColor(draft);
            setGlobalThemeMode(draftMode);
            setStatus('ok');
        } catch (err) {
            console.error('Error al aplicar tema a todos:', err);
            revertPreview();
            setStatus('error');
        }
    };

    return (
        <section className="p-6 bg-white rounded-2xl border-l-4 border-mi-primera">
            <h2 className="text-mi-cuarta font-semibold mb-1">Tema global de la empresa</h2>
            <p className="text-sm text-gray-500 mb-4">
                Solo usuarios maestros. Aplica un color y un modo (claro u oscuro) a todos los usuarios del sistema.
            </p>

            <p className="text-sm font-medium text-mi-cuarta mb-2">Color</p>
            <ThemePicker color={draft} onChange={handleColorPreview} />

            <p className="text-sm font-medium text-mi-cuarta mt-5 mb-2">Modo</p>
            <div className="flex gap-2">
                {MODE_OPTIONS.map((opt) => {
                    const selected = draftMode === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => handleModePreview(opt.value)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                                selected
                                    ? 'bg-mi-primera text-white border-mi-primera'
                                    : 'bg-white text-mi-cuarta border-mi-primera/20 hover:bg-mi-primera/10'
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-3 mt-6">
                <button
                    type="button"
                    onClick={handleApplyAll}
                    disabled={status === 'saving'}
                    className="px-4 py-2 rounded-lg bg-mi-primera text-white font-medium"
                >
                    {status === 'saving' ? 'Aplicando...' : 'Aplicar a todos'}
                </button>

                {status === 'ok' && <span className="text-sm text-green-600">Tema aplicado</span>}
                {status === 'error' && <span className="text-sm text-red-600">No se pudo aplicar</span>}
            </div>
        </section>
    );
}