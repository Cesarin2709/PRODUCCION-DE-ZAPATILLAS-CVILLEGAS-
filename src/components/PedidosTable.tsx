import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2, Calendar, ClipboardCheck, Tag, Sparkles, Scale, Columns, Info, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (direction: 'asc' | 'desc') => void;
  isNumeric?: boolean;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Buscar...",
  sortDirection,
  onSort,
  isNumeric = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // If the target element has been removed/detached from the DOM during a re-render,
      // we ignore this event to prevent the dropdown from closing accidentally.
      if (target && !document.body.contains(target)) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(x => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative inline-block w-full text-left" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1 w-full text-[10px] border border-stone-200 px-1.5 py-1 bg-white hover:border-stone-400 focus-within:border-stone-850 outline-none text-stone-800 rounded-none transition cursor-pointer select-none"
      >
        <span className="truncate max-w-[85px] font-mono">
          {selected.length === 0 
            ? 'Todo' 
            : selected.length === 1 
              ? selected[0] 
              : selected.length === options.length 
                ? 'Todos' 
                : `${selected.length} sel.`}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          {selected.length > 0 && (
            <span 
              onClick={handleClear}
              className="text-[9px] text-stone-400 hover:text-stone-900 px-0.5"
              title="Limpiar"
            >
              ✖
            </span>
          )}
          <ChevronDown size={10} className="text-stone-400" />
        </div>
      </div>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()} 
          className="absolute z-50 mt-1 w-52 bg-white border border-stone-300 shadow-lg rounded-none py-1.5 left-0"
        >
          {onSort && (
            <div className="px-1 pb-1.5 border-b border-stone-150 space-y-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSort('asc');
                  setIsOpen(false);
                }}
                className={`w-full text-left text-[10px] py-1 px-2 hover:bg-stone-100 flex items-center gap-1.5 font-mono text-stone-750 cursor-pointer ${sortDirection === 'asc' ? 'bg-stone-50 font-bold border-l-2 border-stone-900 text-stone-950' : ''}`}
              >
                <span>{isNumeric ? '⬆️ Ordenar de menor a mayor' : '⬆️ Ordenar de A a Z'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSort('desc');
                  setIsOpen(false);
                }}
                className={`w-full text-left text-[10px] py-1 px-2 hover:bg-stone-100 flex items-center gap-1.5 font-mono text-stone-750 cursor-pointer ${sortDirection === 'desc' ? 'bg-stone-50 font-bold border-l-2 border-stone-900 text-stone-950' : ''}`}
              >
                <span>{isNumeric ? '⬇️ Ordenar de mayor a menor' : '⬇️ Ordenar de Z a A'}</span>
              </button>
            </div>
          )}
          <div className="px-2 py-1.5 border-b border-stone-150 flex items-center justify-between gap-1">
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-[10px] border border-stone-200 px-1.5 py-1 bg-stone-50 outline-none hover:border-stone-300 focus:border-stone-500 rounded-none font-sans"
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-2 py-1 space-y-1">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleAll();
              }}
              className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-stone-50 cursor-pointer text-[10px] font-bold select-none text-stone-700 border-b border-stone-150 pb-1.5 mb-1"
            >
              <input
                type="checkbox"
                checked={selected.length === options.length && options.length > 0}
                readOnly
                className="w-3 h-3 text-[#1A1A1A] rounded-none focus:ring-0 border-stone-300 cursor-pointer"
              />
              <span>[ Seleccionar Todos ]</span>
            </div>
            {filteredOptions.length === 0 ? (
              <p className="text-[9px] text-stone-400 text-center py-2 italic">No hay opciones</p>
            ) : (
              filteredOptions.map(opt => {
                const isChecked = selected.includes(opt);
                return (
                  <div 
                    key={opt} 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleOption(opt);
                    }}
                    className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-stone-50 cursor-pointer text-[10px] select-none text-stone-700 transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-3 h-3 text-[#1A1A1A] rounded-none focus:ring-0 border-stone-300 cursor-pointer"
                    />
                    <span className="truncate font-mono">{opt}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const formatToDatetimeLocalValue = (val: string | null | undefined): string => {
  if (!val) return '';
  // If it's already YYYY-MM-DDTHH:mm (16 chars), return it
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
    return val;
  }
  // If it has seconds/milliseconds (like ISO string), clean it to YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
    return val.substring(0, 16);
  }
  // If it is YYYY-MM-DD (10 chars), return YYYY-MM-DDT00:00
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return `${val}T00:00`;
  }
  // Try parsing
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  } catch (e) {
    // ignore
  }
  return '';
};

