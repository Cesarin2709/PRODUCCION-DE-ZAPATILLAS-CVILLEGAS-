import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PedidosTable } from './components/PedidosTable';
import { PedidoFormModal } from './components/PedidoFormModal';
import { ProductionAnalytics } from './components/ProductionAnalytics';
import { VendedoresStatsView } from './components/VendedoresStatsView';
import { MarketingDashboard } from './components/MarketingDashboard';
import { CatalogoModelos, CATALOGO_REAL } from './components/CatalogoModelos';
import { MiniCalendario } from './components/MiniCalendario';
import { AsistenciaDashboard } from './components/AsistenciaDashboard';
import { AdjuntarPedidoImagen } from './components/AdjuntarPedidoImagen';
import { QuickProductionEntry } from './components/QuickProductionEntry';
import { SeguimientoModelosNuevos } from './components/SeguimientoModelosNuevos';
import { SantosDestajo } from './components/SantosDestajo';
import { CarlosDestajo } from './components/CarlosDestajo';
import { JonasDestajo } from './components/JonasDestajo';
import { CristhianDestajo } from './components/CristhianDestajo';
import { HistorialPagos } from './components/HistorialPagos';
import { Pedido, EstadoPedido, PedidoVariante, TallasDistribucion } from './types';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { LogIn, LogOut, Cloud, CloudOff, ExternalLink } from 'lucide-react';
import { ALL_RECORDS, PEDIDOS_ORIG } from './data/brixtonData';
import { 
  Search, 
  Plus, 
  Menu, 
  Calendar, 
  User, 
  Layers, 
  CheckCircle2, 
  ChevronDown, 
  SlidersHorizontal,
  RefreshCw,
  ShoppingBag,
  Clock,
  Settings,
  X,
  Pencil,
  Printer,
  AlertTriangle
} from 'lucide-react';

