import React from 'react';
import { TrabajadorDestajo, Operation } from './TrabajadorDestajo';

const INITIAL_BD_SANTOS: Operation[] = [
  { id: 1, operario: 'Santos', area: 'Corte', modelo: '', pieza: 'C. TALON', precio: 0.50 },
  { id: 2, operario: 'Santos', area: 'Corte', modelo: '', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 3, operario: 'Santos', area: 'Corte', modelo: '', pieza: 'C. FALSA', precio: 0.40 },
  { id: 4, operario: 'Santos', area: 'Corte', modelo: '', pieza: 'E', precio: 0.50 },
  { id: 5, operario: 'Santos', area: 'Corte', modelo: '', pieza: 'C. FALSA STROBELL', precio: 0.40 },
  { id: 6, operario: 'Santos', area: 'Corte', modelo: 'NEW FLEX', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 7, operario: 'Santos', area: 'Corte', modelo: 'NEW FLEX', pieza: 'C. TALON', precio: 0.50 },
  { id: 8, operario: 'Santos', area: 'Corte', modelo: 'NEW FLEX CHIMPUN', pieza: 'C. TALON', precio: 0.50 },
  { id: 9, operario: 'Santos', area: 'Corte', modelo: 'NEW FLEX CHIMPUN', pieza: 'C. FALSA', precio: 0.40 },
  { id: 10, operario: 'Santos', area: 'Corte', modelo: 'ADVANCE', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 11, operario: 'Santos', area: 'Corte', modelo: 'ADVANCE', pieza: 'C. TALON', precio: 0.50 },
  { id: 12, operario: 'Santos', area: 'Corte', modelo: 'B60', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 13, operario: 'Santos', area: 'Corte', modelo: 'B60', pieza: 'C. TALON', precio: 0.50 },
  { id: 14, operario: 'Santos', area: 'Corte', modelo: 'B60', pieza: 'C. ESPONJA', precio: 0.50 },
  { id: 15, operario: 'Santos', area: 'Corte', modelo: 'B60 CHIMPUN', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 16, operario: 'Santos', area: 'Corte', modelo: 'B60 CHIMPUN', pieza: 'C. TALON', precio: 0.50 },
  { id: 17, operario: 'Santos', area: 'Corte', modelo: 'B60 CHIMPUN', pieza: 'C. ESPONJA', precio: 0.50 },
  { id: 18, operario: 'Santos', area: 'Corte', modelo: 'B60 CHIMPUN', pieza: 'C. FALSA', precio: 0.50 },
  { id: 19, operario: 'Santos', area: 'Corte', modelo: 'BR6 BOTIN', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 20, operario: 'Santos', area: 'Corte', modelo: 'BR6 BOTIN', pieza: 'C. TALON', precio: 0.50 },
  { id: 21, operario: 'Santos', area: 'Corte', modelo: 'NEW BR6', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 22, operario: 'Santos', area: 'Corte', modelo: 'NEW BR6', pieza: 'C. TALON', precio: 0.50 },
  { id: 23, operario: 'Santos', area: 'Corte', modelo: 'NEW BR6', pieza: 'C. ESPONJA', precio: 0.50 },
  { id: 24, operario: 'Santos', area: 'Corte', modelo: 'POWER', pieza: 'C. TALON', precio: 0.50 },
  { id: 25, operario: 'Santos', area: 'Corte', modelo: 'POWER', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 26, operario: 'Santos', area: 'Corte', modelo: 'EVOLUTION', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 27, operario: 'Santos', area: 'Corte', modelo: 'EVOLUTION', pieza: 'C. TALON', precio: 0.50 },
  { id: 28, operario: 'Santos', area: 'Corte', modelo: 'PANTHER', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 29, operario: 'Santos', area: 'Corte', modelo: 'PANTHER', pieza: 'C. TALON', precio: 0.50 },
  { id: 30, operario: 'Santos', area: 'Corte', modelo: 'SUPERFLY', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 31, operario: 'Santos', area: 'Corte', modelo: 'SUPERFLY', pieza: 'C. TALON', precio: 0.50 },
  { id: 32, operario: 'Santos', area: 'Corte', modelo: 'SUPERFLY', pieza: 'C. ESPONJA', precio: 0.50 },
  { id: 33, operario: 'Santos', area: 'Corte', modelo: 'ABSOLUTE', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 34, operario: 'Santos', area: 'Corte', modelo: 'ABSOLUTE', pieza: 'C. TALON', precio: 0.50 },
  { id: 35, operario: 'Santos', area: 'Corte', modelo: 'BR6 PRINT', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 36, operario: 'Santos', area: 'Corte', modelo: 'BR6 PRINT', pieza: 'C. TALON', precio: 0.50 },
  { id: 38, operario: 'Santos', area: 'Corte', modelo: 'STRIKE', pieza: 'C. TALON', precio: 0.50 },
  { id: 40, operario: 'Santos', area: 'Corte', modelo: 'AIR ZOOM VAPOR', pieza: 'C. PUNTA', precio: 0.50 },
  { id: 41, operario: 'Santos', area: 'Corte', modelo: 'AIR ZOOM VAPOR', pieza: 'C. TALON', precio: 0.50 },
  { id: 43, operario: 'Santos', area: 'Corte', modelo: 'ABSOLUTE', pieza: 'C. ESPONJA', precio: 0.50 },
];

const PIEZAS_DEFAULT_SANTOS = [
  'C. PUNTA', 'C. TALON', 'C. ESPONJA', 'C. FALSA', 'C. FALSA STROBELL'
];

import { Pedido } from '../types';

export const SantosDestajo: React.FC<{ pedidos?: Pedido[] }> = ({ pedidos }) => {
  return (
    <TrabajadorDestajo
      workerName="Santos"
      areaName="Corte"
      operationsCollection="santosOperations"
      ordersCollection="destajos_santos"
      payoutsCollection="santosPayouts"
      initialDb={INITIAL_BD_SANTOS}
      localStoragePrefix="brixton_santos"
      piezasDefault={PIEZAS_DEFAULT_SANTOS}
      pedidos={pedidos}
    />
  );
};
