import React, { useState, useEffect, useRef } from 'react';
import { Pedido, EstadoPedido, PedidoVariante } from '../types';
import { Chart, registerables } from 'chart.js';
import { 
  BarChart3, 
  Layers, 
  Search, 
  ArrowUpDown, 
  X, 
  Check, 
  Calendar,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  Edit2
} from 'lucide-react';

Chart.register(...registerables);

interface ProductionAnalyticsProps {
  pedidos: Pedido[];
  onUpdatePedidos?: (pedidos: Pedido[]) => void;
  activeTab?: 'dashboard' | 'pedidos' | 'detalle' | 'semanas' | string;
  onTabChange?: (tab: 'dashboard' | 'pedidos' | 'detalle' | 'semanas') => void;
}

export const ProductionAnalytics: React.FC<ProductionAnalyticsProps> = ({
  pedidos,
  onUpdatePedidos,
  activeTab: controlledActiveTab,
  onTabChange
}) => {
  // Navigation tabs state
  const [localActiveTab, setLocalActiveTab] = useState<'dashboard' | 'pedidos' | 'detalle' | 'semanas'>('dashboard');
  
  const activeTabMap = (tab: string): 'dashboard' | 'pedidos' | 'detalle' | 'semanas' => {
    if (tab === 'resumen') return 'dashboard';
    if (tab === 'tallas') return 'pedidos';
    if (tab === 'detalle') return 'detalle';
    if (tab === 'proyeccion') return 'semanas';
    if (tab === 'dashboard' || tab === 'pedidos' || tab === 'semanas') return tab as any;
    return 'dashboard';
  };

  const activeTab = controlledActiveTab !== undefined ? activeTabMap(controlledActiveTab) : localActiveTab;
  
  const setActiveTab = (tab: 'dashboard' | 'pedidos' | 'detalle' | 'semanas') => {
    if (onTabChange) {
      let parentTab = 'resumen';
      if (tab === 'dashboard') parentTab = 'resumen';
      if (tab === 'pedidos') parentTab = 'tallas';
      if (tab === 'detalle') parentTab = 'detalle';
      if (tab === 'semanas') parentTab = 'proyeccion';
      onTabChange(parentTab as any);
    } else {
      setLocalActiveTab(tab);
    }
  };

  // Filters State
  const [selectedSemana, setSelectedSemana] = useState<number[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<string[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string[]>([]);
  const [selectedLinea, setSelectedLinea] = useState<string[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string[]>([]);
  const [selectedSuela, setSelectedSuela] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  // Pagination states
  const [pedidoPage, setPedidoPage] = useState(1);
  const [skuPage, setSkuPage] = useState(1);
  const pedidoPageSize = 25;
  const skuPageSize = 35;

  // Sorting states
  const [pedidoSort, setPedidoSort] = useState<{ key: string; dir: number }>({ key: 'semana', dir: 1 });
  const [skuSort, setSkuSort] = useState<{ key: string; dir: number }>({ key: 'Semana', dir: 1 });

  // Slide-over & Modal statuses
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [editingPedido, setEditPedido] = useState<Pedido | null>(null);
  const [editingSKU, setEditSKU] = useState<any | null>(null);

  // Chart ref tags
  const chartStatusRef = useRef<HTMLCanvasElement | null>(null);
  const chartModeloRef = useRef<HTMLCanvasElement | null>(null);
  const chartSemanaRef = useRef<HTMLCanvasElement | null>(null);
  const chartClienteRef = useRef<HTMLCanvasElement | null>(null);
  const chartTipoRef = useRef<HTMLCanvasElement | null>(null);
  const chartEtapasRef = useRef<HTMLCanvasElement | null>(null);

  const activeCharts = useRef<Record<string, Chart | null>>({});

  // Reset pagination on filter modifications
  useEffect(() => {
    setPedidoPage(1);
    setSkuPage(1);
  }, [selectedSemana, selectedModelo, selectedCliente, selectedEstado, selectedLinea, selectedTipo, selectedSuela, searchText]);

  // Unified dynamic record constructor directly from standard pedidos state
  const D: any[] = [];
  
  if (Array.isArray(pedidos)) {
    pedidos.forEach(p => {
      if (!p || !Array.isArray(p.items)) return;
      p.items.forEach((variant, recIdx) => {
        if (!variant || !variant.tallas) return;
        
        const pr = (Object.values(variant.tallas) as any[]).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
        const docenasVar = pr / 12;
        
        let t = variant.tipo || 'CABALLERO';
        let s = variant.serie || '39/42';
        const pName = String(p.producto || '').toUpperCase();
        
        if (!variant.tipo) {
          const sizes = Object.keys(variant.tallas).filter(sz => Number(variant.tallas[sz]) > 0).map(Number);
          if (sizes.some(sz => sz >= 29 && sz <= 34)) {
            t = 'JUNIOR';
            s = '29/34';
          } else if (pName.includes('FORCE FAST') && (sizes.includes(37) || sizes.includes(40) || sizes.includes(38))) {
            t = 'D/C';
            s = '37/40';
          } else if (sizes.some(sz => sz >= 35 && sz <= 38)) {
            if (pName.includes('NEW BR6') || pName.includes('SUPERFLY') || pName.includes('MUJER') || pName.includes('WOMEN') || pName.includes('ELEGANCE')) {
              t = 'MEDIANO MUJER';
              s = '35/38';
            } else {
              t = 'MEDIANO';
              s = '35/38';
            }
          }
        }
        
        const pedIdNum = (p.id && typeof p.id === 'string' && p.id.startsWith('p-') ? Number(p.id.replace('p-', '')) : 0) || (p.codigo && typeof p.codigo === 'string' ? Number(p.codigo.replace('PD', '')) : 0) || 0;
        
        // Date parsing helper
        const parseDate = (d: any) => {
          if (!d) return null;
          if (String(d).toLowerCase() === 'anulado') return 'anulado';
          if (String(d).toLowerCase() === 'pendiente') return 'pendiente';
          return d;
        };

        D.push({
          'n°Pedido': pedIdNum,
          Codigo: variant.codigo || `${p.codigo}-${recIdx + 1}`,
          variantId: variant.id,
          Modelo: pName,
          Color: String(variant.color || 'NEGRO').toUpperCase(),
          Linea: variant.linea || 'Deportivas/Caucho',
          Tipo: t,
          Serie: s,
          Pares: pr,
          Docena: Number(docenasVar.toFixed(1)),
          Cliente: String(p.vendedor || 'VALERIA').toUpperCase(),
          Curva: variant.curva || 'Normal',
          Seriado: variant.seriado || Object.entries(variant.tallas).filter(([sz, val]) => Number(val) > 0).map(([sz, val]) => `${sz}/${val}`).join('  '),
          Suela: variant.suela || 'Assasing',
          Semana: Number(p.semana) || 24,
          Tejido: parseDate(variant.tejido !== undefined ? variant.tejido : (['TEJIDO', 'TEJIDO Y SUELA', 'APARADO', 'MONTAJE', 'EN ALMACEN', 'EN TIENDA', 'VENDIDO'].includes(p.estado) ? 'SI' : null)),
          Planta: parseDate(variant.planta !== undefined ? variant.planta : (['TEJIDO Y SUELA', 'APARADO', 'MONTAJE', 'EN ALMACEN', 'EN TIENDA', 'VENDIDO'].includes(p.estado) ? 'SI' : null)),
          Habilitado: parseDate(variant.habilitado !== undefined ? variant.habilitado : (['APARADO', 'MONTAJE', 'EN ALMACEN', 'EN TIENDA', 'VENDIDO'].includes(p.estado) ? 'SI' : null)),
          Aparado: parseDate(variant.aparado !== undefined ? variant.aparado : (['APARADO', 'MONTAJE', 'EN ALMACEN', 'EN TIENDA', 'VENDIDO'].includes(p.estado) ? 'SI' : null)),
          Montaje: parseDate(variant.montaje !== undefined ? variant.montaje : (['MONTAJE', 'EN ALMACEN', 'EN TIENDA', 'VENDIDO'].includes(p.estado) ? 'SI' : null)),
          Almacen: parseDate(variant.almacen !== undefined ? variant.almacen : (['EN ALMACEN', 'EN TIENDA', 'VENDIDO'].includes(p.estado) ? 'SI' : null)),
          _src: p.id.startsWith('p-') && Number(pedIdNum) < 326 ? 'HOJA1' : 'LIVE'
        });
      });
    });
  }

  // Obtain unique filters from entire database
  const SEMANAS_UNIQ = Array.from(new Set(D.map(r => r.Semana))).sort((a, b) => a - b);
  const MODELOS_UNIQ = Array.from(new Set(D.map(r => r.Modelo))).sort();
  const CLIENTES_UNIQ = Array.from(new Set(D.map(r => r.Cliente))).sort();
  const ESTADOS_UNIQ = ['PEDIDO', 'TEJIDO', 'TEJIDO Y SUELA', 'APARADO', 'MONTAJE', 'EN ALMACEN', 'EN TIENDA', 'VENDIDO', 'ANULADO'];
  const LINEAS_UNIQ = Array.from(new Set(D.map(r => r.Linea).filter(Boolean))).sort();
  const TIPO_UNIQ = Array.from(new Set(D.map(r => r.Tipo).filter(Boolean))).sort();
  const SUELA_UNIQ = Array.from(new Set(D.map(r => r.Suela).filter(Boolean))).sort();

  // Helper toggle list
  const toggleFilter = (list: any[], setList: (arg: any[]) => void, val: any) => {
    if (list.includes(val)) {
      setList(list.filter(x => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const clearAllFilters = () => {
    setSelectedSemana([]);
    setSelectedModelo([]);
    setSelectedCliente([]);
    setSelectedEstado([]);
    setSelectedLinea([]);
    setSelectedTipo([]);
    setSelectedSuela([]);
    setSearchText('');
  };

  // Filter core records
  const filteredSKUs = D.filter(r => {
    if (selectedSemana.length && !selectedSemana.includes(r.Semana)) return false;
    if (selectedModelo.length && !selectedModelo.includes(r.Modelo)) return false;
    if (selectedCliente.length && !selectedCliente.includes(r.Cliente)) return false;
    if (selectedLinea.length && !selectedLinea.includes(r.Linea)) return false;
    if (selectedTipo.length && !selectedTipo.includes(r.Tipo)) return false;
    if (selectedSuela.length && !selectedSuela.includes(r.Suela)) return false;
    
    // Search string
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const searchable = `${r['n°Pedido']} ${r.Codigo} ${r.Modelo} ${r.Color} ${r.Cliente} ${r.Linea} ${r.Suela}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  // Filter orders matching filters
  const filteredPedidos = pedidos.filter(p => {
    if (selectedSemana.length && !selectedSemana.includes(p.semana)) return false;
    if (selectedModelo.length && !selectedModelo.includes(p.producto.toUpperCase())) return false;
    if (selectedCliente.length && !selectedCliente.includes((p.vendedor || 'VALERIA').toUpperCase())) return false;
    
    const pedNum = p.id && typeof p.id === 'string' ? p.id.replace('p-', '') : '';
    if (selectedEstado.length) {
      if (!selectedEstado.includes(p.estado)) return false;
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const searchStr = `${pedNum} ${p.codigo} ${p.producto} ${p.vendedor || ''}`.toLowerCase();
      if (!searchStr.includes(q)) return false;
    }
    return true;
  });

  // Safe chart render helper
  const drawChart = (id: string, canvas: HTMLCanvasElement | null, config: any) => {
    if (!canvas) return;
    if (activeCharts.current[id]) {
      activeCharts.current[id]?.destroy();
      activeCharts.current[id] = null;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      activeCharts.current[id] = new Chart(ctx, config);
    }
  };

  // Re-load and compile Chart.js graphics when filters / tabs shift
  useEffect(() => {
    if (activeTab !== 'dashboard' || filteredSKUs.length === 0) return;

    // 1. Chart Status: Doughnut
    const statusCounts: Record<string, number> = {};
    filteredPedidos.forEach(p => {
      statusCounts[p.estado] = (statusCounts[p.estado] || 0) + 1;
    });
    const statusColors: Record<string, string> = {
      'EN ALMACEN': '#10b981',
      'TEJIDO Y SUELA': '#06b6d4',
      'TEJIDO': '#4f8ef7',
      'APARADO': '#7b5cf5',
      'MONTAJE': '#f97316',
      'PEDIDO': '#5a6480',
      'PRODUCCION': '#6b7280',
      'VENDIDO': '#ec4899',
      'ANULADO': '#ef4444'
    };
    drawChart('status', chartStatusRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: Object.keys(statusCounts).map(s => statusColors[s] || '#666'),
          borderWidth: 2,
          borderColor: '#111420'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#9aa3c0', font: { size: 10, family: 'Inter' } }
          }
        }
      }
    });

    // 2. Chart Modelo: Horizontal Bar (top 8 models)
    const modeloPares: Record<string, number> = {};
    filteredSKUs.forEach(r => {
      modeloPares[r.Modelo] = (modeloPares[r.Modelo] || 0) + (r.Pares || 0);
    });
    const topModels = Object.entries(modeloPares).sort((a, b) => b[1] - a[1]).slice(0, 10);
    drawChart('modelo', chartModeloRef.current, {
      type: 'bar',
      data: {
        labels: topModels.map(e => e[0].length > 15 ? e[0].substring(0, 13) + '…' : e[0]),
        datasets: [{
          data: topModels.map(e => e[1]),
          backgroundColor: 'rgba(79,142,247,0.7)',
          borderColor: '#4f8ef7',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9aa3c0' }, grid: { color: 'rgba(42,50,80,0.3)' } },
          y: { ticks: { color: '#9aa3c0', font: { size: 9 } }, grid: { display: false } }
        }
      }
    });

    // 3. Chart Semana: Grouped Bar & Line
    const parSemMap = SEMANAS_UNIQ.map(s => filteredSKUs.filter(r => r.Semana === s).reduce((sum, r) => sum + r.Pares, 0));
    const docSemMap = SEMANAS_UNIQ.map(s => filteredSKUs.filter(r => r.Semana === s).reduce((sum, r) => sum + r.Docena, 0));
    drawChart('semana', chartSemanaRef.current, {
      type: 'bar',
      data: {
        labels: SEMANAS_UNIQ.map(s => `Sem ${s}`),
        datasets: [
          {
            label: 'Pares',
            data: parSemMap,
            backgroundColor: 'rgba(79,142,247,0.7)',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Docenas',
            data: docSemMap,
            type: 'line',
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.1)',
            pointBackgroundColor: '#f59e0b',
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9aa3c0', font: { size: 10 } } } },
        scales: {
          x: { ticks: { color: '#9aa3c0' }, grid: { color: 'rgba(42,50,80,0.3)' } },
          y: { ticks: { color: '#9aa3c0' }, grid: { color: 'rgba(42,50,80,0.2)' } },
          y1: { position: 'right', ticks: { color: '#f59e0b' }, grid: { display: false } }
        }
      }
    });

    // 4. Chart Cliente: Pie
    const clientePares: Record<string, number> = {};
    filteredSKUs.forEach(r => {
      clientePares[r.Cliente] = (clientePares[r.Cliente] || 0) + r.Pares;
    });
    const topClients = Object.entries(clientePares).sort((a, b) => b[1] - a[1]);
    const palette = ['#4f8ef7', '#7b5cf5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    drawChart('cliente', chartClienteRef.current, {
      type: 'pie',
      data: {
        labels: topClients.map(e => e[0]),
        datasets: [{
          data: topClients.map(e => e[1]),
          backgroundColor: palette.slice(0, topClients.length),
          borderWidth: 2,
          borderColor: '#111420'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#9aa3c0', font: { size: 10 } }
          }
        }
      }
    });

    // 5. Chart Tipo: Vertical Bar
    const tipoPares: Record<string, number> = {};
    filteredSKUs.forEach(r => {
      tipoPares[r.Tipo] = (tipoPares[r.Tipo] || 0) + r.Pares;
    });
    const topTypes = Object.entries(tipoPares).sort((a, b) => b[1] - a[1]);
    drawChart('tipo', chartTipoRef.current, {
      type: 'bar',
      data: {
        labels: topTypes.map(e => e[0]),
        datasets: [{
          data: topTypes.map(e => e[1]),
          backgroundColor: ['#10b981', '#7b5cf5', '#4f8ef7', '#f59e0b', '#ef4444'].slice(0, topTypes.length),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9aa3c0' }, grid: { display: false } },
          y: { ticks: { color: '#9aa3c0' }, grid: { color: 'rgba(42,50,80,0.3)' } }
        }
      }
    });

    // 6. Chart Etapas: Grouped Bar
    const etapas = ['Tejido', 'Planta', 'Habilitado', 'Aparado', 'Montaje', 'Almacen'];
    const totalSKUsCount = filteredSKUs.filter(r => r._src === 'HOJA1').length || 1;
    const completasEtapas = etapas.map(e => {
      return filteredSKUs.filter(r => {
        const val = r[e];
        if (!val) return false;
        return String(val).toUpperCase() === 'SI' || String(val).toUpperCase() === 'TEJIDO' || String(val).match(/\d{4}-\d{2}-\d{2}/);
      }).length;
    });
    drawChart('etapas', chartEtapasRef.current, {
      type: 'bar',
      data: {
        labels: etapas,
        datasets: [
          {
            label: 'Completado',
            data: completasEtapas,
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Total Taller',
            data: etapas.map(() => totalSKUsCount),
            backgroundColor: 'rgba(92,108,138,0.25)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9aa3c0' } } },
        scales: {
          x: { ticks: { color: '#9aa3c0' }, grid: { display: false } },
          y: { ticks: { color: '#9aa3c0' }, grid: { color: 'rgba(42,50,80,0.2)' } }
        }
      }
    });

    // Clean up instances on unmount/re-renders
    return () => {
      Object.keys(activeCharts.current).forEach(id => {
        activeCharts.current[id]?.destroy();
        activeCharts.current[id] = null;
      });
    };
  }, [activeTab, selectedSemana, selectedModelo, selectedCliente, selectedEstado, selectedLinea, selectedTipo, selectedSuela, searchText, pedidos]);

  // Main sums for top bar of Dark Analysis Container
  const kpiTotalPares = filteredSKUs.reduce((sum, r) => sum + (r.Pares || 0), 0);
  const kpiTotalDocenas = filteredSKUs.reduce((sum, r) => sum + (r.Docena || 0), 0);
  const kpiPedActivos = filteredPedidos.filter(p => !['ANULADO', 'VENDIDO', 'EN TIENDA'].includes(p.estado)).length;

  const activeSegmentBadge = (t: string) => {
    switch (t) {
      case 'CABALLERO': return 'badge-blue';
      case 'JUNIOR': return 'badge-orange';
      case 'D/C': return 'badge-orange';
      default: return 'badge-green';
    }
  };

  const statusBadgeHTMLText = (status: string) => {
    const statesMap: Record<string, string> = {
      'VENDIDO': 'completado',
      'EN ALMACEN': 'planta',
      'TEJIDO': 'tejido',
      'TEJIDO Y SUELA': 'planta',
      'APARADO': 'aparado',
      'MONTAJE': 'montaje',
      'PEDIDO': 'pendiente',
      'PRODUCCION': 'pendiente',
      'ANULADO': 'anulado'
    };
    return statesMap[status] || 'pendiente';
  };

  // Pipeline helper
  const pipelineWidget = (status: string) => {
    const stagesNames = ['Tej', 'Pla', 'Hab', 'Apa', 'Mon', 'Alm'];
    const mapLevel: Record<string, number> = {
      'VENDIDO': 6,
      'EN ALMACEN': 5,
      'EN TIENDA': 5,
      'MONTAJE': 4,
      'APARADO': 3,
      'TEJIDO Y SUELA': 2,
      'TEJIDO': 1,
      'PEDIDO': 0,
      'PRODUCCION': 0,
      'ANULADO': -1
    };
    const activeLevel = mapLevel[status] ?? 0;
    return (
      <div className="pipeline flex gap-1">
        {stagesNames.map((n, i) => {
          let cls = 'pipe-pending';
          if (activeLevel === -1) cls = 'pipe-cancel';
          else if (i < activeLevel) cls = 'pipe-done';
          else if (i === activeLevel - 1) cls = 'pipe-active';
          return (
            <div key={n} className={`pipe-step text-[9px] font-mono tracking-tighter ${cls}`}>
              {n}
            </div>
          );
        })}
      </div>
    );
  };

  // Stage indicator under SKU detail table
  const renderStageCell = (val: any) => {
    if (!val) return <span className="text-[#5a6480] text-xs font-bold">—</span>;
    if (String(val).toLowerCase() === 'anulado') return <span className="text-[#ef4444] text-[10px] font-bold">✕ Anulado</span>;
    if (String(val).toLowerCase() === 'pendiente') return <span className="text-[#eab308] text-xs font-bold">⏳ Pend.</span>;
    if (String(val).toUpperCase() === 'SI' || String(val).toUpperCase() === 'TEJIDO') return <span className="text-[#10b981] text-xs font-extrabold">✓ OK</span>;
    return <span className="text-[#10b981] font-mono font-bold text-[10.5px] bg-[#10b981]/10 px-1.5 py-0.5 border border-[#10b981]/25">{val}</span>;
  };

  // Sort Pedidos
  const handleSortPedido = (key: string) => {
    if (pedidoSort.key === key) {
      setPedidoSort({ key, dir: pedidoSort.dir * -1 });
    } else {
      setPedidoSort({ key, dir: 1 });
    }
  };

  // Sort SKU
  const handleSortSKU = (key: string) => {
    if (skuSort.key === key) {
      setSkuSort({ key, dir: skuSort.dir * -1 });
    } else {
      setSkuSort({ key, dir: 1 });
    }
  };

  // Update order logic triggered from Modal
  const onSavePedidoEdit = (formData: any) => {
    if (!editingPedido) return;
    if (onUpdatePedidos) {
      const updated = pedidos.map(p => {
        if (p.id === editingPedido.id) {
          return {
            ...p,
            estado: formData.status as EstadoPedido,
            producto: formData.modelo,
            vendedor: formData.vendedor,
            semana: Number(formData.semana) || p.semana,
            fecha: formData.fecha_tejido || p.fecha,
            fecha_planta: formData.fecha_planta || (p as any).fecha_planta || '—'
          };
        }
        return p;
      });
      onUpdatePedidos(updated);
    }
    setEditPedido(null);
  };

  // Update SKU (variant) logic triggered from SKU Modal
  const onSaveSKUEdit = (formData: any) => {
    if (!editingSKU) return;
    if (onUpdatePedidos) {
      const updated = pedidos.map(p => {
        const matchedIdNum = (p.id && typeof p.id === 'string' && p.id.startsWith('p-') ? Number(p.id.replace('p-', '')) : 0) || (p.codigo && typeof p.codigo === 'string' ? Number(p.codigo.replace('PD', '')) : 0) || 0;
        if (matchedIdNum === Number(editingSKU['n°Pedido'])) {
          const updatedItems = p.items.map(item => {
            if (item.codigo === editingSKU.Codigo || item.id === editingSKU.variantId) {
              return {
                ...item,
                codigo: formData.codigo,
                tipo: formData.tipo,
                serie: formData.serie,
                suela: formData.suela,
                tejido: formData.tejido || null,
                planta: formData.planta || null,
                habilitado: formData.habilitado || null,
                aparado: formData.aparado || null,
                montaje: formData.montaje || null,
                almacen: formData.almacen || null
              };
            }
            return item;
          });
          return { ...p, items: updatedItems };
        }
        return p;
      });
      onUpdatePedidos(updated);
    }
    setEditSKU(null);
  };

  // KPI Array
  const totalParesAllFiltered = filteredSKUs.reduce((sum, r) => sum + r.Pares, 0);
  const totalDocenasAllFiltered = filteredSKUs.reduce((sum, r) => sum + r.Docena, 0);
  const countUniqueOrdersF = Array.from(new Set(filteredSKUs.map(r => r['n°Pedido']))).length;
  const countUniqueModelsF = Array.from(new Set(filteredSKUs.map(r => r.Modelo))).length;
  const processCountF = filteredPedidos.filter(p => !['PENDIENTE', 'PEDIDO', 'ANULADO', 'VENDIDO'].includes(p.estado)).length;
  const completeCountF = filteredPedidos.filter(p => ['EN ALMACEN', 'VENDIDO', 'EN TIENDA'].includes(p.estado)).length;
  const pendingCountF = filteredPedidos.filter(p => ['PEDIDO', 'PENDIENTE', 'PRODUCCION'].includes(p.estado)).length;
  const anuladoCountF = filteredPedidos.filter(p => p.estado === 'ANULADO').length;

  // Sorting logics
  const sortedPedidos = [...filteredPedidos].sort((a,b) => {
    let va = a[pedidoSort.key as keyof Pedido] ?? '';
    let vb = b[pedidoSort.key as keyof Pedido] ?? '';
    if (pedidoSort.key === 'pedido') {
      va = (a.id && typeof a.id === 'string' && a.id.startsWith('p-') ? Number(a.id.replace('p-', '')) : 0) || (a.codigo && typeof a.codigo === 'string' ? Number(a.codigo.replace('PD', '')) : 0) || 0;
      vb = (b.id && typeof b.id === 'string' && b.id.startsWith('p-') ? Number(b.id.replace('p-', '')) : 0) || (b.codigo && typeof b.codigo === 'string' ? Number(b.codigo.replace('PD', '')) : 0) || 0;
    } else if (pedidoSort.key === 'modelo') {
      va = a.producto;
      vb = b.producto;
    } else if (pedidoSort.key === 'cliente') {
      va = a.vendedor || '';
      vb = b.vendedor || '';
    } else if (pedidoSort.key === 'pares') {
      va = a.items.reduce((s: number, i) => s + (Object.values(i.tallas) as any[]).reduce((tot: number, val: any) => tot + (Number(val) || 0), 0), 0);
      vb = b.items.reduce((s: number, i) => s + (Object.values(i.tallas) as any[]).reduce((tot: number, val: any) => tot + (Number(val) || 0), 0), 0);
    }
    
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * pedidoSort.dir;
    return String(va).localeCompare(String(vb)) * pedidoSort.dir;
  });

  const sortedSKUs = [...filteredSKUs].sort((a,b) => {
    const va = a[skuSort.key] ?? '';
    const vb = b[skuSort.key] ?? '';
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * skuSort.dir;
    return String(va).localeCompare(String(vb)) * skuSort.dir;
  });

  // Pages slices
  const slicePedidos = sortedPedidos.slice((pedidoPage - 1) * pedidoPageSize, pedidoPage * pedidoPageSize);
  const sliceSKUs = sortedSKUs.slice((skuPage - 1) * skuPageSize, skuPage * skuPageSize);

  return (
    <div className="analysis-dashboard-root bg-[#090b13] text-[#e8eaf0] antialiased min-h-screen p-0 m-0 relative">
      <style>{`
        .analysis-dashboard-root {
          --bg: #0a0c10;
          --bg2: #111422;
          --bg3: #181d2e;
          --card: #14192b;
          --card2: #1d253f;
          --border: #232c4a;
          --border2: #344070;
          --text: #e8eaf0;
          --text2: #9aa3c0;
          --text3: #5a6480;
          --accent: #4f8ef7;
          --green: #10b981;
          --red: #ef4444;
          --yellow: #eab308;
          --orange: #f97316;
          --cyan: #06b6d4;
          --pink: #ec4899;
          --purple: #7b5cf5;
        }

        .tab-btn {
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text2);
          border: none;
          background: none;
        }
        .tab-btn.active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 4px 14px rgba(79,142,247,0.3);
        }
        .tab-btn:hover:not(.active) {
          background: var(--card);
          color: var(--text);
        }

        /* KPI cards border indicators */
        .kd-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .kd-card:hover {
          border-color: var(--border2);
        }
        .kd-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }
        .kd-card.blue::before { background: var(--accent); }
        .kd-card.green::before { background: var(--green); }
        .kd-card.orange::before { background: var(--orange); }
        .kd-card.purple::before { background: var(--purple); }
        .kd-card.red::before { background: var(--red); }
        .kd-card.yellow::before { background: var(--yellow); }
        .kd-card.cyan::before { background: var(--cyan); }
        .kd-card.pink::before { background: var(--pink); }

        /* Badge themes */
        .btn-sel {
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text2);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .btn-sel:hover {
          border-color: var(--accent);
          color: var(--text);
        }
        .btn-sel.selected {
          border-color: var(--accent);
          background: var(--accent);
          color: #fff;
          box-shadow: 0 2px 8px rgba(79,142,247,0.25);
        }

        /* PIPELINE HUD */
        .pipe-step {
          width: 28px;
          height: 18px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .pipe-done {
          background: rgba(16,185,129,0.15);
          color: var(--green);
          border: 1px solid rgba(16,185,129,0.3);
        }
        .pipe-active {
          background: rgba(79,142,247,0.15);
          color: var(--accent);
          border: 1px solid rgba(79,142,247,0.3);
        }
        .pipe-pending {
          background: rgba(42,50,80,0.4);
          color: var(--text3);
          border: 1px solid var(--border);
        }
        .pipe-cancel {
          background: rgba(239,68,68,0.1);
          color: rgba(239,68,68,0.7);
          border: 1px solid rgba(239,68,68,0.25);
        }

        /* Statuses */
        .badge-completado { background: rgba(16,185,129,0.15); color: var(--green); }
        .badge-planta { background: rgba(6,182,212,0.15); color: var(--cyan); }
        .badge-tejido { background: rgba(79,142,247,0.15); color: var(--accent); }
        .badge-aparado { background: rgba(123,92,245,0.15); color: var(--purple); }
        .badge-montaje { background: rgba(249,115,22,0.15); color: var(--orange); }
        .badge-pendiente { background: rgba(90,100,128,0.20); color: var(--text2); }
        .badge-anulado { background: rgba(239,68,68,0.15); color: var(--red); }

        .badge-blue { background: rgba(79,142,247,0.12); color: var(--accent); border: 1px solid rgba(79,142,247,0.25); }
        .badge-green { background: rgba(16,185,129,0.12); color: var(--green); border: 1px solid rgba(16,185,129,0.25); }
        .badge-orange { background: rgba(249,115,22,0.12); color: var(--orange); border: 1px solid rgba(249,115,22,0.25); }

        /* Custom scrollbar */
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: var(--bg);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--border2);
        }
      `}</style>

      {/* TOP HEADER CONTROLS IN HUD */}
      <div className="flex items-center justify-between border-b border-[#232c4a] bg-[#0c0e18] px-6 py-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="logo w-10 h-10 bg-gradient-to-br from-[#4f8ef7] to-[#7b5cf5] rounded-xl flex items-center justify-center font-bold font-serif text-lg text-white shadow-lg">
            B
          </div>
          <div>
            <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#e8eaf0]">ANÁLISIS EN TIEMPO REAL</h3>
            <p className="text-[10.5px] text-[#9aa3c0] font-sans">Semana 22 a 25 • Matriz Inteligente Interconectada</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {kpiTotalPares > 0 && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#4f8ef7]/15 text-[#4f8ef7] px-3 py-1.5 border border-[#4f8ef7]/35 rounded-full select-none">
              {kpiTotalPares.toLocaleString()} PARES
            </span>
          )}
          {kpiTotalDocenas > 0 && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#10b981]/15 text-[#10b981] px-3 py-1.5 border border-[#10b981]/35 rounded-full select-none">
              {kpiTotalDocenas.toFixed(0)} DCC.
            </span>
          )}
        </div>
      </div>

      {/* GENERAL CONTAINER GRID */}
      <div className="max-w-none px-6 py-6 space-y-6">

        {/* RECONSTRUCTED HUD BUTTON SUBTABS */}
        <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-1.5 flex flex-wrap gap-1">
          <button onClick={() => setActiveTab('dashboard')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <span>📊</span> Dashboard
          </button>
          <button onClick={() => setActiveTab('pedidos')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'pedidos' ? 'active' : ''}`}>
            <span>📋</span> Lotes & Órdenes
          </button>
          <button onClick={() => setActiveTab('detalle')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'detalle' ? 'active' : ''}`}>
            <span>🔍</span> Detalle SKU
          </button>
          <button onClick={() => setActiveTab('semanas')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'semanas' ? 'active' : ''}`}>
            <span>📅</span> Avance Semanal
          </button>
        </div>

        {/* MULTIPLE SELECTION DEFILTERS BOX */}
        <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#232c4a]/50 pb-2">
            <span className="text-stone-400 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-[#4f8ef7]" />
              Filtros Multiselección ({filteredSKUs.length} SKUs encontrados)
            </span>
            {(selectedSemana.length > 0 || selectedModelo.length > 0 || selectedCliente.length > 0 || selectedEstado.length > 0 || selectedLinea.length > 0 || selectedTipo.length > 0 || selectedSuela.length > 0 || searchText) && (
              <button 
                onClick={clearAllFilters}
                className="text-[10px] text-pink-500 font-extrabold flex items-center gap-1 bg-pink-500/10 px-2 py-1 rounded hover:bg-pink-500/25 border border-pink-500/20 cursor-pointer"
              >
                <X size={12} /> Limpiar todo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Filter Semana */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider">Semana:</label>
              <div className="flex flex-wrap gap-1">
                {SEMANAS_UNIQ.map(s => (
                  <button 
                    key={s} 
                    onClick={() => toggleFilter(selectedSemana, setSelectedSemana, s)}
                    className={`btn-sel ${selectedSemana.includes(s) ? 'selected' : ''}`}
                  >
                    Sem {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Tipo (Género) */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider">Línea / Horma:</label>
              <div className="flex flex-wrap gap-1">
                {TIPO_UNIQ.map(t => (
                  <button 
                    key={t} 
                    onClick={() => toggleFilter(selectedTipo, setSelectedTipo, t)}
                    className={`btn-sel ${selectedTipo.includes(t) ? 'selected' : ''}`}
                  >
                    {t.length > 12 ? t.substring(0, 11) + '…' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Vendedor */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider">Cliente / Destino:</label>
              <div className="flex flex-wrap gap-1 custom-scroll max-h-24 overflow-y-auto">
                {CLIENTES_UNIQ.map(c => (
                  <button 
                    key={c} 
                    onClick={() => toggleFilter(selectedCliente, setSelectedCliente, c)}
                    className={`btn-sel ${selectedCliente.includes(c) ? 'selected' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs pt-2 border-t border-[#232c4a]/30">
            {/* Filter Modelos */}
            <div className="md:col-span-7 space-y-1.5">
              <label className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider">Modelo:</label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto custom-scroll pr-1">
                {MODELOS_UNIQ.map(m => (
                  <button 
                    key={m} 
                    onClick={() => toggleFilter(selectedModelo, setSelectedModelo, m)}
                    className={`btn-sel ${selectedModelo.includes(m) ? 'selected' : ''}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* General search */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[10.5px] uppercase font-bold text-stone-400 tracking-wider">Buscar por término:</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Modelo, color, código, pedido..."
                  className="w-full bg-[#0a0c10] border border-[#232c4a] rounded-lg py-2.5 pl-9 pr-8 text-xs font-bold text-[#e8eaf0] tracking-wider placeholder-stone-605 uppercase focus:outline-none focus:border-[#4f8ef7]"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-stone-500" />
                {searchText && (
                  <button onClick={() => setSearchText('')} className="absolute right-3 top-3.5 text-stone-500 hover:text-white">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW TAB: DASHBOARD */}
        {/* ============================================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI MATRIX */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="kd-card blue">
                <span className="text-[#9aa3c0] text-[9.5px] font-extrabold uppercase tracking-widest block">Total Pares</span>
                <div className="text-3xl font-black text-[#4f8ef7] font-serif italic mt-1.5">{totalParesAllFiltered.toLocaleString()}</div>
                <div className="text-[10px] text-stone-400 font-mono mt-1">{totalDocenasAllFiltered.toFixed(1)} Docenas</div>
              </div>
              <div className="kd-card purple">
                <span className="text-[#9aa3c0] text-[9.5px] font-extrabold uppercase tracking-widest block">Pedidos Cobertos</span>
                <div className="text-3xl font-black text-[#7b5cf5] font-serif italic mt-1.5">{countUniqueOrdersF}</div>
                <div className="text-[10px] text-stone-400 font-mono mt-1">Semanas en pantalla: {selectedSemana.length ? selectedSemana.join(', ') : 'Todas'}</div>
              </div>
              <div className="kd-card green">
                <span className="text-[#9aa3c0] text-[9.5px] font-extrabold uppercase tracking-widest block">Modelos Taller</span>
                <div className="text-3xl font-black text-[#10b981] font-serif italic mt-1.5">{countUniqueModelsF}</div>
                <div className="text-[10px] text-stone-400 font-mono mt-1">Línea activa</div>
              </div>
              <div className="kd-card orange">
                <span className="text-[#9aa3c0] text-[9.5px] font-extrabold uppercase tracking-widest block">En Producción</span>
                <div className="text-3xl font-black text-[#f97316] font-serif italic mt-1.5">{processCountF}</div>
                <div className="text-[10px] text-stone-400 font-mono mt-1">{completeCountF} completados | {anuladoCountF} anulados</div>
              </div>
            </div>

            {/* CHART ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-3">
                <span className="text-[#9aa3c0] text-[10px] font-extrabold uppercase tracking-widest block border-b border-[#232c4a] pb-2">Estado de Órdenes</span>
                <div className="h-60 relative">
                  <canvas ref={chartStatusRef}></canvas>
                </div>
              </div>

              <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-3 lg:col-span-2">
                <span className="text-[#9aa3c0] text-[10px] font-extrabold uppercase tracking-widest block border-b border-[#232c4a] pb-2">Pares por Modelo principales</span>
                <div className="h-60 relative">
                  <canvas ref={chartModeloRef}></canvas>
                </div>
              </div>
            </div>

            {/* CHART ROW 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-3">
                <span className="text-[#9aa3c0] text-[10px] font-extrabold uppercase tracking-widest block border-b border-[#232c4a] pb-2">Producción por Semana</span>
                <div className="h-60 relative">
                  <canvas ref={chartSemanaRef}></canvas>
                </div>
              </div>

              <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-3">
                <span className="text-[#9aa3c0] text-[10px] font-extrabold uppercase tracking-widest block border-b border-[#232c4a] pb-2">Distribución por Cliente / Destinatario</span>
                <div className="h-60 relative">
                  <canvas ref={chartClienteRef}></canvas>
                </div>
              </div>
            </div>

            {/* CHART ROW 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-3">
                <span className="text-[#9aa3c0] text-[10px] font-extrabold uppercase tracking-widest block border-b border-[#232c4a] pb-2">Ratio por Tipo / Horma</span>
                <div className="h-56 relative">
                  <canvas ref={chartTipoRef}></canvas>
                </div>
              </div>

              <div className="bg-[#111422] border border-[#232c4a] rounded-xl p-5 space-y-3 lg:col-span-2">
                <span className="text-[#9aa3c0] text-[10px] font-extrabold uppercase tracking-widest block border-b border-[#232c4a] pb-2">Avance Etapas (% SKUs completados de HOJA1)</span>
                <div className="h-56 relative">
                  <canvas ref={chartEtapasRef}></canvas>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW TAB: ORDERS / LOTES */}
        {/* ============================================================ */}
        {activeTab === 'pedidos' && (
          <div className="bg-[#111422] border border-[#232c4a] rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-[#232c4a] flex items-center justify-between flex-wrap gap-4">
              <span className="text-[#e8eaf0] font-black text-sm uppercase tracking-wider">Órdenes de Producción</span>
              <span className="text-xs text-[#9aa3c0] font-mono">
                {filteredPedidos.length} de {pedidos.length} órdenes en vista
              </span>
            </div>

            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left quote-table">
                <thead className="bg-[#0c0e18] text-[#5a6480] text-[10px] font-black uppercase tracking-wider border-b border-[#232c4a]">
                  <tr>
                    <th onClick={() => handleSortPedido('pedido')} className="px-4 py-3.5 cursor-pointer hover:text-white select-none whitespace-nowrap">N° Pedido <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th onClick={() => handleSortPedido('semana')} className="px-4 py-3.5 cursor-pointer hover:text-white select-none whitespace-nowrap">Semana <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th onClick={() => handleSortPedido('modelo')} className="px-4 py-3.5 cursor-pointer hover:text-white select-none whitespace-nowrap">Modelo <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th onClick={() => handleSortPedido('cliente')} className="px-4 py-3.5 cursor-pointer hover:text-white select-none whitespace-nowrap">Vendedor <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th onClick={() => handleSortPedido('pares')} className="px-4 py-3.5 cursor-pointer hover:text-white select-none whitespace-nowrap text-right">Pares <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Docenas</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Estado</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">F. Tejido</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">F. Planta</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232c4a]/30 text-xs font-semibold">
                  {slicePedidos.map(p => {
                    const totalPares = p.items.reduce((s: number, i) => s + (Object.values(i.tallas) as any[]).reduce((tot: number, val: any) => tot + (Number(val) || 0), 0), 0);
                    const docenas = Number((totalPares/12).toFixed(1));
                    const numId = p.id && typeof p.id === 'string' && p.id.startsWith('p-') ? p.id.replace('p-', '') : (p.codigo ? p.codigo.replace('PD', '') : String(p.id));
                    
                    return (
                      <tr key={p.id} className="hover:bg-stone-500/5 transition">
                        <td className="px-4 py-3"><span className="font-mono text-[#4f8ef7] font-extrabold">#{numId}</span></td>
                        <td className="px-4 py-3 text-stone-400">S {p.semana}</td>
                        <td className="px-4 py-3 font-extrabold uppercase text-[#e8eaf0] truncate max-w-sm">{p.producto}</td>
                        <td className="px-4 py-3 uppercase text-[#9aa3c0]">{p.vendedor || 'STOCK INTERNO'}</td>
                        <td className="px-4 py-3 font-bold text-right text-stone-200">{totalPares.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-right text-stone-400">{docenas}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-black border uppercase tracking-wider rounded-md ${activeSegmentBadge(p.estado)}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-stone-500">{p.fecha || '—'}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-stone-500">{(p as any).fecha_planta || '—'}</td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setDetailPedido(p)}
                            className="bg-[#1d253f] hover:bg-[#344070] text-[#e8eaf0] p-1.5 rounded transition cursor-pointer"
                            title="Ver detalles de orden"
                          >
                            <Eye size={12} />
                          </button>
                          <button 
                            onClick={() => setEditPedido(p)}
                            className="bg-[#4f8ef7]/15 hover:bg-[#4f8ef7]/30 text-[#4f8ef7] p-1.5 rounded transition cursor-pointer"
                            title="Editar estado general"
                          >
                            <Edit2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination widgets */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#232c4a] gap-3 text-xs bg-[#0c0e18]">
              <span className="text-[#9aa3c0]">Viendo {slicePedidos.length} de {filteredPedidos.length} pedidos</span>
              <div className="flex gap-2.5">
                <button 
                  disabled={pedidoPage === 1}
                  onClick={() => setPedidoPage(pedidoPage - 1)}
                  className="px-3 py-1.5 bg-[#14192b] border border-[#232c4a] text-stone-300 disabled:opacity-40 hover:bg-stone-800 transition rounded"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#4f8ef7] text-white font-bold font-mono px-2.5 py-1 text-xs rounded">{pedidoPage}</span>
                  <span className="text-stone-400">/ {Math.max(1, Math.ceil(filteredPedidos.length / pedidoPageSize))}</span>
                </div>
                <button 
                  disabled={pedidoPage >= Math.ceil(filteredPedidos.length / pedidoPageSize)}
                  onClick={() => setPedidoPage(pedidoPage + 1)}
                  className="px-3 py-1.5 bg-[#14192b] border border-[#232c4a] text-stone-300 disabled:opacity-40 hover:bg-stone-800 transition rounded"
                >
                  Sig
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW TAB: SKU SYSTEM DETAILED GRID */}
        {/* ============================================================ */}
        {activeTab === 'detalle' && (
          <div className="bg-[#111422] border border-[#232c4a] rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-[#232c4a] flex items-center justify-between flex-wrap gap-4">
              <span className="text-[#e8eaf0] font-black text-sm uppercase tracking-wider">Detalles Consolidados por Código</span>
              <span className="text-xs text-[#9aa3c0] font-mono">
                {filteredSKUs.length} de {D.length} SKUs cargados
              </span>
            </div>

            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0e18] text-[#5a6480] text-[10px] font-black uppercase tracking-wider border-b border-[#232c4a]">
                  <tr>
                    <th onClick={() => handleSortSKU('n°Pedido')} className="px-4 py-3 cursor-pointer hover:text-white select-none whitespace-nowrap">N° Pedido <ArrowUpDown size={11} className="inline ml-1" /></th>
                    <th className="px-4 py-3 whitespace-nowrap">Código</th>
                    <th onClick={() => handleSortSKU('Modelo')} className="px-4 py-3 cursor-pointer hover:text-white select-none whitespace-nowrap">Modelo <ArrowUpDown size={11} className="inline ml-1" /></th>
                    <th className="px-4 py-3 whitespace-nowrap">Detalles / Color</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Pares</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Semana</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Tejido</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Planta</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Habilitado</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Aparado</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Montaje</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Almacen</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232c4a]/30 font-semibold text-xs">
                  {sliceSKUs.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-500/5 transition">
                      <td className="px-4 py-2.5 font-mono text-[#4f8ef7] font-extrabold text-xs">#{r['n°Pedido']}</td>
                      <td className="px-4 py-2.5 font-mono text-stone-400 font-extrabold text-[11px]">{r.Codigo}</td>
                      <td className="px-4 py-2.5 font-bold uppercase truncate max-w-[130px]">{r.Modelo}</td>
                      <td className="px-4 py-2.5 text-stone-400 capitalize max-w-[180px] truncate" title={r.Color}>{r.Color.toLowerCase()}</td>
                      <td className="px-4 py-2.5 text-right font-black text-white">{r.Pares}</td>
                      <td className="px-4 py-2.5 text-right text-stone-400">Sm {r.Semana}</td>
                      <td className="px-4 py-2.5 text-center">{renderStageCell(r.Tejido)}</td>
                      <td className="px-4 py-2.5 text-center">{renderStageCell(r.Planta)}</td>
                      <td className="px-4 py-2.5 text-center">{renderStageCell(r.Habilitado)}</td>
                      <td className="px-4 py-2.5 text-center">{renderStageCell(r.Aparado)}</td>
                      <td className="px-4 py-2.5 text-center">{renderStageCell(r.Montaje)}</td>
                      <td className="px-4 py-2.5 text-center">{renderStageCell(r.Almacen)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button 
                          onClick={() => setEditSKU(r)}
                          className="bg-[#1d253f] hover:bg-[#344070] text-[#e8eaf0] p-1.5 rounded transition cursor-pointer"
                          title="Editar estados de SKU individuales"
                        >
                          <Edit2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination widget for SKUs */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#232c4a] gap-3 text-xs bg-[#0c0e18]">
              <span className="text-[#9aa3c0]">Viendo {sliceSKUs.length} de {filteredSKUs.length} SKUs</span>
              <div className="flex gap-2.5">
                <button 
                  disabled={skuPage === 1}
                  onClick={() => setSkuPage(skuPage - 1)}
                  className="px-3 py-1.5 bg-[#14192b] border border-[#232c4a] text-stone-300 disabled:opacity-40 hover:bg-stone-800 transition rounded"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="bg-[#4f8ef7] text-white px-2.5 py-1 text-xs rounded font-bold">{skuPage}</span>
                  <span className="text-stone-400">/ {Math.max(1, Math.ceil(filteredSKUs.length / skuPageSize))}</span>
                </div>
                <button 
                  disabled={skuPage >= Math.ceil(filteredSKUs.length / skuPageSize)}
                  onClick={() => setSkuPage(skuPage + 1)}
                  className="px-3 py-1.5 bg-[#14192b] border border-[#232c4a] text-stone-300 disabled:opacity-40 hover:bg-stone-800 transition rounded"
                >
                  Sig
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW TAB: AVANCE SEMANAL DETAILS */}
        {/* ============================================================ */}
        {activeTab === 'semanas' && (
          <div className="grid grid-cols-1 gap-6">
            {SEMANAS_UNIQ.map((s, idx) => {
              const weekRecs = filteredSKUs.filter(r => r.Semana === s);
              const weekPeds = filteredPedidos.filter(p => p.semana === s);
              
              const totalParesS = weekRecs.reduce((sum, r) => sum + r.Pares, 0);
              const totalDocS = weekRecs.reduce((sum, r) => sum + r.Docena, 0).toFixed(0);

              if (totalParesS === 0 && weekPeds.length === 0) return null;

              // Top model for this week
              const modelAllocation: Record<string, number> = {};
              weekRecs.forEach(r => { modelAllocation[r.Modelo] = (modelAllocation[r.Modelo] || 0) + r.Pares; });
              const topModelForS = Object.entries(modelAllocation).sort((a,b) => b[1]-a[1]).slice(0, 5);

              const colorPalette = ['#4f8ef7', '#7b5cf5', '#f59e0b', '#10b981'];
              const curColor = colorPalette[idx % colorPalette.length];

              return (
                <div key={s} className="bg-[#111422] border border-[#232c4a] rounded-xl overflow-hidden shadow-lg">
                  <div style={{ background: `linear-gradient(135deg, ${curColor}15, ${curColor}05)` }} className="px-5 py-4 border-b border-[#232c4a] flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="text-xl font-black font-serif italic text-white">Semana {s}</h4>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">{weekPeds.length} pedidos • {weekRecs.length} variants a tallar</p>
                    </div>
                    <div className="text-right">
                      <div style={{ color: curColor }} className="text-3xl font-serif font-black italic">{totalParesS.toLocaleString()}</div>
                      <span className="text-[10.5px] text-[#9aa3c0] font-mono font-bold uppercase tracking-wider">{totalDocS} DOCENAS</span>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Models breakdown */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase text-[#5a6480] tracking-widest block">Modelos Destacados</span>
                      <div className="space-y-2">
                        {topModelForS.map(([modeloName, paresCount]) => {
                          const pct = totalParesS ? Math.round((paresCount / totalParesS) * 100) : 0;
                          return (
                            <div key={modeloName} className="space-y-1 bg-[#14192b] p-3 border border-[#232c4a] rounded shadow-xs">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold uppercase text-white truncate max-w-xs">{modeloName}</span>
                                <span style={{ color: curColor }} className="font-bold">{paresCount.toLocaleString()} p. ({pct}%)</span>
                              </div>
                              <div className="h-1 py-0.5 bg-[#0a0c10] rounded overflow-hidden">
                                <div style={{ width: `${pct}%`, backgroundColor: curColor }} className="h-full rounded" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Orders listing of the week */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase text-[#5a6480] tracking-widest block font-mono">Listado de Pedidos vinculados</span>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scroll pr-1.5">
                        {weekPeds.map(p => {
                          const num = p.id && typeof p.id === 'string' && p.id.startsWith('p-') ? p.id.replace('p-', '') : (p.codigo ? p.codigo.replace('PD', '') : String(p.id));
                          const pairsObj = p.items.reduce((sum: number, item) => sum + (Object.values(item.tallas) as any[]).reduce((s: number, q: any) => s + (Number(q) || 0), 0), 0);
                          return (
                            <div key={p.id} className="flex items-center justify-between p-2.5 bg-[#0c0e18] hover:bg-[#14192b] border border-[#232c4a] rounded transition">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[#4f8ef7] text-xs font-black">#{num}</span>
                                <span className="text-[11px] truncate max-w-[130px] font-extrabold text-stone-300 uppercase">{p.producto}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-stone-400">{pairsObj}p</span>
                                <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${activeSegmentBadge(p.estado)}`}>
                                  {p.estado}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* SLIDE-OVER: DETAILS GENERAL BAR PANEL */}
      {/* ============================================================ */}
      {detailPedido && (
        <>
          <div onClick={() => setDetailPedido(null)} className="fixed inset-0 bg-[#090b13]/60 backdrop-blur-xs z-50 transition-opacity" />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[#111422] border-l border-[#2d3858] z-50 flex flex-col shadow-2xl animate-slide-in">
            <div className="px-5 py-4 border-b border-[#232c4a] flex items-center justify-between bg-[#0c0e18]">
              <div>
                <h4 className="text-lg font-serif italic font-black text-white">Pedido #{detailPedido.id && typeof detailPedido.id === 'string' && detailPedido.id.startsWith('p-') ? detailPedido.id.replace('p-', '') : (detailPedido.codigo ? detailPedido.codigo.replace('PD', '') : String(detailPedido.id))}</h4>
                <p className="text-[10px] text-stone-405 text-stone-400 font-mono mt-0.5">Semana {detailPedido.semana} • {detailPedido.producto}</p>
              </div>
              <button onClick={() => setDetailPedido(null)} className="w-8 h-8 rounded-lg border border-[#232c4a] bg-transparent hover:bg-stone-800 text-stone-400 text-lg font-bold flex items-center justify-center cursor-pointer">×</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-6">
              
              {/* Quick stats grid */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">Atributos Clave</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#14192b] border border-[#232c4a] p-3 rounded">
                    <span className="text-[#9aa3c0] text-[10px] block">Modelo</span>
                    <strong className="text-white text-xs uppercase block mt-1">{detailPedido.producto}</strong>
                  </div>
                  <div className="bg-[#14192b] border border-[#232c4a] p-3 rounded">
                    <span className="text-[#9aa3c0] text-[10px] block">Estado</span>
                    <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-bold border uppercase tracking-wider rounded mt-1.5 ${activeSegmentBadge(detailPedido.estado)}`}>
                      {detailPedido.estado}
                    </span>
                  </div>
                  <div className="bg-[#14192b] border border-[#232c4a] p-3 rounded">
                    <span className="text-[#9aa3c0] text-[10px] block">Total Docenas</span>
                    <strong className="text-white text-sm font-mono block mt-1">{detailPedido.docenas} dcc</strong>
                  </div>
                  <div className="bg-[#14192b] border border-[#232c4a] p-3 rounded">
                    <span className="text-[#9aa3c0] text-[10px] block">Cliente / Destino</span>
                    <strong className="text-white text-xs uppercase block mt-1">{detailPedido.vendedor || 'STOCK INTERNO'}</strong>
                  </div>
                </div>
              </div>

              {/* Pipeline layout status */}
              <div className="space-y-2.5">
                <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">Flujograma del Lote</span>
                <div className="bg-[#14192b] border border-[#232c4a] p-4 rounded space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-200">Etapa Actual</span>
                    {pipelineWidget(detailPedido.estado)}
                  </div>
                </div>
              </div>

              {/* SKUs detailed view */}
              <div className="space-y-2.5">
                <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">Variantes & Curvas Tallas</span>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scroll pr-1">
                  {D.filter(x => Number(x['n°Pedido']) === ((detailPedido.id && typeof detailPedido.id === 'string' && detailPedido.id.startsWith('p-') ? Number(detailPedido.id.replace('p-', '')) : 0) || (detailPedido.codigo && typeof detailPedido.codigo === 'string' ? Number(detailPedido.codigo.replace('PD', '')) : 0)))
                    .map((item, idx) => (
                      <div key={idx} className="bg-[#0c0e18] border border-[#232c4a] p-3 rounded space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[#4f8ef7] text-[10.5px] font-extrabold">{item.Codigo || '—'}</span>
                            <span className="text-[11px] text-[#9aa3c0] font-sans block mt-0.5 uppercase tracking-wide">{item.Color}</span>
                          </div>
                          <div className="text-right">
                            <strong className="text-white text-xs">{item.Pares} pares</strong>
                            <span className="text-[10px] text-stone-500 font-mono block">{item.Docena} dcc</span>
                          </div>
                        </div>
                        {item.Seriado && (
                          <div className="text-[10px] font-bold text-stone-500 bg-[#111422] p-1.5 rounded">{item.Seriado}</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT MAIN PEDIDO */}
      {/* ============================================================ */}
      {editingPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#111422] border border-[#2d3858] max-w-lg w-full rounded-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#232c4a] flex items-center justify-between bg-[#0c0e18]">
              <span className="text-sm font-black uppercase text-[#e8eaf0]">✏️ Editar Estado de Orden — #{editingPedido.id && typeof editingPedido.id === 'string' && editingPedido.id.startsWith('p-') ? editingPedido.id.replace('p-', '') : (editingPedido.codigo ? editingPedido.codigo.replace('PD', '') : String(editingPedido.id))}</span>
              <button onClick={() => setEditPedido(null)} className="text-stone-400 hover:text-white cursor-pointer font-bold text-lg">×</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              onSavePedidoEdit({
                status: d.get('status'),
                modelo: d.get('modelo'),
                vendedor: d.get('vendedor'),
                semana: d.get('semana'),
                fecha_tejido: d.get('fecha_tejido'),
                fecha_planta: d.get('fecha_planta'),
              });
            }} className="p-5 space-y-4 text-xs font-bold text-stone-300">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Estado:</label>
                  <select name="status" defaultValue={editingPedido.estado} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]">
                    {ESTADOS_UNIQ.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Modelo:</label>
                  <input type="text" name="modelo" defaultValue={editingPedido.producto} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Vendedor / Destino:</label>
                  <input type="text" name="vendedor" defaultValue={editingPedido.vendedor || 'VALERIA'} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Semana:</label>
                  <input type="number" name="semana" defaultValue={editingPedido.semana} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#9aa3c0] block tracking-wider">Fecha Tejido:</label>
                  <input type="date" name="fecha_tejido" defaultValue={editingPedido.fecha} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#9aa3c0] block tracking-wider">Fecha Planta:</label>
                  <input type="date" name="fecha_planta" defaultValue={(editingPedido as any).fecha_planta || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setEditPedido(null)} className="px-4 py-2 border border-[#2c3858] bg-[#0c0e18] hover:bg-stone-850 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#4f8ef7] hover:bg-blue-600 text-white rounded">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT SKU stages */}
      {/* ============================================================ */}
      {editingSKU && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#111422] border border-[#2d3858] max-w-lg w-full rounded-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#232c4a] flex items-center justify-between bg-[#0c0e18]">
              <span className="text-sm font-black uppercase text-[#e8eaf0]">✏️ Editar SKU — {editingSKU.Codigo || 'Estándar'}</span>
              <button onClick={() => setEditSKU(null)} className="text-stone-400 hover:text-white cursor-pointer font-bold text-lg">×</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              
              // Edit stages within specified variant inside master `pedidos` state list
              const clone = [...pedidos];
              const p = clone.find(x => {
                const pedIdStr = String(editingSKU['n°Pedido']);
                return (x.id && typeof x.id === 'string' && x.id.startsWith('p-') ? x.id.replace('p-', '') : (x.codigo ? x.codigo.replace('PD', '') : '')) === pedIdStr;
              });
              
              if (p) {
                const updatedItems = p.items.map(item => {
                  if (item.codigo === editingSKU.Codigo || item.id === editingSKU.variantId) {
                    return {
                      ...item,
                      codigo: f.get('codigo') as string,
                      curva: f.get('curva') as string,
                      suela: f.get('suela') as string,
                      tejido: f.get('tejido') as string || null,
                      planta: f.get('planta') as string || null,
                      habilitado: f.get('habilitado') as string || null,
                      aparado: f.get('aparado') as string || null,
                      montaje: f.get('montaje') as string || null,
                      almacen: f.get('almacen') as string || null,
                    };
                  }
                  return item;
                });
                p.items = updatedItems;
                
                // Keep parent order state sync'd up
                const getIsCompleteStage = (val: any) => {
                  return val && (String(val).toUpperCase() === 'SI' || String(val).toUpperCase() === 'TEJIDO' || String(val).match(/\d{4}-\d{2}-\d{2}/));
                };

                let someTejido = p.items.some(item => getIsCompleteStage(item.tejido));
                let allTejido = p.items.every(item => getIsCompleteStage(item.tejido));
                let somePlanta = p.items.some(item => getIsCompleteStage(item.planta));
                let allPlanta = p.items.every(item => getIsCompleteStage(item.planta));
                let someAlmacen = p.items.some(item => getIsCompleteStage(item.almacen));
                let allAlmacen = p.items.every(item => getIsCompleteStage(item.almacen));

                if (allAlmacen) p.estado = 'EN ALMACEN';
                else if (someAlmacen || somePlanta) p.estado = 'TEJIDO Y SUELA';
                else if (someTejido) p.estado = 'TEJIDO';
                
                if (onUpdatePedidos) onUpdatePedidos(clone);
              }
              setEditSKU(null);
            }} className="p-5 space-y-3.5 text-xs font-bold text-stone-300">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Código SKU:</label>
                  <input type="text" name="codigo" defaultValue={editingSKU.Codigo} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Curva Tallas:</label>
                  <input type="text" name="curva" defaultValue={editingSKU.Curva} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Suela / Planta:</label>
                  <input type="text" name="suela" defaultValue={editingSKU.Suela} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Tejido (SI | Fecha):</label>
                  <input type="text" name="tejido" defaultValue={editingSKU.Tejido || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Planta (SI | Fecha):</label>
                  <input type="text" name="planta" defaultValue={editingSKU.Planta || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs font-bold rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Habilitado:</label>
                  <input type="text" name="habilitado" placeholder="SI o fecha" defaultValue={editingSKU.Habilitado || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 rounded text-xs select-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-bold text-[#9aa3c0]">Aparado:</label>
                  <input type="text" name="aparado" defaultValue={editingSKU.Aparado || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs uppercase rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#9aa3c0]">Montaje:</label>
                  <input type="text" name="montaje" defaultValue={editingSKU.Montaje || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs uppercase rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#9aa3c0]">Almacén</label>
                  <input type="text" name="almacen" defaultValue={editingSKU.Almacen || ''} className="w-full bg-[#0a0c10] border border-[#232c4a] p-2 text-xs uppercase rounded focus:outline-none focus:border-[#4f8ef7]" />
                </div>
              </div>

              <div className="p-3 bg-[#0c0e18] border border-[#232c4a] text-stone-400 font-medium text-[11px] leading-relaxed">
                💡 <strong>Consejo de César:</strong> Escribe "SI" para completar la etapa al instante, o la fecha YYYY-MM-DD para reportar el fin de ciclo exacto. Deja vacío para reiniciarlo a PENDIENTE.
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setEditSKU(null)} className="px-4 py-2 border border-[#2c3858] bg-[#0c0e18] hover:bg-stone-850 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#4f8ef7] hover:bg-blue-600 text-white font-bold rounded transition cursor-pointer">💾 Guardar SKU</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
