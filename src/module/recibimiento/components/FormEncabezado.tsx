import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { InterfaceBaja, InterfaceMovimiento } from "../interfaces/interfaceRecibimiento";
import { formatarDataHora, formatarDataInput, formatarMoeda } from "../../../components/utils/Formatadores";
import type { InterfaceCajas } from "../../cajas/Interfaces/InterfaceCajas";
import type { InterfaceUsuarios } from "../../usuarios/interfaces/usuariosInterfaces";
import { Calendar, Check, Edit2, PanelLeftClose, PanelLeftOpen, FilePen, MessageSquare, User, X, BriefcaseBusiness, Search, Banknote, BanknoteX, BanknoteCheck, CornerUpLeft } from "lucide-react";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import { Flag } from "../../../context/FlagsContext";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import SelectorMoneda from "../../../components/utils/SelectorMoneda";
import DataTable from "../../../components/utils/DataTable";

interface InterfaceFormEncabezado {
    datosBaja: InterfaceBaja[];
    recibeBuscador: (buscado: number) => void;
    buscarFinanciero: (id?: number) => void;
    limpiarFormulario: () => void;
    datosCaja: InterfaceCajas | null;
    datosUsuario: InterfaceUsuarios | null;
    recibeEncabezado: (datos: InterfaceMovimiento) => void;
    monedaBase: InterfaceMoneda | null;
    datosMoneda: InterfaceMoneda[];
    datosFinancieros: InterfaceMovimiento[];
    encabezadoCargado?: InterfaceMovimiento;
}

interface RailItemProps {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    expanded: boolean;
    onClick?: () => void;
}

// Se renderiza como <div>. Solo se vuelve role="button" cuando tiene onClick,
// para evitar un <button> dentro de otro <button> (por ejemplo, con InputERP).
const RailItem = ({ icon, label, value, expanded, onClick }: RailItemProps) => {
    const clickable = Boolean(onClick);

    return (
        <div
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={onClick}
            onKeyDown={clickable ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            } : undefined}
            title={label}
            className={`w-full rounded-xl text-mi-cuarta hover:bg-mi-primera/10 transition-colors ${clickable ? "cursor-pointer" : ""} ${expanded
                ? 'flex flex-row items-center gap-3 px-3 py-2.5 text-left'
                : 'flex flex-col items-center gap-1 py-2 px-1'
                }`}
        >
            <span className="text-mi-primera shrink-0">{icon}</span>
            {expanded ? (
                <span className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold uppercase text-mi-cuarta/60">{label}</span>
                    <span className="text-sm font-bold truncate">{value}</span>
                </span>
            ) : (
                <span className="text-[11px] font-semibold leading-tight text-center truncate w-full">{value}</span>
            )}
        </div>
    );
};

