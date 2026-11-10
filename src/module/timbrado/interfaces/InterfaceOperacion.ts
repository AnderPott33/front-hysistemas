export interface InterfaceTimbrado {
  id: number | string,
  timbrado: number,
  tipo_transaccion: 'venta' | 'devolucion' | 'recibo_fiscal',
  tipo_nota: 'factura_formulario_continuo' | 'Factura_electronica' | 'auto_factura_electronica' | 'auto_factura' | 'nota_credito_electronica' | 'nota_credito',
  autorizacion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  punto_expedicion: number;
  sucursal: number;
  proximo_numero: number;
  numero_maximo: number
}