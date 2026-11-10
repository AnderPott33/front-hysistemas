import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    DEFAULT_COLOR,
    applyThemeColor,
    getLocalThemeColor,
    setLocalThemeColor,
    isValidHexColor,
} from './theme';

interface UseThemeColorResult {
    color: string;
    changeColor: (newColor: string) => Promise<void>;
}

const API = import.meta.env.VITE_API_URL;

export function useThemeColor(): UseThemeColorResult {
    const { user, token } = useAuth();

    const [color, setColor] = useState<string>(
        () => getLocalThemeColor() ?? DEFAULT_COLOR
    );

    // Aplica el color en pantalla cada vez que cambie
    useEffect(() => {
        applyThemeColor(color);
    }, [color]);

    // Si el servidor trae un color (login o restauración de sesión), se refleja aquí
    useEffect(() => {
        const serverColor = user?.themeColor;
        if (serverColor && isValidHexColor(serverColor)) {
            setColor(serverColor);
            setLocalThemeColor(serverColor);
        }
    }, [user?.id, user?.themeColor]);

    const changeColor = useCallback(
        async (newColor: string): Promise<void> => {
            if (!isValidHexColor(newColor)) return;

            const previousColor = color;
            setColor(newColor);
            setLocalThemeColor(newColor);

            if (!user || !token) return;

            try {
                await axios.patch(
                    `${API}/api/usuarios/me/preferencias`,
                    { themeColor: newColor },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    console.error('No se pudo guardar el tema:', err.response?.status, err.response?.data);
                } else {
                    console.error('Error al guardar el tema:', err);
                }
            }
        },
        [user, token, color]
    );

    return { color, changeColor };
}