import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfaceUsuarios } from "../interfaces/usuariosInterfaces";
import {
    obtenerUsuarios,
    obtenerUsuarioId,
    crearUsuario,
    cambiarContrasena,
    actualizarUsuario,
    cambiarContrasenaAdmin,
} from "../services/usuariosServices";
import { showAlert } from "../../../components/utils/Procesando";

export const useUsuarios = () => {
    const { token } = useAuth();

    const [usuarios, setUsuarios] = useState<InterfaceUsuarios[]>([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<InterfaceUsuarios | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const cargarUsuarios = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerUsuarios(token);
            setUsuarios(data || []);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarUsuarioPorId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            if (id) {
                const data = await obtenerUsuarioId(token, id);
                setUsuarioSeleccionado(data || []);
            } else {
                setUsuarioSeleccionado(null);
            }
        } catch (error) {
            console.error(`Error al cargar usuario ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarUsuario = async (usuario: any) => {
        if (!token) return;
        try {
            setLoading(true);
            let data;
            console.log(usuario); 

            if (usuario.id || usuario.id != '') {
                const { password, ...updateData } = usuario;
                const id = usuario.id
                data = await actualizarUsuario(token, id, updateData);
                showAlert('Usuario actualizado correctamente', 'success')
            } else {
                data = await crearUsuario(token, usuario);
                showAlert('Usuario creado correctamente', 'success')
            }

            await cargarUsuarios();
            if (data?.user) {
                setUsuarioSeleccionado(data.user);
            }
            return data;
        } catch (error) {
            /* console.error("Error al guardar usuario:", error); */
            showAlert('No se pudo procesar usuarios', 'error')
            throw error;
        } finally {
            setLoading(false);
        }
    };
    const cambiarPassword = async (currentPassword: string, newPassword: string, userId: number | null) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await cambiarContrasena(token, currentPassword, newPassword, Number(userId));
            return data;
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    const cambiarPasswordAdmin = async (newPassword: string, userId: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await cambiarContrasenaAdmin(token, newPassword, Number(userId));
            return data;
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        usuarios,
        usuarioSeleccionado,
        cambiarPassword,
        cambiarPasswordAdmin,
        loading,
        cargarUsuarios,
        cargarUsuarioPorId,
        guardarUsuario,
    };
};
