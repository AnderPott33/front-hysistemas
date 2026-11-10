/* import { useEffect, useRef, useState } from "react";
import type { InterfaceDetalleTransaccion, InterfaceTransaccion } from "../interfaces/interfaceTransaccion";
import SelectCustom from "../../../components/utils/SelectCustom";
import type { InterfaceUsuarios } from "../../usuarios/interfaces/usuariosInterfaces";
import type { InterfaceCajas } from "../../cajas/Interfaces/InterfaceCajas";
import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceOperacionBaja } from "../../operaciones/interfaces/InterfaceOperacion";
import InputERP, { type SearchOption } from "../../../components/utils/InputERP";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";
import ModalGeneral from "../../../components/utils/ModalGeneral";
import DataTable from "../../../components/utils/DataTable";
import { formatarDataInput, formatarMoeda } from "../../../components/utils/Formatadores";
import { Pen, ChevronLeft, ChevronRight } from "lucide-react";
import type { InterfaceTimbrado } from "../../timbrado/interfaces/InterfaceOperacion";

interface InterfaceFormTransaccion {
    enviarEncabezado: (encabezado: InterfaceTransaccion) => void;
    formInicial: InterfaceTransaccion;
    user: InterfaceUsuarios | null;
    personas: InterfacePersona[];
    caja: InterfaceCajas | null;
    monedas: InterfaceMoneda[];
    operaciones: InterfaceOperacionBaja[];
    operacionSeleccionada: InterfaceOperacionBaja | null;
    calcularSubtotal: () => number;
    calcularTotal: () => number;
    detalle: InterfaceDetalleTransaccion[],
    abrirModalPago: () => void;
    timbrados: InterfaceTimbrado[];
    cargarTimbrados: () => void;
}

const FormTransaccion = ({
    enviarEncabezado,
    formInicial,
    abrirModalPago,
    user,
    personas,
    caja,
    monedas,
    operaciones,
    operacionSeleccionada,
    calcularSubtotal,
    calcularTotal,
    detalle,
    timbrados,
    cargarTimbrados
}: InterfaceFormTransaccion) => {

    const operacionesVentaIngreso = operaciones.filter(o => o.modulo === 'Venta');

    const [formData, setFormData] = useState<InterfaceTransaccion>(formInicial);
    const [openModalPersona, setOpenModalPersona] = useState(false);
    const [openCalendar, setOpenCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    //Configs para numeración de factura manual
    const [numeroDoc, setNumeroDoc] = useState({
        establecimiento: '',
        expedicion: '',
        secuencia: '',
        factura: operacionSeleccionada?.genera_documento_legal ? true : false
    });

    //Usar solo personas activas
    const personasActivas = personas.filter(e => e.activo);

    const monedaSeleccionada = monedas.find(e => e.id == formData.moneda_id);

    const timbradosSeleccionado = timbrados.find(e => Number(e.timbrado) === Number(operacionSeleccionada?.timbrado))

    // ✅ EFECTO 1: Cargar timbrados cuando cambia la operación
    useEffect(() => {
        if (timbradosSeleccionado) {
            cargarTimbrados();
        }
    }, [operacionSeleccionada?.id]);

    //Manejo de descuentos
    const [descuentoTipo, setDescuentoTipo] = useState<'porcentaje' | 'valor' | 'sin_descuento'>('sin_descuento');
    const [descuentoValor, setDescuentoValor] = useState<number>(0);
    const [isModalDescuentoOpen, setIsModalDescuentoOpen] = useState(false);

    const handleDescuento = () => {
        const subtotal = calcularSubtotal();
        return descuentoTipo === 'porcentaje' ? (Number(subtotal) * Number(descuentoValor)) / 100 : descuentoTipo === 'sin_descuento' ? 0 : Number(descuentoValor);
    };

    const handleAplicarDescuento = (tipo: 'porcentaje' | 'valor' | 'sin_descuento', valor: number) => {
        const subtotal = calcularSubtotal();

        setDescuentoTipo(tipo);
        setDescuentoValor(valor);

        const descuentoTotal = tipo === 'porcentaje' ? (subtotal * valor) / 100 : tipo === 'sin_descuento' ? 0 : valor;
        const totalIva = detalle.reduce((sum, item) => sum + (item.valor_iva || 0), 0);

        setFormData(prev => ({
            ...prev,
            valor_subtotal: subtotal,
            valor_descuento: descuentoTotal,
            valor_iva: totalIva,
            valor_total: subtotal
        }));

        setIsModalDescuentoOpen(false);
    };

    // ✅ EFECTO 2: Generar número de factura o cargar número del timbrado
    useEffect(() => {
        if (timbradosSeleccionado) {
            setFormData(prev => ({
                ...prev,
                tipo_comprobante: timbradosSeleccionado.tipo_nota,
                numero_comprobante: `${String(timbradosSeleccionado.sucursal || '').padStart(3, '0')}-${String(timbradosSeleccionado.punto_expedicion || '').padStart(3, '0')}-${String(timbradosSeleccionado.proximo_numero || '').padStart(7, '0')}`
            }));
            setNumeroDoc(prev => ({
                ...prev,
                establecimiento: String(timbradosSeleccionado.sucursal || "").padStart(3, '0'),
                expedicion: String(timbradosSeleccionado.punto_expedicion || "").padStart(3, '0'),
                secuencia: String(timbradosSeleccionado.proximo_numero || "").padStart(7, '0'),
                factura: false
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                tipo_comprobante: '',
                numero_comprobante: ``
            }));
            setNumeroDoc(prev => ({
                ...prev,
                establecimiento: '',
                expedicion: '',
                secuencia: '',
                factura: false
            }));
        }
    }, [timbradosSeleccionado]);

    const totalesAlt = () => {
        const nuevoSubtotal = calcularSubtotal();
        const totalDescuentos = detalle.reduce((sum, item) => sum + (item.valor_descuento || 0), 0);
        const totalIva = detalle.reduce((sum, item) => sum + (item.valor_iva || 0), 0);
        const totalFinal = nuevoSubtotal - totalDescuentos;
         console.log({
             valor_subtotal: nuevoSubtotal,
             valor_descuento: totalDescuentos,
             valor_iva: totalIva,
             valor_total: totalFinal,
         });

        setFormData(prev => ({
            ...prev,
            valor_subtotal: nuevoSubtotal,
            valor_descuento: totalDescuentos,
            valor_iva: totalIva,
            valor_total: totalFinal,
        }));
    }

    useEffect(() => {
        totalesAlt()
    }, [detalle]);

    useEffect(() => {
        enviarEncabezado(formData)
    }, [formData]);

    //Buscador de persona
    const buscarYCargar = (term: string) => {
        const t = term.trim();
        if (!t) return;

        const encontrado = personasActivas.find(
            p => String(p.id) === t || p.nombre.toLowerCase() === t.toLowerCase()
        );

        if (encontrado) {
            setFormData(prev => ({ ...prev, persona_id: Number(encontrado.id) }));
        }
    };

    const handleSelectOption = (option: SearchOption) => {
        setFormData(prev => ({ ...prev, persona_id: Number(option.id) }));
    };

    const handleSeleccionar = (persona: InterfacePersona) => {
        setFormData(prev => ({ ...prev, persona_id: Number(persona.id) }));
        setOpenModalPersona(false);
    };

    const formatearFechaInput = (fecha: Date) => {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        const d = String(fecha.getDate()).padStart(2, '0');
        const h = String(fecha.getHours()).padStart(2, '0');
        const min = String(fecha.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    };

    const formatearFechaDisplay = (fecha: string) => {
        const date = new Date(fecha);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const onChangeFecha = (fecha: string) => {
        setFormData(prev => ({ ...prev, fecha: fecha }));
    }

    const [opcionFecha, setOpcionFecha] = useState<'Hoy' | 'Ayer' | 'Otros'>('Hoy');

    useEffect(() => {
        if (opcionFecha === 'Hoy') {
            onChangeFecha(formatearFechaInput(new Date()));
        } else if (opcionFecha === 'Ayer') {
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            onChangeFecha(formatearFechaInput(ayer));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opcionFecha]);

    // Función para obtener los días del mes
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Función para obtener el primer día de la semana del mes
    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Función para seleccionar una fecha del calendario
    const handleSelectDate = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const h = String(new Date().getHours()).padStart(2, '0');
        const min = String(new Date().getMinutes()).padStart(2, '0');
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');

        onChangeFecha(`${y}-${m}-${d}T${h}:${min}`);
        setOpcionFecha('Otros');
        setOpenCalendar(false);
    };

    // Función para cambiar mes
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const opciones: SearchOption[] = [...personasActivas]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(e => ({ id: e.id, texto: e.nombre }));

    // Generar días del calendario
    const daysArray: (number | null)[] = [];
    const firstDay = getFirstDayOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);

    // Días vacíos del mes anterior
    for (let i = 0; i < firstDay; i++) {
        daysArray.push(null);
    }
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
    }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];

    const selectedDate = new Date(formData.fecha);
    const isSelectedInCurrentMonth = selectedDate.getFullYear() === currentMonth.getFullYear() &&
        selectedDate.getMonth() === currentMonth.getMonth();

    return (
        <>

            <div className="px-2 py-3  shadow-md shadow-[#359bac] grid gap-2 rounded-lg">
                <div className="grid grid-cols-1 gap-2 justify-center items-center">
                    <div className={`${opcionFecha === 'Otros' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        <label className="text-sm font-medium text-slate-700 block mb-2">Fecha <span className="text-red-500">*</span></label>
                        <div className="flex gap-2 relative">
                            {(['Hoy', 'Ayer', 'Otros'] as const).map(opcion => (
                                <button
                                    key={opcion}
                                    type="button"
                                    onClick={() => {
                                        setOpcionFecha(opcion);
                                        if (opcion === 'Otros') {
                                            setOpenCalendar(true);
                                            setCurrentMonth(new Date(formData.fecha));
                                        } else {
                                            setOpenCalendar(false);
                                        }
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold border transition-colors ${opcionFecha === opcion
                                        ? 'bg-[#35b9ac] border-[#35b9ac] text-white'
                                        : 'bg-white border-slate-300 text-[#35b9ac] hover:bg-blue-50'
                                        }`}
                                >
                                    {opcion === 'Otros' && opcionFecha === 'Otros' ? formatearFechaDisplay(formData.fecha) : opcion === 'Otros' ? 'Otros' : opcion}
                                </button>
                            ))}

                        
                            {openCalendar && opcionFecha === 'Otros' && (
                                <div className="absolute top-12 left-0 bg-white border-2 border-[#359bac] rounded-lg shadow-lg p-4 z-50 w-80">
                                 
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={handlePrevMonth}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <ChevronLeft size={20} className="text-[#359bac]" />
                                        </button>
                                        <div className="text-center">
                                            <h3 className="font-semibold text-gray-800">
                                                {monthNames[currentMonth.getMonth()]}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {currentMonth.getFullYear()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleNextMonth}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <ChevronRight size={20} className="text-[#359bac]" />
                                        </button>
                                    </div>

                                    
                                    <div className="grid grid-cols-7 gap-2 mb-2">
                                        {dayNames.map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    
                                    <div className="grid grid-cols-7 gap-2">
                                        {daysArray.map((day, index) => (
                                            <button
                                                key={index}
                                                onClick={() => day !== null && handleSelectDate(day)}
                                                disabled={day === null}
                                                className={`
                                                    p-2 rounded text-center text-sm font-medium
                                                    ${day === null
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : isSelectedInCurrentMonth && selectedDate.getDate() === day
                                                            ? 'bg-[#35b9ac] text-white'
                                                            : 'text-gray-700 hover:bg-[#35b9ac]/10 cursor-pointer border border-gray-200'
                                                    }
                                                `}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2 justify-center items-center">
                    <div className="col-span-3">
                        <span className="font-semibold text-sm">Operación</span>
                        <div>
                            <SelectCustom
                                options={operacionesVentaIngreso.map(op => (
                                    { value: Number(op.id), label: op.descripcion }
                                ))}
                                isClearable={false}
                                value={Number(formData.operacion_id)}
                                onChange={e => {
                                    setFormData({ ...formData, operacion_id: Number(e) })
                                }
                                }
                            />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold text-sm">Moneda</span>
                        <div
                            data-tooltip={`${detalle.length > 0 ? 'No se puede alterar moneda despues de agregar detalle' : 'Moneda Operación'}`}
                        >
                            <SelectCustom
                                options={monedas.map(op => (
                                    { value: Number(op.id), label: op.nombre }
                                ))}
                                isClearable={false}
                                searchable={false}
                                disabled={detalle.length > 0}
                                value={Number(formData.moneda_id)}
                                onChange={e => {
                                    setFormData({ ...formData, moneda_id: Number(e) })
                                }
                                }
                            />
                        </div>
                    </div>

                </div>

                <div className="col-span-1">
                    <div className="grid grid-cols-5 gap-2">
                        <div className={`col-span-4 ${operacionSeleccionada?.genera_documento_legal ? '' : 'hidden'}`}>
                            <span className="block text-sm font-semibold text-gray-700 mb-1">Factura Legal - Número NF</span>
                            <div className="flex items-center gap-1">
                                <div className="w-17 ">
                                    <InputERP
                                        type="text"
                                        disabled={!numeroDoc.factura}
                                        maxLength={3}
                                        placeholder="000"
                                        value={numeroDoc.establecimiento}
                                        onChange={e => setNumeroDoc({ ...numeroDoc, establecimiento: e })}
                                    />
                                </div>
                                <span className="text-gray-400 text-sm">−</span>
                                <div className="w-17 ">
                                    <InputERP
                                        type="text"
                                        disabled={!numeroDoc.factura}
                                        maxLength={3}
                                        placeholder="000"
                                        value={numeroDoc.expedicion}
                                        onChange={e => setNumeroDoc({ ...numeroDoc, expedicion: e })}
                                    />
                                </div>
                                <span className="text-gray-400 text-sm">−</span>
                                <div className="w-50 ">
                                    <InputERP
                                        type="text"
                                        disabled={!numeroDoc.factura}
                                        maxLength={7}
                                        placeholder="0000000"
                                        value={numeroDoc.secuencia}
                                        onChange={e => setNumeroDoc({ ...numeroDoc, secuencia: e })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={`shadow-lg col-span-${operacionSeleccionada?.genera_documento_legal ? '1' : '12'} mt-6 grid justify-center items-center bg-[#188186]/20 rounded-lg px-1.5 py-2 border border-[#359bac] font-semibold text-[#359bac]`}>
                            Caja : {Number(formData.caja_id)}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 whitespace-nowrap">
                            Persona (F3) <span className="text-red-500">*</span>
                        </label>
                    </div>
                    <InputERP
                        type="searchNumber"
                        value={formData.persona_id}
                        onChange={e => setFormData({ ...formData, persona_id: e })}
                        searchOptions={opciones}
                        onSelectOption={handleSelectOption}
                        displayMode="text"
                        searchMinChars={1}
                        showSearch={true}
                        onSearchClick={() => setOpenModalPersona(true)}
                        onEnterPress={buscarYCargar}
                        onBlur={buscarYCargar}
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 whitespace-nowrap">
                            Observación <span className="text-red-500"></span>
                        </label>
                    </div>
                    <InputERP
                        type="textarea"
                        value={formData.observacion}
                        onChange={e => setFormData({ ...formData, observacion: e })}
                    />
                </div>
                <div>
                    <hr className="text-gray-200 my-2" />
                    <div className="bg-gray-100 p-1.5 shadow-sm shadow grid gap-2 rounded-lg">
                        <div className="grid items-center p-2 border-2 rounded-lg font-semibold text-[#359bac] grid-cols-2">
                            <span className="text-start">Subtotal:</span>
                            <span className="text-end">{formatarMoeda(formData.valor_subtotal, monedaSeleccionada)}</span>
                            <span className="text-start flex justify-start items-center">Descuentos: <button onClick={() => setIsModalDescuentoOpen(true)} data-tooltip={`Editar Descuento`} className=" hover:text-red-500 p-1 rounded-lg mx-1"><Pen size={15} /></button></span>
                            <span className="text-end text-red-500">{formatarMoeda(formData.valor_descuento, monedaSeleccionada)}</span>
                        </div>
                        <div className="grid items-center p-2 border-2 border-red-500 rounded-lg font-semibold text-red-500 bg-red-500/20 grid-cols-2">
                            <span className="font-semibold text-start">Total Impuesto:</span>
                            <span className="font-semibold text-end">{formatarMoeda(formData.valor_iva, monedaSeleccionada)}</span>
                        </div>
                        <div className="grid items-center p-2 border-2 border-[#35b9ac] rounded-lg font-semibold text-gray-500 bg-[#359bac]/20 grid-cols-2">
                            <span className="font-semibold text-start">Total:</span>
                            <span className="font-semibold text-end">{formatarMoeda(formData.valor_total, monedaSeleccionada)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <button
                        onClick={() => abrirModalPago()}
                        className="flex justify-center items-center mt-6 w-full gap-2 px-4 py-2.5 font-semibold rounded-xl bg-[#188180] text-white hover:bg-[#126563] transition-colors"
                    >
                        Finalizar (Ctrl+Enter)
                    </button>
                </div>
            </div>
        
            <div>
                <ModalGeneral
                    title='Buscar Persona'
                    isOpen={openModalPersona}
                    onClose={() => setOpenModalPersona(false)}
                    width='1700px'
                    height='500px'
                    childrenPadding={false}
                >
                    <DataTable<InterfacePersona>
                        data={personasActivas}
                        columns={[
                            { header: "ID", accessor: "id", align: 'start', width: '70px', sortable: true },
                            { header: "Nombre", accessor: "nombre", align: 'start', width: '90px', sortable: true },
                            { header: "Fantasia", accessor: "fantasia", align: 'start', width: '90px', sortable: true },
                            { header: "CI", accessor: "cedula", align: 'start', width: '90px', sortable: true },
                            { header: "RUC", accessor: "ruc", align: 'start', width: '90px', sortable: true },
                            { header: "Teléfono", accessor: "telefono", align: 'start', width: '90px', sortable: true },
                            { header: "Ciudad", accessor: "ciudad", align: 'start', width: '90px', sortable: true },
                        ]}
                        showGlobalSearch={true}
                        globalSearchPlaceholder="Buscar por todos los campos!"
                        initialPageSize={7}
                        selectable={false}
                        showFilters={false}
                        onRowClick={handleSeleccionar}
                    />
                </ModalGeneral>
                <ModalGeneral
                    title='Aplicar Descuento'
                    isOpen={isModalDescuentoOpen}
                    onClose={() => setIsModalDescuentoOpen(false)}
                    width='400px'
                    height='325px'
                    childrenPadding={false}
                    showCloseButton={false}
                    footer={
                        <>
                            <button
                                onClick={() => handleAplicarDescuento(descuentoTipo, descuentoValor)}
                                className="flex justify-center items-center gap-2 px-4 py-2.5 font-semibold rounded-xl bg-[#188180] text-white"
                            >
                                Aplicar Descuento
                            </button>
                        </>
                    }
                    children={
                        <>
                            <div className="p-3">
                                <div>
                                    <span className="font-semibold">Tipo Descuento</span>
                                    <div>
                                        <SelectCustom
                                            options={[
                                                { value: 'porcentaje', label: 'Porcentaje' },
                                                { value: 'valor', label: 'Valor' },
                                                { value: 'sin_descuento', label: 'Sin Descuento' },
                                            ]}
                                            isClearable={false}
                                            searchable={false}
                                            value={descuentoTipo}
                                            onChange={e => {
                                                setDescuentoTipo((e as 'porcentaje' | 'valor' | 'sin_descuento'))
                                                if (descuentoTipo != e) {
                                                    setDescuentoValor(Number(0))
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold">Valor</span>
                                    <div>
                                        <InputERP
                                            type={`${descuentoTipo == 'porcentaje' ? 'number' : 'currency'}`}
                                            moneda={monedaSeleccionada}
                                            value={descuentoValor}
                                            max={descuentoTipo === 'porcentaje' ? 100 : 100000000000}
                                            disabled={descuentoTipo === 'sin_descuento'}
                                            onChange={e => setDescuentoValor(Number(e))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                />
            </div>
        </>
    );
}

export default FormTransaccion; */