/* export interface InterfaceArticulo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_venta: number;
  precio_compra?: number;
  costo_promedio?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  iva_porcentaje: number;
  aplica_iva: boolean;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface InterfaceMovimientoStock {
  id: number;
  articulo_id: number;
  almacen_id: number;
  tipo_movimiento: string;
  cantidad: number;
  costo_unitario?: number;
  documento_tipo?: string;
  documento_id?: number;
  referencia?: string;
  usuario_id: number;
  creado_en?: string;
}

// ================================================================
// TRANSACCIONES Y DETALLES (NÚCLEO DEL SISTEMA)
// ================================================================




export interface InterfaceTransaccion {
  id: number | string;
  fecha: string;
  caja_id: number;
  operacion_id: number;
  usuario_id: number;
  moneda_id: number;
  timbrado?: number;
  tipo_comprobante?: string;
  numero_comprobante?: string;
  persona_id: number;
  estado: string;
  observacion?: string;
  valor_subtotal: number;
  valor_descuento: number;
  valor_iva: number;
  valor_total: number;
  motivo_cancelacion?: string;
}

export interface InterfaceDetalleTransaccion {
  id: number | string;
  transaccion_id: number | string;
  numero_linea: number;
  articulo_id?: number;
  descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  nuevo_precio_venta: number;
  iva?: number;
  valor_iva: number;
  valor_total: number;
  valor_descuento: number;
  categoria_gasto_ingreso?: number;
}

export interface InterfacePago {
  id: number | string;
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
}

export  interface InterfacePago {
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

export interface TransaccionCompleta {
  transaccion: InterfaceTransaccion;
  detalles: InterfaceDetalleTransaccion[];
  pagos: InterfacePago[];
}

export interface PayloadTransaccion {
  formData: InterfaceTransaccion;
  formDetalle: InterfaceDetalleTransaccion[];
  formPago: InterfacePago[];
} */