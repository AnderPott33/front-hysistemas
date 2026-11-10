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
    const [loading, setLoading] = useState<boolean>(false);

    /** Consulta el RUC en el SET y devuelve los datos listos para el formulario (o null si falla) */
    const buscarDatosRuc = async (ruc: string): Promise<InterfaceDatosPersonaRuc | null> => {
        try {
            setLoading(true);
            const data = await buscarRuc(ruc);
            return mapearRucAPersona(data);
        } catch (error) {
            console.error("Error al consultar RUC:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const cargarPersonas = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerPersona(token);
            setPersonas(data);
        } catch (error) {
            console.error("Error al cargar personas:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarPersonaId = async (id: number) => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await obtenerPersonaId(token, id);
            setPersonaSeleccionada(data);
        } catch (error) {
            console.error("Error al cargar persona:", error);
        } finally {
            setLoading(false);
        }
    };

    // Crea o actualiza según tenga id, y refresca el listado al finalizar
    const guardarPersona = async (persona: InterfacePersona) => {
        if (!token) return;
        const esEdicion = !!persona.id;

        try {
            setLoading(true);
            const data = esEdicion
                ? await actualizarPersona(token, persona)
                : await crearPersona(token, persona);
            await cargarPersonas();
            showAlert(data.mensaje, "success");
            return data;
        } catch (error) {
            console.error(
                esEdicion ? `Error al actualizar persona ${persona.id}:` : "Error al crear persona:",
                error
            );
            throw error;
        } finally {
            setLoading(false);
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