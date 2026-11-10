import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { obtenerGrupoPrivilegiosId } from "../module/grupoPrivilegios/services/grupoPrivilegiosServices";
import type { IPrivilegio } from "../module/grupoPrivilegios/interfaces/grupoPrivilegiosInterfaces";

// Ajustá esta ruta de import de "grupoPrivilegiosServices" e "grupoPrivilegiosInterfaces"
// según donde realmente esté tu carpeta "grupoPrivilegios" dentro de src/.

interface PermisosContextType {
    privilegios: IPrivilegio[];
    loading: boolean;
    tienePermiso: (clave: string) => boolean;
    tieneAlguno: (claves: string[]) => boolean;
    tieneTodos: (claves: string[]) => boolean;
    recargarPermisos: () => Promise<void>;
}

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

export const PermisosProvider = ({ children }: { children: ReactNode }) => {
    // user.rol.id es el id de grupo_privilegios: tu authController arma "rol"
    // a partir del JOIN con grupo_privilegios (rol_id = grupo_privilegios.id).
    const { user, token, loading: authLoading, isAdmin } = useAuth();

    const [privilegios, setPrivilegios] = useState<IPrivilegio[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Evita refetch si ya cargamos los privilegios de este mismo grupo
    const ultimoGrupoCargado = useRef<number | null>(null);

    const cargarPrivilegios = useCallback(async () => {
        const idGrupo = user?.rol?.id ?? null;

        if (!user || !token || !idGrupo) {
            setPrivilegios([]);
            ultimoGrupoCargado.current = null;
            return;
        }

        try {
            setLoading(true);
            const data = await obtenerGrupoPrivilegiosId(token, idGrupo);
            setPrivilegios(data?.privilegios || []);
            ultimoGrupoCargado.current = idGrupo;
        } catch (error) {
            console.error("Error al cargar privilegios del usuario:", error);
            setPrivilegios([]);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        // Esperamos a que AuthContext termine de restaurar la sesión
        if (authLoading) return;

        const idGrupo = user?.rol?.id ?? null;

        if (!user || !token) {
            setPrivilegios([]);
            ultimoGrupoCargado.current = null;
            return;
        }

        // Ya tenemos los privilegios de este grupo cargados, no repetimos el fetch
        if (idGrupo && idGrupo === ultimoGrupoCargado.current) return;

        cargarPrivilegios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user?.rol?.id, token]);

    const tienePermiso = (clave: string): boolean => {
        // El Administrador ve todo, aunque su grupo no tenga cada clave marcada.
        // Sacá esta línea si preferís que el admin también dependa de lo marcado en el grupo.
        if (isAdmin) return true;

        return privilegios.some(priv =>
            priv.acciones.some(a => a.clave === clave && a.marcada)
        );
    };

    const tieneAlguno = (claves: string[]): boolean => {
        return claves.some(clave => tienePermiso(clave));
    };

    const tieneTodos = (claves: string[]): boolean => {
        return claves.every(clave => tienePermiso(clave));
    };

    return (
        <PermisosContext.Provider
            value={{ privilegios, loading, tienePermiso, tieneAlguno, tieneTodos, recargarPermisos: cargarPrivilegios }}
        >
            {children}
        </PermisosContext.Provider>
    );
};

export const usePermisos = () => {
    const ctx = useContext(PermisosContext);
    if (!ctx) throw new Error("usePermisos debe usarse dentro de un PermisosProvider");
    return ctx;
};