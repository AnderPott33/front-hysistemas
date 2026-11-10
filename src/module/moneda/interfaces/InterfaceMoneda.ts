export interface InterfaceMoneda {
    id: number | string;
    codigo: string;
    nombre: string;
    simbolo: string;
    decimales: number;
    activo?: boolean;
    creado_en?: string;
}

export interface InterfaceTipoCambio {
    id: number | string;
    moneda_origen: number | string;
    origen_codigo?: string;
    origen_nombre?: string;
    origen_simbolo?: string;
    moneda_destino: number | string;
    destino_codigo?: string;
    destino_nombre?: string;
    destino_simbolo?: string;
    valor: number | string;
    fecha: string;
    activo?: boolean;
    creado_en?: Date | string;
}

export interface MonedaAPIP {

    symbol: string;
}

export interface MonedaAPI {
    isoCode: string;
    purchasePrice: number;
    salePrice: number;
    purchaseArbitrage: number;
    saleArbitrage: number;
    purchaseTrend: number;
    saleTrend: number;
    purchaseTrendArbitrage: number;
    saleTrendArbitrage: number;
    main: number;
    arbitrage: number;
    fractionDigits: number;
    updatedAt: string;
}

export interface RespuestaCotizaciones {
    updateTs: string;
    branchOfficeId: string;
    items: MonedaAPI[];
}

export type TipoPrecio = "compra" | "venta";