const formatDatetimeToHuman = (val: string | null | undefined): string => {
  if (!val) return '';
  // Check if it's in YYYY-MM-DDTHH:mm format
  const tMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (tMatch) {
    const [, year, month, day, hours, minutes] = tMatch;
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  // Check if it is YYYY-MM-DD format
  const dMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dMatch) {
    const [, year, month, day] = dMatch;
    return `${day}/${month}/${year}`;
  }
  // Fallback try parsing
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  } catch (e) {
    // ignore
  }
  return val;
};

interface PedidosTableProps {
  data: Pedido[];
  onUpdateStatus: (codigo: string, nuevoEstado: EstadoPedido) => void;
  onEdit: (pedido: Pedido) => void;
  onDelete: (codigo: string) => void;
  onUpdatePedido?: (pedido: Pedido) => void;
  onFilteredDataChange?: (filtered: Pedido[]) => void;
}

const ESTADOS_CONFIG: Record<string, { bg: string; selectBg: string; label: string; dotBg: string }> = {
  PEDIDO: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    selectBg: 'bg-indigo-100 text-indigo-700',
    label: 'PEDIDO',
    dotBg: 'bg-indigo-500'
  },
  PRODUCCION: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    selectBg: 'bg-amber-100 text-amber-700',
    label: 'PRODUCCIÓN',
    dotBg: 'bg-amber-500'
  },
  TEJIDO: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    selectBg: 'bg-blue-100 text-blue-700',
    label: 'TEJIDO',
    dotBg: 'bg-blue-500'
  },
  'TEJIDO Y SUELA': {
    bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
    selectBg: 'bg-cyan-100 text-cyan-700',
    label: 'TEJIDO Y SUELA',
    dotBg: 'bg-cyan-500'
  },
  HABILITADO: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    selectBg: 'bg-purple-100 text-purple-700',
    label: 'HABILITADO',
    dotBg: 'bg-purple-500'
  },
  APARADO: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    selectBg: 'bg-rose-100 text-rose-700',
    label: 'APARADO',
    dotBg: 'bg-rose-500'
  },
  MONTAJE: {
    bg: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    selectBg: 'bg-orange-100 text-orange-700',
    label: 'MONTAJE',
    dotBg: 'bg-orange-500'
  },
  'EN ALMACEN': {
    bg: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    selectBg: 'bg-teal-100 text-teal-700',
    label: 'EN ALMACÉN',
    dotBg: 'bg-teal-500'
  },
  'EN TIENDA': {
    bg: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    selectBg: 'bg-violet-100 text-violet-700',
    label: 'EN TIENDA',
    dotBg: 'bg-violet-500'
  },
  VENDIDO: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    selectBg: 'bg-emerald-100 text-emerald-700',
    label: 'VENDIDO',
    dotBg: 'bg-emerald-500'
  },
  VENTA: {
    bg: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6] hover:bg-[#D7ECD9]',
    selectBg: 'bg-[#CEEAD6] text-[#137333]',
    label: 'VENTA',
    dotBg: 'bg-[#1e8e3e]'
  }
};

// Helper to detect if a status means a production or workshop batch
const isProductionState = (estado: string) => {
  return estado !== 'PEDIDO' && estado !== 'VENTA';
};

// Available shoe sizes for table display header inside variants
const TALLAS_ESTANDAR = ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

