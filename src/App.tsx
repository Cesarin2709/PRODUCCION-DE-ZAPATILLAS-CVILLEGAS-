import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PedidosTable } from './components/PedidosTable';
import { PedidoFormModal } from './components/PedidoFormModal';
import { ProductionAnalytics } from './components/ProductionAnalytics';
import { VendedoresStatsView } from './components/VendedoresStatsView';
import { Pedido, EstadoPedido } from './types';
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
  X
} from 'lucide-react';

const DEFAULT_PEDIDOS: Pedido[] = [
  {
    id: 'pd-1',
    codigo: 'PD2026000216',
    fecha: '2026-05-21',
    semana: 18,
    vendedor: null,
    producto: 'NEW BR6 01',
    variantes: 2,
    docenas: 36,
    estado: 'PENDIENTE',
    items: [
      { id: 'v-11', color: 'Negro', tallas: { '37': 4, '38': 8, '39': 8, '40': 4 } },
      { id: 'v-12', color: 'Blanco', tallas: { '38': 4, '39': 4, '40': 4 } }
    ]
  },
  {
    id: 'pd-2',
    codigo: 'PD2026000218',
    fecha: '2026-05-22',
    semana: 18,
    vendedor: 'Gomez, Ana',
    producto: 'PRECISION',
    variantes: 1,
    docenas: 20,
    estado: 'PRODUCCION',
    items: [
      { id: 'v-21', color: 'Charol Negro', tallas: { '39': 5, '40': 5, '41': 5, '42': 5 } }
    ]
  },
  {
    id: 'pd-3',
    codigo: 'PD2026000195',
    fecha: '2026-05-15',
    semana: 17,
    vendedor: 'Ruiz, Carlos',
    producto: 'FORCE FAST',
    variantes: 3,
    docenas: 48,
    estado: 'SALIO',
    items: [
      { id: 'v-31', color: 'Rojo Fuego', tallas: { '37': 6, '38': 6, '39': 6 } },
      { id: 'v-32', color: 'Azul Marino', tallas: { '40': 6, '41': 6, '42': 6 } },
      { id: 'v-33', color: 'Negro Mate', tallas: { '39': 6, '40': 6 } }
    ]
  },
  {
    id: 'pd-4',
    codigo: 'PD2026000210',
    fecha: '2026-05-18',
    semana: 18,
    vendedor: 'Gomez, Ana',
    producto: 'AIR SPORT',
    variantes: 2,
    docenas: 24,
    estado: 'PRODUCCION',
    items: [
      { id: 'v-41', color: 'Celeste', tallas: { '36': 4, '37': 4, '38': 4 } },
      { id: 'v-42', color: 'Rosa Pastel', tallas: { '35': 4, '36': 4, '37': 4 } }
    ]
  },
  {
    id: 'pd-5',
    codigo: 'PD2026000222',
    fecha: '2026-05-25',
    semana: 19,
    vendedor: 'Fernandez, Luisa',
    producto: 'ELEGANCE 02',
    variantes: 1,
    docenas: 15,
    estado: 'PENDIENTE',
    items: [
      { id: 'v-51', color: 'Miel', tallas: { '37': 3, '38': 4, '39': 4, '40': 4 } }
    ]
  },
  {
    id: 'pd-6',
    codigo: 'PD2026000225',
    fecha: '2026-05-26',
    semana: 19,
    vendedor: '—',
    producto: 'WALK EASY',
    variantes: 2,
    docenas: 30,
    estado: 'PENDIENTE',
    items: [
      { id: 'v-61', color: 'Beige', tallas: { '36': 5, '37': 5, '38': 5 } },
      { id: 'v-62', color: 'Gris Plata', tallas: { '38': 5, '39': 5, '40': 5 } }
    ]
  }
];

