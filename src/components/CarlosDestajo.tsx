import React from 'react';
import { TrabajadorDestajo, Operation } from './TrabajadorDestajo';

const INITIAL_BD_CARLOS: Operation[] = [
  { id: 1, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'FALSA STROBELL', precio: 2.00 },
  { id: 2, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'PASADOR', precio: 3.00 },
  { id: 3, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: 'BENOM 2026', pieza: 'PASADOR', precio: 2.50 },
  { id: 4, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: 'FORCE FAST', pieza: 'PASADOR', precio: 2.50 },
  { id: 5, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: 'NEW BR6', pieza: 'PASADOR', precio: 3.00 },
  { id: 6, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: 'SUPER FLY', pieza: 'PASADOR', precio: 3.00 },
  { id: 7, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: 'PRECISION', pieza: 'PASADOR', precio: 2.50 },
  { id: 8, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'FALSA', precio: 0.90 },
  { id: 9, operario: 'Carlos', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'CONFORMADO', precio: 0.90 },
];

const PIEZAS_DEFAULT_CARLOS = [
  'FALSA STROBELL', 'PASADOR', 'FALSA', 'CONFORMADO'
];

import { Pedido } from '../types';

export const CarlosDestajo: React.FC<{ pedidos?: Pedido[] }> = ({ pedidos }) => {
  return (
    <TrabajadorDestajo
      workerName="Carlos"
      areaName="Habilitado/Ensuelado"
      operationsCollection="carlosOperations"
      ordersCollection="carlosOrders"
      payoutsCollection="carlosPayouts"
      initialDb={INITIAL_BD_CARLOS}
      localStoragePrefix="brixton_carlos"
      piezasDefault={PIEZAS_DEFAULT_CARLOS}
      pedidos={pedidos}
    />
  );
};
