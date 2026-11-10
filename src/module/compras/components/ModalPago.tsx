/* import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Banknote,
    CalendarDays,
    Check,
    CreditCard,
    Landmark,
    Minus,
    Plus,
    QrCode,
    Trash2,
    X,
} from "lucide-react";
import InputERP from "../../../components/utils/InputERP";
import type {
    InterfaceMoneda,
    InterfaceTipoCambio,
} from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfaceCuenta } from "../../cuentas/interfaces/InterfaceCuenta";
import { formatarMoeda } from "../../../components/utils/Formatadores";
import SelectCustom from "../../../components/utils/SelectCustom";

import PY from '../../../assets/flags/py.svg'
import BR from '../../../assets/flags/br.svg'
import US from '../../../assets/flags/us.svg'
import ARS from '../../../assets/flags/ars.svg'

const BANDERAS_MONEDA: Record<string, string> = {
    PYG: PY,
    BRL: BR,
    USD: US,
    ARS: ARS,
};

interface InterfacePago {
    id: number;
    transaccion_id: number;
    valor: number;
    valor_convertido: number;
    forma_pago: string;
    moneda_id: number;
    tipo_cambio: number;
    cuenta_id: number;
    vencimiento?: string;
    tipo_comprobante?: string;
    comprobante?: string;
    observacion?: string;
    vuelto?: number;
    moneda_vuelto_id?: number;
    tipo_cambio_vuelto?: number;
    valor_vuelto_convertido?: number;
}

interface InterfaceModalPago {
    monedas: InterfaceMoneda[];
    monedaSeleccionada: InterfaceMoneda;
    valorTotal: number;
    formInicialPagos?: InterfacePago;
    recibirPagos: (pagos: InterfacePago[]) => void;
    cuentas: InterfaceCuenta[];
    tiposCambio: InterfaceTipoCambio[];
    usuarioId: number;
    bajaId: number;
    onCancel?: () => void;
    confirmar?: () => void;
}

interface PagoMoneda {
    cuenta_id: number;
    moneda_id: number;
    valor: number;
    vuelto: number;
}

interface Cuota {
    numero: number;
    valor: number;
    fechaVencimiento: string;
}

const FORMAS_DE_PAGO = [
    {
        forma: "Efectivo",
        tipoCuenta: "Efectivo",
        shortcut: "Alt+1",
        icon: Banknote,
    },
    {
        forma: "Transferencia",
        tipoCuenta: "Banco",
        shortcut: "Alt+2",
        icon: Landmark,
    },
    {
        forma: "A Plazos",
        tipoCuenta: "Banco",
        shortcut: "Alt+3",
        icon: CalendarDays,
    },
    {
        forma: "Tarjeta",
        tipoCuenta: "Banco",
        shortcut: "Alt+4",
        icon: CreditCard,
    },
    {
        forma: "Código QR",
        tipoCuenta: "Banco",
        shortcut: "Alt+5",
        icon: QrCode,
    },
] as const;

const getTipoCuenta = (formaPago: string): string => {
    const found = FORMAS_DE_PAGO.find(
        (f) => f.forma === formaPago
    );
    return found?.tipoCuenta || "Efectivo";
};

const roundMoney = (value: number): number => {
    if (!Number.isFinite(value)) return 0;
    return Math.round(
        (value + Number.EPSILON) * 100
    ) / 100;
};

const ModalPago = ({
    monedas,
    monedaSeleccionada,
    valorTotal,
    cuentas,
    formInicialPagos,
    recibirPagos,
    tiposCambio,
    usuarioId,
    bajaId,
    onCancel,
    confirmar
}: InterfaceModalPago) => {
    const [formaPago, setFormaPago] =
        useState<string>(
            formInicialPagos?.forma_pago ||
            "Efectivo"
        );

    const [cuentaSeleccionada, setCuentaSeleccionada] =
        useState<number | null>(
            formInicialPagos?.cuenta_id ||
            null
        );

    const [cuentasFiltered, setCuentasFiltered] =
        useState<InterfaceCuenta[]>([]);

    const [pagosMonedas, setPagosMonedas] =
        useState<
            Record<number, PagoMoneda>
        >({});

    const [
        informacionTransaccion,
        setInformacionTransaccion,
    ] = useState<string>("");

    const [cuotas, setCuotas] = useState<
        Cuota[]
    >([
        {
            numero: 1,
            valor: valorTotal,
            fechaVencimiento: "",
        },
    ]);

    const [erroresValidacion, setErroresValidacion] =
        useState<Record<number, string>>(
            {}
        );

    const COLOR_PRINCIPAL = "#359bac";
    const COLOR_PRINCIPAL_DARK = "#1e5a69";
    const COLOR_ERROR = "#ef4444";
    const COLOR_WARNING = "#f59e0b";

    const getC = (
        ori: number,
        des: number
    ): number => {
        if (
            Number(ori) === Number(des)
        ) {
            return 1;
        }

        const directo =
            tiposCambio.find(
                (c) =>
                    Number(
                        c.moneda_origen
                    ) === Number(ori) &&
                    Number(
                        c.moneda_destino
                    ) === Number(des)
            );

        if (
            directo &&
            Number(directo.valor) > 0
        ) {
            return Number(directo.valor);
        }

        const inverso =
            tiposCambio.find(
                (c) =>
                    Number(
                        c.moneda_origen
                    ) === Number(des) &&
                    Number(
                        c.moneda_destino
                    ) === Number(ori)
            );

        if (
            inverso &&
            Number(inverso.valor) > 0
        ) {
            return (
                1 /
                Number(inverso.valor)
            );
        }

        return 0;
    };

    useEffect(() => {
        const filtered =
            cuentas.filter(
                (e) =>
                    e.tipo_cuenta ===
                    getTipoCuenta(
                        formaPago
                    )
            );

        setCuentasFiltered(filtered);

        if (
            formaPago === "Efectivo"
        ) {
            const nuevosPagos: Record<
                number,
                PagoMoneda
            > = {};

            const nuevosErrores: Record<
                number,
                string
            > = {};

            filtered.forEach(
                (cuenta) => {
                    nuevosPagos[
                        Number(cuenta.id)
                    ] = {
                        cuenta_id:
                            Number(
                                cuenta.id
                            ),
                        moneda_id:
                            Number(
                                cuenta.moneda_id
                            ),
                        valor:
                            Number(
                                cuenta.moneda_id
                            ) ===
                                Number(
                                    monedaSeleccionada.id
                                )
                                ? roundMoney(
                                    valorTotal
                                )
                                : 0,
                        vuelto: 0,
                    };

                    nuevosErrores[
                        Number(cuenta.id)
                    ] = "";
                }
            );

            setPagosMonedas(
                nuevosPagos
            );

            setErroresValidacion(
                nuevosErrores
            );
        }

        if (
            formaPago === "A Plazos"
        ) {
            const fecha =
                new Date();

            fecha.setMonth(
                fecha.getMonth() + 1
            );

            setCuotas([
                {
                    numero: 1,
                    valor: roundMoney(
                        valorTotal
                    ),
                    fechaVencimiento:
                        fecha
                            .toISOString()
                            .split(
                                "T"
                            )[0],
                },
            ]);
        }

        if (
            formaPago !== "Efectivo"
        ) {
            setPagosMonedas({});
            setErroresValidacion({});
        }
    }, [
        formaPago,
        cuentas,
        monedaSeleccionada.id,
        valorTotal
    ]);

    const getMonedaInfo = (
        monedaId: number
    ) => {
        return monedas.find(
            (m) =>
                Number(m.id) ===
                Number(monedaId)
        );
    };

    const getBandera = (codigo: string): string | undefined => {
        return BANDERAS_MONEDA[codigo];
    };

    const calcularEfectivo = useMemo(() => {
        const totalPrincipal =
            roundMoney(
                Number(valorTotal) || 0
            );

        let totalPagadoPrincipal = 0;
        let totalVueltoPrincipal = 0;

        const informacion: Record<
            number,
            {
                pagoPrincipal: number;
                vueltoPrincipal: number;
                sugeridoPago: number;
                sugeridoVuelto: number;
            }
        > = {};

        cuentasFiltered.forEach(
            (cuenta) => {
                const cuentaId =
                    Number(
                        cuenta.id
                    );

                const pago =
                    pagosMonedas[
                    cuentaId
                    ];

                if (!pago) {
                    informacion[
                        cuentaId
                    ] = {
                        pagoPrincipal: 0,
                        vueltoPrincipal: 0,
                        sugeridoPago: 0,
                        sugeridoVuelto: 0,
                    };

                    return;
                }

                const monedaId =
                    Number(
                        cuenta.moneda_id
                    );

                const tasaPrincipal =
                    getC(
                        monedaId,
                        Number(
                            monedaSeleccionada.id
                        )
                    );

                const tasaCuenta =
                    getC(
                        Number(
                            monedaSeleccionada.id
                        ),
                        monedaId
                    );

                const monto =
                    Math.max(
                        0,
                        Number(
                            pago.valor
                        ) || 0
                    );

                const vuelto =
                    Math.max(
                        0,
                        Number(
                            pago.vuelto
                        ) || 0
                    );

                const pagoPrincipal =
                    tasaPrincipal >
                        0
                        ? roundMoney(
                            monto *
                            tasaPrincipal
                        )
                        : 0;

                const vueltoPrincipal =
                    tasaPrincipal >
                        0
                        ? roundMoney(
                            vuelto *
                            tasaPrincipal
                        )
                        : 0;

                totalPagadoPrincipal +=
                    pagoPrincipal;

                totalVueltoPrincipal +=
                    vueltoPrincipal;

                informacion[
                    cuentaId
                ] = {
                    pagoPrincipal,
                    vueltoPrincipal,
                    sugeridoPago:
                        tasaCuenta >
                            0
                            ? roundMoney(
                                Math.max(
                                    0,
                                    totalPrincipal -
                                    totalPagadoPrincipal +
                                    pagoPrincipal
                                ) *
                                tasaCuenta
                            )
                            : 0,
                    sugeridoVuelto:
                        tasaCuenta >
                            0
                            ? roundMoney(
                                Math.max(
                                    0,
                                    totalPagadoPrincipal -
                                    totalPrincipal -
                                    totalVueltoPrincipal +
                                    vueltoPrincipal
                                ) *
                                tasaCuenta
                            )
                            : 0,
                };
            }
        );

        const pendiente =
            roundMoney(
                Math.max(
                    0,
                    totalPrincipal -
                    totalPagadoPrincipal
                )
            );

        const excedenteDisponible =
            roundMoney(
                Math.max(
                    0,
                    totalPagadoPrincipal -
                    totalPrincipal -
                    totalVueltoPrincipal
                )
            );

        return {
            totalPrincipal,
            totalPagadoPrincipal:
                roundMoney(
                    totalPagadoPrincipal
                ),
            totalVueltoPrincipal:
                roundMoney(
                    totalVueltoPrincipal
                ),
            pendiente,
            excedente:
                excedenteDisponible,
            excedenteAntesVuelto:
                excedenteDisponible,
            informacion,
        };
    }, [
        cuentasFiltered,
        pagosMonedas,
        monedaSeleccionada.id,
        tiposCambio,
        valorTotal,
    ]);

    const obtenerSugerenciaPago = (
        cuenta: InterfaceCuenta
    ): number => {
        const pendiente =
            calcularEfectivo.pendiente;

        if (
            pendiente <= 0.01
        ) {
            return 0;
        }

        const tasa =
            getC(
                Number(
                    monedaSeleccionada.id
                ),
                Number(
                    cuenta.moneda_id
                )
            );

        if (tasa <= 0) {
            return 0;
        }

        return roundMoney(
            pendiente * tasa
        );
    };

    const obtenerSugerenciaVuelto = (
        cuenta: InterfaceCuenta
    ): number => {
        const excedente =
            calcularEfectivo.excedenteAntesVuelto;

        if (
            excedente <= 0.01
        ) {
            return 0;
        }

        const tasa =
            getC(
                Number(
                    monedaSeleccionada.id
                ),
                Number(
                    cuenta.moneda_id
                )
            );

        if (tasa <= 0) {
            return 0;
        }

        return roundMoney(
            excedente * tasa
        );
    };

    const handleValorCuenta = (
        cuentaId: number,
        valor: number
    ) => {
        const valorNormalizado =
            roundMoney(
                Math.max(
                    0,
                    Number(valor) || 0
                )
            );

        setPagosMonedas(
            (prev) => ({
                ...prev,
                [cuentaId]: {
                    ...prev[
                    cuentaId
                    ],
                    cuenta_id:
                        Number(
                            cuentaId
                        ),
                    valor:
                        valorNormalizado,
                },
            })
        );

        setErroresValidacion(
            (prev) => ({
                ...prev,
                [cuentaId]: "",
            })
        );
    };

    const handleVueltoCuenta = (
        cuentaId: number,
        vuelto: number
    ) => {
        const vueltoNormalizado =
            roundMoney(
                Math.max(
                    0,
                    Number(vuelto) || 0
                )
            );

        setPagosMonedas(
            (prev) => ({
                ...prev,
                [cuentaId]: {
                    ...prev[
                    cuentaId
                    ],
                    cuenta_id:
                        Number(
                            cuentaId
                        ),
                    vuelto:
                        vueltoNormalizado,
                },
            })
        );
    };

    const handleVueltoManual = (
        cuentaId: number,
        vuelto: number
    ) => {
        const cuenta =
            cuentasFiltered.find(
                (c) =>
                    Number(c.id) ===
                    Number(cuentaId)
            );

        if (!cuenta) return;

        const tasa =
            getC(
                Number(
                    cuenta.moneda_id
                ),
                Number(
                    monedaSeleccionada.id
                )
            );

        const maxVuelto =
            tasa > 0
                ? roundMoney(
                    calcularEfectivo.excedente /
                    tasa
                )
                : 0;

        const valorFinal =
            Math.min(
                Math.max(
                    0,
                    Number(vuelto) ||
                    0
                ),
                maxVuelto
            );

        handleVueltoCuenta(
            cuentaId,
            valorFinal
        );
    };

    const validarEfectivo = useCallback(
        (): boolean => {
            const nuevosErrores: Record<
                number,
                string
            > = {};

            let valido = true;

            if (
                calcularEfectivo
                    .pendiente >
                0.01
            ) {
                valido = false;

                cuentasFiltered.forEach(
                    (cuenta) => {
                        const pago =
                            pagosMonedas[
                            Number(
                                cuenta.id
                            )
                            ];

                        if (
                            !pago ||
                            Number(
                                pago.valor
                            ) <= 0
                        ) {
                            nuevosErrores[
                                Number(
                                    cuenta.id
                                )
                            ] =
                                "Monto requerido";
                        }
                    }
                );
            }

            if (
                calcularEfectivo
                    .excedente >
                0.01
            ) {
                const excedente =
                    calcularEfectivo.excedente;

                if (
                    Math.abs(
                        excedente
                    ) >
                    0.01
                ) {
                    valido = false;
                }
            }

            setErroresValidacion(
                nuevosErrores
            );

            return valido;
        },
        [calcularEfectivo, cuentasFiltered, pagosMonedas]
    );

    const handleAgregarCuota =
        () => {
            const nuevasCuotas =
                cuotas.length + 1;

            const valorPorCuota =
                roundMoney(
                    valorTotal /
                    nuevasCuotas
                );

            const cuotasActualizadas: Cuota[] =
                [];

            for (
                let i = 0;
                i < nuevasCuotas;
                i++
            ) {
                const fecha =
                    new Date();

                fecha.setMonth(
                    fecha.getMonth() +
                    (i + 1)
                );

                cuotasActualizadas.push(
                    {
                        numero: i + 1,
                        valor:
                            valorPorCuota,
                        fechaVencimiento:
                            cuotas[i]
                                ?.fechaVencimiento ||
                            fecha
                                .toISOString()
                                .split(
                                    "T"
                                )[0],
                    }
                );
            }

            const total =
                cuotasActualizadas.reduce(
                    (sum, c) =>
                        sum +
                        c.valor,
                    0
                );

            const diferencia =
                roundMoney(
                    valorTotal -
                    total
                );

            if (
                Math.abs(
                    diferencia
                ) > 0
            ) {
                const ultima =
                    cuotasActualizadas.length -
                    1;

                cuotasActualizadas[
                    ultima
                ].valor =
                    roundMoney(
                        cuotasActualizadas[
                            ultima
                        ].valor +
                        diferencia
                    );
            }

            setCuotas(
                cuotasActualizadas
            );
        };

    const handleEliminarCuota =
        (
            numero: number
        ) => {
            if (
                cuotas.length <=
                1
            ) {
                return;
            }

            const nuevas =
                cuotas
                    .filter(
                        (c) =>
                            c.numero !==
                            numero
                    )
                    .map(
                        (
                            c,
                            i
                        ) => ({
                            ...c,
                            numero:
                                i + 1,
                        })
                    );

            const valorPorCuota =
                roundMoney(
                    valorTotal /
                    nuevas.length
                );

            const actualizadas =
                nuevas.map(
                    (
                        c,
                        index
                    ) => ({
                        ...c,
                        valor:
                            index ===
                                nuevas.length -
                                1
                                ? roundMoney(
                                    valorTotal -
                                    valorPorCuota *
                                    (nuevas.length -
                                        1)
                                )
                                : valorPorCuota,
                    })
                );

            setCuotas(
                actualizadas
            );
        };

    const handleActualizarCuota =
        (
            numero: number,
            campo:
                | "valor"
                | "fechaVencimiento",
            valor: any
        ) => {
            setCuotas(
                (prev) =>
                    prev.map(
                        (c) =>
                            c.numero ===
                                numero
                                ? {
                                    ...c,
                                    [campo]:
                                        campo ===
                                            "valor"
                                            ? roundMoney(
                                                Number(
                                                    valor
                                                ) ||
                                                0
                                            )
                                            : valor,
                                }
                                : c
                    )
            );
        };

    const calcularTotalCuotas =
        (): number => {
            return roundMoney(
                cuotas.reduce(
                    (
                        sum,
                        c
                    ) =>
                        sum +
                        (Number(
                            c.valor
                        ) || 0),
                    0
                )
            );
        };

    const construirArrayPagos = (): InterfacePago[] => {
        const pagos: InterfacePago[] = [];

        if (formaPago === "Efectivo") {
            Object.entries(pagosMonedas).forEach(([cuentaId, pago]) => {
                const cuenta = cuentasFiltered.find(
                    (c) => Number(c.id) === Number(cuentaId)
                );

                if (!cuenta) {
                    return;
                }

                const monto = roundMoney(Number(pago.valor) || 0);
                const vuelto = roundMoney(Number(pago.vuelto) || 0);

                if (monto <= 0 && vuelto <= 0) {
                    return;
                }

                const tasaCambio = getC(
                    Number(pago.moneda_id),
                    Number(monedaSeleccionada.id)
                );

                pagos.push({
                    id: 0,
                    transaccion_id: 0,
                    valor: monto,
                    valor_convertido: roundMoney(monto * tasaCambio),
                    cuenta_id: Number(pago.cuenta_id),
                    forma_pago: "Efectivo",
                    moneda_id: Number(pago.moneda_id),
                    tipo_cambio: tasaCambio || 1,
                    observacion: informacionTransaccion,
                    vuelto: vuelto > 0 ? vuelto : 0,
                    moneda_vuelto_id: Number(pago.moneda_id),
                    tipo_cambio_vuelto: vuelto > 0 ? getC(Number(pago.moneda_id), Number(monedaSeleccionada.id)) : 1,
                    valor_vuelto_convertido: vuelto > 0 ? roundMoney(vuelto * getC(Number(pago.moneda_id), Number(monedaSeleccionada.id))) : 0,
                });
            });
        } else if (formaPago === "A Plazos") {
            cuotas.forEach((cuota) => {
                pagos.push({
                    id: 0,
                    transaccion_id: 0,
                    valor: roundMoney(cuota.valor),
                    valor_convertido: roundMoney(
                        cuota.valor * Number(tiposCambio)
                    ),
                    cuenta_id: cuentaSeleccionada || 0,
                    forma_pago: "Crédito",
                    moneda_id: Number(monedaSeleccionada.id),
                    tipo_cambio: 1,
                    vencimiento: cuota.fechaVencimiento,
                    observacion: informacionTransaccion,
                });
            });
        } else {
            pagos.push({
                id: 0,
                transaccion_id: 0,
                valor: roundMoney(valorTotal),
                valor_convertido: roundMoney(valorTotal),
                cuenta_id: cuentaSeleccionada || 0,
                forma_pago: formaPago,
                moneda_id: Number(monedaSeleccionada.id),
                tipo_cambio: 1,
                observacion: informacionTransaccion,
            });
        }

        return pagos;
    };

    const handleRealizarVenta = useCallback(
        () => {
            if (
                formaPago ===
                "Efectivo" &&
                !validarEfectivo()
            ) {
                return;
            }

            if (
                formaPago !==
                "Efectivo" &&
                formaPago !==
                "A Plazos" &&
                !cuentaSeleccionada
            ) {
                return;
            }

            const pagos =
                construirArrayPagos();

            if (
                pagos.length >
                0
            ) {
                recibirPagos(
                    pagos
                );
            }
        },
        [formaPago, cuentaSeleccionada, validarEfectivo, recibirPagos, construirArrayPagos]
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleRealizarVenta();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleRealizarVenta]);

    const renderMetodoPago = (
        forma: (typeof FORMAS_DE_PAGO)[number]
    ) => {
        const Icon =
            forma.icon;

        const activo =
            formaPago ===
            forma.forma;

        return (
            <button
                key={
                    forma.forma
                }
                type="button"
                onClick={() =>
                    setFormaPago(
                        forma.forma
                    )
                }
                className={`group h-11 px-4 rounded-xl border flex items-center gap-2.5 transition-all duration-150 cursor-pointer ${activo
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                title={
                    forma.shortcut
                }
            >
                <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activo
                        ? "border-blue-500"
                        : "border-slate-300"
                        }`}
                >
                    {activo && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                </span>

                <Icon
                    size={17}
                    strokeWidth={
                        1.8
                    }
                    className={
                        activo
                            ? "text-blue-600"
                            : "text-slate-500"
                    }
                />

                <span className="font-semibold text-sm whitespace-nowrap">
                    {
                        forma.forma
                    }
                </span>

                <span
                    className={`hidden xl:inline text-xs ${activo
                        ? "text-blue-500"
                        : "text-slate-400"
                        }`}
                >
                    (
                    {
                        forma.shortcut
                    }
                    )
                </span>
            </button>
        );
    };

    const renderEfectivo =
        () => {
            return (
                <div className="px-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-4 gap-1.5">
                        {cuentasFiltered.map(
                            (
                                cuenta
                            ) => {
                                const cuentaId =
                                    Number(
                                        cuenta.id
                                    );

                                const monedaInfo =
                                    getMonedaInfo(
                                        Number(
                                            cuenta.moneda_id
                                        )
                                    );

                                const pago =
                                    pagosMonedas[
                                    cuentaId
                                    ] ||
                                    {
                                        cuenta_id:
                                            cuentaId,
                                        moneda_id:
                                            Number(
                                                cuenta.moneda_id
                                            ),
                                        valor: 0,
                                        vuelto: 0,
                                    };

                                const sugeridoPago =
                                    obtenerSugerenciaPago(
                                        cuenta
                                    );

                                const sugeridoVuelto =
                                    obtenerSugerenciaVuelto(
                                        cuenta
                                    );

                                const vueltoActual =
                                    Number(
                                        pago.vuelto
                                    ) || 0;

                                const error =
                                    erroresValidacion[
                                    cuentaId
                                    ];

                                const monedaPrincipal =
                                    Number(
                                        monedaSeleccionada.id
                                    ) ===
                                    Number(
                                        cuenta.moneda_id
                                    );

                                const nombreMoneda =
                                    monedaInfo?.nombre?.split(
                                        " "
                                    )[0] ||
                                    "Moneda";

                                const banderaUrl = getBandera(
                                    monedaInfo?.codigo || ""
                                );

                                return (
                                    <div
                                        key={
                                            cuenta.id
                                        }
                                        className={`rounded-xl border bg-white overflow-hidden transition-all ${error
                                            ? "border-red-400 ring-1 ring-red-100"
                                            : monedaPrincipal
                                                ? "border-blue-300 ring-1 ring-blue-100"
                                                : "border-slate-200"
                                            }`}
                                    >
                                        <div className="px-3 py-2 border-b border-slate-100">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {banderaUrl ? (
                                                        <img
                                                            src={banderaUrl}
                                                            alt={monedaInfo?.codigo || "Moneda"}
                                                            className="w-6 h-6 object-cover rounded-sm"
                                                        />
                                                    ) : (
                                                        <span className="w-6 h-6 bg-slate-200 rounded-sm flex items-center justify-center text-xs font-bold text-slate-600">
                                                            {monedaInfo?.codigo?.slice(0, 1) || "?"}
                                                        </span>
                                                    )}

                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-800 text-sm truncate">
                                                            {
                                                                nombreMoneda
                                                            }
                                                        </div>

                                                        <div className="text-[11px] text-slate-400">
                                                            {
                                                                monedaInfo?.codigo
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="font-bold text-sm text-[#176b8b] whitespace-nowrap">
                                                    {sugeridoPago >
                                                        0
                                                        ? formatarMoeda(
                                                            sugeridoPago,
                                                            monedaInfo
                                                        )
                                                        : "Pago completo"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-1 pt-2.5 pb-2">
                                            <div className="grid grid-cols-2 gap-1">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-[11px] font-bold text-slate-500 uppercase">
                                                            VALOR
                                                        </label>

                                                        {sugeridoPago >
                                                            0.01 &&
                                                            pago.valor <=
                                                            0.01 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleValorCuenta(
                                                                            cuentaId,
                                                                            sugeridoPago
                                                                        )
                                                                    }
                                                                    className="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-white cursor-pointer hover:opacity-90"
                                                                    style={{
                                                                        backgroundColor:
                                                                            COLOR_WARNING,
                                                                    }}
                                                                >
                                                                    Sugerir
                                                                </button>
                                                            )}
                                                    </div>

                                                    <div className="scale-y-80">
                                                        <InputERP
                                                            type="currency"
                                                            moneda={
                                                                monedaInfo
                                                            }
                                                            value={
                                                                pago.valor ===
                                                                    0
                                                                    ? ""
                                                                    : pago.valor
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleValorCuenta(
                                                                    cuentaId,
                                                                    Number(
                                                                        e
                                                                    ) ||
                                                                    0
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-[11px] font-bold text-slate-500 uppercase">
                                                            VUELTO
                                                        </label>

                                                        {sugeridoVuelto >
                                                            0.01 &&
                                                            vueltoActual <=
                                                            0.01 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleVueltoManual(
                                                                            cuentaId,
                                                                            sugeridoVuelto
                                                                        )
                                                                    }
                                                                    className="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-white cursor-pointer hover:opacity-90"
                                                                    style={{
                                                                        backgroundColor:
                                                                            COLOR_PRINCIPAL,
                                                                    }}
                                                                >
                                                                    Sugerir
                                                                </button>
                                                            )}
                                                    </div>
                                                    <div className="scale-y-80">
                                                        <InputERP
                                                            type="currency"
                                                            moneda={
                                                                monedaInfo
                                                            }
                                                            value={
                                                                vueltoActual ===
                                                                    0
                                                                    ? ""
                                                                    : vueltoActual
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleVueltoManual(
                                                                    cuentaId,
                                                                    Number(
                                                                        e
                                                                    ) ||
                                                                    0
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {error ? (
                                                <div className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold text-red-500">
                                                    {
                                                        error
                                                    }
                                                </div>
                                            ) : vueltoActual >
                                                0 ? (
                                                <div className="mt-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                                                    Vuelto:{" "}
                                                    {formatarMoeda(
                                                        vueltoActual,
                                                        monedaInfo
                                                    )}
                                                </div>
                                            ) : sugeridoVuelto >
                                                0.01 ? (
                                                <div className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-600">
                                                    Vuelto disponible:{" "}
                                                    {formatarMoeda(
                                                        sugeridoVuelto,
                                                        monedaInfo
                                                    )}
                                                </div>
                                            ) : sugeridoPago >
                                                0.01 ? (
                                                <div className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-500">
                                                    Falta:{" "}
                                                    {formatarMoeda(
                                                        sugeridoPago,
                                                        monedaInfo
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-1.5 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                                    Pago completo
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    <div className="mt-1.5 rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="grid grid-cols-3 divide-x divide-slate-200 min-h-[42px] items-center">
                            <div className="px-4 flex items-center gap-1 text-sm">
                                <span className="text-slate-500">
                                    Pagado:
                                </span>

                                <strong className="text-slate-800">
                                    {formatarMoeda(
                                        calcularEfectivo.totalPagadoPrincipal,
                                        monedaSeleccionada
                                    )}
                                </strong>
                            </div>

                            <div className="px-4 text-center text-sm">
                                <span className="text-slate-500">
                                    Vuelto:
                                </span>{" "}

                                <strong className="text-emerald-600">
                                    {formatarMoeda(
                                        calcularEfectivo.totalVueltoPrincipal,
                                        monedaSeleccionada
                                    )}
                                </strong>
                            </div>

                            <div className="px-4 flex justify-end items-center gap-1 text-sm">
                                <span className="text-slate-500">
                                    Total Enviado:
                                </span>

                                <strong className="text-[#aeb300]">
                                    {formatarMoeda(
                                        roundMoney(
                                            calcularEfectivo.totalPagadoPrincipal -
                                            calcularEfectivo.totalVueltoPrincipal
                                        ),
                                        monedaSeleccionada
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div
                            className="mx-1 mb-1 rounded-lg min-h-[52px] px-4 flex items-center justify-between"
                            style={{
                                backgroundColor:
                                    "#edf5ff",
                                border:
                                    "2px solid #86b7ff",
                            }}
                        >
                            <span className="font-bold text-[#234db0]">
                                Total a pagar:
                            </span>

                            <span className="text-xl font-extrabold text-[#234db0]">
                                {formatarMoeda(
                                    valorTotal,
                                    monedaSeleccionada
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            );
        };

    const renderCuentaNoEfectivo =
        (
            titulo: string,
            placeholder: string
        ) => (
            <div className="px-4 pt-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            {titulo}
                        </label>

                        <SelectCustom
                            options={cuentasFiltered.map(
                                (
                                    cuenta
                                ) => ({
                                    value:
                                        cuenta.id,
                                    label: `${cuenta.nombre} - ${cuenta.banco_nombre ||
                                        "Sin banco"
                                        }`,
                                })
                            )}
                            value={
                                cuentaSeleccionada ||
                                ""
                            }
                            onChange={(
                                e
                            ) =>
                                setCuentaSeleccionada(
                                    Number(
                                        e
                                    ) ||
                                    null
                                )
                            }
                            placeholder={
                                placeholder
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            Información de la transacción
                        </label>

                        <InputERP
                            type="textarea"
                            value={
                                informacionTransaccion
                            }
                            onChange={(
                                e
                            ) =>
                                setInformacionTransaccion(
                                    e
                                )
                            }
                        />
                    </div>

                    <div
                        className="rounded-lg px-4 py-3 flex justify-between items-center"
                        style={{
                            backgroundColor:
                                "#edf5ff",
                            border:
                                "2px solid #86b7ff",
                        }}
                    >
                        <span className="font-bold text-[#234db0]">
                            Total a pagar:
                        </span>

                        <span className="text-xl font-extrabold text-[#234db0]">
                            {formatarMoeda(
                                valorTotal,
                                monedaSeleccionada
                            )}
                        </span>
                    </div>
                </div>
            </div>
        );

    const renderAPlazos =
        () => {
            const totalCuotas =
                calcularTotalCuotas();

            const diferencia =
                roundMoney(
                    valorTotal -
                    totalCuotas
                );

            return (
                <div className="px-4 pt-3 space-y-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                Detalles de las cuotas
                            </h3>

                            <span className="text-xs text-slate-500">
                                {
                                    cuotas.length
                                }{" "}
                                cuota
                                {cuotas.length >
                                    1
                                    ? "s"
                                    : ""}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={
                                    handleAgregarCuota
                                }
                                className="w-8 h-8 rounded-lg text-white flex items-center justify-center cursor-pointer hover:opacity-90"
                                style={{
                                    backgroundColor:
                                        COLOR_PRINCIPAL,
                                }}
                            >
                                <Plus
                                    size={
                                        17
                                    }
                                />
                            </button>

                            {cuotas.length >
                                1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEliminarCuota(
                                                cuotas[
                                                    cuotas.length -
                                                    1
                                                ]
                                                    .numero
                                            )
                                        }
                                        className="w-8 h-8 rounded-lg text-white flex items-center justify-center cursor-pointer hover:opacity-90"
                                        style={{
                                            backgroundColor:
                                                COLOR_ERROR,
                                        }}
                                    >
                                        <Minus
                                            size={
                                                17
                                            }
                                        />
                                    </button>
                                )}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-slate-600">
                                        N.°
                                    </th>

                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-600">
                                        VALOR
                                    </th>

                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-600">
                                        FECHA DE VENCIMIENTO
                                    </th>

                                    <th className="px-3 py-2 text-center text-xs font-bold text-slate-600">
                                        ACCIÓN
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {cuotas.map(
                                    (
                                        cuota
                                    ) => (
                                        <tr
                                            key={
                                                cuota.numero
                                            }
                                            className="border-t border-slate-100 hover:bg-slate-50"
                                        >
                                            <td className="px-3 py-2 text-center font-bold text-slate-700">
                                                {
                                                    cuota.numero
                                                }
                                            </td>

                                            <td className="px-3 py-2">
                                                <InputERP
                                                    type="currency"
                                                    moneda={
                                                        monedaSeleccionada
                                                    }
                                                    value={
                                                        cuota.valor ===
                                                            0
                                                            ? ""
                                                            : cuota.valor
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleActualizarCuota(
                                                            cuota.numero,
                                                            "valor",
                                                            Number(
                                                                e
                                                            ) ||
                                                            0
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-3 py-2">
                                                <InputERP
                                                    type="date"
                                                    value={
                                                        cuota.fechaVencimiento
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleActualizarCuota(
                                                            cuota.numero,
                                                            "fechaVencimiento",
                                                            e
                                                        )
                                                    }
                                                    className="w-full"
                                                />
                                            </td>

                                            <td className="px-3 py-2 text-center">
                                                {cuotas.length >
                                                    1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEliminarCuota(
                                                                    cuota.numero
                                                                )
                                                            }
                                                            className="w-8 h-8 rounded-lg text-white flex items-center justify-center mx-auto cursor-pointer hover:opacity-90"
                                                            style={{
                                                                backgroundColor:
                                                                    COLOR_ERROR,
                                                            }}
                                                        >
                                                            <Trash2
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-4 py-2 flex justify-between text-sm">
                            <span className="font-semibold text-slate-600">
                                Total Enviado:
                            </span>

                            <span
                                className="font-bold"
                                style={{
                                    color: COLOR_PRINCIPAL,
                                }}
                            >
                                {formatarMoeda(
                                    totalCuotas,
                                    monedaSeleccionada
                                )}
                            </span>
                        </div>

                        {Math.abs(
                            diferencia
                        ) >
                            0.01 && (
                                <div
                                    className="px-4 py-2 text-right text-sm font-bold"
                                    style={{
                                        color:
                                            diferencia >
                                                0
                                                ? COLOR_ERROR
                                                : COLOR_PRINCIPAL,
                                        backgroundColor:
                                            diferencia >
                                                0
                                                ? "#fff1f2"
                                                : "#edfafa",
                                    }}
                                >
                                    {diferencia >
                                        0
                                        ? "Falta:"
                                        : "Sobra:"}{" "}
                                    {formatarMoeda(
                                        Math.abs(
                                            diferencia
                                        ),
                                        monedaSeleccionada
                                    )}
                                </div>
                            )}

                        <div
                            className="mx-1 mb-1 rounded-lg p-3 flex justify-between items-center"
                            style={{
                                backgroundColor:
                                    "#edf5ff",
                                border:
                                    "2px solid #86b7ff",
                            }}
                        >
                            <span className="font-bold text-[#234db0]">
                                Total a pagar:
                            </span>

                            <span className="text-xl font-extrabold text-[#234db0]">
                                {formatarMoeda(
                                    valorTotal,
                                    monedaSeleccionada
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            );
        };

    const renderPaymentMethodContent =
        () => {
            switch (
            formaPago
            ) {
                case "Efectivo":
                    return renderEfectivo();

                case "Transferencia":
                    return renderCuentaNoEfectivo(
                        "Cuenta bancaria",
                        "Seleccionar cuenta bancaria"
                    );

                case "Tarjeta":
                    return renderCuentaNoEfectivo(
                        "Cuenta de tarjeta",
                        "Seleccionar cuenta de tarjeta"
                    );

                case "Código QR":
                    return renderCuentaNoEfectivo(
                        "Cuenta QR",
                        "Seleccionar cuenta QR"
                    );

                case "A Plazos":
                    return renderAPlazos();

                default:
                    return null;
            }
        };

    return (
        <div className="bg-white overflow-hidden">
            <div className="px-3 sm:px-4 pt-3 pb-2">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {FORMAS_DE_PAGO.map(
                        renderMetodoPago
                    )}
                </div>
            </div>

            <div className="border-t border-slate-200" />

            {renderPaymentMethodContent()}

            <div className="border-t border-slate-200 mt-3 px-4 py-3 flex justify-end gap-3 bg-white">
                <button
                    type="button"
                    onClick={
                        onCancel
                    }
                    className="h-12 px-7 rounded-lg font-semibold text-white transition-all hover:opacity-95 flex items-center gap-2 cursor-pointer"
                    style={{
                        backgroundColor:
                            COLOR_PRINCIPAL_DARK,
                    }}
                    title="Esc"
                >
                    <X
                        size={
                            18
                        }
                    />
                    Cancelar (Esc)
                </button>

                <button
                    type="button"
                    onClick={
                        handleRealizarVenta
                    }
                    disabled={
                        formaPago ===
                        "Efectivo" &&
                        calcularEfectivo.pendiente >
                        0.01
                    }
                    className="h-12 px-7 rounded-lg font-semibold text-white transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                        backgroundColor:
                            "#8ab0f0",
                    }}
                    title="Ctrl+Enter"
                >
                    <Check
                        size={
                            19
                        }
                    />
                    Realizar venta
                    (Ctrl+Enter)
                </button>
            </div>
        </div>
    );
};

export default ModalPago; */