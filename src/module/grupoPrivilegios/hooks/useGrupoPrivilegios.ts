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
    const [loading, setLoading] = useState<boolean>(false);

    const cargarGrupos = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerGruposPrivilegios(token);
            setGruposPrivilegios(data || []);
        } catch (error) {
            console.error("Error al cargar grupos de privilegios:", error);
            showAlert("Error al cargar grupos de privilegios", "error");
        } finally {
            setLoading(false);
        }
    };

    const cargarGrupoPorId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            if (id) {
                const data = await obtenerGrupoPrivilegiosId(token, id);
                setGrupoSeleccionado(data || null);
            } else {
                setGrupoSeleccionado(null);
            }
        } catch (error) {
            console.error(`Error al cargar grupo ${id}:`, error);
            showAlert("Error al cargar grupo de privilegios", "error");
        } finally {
            setLoading(false);
        }
    };

    const guardarGrupo = async (grupo: any) => {
        if (!token) return;
        try {
            setLoading(true);
            let data;

            if (grupo.id && grupo.id !== '') {
                const id = grupo.id;
                data = await actualizarGrupoPrivilegios(token, id, grupo);
                showAlert('Grupo de privilegios actualizado correctamente', 'success');
            } else {
                data = await crearGrupoPrivilegios(token, grupo);
                showAlert('Grupo de privilegios creado correctamente', 'success');
            }

            await cargarGrupos();
            if (data?.grupo) {
                setGrupoSeleccionado(data.grupo);
            }
            return data;
        } catch (error) {
            console.error("Error al guardar grupo de privilegios:", error);
            showAlert('No se pudo procesar grupo de privilegios', 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const borrarGrupo = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            await eliminarGrupoPrivilegios(token, id);
            showAlert('Grupo de privilegios eliminado correctamente', 'success');
            await cargarGrupos();
            setGrupoSeleccionado(null);
        } catch (error) {
            console.error("Error al eliminar grupo de privilegios:", error);
            showAlert('No se pudo eliminar el grupo de privilegios', 'error');
            throw error;
        } finally {
            setLoading(false);
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
