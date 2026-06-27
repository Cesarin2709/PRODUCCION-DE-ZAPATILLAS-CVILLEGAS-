import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table (Required by system auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'pedidos' table (Relational storage for footwear orders)
export const pedidos = pgTable('pedidos', {
  id: text('id').primaryKey(), // UUID or string ID
  codigo: text('codigo').notNull(), // Formato: PD + Año + Correlativo
  fecha: text('fecha').notNull(), // ISO Date
  semana: integer('semana').notNull(),
  vendedor: text('vendedor'),
  producto: text('producto').notNull(),
  variantes: integer('variantes').notNull().default(0),
  docenas: doublePrecision('docenas').notNull().default(0.0),
  estado: text('estado').notNull().default('PEDIDO'),
  tejidoFecha: text('tejido_fecha'),
  plantaFecha: text('planta_fecha'),
  habilitadoFecha: text('habilitado_fecha'),
  aparadoFecha: text('aparado_fecha'),
  montajeFecha: text('montaje_fecha'),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'pedido_variantes' table representing the items in a Pedido
export const pedidoVariantes = pgTable('pedido_variantes', {
  id: text('id').primaryKey(), // UUID or string ID
  pedidoId: text('pedido_id')
    .references(() => pedidos.id, { onDelete: 'cascade' })
    .notNull(),
  color: text('color').notNull(),
  tallas: jsonb('tallas').notNull(), // JSON mapping size -> quantity (e.g. {"35": 12})
  codigo: text('codigo'),
  linea: text('linea'),
  tipo: text('tipo'),
  serie: text('serie'),
  curva: text('curva'),
  seriado: text('seriado'),
  suela: text('suela'),
  tejido: text('tejido'),
  planta: text('planta'),
  habilitado: text('habilitado'),
  aparado: text('aparado'),
  montaje: text('montaje'),
  almacen: text('almacen'),
});

// Define relationships for 'users'
export const usersRelations = relations(users, ({ many }) => ({
  pedidos: many(pedidos),
}));

// Define relationships for 'pedidos'
export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  user: one(users, {
    fields: [pedidos.userId],
    references: [users.id],
  }),
  items: many(pedidoVariantes),
}));

// Define relationships for 'pedido_variantes'
export const pedidoVariantesRelations = relations(pedidoVariantes, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [pedidoVariantes.pedidoId],
    references: [pedidos.id],
  }),
}));
