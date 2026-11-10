export interface InterfaceOperacionBaja {
  id: number;
  descripcion: string;
  modulo: 'Venta' | 'Financiero' | 'Compra';
  tipo_operacion: 'Débito' | 'Crédito';
  naturaleza_financiera: 'Entrada' | 'Salida';
  tipo_cuenta?: string;
  genera_documento_legal: boolean;
  timbrado: number;
  exige_persona: boolean;
  exige_categoria: boolean;
  exige_articulos: boolean;
  exige_almacen: boolean;
  genera_movimiento_stock: boolean;
  tipo_movimiento_stock?: string;
  genera_movimiento_financiero_categoria: boolean;
  genera_movimiento_financiero_cuenta: boolean;
  activo: boolean;
  creado_en?: string;
  categoria_id?: number;
  almacen_id?: number;
}