import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { applyThemeColor, isValidHexColor, setLocalThemeColor } from "../theme/theme";

const API = import.meta.env.VITE_API_URL;

// --- TIPOS ---

/** Rol del usuario tal como llega desde el backend */
export type Rol = {
    id: number | null;
    nombre: string | null;
};

/**
 * Objeto user que devuelve el backend en /auth/login y /usuarios/me.
 * No incluye `persona_id` ni `supervisor` porque no son columnas de `usuarios`
 * ni el controller las calcula.
 */
export type User = {
    id: number;
    nombre: string;
    email: string;
    rol: Rol;
    activo: boolean;
    es_usuario_master: boolean;
    themeColor?: string | null;
    themeMode?: 'light' | 'dark' | null;
};
/** Payload decodificado del JWT (lo que firma el backend) */
export type JwtPayload = {
    id: number;
    nombre: string;
    email: string;
    rol_id: number | null;
    rol_nombre: string | null;
    es_usuario_master: boolean;
    iat: number;
    exp: number;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    showExpiringAlert: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    /** Helper: true si el usuario es usuario maestro */
    isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user";

// --- PROVIDER ---
// La sesión se guarda en sessionStorage (no localStorage): sobrevive a un
// refresh de la página, pero se borra al cerrar la pestaña o el navegador,
// y no se comparte entre pestañas distintas.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExpiringAlert, setShowExpiringAlert] = useState(false);

    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    }, []);

    const logout = useCallback(() => {
        clearTimers();
        setToken(null);
        setUser(null);
        setShowExpiringAlert(false);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        // El tema local no se borra: es preferencia del equipo, no de la sesión
    }, [clearTimers]);

    const setupTimers = useCallback(
        (expiryTime: number) => {
            clearTimers();
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = expiryTime - currentTime;

            if (timeLeft > 0) {
                logoutTimerRef.current = setTimeout(() => {
                    console.warn("Sesión expirada");
                    logout();
                }, timeLeft * 1000);

                const warningBuffer = 5 * 60;
                const timeUntilWarning = timeLeft - warningBuffer;

                if (timeUntilWarning > 0) {
                    warningTimerRef.current = setTimeout(() => {
                        setShowExpiringAlert(true);
                    }, timeUntilWarning * 1000);
                } else {
                    setShowExpiringAlert(true);
                }
            } else {
                logout();
            }
        },
        [logout, clearTimers]
    );

    // Sincroniza el tema con el usuario autenticado (color del servidor)
    const syncThemeFromUser = useCallback((u: User | null) => {
        if (u?.themeColor && isValidHexColor(u.themeColor)) {
            applyThemeColor(u.themeColor);
            setLocalThemeColor(u.themeColor);
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        setShowExpiringAlert(false);
        sessionStorage.setItem(TOKEN_KEY, newToken);
        sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));

        syncThemeFromUser(newUser);

        try {
            const decoded = jwtDecode<JwtPayload>(newToken);
            setupTimers(decoded.exp);
        } catch (error) {
            console.error("Error decodificando el token en login", error);
            logout();
        }
    };

    // Al montar, restaura la sesión desde sessionStorage y pide al servidor
    // los datos actuales (incluye themeColor de la base de datos).
    useEffect(() => {
        const cargarSesion = async () => {
            try {
                const storedToken = sessionStorage.getItem(TOKEN_KEY);
                const storedUser = sessionStorage.getItem(USER_KEY);

                if (storedToken && storedUser) {
                    const decoded = jwtDecode<JwtPayload>(storedToken);
                    const currentTime = Math.floor(Date.now() / 1000);

                    if (decoded.exp < currentTime) {
                        logout();
                    } else {
                        const parsedUser = JSON.parse(storedUser) as User;
                        setToken(storedToken);
                        setUser(parsedUser);
                        setupTimers(decoded.exp);

                        // Refresca el usuario desde el servidor antes de quitar el loader
                        try {
                            const { data } = await axios.get<{ user: User }>(
                                `${API}/api/usuarios/me`,
                                { headers: { Authorization: `Bearer ${storedToken}` } }
                            );
                            const freshUser = data.user;
                            setUser(freshUser);
                            sessionStorage.setItem(USER_KEY, JSON.stringify(freshUser));
                            syncThemeFromUser(freshUser);
                        } catch (err) {
                            // Sin conexión: se usa lo guardado en sessionStorage
                            console.warn("No se pudo refrescar el usuario", err);
                            syncThemeFromUser(parsedUser);
                        }
                    }
                }
            } catch (error) {
                console.error("Error al cargar sesión", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        cargarSesion();
        return () => clearTimers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper derivado del user
    const isAdmin = user?.es_usuario_master ? true : false;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                loading,
                showExpiringAlert,
                login,
                logout,
                isAdmin,
            }}
        >
            {/* Alerta Global de Expiración */}
            {showExpiringAlert && (
                <div className="fixed top-5 right-5 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="relative bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-4 rounded shadow-2xl flex flex-col gap-2 min-w-[300px] pr-8 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-600">
                        <button
                            onClick={() => setShowExpiringAlert(false)}
                            className="absolute top-2 right-2 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 text-lg font-bold leading-none p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 transition-colors"
                            title="Cerrar aviso"
                        >
                            &times;
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚠️</span>
                            <p className="font-bold text-sm">¡Aviso de seguridad!</p>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300/90 max-w-[260px]">
                            Tu sesión expirará en menos de 5 minutos. Por seguridad, guardá tus cambios antes de que se cierre automáticamente.
                        </p>
                    </div>
                </div>
            )}

            {!loading ? (
                children
            ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#359bac]"></div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

// --- HOOK PERSONALIZADO ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};