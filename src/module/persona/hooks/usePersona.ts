import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { InterfacePersona } from "../interfaces/InterfacePersona";
import {
    obtenerPersona,
    obtenerPersonaId,
    crearPersona,
    actualizarPersona,
    buscarRuc,
    mapearRucAPersona,
    type InterfaceDatosPersonaRuc,
} from "../services/personaService";

import { showAlert } from "../../../components/utils/Procesando";

export const usePersona = () => {
    const { token } = useAuth();

    const [personas, setPersonas] = useState<InterfacePersona[]>([]);
    const [personaSeleccionada, setPersonaSeleccionada] = useState<InterfacePersona | null>(null);

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

    /** Consulta el RUC en el SET y devuelve los datos listos para el formulario (o null si falla) */
    const buscarDatosRuc = async (ruc: string): Promise<InterfaceDatosPersonaRuc | null> => {
        try {
            const data = await conLoading(() => buscarRuc(ruc));
            return mapearRucAPersona(data);
        } catch (error) {
            console.error("Error al consultar RUC:", error);
            return null;
        }
    };

    const cargarPersonas = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerPersona(token));
            setPersonas(data);
        } catch (error) {
            console.error("Error al cargar personas:", error);
        }
    };

    const cargarPersonaId = async (id: number) => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerPersonaId(token, id));
            setPersonaSeleccionada(data);
        } catch (error) {
            console.error("Error al cargar persona:", error);
        }
    };

    // Crea o actualiza según tenga id, y refresca el listado al finalizar
    const guardarPersona = async (persona: InterfacePersona) => {
        if (!token) return;
        const esEdicion = !!persona.id;

        try {
            const data = await conLoading(async () => {
                const respuesta = esEdicion
                    ? await actualizarPersona(token, persona)
                    : await crearPersona(token, persona);
                await cargarPersonas();
                return respuesta;
            });
            showAlert(data.mensaje, "success");
            return data;
        } catch (error) {
            console.error(
                esEdicion ? `Error al actualizar persona ${persona.id}:` : "Error al crear persona:",
                error
            );
            throw error;
        }
    };

    return {
        personas,
        cargarPersonas,
        cargarPersonaId,
        buscarDatosRuc,
        personaSeleccionada,
        loading,
        guardarPersona,
    };
};