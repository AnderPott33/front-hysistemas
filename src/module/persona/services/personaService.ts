import axios from "axios";
import type { InterfacePersona } from "../interfaces/InterfacePersona";

const API = import.meta.env.VITE_API_URL;

// ─── Personas ───────────────────────────────────────────────────────────────

export const obtenerPersona = async (token: string) => {
    try {
        const result = await axios.get(`${API}/api/personas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener persona:", error);
        throw error;
    }
};

export const obtenerPersonaId = async (token: string, id: number) => {
    try {
        if (id == 0) {
            return null;
        }
        const result = await axios.get(`${API}/api/personas/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al obtener persona:", error);
        throw error;
    }
};

export const crearPersona = async (token: string, persona: InterfacePersona) => {
    try {
        const result = await axios.post(`${API}/api/personas`, persona, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al crear persona:", error);
        throw error;
    }
};

export const actualizarPersona = async (token: string, persona: InterfacePersona) => {
    try {
        const result = await axios.put(`${API}/api/personas/${persona.id}`, persona, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return result.data;
    } catch (error) {
        console.error("Error al actualizar persona:", error);
        throw error;
    }
};

// ─── Consulta RUC (SET) ─────────────────────────────────────────────────────

/** Respuesta cruda de https://ruc.sun.com.py/api/ruc/:ruc */
export interface InterfaceRucSet {
    data: {
        doc: number;
        dv: number;
        esEntidadPublica: boolean;
        esPersonaJuridica: boolean;
        estado: string;
        razonSocial: string;
        ruc: string;
    },
    message: string;
}
export interface InterfaceRucSetLimpio {
    doc: number;
    dv: number;
    esEntidadPublica: boolean;
    esPersonaJuridica: boolean;
    estado: string;
    razonSocial: string;
    ruc: string;
}

/** Datos listos para cargar en FormPersonas */
export interface InterfaceDatosPersonaRuc {
    tipo_persona: "Física" | "Jurídica";
    nombre: string;
    razon_social: string;
    ruc: string;
    cedula: number | null;
    categoria: string;
    departamento: string;
    ciudad: string;
    activo: boolean;
}

/* const normalizarRuc = (ruc: string) => ruc.replace(/\D/g, ""); */

export const buscarRuc = async (ruc: string): Promise<InterfaceRucSetLimpio> => {


    const result = await axios.get<InterfaceRucSet>(`${API}/api/ruc/${ruc}`);
    console.log(result.data?.data);

    return result.data?.data;
};

/** Convierte la respuesta del SET a los campos del formulario de personas */
export const mapearRucAPersona = (datos: InterfaceRucSetLimpio): InterfaceDatosPersonaRuc => {
    const esJuridica = datos.esPersonaJuridica;
    /* console.log(datos); */

    return {
        tipo_persona: esJuridica ? "Jurídica" : "Física",
        nombre: datos.razonSocial ?? "",
        razon_social: esJuridica ? (datos.razonSocial ?? "") : "",
        ruc: datos.ruc ?? datos.ruc,
        cedula: !esJuridica ? datos.doc : null,
        categoria: "Cliente",
        departamento: "",
        ciudad: "",
        activo: datos.estado ? true : false,
    };
};