export default function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('zapato_production_orders');
    return saved ? JSON.parse(saved) : DEFAULT_PEDIDOS;
  });

  // State handles for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | EstadoPedido>('TODOS');
  const [semanaFilter, setSemanaFilter] = useState<string>('TODAS');
  const [vendedorFilter, setVendedorFilter] = useState<string>('TODOS');

  // Navigation layout state
  const [currentTab, setCurrentTab] = useState('pedidos'); // 'pedidos', 'analytics', 'vendedores'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form Modal triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState<Pedido | null>(null);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('zapato_production_orders', JSON.stringify(pedidos));
  }, [pedidos]);

  // Extract unique weeks & sellers for selective dropdown controls
  const semanasDisponibles = Array.from(new Set<number>(pedidos.map(p => p.semana))).sort((a, b) => a - b);
  const vendedoresDisponibles = Array.from(
    new Set(pedidos.map(p => p.vendedor === null || p.vendedor === '—' ? 'Sin Asignar' : p.vendedor))
  ).sort();

  // Unified Filtering Logic
  const pedidosFiltrados = pedidos.filter(p => {
    // Search match: text matching product name, or the code
    const matchesSearch = p.producto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status match
    const matchesStatus = statusFilter === 'TODOS' || p.estado === statusFilter;

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

    return matchesSearch && matchesStatus && matchesSemana && matchesVendedor;
  });

  // Derived dashboard count aggregates (Calculated from filtered dataset dynamically)
  const totalPedidosFiltrados = pedidosFiltrados.length;
  const totalDocenasFiltradas = pedidosFiltrados.reduce((acc, p) => acc + p.docenas, 0);

  // Generate subsequent incremental shoe production code based on historical codes
  const proximoCodigo = (() => {
    const anioActual = new Date().getFullYear();
    const prefix = `PD${anioActual}`;
    
    let maxSerial = 215; // default base starting correlative
    pedidos.forEach(p => {
      if (p.codigo.startsWith(prefix)) {
        const serialStr = p.codigo.substring(prefix.length);
        const serialNum = parseInt(serialStr, 10);
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
  const handleUpdateStatus = (codigo: string, nuevoEstado: EstadoPedido) => {
    setPedidos(prev => 
      prev.map(p => (p.codigo === codigo ? { ...p, estado: nuevoEstado } : p))
    );
  };

  const handleEditInitiated = (pedido: Pedido) => {
    setPedidoAEditar(pedido);
    setIsFormOpen(true);
  };

  const handleDeleteTriggered = (codigo: string) => {
    if (confirm(`¿Estás seguro de eliminar el pedido N° ${codigo}?`)) {
      setPedidos(prev => prev.filter(p => p.codigo !== codigo));
    }
  };

  const handleSavePedido = (savedPedido: Pedido) => {
    const yaExiste = pedidos.some(p => p.id === savedPedido.id);
    if (yaExiste) {
      // Edit
      setPedidos(prev => prev.map(p => (p.id === savedPedido.id ? savedPedido : p)));
    } else {
      // Create new
      setPedidos(prev => [savedPedido, ...prev]);
    }
    setIsFormOpen(false);
    setPedidoAEditar(null);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('TODOS');
    setSemanaFilter('TODAS');
    setVendedorFilter('TODOS');
  };

  return (
    <div className="flex bg-editorial-bg min-h-screen text-editorial-text font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
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
                {currentTab === 'pedidos' ? 'Pedidos Activos' : currentTab === 'analytics' ? 'Planificación Semanal' : 'Control de Agentes'}
              </span>
            </div>
          </div>

          {/* Right Header Controls - UTC Dynamic Date Timer */}
          <div className="flex items-center gap-4">
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
        <main className="flex-1 p-6 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
          {currentTab === 'pedidos' && (
            <div className="space-y-8 animate-fade-in">
              {/* Dynamic KPI status description header with Editorial Hierarchy */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 pb-6 border-b border-stone-200">
                <div>
                  <h1 className="text-5xl sm:text-[64px] font-bold leading-none tracking-tighter uppercase italic font-serif text-[#1A1A1A]">
                    Producción
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-400 mt-2">
                    Sistema de Gestión / Control de Calzado
                  </p>
                </div>
                
                {/* Visual Counters - Elegant Flat Editorial Look */}
                <div className="flex gap-8 text-[#1A1A1A] md:border-l border-stone-200 md:pl-8 shrink-0">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-stone-400 tracking-[0.15em] mb-1">Pedidos Totales</span>
                    <span className="text-3xl font-extrabold font-mono tracking-tight">
                      {totalPedidosFiltrados} <span className="text-xs font-normal font-sans uppercase tracking-widest text-stone-400">unids</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-stone-400 tracking-[0.15em] mb-1">Docenas Totales</span>
                    <span className="text-3xl font-bold italic font-serif leading-none">
                      {totalDocenasFiltradas} <span className="text-xs font-normal font-sans uppercase tracking-widest text-stone-400 leading-none">doc</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtering Interface Bar */}
              <div className="bg-white p-6 rounded-none border border-stone-200 space-y-4">
                {/* Fast Search input */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="relative md:col-span-4 flex items-center border-b border-stone-300 focus-within:border-black transition-colors">
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

                  {/* Status buttons shortcuts instead of dropdowns for direct fast clicking */}
                  <div className="md:col-span-5 flex items-center gap-1 bg-stone-50 border border-stone-200 p-1 rounded-none overflow-x-auto min-w-0">
                    {(['TODOS', 'PENDIENTE', 'PRODUCCION', 'SALIO'] as const).map((est) => {
                      const active = statusFilter === est;
                      return (
                        <button
                          key={est}
                          onClick={() => setStatusFilter(est)}
                          className={`px-3 py-1.5 rounded-none text-[10px] font-bold tracking-widest uppercase transition shrink-0 cursor-pointer
                            ${active 
                              ? 'bg-[#1A1A1A] text-white shadow-none' 
                              : 'text-stone-500 hover:text-stone-800'
                            }`}
                        >
                          {est === 'TODOS' ? 'TODOS' : est === 'PRODUCCION' ? 'PRODUCCIÓN' : est === 'SALIO' ? 'SALIÓ' : est}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdowns for weeks and sellers */}
                  <div className="md:col-span-3 flex items-center gap-2">
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
                      Nuevo Pedido
                    </button>
                  </div>
                </div>

                {/* Secondary advanced selectors direct editorial style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 flex-wrap">
                  {/* Production week selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] w-20">Semana:</span>
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

                  {/* Seller selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] w-20">Vendedor:</span>
                    <select
                      id="filter-seller"
                      value={vendedorFilter}
                      onChange={(e) => setVendedorFilter(e.target.value)}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-4 py-2 text-[10px] font-bold rounded-none uppercase tracking-widest focus:outline-none cursor-pointer"
                    >
                      <option value="TODOS">TODOS LOS VENDEDORES</option>
                      {vendedoresDisponibles.map(v => (
                        <option key={v} value={v}>{v === 'Sin Asignar' ? 'SIN VENDEDOR (Interno)' : v}</option>
                      ))}
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
              />
            </div>
          )}

          {currentTab === 'analytics' && (
            <div className="animate-fade-in space-y-8">
              <div className="pt-8 pb-6 flex flex-col md:flex-row justify-between items-baseline border-b border-stone-200 bg-transparent gap-4">
                <div>
                  <h1 className="text-5xl sm:text-[64px] font-bold leading-none tracking-tighter uppercase italic font-serif text-[#1A1A1A]">
                    Planificación
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-400 mt-2">
                    Análisis consolidado para la distribución óptima de hormas de calzado y recursos semanales.
                  </p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-2xl font-light font-mono tabular-nums text-stone-850">Estadísticas</div>
                  <div className="text-[9px] uppercase tracking-[0.25em] font-black text-stone-450">Eficiencia / Demanda</div>
                </div>
              </div>

              <ProductionAnalytics pedidos={pedidos} />
            </div>
          )}

          {currentTab === 'vendedores' && (
            <div className="animate-fade-in space-y-8">
              <div className="pt-8 pb-6 flex flex-col md:flex-row justify-between items-baseline border-b border-stone-200 bg-transparent gap-4">
                <div>
                  <h1 className="text-5xl sm:text-[64px] font-bold leading-none tracking-tighter uppercase italic font-serif text-[#1A1A1A]">
                    Distribución
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-400 mt-2">
                    Monitoreo y asignación de carga de trabajo comercial y pedidos en taller.
                  </p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-2xl font-light font-mono tabular-nums text-stone-850">Talleres</div>
                  <div className="text-[9px] uppercase tracking-[0.25em] font-black text-stone-450 font-sans">Desempeño comercial</div>
                </div>
              </div>

              <VendedoresStatsView pedidos={pedidos} />
            </div>
          )}
        </main>
      </div>

      {/* Edit / Add order slide-over form */}
      <PedidoFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setPedidoAEditar(null);
        }}
        pedidoAEditar={pedidoAEditar}
        proximoCodigo={proximoCodigo}
        onSave={handleSavePedido}
      />
    </div>
  );
}
