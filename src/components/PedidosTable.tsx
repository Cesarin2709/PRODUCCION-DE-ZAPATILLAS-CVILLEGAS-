import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2, Calendar, ClipboardCheck, Tag, Sparkles, Scale, Columns, Info } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';

interface PedidosTableProps {
  data: Pedido[];
  onUpdateStatus: (codigo: string, nuevoEstado: EstadoPedido) => void;
  onEdit: (pedido: Pedido) => void;
  onDelete: (codigo: string) => void;
}

const ESTADOS_CONFIG = {
  PENDIENTE: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    selectBg: 'bg-blue-100 text-blue-700',
    label: 'PENDIENTE',
    dotBg: 'bg-blue-500'
  },
  PRODUCCION: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    selectBg: 'bg-amber-100 text-amber-700',
    label: 'PRODUCCIÓN',
    dotBg: 'bg-amber-500'
  },
  SALIO: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    selectBg: 'bg-emerald-100 text-emerald-700',
    label: 'SALIÓ',
    dotBg: 'bg-emerald-500'
  }
};

// Available shoe sizes for table display header inside variants
const TALLAS_ESTANDAR = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

export const PedidosTable: React.FC<PedidosTableProps> = ({
  data,
  onUpdateStatus,
  onEdit,
  onDelete
}) => {
  // Store which pedido is expanded (using its unique codigo or id)
  const [expandedCodigo, setExpandedCodigo] = useState<string | null>(null);

  const toggleExpand = (codigo: string) => {
    if (expandedCodigo === codigo) {
      setExpandedCodigo(null);
    } else {
      setExpandedCodigo(codigo);
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-none border border-stone-200 p-12 text-center flex flex-col items-center justify-center shadow-none">
        <div className="w-12 h-12 bg-stone-100 rounded-none flex items-center justify-center text-stone-400 mb-4 border border-stone-250">
          <Info size={18} />
        </div>
        <h3 className="text-stone-900 font-bold text-base mb-1 uppercase tracking-widest font-mono">No hay pedidos</h3>
        <p className="text-stone-500 text-xs max-w-sm">
          No se encontraron pedidos con los filtros aplicados. Intenta cambiar los criterios de búsqueda o agrega un nuevo pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-none border border-stone-200 overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#fbfcfa] border-b border-stone-200 text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">
            <tr>
              <th className="px-3 py-4 w-12 text-center"></th>
              <th className="px-4 py-4">N° Pedido</th>
              <th className="px-4 py-4 text-center">Sem</th>
              <th className="px-4 py-4">Vendedor</th>
              <th className="px-4 py-4">Modelo / Producto</th>
              <th className="px-4 py-4 text-right">Doc Total</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {data.map((pedido) => {
              const isExpanded = expandedCodigo === pedido.codigo;
              const config = ESTADOS_CONFIG[pedido.estado] || ESTADOS_CONFIG.PENDIENTE;
              
              return (
                <React.Fragment key={pedido.id}>
                  {/* Row */}
                  <tr 
                    id={`pedido-row-${pedido.codigo}`}
                    className={`hover:bg-[#fbfcfa] transition-colors ${isExpanded ? 'bg-stone-50/75' : ''}`}
                  >
                    <td className="px-3 py-3.5 text-center">
                      <button 
                        id={`btn-expand-${pedido.codigo}`}
                        onClick={() => toggleExpand(pedido.codigo)}
                        className={`text-stone-400 hover:text-stone-900 hover:bg-stone-100 p-1.5 rounded-none border border-stone-200 transition-all ${isExpanded ? 'bg-stone-250 text-[#1A1A1A]' : ''}`}
                        title={isExpanded ? "Ocultar detalles" : "Ver distribución de tallas"}
                      >
                        <ChevronRight 
                          size={13} 
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-stone-900' : ''}`} 
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-stone-800 font-bold">
                      {pedido.codigo}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-stone-650">
                      <span className="bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-none text-[10px] font-mono border border-stone-200 font-bold">
                        {pedido.semana}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-stone-550 text-xs font-semibold uppercase tracking-tight">
                      {pedido.vendedor === "—" || !pedido.vendedor ? (
                        <span className="text-stone-300 font-normal">—</span>
                      ) : (
                        pedido.vendedor
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 tracking-tight">{pedido.producto}</span>
                        <span 
                          className="text-[9px] bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider"
                          title={`${pedido.variantes} variantes de color`}
                        >
                          {pedido.variantes} VAR
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#1A1A1A] font-serif text-lg italic">
                      {pedido.docenas}
                    </td>
                    <td className="px-4 py-3.5">
                      <select 
                        id={`select-status-${pedido.codigo}`}
                        value={pedido.estado}
                        onChange={(e) => onUpdateStatus(pedido.codigo, e.target.value as EstadoPedido)}
                        className="text-[9px] font-bold tracking-widest uppercase bg-stone-100 hover:bg-stone-200 border border-stone-350 px-2 py-1 rounded-none cursor-pointer focus:outline-none focus:border-stone-900 transition-colors duration-150 outline-none select-none"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PRODUCCION">PRODUCCIÓN</option>
                        <option value="SALIO">SALIÓ</option>
                      </select>
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex justify-center items-center gap-1.5">
                        <button 
                          id={`btn-edit-${pedido.codigo}`}
                          onClick={() => onEdit(pedido)} 
                          className="text-stone-600 hover:text-stone-900 hover:bg-stone-150 p-1.5 rounded-none border border-stone-200 transition"
                          title="Editar pedido"
                        >
                          <Pencil size={12} />
                        </button>
                        <button 
                          id={`btn-delete-${pedido.codigo}`}
                          onClick={() => onDelete(pedido.codigo)} 
                          className="text-stone-400 hover:text-red-705 hover:bg-stone-100 border border-stone-200 p-1.5 rounded-none transition"
                          title="Eliminar pedido"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expansion Row - Size breakdown table */}
                  {isExpanded && (
                    <tr id={`detail-row-${pedido.codigo}`} className="bg-[#fafaf7]">
                      <td colSpan={8} className="px-6 py-4 border-t border-b border-stone-200">
                        <div className="bg-white rounded-none border border-stone-200 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 pb-3 border-b border-stone-150">
                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-stone-500 flex items-center gap-1.5">
                                <Sparkles size={11} className="text-stone-400" />
                                Detalle de Variantes y Distribución de Tallas
                              </h4>
                              <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                                Registrado el {new Date(pedido.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                                Total docenas: <strong className="text-stone-800 font-bold">{pedido.docenas} doc.</strong> ({pedido.docenas * 12} pares)
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto rounded-none border border-stone-200">
                            <table className="w-full text-xs text-left min-w-[600px]">
                              <thead className="bg-[#fcfcf9] text-stone-400 text-[9px] uppercase font-bold tracking-[0.2em] border-b border-stone-200">
                                <tr>
                                  <th className="px-3 py-2.5 w-1/4">Color variant/modelo</th>
                                  {TALLAS_ESTANDAR.map(talla => (
                                    <th key={talla} className="px-2 py-2.5 text-center font-mono w-12">{talla}</th>
                                  ))}
                                  <th className="px-3 py-2.5 text-right w-24">Subtotal doc.</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-150">
                                {pedido.items && pedido.items.length > 0 ? (
                                  pedido.items.map((variant) => {
                                    // Calculate total dozen for this variant
                                    const variantTotal = Object.values(variant.tallas || {}).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
                                    
                                    return (
                                      <tr key={variant.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-3 py-2 font-bold text-stone-800 flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-none border border-stone-300 shadow-2xs inline-block" style={{ backgroundColor: getHexForColor(variant.color) }}></span>
                                          {variant.color}
                                        </td>
                                        {TALLAS_ESTANDAR.map(talla => {
                                          const value = variant.tallas[talla];
                                          return (
                                            <td key={talla} className={`px-2 py-2 text-center font-mono ${value ? 'font-bold text-stone-950 bg-stone-100' : 'text-stone-350'}`}>
                                              {value || '—'}
                                            </td>
                                          );
                                        })}
                                        <td className="px-3 py-2 text-right font-bold font-serif text-sm italic text-stone-900 bg-stone-50">
                                          {variantTotal}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={12} className="px-3 py-4 text-center text-stone-400 italic">
                                      No se registraron variantes de color para este pedido.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Quick helper to approximate HEX code for variant color indicators
function getHexForColor(colorName: string): string {
  const norm = colorName.toLowerCase().trim();
  if (norm.includes('negro')) return '#1e293b';
  if (norm.includes('blanco')) return '#f8fafc';
  if (norm.includes('rojo')) return '#ef4444';
  if (norm.includes('azul')) return '#3b82f6';
  if (norm.includes('marron') || norm.includes('marrón') || norm.includes('cafe') || norm.includes('café')) return '#78350f';
  if (norm.includes('verde')) return '#10b981';
  if (norm.includes('rosa')) return '#ec4899';
  if (norm.includes('gris')) return '#64748b';
  if (norm.includes('amarillo')) return '#eab308';
  if (norm.includes('beige') || norm.includes('arena')) return '#f5e0c3';
  if (norm.includes('hueso')) return '#f1ede4';
  if (norm.includes('charol')) return '#0f172a';
  if (norm.includes('miel')) return '#b45309';
  if (norm.includes('celeste')) return '#bae6fd';
  if (norm.includes('azul marino')) return '#1e1b4b';
  // Generics based on characters length to generate a stable pleasant pastel color
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}
