import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import type {
    InterfaceCategoria,
    InterfaceCategoriaForm,
    InterfaceSubcategoria,
    InterfaceSubcategoriaForm,
    tipoCategoria,
} from "../interfaces/InterfaceCategoria";
import {
    crearOActualizarCategoria,
    crearOActualizarSubcategoria,
    obtenerCategoriaId,
    obtenerCategorias,
    obtenerSubcategoriaId,
    obtenerSubcategorias,
} from "../services/categoriasService";
import { showAlert } from "../../../components/utils/Procesando";

const mensajeError = (error: any, fallback: string) => error?.response?.data?.error ?? fallback;

export const useCategorias = () => {
    const { token } = useAuth();

    const [categorias, setCategorias] = useState<InterfaceCategoria[]>([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<InterfaceCategoria | null>(null);
    const [subcategorias, setSubcategorias] = useState<InterfaceSubcategoria[]>([]);
    const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<InterfaceSubcategoria | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const cargarCategorias = async () => {
        if (!token) return;
        try {
            setLoading(true);
            setCategorias(await obtenerCategorias(token));
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCategoriaPorId = async (id: number) => {
        if (!token) return;
        if (!id) {
            setCategoriaSeleccionada(null);
            return;
        }
        try {
            setLoading(true);
            setCategoriaSeleccionada(await obtenerCategoriaId(token, id));
        } catch (error) {
            console.error(`Error al cargar la categoría ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarCategoria = async (categoria: InterfaceCategoriaForm): Promise<boolean> => {
        if (!token) return false;
        try {
            setLoading(true);
            const data = await crearOActualizarCategoria(token, categoria);
            // Cambiar el tipo de una categoría afecta la lista de subcategorías
            await Promise.all([cargarCategorias(), cargarSubcategorias()]);
            showAlert(data.message, 'success');
            return true;
        } catch (error: any) {
            console.error("Error al crear/actualizar categoría:", error);
            showAlert(mensajeError(error, 'Error al crear/actualizar categoría'), 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const cargarSubcategorias = async () => {
        if (!token) return;
        try {
            setLoading(true);
            setSubcategorias(await obtenerSubcategorias(token));
        } catch (error) {
            console.error("Error al cargar subcategorías:", error);
        } finally {
            setLoading(false);
        }
    };

    // Los ids se repiten entre Ingreso y Gasto, por eso se necesita el tipo
    const cargarSubcategoriaPorId = async (id: number, tipo?: tipoCategoria) => {
        if (!token) return;
        if (!id || !tipo) {
            setSubcategoriaSeleccionada(null);
            return;
        }
        try {
            setLoading(true);
            setSubcategoriaSeleccionada(await obtenerSubcategoriaId(token, id, tipo));
        } catch (error) {
            console.error(`Error al cargar la subcategoría ${id}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const guardarSubcategoria = async (subcategoria: InterfaceSubcategoriaForm): Promise<boolean> => {
        if (!token) return false;
        try {
            setLoading(true);
            const data = await crearOActualizarSubcategoria(token, subcategoria);
            await cargarSubcategorias();
            // Al mover una fila de tabla el id puede cambiar: se limpia la selección para no reutilizarlo
            setSubcategoriaSeleccionada(null);
            showAlert(data.message, 'success');
            return true;
        } catch (error: any) {
            console.error("Error al crear/actualizar subcategoría:", error);
            showAlert(mensajeError(error, 'Error al crear/actualizar subcategoría'), 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        categorias,
        cargarCategorias,
        categoriaSeleccionada,
        cargarCategoriaPorId,
        guardarCategoria,
        subcategorias,
        cargarSubcategorias,
        subcategoriaSeleccionada,
        cargarSubcategoriaPorId,
        guardarSubcategoria,
        loading,
    };
};
