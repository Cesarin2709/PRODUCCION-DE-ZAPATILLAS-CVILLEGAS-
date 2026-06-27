import React from 'react';
import { TrabajadorDestajo, Operation } from './TrabajadorDestajo';

const INITIAL_BD_CRISTHIAN: Operation[] = [
  { id: 1, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'CONFORMADO', precio: 1.00 },
  { id: 2, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'FALSA STROBELL', precio: 2.00 },
  { id: 3, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'REMALLE FALSA', precio: 0.90 },
  { id: 4, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'PASADOR', precio: 2.50 },
  { id: 5, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: 'B60', pieza: 'PASADOR', precio: 3.50 },
  { id: 6, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: 'BENOM 2026', pieza: 'PASADOR', precio: 2.50 },
  { id: 7, operario: 'Cristhian', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'ARMADO DE CAJA', precio: 1.10 }
];

const PIEZAS_DEFAULT_CRISTHIAN = [
  'CONFORMADO', 'FALSA STROBELL', 'REMALLE FALSA', 'PASADOR', 'ARMADO DE CAJA'
];

import { Pedido } from '../types';

export const CristhianDestajo: React.FC<{ pedidos?: Pedido[] }> = ({ pedidos }) => {
  return (
    <TrabajadorDestajo
      workerName="Cristhian"
      areaName="Habilitado/Ensuelado"
      operationsCollection="cristhianOperations"
      ordersCollection="cristhianOrders"
      payoutsCollection="cristhianPayouts"
      initialDb={INITIAL_BD_CRISTHIAN}
      localStoragePrefix="brixton_cristhian"
      piezasDefault={PIEZAS_DEFAULT_CRISTHIAN}
      pedidos={pedidos}
    />
  );
};