// Dynamic generator to reconstruct full Pedidos from the historical CSV spreadsheets
const getInitialPedidos = (): Pedido[] => {
  const result: Pedido[] = [];
  
  // Group ALL_RECORDS entries by n°Pedido
  const groupedRecords: Record<number, any[]> = {};
  if (Array.isArray(ALL_RECORDS)) {
    ALL_RECORDS.forEach(r => {
      if (!r || !r['n°Pedido']) return;
      const num = Number(r['n°Pedido']);
      if (!groupedRecords[num]) {
        groupedRecords[num] = [];
      }
      groupedRecords[num].push(r);
    });
  }

  // Map each original order from the spreadsheet summary to a fully fleshed out Pedido object
  if (Array.isArray(PEDIDOS_ORIG)) {
    const seenPedIds = new Set<string>();
    PEDIDOS_ORIG.forEach((pOrig, idx) => {
      if (!pOrig || !pOrig.pedido) return;
      const pStr = String(pOrig.pedido);
      const pedNum = !isNaN(Number(pStr)) ? Number(pStr) : (parseFloat(pStr.replace('-', '.')) || 0);
      const basePedNum = Math.floor(pedNum);
      const relatedRecords = groupedRecords[pedNum] || groupedRecords[basePedNum] || [];
      
      const items: PedidoVariante[] = [];
      
      if (relatedRecords.length > 0) {
        relatedRecords.forEach((rec, recIdx) => {
          const tallas: TallasDistribucion = {};
          
          if (rec.Seriado) {
            const sizePairs = String(rec.Seriado).match(/(\d+)\/(\d+)/g);
            if (sizePairs) {
              sizePairs.forEach(sp => {
                const parts = sp.split('/');
                const talla = parts[0];
                const qty = parts[1];
                if (talla && qty) {
                  tallas[talla] = Number(qty) || 0;
                }
              });
            } else {
              const parts = String(rec.Seriado).split(/\s+/);
              parts.forEach(part => {
                if (part.includes('/')) {
                  const subParts = part.split('/');
                  const t = subParts[0];
                  const q = subParts[1];
                  if (t && q) tallas[t] = Number(q) || 0;
                }
              });
            }
          }
          
          // Fallback distribution if Seriados data is unparseable
          if (Object.keys(tallas).length === 0) {
            const standardTallas = rec.Tipo === 'JUNIOR' ? ['29','30','31','32','33','34'] : ['35','36','37','38','39','40','41','42'];
            const totalPares = Number(rec.Pares) || 12;
            const portion = Math.floor(totalPares / standardTallas.length);
            standardTallas.forEach((sz, sIdx) => {
              tallas[sz] = sIdx === 0 ? portion + (totalPares % standardTallas.length) : portion;
            });
          }

          items.push({
            id: `v-${pedNum}-${recIdx}-${rec_index_key(rec.Codigo || 'gen')}`,
            color: rec.Color || 'NEGRO',
            tallas: tallas,
            codigo: rec.Codigo,
            linea: rec.Linea,
            tipo: rec.Tipo,
            serie: rec.Serie,
            curva: rec.Curva,
            seriado: rec.Seriado,
            suela: rec.Suela,
            tejido: rec.Tejido,
            planta: rec.Planta,
            habilitado: rec.Habilitado,
            aparado: rec.Aparado,
            montaje: rec.Montaje,
            almacen: rec.Almacen
          });
        });
      } else {
        const standardTallas = ['39', '40', '41', '42'];
        const tallas: TallasDistribucion = {};
        const totalPares = Number(pOrig.pares) || 12;
        const portion = Math.floor(totalPares / standardTallas.length);
        standardTallas.forEach((sz, sIdx) => {
          tallas[sz] = sIdx === 0 ? portion + (totalPares % standardTallas.length) : portion;
        });
        items.push({
          id: `v-${pedNum}-default`,
          color: 'NEGRO',
          tallas: tallas
        });
      }

      let mappedEstado: EstadoPedido = 'PEDIDO';
      const rawStatus = (pOrig.status || '').toUpperCase();
      if (rawStatus.includes('TEJIDO')) {
        mappedEstado = 'TEJIDO';
      } else if (rawStatus.includes('PLANTA')) {
        mappedEstado = 'TEJIDO Y SUELA';
      } else if (rawStatus.includes('APARADO')) {
        mappedEstado = 'APARADO';
      } else if (rawStatus.includes('MONTAJE')) {
        mappedEstado = 'MONTAJE';
      } else if (rawStatus.includes('ALMACEN')) {
        mappedEstado = 'EN ALMACEN';
      } else if (rawStatus.includes('TIENDA')) {
        mappedEstado = 'EN TIENDA';
      } else if (rawStatus.includes('VENTA') || rawStatus.includes('VENDIDO')) {
        mappedEstado = 'VENDIDO';
      }

      let generatedId = `p-${pedNum}`;
      if (seenPedIds.has(generatedId)) {
        generatedId = `p-${pedNum}-${idx}`;
      }
      seenPedIds.add(generatedId);

      const firstTejido = items.find(item => item.tejido && item.tejido !== 'anulado')?.tejido;
      const firstPlanta = items.find(item => item.planta && item.planta !== 'anulado')?.planta;
      const firstHabilitado = items.find(item => item.habilitado && item.habilitado !== 'anulado')?.habilitado;
      const firstAparado = items.find(item => item.aparado && item.aparado !== 'anulado')?.aparado;
      const firstMontaje = items.find(item => item.montaje && item.montaje !== 'anulado')?.montaje;

      const formatInitialDate = (val: string | null | undefined): string | null => {
        if (!val) return null;
        const clean = val.trim();
        if (clean.toLowerCase() === 'anulado' || clean.toLowerCase() === 'pendiente') return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
        try {
          const date = new Date(clean);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (_) {}
        return null;
      };

      result.push({
        id: generatedId,
        codigo: pStr.includes('-') ? `PD${pStr.padStart(6, '0')}` : `PD${String(pedNum).padStart(6, '0')}`,
        fecha: pOrig.fecha_tejido || '2026-05-18',
        semana: Number(pOrig.semana) || 24,
        vendedor: pOrig.cliente || 'VALERIA',
        producto: pOrig.modelo || 'PRECISION 2026',
        variantes: items.length,
        docenas: Number(pOrig.docenas) || 12,
        estado: mappedEstado,
        items: items,
        tejidoFecha: formatInitialDate(pOrig.fecha_tejido) || formatInitialDate(firstTejido),
        plantaFecha: formatInitialDate(pOrig.fecha_planta) || formatInitialDate(firstPlanta),
        habilitadoFecha: formatInitialDate(firstHabilitado),
        aparadoFecha: formatInitialDate(firstAparado),
        montajeFecha: formatInitialDate(firstMontaje),
      });
    });
  }

  return result;
};

// Simple hashing index helper
function rec_index_key(val: string): string {
  return val.replace(/[^A-Za-z0-9_-]/g, '');
}

const DEFAULT_PEDIDOS: Pedido[] = getInitialPedidos();

const matchesTallasRange = (pedido: Pedido, rangeStr: string): boolean => {
  if (rangeStr === 'TODAS') return true;
  const [minStr, maxStr] = rangeStr.split('/');
  const min = parseInt(minStr, 10);
  const max = parseInt(maxStr, 10);
  if (isNaN(min) || isNaN(max)) return true;
  
  return pedido.items.some(item => {
    return Object.entries(item.tallas).some(([tallaKey, value]) => {
      const sizeNum = parseInt(tallaKey, 10);
      return !isNaN(sizeNum) && sizeNum >= min && sizeNum <= max && value > 0;
    });
  });
};

export default function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    // One-time clear of previous test data to start completely clean from scratch
    const cleared = localStorage.getItem('zapato_production_clean_v5');
    if (!cleared) {
      localStorage.removeItem('zapato_production_orders');
      localStorage.removeItem('zapato_store_retail_sales');
      localStorage.setItem('zapato_production_clean_v5', 'test_data_wiped_successfully');
      return DEFAULT_PEDIDOS;
    }
    const saved = localStorage.getItem('zapato_production_orders');
    if (saved) {
      try {
        const parsed: Pedido[] = JSON.parse(saved);
        const legacyMap: Record<string, string> = {
          'Gomez, Ana': 'JUAN VALER',
          'Ruiz, Carlos': 'COTCAS',
          'Fernandez, Luisa': 'STOCK TIENDA',
          'Vargas, Felipe': 'VALERIA',
          'Perez, Jorge': 'VALERIA',
          '1 PRODUCCION': 'STOCK TIENDA',
          '2 PEDIDO DE SEMANA': 'STOCK TIENDA',
          '3 STOCK DE TIENDA': 'STOCK TIENDA',
          '4 VENTA CLIENTE JIAN VALER': 'JUAN VALER',
          '5 VENTA CLIENTE COTCAS': 'COTCAS',
          'VENTAS': 'VALERIA',
          '1 PEDIDO DE LA SEMANA': 'VALERIA',
          '2 PRODUCCION': 'STOCK TIENDA',
          '—': 'VALERIA'
        };
        const seenIds = new Set<string>();
        return parsed.map((p, idx) => {
          let updatedEstado = p.estado;
          if ((p.estado as any) === 'PENDIENTE') {
            updatedEstado = 'PEDIDO';
          } else if ((p.estado as any) === 'SALIO') {
            updatedEstado = 'VENTA';
          }
          const sellerMapped = (p.vendedor && legacyMap[p.vendedor]) ? legacyMap[p.vendedor] : p.vendedor;
          let currentId = p.id;
          if (!currentId || seenIds.has(currentId)) {
            const baseNumStr = p.codigo ? String(p.codigo).replace('PD', '') : '';
            currentId = baseNumStr ? `p-${baseNumStr}-${idx}` : `p-id-${idx}`;
          }
          seenIds.add(currentId);
          return { ...p, id: currentId, estado: updatedEstado, vendedor: sellerMapped };
        });
      } catch (e) {
        return DEFAULT_PEDIDOS;
      }
    }
    return DEFAULT_PEDIDOS;
  });

  // State handles for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | EstadoPedido>('TODOS');
  const [semanaFilter, setSemanaFilter] = useState<string>('TODAS');
  const [vendedorFilter, setVendedorFilter] = useState<string>('TODOS');
  const [modeloFilter, setModeloFilter] = useState<string>('TODOS');
  const [tallaRangeFilter, setTallaRangeFilter] = useState<string>('TODAS');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Custom added model states
  const [customModelos, setCustomModelos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zapato_custom_models_expanded');
      if (saved) {
        return Object.keys(JSON.parse(saved));
      }
    } catch (e) {}
    return [];
  });
  const [isAddingModelOpen, setIsAddingModelOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelColor, setNewModelColor] = useState('NEGRO');

  const handleAddCustomModel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newModelName.trim().toUpperCase();
    if (!cleanName) {
      alert("Por favor escribe el nombre de un modelo.");
      return;
    }
    
    try {
      if (CATALOGO_REAL[cleanName]) {
        alert("Este modelo de calzado ya existe en el catálogo.");
        return;
      }
      
      // Default classification entry
      const defaultVariants = [
        { codigo: `C${Math.floor(10000000 + Math.random() * 90000000)}`, color: newModelColor.trim().toUpperCase() || 'NEGRO' }
      ];
      
      addCustomModel(cleanName, defaultVariants);
      
      // Seed memory CATALOGO_REAL immediately so form dialog is in sync
      CATALOGO_REAL[cleanName] = defaultVariants;
      
      // Refresh list
      setCustomModelos(prev => Array.from(new Set([...prev, cleanName])));
      
      // Auto selecting newly created model
      setModeloFilter(cleanName);
      
      // Reset inputs
      setNewModelName('');
      setNewModelColor('NEGRO');
      setIsAddingModelOpen(false);
      
      alert(`✅ ¡Modelo deportivo ${cleanName} añadido exitosamente al catálogo!`);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al intentar agregar el modelo.");
    }
  };

  // Navigation layout state
  const [currentTab, setCurrentTab] = useState('pedidos'); // 'pedidos', 'catalogo', 'analisis'
  const [activeSubTab, setActiveSubTab] = useState<'mis_pedidos' | 'produccion_semana' | 'stock_ventas_fabrica' | 'ventas_tienda_evaluacion' | 'importar_imagen'>('produccion_semana');
  const [activeAnalysisSubTab, setActiveAnalysisSubTab] = useState<'resumen' | 'detalle' | 'tallas' | 'proyeccion' | 'marketing'>('resumen');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Track table-level filtered data
  const [tableFilteredPedidos, setTableFilteredPedidos] = useState<Pedido[] | null>(null);

  useEffect(() => {
    setTableFilteredPedidos(null);
  }, [activeSubTab, currentTab]);

  // Simulated retail sales in physical store
  const [ventasTienda, setVentasTienda] = useState<Record<string, number>>(() => {
    const cleared = localStorage.getItem('zapato_production_clean_v5');
    if (!cleared) {
      return {};
    }
    const saved = localStorage.getItem('zapato_store_retail_sales');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Firebase Real-time Cloud Synchronization Hook
  const {
    user,
    loading: authLoading,
    isSynced,
    loginWithGoogle,
    logout,
    addOrUpdatePedido,
    deletePedido,
    updateVenta,
    addCustomModel
  } = useFirebaseSync(
    pedidos,
    setPedidos,
    ventasTienda,
    setVentasTienda,
    customModelos,
    setCustomModelos
  );

  // Form Modal triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState<Pedido | null>(null);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'edit' | 'delete';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('zapato_production_orders', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    localStorage.setItem('zapato_store_retail_sales', JSON.stringify(ventasTienda));
  }, [ventasTienda]);

  // Extract unique weeks & sellers for selective dropdown controls
  const semanasDisponibles = Array.from(new Set<number>(pedidos.map(p => p.semana))).sort((a, b) => a - b);
  const BASE_VENDEDORES = [
    'VALERIA',
    'ESTEFANY',
    'ANGHY',
    'COTCAS',
    'JUAN VALER',
    'STOCK TIENDA'
  ];
  const vendedoresDisponibles = BASE_VENDEDORES;
  
  // List of all unique models registered in catalog or dynamically created or existing in orders
  const todosLosModelosDisponibles = React.useMemo(() => {
    const catalogModels = Object.keys(CATALOGO_REAL);
    const orderModels = pedidos.map(p => p.producto.trim().toUpperCase());
    return Array.from(new Set([...catalogModels, ...orderModels])).filter(Boolean).sort();
  }, [pedidos, customModelos]);

  // Unified Filtering Logic
  const pedidosFiltrados = pedidos.filter(p => {
    // Search match: text matching product name, or the code
    const matchesSearch = p.producto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status match (Deprecated/Eliminated in UI)
    const matchesStatus = true;

    // Production Week filter match
    const matchesSemana = semanaFilter === 'TODAS' || p.semana === Number(semanaFilter);

    // Business Seller filter match
    let matchesVendedor = true;
    if (vendedorFilter !== 'TODOS') {
      if (vendedorFilter === 'Sin Asignar') {
        matchesVendedor = p.vendedor === null || p.vendedor === '—';
      } else {
        matchesVendedor = p.vendedor === vendedorFilter;
      }
    }

    // Model filter match
    const matchesModelo = modeloFilter === 'TODOS' || p.producto.trim().toUpperCase() === modeloFilter.trim().toUpperCase();

    // Talla range filter match
    const matchesTallaRange = tallaRangeFilter === 'TODAS' || matchesTallasRange(p, tallaRangeFilter);

    // Date filter match
    const matchesDate = !selectedDateFilter || p.fecha === selectedDateFilter;

    return matchesSearch && matchesStatus && matchesSemana && matchesVendedor && matchesModelo && matchesTallaRange && matchesDate;
  });

  // Derived dashboard count aggregates (Calculated from filtered dataset dynamically)
  const currentVisiblePedidos = tableFilteredPedidos !== null ? tableFilteredPedidos : pedidosFiltrados;
  const totalPedidosFiltrados = currentVisiblePedidos.length;
  const totalDocenasFiltradas = currentVisiblePedidos.reduce((acc, p) => acc + p.docenas, 0);
  const totalParesFiltrados = totalDocenasFiltradas * 12;

  // Generate subsequent incremental shoe production code based on historical codes
  const proximoCodigo = (() => {
    const anioActual = new Date().getFullYear();
    const prefix = `PD${anioActual}`;
    
    let maxSerial = 215; // default base starting correlative
    pedidos.forEach(p => {
      // Matches structures like PD2026000215, OP2026000215, VT2026000215
      const match = p.codigo.match(/^[A-Z]{2}[0-9]{4}([0-9]+)$/);
      if (match && match[1]) {
        const serialNum = parseInt(match[1], 10);
        if (!isNaN(serialNum) && serialNum > maxSerial) {
          maxSerial = serialNum;
        }
      }
    });

    const proximoNum = maxSerial + 1;
    const serialPadded = String(proximoNum).padStart(6, '0');
    return `${prefix}${serialPadded}`;
  })();

  // Handlers for CRUD workflows
  const handleUpdatePedido = (updated: Pedido) => {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleUpdateStatus = (codigo: string, nuevoEstado: EstadoPedido) => {
    setPedidos(prev => 
      prev.map(p => (p.codigo === codigo ? { ...p, estado: nuevoEstado } : p))
    );
  };

  const handleEditInitiated = (pedido: Pedido) => {
    setConfirmModal({
      isOpen: true,
      type: 'edit',
      title: 'Confirmar Edición',
      message: `¿Estás seguro de que deseas editar el pedido N° ${pedido.codigo} (${pedido.producto})? Esto te permitirá modificar los datos y cantidades del lote.`,
      onConfirm: () => {
        setPedidoAEditar(pedido);
        setIsFormOpen(true);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteTriggered = (codigo: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: 'Confirmar Eliminación',
      message: `¡CUIDADO! Esta acción eliminará permanentemente el pedido N° ${codigo} de tu sistema. ¿Realmente deseas continuar?`,
      onConfirm: () => {
        const pedToDelete = pedidos.find(p => p.codigo === codigo);
        if (pedToDelete) {
          deletePedido(pedToDelete.id);
        } else {
          setPedidos(prev => prev.filter(p => p.codigo !== codigo));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSavePedido = (savedPedido: Pedido) => {
    addOrUpdatePedido(savedPedido);
    // Deeply interconnect saved date: switch calendar and filter to the saved date
    if (savedPedido.fecha) {
      setSelectedDateFilter(savedPedido.fecha);
    }
    setIsFormOpen(false);
    setPedidoAEditar(null);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('TODOS');
    setSemanaFilter('TODAS');
    setVendedorFilter('TODOS');
    setModeloFilter('TODOS');
    setTallaRangeFilter('TODAS');
    setSelectedDateFilter(null);
  };

  const handleNewOrderForDate = (dateStr: string) => {
    setSelectedDateFilter(dateStr);
    setPedidoAEditar(null);
    setIsFormOpen(true);
  };

  const handleResetAllData = () => {
    if (window.confirm("🚨 ¿Estás completamente seguro de borrar TODOS los pedidos ingresados y ventas registradas? Esta acción dejará todo el sistema a cero y no se puede deshacer de ninguna forma.")) {
      setPedidos([]);
      setVentasTienda({});
      localStorage.removeItem('zapato_production_orders');
      localStorage.removeItem('zapato_store_retail_sales');
      alert("✅ El sistema se ha reiniciado correctamente. Todos los datos están ahora en cero y listos para recibir nuevos pedidos.");
    }
  };

  const handleSaveNewModelToBase = (model: {
    codigo: string;
    modelo: string;
    color: string;
    talla: string;
    tipo: string;
    linea: string;
    suela: string;
  }) => {
    const cleanModelName = model.modelo.trim().toUpperCase();
    if (!cleanModelName) return;

    const existingVariants = CATALOGO_REAL[cleanModelName] || [];
    const newVariant = {
      codigo: model.codigo.trim().toUpperCase(),
      color: model.color.trim().toUpperCase(),
      talla: model.talla,
      tipo: model.tipo,
      linea: model.linea,
      suela: model.suela || 'ESTÁNDAR'
    };

    const updatedVariants = [...existingVariants];
    const variantIndex = updatedVariants.findIndex(v => v.codigo === newVariant.codigo);
    if (variantIndex > -1) {
      updatedVariants[variantIndex] = newVariant;
    } else {
      updatedVariants.push(newVariant);
    }

    addCustomModel(cleanModelName, updatedVariants);
    CATALOGO_REAL[cleanModelName] = updatedVariants;
    setCustomModelos(prev => Array.from(new Set([...prev, cleanModelName])));
    alert(`✅ ¡Modelo ${cleanModelName} guardado en la base de datos!`);
  };

  return (
    <div className="flex bg-editorial-bg min-h-screen text-editorial-text font-sans transition-all duration-150">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        pedidos={pedidos}
        proximoCodigo={proximoCodigo}
        onSaveQuickPedido={(quickPedido) => {
          addOrUpdatePedido(quickPedido);
        }}
        onSaveNewModelToBase={handleSaveNewModelToBase}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Universal Top Header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Trigger on Mobile screen layouts */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-stone-100 rounded-none text-stone-600 hover:text-stone-900 transition cursor-pointer border border-stone-200"
              title="Abrir menú de navegación"
            >
              <Menu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">
              <span>Módulo Control</span>
              <span>/</span>
              <span className="text-[#1A1A1A] font-extrabold">
                {currentTab === 'pedidos' 
                  ? 'Pedidos Activos' 
                  : currentTab === 'seguimiento_modelo'
                    ? 'Seguimiento Modelo Nuevo'
                    : currentTab === 'catalogo'
                      ? 'CATALOGOS'
                      : currentTab === 'analisis'
                        ? 'Análisis de Producción'
                        : currentTab === 'asistencia'
                          ? 'Control de Asistencia'
                          : currentTab === 'soporte'
                            ? 'Soporte Técnico'
                            : currentTab === 'galeria'
                              ? 'Galería de Modelos'
                              : currentTab === 'santos_destajo'
                                ? 'Santos Destajo'
                                : currentTab === 'carlos_destajo'
                                  ? 'Carlos Destajo'
                                  : currentTab === 'jonas_destajo'
                                    ? 'Jonas Destajo'
                                    : currentTab === 'cristhian_destajo'
                                      ? 'Cristhian Destajo'
                                      : currentTab === 'historial_pagos'
                                        ? 'Historial de Pagos'
                                        : 'Control de Agentes'}
              </span>
            </div>
          </div>

          {/* Right Header Controls - UTC Dynamic Date Timer */}
          <div className="flex items-center gap-3">
            {/* Firebase Auth & Sync Status */}
            {authLoading ? (
              <div className="h-8 w-8 flex items-center justify-center animate-pulse">
                <Cloud size={16} className="text-stone-400" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50/50 pl-2 pr-1.5 py-1 text-xs">
                <div className="flex items-center gap-1.5" title={`Sincronizado como ${user.email}`}>
                  <Cloud size={14} className="text-emerald-600 animate-pulse" />
                  <span className="hidden lg:inline text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider font-sans truncate max-w-[120px]">
                    {user.displayName || 'Conectado'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 transition rounded-none cursor-pointer border border-emerald-200"
                  title="Cerrar sesión (Firebase Cloud Sync)"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 uppercase tracking-widest px-3 py-1.5 border border-blue-300 font-extrabold flex items-center gap-1.5 transition rounded-none cursor-pointer"
                title="Iniciar sesión con Google para sincronizar en la nube"
              >
                <CloudOff size={12} />
                <span>Nube</span>
              </button>
            )}

            {/* Abrir Link Button */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] bg-[#1E293B] hover:bg-slate-800 text-white uppercase tracking-widest px-3 py-1.5 border border-slate-900 font-extrabold flex items-center gap-1.5 transition rounded-none cursor-pointer shrink-0"
              title="Abrir aplicación en pestaña nueva de Google Chrome para visualización completa y perfecta impresión"
            >
              <ExternalLink size={12} className="text-cyan-400" />
              <span>ABRIR LINK</span>
            </a>

            <div className="hidden md:flex items-center gap-2 text-[10px] bg-stone-50 border border-stone-250 px-3 py-1.5 text-stone-600 font-bold tracking-wider font-mono">
              <Clock size={12} className="text-stone-400" />
              <span>Sábado, 13 Jun 2026 UTC</span>
            </div>
            
            <a 
              href="mailto:cesarvillegas2709@gmail.com"
              className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-800 uppercase tracking-widest px-3 py-1.5 border border-stone-300 font-bold flex items-center gap-1 transition"
              title="Soporte Técnico"
            >
              Soporte
            </a>
          </div>
        </header>

        {/* Tab-driven Dashboard viewports */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-none w-full">
          {currentTab === 'pedidos' && (
            <div className="space-y-8 animate-fade-in">
              {/* Pantalla Completa & Impresiones perfectas banner */}
              <div className="no-print bg-amber-50/70 border border-amber-200/60 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in text-[#1A1A1A]">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900 flex items-center gap-1.5">
                    <span>🌟 Modo de Visualización Completa e Impresión Perfecta para Gerencia</span>
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-sans max-w-2xl">
                    Estás visualizando la app en el panel integrado de pruebas. Para ver todo el sistema <strong>completo de izquierda a derecha</strong> (pantalla completa) y que la función de <strong>impresión conecte directamente con tu impresora física o PDF</strong> de forma impecable, abre la aplicación en una nueva pestaña del navegador.
                  </p>
                </div>
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-amber-950 bg-amber-950 hover:bg-amber-900 text-white font-mono text-[10.5px] uppercase tracking-widest font-extrabold transition-all shadow-[3px_3px_0px_0px_rgba(26,26,26,0.15)] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center shrink-0"
                >
                  🖥️ Abrir en Pantalla Completa
                </a>
              </div>

              {/* Dynamic KPI status description header with Editorial Hierarchy */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 pb-6 border-b border-stone-200">
                <div className="print:hidden">
                  <h1 className="text-3xl sm:text-4xl font-black leading-none tracking-tight uppercase italic font-serif text-[#1A1A1A]">
                    Producción
                  </h1>
                  <p className="text-[8.5px] uppercase tracking-[0.18em] font-black text-stone-550 mt-1.5">
                    Sistema de Gestión / Control de Calzado & Logística de Tienda
                  </p>
                </div>
                
                {/* Visual Counters - Elegant Flat Editorial Look */}
                <div className="flex gap-8 text-[#1A1A1A] md:border-l border-stone-200 md:pl-8 shrink-0">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-stone-900 print:text-black tracking-[0.15em] mb-1">Registro en Docenas</span>
                    <span className="text-3xl font-extrabold font-mono tracking-tight text-indigo-700 print:text-black">
                      {totalDocenasFiltradas.toLocaleString('es-ES')} <span className="text-xs font-normal font-sans uppercase tracking-widest text-stone-400 print:text-black">doc</span>
                    </span>
                    <span className="block text-[10px] font-mono text-stone-500 mt-0.5 font-semibold print:text-black">
                      ({totalPedidosFiltrados} registros)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-stone-900 print:text-black tracking-[0.15em] mb-1">Registro de Pares</span>
                    <span className="text-3xl font-bold italic font-serif leading-none text-stone-900 print:text-black">
                      {totalParesFiltrados.toLocaleString('es-ES')} <span className="text-xs font-normal font-sans uppercase tracking-widest text-stone-400 leading-none print:text-black">pares</span>
                    </span>
                    <span className="block text-[10px] font-mono text-stone-500 mt-0.5 font-semibold print:text-black">
                      (Suma automatizada)
                    </span>
                  </div>
                </div>
              </div>



              {/* Sub-tab view viewport content */}
              {activeSubTab === 'mis_pedidos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
                  {/* Calendario Lateral */}
                  <div className="lg:col-span-3 xl:col-span-2">
                    <MiniCalendario
                      pedidos={pedidos}
                      selectedDate={selectedDateFilter}
                      onSelectDate={setSelectedDateFilter}
                      onNewOrderForDate={handleNewOrderForDate}
                    />
                  </div>

                  {/* Contenido Principal (Filtros y Tabla) */}
                  <div className="lg:col-span-9 xl:col-span-10 space-y-6">
                    {/* Filtering Interface Bar */}
                    <div className="bg-white p-6 rounded-none border border-stone-200 space-y-4">
                      {/* Fast Search input */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="relative md:col-span-8 flex items-center border-b border-stone-300 focus-within:border-black transition-colors">
                          <Search className="text-stone-400 mr-2 shrink-0" size={14} />
                          <input
                            id="search-orders"
                            type="text"
                            placeholder="BUSCAR PEDIDO O MODELO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent text-[11px] py-2 text-stone-850 font-bold tracking-widest focus:outline-none uppercase"
                          />
                          {searchTerm && (
                            <button 
                              onClick={() => setSearchTerm('')}
                              className="text-stone-400 hover:text-stone-600 ml-2"
                              title="Limpiar búsqueda"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Reset and New group */}
                        <div className="md:col-span-4 flex items-center gap-2">
                          {/* Reset Filters button */}
                          <button
                            onClick={handleResetFilters}
                            className="p-2.5 hover:bg-stone-50 text-stone-500 border border-stone-200 rounded-none transition duration-150 shrink-0 cursor-pointer"
                            title="Reiniciar todos los filtros"
                          >
                            <RefreshCw size={14} />
                          </button>

                          {/* Action button: Crear Pedido */}
                          <button
                            id="btn-new-order"
                            onClick={() => {
                              setPedidoAEditar(null);
                              setIsFormOpen(true);
                            }}
                            className="flex-1 bg-[#1A1A1A] hover:bg-stone-800 text-white font-bold tracking-widest text-[10px] uppercase py-2.5 px-4 rounded-none border border-[#1A1A1A] shadow-none transition inline-flex items-center justify-center gap-1.5 cursor-pointer leading-tight h-full"
                          >
                            <Plus size={15} />
                            Nuevo Registro
                          </button>
                        </div>
                      </div>

                      {/* Secondary advanced selectors direct editorial style */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-200 flex-wrap">
                        {/* Production week selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] w-24">Semana:</span>
                          <select
                            id="filter-week"
                            value={semanaFilter}
                            onChange={(e) => setSemanaFilter(e.target.value)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-4 py-2 text-[10px] font-bold rounded-none uppercase tracking-widest focus:outline-none cursor-pointer"
                          >
                            <option value="TODAS">TODAS LAS SEMANAS</option>
                            {semanasDisponibles.map(sem => (
                              <option key={sem} value={sem}>SEMANA {sem}</option>
                            ))}
                          </select>
                        </div>

                        {/* Seller selector renamed to Vendedor / Destino */}
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] w-24">Filtro Destino:</span>
                          <select
                            id="filter-seller"
                            value={vendedorFilter}
                            onChange={(e) => setVendedorFilter(e.target.value)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-4 py-2 text-[10px] font-bold rounded-none uppercase tracking-widest focus:outline-none cursor-pointer"
                          >
                            <option value="TODOS">TODOS LOS DESTINOS</option>
                            {vendedoresDisponibles.map(v => (
                              <option key={v} value={v}>{v === 'Sin Asignar' ? 'SIN INTERMEDIARIOS' : v.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        {/* Model select filter with the option to add custom model */}
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] w-24">Modelo:</span>
                          <select
                            id="filter-model"
                            value={modeloFilter}
                            onChange={(e) => {
                              if (e.target.value === 'ADD_NEW') {
                                setIsAddingModelOpen(true);
                              } else {
                                setModeloFilter(e.target.value);
                              }
                            }}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-4 py-2 text-[10px] font-bold rounded-none uppercase tracking-widest focus:outline-none cursor-pointer"
                          >
                            <option value="TODOS">TODOS LOS MODELOS</option>
                            {todosLosModelosDisponibles.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                            <option value="ADD_NEW" className="text-amber-800 font-bold">+ AGREGAR MODELO...</option>
                          </select>
                        </div>

                        {/* Tallas filter */}
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] w-24">Tallas:</span>
                          <select
                            id="filter-tallas"
                            value={tallaRangeFilter}
                            onChange={(e) => setTallaRangeFilter(e.target.value)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-4 py-2 text-[10px] font-bold rounded-none uppercase tracking-widest focus:outline-none cursor-pointer"
                          >
                            <option value="TODAS">TODAS LAS TALLAS</option>
                            <option value="29/34">TALLAS 29/34</option>
                            <option value="35/38">TALLAS 35/38</option>
                            <option value="39/42">TALLAS 39/42</option>
                            <option value="37/40">TALLAS 37/40</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Main table render */}
                    <PedidosTable 
                      data={pedidosFiltrados}
                      onUpdateStatus={handleUpdateStatus}
                      onEdit={handleEditInitiated}
                      onDelete={handleDeleteTriggered}
                      onUpdatePedido={handleUpdatePedido}
                      onFilteredDataChange={setTableFilteredPedidos}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Control de Producción Semanal */}
              {activeSubTab === 'produccion_semana' && (
                <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6 animate-fade-in text-stone-900">
                  <div className="pb-4 border-b border-stone-150 flex justify-end">
                    <button
                      onClick={() => {
                        const isIframe = typeof window !== 'undefined' && window.self !== window.top;
                        if (isIframe) {
                          setIsPrintModalOpen(true);
                        } else {
                          window.print();
                        }
                      }}
                      className="print:hidden no-print inline-flex items-center gap-2 px-3 py-1.5 border border-stone-950 bg-white hover:bg-stone-50 font-mono text-xs uppercase tracking-wider text-stone-900 transition-all font-bold self-start sm:self-center shrink-0 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      <Printer size={13} className="text-stone-900" />
                      Imprimir Lotes
                    </button>
                  </div>

                  {/* El panel de Registro de Producción Rápido ahora se gestiona interactivamente en la barra lateral debajo de LÍNEAS ACTIVAS */}

                  {(() => {
                    const prodOrders = pedidos;

                    return (
                      <div className="space-y-6">
                        {/* List of active production orders with editing options */}
                        <div className="pt-4 space-y-4">
                          {prodOrders.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-stone-250 bg-stone-50/50">
                              <p className="text-stone-500 text-xs italic tracking-wide uppercase font-black">
                                No se registran lotes en estado de "PRODUCCIÓN" o sub-etapas activas.
                              </p>
                              <p className="text-stone-400 text-[10px] mt-1 font-mono">
                                Ingrese una orden utilizando el panel superior para visualizarla y gestionarla en esta sección.
                              </p>
                            </div>
                          ) : (
                            <PedidosTable 
                              data={prodOrders}
                              onUpdateStatus={handleUpdateStatus}
                              onEdit={handleEditInitiated}
                              onDelete={handleDeleteTriggered}
                              onUpdatePedido={handleUpdatePedido}
                              onFilteredDataChange={setTableFilteredPedidos}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: Stock en Tienda y Ventas en Fábrica de la Producción */}
              {activeSubTab === 'stock_ventas_fabrica' && (
                <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6 animate-fade-in text-stone-900">
                  <div className="pb-4 border-b border-stone-150">
                    <h3 className="text-lg font-black uppercase tracking-wider text-stone-900 font-serif italic">
                      🏬 Distribución del Volumen Producido
                    </h3>
                    <p className="text-stone-400 text-[10.5px] font-mono mt-0.5">
                      Medición de lo producido asignado a <strong>Stock en Tienda</strong> (vendedor 'STOCK TIENDA') frente a las <strong>Ventas directas en Fábrica</strong> a clientes.
                    </p>
                  </div>

                  {(() => {
                    const stockTiendaLots = pedidos.filter(p => p.vendedor === 'STOCK TIENDA');
                    const ventaFabricaLots = pedidos.filter(p => p.estado === 'VENTA' || (p.vendedor && p.vendedor !== 'STOCK TIENDA' && p.vendedor !== '—'));

                    const totalDocenasStockTienda = stockTiendaLots.reduce((acc, p) => acc + p.docenas, 0);
                    const totalDocenasVentaFabrica = ventaFabricaLots.reduce((acc, p) => acc + p.docenas, 0);
                    const totalDocenasGeneral = totalDocenasStockTienda + totalDocenasVentaFabrica;

                    // Group by product to compare
                    const compareProducts: Record<string, { stockTienda: number; ventaFabrica: number }> = {};
                    pedidos.forEach(p => {
                      if (!compareProducts[p.producto]) {
                        compareProducts[p.producto] = { stockTienda: 0, ventaFabrica: 0 };
                      }
                      if (p.vendedor === 'STOCK TIENDA') {
                        compareProducts[p.producto].stockTienda += p.docenas;
                      } else if (p.estado === 'VENTA' || (p.vendedor && p.vendedor !== '—')) {
                        compareProducts[p.producto].ventaFabrica += p.docenas;
                      }
                    });

                    if (pedidos.length === 0) {
                      return (
                        <div className="p-12 text-center border border-dashed border-stone-250 bg-stone-50/50">
                          <p className="text-stone-500 text-xs italic tracking-wide uppercase font-black">
                            Aún no se registran lotes en el sistema para calcular dispatches o almacenajes.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* KPIs panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-stone-200 p-5 bg-gradient-to-r from-emerald-50/20 to-emerald-50 flex items-center justify-between">
                            <div>
                              <span className="block text-[9px] uppercase font-bold text-stone-500 tracking-widest">Enviado a Stock de Tienda</span>
                              <strong className="text-3xl font-serif italic text-stone-950 block mt-1">{totalDocenasStockTienda} docenas</strong>
                              <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">Lotes de almacén: {stockTiendaLots.length}</span>
                            </div>
                            <span className="text-4xl">🏬</span>
                          </div>

                          <div className="border border-stone-200 p-5 bg-gradient-to-r from-indigo-50/20 to-indigo-50 flex items-center justify-between">
                            <div>
                              <span className="block text-[9px] uppercase font-bold text-stone-500 tracking-widest">Vendido Directo en Fábrica</span>
                              <strong className="text-3xl font-serif italic text-indigo-950 block mt-1">{totalDocenasVentaFabrica} docenas</strong>
                              <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">Lotes de facturas de fábrica: {ventaFabricaLots.length}</span>
                            </div>
                            <span className="text-4xl">🏢</span>
                          </div>
                        </div>

                        {/* Product visual comparison charts */}
                        <div className="border border-stone-200 p-6 bg-[#fbfcfa] space-y-4">
                          <h4 className="text-[11px] uppercase tracking-widest font-black text-stone-900 border-b border-stone-200 pb-2">
                            Distribución Comparativa por Modelo de Calzado (Docenas)
                          </h4>
                          
                          <div className="space-y-6 divide-y divide-stone-150 pt-2">
                            {Object.entries(compareProducts).map(([model, data]) => {
                              const modelTotal = data.stockTienda + data.ventaFabrica;
                              if (modelTotal === 0) return null;
                              const pctTienda = Math.round((data.stockTienda / modelTotal) * 100);
                              const pctVenta = Math.round((data.ventaFabrica / modelTotal) * 100);

                              return (
                                <div key={model} className="pt-4 first:pt-4 space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                                    <span className="text-xs font-black uppercase text-stone-850 tracking-wide">{model}</span>
                                    <span className="text-[10px] font-mono text-stone-500 font-semibold">
                                      Total adjudicado: {modelTotal} doc. (🏬 {data.stockTienda} doc vs 🏢 {data.ventaFabrica} doc)
                                    </span>
                                  </div>
                                  <div className="w-full flex h-6 bg-stone-100 overflow-hidden font-mono text-[9px] font-extrabold text-white text-center">
                                    {data.stockTienda > 0 && (
                                      <div 
                                        className="bg-emerald-600 flex items-center justify-center transition-all" 
                                        style={{ width: `${pctTienda}%` }}
                                        title={`Stock Tienda: ${pctTienda}%`}
                                      >
                                        🏬 {pctTienda}%
                                      </div>
                                    )}
                                    {data.ventaFabrica > 0 && (
                                      <div 
                                        className="bg-indigo-600 flex items-center justify-center transition-all" 
                                        style={{ width: `${pctVenta}%` }}
                                        title={`Ventas Fábrica: ${pctVenta}%`}
                                      >
                                        🏢 {pctVenta}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: Evaluación y Ventas en Tienda de lo producido */}
              {activeSubTab === 'ventas_tienda_evaluacion' && (
                <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6 animate-fade-in text-stone-900">
                  <div className="pb-4 border-b border-stone-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-wider text-stone-900 font-serif italic">
                        📈 Rendimiento y Ventas de Tienda Física
                      </h3>
                      <p className="text-stone-400 text-[10.5px] font-mono mt-0.5">
                        Registra ventas del stock enviado a tu Tienda y evalúa la rotación del calzado en tiempo real.
                      </p>
                    </div>
                    <div className="text-[10px] font-mono bg-pink-50 border border-pink-200 px-3 py-1 text-pink-700 font-extrabold uppercase">
                      Módulo Comercial de Tienda Abierto (Simulado)
                    </div>
                  </div>

                  {(() => {
                    // Extract model stocks that are destined to 'STOCK TIENDA'
                    const stockEnTiendaPorModelo = pedidos
                      .filter(p => p.vendedor === 'STOCK TIENDA')
                      .reduce<Record<string, number>>((acc, p) => {
                        acc[p.producto] = (acc[p.producto] || 0) + p.docenas;
                        return acc;
                      }, {});

                    const activeModels = Object.keys(stockEnTiendaPorModelo).sort();

                    if (activeModels.length === 0) {
                      return (
                        <div className="p-12 text-center border border-dashed border-stone-250 bg-stone-50/50">
                          <p className="text-stone-500 text-xs italic tracking-wide uppercase font-black">
                            No hay stock registrado en el almacén de Tienda.
                          </p>
                          <p className="text-stone-400 text-[10.5px] mt-2 max-w-md mx-auto leading-relaxed">
                            Para evaluar las ventas en tienda, primero ve a <strong>Mis Pedidos</strong>, registra un lote en <strong>PRODUCCIÓN</strong> y en la opción <strong className="text-stone-850">"Vendedor / Cliente / Destino"</strong> elige <strong className="text-indigo-600">"STOCK TIENDA"</strong>.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left Panel: Register Sales controls */}
                          <div className="lg:col-span-2 border border-stone-200 p-5 space-y-4 bg-[#fbfcfa]">
                            <h4 className="text-[11px] uppercase tracking-widest font-black text-stone-900 border-b border-stone-200 pb-2 flex items-center justify-between">
                              <span>Mesa de Control: Registrar Ventas de Tienda</span>
                              <span className="text-[9px] bg-stone-200 text-stone-700 px-2 py-0.5 text-right font-bold uppercase font-mono rounded-none">En Docenas</span>
                            </h4>

                            <div className="divide-y divide-stone-200 space-y-4 pt-1">
                              {activeModels.map(modelo => {
                                const totalEnviado = stockEnTiendaPorModelo[modelo] || 0;
                                const vendido = ventasTienda[modelo] || 0;
                                const saldoStock = Math.max(0, totalEnviado - vendido);

                                return (
                                  <div key={modelo} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-stone-900 uppercase font-sans">{modelo}</span>
                                      </div>
                                      <div className="text-[11px] font-mono text-stone-500 font-medium font-bold">
                                        Total Recibido: <strong className="text-[#1A1A1A] font-bold">{totalEnviado} doc.</strong> • En Stock: <strong className="text-emerald-700 font-bold">{saldoStock} doc.</strong>
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        disabled={vendido === 0}
                                        onClick={() => {
                                          const newVal = Math.max(0, vendido - 1);
                                          updateVenta(modelo, newVal);
                                        }}
                                        className="bg-white hover:bg-stone-100 disabled:opacity-40 border border-stone-300 font-black text-stone-800 text-2xs px-3 py-1.5 transition rounded-none cursor-pointer"
                                        title="Reducir venta registrada"
                                      >
                                        -1 Doc
                                      </button>
                                      
                                      <span className="px-3.5 py-1.5 bg-stone-100 text-stone-950 font-black font-mono text-xs border border-stone-250 w-24 text-center select-none" title="Docenas vendidas en Tienda">
                                        {vendido} vendidas
                                      </span>

                                      <button
                                        disabled={saldoStock === 0}
                                        onClick={() => {
                                          const newVal = Math.min(totalEnviado, vendido + 1);
                                          updateVenta(modelo, newVal);
                                        }}
                                        className="bg-pink-100 hover:bg-pink-200 text-pink-800 border border-pink-300 disabled:opacity-40 font-black text-2xs px-4 py-1.5 transition rounded-none cursor-pointer"
                                        title="Registrar venta de 1 docena"
                                      >
                                        +1 Doc Vendida
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Panel: Analytics & health indicators */}
                          <div className="border border-stone-200 p-5 space-y-4 bg-white">
                            <h4 className="text-[11px] uppercase tracking-widest font-black text-stone-900 border-b border-stone-200 pb-2">
                              Evaluación de Rotación de Inventario
                            </h4>

                            <div className="space-y-4 pt-1">
                              {activeModels.map(modelo => {
                                const totalEnviado = stockEnTiendaPorModelo[modelo] || 0;
                                const vendido = ventasTienda[modelo] || 0;
                                const sellThroughRate = totalEnviado > 0 ? Math.round((vendido / totalEnviado) * 100) : 0;
                                
                                let rotacionLabel = "ROTACIÓN MODERADA 📈";
                                let rotacionBg = "bg-stone-50 border-stone-200 text-stone-700";
                                if (sellThroughRate >= 70) {
                                  rotacionLabel = "EXCELENTE ROTACIÓN 🌟";
                                  rotacionBg = "bg-emerald-50 border-emerald-200 text-emerald-800";
                                } else if (sellThroughRate < 30) {
                                  rotacionLabel = "STOCK RETENIDO 💤";
                                  rotacionBg = "bg-amber-50 border-amber-200 text-amber-850";
                                }

                                return (
                                  <div key={modelo} className="p-3 border rounded-none flex items-center justify-between gap-3 text-2xs font-sans uppercase font-bold tracking-wider hover:border-stone-950 transition-colors">
                                    <div>
                                      <div className="text-stone-900 font-black mb-0.5">{modelo}</div>
                                      <div className="text-[9px] font-mono text-stone-400 font-semibold lowercase">Tasa de Rotación: {sellThroughRate}%</div>
                                    </div>
                                    <div className={`px-2.5 py-1 text-[8.5px] font-extrabold font-mono tracking-widest border ${rotacionBg}`}>
                                      {rotacionLabel}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="p-3 bg-stone-50 border border-stone-200 text-[10.5px] text-stone-600 leading-relaxed font-semibold">
                              📋 <strong>Sell-Through Rate:</strong> Representa el porcentaje de mercancía enviada a tienda que ha sido vendido efectivamente al cliente retail. Una tasa alta indica que el calzado es altamente comercial y exitoso.
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeSubTab === 'importar_imagen' && (
                <div className="animate-fade-in space-y-6">
                  <AdjuntarPedidoImagen
                    proximoCodigo={proximoCodigo}
                    onSave={handleSavePedido}
                    onSuccessRedirect={() => setActiveSubTab('mis_pedidos')}
                  />
                </div>
              )}
            </div>
          )}

          {currentTab === 'seguimiento_modelo' && (
            <div className="animate-fade-in space-y-8">
              <SeguimientoModelosNuevos />
            </div>
          )}

          {currentTab === 'santos_destajo' && (
            <div className="animate-fade-in space-y-8">
              <SantosDestajo pedidos={pedidos} />
            </div>
          )}

          {currentTab === 'carlos_destajo' && (
            <div className="animate-fade-in space-y-8">
              <CarlosDestajo pedidos={pedidos} />
            </div>
          )}

          {currentTab === 'jonas_destajo' && (
            <div className="animate-fade-in space-y-8">
              <JonasDestajo pedidos={pedidos} />
            </div>
          )}

          {currentTab === 'cristhian_destajo' && (
            <div className="animate-fade-in space-y-8">
              <CristhianDestajo pedidos={pedidos} />
            </div>
          )}

          {currentTab === 'historial_pagos' && (
            <div className="animate-fade-in space-y-8">
              <HistorialPagos />
            </div>
          )}

          {currentTab === 'catalogo' && (
            <div className="animate-fade-in space-y-8">
              <CatalogoModelos 
                pedidos={pedidos} 
                onOpenPrintInstructions={() => setIsPrintModalOpen(true)} 
                onSaveModelVariants={(modelName, variants) => {
                  addCustomModel(modelName, variants);
                  CATALOGO_REAL[modelName.toUpperCase()] = variants;
                  setCustomModelos(prev => Array.from(new Set([...prev, modelName.toUpperCase()])));
                }}
              />
            </div>
          )}

          {currentTab === 'analisis' && (
            <div className="animate-fade-in space-y-8">
              <div className="pt-8 pb-6 flex flex-col md:flex-row justify-between items-baseline border-b border-stone-200 bg-transparent gap-4">
                <div>
                  <h1 className="text-5xl sm:text-[64px] font-bold leading-none tracking-tighter uppercase italic font-serif text-[#1A1A1A]">
                    Análisis
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-400 mt-2">
                    Dashboard interconectado en tiempo real con modelados, talles, colores, proyecciones reales de taller.
                  </p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-2xl font-light font-mono text-stone-850">SISTEMA MAESTRO 2026</div>
                  <div className="text-[9px] uppercase tracking-[0.25em] font-black text-stone-450">Taller & Producción</div>
                </div>
              </div>

              {/* Sub-tab navigation */}
              <div className="flex flex-wrap gap-1 bg-stone-100 p-1 border border-stone-200 rounded-none w-full shadow-3xs">
                {[
                  { id: 'resumen', label: 'Resumen Semanal' },
                  { id: 'detalle', label: 'Detalle Modelos' },
                  { id: 'tallas', label: 'Por Tallas' },
                  { id: 'proyeccion', label: 'Proyecciones' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAnalysisSubTab(tab.id as any)}
                    className={`px-4 py-2 text-[10px] uppercase font-black tracking-wider transition rounded-none cursor-pointer
                      ${activeAnalysisSubTab === tab.id 
                        ? 'bg-[#1A1A1A] text-white shadow-xs' 
                        : 'text-stone-500 hover:text-stone-950 hover:bg-stone-200'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <ProductionAnalytics 
                pedidos={pedidos} 
                onUpdatePedidos={setPedidos}
                activeTab={activeAnalysisSubTab as any} 
                onTabChange={(tab) => setActiveAnalysisSubTab(tab as any)} 
              />
            </div>
          )}

          {currentTab === 'asistencia' && (
            <AsistenciaDashboard />
          )}

          {currentTab === 'marketing' && (
            <div className="animate-fade-in space-y-8 pb-10">
              <div className="pt-8 pb-6 flex flex-col md:flex-row justify-between items-baseline border-b border-stone-200 bg-transparent gap-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold font-serif italic text-stone-900 leading-none tracking-tight">
                    ESTUDIO Y ANÁLISIS DE MERCADO
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-400 mt-2">
                    Análisis comercial, investigación de la competencia, canales de venta y plan de marketing estratégico.
                  </p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-2xl font-light font-mono text-stone-800">BRIXTÓN ESTRATEGIA</div>
                  <div className="text-[9px] uppercase tracking-[0.25em] font-black text-stone-500">Inteligencia de Canales</div>
                </div>
              </div>
              <div className="border border-stone-200 p-1 bg-white">
                <MarketingDashboard />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit / Add order slide-over form */}
      {isFormOpen && (
        <PedidoFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setPedidoAEditar(null);
          }}
          pedidoAEditar={pedidoAEditar}
          proximoCodigo={proximoCodigo}
          onSave={handleSavePedido}
          fechaPreseleccionada={selectedDateFilter}
        />
      )}

      {/* MODAL / DIALOG: AGREGAR NUEVO MODELO DE CALZADO */}
      {isAddingModelOpen && (
        <div id="add-model-modal" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-stone-900 max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => {
                setIsAddingModelOpen(false);
                setNewModelName('');
              }}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-900 font-bold transition text-xs font-mono cursor-pointer"
              title="Cerrar"
            >
              ✕
            </button>
            
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] font-serif italic flex items-center gap-2">
                ➕ REGISTRAR MODELO DE CALZADO
              </h3>
              <p className="text-stone-400 text-[10px] font-mono mt-1">
                Registra una nueva marca o línea de zapatillas deportivas en el catálogo para habilitar su carga rápida y filtrado.
              </p>
            </div>

            <form onSubmit={handleAddCustomModel} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Nombre del Modelo:</label>
                <input
                  type="text"
                  required
                  placeholder="Escriba el nombre en mayúsculas (Ej: FORCE FAST)..."
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold uppercase focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Color de Base / Variante Inicial:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: NEGRO, BLANCO PLATA, AMARILLO NEON..."
                  value={newModelColor}
                  onChange={(e) => setNewModelColor(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold uppercase focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="bg-stone-50 p-2.5 border border-stone-200 text-[#1A1A1A] text-[9.5px] leading-relaxed">
                ⚙️ Al guardar, se generará una clasificación inicial de <strong>Caballero-Dama</strong> para este modelo, y estará habilitado inmediatamente para entrada por comandos/atajo y formulario general.
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingModelOpen(false);
                    setNewModelName('');
                  }}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-stone-800 text-white text-[10px] uppercase tracking-wider font-bold shadow-none transition cursor-pointer"
                >
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE INSTRUCCIONES DE IMPRESIÓN */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A1A1A] w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative animate-fade-in text-stone-900">
            {/* Botón de cierre en esquina */}
            <button 
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition"
              title="Cerrar ventana"
            >
              <X size={16} />
            </button>

            <div className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-widest text-stone-900 font-serif italic flex items-center gap-2">
                🖨️ Instrucciones de Impresión
              </h3>
              <p className="text-stone-400 text-[10px] font-mono leading-relaxed uppercase">
                Restricción técnica detectada debido al modo de diseño integrado (iframe).
              </p>
            </div>

            <div className="space-y-4 text-xs text-stone-800 leading-relaxed font-sans">
              <p className="font-bold text-[#1A1A1A]">
                ¿Por qué no se abre el diálogo de tu impresora?
              </p>
              <p>
                Los navegadores modernos bloquean el comando de impresión directa (<code className="bg-stone-100 font-mono text-[10px] px-1 py-0.5 border border-stone-200">window.print()</code>) cuando una aplicación está dentro de un entorno de previsualización por razones de seguridad.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 p-3.5 space-y-2 text-[11px] leading-relaxed">
                <p className="font-bold text-amber-900 uppercase tracking-wider font-mono text-[9px] flex items-center gap-1">
                  💡 Solución en 3 simples pasos:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-stone-800">
                  <li>Haz clic en el botón de la flecha de <strong className="text-amber-950 font-bold">"Nueva Pestaña"</strong> (situado en la barra superior derecha de la vista previa de AI Studio o al lado de compartir) para usar la app en pantalla completa.</li>
                  <li>Ve a la pestaña de <strong className="text-amber-950 font-bold">"Control de Producción Semanal"</strong>.</li>
                  <li>Presiona de nuevo <strong className="text-amber-950 font-bold">"Imprimir Lotes"</strong>. ¡Se conectará instantáneamente con tu impresora conectada (física o virtual PDF) de manera perfecta!</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsPrintModalOpen(false);
                  window.print();
                }}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
              >
                Intentar de todos modos
              </button>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-stone-800 text-white text-[10px] uppercase tracking-wider font-bold shadow-none transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN CUSTOMIZADO (EDITAR Y ELIMINAR) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-900 w-full max-w-md p-6 space-y-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative animate-fade-in text-stone-900">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-none border ${confirmModal.type === 'delete' ? 'bg-red-50 border-red-200 text-red-650' : 'bg-indigo-50 border-indigo-200 text-indigo-650'}`}>
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 font-sans">
                  {confirmModal.title}
                </h3>
                <p className="text-[10px] font-mono uppercase text-stone-400">
                  {confirmModal.type === 'delete' ? '⚠️ Acción Irreversible' : '✍️ Modificación de Datos'}
                </p>
              </div>
            </div>

            {/* Message */}
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              {confirmModal.message}
            </p>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-white text-[10px] uppercase tracking-wider font-bold shadow-none transition cursor-pointer ${
                  confirmModal.type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
