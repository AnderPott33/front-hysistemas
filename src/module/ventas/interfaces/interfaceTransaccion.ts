/* import type { InterfaceMoneda } from "../../moneda/interfaces/InterfaceMoneda";
import type { InterfacePersona } from "../../persona/interfaces/InterfacePersona";

export interface InterfaceMovimiento {
  id: number | string;
  estado: string;
  motivo_cancelacion?: string;
  cotizacion: [];
  cuenta_origen?: number;
  moneda_origen?: InterfaceMoneda;
  cuenta_destino?: number;
  moneda_destino?: InterfaceMoneda;
  cotizacion_transferencia?: number;
  fecha_movimiento: string;
  numero_filial?: number;
  numero_punto_expedicion?: number;
  numero_factura?: number;
  observacion?: string;
  persona?: InterfacePersona;
  recibo_fiscal: boolean;
  tipo_cobranza?: InterfaceTipoCobranza;
  

}

export interface InterfaceBaja {
  id: number | string;

}

export interface InterfaceTipoCobranza {
  movimiento_id: number;
  titulo_id: number;
  creado_en: string;
  fecha_movimiento: string;
  valor: number;
  valor_movimiento: number;
}

export interface InterfaceTitulo {
  id: number | string;
  nota_id: number | string;
  numero_nota?: string;
  creado_en: string;
  fecha_emision: string;
  moneda: InterfaceMoneda;
  persona_nombre?: string;
  persona_id: number;
  tipo_de_cobranza?: [InterfaceTipoCobranza];
  tipo_gasto?: number;
  tipo_ingreso?: number;
  operacion_financiera: number;
  numero_parcela: number;
  saldo: number;
  valor: number;
  valor_devolvido: number;
  vencimiento: string;
}


export interface InterfacePago {
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

export interface PayloadTransaccion {
  formData: InterfaceBaja;
  formDetalle: InterfaceDetalleBaja;
  formPago: InterfacePago[];
} */