import React from 'react';
import { Pedido, VendedorStats } from '../types';
import { Users, FileSpreadsheet, Award, Percent, TrendingUp, Sparkles, HelpCircle, Package, ArrowUpRight } from 'lucide-react';

interface VendedoresStatsViewProps {
  pedidos: Pedido[];
}

export const VendedoresStatsView: React.FC<VendedoresStatsViewProps> = ({ pedidos }) => {
  // Process sellers
  const sellerMap = pedidos.reduce((acc, p) => {
    const name = p.vendedor || 'Por Oficina (Venta Directa)';
    if (!acc[name]) {
      acc[name] = {
        nombre: name,
        pedidosCount: 0,
        docenasTotal: 0
      };
    }
    acc[name]!.pedidosCount += 1;
    acc[name]!.docenasTotal += p.docenas;
    return acc;
  }, {} as { [nombre: string]: VendedorStats });

  const sellersArray = (Object.values(sellerMap) as VendedorStats[]).sort((a, b) => b.docenasTotal - a.docenasTotal);
  const totalVolumeAll = sellersArray.reduce((acc, s) => acc + s.docenasTotal, 0);

  // Find top seller
  const topSeller = sellersArray[0] || null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Leader Banner */}
        <div className="md:col-span-2 bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-slate-800 shadow-md">
          {/* Subtle decorative elements */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-indigo-600/30 blur-2xl rounded-full pointer-events-none" />
          <div className="absolute top-4 right-4 bg-slate-800 p-2.5 rounded-full text-amber-400 border border-slate-700">
            <Award size={20} className="animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] bg-slate-800 text-indigo-400 border border-slate-700/60 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Desempeño Comercial
            </span>
            <h3 className="text-xl font-black font-display mt-2">
              {topSeller ? `${topSeller.nombre} lidera el periodo` : 'Sin pedidos ingresados'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Vendedor con mayor volumen de colocación de pedidos de calzado en las semanas actuales de fabricación.
            </p>
          </div>

          {topSeller && (
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">Volumen Colocado</span>
                <p className="text-lg font-black text-white font-mono mt-0.5">
                  {topSeller.docenasTotal} <span className="text-xs font-medium text-slate-400">docenas</span>
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">Lotes</span>
                <p className="text-lg font-black text-indigo-300 font-mono mt-0.5">
                  {topSeller.pedidosCount} <span className="text-xs font-medium text-slate-400">pedidos</span>
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">Participación</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {totalVolumeAll > 0 ? Math.round((topSeller.docenasTotal / totalVolumeAll) * 100) : 0}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Global seller breakdown stats */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest font-display flex items-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-indigo-600" />
              Estadísticas Comerciales
            </h4>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Consolidado de ventas representadas por agentes comerciales en el sistema actual de talleres.
            </p>
          </div>

          <div className="space-y-3.5 mt-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 text-xs">Total Vendedores Activos:</span>
              <span className="font-extrabold text-sm text-gray-800">{sellersArray.length}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 text-xs">Promedio por Vendedor:</span>
              <span className="font-extrabold text-sm text-gray-800">
                {sellersArray.length > 0 ? Math.round(totalVolumeAll / sellersArray.length) : 0} doc.
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Eficiencia de Registro:</span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                100% ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Rankings list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-display">
              Desglose de Productividad por Vendedor / Taller
            </h4>
            <p className="text-gray-400 text-[10px]">Asignación detallada de volumen y pedidos correspondientes.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100/50 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
              <tr>
                <th className="px-5 py-3 text-center w-12">Rango</th>
                <th className="px-5 py-3">Nombre Agente Comercial</th>
                <th className="px-5 py-3 text-center">Pedidos Colocados</th>
                <th className="px-5 py-3 text-right">Docenas Colocadas</th>
                <th className="px-5 py-3 w-1/3">Participación de Fábrica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sellersArray.length > 0 ? (
                sellersArray.map((seller, index) => {
                  const pctShare = totalVolumeAll > 0 ? Math.round((seller.docenasTotal / totalVolumeAll) * 100) : 0;
                  
                  return (
                    <tr key={seller.nombre} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-center">
                        <span className={`w-6 h-6 rounded-lg font-black text-xs inline-flex items-center justify-center
                          ${index === 0 ? 'bg-amber-100 text-amber-700' : 
                            index === 1 ? 'bg-slate-200 text-slate-700' : 
                            index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-800 text-xs flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                          {seller.nombre.charAt(0)}
                        </div>
                        {seller.nombre}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-gray-700">
                        {seller.pedidosCount} {seller.pedidosCount === 1 ? 'pedido' : 'pedidos'}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-gray-900 text-sm">
                        {seller.docenasTotal} <span className="text-[10px] text-gray-400 font-medium">doc.</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${pctShare}%` }}
                              className="bg-indigo-600 h-full rounded-full"
                            />
                          </div>
                          <span className="font-mono font-bold text-gray-700 text-[11px] w-8 text-right">
                            {pctShare}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 italic">
                    Sin datos registrados sobre agentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
