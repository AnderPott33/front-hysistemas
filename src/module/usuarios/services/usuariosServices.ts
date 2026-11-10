import axios from "axios";
import { showAlert } from "../../../components/utils/Procesando";

const API = import.meta.env.VITE_API_URL;

export const obtenerUsuarios = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/usuarios/usuarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
};

export const obtenerUsuarioId = async (token: string, id: number) => {
    try {
        const result = await axios.get(`${API}/api/usuarios/usuarios/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data || [];
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        throw error;
    }
};

export const crearUsuario = async (token: string, usuario: any) => {

    try {
        const result = await axios.post(`${API}/api/usuarios/create-user`, usuario, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al crear usuario:", error);
        throw error;
    }
};

export const actualizarUsuario = async (token: string, id: number, usuario: any) => {
    const userId = id
    try {
        const result = await axios.put(`${API}/api/usuarios/${userId}`, usuario, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        throw error;
    }
};

export const cambiarContrasena = async (
  token: string,
  currentPassword: string,
  newPassword: string,
  userId: number
) => {
  try {
    // Validaciones básicas
    if (!currentPassword || !newPassword) {
      throw new Error('Las contraseñas actual y nueva son requeridas');
    }

    /* if (newPassword.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    } */

    if (currentPassword === newPassword) {
      throw new Error('La nueva contraseña no puede ser igual a la actual');
    }

    // Llamada al API
    const result = await axios.post(
      `${API}/api/usuarios/change-password`,
      { currentPassword, newPassword, userId },
      { 
        headers: { Authorization: `Bearer ${token}` } 
      }
    );

    // Éxito
    showAlert(result.data.message || 'Contraseña actualizada exitosamente', 'success');
    return result.data;

  } catch (error) {
    // Manejo específico de errores
    let errorMessage = 'Ocurrió un error al cambiar la contraseña';

    if (axios.isAxiosError(error)) {
      // Error de respuesta del servidor
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Contraseña actual incorrecta o sesión expirada';
      } else if (error.response?.status === 404) {
        errorMessage = 'Usuario no encontrado';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Datos inválidos';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor';
      }
    } else if (error instanceof Error) {
      // Error de validación local
      errorMessage = error.message;
    }

    showAlert(errorMessage, 'error');
    throw error;
  }
};

export const cambiarContrasenaAdmin = async (
  token: string,
  newPassword: string,
  userId: number
) => {
  try {
    // Validaciones básicas
    if ( !newPassword) {
      throw new Error('Las contraseñas actual y nueva son requeridas');
    }


    // Llamada al API
    const result = await axios.post(
      `${API}/api/usuarios/change-passwordAdmin`,
      { newPassword, userId },
      { 
        headers: { Authorization: `Bearer ${token}` } 
      }
    );

    // Éxito
    showAlert(result.data.message || 'Contraseña actualizada exitosamente', 'success');
    return result.data;

  } catch (error) {
    // Manejo específico de errores
    let errorMessage = 'Ocurrió un error al cambiar la contraseña';

    showAlert(errorMessage, 'error');
    throw error;
  }
};