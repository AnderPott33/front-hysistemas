import { useEffect, useState } from "react";
import type { InterfaceActividadEconomica, InterfaceEmpresa } from "../interfaces/interfaceEmpresa";
import InputERP from "../../../components/utils/InputERP";
import { Plus, Trash2, Edit2 } from "lucide-react";
import DataTable from "../../../components/utils/DataTable";
import { formatarData } from "../../../components/utils/Formatadores";
import Swal from "sweetalert2";
import { confirmar, showAlert } from "../../../components/utils/Procesando";

interface InterfaceFormActividadEconomica {
    formInicial: InterfaceEmpresa;
    empresa: InterfaceEmpresa | null;
    recibirActividadEconomica: (empresa: InterfaceEmpresa) => void;
}

const FormActividadEconomica = ({
    formInicial,
    empresa,
    recibirActividadEconomica
}: InterfaceFormActividadEconomica) => {
    const [formActividadEconomica, setFormActividadEconomica] = useState<InterfaceEmpresa>(formInicial);
    const [actividadEco, setActividadEco] = useState<InterfaceActividadEconomica[]>([]);

    // Form input state (single object, not array)
    const [formInput, setFormInput] = useState<InterfaceActividadEconomica>({
        id: '',
        nombre: '',
        fecha_inclusion: new Date().toISOString().split('T')[0]
    });

    // Estado para manejar la edición
    const [editingId, setEditingId] = useState<string | null>(null);

    // ✅ Cuando empresa se carga, carga los datos locales
    useEffect(() => {
        if (empresa) {
            setFormActividadEconomica(empresa);
            setActividadEco(empresa.actividad_economica || []);
        }
    }, [empresa]);

    // ✅ Actualiza el formActividadEconomica cuando cambien las actividades
    useEffect(() => {
        setFormActividadEconomica(prev => ({
            ...prev,
            actividad_economica: actividadEco
        }));
    }, [actividadEco]);

    // ✅ Cuando el form local cambia, notifica al padre
    useEffect(() => {
        recibirActividadEconomica(formActividadEconomica);
    }, [formActividadEconomica]);

    const handleAddActividad = () => {
        if (!formInput.nombre.trim() || !formInput.id.toString().trim()) {
            alert('Por favor complete todos los campos');
            return;
        }

        if (editingId) {
            // Modo edición: actualizar la actividad existente
            setActividadEco(prev =>
                prev.map(e => e.id === editingId ? formInput : e)
            );
            setEditingId(null);
        } else {
            // Modo agregar: agregar nueva actividad
            setActividadEco(prev => [...prev, formInput]);
        }

        // Reset form
        setFormInput({
            id: '',
            nombre: '',
            fecha_inclusion: new Date().toISOString().split('T')[0]
        });
    };

    const handleEditActividad = (actividad: InterfaceActividadEconomica) => {
        setFormInput(actividad);
        setEditingId(String(actividad.id));
    };

    const handleCancelEdit = () => {
        setFormInput({
            id: '',
            nombre: '',
            fecha_inclusion: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
    };

    const handleDeleteActividad = async (id: string | number) => {
        const confirmado = await confirmar(
            "¿Eliminar actividad?",
            "La actividad económica se quitará de la lista.",
            "Eliminar",
            "Cancelar"
        );

        if (!confirmado) {
            showAlert("Actividad no eliminada", "info");
            return;
        }

        setActividadEco(prev => prev.filter(e => String(e.id) !== String(id)));

        if (editingId !== null && String(editingId) === String(id)) {
            handleCancelEdit();
        }

        showAlert("Actividad eliminada", "success");
    };

    return (
        <>
            <div className="p-2 grid grid-cols-7 gap-3">
                <div className="col-span-4">
                    <InputERP
                        type="text"
                        label="Actividad Económica"
                        value={formInput.nombre}
                        onChange={e => setFormInput({ ...formInput, nombre: String(e) })}
                        placeholder="Nombre de la actividad"
                    />
                </div>
                <div className="col-span-1">
                    <InputERP
                        type="text"
                        label="Código"
                        value={formInput.id}
                        onChange={e => setFormInput({ ...formInput, id: String(e) })}
                        placeholder="Código"
                        disabled={editingId !== null}
                    />
                </div>
                <div className=" col-span-1 flex gap-2 justify-start  items-center">
                    <button
                        type="button"
                        onClick={handleAddActividad}
                        className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-mi-gradient text-white shadow-md shadow-mi-tercera/30 hover:shadow-lg hover:shadow-mi-tercera/40 transition-all duration-200 active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        {editingId ? 'Actualizar' : 'Salvar'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex justify-center items-center gap-2 px-4 py-2 font-semibold rounded-xl bg-white text-mi-cuarta border border-mi-primera/20 hover:bg-mi-primera/10 transition-all duration-200 active:scale-[0.98]"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div>
                <DataTable<InterfaceActividadEconomica>
                    data={actividadEco}
                    columns={[
                        {
                            header: "Código",
                            accessor: "id",
                            align: "start",
                            width: "100px",
                            sortable: false,
                            filterable: false
                        },
                        {
                            header: "Nombre",
                            accessor: "nombre",
                            align: "start",
                            sortable: false,
                            filterable: false
                        },
                        {
                            header: "Fecha Inclusión",
                            accessor: "fecha_inclusion",
                            align: "start",
                            width: "150px",
                            sortable: false,
                            cell: e => formatarData(e.fecha_inclusion)
                        },
                        {
                            header: "Acciones",
                            accessor: "acciones",
                            align: "center",
                            width: "150px",
                            sortable: false,
                            cell: e => {
                                return (
                                    <div className="flex gap-2 justify-center items-center">
                                        <button
                                            onClick={() => { handleDeleteActividad(e.id) }}
                                            className="text-red-600 hover:text-red-800 transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )
                            }
                        },
                    ]}
                    showGlobalSearch={false}
                    showFilters={false}
                    initialPageSize={10}
                    selectable={false}
                    onRowDoubleClick={e => handleEditActividad(e)}
                />
            </div>
        </>
    );
};

export default FormActividadEconomica;