import React from 'react';
import { TrabajadorDestajo, Operation } from './TrabajadorDestajo';

const INITIAL_BD_JONAS: Operation[] = [
  { id: 1, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'COSTURA PLANTA', precio: 2.00 },
  { id: 2, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'COSTURA PLANTA RAPIDA', precio: 1.50 },
  { id: 3, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'CAJAS', precio: 0.55 },
  { id: 4, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'EMPAQUE CAJAS', precio: 1.10 },
  { id: 5, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: '', pieza: 'PASADOR', precio: 2.50 },
  { id: 6, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: 'BENOM 2026', pieza: 'PASADOR', precio: 2.50 },
  { id: 7, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: 'FORCE FAST', pieza: 'PASADOR', precio: 2.50 },
  { id: 8, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: 'NEW BR6', pieza: 'PASADOR', precio: 3.00 },
  { id: 9, operario: 'Jonas', area: 'Habilitado/Ensuelado', modelo: 'SUPER FLY', pieza: 'PASADOR', precio: 3.00 }
];

const PIEZAS_DEFAULT_JONAS = [
  'COSTURA PLANTA', 'CAJAS', 'PASADOR', 'EMPAQUE CAJAS'
];

import { Pedido } from '../types';

export const JonasDestajo: React.FC<{ pedidos?: Pedido[] }> = ({ pedidos }) => {
  return (
    <TrabajadorDestajo
      workerName="Jonas"
      areaName="Habilitado/Ensuelado"
      operationsCollection="jonasOperations"
      ordersCollection="jonasOrders"
      payoutsCollection="jonasPayouts"
      initialDb={INITIAL_BD_JONAS}
      localStoragePrefix="brixton_jonas"
      piezasDefault={PIEZAS_DEFAULT_JONAS}
      pedidos={pedidos}
    />
  );
};
