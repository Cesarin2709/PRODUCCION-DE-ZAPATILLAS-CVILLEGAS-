import React from 'react';
import { Pedido, EstadoPedido } from '../types';
import { 
  BarChart3, 
  Calendar, 
  Layers, 
  Truck, 
  Settings, 
  Scale, 
  Activity, 
  Flame, 
  Boxes, 
  SlidersHorizontal 
} from 'lucide-react';

interface ProductionAnalyticsProps {
  pedidos: Pedido[];
}

const TALLAS_ESTANDAR = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

export const ProductionAnalytics: React.FC<ProductionAnalyticsProps> = ({ pedidos }) => {
  // Count by status
  const totalPedidos = pedidos.length;
  const totalDocenas = pedidos.reduce((sum, p) => sum + p.docenas, 0);

  const stats = pedidos.reduce(
    (acc, p) => {
      acc[p.estado] = (acc[p.estado] || 0) + 1;
      acc[`docenas_${p.estado}`] = (acc[`docenas_${p.estado}`] || 0) + p.docenas;
      return acc;
    },
    {
      PENDIENTE: 0,
      PRODUCCION: 0,
      SALIO: 0,
      docenas_PENDIENTE: 0,
      docenas_PRODUCCION: 0,
      docenas_SALIO: 0
    }
  );

  // Calculated ratios
  const pctCompletado = totalPedidos > 0 ? Math.round((stats.SALIO / totalPedidos) * 100) : 0;
  const pctActivo = totalPedidos > 0 ? Math.round(((stats.PRODUCCION + stats.SALIO) / totalPedidos) * 100) : 0;

  // Group by Week
  const weekBreakdown = pedidos.reduce((acc, p) => {
    acc[p.semana] = (acc[p.semana] || 0) + p.docenas;
    return acc;
  }, {} as { [key: number]: number });

  // Size aggregation
  const sizeAgregado = TALLAS_ESTANDAR.reduce((acc, talla) => {
    let sum = 0;
    pedidos.forEach(p => {
      p.items.forEach(variant => {
        sum += variant.tallas[talla] || 0;
      });
    });
    acc[talla] = sum;
    return acc;
  }, {} as { [talla: string]: number });

  const maxDocenasPorTalla = Math.max(...(Object.values(sizeAgregado) as number[]), 1);

  // Sort weeks for chart
  const sortedWeeks = Object.keys(weekBreakdown)
    .map(Number)
    .sort((a, b) => a - b);
  const maxWeeklyDocenas = Math.max(...(Object.values(weekBreakdown) as number[]), 1);

  // Most active product model
  const modelStats = pedidos.reduce((acc, p) => {
    acc[p.producto] = (acc[p.producto] || 0) + p.docenas;
    return acc;
  }, {} as { [model: string]: number });

  const topModel = (Object.entries(modelStats) as [string, number][]).sort((a, b) => b[1] - a[1])[0] || ['Ninguno', 0];

  return (
    <div className="space-y-6">
      {/* Upper overview section with 4 stats summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total volume */}
        <div className="bg-white p-5 rounded-none shadow-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.15em]">Docenas Totales</span>
            <h3 className="text-2xl font-bold italic font-serif leading-none pt-1 text-[#1A1A1A]">
              {totalDocenas} <span className="text-[10px] text-stone-400 font-sans uppercase tracking-widest font-normal">doc.</span>
            </h3>
            <p className="text-[10px] text-stone-550 font-mono mt-0.5">Equivale a {totalDocenas * 12} pares</p>
          </div>
          <div className="w-10 h-10 bg-stone-100 text-[#1A1A1A] rounded-none border border-stone-250 flex items-center justify-center">
            <Boxes size={18} />
          </div>
        </div>

        {/* Card 2: Pedidos totals */}
        <div className="bg-white p-5 rounded-none shadow-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.15em]">Pedidos Registrados</span>
            <h3 className="text-2xl font-bold italic font-serif leading-none pt-1 text-[#1A1A1A]">
              {totalPedidos} <span className="text-[10px] text-stone-400 font-sans uppercase tracking-widest font-normal">lotes</span>
            </h3>
            <p className="text-[10px] text-stone-550 font-mono mt-0.5">Promedio: {totalPedidos > 0 ? (totalDocenas / totalPedidos).toFixed(1) : 0} p/pedido</p>
          </div>
          <div className="w-10 h-10 bg-stone-100 text-[#1A1A1A] rounded-none border border-stone-250 flex items-center justify-center">
            <Activity size={18} />
          </div>
        </div>

        {/* Card 3: Model leader */}
        <div className="bg-white p-5 rounded-none shadow-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.15em]">Modelo Líder</span>
            <h3 className="text-sm font-extrabold text-[#1A1A1A] truncate max-w-[130px] uppercase tracking-tight" title={topModel[0]}>
              {topModel[0]}
            </h3>
            <p className="text-[10px] text-stone-550 font-mono">Volumen: {topModel[1]} docenas</p>
          </div>
          <div className="w-10 h-10 bg-stone-100 text-[#1A1A1A] rounded-none border border-stone-250 flex items-center justify-center">
            <Flame size={18} />
          </div>
        </div>

        {/* Card 4: Completion rate gauge */}
        <div className="bg-white p-5 rounded-none shadow-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.15em]">Tasa de Despacho</span>
            <h3 className="text-2xl font-bold italic font-serif leading-none pt-1 text-[#1A1A1A]">
              {pctCompletado}%
            </h3>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Lotes en estado "SALIÓ"</p>
          </div>
          <div className="w-10 h-10 bg-stone-100 text-[#1A1A1A] rounded-none border border-stone-250 flex items-center justify-center">
            <Truck size={18} />
          </div>
        </div>
      </div>

      {/* Main Analysis Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Production Volume Chart */}
        <div className="bg-white p-6 rounded-none shadow-none border border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-500 flex items-center gap-1.5">
                <BarChart3 size={13} className="text-stone-400" />
                Planificación por Semanas de Trabajo
              </h4>
              <p className="text-stone-400 text-[10px] font-mono mt-0.5">Demanda de docenas desglosada por semana de despacho</p>
            </div>
            <span className="text-[9px] bg-[#1A1A1A] text-white uppercase tracking-widest font-bold px-2 py-0.5 rounded-none font-mono">
              Último Ciclo
            </span>
          </div>

          {sortedWeeks.length > 0 ? (
            <div className="h-60 flex items-end gap-3.5 pt-4 px-2">
              {sortedWeeks.map(semana => {
                const docenas = weekBreakdown[semana] || 0;
                const percentage = Math.max((docenas / maxWeeklyDocenas) * 85, 8); // height percentage

                return (
                  <div key={semana} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold px-2 py-1 rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-none border border-stone-700">
                      {docenas} docenas
                    </div>
                    
                    {/* Bar graphic representation */}
                    <div className="w-full bg-stone-100 rounded-none overflow-hidden flex flex-col justify-end h-44 border border-stone-200">
                      <div 
                        style={{ height: `${percentage}%` }}
                        className="w-full bg-[#1A1A1A] group-hover:bg-stone-700 transition-all duration-300 relative flex items-start justify-center pt-2"
                      >
                        <span className="text-[9px] text-white font-bold font-mono">
                          {docenas}
                        </span>
                      </div>
                    </div>

                    {/* Footer label */}
                    <span className="text-stone-500 font-mono text-[10px] font-bold mt-2 pt-1 border-t border-stone-200 w-full text-center uppercase tracking-wider">
                      Sem {semana}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-center text-stone-400 italic text-sm font-serif">
              No hay datos para construir la gráfica.
            </div>
          )}
        </div>

        {/* Shoe Size Distribution Statistics */}
        <div className="bg-white p-6 rounded-none shadow-none border border-stone-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-500 flex items-center gap-1.5">
                <Scale size={13} className="text-stone-400" />
                Matriz Consolidada de Tallaje (Hormas)
              </h4>
              <p className="text-stone-400 text-[10px] font-mono mt-0.5">Suma agregada de docenas requeridas por cada talla de calzado</p>
            </div>
          </div>

          {/* Size statistics list, styled as horizontal progresive bar graphs */}
          <div className="flex-1 space-y-3 justify-center flex flex-col">
            {TALLAS_ESTANDAR.map(talla => {
              const docenas = sizeAgregado[talla] || 0;
              const pct = (docenas / maxDocenasPorTalla) * 100;

              return (
                <div key={talla} className="flex items-center gap-3">
                  <span className="text-stone-700 font-mono font-bold text-[10px] w-8 text-right bg-stone-100 border border-stone-200 rounded-none py-0.5 px-1">
                    T.{talla}
                  </span>
                  
                  {/* Progressive track */}
                  <div className="flex-1 h-2.5 w-full bg-stone-100 rounded-none border border-stone-200 overflow-hidden relative">
                    <div 
                      style={{ width: `${docenas > 0 ? Math.max(pct, 2) : 0}%` }}
                      className="bg-[#1A1A1A] hover:bg-stone-700 h-full rounded-none transition-all duration-300"
                    />
                  </div>

                  <span className="text-[#1A1A1A] font-serif font-black text-xs italic w-14 text-right">
                    {docenas} <span className="text-[9px] text-stone-400 font-normal font-sans uppercase tracking-widest leading-none">doc.</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.15em] mt-4 text-center border-t border-[#fcfcf9] pt-3 flex items-center justify-center gap-1">
            <SlidersHorizontal size={10} className="text-stone-400" />
            Planificación del pedido de suelas, cajas y corte de capelladas.
          </div>
        </div>
      </div>

      {/* Bottom efficiency split breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* State 1: PENDIENTE */}
        <div className="bg-white p-4.5 rounded-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-stone-400 inline-block" />
              <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Pendiente</span>
            </div>
            <h3 className="text-base font-bold font-serif italic text-stone-800">
              {stats.PENDIENTE} <span className="text-[10px] text-stone-400 font-normal font-sans uppercase">lotes</span>
            </h3>
            <p className="text-[9px] text-stone-400 font-mono mt-0.5">Total: {stats.docenas_PENDIENTE} de docenas</p>
          </div>
          <span className="bg-stone-100 text-stone-850 text-[9px] font-bold px-2 py-0.5 rounded-none border border-stone-250 uppercase tracking-wider font-mono">
            {totalPedidos > 0 ? Math.round((stats.PENDIENTE / totalPedidos) * 105) / 100 : 0}%
          </span>
        </div>

        {/* State 2: PRODUCCION */}
        <div className="bg-white p-4.5 rounded-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-stone-800 inline-block animate-pulse" />
              <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">En Fabricación</span>
            </div>
            <h3 className="text-base font-bold font-serif italic text-stone-800">
              {stats.PRODUCCION} <span className="text-[10px] text-stone-400 font-normal font-sans uppercase">lotes</span>
            </h3>
            <p className="text-[9px] text-stone-400 font-mono mt-0.5">Total: {stats.docenas_PRODUCCION} de docenas</p>
          </div>
          <span className="bg-stone-100 text-stone-850 text-[9px] font-bold px-2 py-0.5 rounded-none border border-stone-250 uppercase tracking-wider font-mono">
            {totalPedidos > 0 ? Math.round((stats.PRODUCCION / totalPedidos) * 105) / 100 : 0}%
          </span>
        </div>

        {/* State 3: SALIO */}
        <div className="bg-white p-4.5 rounded-none border border-stone-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-stone-900 inline-block" />
              <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Despachado / Salió</span>
            </div>
            <h3 className="text-base font-bold font-serif italic text-stone-850">
              {stats.SALIO} <span className="text-[10px] text-stone-400 font-normal font-sans uppercase">lotes</span>
            </h3>
            <p className="text-[9px] text-stone-400 font-mono mt-0.5">Total: {stats.docenas_SALIO} de docenas</p>
          </div>
          <span className="bg-[#1A1A1A] text-white text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider font-mono">
            {totalPedidos > 0 ? Math.round((stats.SALIO / totalPedidos) * 105) / 100 : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};
