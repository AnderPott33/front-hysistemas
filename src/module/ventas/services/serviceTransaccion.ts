/* import axios from "axios";
import type { PayloadTransaccion } from "../interfaces/interfaceTransaccion";


const API = import.meta.env.VITE_API_URL;

// ─── Transacciones ────────────────────────────────────────────────────────────

export const crearTransaccion = async (
    token: string,
    payload: PayloadTransaccion
) => {
    try {
        const result = await axios.post(
            `${API}/api/transacciones`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return result;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            const mensaje =
                error.response?.data?.message ||
                error.response?.data?.mensaje ||
                error.response?.data?.error ||
                error.response?.data?.details ||
                error.message ||
                'Error al crear la transacción';

            console.error('Error del backend:', error.response?.data);

            throw new Error(mensaje);
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new Error('Error desconocido al crear la transacción');
    }
};

 */