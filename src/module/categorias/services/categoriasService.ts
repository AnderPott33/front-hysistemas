import axios from "axios";
import type {
    InterfaceCategoriaForm,
    InterfaceSubcategoriaForm,
    tipoCategoria,
} from "../interfaces/InterfaceCategoria";

const API = import.meta.env.VITE_API_URL;

const config = (token: string, params?: Record<string, string>) => ({
    headers: { Authorization: `Bearer ${token}` },
    params,
});

export const obtenerCategorias = async (token: string) => {
    const result = await axios.get(`${API}/api/categorias`, config(token));
    return result.data;
};

export const obtenerCategoriaId = async (token: string, id: number) => {
    const result = await axios.get(`${API}/api/categorias/${id}`, config(token));
    return result.data;
};

export const crearOActualizarCategoria = async (token: string, categoria: InterfaceCategoriaForm) => {
    const result = await axios.post(`${API}/api/categorias`, categoria, config(token));
    return result.data;
};

export const obtenerSubcategorias = async (token: string) => {
    const result = await axios.get(`${API}/api/subcategorias`, config(token));
    return result.data;
};

export const obtenerSubcategoriaId = async (token: string, id: number, tipo: tipoCategoria) => {
    const result = await axios.get(`${API}/api/subcategorias/${id}`, config(token, { tipo }));
    return result.data;
};

export const crearOActualizarSubcategoria = async (token: string, subcategoria: InterfaceSubcategoriaForm) => {
    const result = await axios.post(`${API}/api/subcategorias`, subcategoria, config(token));
    return result.data;
};
