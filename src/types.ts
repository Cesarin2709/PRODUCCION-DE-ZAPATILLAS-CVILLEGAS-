export type EstadoPedido = 'PENDIENTE' | 'PRODUCCION' | 'SALIO';

export interface TallasDistribucion {
  [talla: string]: number; // Talla (ej. "35", "36", "37") -> Docenas (o pares. En este rubro se manejan docenas)
}

export interface PedidoVariante {
  id: string;
  color: string;
  tallas: TallasDistribucion;
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
}

export interface VendedorStats {
  nombre: string;
  pedidosCount: number;
  docenasTotal: number;
}
