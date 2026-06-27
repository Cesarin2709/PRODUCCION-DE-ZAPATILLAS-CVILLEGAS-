export type EstadoPedido = 'PEDIDO' | 'PRODUCCION' | 'VENTA' | 'TEJIDO' | 'TEJIDO Y SUELA' | 'HABILITADO' | 'APARADO' | 'MONTAJE' | 'EN ALMACEN' | 'EN TIENDA' | 'VENDIDO';

export interface TallasDistribucion {
  [talla: string]: number; // Talla (ej. "35", "36", "37") -> Docenas (o pares. En este rubro se manejan docenas)
}

export interface PedidoVariante {
  id: string;
  color: string;
  tallas: TallasDistribucion;
  // Expanded spreadsheet properties for high fidelity tracking
  codigo?: string;
  linea?: string;
  tipo?: string;
  serie?: string;
  curva?: string;
  seriado?: string;
  suela?: string | number;
  tejido?: string | null;
  planta?: string | null;
  habilitado?: string | null;
  aparado?: string | null;
  montaje?: string | null;
  almacen?: string | null;
}

export interface Pedido {
  id: string; // UUID o ID único
  codigo: string; // Formato: PD + Año + Correlativo (ej. PD2026000216)
  fecha: string; // ISO date (ej. 2026-05-21)
  semana: number; // Número de semana de producción
  vendedor: string | null; // Nombre del vendedor o null ("—")
  producto: string; // Nombre del modelo de calzado (ej. "NEW BR6 01")
  variantes: number; // Cantidad de variantes (colores/tallas)
  docenas: number; // Suma total de docenas
  estado: EstadoPedido;
  items: PedidoVariante[]; // Detalle de variantes de color y distribución de tallas
  // New fields for the 5 key processes
  tejidoFecha?: string | null;
  plantaFecha?: string | null;
  habilitadoFecha?: string | null;
  aparadoFecha?: string | null;
  montajeFecha?: string | null;
}

export interface VendedorStats {
  nombre: string;
  pedidosCount: number;
  docenasTotal: number;
}

export interface Entregable {
  id: string;
  text: string;
  done: boolean;
}

export interface ModeloNuevo {
  id: string;
  modelo: string;
  estado: 'PENDIENTE' | 'EN PROCESO' | 'ENTREGADO' | 'POSTERGADO';
  inicio: string;
  fechaest: string;
  fin: string;
  planta: string;
  imgPlanta: string;
  imgCap: string;
  entregables: Entregable[];
  comentarios: string;
  motivo: string;
  created: number;
}