/** Badge de estado con los mismos colores que el encabezado */
const EstadoBadge = ({ estado }: { estado: string }) => {
    const clases =
        estado === 'Efectivado'
            ? 'bg-green-100 text-green-600 border-green-200'
            : estado === 'Iniciado'
                ? 'bg-yellow-100 text-yellow-600 border-yellow-200'
                : 'bg-red-100 text-red-600 border-red-200';

    const icono =
        estado === 'Efectivado' ? <BanknoteCheck size={12} />
            : estado === 'Iniciado' ? <Banknote size={12} />
                : <BanknoteX size={12} />;

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg border ${clases}`}>
            {icono}
            {estado}
        </span>
    );
};

interface ModalSeleccionFinancieroProps {
    isOpen: boolean;
    financiero: InterfaceMovimiento[];
    datosMoneda: InterfaceMoneda[];
    onClose: () => void;
    onSelect: (financiero: InterfaceMovimiento) => void;
}

// Definido fuera del componente para que React no lo desmonte y remonte
// en cada render (lo que reiniciaba orden, filtros y paginación de la tabla).
const ModalSeleccionFinanciero = ({ isOpen, datosMoneda, financiero, onClose, onSelect }: ModalSeleccionFinancieroProps) => (
    <ModalGeneral
        title="Seleccionar Recebimiento"
        subtitle="Seleccione el recebimiento para revisión"
        isOpen={isOpen}
        icon={<CornerUpLeft size={18} />}
        onClose={onClose}
        width="1300px"
        sizeBanner="sm"
        childrenPadding={false}
    >
        <DataTable<InterfaceMovimiento>
            data={financiero}
            initialPageSize={10}
            iconSinDatos={<CornerUpLeft size={18} />}
            textSinDatos="No se encontraron recebimientos para mostrar"
            columns={[
                { header: "ID", accessor: "id", align: "start", width: "90px", sortable: true, filterable: true },
                {
                    header: "Fecha", accessor: "fecha", align: "start", sortable: true, filterable: true,
                    cell: e => formatarDataHora(e.fecha)
                },
                { header: "Observación", accessor: "observacion", align: "center", sortable: true, filterable: true },
                { header: "Caja", accessor: "caja_id", align: "center", sortable: true, filterable: true },
                {
                    header: "Estado", accessor: "estado", align: "center", width: "130px", sortable: true, filterable: true,
                    cell: e => <EstadoBadge estado={e.estado} />
                },
                {
                    header: "Valor", accessor: "total_credito", align: "right", sortable: true, filterable: true,
                    cell: e => {
                        const monedaA = datosMoneda.find(ee => ee.id === e.moneda_id)
                        return formatarMoeda(e.total_credito, monedaA)
                    }
                },
            ]}
            showGlobalSearch={true}
            globalSearchPlaceholder="Buscar por todos los campos!"
            selectable={false}
            onRowClick={onSelect}
        />
    </ModalGeneral>
);

const FormEncabezado = ({ datosCaja, limpiarFormulario, datosFinancieros, recibeBuscador, buscarFinanciero, datosBaja, datosUsuario, datosMoneda, monedaBase, recibeEncabezado, encabezadoCargado }: InterfaceFormEncabezado) => {
    const monedaBaseId = Number(monedaBase?.id ?? 0);
    const [buscado, setBuscado] = useState(0);

    // La moneda de la operación la define la primera línea; si no hay líneas, se usa la moneda base
    const monedaOperacionId = datosBaja.length > 0
        ? Number(datosBaja[0].moneda_id)
        : monedaBaseId;

    const InicialEncabezado: InterfaceMovimiento = {
        id: Number(null),
        caja_id: datosCaja?.id ? Number(datosCaja.id) : 0,
        tipo_movimiento: 'Recibimiento',
        fecha: formatarDataInput(new Date()),
        usuario_id: datosUsuario?.id ? Number(datosUsuario.id) : 0,
        usuario: datosUsuario,
        moneda_id: monedaOperacionId,
        estado: 'Iniciado',
        motivo_cancelado: '',
        observacion: '',
    };

    const [formMovimiento, setFormMovimiento] = useState<InterfaceMovimiento>(InicialEncabezado);
    const [formEdit, setFormEdit] = useState<InterfaceMovimiento>(InicialEncabezado);
    const [modalOpen, setModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [modalFinanciero, setModalFinanciero] = useState(false);

    useEffect(() => {
        if (datosCaja?.id || datosUsuario?.id) {
            setFormMovimiento(form => ({
                ...form,
                caja_id: datosCaja?.id ? Number(datosCaja.id) : form.caja_id,
                usuario_id: datosUsuario?.id ? Number(datosUsuario.id) : form.usuario_id,
            }));
        }
    }, [datosCaja, datosUsuario]);

    // Sincroniza la moneda de la operación con la de la primera línea
    useEffect(() => {
        setFormMovimiento(form =>
            form.moneda_id === monedaOperacionId ? form : { ...form, moneda_id: monedaOperacionId }
        );
    }, [monedaOperacionId]);

    // Al buscar un financiero, muestra su encabezado en el formulario
    useEffect(() => {
        if (encabezadoCargado) setFormMovimiento(encabezadoCargado);
    }, [encabezadoCargado]);

    useEffect(() => {
        recibeEncabezado(formMovimiento);
    }, [formMovimiento]);

    useEffect(() => {
        recibeBuscador(buscado);
    }, [buscado]);

    const handleOpenModal = () => {
        setFormEdit(formMovimiento);
        setModalOpen(true);
    };

    const handleGuardar = () => {
        setFormMovimiento({ ...formEdit, moneda_id: monedaOperacionId });
        setModalOpen(false);
    };

    const handleCancelar = () => {
        setFormEdit(formMovimiento);
        setModalOpen(false);
    };

    const monedaSeleccionada = datosMoneda.find(m => Number(m.id) === Number(formMovimiento.moneda_id));

    const estadoClases = formMovimiento.estado === 'Efectivado'
        ? 'bg-green-100 text-green-600'
        : formMovimiento.estado === 'Iniciado'
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-red-100 text-red-600';

    const fechaCorta = new Date(formMovimiento.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });

    const financieros = datosFinancieros.filter(e => e.tipo_movimiento === 'Recibimiento');

    const opciones: SearchOption[] = [...financieros]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(c => ({ id: c.id, texto: `${c.observacion}`, estado: c.estado, fecha: formatarDataHora(c.fecha) }));

    const handleSelect = (option: SearchOption) => {
        const cuenta = financieros.find(c => String(c.id) === String(option.id));
        if (cuenta) setBuscado(Number(cuenta.id));
        buscarFinanciero(Number(cuenta ? cuenta.id : option.id));
    };

    const buscarYCargar = (term: string) => {
        const t = term.trim();

        if (!t) {
            limpiarFormulario();
            return;
        }

        const encontrado = financieros.find(
            p => String(p.id) === t ||
                p.observacion?.toLowerCase().includes(t.toLowerCase())
        );

        if (encontrado) {
            setBuscado(Number(encontrado.id));
            if (String(encontrado.id) !== String(buscado)) {
                buscarFinanciero(Number(encontrado.id));
            }
        } else {
            limpiarFormulario();
        }
    };

    const handleSeleccionarFinancieroModal = (financiero: InterfaceMovimiento) => {
        setBuscado(Number(financiero?.id));
        buscarFinanciero(Number(financiero.id));
        setModalFinanciero(false);
    };
/* console.log(datosFinancieros); */

    return (
        <>
            <div
                className={`shrink-0 self-stretch flex flex-col rounded-3xl border border-mi-tercera/15 bg-white shadow-lg shadow-mi-primera/10 overflow-hidden transition-[width] duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-16'
                    }`}
            >
                {/* Parte superior: toggle + datos */}
                <div className="flex flex-col gap-1 p-2">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(prev => !prev)}
                        title={isExpanded ? 'Contraer' : 'Expandir'}
                        className="flex items-center justify-center p-2 rounded-lg text-mi-primera hover:bg-mi-primera/10 transition-colors"
                    >
                        {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>

                    <div className="my-1 border-t border-mi-primera/10" />

                    <RailItem
                        icon={<Search size={18} />}
                        label="Buscador"
                        value={isExpanded ?
                            <InputERP
                                type="searchNumber"
                                label="ID"
                                value={buscado}
                                onChange={(e) => setBuscado(e)}
                                searchOptions={opciones}
                                onSelectOption={handleSelect}
                                displayMode="id"
                                searchColumns={[
                                    { key: "id", label: "CÓDIGO", width: "100px" },
                                    { key: "fecha", label: "FECHA", width: "1fr" },
                                    { key: "texto", label: "OBSERVACIÓN", width: "1fr" },
                                ]}
                                searchMinChars={1}
                                showSearch={true}
                                onSearchClick={() => setModalFinanciero(true)}
                                onEnterPress={() => buscarFinanciero(buscado)}
                                placeholder="Ingresa ID o descripción..."
                                className="h-[35px] bg-transparent text-xs"
                            />
                            : (buscado || "—")}
                        expanded={isExpanded}
                    />

                    <RailItem
                        icon={<Calendar size={18} />}
                        label="Fecha"
                        value={isExpanded ? new Date(formMovimiento.fecha).toLocaleDateString('es-ES') : fechaCorta}
                        expanded={isExpanded}
                    />

                    <RailItem
                        icon={monedaSeleccionada
                            ? <Flag className="rounded-sm border border-mi-tercera" country={monedaSeleccionada.codigo as 'PYG'} size={18} />
                            : <span />
                        }
                        label="Moneda"
                        value={monedaSeleccionada?.codigo ?? '—'}
                        expanded={isExpanded}
                    />

                    <RailItem
                        icon={<BriefcaseBusiness size={18} />}
                        label="Caja"
                        value={formMovimiento.caja_id || "—"}
                        expanded={isExpanded}
                    />

                    <RailItem
                        icon={<User size={18} />}
                        label="Usuario"
                        value={formMovimiento.usuario?.nombre || "—"}
                        expanded={isExpanded}
                    />

                    <div className="my-1 border-t border-mi-primera/10" />

                    {!isExpanded && (
                        <RailItem
                            icon={<MessageSquare size={18} />}
                            label="Observación"
                            value={formMovimiento.observacion || "—"}
                            expanded={isExpanded}
                            onClick={() => setIsExpanded(true)}
                        />
                    )}
                </div>

                {/* Parte expandida: estado y observación */}
                {isExpanded && (
                    <div className="flex flex-col gap-3 px-3 pb-3">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs ${estadoClases}`}>
                            {formMovimiento.estado === 'Efectivado' ? (
                                <><BanknoteCheck size={14} /><span>Efectivado</span></>
                            ) : formMovimiento.estado === 'Iniciado' ? (
                                <><Banknote size={14} /><span>Iniciado</span></>
                            ) : (
                                <><BanknoteX size={14} /><span>Cancelado</span></>
                            )}
                        </div>

                        <div className="pt-2 border-t border-mi-primera/10">
                            <label className="text-xs font-semibold text-mi-cuarta/60 uppercase block mb-2">Observación</label>
                            <InputERP
                                type="textarea"
                                value={formMovimiento.observacion}
                                onChange={e => setFormMovimiento({ ...formMovimiento, observacion: e })}
                                placeholder="Agregar observación..."
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {/* Editar, siempre al fondo */}
                <div className="mt-auto p-2 border-t border-mi-primera/10">
                    <button
                        type="button"
                        onClick={handleOpenModal}
                        title="Editar encabezado"
                        className="w-full rounded-lg p-2 text-mi-cuarta/60 hover:text-mi-cuarta hover:bg-mi-primera/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Edit2 size={16} />
                        {isExpanded && <span className="text-xs font-semibold">Editar</span>}
                    </button>
                </div>
            </div>

            {/* Modal de Edición */}
            <ModalGeneral
                isOpen={modalOpen}
                onClose={handleCancelar}
                title="Editar Encabezado"
                subtitle="Modifica los datos del movimiento"
                icon={<FilePen size={24} />}
                size="lg"
                sizeBanner="sm"
                scrollableBody
                actions={[
                    { label: 'Cancelar', onClick: handleCancelar, variant: 'secondary', icon: <X size={18} /> },
                    { label: 'Guardar', onClick: handleGuardar, variant: 'primary', icon: <Check size={18} /> }
                ]}
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <InputERP
                                label="Caja"
                                icon={<BriefcaseBusiness size={18} />}
                                type="number"
                                readOnly
                                value={formEdit.caja_id}
                                onChange={e => setFormEdit({ ...formEdit, caja_id: e })}
                            />
                        </div>

                        <div>
                            <InputERP
                                label="Fecha"
                                type="datetime-local"
                                value={formEdit.fecha}
                                disabled={datosBaja.length > 0}
                                onChange={e => setFormEdit({ ...formEdit, fecha: e })}
                            />
                        </div>

                        <div>
                            <InputERP
                                label="Usuario"
                                icon={<User size={18} />}
                                type="text"
                                value={formEdit.usuario?.nombre}
                                readOnly
                                onChange={e => setFormEdit({ ...formEdit, usuario_id: e.id })}
                            />
                        </div>
                    </div>

                    <div>
                        <SelectorMoneda
                            monedas={datosMoneda}
                            monedaId={Number(formEdit.moneda_id)}
                            disabled
                            onChange={e => setFormEdit({ ...formEdit, moneda_id: e })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-mi-cuarta mb-2">Estado</label>
                        <button
                            type="button"
                            disabled
                            className={`w-full flex justify-center items-center gap-2 px-4 py-3 font-semibold rounded-xl transition-colors ${formEdit.estado === 'Efectivado'
                                ? 'bg-green-100 text-green-600 border-2 border-green-600'
                                : formEdit.estado === 'Iniciado'
                                    ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-600'
                                    : 'bg-red-100 text-red-600 border-2 border-red-600'
                                }`}
                        >
                            {formEdit.estado === 'Efectivado' ? (
                                <><BanknoteCheck size={18} /><span>Efectivado</span></>
                            ) : formEdit.estado === 'Iniciado' ? (
                                <><Banknote size={18} /><span>Iniciado</span></>
                            ) : (
                                <><BanknoteX size={18} /><span>Cancelado</span></>
                            )}
                        </button>
                    </div>

                    <div>
                        <InputERP
                            label="Observación"
                            icon={<FilePen size={18} />}
                            type="textarea"
                            rows={3}
                            value={formEdit.observacion}
                            onChange={e => setFormEdit({ ...formEdit, observacion: e })}
                        />
                    </div>

                    {formEdit.estado === 'Cancelado' && (
                        <div>
                            <InputERP
                                label="Motivo Cancelación"
                                type="text"
                                value={formEdit.motivo_cancelado}
                                disabled
                                onChange={e => setFormEdit({ ...formEdit, motivo_cancelado: e })}
                            />
                        </div>
                    )}
                </div>
            </ModalGeneral>

            <ModalSeleccionFinanciero
                isOpen={modalFinanciero}
                financiero={financieros}
                datosMoneda={datosMoneda}
                onClose={() => setModalFinanciero(false)}
                onSelect={handleSeleccionarFinancieroModal}
            />
        </>
    );
};

export default FormEncabezado;