export const PedidosTable: React.FC<PedidosTableProps> = ({
  data,
  onUpdateStatus,
  onEdit,
  onDelete,
  onUpdatePedido,
  onFilteredDataChange
}) => {
  // Store which pedido is expanded (using its unique codigo or id)
  const [expandedCodigo, setExpandedCodigo] = useState<string | null>(null);

  const uniqueCodigos = Array.from(new Set(data.map(p => p.codigo).filter(Boolean))).sort();
  const uniqueSemanas = Array.from(new Set(data.map(p => String(p.semana)).filter(Boolean))).sort((a, b) => Number(a) - Number(b));
  const uniqueVendedores = Array.from(new Set(data.map(p => p.vendedor || '—').filter(Boolean))).sort();

  // Column filters state
  const [filters, setFilters] = useState({
    codigos: [] as string[],
    semanas: [] as string[],
    progreso: 'all',
    tejido: 'all',
    planta: 'all',
    habilitado: 'all',
    aparado: 'all',
    montaje: 'all',
    vendedores: [] as string[],
    producto: ''
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState<{
    key: 'codigo' | 'semana' | 'estado' | 'tejidoFecha' | 'plantaFecha' | 'habilitadoFecha' | 'aparadoFecha' | 'montajeFecha' | 'vendedor' | 'producto' | 'docenas' | '';
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });

  const handleSort = (key: 'codigo' | 'semana' | 'estado' | 'tejidoFecha' | 'plantaFecha' | 'habilitadoFecha' | 'aparadoFecha' | 'montajeFecha' | 'vendedor' | 'producto' | 'docenas') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const renderSortableHeader = (
    label: string, 
    key: 'codigo' | 'semana' | 'estado' | 'tejidoFecha' | 'plantaFecha' | 'habilitadoFecha' | 'aparadoFecha' | 'montajeFecha' | 'vendedor' | 'producto' | 'docenas',
    className = "",
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    let justifyClass = 'justify-between';
    if (align === 'center') justifyClass = 'justify-center gap-1.5';
    if (align === 'right') justifyClass = 'justify-end gap-1.5';

    const isSorted = sortConfig.key === key;

    return (
      <th 
        className={`py-4 px-3 cursor-pointer hover:bg-stone-100 hover:text-stone-900 transition-all select-none group ${className}`}
        onClick={() => handleSort(key)}
      >
        <div className={`flex items-center ${justifyClass}`}>
          {align === 'right' && (
            <div className="shrink-0">
              {isSorted ? (
                sortConfig.direction === 'asc' ? (
                  <ArrowUp size={11} className="text-stone-850" />
                ) : (
                  <ArrowDown size={11} className="text-stone-850" />
                )
              ) : (
                <ArrowUpDown size={11} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-all" />
              )}
            </div>
          )}
          <span className="truncate">{label}</span>
          {align !== 'right' && (
            <div className="shrink-0 ml-1">
              {isSorted ? (
                sortConfig.direction === 'asc' ? (
                  <ArrowUp size={11} className="text-stone-850" />
                ) : (
                  <ArrowDown size={11} className="text-stone-850" />
                )
              ) : (
                <ArrowUpDown size={11} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-all" />
              )}
            </div>
          )}
        </div>
      </th>
    );
  };

  const getProgressPercentage = (pedido: Pedido): number => {
    let count = 0;
    if (pedido.tejidoFecha) count++;
    if (pedido.plantaFecha) count++;
    if (pedido.habilitadoFecha) count++;
    if (pedido.aparadoFecha) count++;
    if (pedido.montajeFecha) count++;
    return count * 20; // Each is 20%
  };

  const filteredData = data.filter(pedido => {
    if (filters.codigos.length > 0 && !filters.codigos.includes(pedido.codigo)) {
      return false;
    }
    if (filters.semanas.length > 0 && !filters.semanas.includes(String(pedido.semana))) {
      return false;
    }
    
    // Progress %
    const pct = getProgressPercentage(pedido);
    if (filters.progreso !== 'all') {
      if (filters.progreso === '0' && pct !== 0) return false;
      if (filters.progreso === '20' && pct !== 20) return false;
      if (filters.progreso === '40' && pct !== 40) return false;
      if (filters.progreso === '60' && pct !== 60) return false;
      if (filters.progreso === '80' && pct !== 80) return false;
      if (filters.progreso === '100' && pct !== 100) return false;
      if (filters.progreso === 'incomplete' && pct === 100) return false;
      if (filters.progreso === 'completed' && pct !== 100) return false;
    }
    
    // Area checks
    if (filters.tejido !== 'all') {
      const isChecked = !!pedido.tejidoFecha;
      if (filters.tejido === 'completed' && !isChecked) return false;
      if (filters.tejido === 'pending' && isChecked) return false;
    }
    if (filters.planta !== 'all') {
      const isChecked = !!pedido.plantaFecha;
      if (filters.planta === 'completed' && !isChecked) return false;
      if (filters.planta === 'pending' && isChecked) return false;
    }
    if (filters.habilitado !== 'all') {
      const isChecked = !!pedido.habilitadoFecha;
      if (filters.habilitado === 'completed' && !isChecked) return false;
      if (filters.habilitado === 'pending' && isChecked) return false;
    }
    if (filters.aparado !== 'all') {
      const isChecked = !!pedido.aparadoFecha;
      if (filters.aparado === 'completed' && !isChecked) return false;
      if (filters.aparado === 'pending' && isChecked) return false;
    }
    if (filters.montaje !== 'all') {
      const isChecked = !!pedido.montajeFecha;
      if (filters.montaje === 'completed' && !isChecked) return false;
      if (filters.montaje === 'pending' && isChecked) return false;
    }
    
    if (filters.vendedores.length > 0) {
      const v = pedido.vendedor || '—';
      if (!filters.vendedores.includes(v)) {
        return false;
      }
    }
    if (filters.producto && !pedido.producto?.toLowerCase().includes(filters.producto.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Notify parent about filtered data changes using serialized primitive dependency key
  const filteredDataIdsKey = filteredData.map(p => `${p.id}-${p.docenas}`).join(',');
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredDataIdsKey, onFilteredDataChange]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortConfig.key) {
        case 'codigo':
          valA = a.codigo || '';
          valB = b.codigo || '';
          break;
        case 'semana':
          valA = a.semana || 0;
          valB = b.semana || 0;
          break;
        case 'estado':
          valA = getProgressPercentage(a);
          valB = getProgressPercentage(b);
          break;
        case 'tejidoFecha':
          valA = a.tejidoFecha || '';
          valB = b.tejidoFecha || '';
          break;
        case 'plantaFecha':
          valA = a.plantaFecha || '';
          valB = b.plantaFecha || '';
          break;
        case 'habilitadoFecha':
          valA = a.habilitadoFecha || '';
          valB = b.habilitadoFecha || '';
          break;
        case 'aparadoFecha':
          valA = a.aparadoFecha || '';
          valB = b.aparadoFecha || '';
          break;
        case 'montajeFecha':
          valA = a.montajeFecha || '';
          valB = b.montajeFecha || '';
          break;
        case 'vendedor':
          valA = a.vendedor || '';
          valB = b.vendedor || '';
          break;
        case 'producto':
          valA = a.producto || '';
          valB = b.producto || '';
          break;
        case 'docenas':
          valA = a.docenas || 0;
          valB = b.docenas || 0;
          break;
        default:
          return 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base', numeric: true })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base', numeric: true });
      } else {
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
    });
  }, [filteredData, sortConfig, getProgressPercentage]);

  const renderProcessCell = (
    pedido: Pedido, 
    fieldName: 'tejidoFecha' | 'plantaFecha' | 'habilitadoFecha' | 'aparadoFecha' | 'montajeFecha'
  ) => {
    const dateValue = pedido[fieldName] || '';
    const isChecked = !!dateValue;

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      let newDate = '';
      if (checked) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        newDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      const updatedPedido = {
        ...pedido,
        [fieldName]: newDate || null
      };
      onUpdatePedido?.(updatedPedido);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const updatedPedido = {
        ...pedido,
        [fieldName]: val || null
      };
      onUpdatePedido?.(updatedPedido);
    };

    return (
      <td className="px-1 py-2 text-center border-r border-stone-200/40 bg-[#fafaf7]/30 min-w-[98px] lg:min-w-[112px]">
        {/* Layout de pantalla */}
        <div className="flex flex-col items-center justify-center gap-1 print:hidden">
          <input 
            type="checkbox" 
            checked={isChecked}
            onChange={handleCheckboxChange}
            className="w-3.5 h-3.5 text-[#1A1A1A] bg-stone-50 border-stone-300 rounded-none focus:ring-[#1A1A1A] focus:ring-1 focus:ring-offset-0 cursor-pointer transition-all duration-150"
            title={isChecked ? `Completado el: ${formatDatetimeToHuman(dateValue)}` : 'Marcar como completado'}
          />
          {isChecked && (
            <input 
              type="datetime-local" 
              value={formatToDatetimeLocalValue(dateValue)}
              onChange={handleDateChange}
              className="text-[8.5px] font-mono border border-stone-200 px-0.5 py-0.5 w-[90px] lg:w-[100px] bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-700 transition"
              title="Editar fecha y hora"
            />
          )}
        </div>
        {/* Layout de impresión */}
        <div className="hidden print:block text-center text-[10px] font-mono text-stone-900 font-medium">
          {isChecked ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-stone-800">✓</span>
              {dateValue && <span className="text-[9px] text-stone-600 font-mono mt-0.5">{formatDatetimeToHuman(dateValue)}</span>}
            </div>
          ) : (
            <span className="text-stone-300">—</span>
          )}
        </div>
      </td>
    );
  };

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
    <div className="bg-white rounded-none border border-stone-200 overflow-hidden shadow-none print:border-none">
      {/* Cabecera de Impresión de Lotes (Solo visible al imprimir) */}
      <div className="hidden print:block mb-6 border-b-2 border-stone-900 pb-3">
        <h2 className="text-xl font-black uppercase text-black tracking-wider print:text-black print:font-black">
          REPORTE DE LOTES DE PRODUCCIÓN SEMANAL — BRIXTON
        </h2>
        <div className="flex justify-between items-center mt-1.5 text-[10px] font-mono text-stone-700">
          <span>Módulo de Control de Calzado & Logística</span>
          <span>Fecha de Emisión: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[520px] sm:max-h-[600px] lg:max-h-[660px] custom-table-scrollbar">
        <table className="w-full text-xs text-left min-w-[940px] xl:min-w-full relative border-collapse">
          <thead className="bg-[#fbfcfa] border-b border-stone-200 text-[10.5px] uppercase font-extrabold tracking-[0.1em] text-[#1A1A1A] print:text-black sticky top-0 z-20 shadow-[0_2px_2px_rgba(0,0,0,0.03)]">
            <tr className="bg-[#fbfcfa]">
              <th className="px-2 py-2.5 w-10 text-center print:hidden bg-[#fbfcfa]"></th>
              <th className="px-2 py-2.5 text-center print:hidden bg-[#fbfcfa]">Acciones</th>
              {renderSortableHeader("N° Orden", "codigo", "min-w-[80px] print:min-w-0 bg-[#fbfcfa]")}
              {renderSortableHeader("Sem", "semana", "w-10 text-center print:min-w-0 bg-[#fbfcfa]", "center")}
              {renderSortableHeader("Modelo / Producto", "producto", "min-w-[110px] print:min-w-0 bg-[#fbfcfa]")}
              {renderSortableHeader("Doc Total", "docenas", "text-right print:min-w-0 w-16 bg-[#fbfcfa]", "right")}
              {renderSortableHeader("Vendedor / Destino", "vendedor", "print:min-w-0 bg-[#fbfcfa]")}
              {renderSortableHeader("Estado del Lote", "estado", "min-w-[115px] print:min-w-0 bg-[#fbfcfa]")}
              {/* Process Columns */}
              {renderSortableHeader("TEJIDO", "tejidoFecha", "bg-[#fafaf7] border-l border-r border-stone-200 text-[#1A1A1A] font-extrabold tracking-wider text-center print:min-w-0 print:text-black", "center")}
              {renderSortableHeader("PLANTA", "plantaFecha", "bg-[#fafaf7] border-r border-stone-200 text-[#1A1A1A] font-extrabold tracking-wider text-center print:min-w-0 print:text-black", "center")}
              {renderSortableHeader("HABILITADO", "habilitadoFecha", "bg-[#fafaf7] border-r border-stone-200 text-[#1A1A1A] font-extrabold tracking-wider text-center print:min-w-0 print:text-black", "center")}
              {renderSortableHeader("APARADO", "aparadoFecha", "bg-[#fafaf7] border-r border-stone-200 text-[#1A1A1A] font-extrabold tracking-wider text-center print:min-w-0 print:text-black", "center")}
              {renderSortableHeader("MONTAJE", "montajeFecha", "bg-[#fafaf7] border-r border-stone-200 text-[#1A1A1A] font-extrabold tracking-wider text-center print:min-w-0 print:text-black", "center")}
            </tr>
            {/* Filter Controls Row */}
            <tr className="bg-[#fafaf7] border-b border-stone-200 print:hidden">
              <td className="px-2 py-1.5 text-center bg-[#fafaf7]">
                <button
                  onClick={() => setFilters({
                    codigos: [],
                    semanas: [],
                    progreso: 'all',
                    tejido: 'all',
                    planta: 'all',
                    habilitado: 'all',
                    aparado: 'all',
                    montaje: 'all',
                    vendedores: [],
                    producto: ''
                  })}
                  className="text-[10px] font-bold text-stone-500 hover:text-stone-900 border border-stone-200 bg-white px-1.5 py-1 rounded-none hover:bg-stone-100 transition"
                  title="Limpiar todos los filtros"
                >
                  ✖
                </button>
              </td>
              <td className="px-2 py-1.5 bg-[#fafaf7] print:hidden"></td>
              <td className="px-2 py-1.5 bg-[#fafaf7]">
                <MultiSelectFilter
                  label="N° Orden"
                  options={uniqueCodigos}
                  selected={filters.codigos}
                  onChange={(val) => setFilters(prev => ({ ...prev, codigos: val }))}
                  placeholder="Buscar N° Orden..."
                  sortDirection={sortConfig.key === 'codigo' ? sortConfig.direction : null}
                  onSort={(dir) => setSortConfig({ key: 'codigo', direction: dir })}
                />
              </td>
              <td className="px-1 py-1.5 bg-[#fafaf7]">
                <MultiSelectFilter
                  label="Semana"
                  options={uniqueSemanas}
                  selected={filters.semanas}
                  onChange={(val) => setFilters(prev => ({ ...prev, semanas: val }))}
                  placeholder="Buscar Sem..."
                  sortDirection={sortConfig.key === 'semana' ? sortConfig.direction : null}
                  onSort={(dir) => setSortConfig({ key: 'semana', direction: dir })}
                  isNumeric={true}
                />
              </td>
              <td className="px-2 py-1.5 bg-[#fafaf7]">
                <input
                  type="text"
                  placeholder="Producto..."
                  value={filters.producto}
                  onChange={(e) => setFilters(prev => ({ ...prev, producto: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-1.5 py-1 w-full bg-[#FFFFFF] hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none"
                />
              </td>
              <td className="px-2 py-1.5 bg-[#fafaf7]"></td>
              <td className="px-2 py-1.5 bg-[#fafaf7]">
                <MultiSelectFilter
                  label="Vendedor"
                  options={uniqueVendedores}
                  selected={filters.vendedores}
                  onChange={(val) => setFilters(prev => ({ ...prev, vendedores: val }))}
                  placeholder="Buscar Vendedor..."
                  sortDirection={sortConfig.key === 'vendedor' ? sortConfig.direction : null}
                  onSort={(dir) => setSortConfig({ key: 'vendedor', direction: dir })}
                />
              </td>
              <td className="px-2 py-1.5 bg-[#fafaf7]">
                <select
                  value={filters.progreso}
                  onChange={(e) => setFilters(prev => ({ ...prev, progreso: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-1 py-1 w-full bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none font-sans"
                >
                  <option value="all">Todo</option>
                  <option value="0">0%</option>
                  <option value="20">20%</option>
                  <option value="40">40%</option>
                  <option value="60">60%</option>
                  <option value="80">80%</option>
                  <option value="100">100%</option>
                  <option value="incomplete">Incompleto (&lt;100%)</option>
                  <option value="completed">Terminado (100%)</option>
                </select>
              </td>
              <td className="px-1.5 py-1.5 bg-[#fafaf7]">
                <select
                  value={filters.tejido}
                  onChange={(e) => setFilters(prev => ({ ...prev, tejido: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-0.5 py-1 w-full bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none font-sans"
                >
                  <option value="all">Todo</option>
                  <option value="completed">✓</option>
                  <option value="pending">✗</option>
                </select>
              </td>
              <td className="px-1.5 py-1.5 bg-[#fafaf7]">
                <select
                  value={filters.planta}
                  onChange={(e) => setFilters(prev => ({ ...prev, planta: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-0.5 py-1 w-full bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none font-sans"
                >
                  <option value="all">Todo</option>
                  <option value="completed">✓</option>
                  <option value="pending">✗</option>
                </select>
              </td>
              <td className="px-1.5 py-1.5 bg-[#fafaf7]">
                <select
                  value={filters.habilitado}
                  onChange={(e) => setFilters(prev => ({ ...prev, habilitado: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-0.5 py-1 w-full bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none font-sans"
                >
                  <option value="all">Todo</option>
                  <option value="completed">✓</option>
                  <option value="pending">✗</option>
                </select>
              </td>
              <td className="px-1.5 py-1.5 bg-[#fafaf7]">
                <select
                  value={filters.aparado}
                  onChange={(e) => setFilters(prev => ({ ...prev, aparado: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-0.5 py-1 w-full bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none font-sans"
                >
                  <option value="all">Todo</option>
                  <option value="completed">✓</option>
                  <option value="pending">✗</option>
                </select>
              </td>
              <td className="px-1.5 py-1.5 bg-[#fafaf7]">
                <select
                  value={filters.montaje}
                  onChange={(e) => setFilters(prev => ({ ...prev, montaje: e.target.value }))}
                  className="text-[10px] border border-stone-200 px-0.5 py-1 w-full bg-white hover:border-stone-400 focus:border-stone-850 outline-none text-stone-800 rounded-none font-sans"
                >
                  <option value="all">Todo</option>
                  <option value="completed">✓</option>
                  <option value="pending">✗</option>
                </select>
              </td>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-12 text-center bg-[#fbfcfa]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-stone-400 text-xs font-bold uppercase tracking-wider">No se encontraron registros con los filtros seleccionados</span>
                    <button
                      onClick={() => setFilters({
                        codigos: [],
                        semanas: [],
                        progreso: 'all',
                        tejido: 'all',
                        planta: 'all',
                        habilitado: 'all',
                        aparado: 'all',
                        montaje: 'all',
                        vendedores: [],
                        producto: ''
                      })}
                      className="text-[10px] font-bold text-stone-900 border border-stone-950 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 transition uppercase tracking-widest font-mono rounded-none"
                    >
                      Limpiar todos los filtros
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((pedido) => {
                const isExpanded = expandedCodigo === pedido.codigo;
                
                return (
                  <React.Fragment key={pedido.id}>
                    {/* Row */}
                    <tr 
                      id={`pedido-row-${pedido.codigo}`}
                      className={`hover:bg-[#fbfcfa] transition-colors ${isExpanded ? 'bg-stone-50/75' : ''}`}
                    >
                      <td className="px-2 py-2 text-center print:hidden">
                        <button 
                          id={`btn-expand-${pedido.codigo}`}
                          onClick={() => toggleExpand(pedido.codigo)}
                          className={`text-stone-400 hover:text-stone-900 hover:bg-stone-100 p-1 rounded-none border border-stone-200 transition-all ${isExpanded ? 'bg-stone-250 text-[#1A1A1A]' : ''}`}
                          title={isExpanded ? "Ocultar detalles" : "Ver distribución de tallas"}
                        >
                          <ChevronRight 
                            size={12} 
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-stone-900' : ''}`} 
                          />
                        </button>
                      </td>
                      <td className="px-1.5 py-2 print:hidden">
                        <div className="flex justify-center items-center gap-1">
                          <button 
                            id={`btn-edit-${pedido.codigo}`}
                            onClick={() => onEdit(pedido)} 
                            className="text-stone-600 hover:text-stone-900 hover:bg-stone-150 p-1 rounded-none border border-stone-200 transition"
                            title="Editar pedido"
                          >
                            <Pencil size={11} />
                          </button>
                          <button 
                            id={`btn-delete-${pedido.codigo}`}
                            onClick={() => onDelete(pedido.codigo)} 
                            className="text-stone-400 hover:text-red-705 hover:bg-stone-100 border border-stone-200 p-1 rounded-none transition"
                            title="Eliminar pedido"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[10px] text-stone-800 font-bold print:px-2">
                        {pedido.codigo}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-stone-650 print:px-1">
                        <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded-none text-[9px] font-mono border border-stone-200 font-bold print:border-none print:bg-transparent print:p-0">
                          {pedido.semana}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 print:px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 tracking-tight text-[11px]">{pedido.producto}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 text-right font-bold text-[#1A1A1A] font-serif text-sm italic print:px-2 print:text-xs">
                        {pedido.docenas}
                      </td>
                      <td className="px-2.5 py-2 text-stone-550 text-[10px] font-semibold uppercase tracking-tight print:px-2 print:text-[10px]">
                        {pedido.vendedor === "—" || !pedido.vendedor ? (
                          <span className="text-stone-300 font-normal">—</span>
                        ) : (
                          pedido.vendedor
                        )}
                      </td>
                      <td className="px-2.5 py-2 print:px-2">
                        {(() => {
                          const pct = getProgressPercentage(pedido);
                          let barColor = 'bg-stone-300';
                          let textColor = 'text-stone-500';
                          let bgBadge = 'bg-stone-50 border-stone-200';
                          if (pct > 0 && pct <= 40) {
                            barColor = 'bg-amber-500';
                            textColor = 'text-amber-700';
                            bgBadge = 'bg-amber-50 border-amber-200';
                          } else if (pct > 40 && pct <= 80) {
                            barColor = 'bg-indigo-500';
                            textColor = 'text-indigo-700';
                            bgBadge = 'bg-indigo-50 border-indigo-200';
                          } else if (pct === 100) {
                            barColor = 'bg-emerald-500';
                            textColor = 'text-emerald-700';
                            bgBadge = 'bg-emerald-50 border-emerald-200';
                          }

                          return (
                            <div className="flex flex-col gap-1 w-full max-w-[130px] print:max-w-none">
                              <div className={`inline-flex items-center justify-between px-2 py-0.5 border text-[10px] font-bold font-mono tracking-wider ${bgBadge} print:border-none print:p-0 print:bg-transparent`}>
                                <span className={textColor}>{pct}%</span>
                                <span className="text-[8px] text-stone-400 print:hidden">
                                  {pct === 100 ? 'COMPLETO' : pct === 0 ? 'PENDIENTE' : 'EN CURSO'}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-100 border border-stone-200/50 rounded-none overflow-hidden print:hidden">
                                <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      {/* Render the 5 Process Columns cells */}
                      {renderProcessCell(pedido, 'tejidoFecha')}
                      {renderProcessCell(pedido, 'plantaFecha')}
                      {renderProcessCell(pedido, 'habilitadoFecha')}
                      {renderProcessCell(pedido, 'aparadoFecha')}
                      {renderProcessCell(pedido, 'montajeFecha')}
                    </tr>

                  {/* Expansion Row - Size breakdown table */}
                  {isExpanded && (
                    <tr id={`detail-row-${pedido.codigo}`} className="bg-[#fafaf7]">
                      <td colSpan={13} className="px-6 py-4 border-t border-b border-stone-200">
                        <div className="bg-white rounded-none border border-stone-200 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 pb-3 border-b border-stone-150">
                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-stone-500 flex items-center gap-1.5">
                                <Sparkles size={11} className="text-stone-400" />
                                {isProductionState(pedido.estado) 
                                  ? "Detalle de Lotes y Distribución de Tallas (Cantidades por Docenas)" 
                                  : "Detalle de Variantes y Distribución de Tallas (Cantidades por Pares)"}
                              </h4>
                              <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                                Registrado el {new Date(pedido.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                                Total docenas: <strong className="text-stone-800 font-bold">{pedido.docenas} doc.</strong> {!isProductionState(pedido.estado) && `(${Math.round(pedido.docenas * 12)} pares)`}
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto rounded-none border border-stone-200">
                            <table className="w-full text-xs text-left min-w-[600px]">
                              <thead className="bg-[#fcfcf9] text-stone-400 text-[9px] uppercase font-bold tracking-[0.2em] border-b border-stone-200">
                                <tr>
                                  <th className="px-3 py-2.5 w-1/4">
                                    {isProductionState(pedido.estado) ? 'Modelo / Detalle' : 'Color variante/modelo'}
                                  </th>
                                  {TALLAS_ESTANDAR.map(talla => (
                                    <th key={talla} className="px-2 py-2.5 text-center font-mono w-12">
                                      {talla} {isProductionState(pedido.estado) ? '(doc)' : '(p)'}
                                    </th>
                                  ))}
                                  <th className="px-3 py-2.5 text-right w-36">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-150">
                                {pedido.items && pedido.items.length > 0 ? (
                                  pedido.items.map((variant) => {
                                    const isOrderProd = isProductionState(pedido.estado);
                                    // Calculate total for this variant/lote
                                    const variantSumVal = Object.values(variant.tallas || {}).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
                                    const variantTotalDocenas = isOrderProd ? Math.round(variantSumVal * 100) / 100 : Math.round((variantSumVal / 12) * 100) / 100;
                                    const variantTotalPares = isOrderProd ? Math.round(variantTotalDocenas * 12) : Math.round(variantSumVal);
                                    
                                    return (
                                      <tr key={variant.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-3 py-2 font-bold text-stone-800 flex items-center gap-2">
                                          {!isOrderProd ? (
                                            <>
                                              <span className="w-2.5 h-2.5 rounded-none border border-stone-300 shadow-2xs inline-block" style={{ backgroundColor: getHexForColor(variant.color) }}></span>
                                              {variant.color}
                                            </>
                                          ) : (
                                            <span className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">Lote Activo ({pedido.producto})</span>
                                          )}
                                        </td>
                                        {TALLAS_ESTANDAR.map(talla => {
                                          const value = variant.tallas[talla];
                                          return (
                                            <td key={talla} className={`px-2 py-2 text-center font-mono ${value ? 'font-bold text-stone-950 bg-stone-100' : 'text-stone-350'}`}>
                                              {value || '—'}
                                            </td>
                                          );
                                        })}
                                        <td className="px-3 py-2 text-right font-medium text-xs text-stone-900 bg-stone-50 font-mono">
                                          {isOrderProd 
                                            ? `${variantTotalDocenas} doc` 
                                            : `${variantTotalPares} p (${variantTotalDocenas} doc)`
                                          }
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
            })
          )}
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
