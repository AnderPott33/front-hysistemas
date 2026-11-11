import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceGrupoPrivilegios } from "../interfaces/grupoPrivilegiosInterfaces";
import {
    obtenerGruposPrivilegios,
    obtenerGrupoPrivilegiosId,
    crearGrupoPrivilegios,
    actualizarGrupoPrivilegios,
    eliminarGrupoPrivilegios,
} from "../services/grupoPrivilegiosServices";
import { showAlert } from "../../../components/utils/Procesando";

export const useGrupoPrivilegios = () => {
    const { token } = useAuth();

    const [gruposPrivilegios, setGruposPrivilegios] = useState<InterfaceGrupoPrivilegios[]>([]);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<InterfaceGrupoPrivilegios | null>(null);

    // Contador de operaciones en curso: loading es true mientras quede alguna pendiente
    const [operacionesPendientes, setOperacionesPendientes] = useState(0);
    const loading = operacionesPendientes > 0;

    const conLoading = async <T,>(operacion: () => Promise<T>): Promise<T> => {
        setOperacionesPendientes((n) => n + 1);
        try {
            return await operacion();
        } finally {
            setOperacionesPendientes((n) => n - 1);
        }
    };

    const cargarGrupos = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerGruposPrivilegios(token));
            setGruposPrivilegios(data || []);
        } catch (error) {
            console.error("Error al cargar grupos de privilegios:", error);
            showAlert("Error al cargar grupos de privilegios", "error");
        }
    };

    const cargarGrupoPorId = async (id: number) => {
        if (!token) return;
        if (!id) {
            setGrupoSeleccionado(null);
            return;
        }
        try {
            const data = await conLoading(() => obtenerGrupoPrivilegiosId(token, id));
            setGrupoSeleccionado(data || null);
        } catch (error) {
            console.error(`Error al cargar grupo ${id}:`, error);
            showAlert("Error al cargar grupo de privilegios", "error");
        }
    };

    const guardarGrupo = async (grupo: any) => {
        if (!token) return;
        try {
            const data = await conLoading(async () => {
                const respuesta = grupo.id && grupo.id !== ''
                    ? await actualizarGrupoPrivilegios(token, grupo.id, grupo)
                    : await crearGrupoPrivilegios(token, grupo);
                await cargarGrupos();
                if (respuesta?.grupo) {
                    setGrupoSeleccionado(respuesta.grupo);
                }
                return respuesta;
            });
            showAlert(
                grupo.id && grupo.id !== ''
                    ? 'Grupo de privilegios actualizado correctamente'
                    : 'Grupo de privilegios creado correctamente',
                'success'
            );
            return data;
        } catch (error) {
            console.error("Error al guardar grupo de privilegios:", error);
            showAlert('No se pudo procesar grupo de privilegios', 'error');
            throw error;
        }
    };

    const borrarGrupo = async (id: number) => {
        if (!token) return;
        try {
            await conLoading(async () => {
                await eliminarGrupoPrivilegios(token, id);
                await cargarGrupos();
                setGrupoSeleccionado(null);
            });
            showAlert('Grupo de privilegios eliminado correctamente', 'success');
        } catch (error) {
            console.error("Error al eliminar grupo de privilegios:", error);
            showAlert('No se pudo eliminar el grupo de privilegios', 'error');
            throw error;
        }
    };

    return {
        gruposPrivilegios,
        grupoSeleccionado,
        loading,
        cargarGrupos,
        cargarGrupoPorId,
        guardarGrupo,
        borrarGrupo,
    };
};