import { FolderTree, List, PlusCircle, Tags } from "lucide-react";
import ActionBanner from "../../../components/utils/ActionBanner";
import PageBanner from "../../../components/utils/Banner";
import { useEffect, useState } from "react";
import GlobalTooltip from "../../../components/utils/GlobalTooltip";
import { useCategorias } from "../hooks/useCategorias";
import { CategoriasList } from "../components/CategoriasList";
import { SubcategoriasList } from "../components/SubcategoriasList";
import FormCategorias from "../components/FormCategorias";
import FormSubcategorias from "../components/FormSubcategorias";
import SelectorTipo from "../components/SelectorTipo";
import type { tipoCategoria } from "../interfaces/InterfaceCategoria";

const CategoriasPage = () => {
    const [activeTab, setActiveTab] = useState('lista-cat');
    const [tipoActivo, setTipoActivo] = useState<tipoCategoria>('Gasto');

    const {
        categorias, cargarCategorias, categoriaSeleccionada, cargarCategoriaPorId, guardarCategoria,
        subcategorias, cargarSubcategorias, subcategoriaSeleccionada, cargarSubcategoriaPorId, guardarSubcategoria,
    } = useCategorias();

    useEffect(() => {
        cargarCategorias();
        cargarSubcategorias();
    }, []);

    // Vistas filtradas por el tipo seleccionado
    const categoriasDelTipo = categorias.filter(c => c.tipo === tipoActivo);
    const subcategoriasDelTipo = subcategorias.filter(s => s.categoria?.tipo === tipoActivo);

    // Al editar, la pestaña cambia al tipo del registro para que el formulario tenga sus opciones
    const editarCategoria = async (id: number) => {
        const categoria = categorias.find(c => Number(c.id) === id);
        if (categoria) setTipoActivo(categoria.tipo);
        await cargarCategoriaPorId(id);
        setActiveTab('reg-cat');
    };

    const nuevaCategoria = () => {
        cargarCategoriaPorId(0);
        setActiveTab('reg-cat');
    };

    const editarSubcategoria = async (subcategoria: { id: number; categoria?: { tipo: tipoCategoria } | null }) => {
        if (subcategoria.categoria?.tipo) setTipoActivo(subcategoria.categoria.tipo);
        await cargarSubcategoriaPorId(subcategoria.id, subcategoria.categoria?.tipo);
        setActiveTab('reg-sub');
    };

    const nuevaSubcategoria = () => {
        cargarSubcategoriaPorId(0);
        setActiveTab('reg-sub');
    };

    const selector = <SelectorTipo value={tipoActivo} onChange={setTipoActivo} />;

    return (
        <>
            <PageBanner
                icon={<Tags />}
                title="Categorías"
                subtitle="Consulte y gestione las categorías y subcategorías de ingreso y gasto"
                size="md"
                children={
                    <ActionBanner
                        activeTab={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId)}
                        tabs={[
                            {
                                id: 'reg-cat',
                                label: 'Categoría',
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2 space-y-4">
                                        {selector}
                                        <FormCategorias
                                            categoriaSelect={categoriaSeleccionada || null}
                                            guardarCategoria={guardarCategoria}
                                            tipoInicial={tipoActivo}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'lista-cat',
                                label: 'Lista Categorías',
                                icon: <List className="w-4 h-4" />,
                                content: (
                                    <div className="py-2 space-y-4">
                                        {selector}
                                        <CategoriasList
                                            datos={categoriasDelTipo}
                                            tipo={tipoActivo}
                                            onEditar={editarCategoria}
                                            onNuevo={nuevaCategoria}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'reg-sub',
                                label: 'Subcategoría',
                                icon: <PlusCircle className="w-4 h-4" />,
                                content: (
                                    <div className="py-2 space-y-4">
                                        {selector}
                                        <FormSubcategorias
                                            subcategoriaSelect={subcategoriaSeleccionada || null}
                                            categorias={categoriasDelTipo}
                                            guardarSubcategoria={guardarSubcategoria}
                                        />
                                    </div>
                                )
                            },
                            {
                                id: 'lista-sub',
                                label: 'Lista Subcategorías',
                                icon: <FolderTree className="w-4 h-4" />,
                                content: (
                                    <div className="py-2 space-y-4">
                                        {selector}
                                        <SubcategoriasList
                                            datos={subcategoriasDelTipo}
                                            tipo={tipoActivo}
                                            onEditar={editarSubcategoria}
                                            onNuevo={nuevaSubcategoria}
                                        />
                                    </div>
                                )
                            },
                        ]}
                    />
                }
            />

            <GlobalTooltip />
        </>
    );
};

export default CategoriasPage;
