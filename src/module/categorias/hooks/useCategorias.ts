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

    const cargarCategorias = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerCategorias(token));
            setCategorias(data);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        }
    };

    const cargarCategoriaPorId = async (id: number) => {
        if (!token) return;
        if (!id) {
            setCategoriaSeleccionada(null);
            return;
        }
        try {
            const data = await conLoading(() => obtenerCategoriaId(token, id));
            setCategoriaSeleccionada(data);
        } catch (error) {
            console.error(`Error al cargar la categoría ${id}:`, error);
        }
    };

    const guardarCategoria = async (categoria: InterfaceCategoriaForm): Promise<boolean> => {
        if (!token) return false;
        try {
            const data = await conLoading(async () => {
                const respuesta = await crearOActualizarCategoria(token, categoria);
                // Cambiar el tipo de una categoría afecta la lista de subcategorías
                await Promise.all([cargarCategorias(), cargarSubcategorias()]);
                return respuesta;
            });
            showAlert(data.message, 'success');
            return true;
        } catch (error: any) {
            console.error("Error al crear/actualizar categoría:", error);
            showAlert(mensajeError(error, 'Error al crear/actualizar categoría'), 'error');
            return false;
        }
    };

    const cargarSubcategorias = async () => {
        if (!token) return;
        try {
            const data = await conLoading(() => obtenerSubcategorias(token));
            setSubcategorias(data);
        } catch (error) {
            console.error("Error al cargar subcategorías:", error);
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
            const data = await conLoading(() => obtenerSubcategoriaId(token, id, tipo));
            setSubcategoriaSeleccionada(data);
        } catch (error) {
            console.error(`Error al cargar la subcategoría ${id}:`, error);
        }
    };

    const guardarSubcategoria = async (subcategoria: InterfaceSubcategoriaForm): Promise<boolean> => {
        if (!token) return false;
        try {
            const data = await conLoading(async () => {
                const respuesta = await crearOActualizarSubcategoria(token, subcategoria);
                await cargarSubcategorias();
                return respuesta;
            });
            // Al mover una fila de tabla el id puede cambiar: se limpia la selección para no reutilizarlo
            setSubcategoriaSeleccionada(null);
            showAlert(data.message, 'success');
            return true;
        } catch (error: any) {
            console.error("Error al crear/actualizar subcategoría:", error);
            showAlert(mensajeError(error, 'Error al crear/actualizar subcategoría'), 'error');
            return false;
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