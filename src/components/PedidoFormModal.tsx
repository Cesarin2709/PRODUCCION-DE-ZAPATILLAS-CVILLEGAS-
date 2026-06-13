import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calendar, User, ShoppingBag, Layers, AlertCircle } from 'lucide-react';
import { Pedido, PedidoVariante, EstadoPedido, TallasDistribucion } from '../types';

interface PedidoFormModalProps {
  pedidoAEditar: Pedido | null;
  proximoCodigo: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedido: Pedido) => void;
}

const TALLAS_ESTANDAR = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

const VENDEDORES_SUGERIDOS = [
  'Gomez, Ana',
  'Ruiz, Carlos',
  'Fernandez, Luisa',
  'Vargas, Felipe',
  'Perez, Jorge',
  '—'
];

export const PedidoFormModal: React.FC<PedidoFormModalProps> = ({
  pedidoAEditar,
  proximoCodigo,
  isOpen,
  onClose,
  onSave
}) => {
  const [codigo, setCodigo] = useState('');
  const [semana, setSemana] = useState<number>(18);
  const [vendedor, setVendedor] = useState<string>('—');
  const [producto, setProducto] = useState('');
  const [estado, setEstado] = useState<EstadoPedido>('PENDIENTE');
  const [items, setItems] = useState<PedidoVariante[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opening/editing changed
  useEffect(() => {
    if (pedidoAEditar) {
      setCodigo(pedidoAEditar.codigo);
      setSemana(pedidoAEditar.semana);
      setVendedor(pedidoAEditar.vendedor || '—');
      setProducto(pedidoAEditar.producto);
      setEstado(pedidoAEditar.estado);
      // Make a deep clone of items to prevent mutating state directly
      setItems(pedidoAEditar.items ? JSON.parse(JSON.stringify(pedidoAEditar.items)) : []);
    } else {
      setCodigo(proximoCodigo);
      setSemana(18);
      setVendedor('—');
      setProducto('');
      setEstado('PENDIENTE');
      // Create one default variant so the form isn't empty
      setItems([
        {
          id: 'v-' + Date.now(),
          color: 'Negro',
          tallas: {}
        }
      ]);
    }
    setError(null);
  }, [pedidoAEditar, proximoCodigo, isOpen]);

  if (!isOpen) return null;

  // Add a new color variant
  const agregarVariante = () => {
    const coloresDisponibles = ['Negro', 'Blanco', 'Rojo', 'Miel', 'Beige', 'Azul', 'Marrón'];
    const colorSugerido = coloresDisponibles[items.length % coloresDisponibles.length] || 'Nuevo Color';
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
    setItems(
      items.map(item => (item.id === id ? { ...item, color: nuevoColor } : item))
    );
  };

  // Handles size input changes
  const cambiarTallaValor = (variantId: string, talla: string, valorStr: string) => {
    const valor = valorStr === '' ? 0 : parseInt(valorStr, 10);
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

  // Calculate totals
  const totalDocenas = items.reduce((sum, item) => {
    const variantSum = Object.values(item.tallas).reduce<number>((s, v) => s + (Number(v) || 0), 0);
    return sum + variantSum;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!producto.trim()) {
      setError('El modelo/nombre del producto es obligatorio.');
      return;
    }

    if (totalDocenas === 0) {
      setError('Debes ingresar al menos una docena en alguna talla para registrar el pedido.');
      return;
    }

    // Prepare seller (save null if "—")
    const vendedorFinal = vendedor === '—' ? null : vendedor;

    const fechaActual = pedidoAEditar ? pedidoAEditar.fecha : new Date().toISOString().split('T')[0]!;

    const payload: Pedido = {
      id: pedidoAEditar ? pedidoAEditar.id : 'pd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      codigo,
      fecha: fechaActual,
      semana: Number(semana),
      vendedor: vendedorFinal,
      producto: producto.trim(),
      variantes: items.length,
      docenas: totalDocenas,
      estado,
      items
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
            {/* Codigo */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">N° Pedido (Código)</label>
              <input
                type="text"
                value={codigo}
                disabled
                className="w-full bg-stone-150 border border-stone-300 rounded-none px-3 py-2 text-xs font-mono font-bold text-stone-500 focus:outline-none"
              />
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

            {/* Vendedor */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Vendedor</label>
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

            {/* Estado */}
            <div>
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Estado del Lote</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoPedido)}
                className="w-full bg-white border border-stone-300 rounded-none px-3 py-2 text-xs font-bold text-stone-850 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none appearance-none cursor-pointer"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="PRODUCCION">PRODUCCIÓN</option>
                <option value="SALIO">SALIÓ</option>
              </select>
            </div>

            {/* Modelo */}
            <div className="md:col-span-2">
              <label className="block text-stone-600 text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase">Modelo de Calzado / Línea</label>
              <div className="relative">
                <ShoppingBag className="absolute left-3 top-2.5 text-stone-400" size={14} />
                <input
                  type="text"
                  placeholder="Ej. NEW BR6 01, FORCE FAST, PRECISION..."
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold text-stone-950 focus:ring-1 focus:ring-stone-400 focus:border-stone-900 transition outline-none uppercase"
                  required
                />
              </div>
            </div>
          </div>

          {/* Variants and Sizes breakdown section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest">
                  Variantes y Escala de Tallaje (Docenas)
                </h4>
                <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                  Ingrese las docenas a producir por cada combinación de color y escala de tallas.
                </p>
              </div>
              <button
                type="button"
                onClick={agregarVariante}
                className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-none border border-stone-300 font-bold transition duration-150 cursor-pointer"
              >
                <Plus size={13} />
                Añadir Color
              </button>
            </div>

            {/* Color cards / row builders */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const variantTotal = Object.values(item.tallas).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);

                return (
                  <div key={item.id} className="bg-[#fcfcf9] border border-stone-200 rounded-none p-4 hover:border-black transition space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 w-5 h-5 rounded-none border border-stone-250 flex items-center justify-center font-mono">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Color / Detalle"
                          value={item.color}
                          onChange={(e) => cambiarColor(item.id, e.target.value)}
                          className="font-bold text-stone-900 text-xs bg-transparent border-b border-stone-200 hover:border-stone-400 focus:border-black py-0.5 px-1 outline-none w-36 uppercase tracking-wider"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[#1A1A1A] font-serif italic bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-none">
                          Total: {variantTotal} doc.
                        </span>
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

                    {/* Sizing inputs grid */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {TALLAS_ESTANDAR.map(talla => {
                        const val = item.tallas[talla] || '';
                        return (
                          <div key={talla} className="text-center">
                            <label className="block text-[9px] font-bold text-stone-500 font-mono mb-1 bg-stone-100 border border-stone-200 rounded-none py-0.5">
                              T.{talla}
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder="—"
                              value={val}
                              onChange={(e) => cambiarTallaValor(item.id, talla, e.target.value)}
                              className="w-full text-center border border-stone-300 rounded-none py-1 px-0.5 text-xs font-mono font-bold text-stone-900 hover:border-stone-900 focus:border-[#1A1A1A] outline-none bg-white"
                            />
                          </div>
                        );
                      })}
                    </div>
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
              <span className="text-[10px] uppercase font-bold tracking-wide text-stone-400 font-mono">
                ({totalDocenas * 12} pares registrados)
              </span>
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
