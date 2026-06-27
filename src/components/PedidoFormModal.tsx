import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calendar, User, ShoppingBag, Layers, AlertCircle } from 'lucide-react';
import { Pedido, PedidoVariante, EstadoPedido, TallasDistribucion } from '../types';
import { CATALOGO_REAL, getClassification } from './CatalogoModelos';

interface PedidoFormModalProps {
  pedidoAEditar: Pedido | null;
  proximoCodigo: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedido: Pedido) => void;
  fechaPreseleccionada?: string | null;
}

const TALLAS_ESTANDAR = ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

const RANGOS_TALLAS: Record<string, string[]> = {
  '29/34': ['29', '30', '31', '32', '33', '34'],
  '35/38': ['35', '36', '37', '38'],
  '39/42': ['39', '40', '41', '42'],
  '37/40': ['37', '38', '39', '40']
};

const VENDEDORES_SUGERIDOS = [
  'VALERIA',
  'ESTEFANY',
  'ANGHY',
  'COTCAS',
  'JUAN VALER',
  'STOCK TIENDA'
];

const getWeekNumberFromDateString = (dateStr: string): number => {
  if (!dateStr) return 18;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 18;
  const y = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10) - 1;
  const d = parseInt(parts[2]!, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return 18;

  const date = new Date(Date.UTC(y, m, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

export const PedidoFormModal: React.FC<PedidoFormModalProps> = ({
  pedidoAEditar,
  proximoCodigo,
  isOpen,
  onClose,
  onSave,
  fechaPreseleccionada
}) => {
  const [estado, setEstado] = useState<EstadoPedido>(() => {
    return pedidoAEditar ? pedidoAEditar.estado : 'PEDIDO';
  });
  const [codigo, setCodigo] = useState(() => {
    return pedidoAEditar ? pedidoAEditar.codigo : proximoCodigo;
  });
  const [fecha, setFecha] = useState(() => {
    if (pedidoAEditar) return pedidoAEditar.fecha;
    return fechaPreseleccionada || new Date().toISOString().split('T')[0]!;
  });
  const [semana, setSemana] = useState<number>(() => {
    if (pedidoAEditar) return pedidoAEditar.semana;
    const initialFecha = fechaPreseleccionada || new Date().toISOString().split('T')[0]!;
    return getWeekNumberFromDateString(initialFecha);
  });
  const [vendedor, setVendedor] = useState<string>(() => {
    return pedidoAEditar ? (pedidoAEditar.vendedor || '—') : '—';
  });
  const [producto, setProducto] = useState(() => {
    return pedidoAEditar ? pedidoAEditar.producto : '';
  });
  const [items, setItems] = useState<PedidoVariante[]>(() => {
    if (pedidoAEditar && pedidoAEditar.items) {
      return JSON.parse(JSON.stringify(pedidoAEditar.items));
    }
    return [
      {
        id: 'v-' + Date.now(),
        color: '',
        tallas: {}
      }
    ];
  });
  const [variantRanges, setVariantRanges] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Auto-generation logic for the code of the lot based on Chosen State (PEDIDO -> PD, PRODUCCION -> OP, VENTA -> VT)
  useEffect(() => {
    if (!pedidoAEditar) {
      const rawSerial = proximoCodigo.replace(/^PD/, '');
      if (estado === 'PEDIDO') {
        setCodigo(`PD${rawSerial}`);
      } else if (estado === 'PRODUCCION') {
        setCodigo(`OP${rawSerial}`);
      } else if (estado === 'VENTA') {
        setCodigo(`VT${rawSerial}`);
      }
    }
  }, [estado, proximoCodigo, pedidoAEditar]);

  if (!isOpen) return null;

  // List of unique verified colors for the selected catalog model
  const modelColors = React.useMemo(() => {
    const modelKey = producto.trim().toUpperCase();
    const entries = CATALOGO_REAL[modelKey];
    if (!entries) return [];
    
    const colorsSet = new Set<string>();
    entries.forEach(e => {
      if (e.color) {
        colorsSet.add(e.color.trim().toUpperCase());
      }
    });
    return Array.from(colorsSet).sort();
  }, [producto]);

  // Add a new color variant
  const agregarVariante = () => {
    let colorSugerido = '';
    if (modelColors.length > 0) {
      const currentColors = items.map(it => (it.color || '').trim().toUpperCase());
      const unusedColor = modelColors.find(c => !currentColors.includes(c));
      colorSugerido = unusedColor || '';
    } else {
      const coloresDisponibles = ['Negro', 'Blanco', 'Rojo', 'Miel', 'Beige', 'Azul', 'Marrón'];
      colorSugerido = coloresDisponibles[items.length % coloresDisponibles.length] || 'Nuevo Color';
    }
    setItems([
      ...items,
      {
        id: 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        color: colorSugerido,
        tallas: {}
      }
    ]);
  };

  // Remove a color variant
  const eliminarVariante = (id: string) => {
    if (items.length <= 1) {
      setError('El pedido debe tener al menos una variante de color.');
      return;
    }
    setItems(items.filter(item => item.id !== id));
    setError(null);
  };

  // Handle color name change
  const cambiarColor = (id: string, nuevoColor: string) => {
    const modelKey = (producto || '').trim().toUpperCase();
    const catalogEntries = CATALOGO_REAL[modelKey] || [];
    const matchedEntry = catalogEntries.find(
      entry => (entry.color || '').trim().toUpperCase() === (nuevoColor || '').trim().toUpperCase()
    );

    setItems(
      items.map(item => {
        if (item.id === id) {
          if (matchedEntry) {
            const cls = getClassification(matchedEntry.codigo);
            return {
              ...item,
              color: nuevoColor,
              codigo: matchedEntry.codigo,
              linea: (matchedEntry as any).linea || 'Deportivas/Caucho',
              tipo: (matchedEntry as any).tipo || cls.label,
              serie: (matchedEntry as any).talla || cls.range,
              suela: (matchedEntry as any).suela || 'ESTÁNDAR'
            };
          }
          return { ...item, color: nuevoColor };
        }
        return item;
      })
    );
  };

  // Handles size input changes
  const cambiarTallaValor = (variantId: string, talla: string, valorStr: string) => {
    const valor = valorStr === '' ? 0 : parseFloat(valorStr);
    if (isNaN(valor) || valor < 0) return;

    setItems(
      items.map(item => {
        if (item.id === variantId) {
          const nuevasTallas = { ...item.tallas };
          if (valor === 0) {
            delete nuevasTallas[talla];
          } else {
            nuevasTallas[talla] = valor;
          }
          return { ...item, tallas: nuevasTallas };
        }
        return item;
      })
    );
  };

  const handleQuickDistribute = (variantId: string, docenasValue: number) => {
    const selectedRange = variantRanges[variantId] || 'TODAS';
    const activeSizes = selectedRange === 'TODAS'
      ? TALLAS_ESTANDAR
      : RANGOS_TALLAS[selectedRange] || TALLAS_ESTANDAR;

    const sizeCount = activeSizes.length;
    if (sizeCount === 0) return;

    let valueToAssign = 0;
    if (isProd) {
      valueToAssign = Math.round((docenasValue / sizeCount) * 100) / 100;
    } else {
      valueToAssign = Math.round(((docenasValue * 12) / sizeCount) * 100) / 100;
    }

    setItems(prev => prev.map(item => {
      if (item.id === variantId) {
        const nuevasTallas: Record<string, number> = {};
        activeSizes.forEach(talla => {
          nuevasTallas[talla] = valueToAssign;
        });
        return { ...item, tallas: nuevasTallas };
      }
      return item;
    }));
  };

  const isProd = estado === 'PRODUCCION' || 
                 estado === 'TEJIDO' || 
                 estado === 'TEJIDO Y SUELA' || 
                 estado === 'HABILITADO' || 
                 estado === 'APARADO' || 
                 estado === 'MONTAJE' || 
                 estado === 'EN ALMACEN' || 
                 estado === 'EN TIENDA' || 
                 estado === 'VENDIDO';

  // Calculate totals based on whether this order is in production
  const rawSum = items.reduce((sum, item) => {
    const variantSum = Object.values(item.tallas).reduce<number>((s, v) => s + (Number(v) || 0), 0);
    return sum + variantSum;
  }, 0);

  const totalDocenas = Math.round((isProd ? rawSum : rawSum / 12) * 100) / 100;
  const totalPares = Math.round(isProd ? totalDocenas * 12 : rawSum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!producto.trim()) {
      setError('El modelo/nombre del producto es obligatorio.');
      return;
    }

    if (totalDocenas === 0) {
      setError('Debes ingresar al menos una cantidad en alguna talla para registrar el pedido.');
      return;
    }

    // Prepare seller (save null if "—")
    const vendedorFinal = vendedor === '—' ? null : vendedor;

    // Force color of items to "" for all production orders
    const processedItems = items.map(item => ({
      ...item,
      color: isProd ? '' : item.color
    }));

    const payload: Pedido = {
      id: pedidoAEditar ? pedidoAEditar.id : 'pd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      codigo,
      fecha: fecha,
      semana: Number(semana),
      vendedor: vendedorFinal,
      producto: producto.trim(),
      variantes: isProd ? 1 : processedItems.length,
      docenas: totalDocenas,
      estado,
      items: processedItems
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/35 backdrop-blur-[1px] flex items-center justify-end z-50 animate-fade-in">
      <div className="bg-white w-full max-w-3xl h-full flex flex-col shadow-2xl relative animate-slide-left overflow-hidden font-sans border-l border-stone-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold leading-none uppercase italic font-serif text-[#1A1A1A] flex items-center gap-2">
              <Layers className="text-stone-700" size={18} />
              {pedidoAEditar ? `Editar Pedido ${codigo}` : `Registrar Nuevo Pedido`}
            </h3>
            <p className="text-stone-400 text-[10px] uppercase tracking-widest font-semibold mt-1">
              Especificaciones de fabricación / Escala por tallaje de Lote
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-none border border-stone-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-none text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold uppercase tracking-wider block mb-1">Error de validación</strong> {error}
              </div>
            </div>
          )}

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-none border border-stone-200">
            {/* Fecha de Pedido */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Fecha de Pedido</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setFecha(selectedDate);
                    setSemana(getWeekNumberFromDateString(selectedDate));
                  }}
                  className="w-full bg-white border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold text-stone-850 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none"
                  required
                />
              </div>
            </div>

            {/* Semana */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Semana de Producción</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <input
                  type="number"
                  min={1}
                  max={53}
                  value={semana}
                  onChange={(e) => setSemana(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold text-stone-850 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none"
                  required
                />
              </div>
            </div>

            {/* Estado del lote */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Estado del Lote</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoPedido)}
                  className="w-full bg-white border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold text-stone-850 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none appearance-none cursor-pointer uppercase"
                >
                  <option value="PEDIDO">PEDIDO</option>
                  <option value="PRODUCCION">PRODUCCIÓN (GENERAL)</option>
                  <optgroup label="ETAPAS EN PRODUCCIÓN">
                    <option value="TEJIDO">TEJIDO</option>
                    <option value="TEJIDO Y SUELA">TEJIDO Y SUELA</option>
                    <option value="HABILITADO">HABILITADO</option>
                    <option value="APARADO">APARADO</option>
                    <option value="MONTAJE">MONTAJE</option>
                    <option value="EN ALMACEN">EN ALMACEN</option>
                    <option value="EN TIENDA">EN TIENDA</option>
                    <option value="VENDIDO">VENDIDO</option>
                  </optgroup>
                  <option value="VENTA">VENTA DIRECTA</option>
                </select>
              </div>
            </div>

            {/* Código generado dinámicamente según el estado del lote */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">
                {estado === 'PEDIDO' ? 'Código de Pedido' : estado === 'PRODUCCION' ? 'N° Orden de Producción' : 'Número de Venta'}
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="w-full bg-stone-100 border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-black text-stone-900 tracking-wider transition outline-none font-mono"
                  placeholder="AUTO-GENERADO"
                  required
                />
              </div>
            </div>

            {/* Vendedor / Origen / Cliente o Destinatario */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Vendedor / Cliente / Destino</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <select
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold text-stone-850 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none appearance-none cursor-pointer uppercase"
                >
                  {VENDEDORES_SUGERIDOS.map(vendor => (
                    <option key={vendor} value={vendor}>{vendor.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modelo */}
            <div className="md:col-span-2">
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Modelo de Calzado / Línea (Catálogo)</label>
              <div className="relative">
                <ShoppingBag className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <select
                  value={producto}
                  onChange={(e) => {
                    const nuevoProducto = e.target.value;
                    setProducto(nuevoProducto);
                    
                    const key = nuevoProducto.trim().toUpperCase();
                    const entries = CATALOGO_REAL[key];
                    if (entries && entries.length > 0) {
                      const colorsSet = new Set<string>();
                      entries.forEach(entry => {
                        if (entry.color) {
                          colorsSet.add(entry.color.trim().toUpperCase());
                        }
                      });
                      const validColors = Array.from(colorsSet).sort();
                      
                      // Keep current variant colors only if they are valid for the new model, otherwise reset to empty so the user selects it
                      setItems(prev => prev.map(item => {
                        const itemColorUpper = (item.color || '').trim().toUpperCase();
                        const isCurrentColorValid = itemColorUpper !== '' && validColors.includes(itemColorUpper);
                        return {
                          ...item,
                          color: isCurrentColorValid ? item.color : ''
                        };
                      }));
                    } else {
                      // If no entries, reset variant colors to empty so they are entered manually
                      setItems(prev => prev.map(item => ({ ...item, color: '' })));
                    }
                  }}
                  className="w-full bg-white border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold text-stone-950 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none uppercase appearance-none cursor-pointer"
                  required
                >
                  <option value="">-- SELECCIONAR MODELO VERIFICADO --</option>
                  {producto && !Object.keys(CATALOGO_REAL).includes(producto.trim().toUpperCase()) && (
                    <option value={producto.toUpperCase()}>{producto.toUpperCase()} (REGISTRO ANTERIOR)</option>
                  )}
                  {Object.keys(CATALOGO_REAL).sort().map(modelKey => (
                    <option key={modelKey} value={modelKey}>{modelKey}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Variants and Sizes breakdown section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-stone-50 border border-stone-200 p-3.5">
              <div>
                <h4 className="text-[11px] font-black text-stone-800 uppercase tracking-widest flex items-center gap-2">
                  <span>🎨 Variantes y Escala de Tallaje</span>
                </h4>
                <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                  {isProd ? "Ingrese la cantidad de docenas por talla para esta orden de producción." : "Ingrese la cantidad de pares por talla. Se convertirán automáticamente a docenas."}
                </p>
              </div>

              {!isProd && (
                <button
                  type="button"
                  onClick={agregarVariante}
                  className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-none font-bold transition duration-150 cursor-pointer self-start sm:self-center"
                >
                  <Plus size={13} />
                  Añadir Color
                </button>
              )}
            </div>

            {/* Color cards / row builders */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const variantSumVal = Object.values(item.tallas).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
                const variantTotalDocenas = isProd ? Math.round(variantSumVal * 100) / 100 : Math.round((variantSumVal / 12) * 100) / 100;
                const variantTotalPares = isProd ? Math.round(variantTotalDocenas * 12) : Math.round(variantSumVal);

                return (
                  <div key={item.id} className="bg-[#fcfcf9] border border-stone-200 rounded-none p-4 hover:border-black transition space-y-3">
                    {!isProd && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-100 w-5 h-5 rounded-none border border-stone-250 flex items-center justify-center font-mono">
                            {index + 1}
                          </span>
                          {!producto ? (
                            <span className="text-stone-400 text-[11px] italic font-semibold tracking-wide">
                              [Por favor seleccione un modelo primero]
                            </span>
                          ) : modelColors.length > 0 ? (
                            <select
                                value={(item.color || '').toUpperCase()}
                                onChange={(e) => cambiarColor(item.id, e.target.value)}
                                className="font-bold text-stone-800 text-xs bg-white border border-stone-300 py-1.5 px-2 outline-none w-64 uppercase tracking-wider rounded-none cursor-pointer focus:border-stone-900 focus:ring-1 focus:ring-stone-400"
                                required
                            >
                              <option value="">-- SELECCIONAR COLOR --</option>
                              {item.color && !modelColors.includes(item.color.trim().toUpperCase()) && (
                                <option value={item.color.trim().toUpperCase()}>
                                  {item.color.trim().toUpperCase()}
                                </option>
                              )}
                              {modelColors.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Color / Detalle"
                              value={item.color}
                              onChange={(e) => cambiarColor(item.id, e.target.value)}
                              className="font-bold text-stone-900 text-xs bg-transparent border-b border-stone-200 hover:border-stone-400 focus:border-black py-0.5 px-1 outline-none w-36 uppercase tracking-wider"
                              required
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => eliminarVariante(item.id)}
                            className="text-stone-400 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 p-1.5 rounded-none transition"
                            title="Eliminar esta variante"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {isProd && (
                      <div className="pb-1">
                        <span className="text-stone-500 text-[10px] uppercase font-black tracking-widest font-mono">📦 Lote de Producción (en Docenas)</span>
                      </div>
                    )}

                    {/* Local Base de Tallas Filter for this variant card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100/50 p-2 border border-stone-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 text-[9px] font-bold uppercase tracking-wider">Base de Tallas:</span>
                        <select
                          value={variantRanges[item.id] || 'TODAS'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariantRanges(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="bg-white border border-stone-300 text-[9.5px] font-black px-2 py-0.5 outline-none text-[#1A1A1A] cursor-pointer rounded-none uppercase tracking-wide"
                        >
                          <option value="TODAS">TODAS LAS TALLAS</option>
                          <option value="29/34">GRUPO 29/34</option>
                          <option value="35/38">GRUPO 35/38</option>
                          <option value="39/42">GRUPO 39/42</option>
                          <option value="37/40">GRUPO 37/40</option>
                        </select>
                      </div>
                      <span className="text-[10px] font-bold text-[#1A1A1A] font-serif italic">
                        {isProd 
                          ? `Subtotal Lote: ${variantTotalDocenas} docenas`
                          : `Color Subtotal: ${variantTotalPares} pares (${variantTotalDocenas} doc.)`
                        }
                      </span>
                    </div>

                    {/* Quick Dozen Distributor bar */}
                    {(() => {
                      const selectedRange = variantRanges[item.id] || 'TODAS';
                      const activeSizesCount = selectedRange === 'TODAS'
                        ? TALLAS_ESTANDAR.length
                        : RANGOS_TALLAS[selectedRange]?.length || TALLAS_ESTANDAR.length;
                      return (
                        <div className="bg-amber-50/40 border-l-2 border-amber-500 p-2.5 border-b border-r border-t border-stone-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-none">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#F15A24] font-black text-[9px] uppercase tracking-wider">⚡ Distribuidor de Docenas:</span>
                            <span className="text-stone-500 text-[8.5px] font-extrabold font-mono uppercase bg-stone-100 px-1 py-0.5 border border-stone-250">
                              {selectedRange === 'TODAS' ? '14 Tallas Activas' : `Grupo ${selectedRange} (${activeSizesCount} tallas)`}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickDistribute(item.id, 1)}
                              className="bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-500 text-stone-800 text-[8.5px] font-extrabold px-2 py-1 uppercase tracking-wider transition cursor-pointer shadow-3xs"
                              title="Distribuye 1 docena (12 pares) equitativamente en este grupo de tallas"
                            >
                              1 Docena {selectedRange !== 'TODAS' && `(${selectedRange === '29/34' ? '2 pares c/u' : '3 pares c/u'})`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDistribute(item.id, 2)}
                              className="bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-500 text-stone-800 text-[8.5px] font-extrabold px-2 py-1 uppercase tracking-wider transition cursor-pointer shadow-3xs"
                              title="Distribuye 2 docenas (24 pares) equitativamente en este grupo de tallas"
                            >
                              2 Docenas {selectedRange !== 'TODAS' && `(${selectedRange === '29/34' ? '4 pares c/u' : '6 pares c/u'})`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDistribute(item.id, 3)}
                              className="bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-500 text-stone-800 text-[8.5px] font-extrabold px-2 py-1 uppercase tracking-wider transition cursor-pointer shadow-3xs"
                              title="Distribuye 3 docenas (36 pares) equitativamente en este grupo de tallas"
                            >
                              3 Docenas {selectedRange !== 'TODAS' && `(${selectedRange === '29/34' ? '6 pares c/u' : '9 pares c/u'})`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDistribute(item.id, 5)}
                              className="bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-500 text-stone-800 text-[8.5px] font-extrabold px-2 py-1 uppercase tracking-wider transition cursor-pointer shadow-3xs"
                            >
                              5 Docenas
                            </button>

                            <div className="h-4 w-[1px] bg-stone-350 mx-1"></div>

                            {/* Custom input box */}
                            <div className="flex items-center border border-stone-300 bg-white shadow-3xs hover:border-stone-400 focus-within:border-[#1A1A1A] transition">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                placeholder="Ej: 1.5"
                                id={`custom-doc-input-${item.id}`}
                                className="w-12 text-center text-[10px] font-black outline-none py-0.5 font-mono"
                              />
                              <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400 pr-1.5 select-none font-mono">Doc.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const inputEl = document.getElementById(`custom-doc-input-${item.id}`) as HTMLInputElement;
                                  if (inputEl) {
                                    const val = parseFloat(inputEl.value);
                                    if (!isNaN(val) && val > 0) {
                                      handleQuickDistribute(item.id, val);
                                    }
                                  }
                                }}
                                className="bg-stone-900 hover:bg-[#F15A24] hover:text-white text-white text-[8px] font-black px-2.5 py-1 uppercase tracking-wider transition cursor-pointer"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sizing inputs grid */}
                    {(() => {
                      const selectedRange = variantRanges[item.id] || 'TODAS';
                      const tallasFiltradas = selectedRange === 'TODAS'
                        ? TALLAS_ESTANDAR
                        : RANGOS_TALLAS[selectedRange] || TALLAS_ESTANDAR;
                      return (
                        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-12 gap-1.5">
                          {tallasFiltradas.map(talla => {
                            const val = item.tallas[talla] || '';
                            return (
                              <div key={talla} className="text-center">
                                <label className="block text-[9px] font-bold text-stone-500 font-mono mb-1 bg-stone-100 border border-stone-200 rounded-none py-0.5">
                                  T.{talla}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  step={isProd ? "0.01" : "1"}
                                  placeholder="—"
                                  value={val}
                                  onChange={(e) => cambiarTallaValor(item.id, talla, e.target.value)}
                                  className="w-full text-center border border-stone-300 rounded-none py-1 px-0.5 text-xs font-mono font-bold text-stone-900 hover:border-stone-900 focus:border-[#1A1A1A] outline-none bg-white"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer Area with Grand Totals */}
        <div className="px-6 py-4.5 border-t border-stone-200 bg-[#fbfcfa] flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-0 z-20">
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">Volumen Total Consolidado</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong className="text-2xl font-bold font-serif italic text-stone-900">
                {totalDocenas} docenas
              </strong>
              {!isProd && (
                <span className="text-[10px] uppercase font-bold tracking-wide text-stone-400 font-mono">
                  ({totalPares} pares registrados)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-none font-bold transition duration-150 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#1A1A1A] hover:bg-stone-800 text-white text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-none font-bold border border-black shadow-none transition duration-150 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Save size={14} />
              {pedidoAEditar ? 'Guardar Cambios' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
