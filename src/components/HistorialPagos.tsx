import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Printer, 
  Coins, 
  Calendar,
  User,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface PayoutRecord {
  id: string; // workerName + periodId
  worker: string;
  periodId: string;
  paidDate: string;
  ordersCount: number;
  totalDocenas: number;
  totalPagar: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const HistorialPagos: React.FC = () => {
  const [payments, setPayments] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('TODOS');
  const [yearFilter, setYearFilter] = useState('TODOS');

  // Track auth state
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
  }, []);

  // Load state and listen to firestore for all 4 workers
  useEffect(() => {
    const workers = [
      { name: 'Santos', ordersColl: 'destajos_santos', payoutsColl: 'santosPayouts', storagePrefix: 'brixton_santos' },
      { name: 'Carlos', ordersColl: 'carlosOrders', payoutsColl: 'carlosPayouts', storagePrefix: 'brixton_carlos' },
      { name: 'Jonas', ordersColl: 'jonasOrders', payoutsColl: 'jonasPayouts', storagePrefix: 'brixton_jonas' },
      { name: 'Cristhian', ordersColl: 'cristhianOrders', payoutsColl: 'cristhianPayouts', storagePrefix: 'brixton_cristhian' }
    ];

    // Local state map for real-time aggregation
    const ordersDataMap: Record<string, any[]> = {};
    const payoutsDataMap: Record<string, Record<string, string>> = {};

    // Helper to consolidate and compute payouts list
    const computePaymentsList = () => {
      const list: PayoutRecord[] = [];

      workers.forEach(w => {
        const payouts = payoutsDataMap[w.name] || {};
        const orders = ordersDataMap[w.name] || [];

        Object.entries(payouts).forEach(([periodId, paidDate]) => {
          if (!paidDate) return; // Only display periods with registered payment date

          // Filter orders for this period to calculate stats
          const periodOrders = orders.filter(o => o.periodoId === periodId);
          const docenas = periodOrders.reduce((sum, o) => sum + o.docenas, 0);
          const total = periodOrders.reduce((sum, o) => sum + o.total, 0);

          list.push({
            id: `${w.name}_${periodId}`,
            worker: w.name,
            periodId,
            paidDate,
            ordersCount: periodOrders.length,
            totalDocenas: Number(docenas.toFixed(2)),
            totalPagar: Number(total.toFixed(2))
          });
        });
      });

      // Sort by paidDate desc
      list.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
      setPayments(list);
    };

    // Load from localStorage as fast fallback
    workers.forEach(w => {
      const savedOrders = localStorage.getItem(`${w.storagePrefix}_ordenes`);
      const savedPayouts = localStorage.getItem(`${w.storagePrefix}_fechas_pagadas`);
      if (savedOrders) {
        try { ordersDataMap[w.name] = JSON.parse(savedOrders); } catch {}
      }
      if (savedPayouts) {
        try { payoutsDataMap[w.name] = JSON.parse(savedPayouts); } catch {}
      }
    });
    computePaymentsList();

    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to Firestore changes for all 4 workers
    const unsubs: (() => void)[] = [];

    workers.forEach(w => {
      // 1. Subscribe Payouts
      const unsubPay = onSnapshot(collection(db, w.payoutsColl), (snapshot) => {
        const remoteFechas: Record<string, string> = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.periodId) {
            remoteFechas[data.periodId] = data.paidDate;
          }
        });
        payoutsDataMap[w.name] = remoteFechas;
        computePaymentsList();
      }, (error) => {
        console.error(`Error loading payouts for ${w.name}:`, error);
      });

      // 2. Subscribe Orders
      const unsubOrd = onSnapshot(collection(db, w.ordersColl), (snapshot) => {
        const remoteOrds: any[] = [];
        snapshot.forEach((d) => {
          remoteOrds.push(d.data());
        });
        ordersDataMap[w.name] = remoteOrds;
        computePaymentsList();
      }, (error) => {
        console.error(`Error loading orders for ${w.name}:`, error);
      });

      unsubs.push(unsubPay);
      unsubs.push(unsubOrd);
    });

    setLoading(false);

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [currentUser]);

  // Helper to translate periodId into human friendly quincena text
  const formatPeriodId = (periodId: string) => {
    const parts = periodId.split('-');
    if (parts.length < 3) return periodId;
    const [type, m, y] = parts;
    const typeText = type === 'Q1' ? '1a Quincena' : '2da Quincena (Fin de Mes)';
    const monthText = MESES[parseInt(m) - 1] || '';
    return `${typeText} — ${monthText} ${y}`;
  };

  // Filtered record list
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.periodId.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          p.paidDate.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          formatPeriodId(p.periodId).toLowerCase().includes(searchFilter.toLowerCase());
    const matchesWorker = workerFilter === 'TODOS' || p.worker.toLowerCase() === workerFilter.toLowerCase();
    
    const parts = p.periodId.split('-');
    const year = parts[2] || '';
    const matchesYear = yearFilter === 'TODOS' || year === yearFilter;

    return matchesSearch && matchesWorker && matchesYear;
  });

  // KPI Calculations
  const totalPaidAmount = filteredPayments.reduce((sum, p) => sum + p.totalPagar, 0);
  const totalPaidDocenas = filteredPayments.reduce((sum, p) => sum + p.totalDocenas, 0);
  const totalPaidOrders = filteredPayments.reduce((sum, p) => sum + p.ordersCount, 0);

  const handleExportCSV = () => {
    let csv = 'ID,OPERARIO,FECHA DE PAGO,PERIODO ID,PERIODO DETALLE,CANTIDAD DOCENAS,PARES EQUIVALENTES,MONTO PAGADO (S/)\n';
    filteredPayments.forEach(p => {
      const detail = formatPeriodId(p.periodId);
      csv += `${p.id},"${p.worker}",${p.paidDate},${p.periodId},"${detail}",${p.totalDocenas},${Math.round(p.totalDocenas * 12)},${p.totalPagar}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Historial_De_Pagos_Destajos.csv';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-none w-full font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* HEADER SECTION (HIDDEN ON PRINT) */}
      <div className="no-print bg-[#0F172A] border-2 border-slate-900 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.2em] font-black bg-emerald-950 px-2.5 py-1 border border-emerald-500/30 text-emerald-300 font-mono">
              SISTEMA INTEGRADO DE CAJA
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold italic uppercase tracking-tight text-white mt-2 font-serif">
            HISTORIAL DE PAGOS A TRABAJADORES
          </h1>
          <p className="text-xs text-emerald-200 mt-1 uppercase font-semibold tracking-wider">
            Base de datos maestra de liquidaciones registradas por fecha y quincena
          </p>
        </div>
        
        <div className="bg-slate-900/60 p-3 border border-emerald-500/30 text-right font-mono text-2xs uppercase">
          <div className="font-extrabold text-emerald-300 flex items-center justify-end gap-1">
            <Database size={12} className="animate-pulse" />
            Almacenamiento de Pagos
          </div>
          <div className="text-stone-300 mt-1 font-bold">FECHA HOY: {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="no-print bg-white border-2 border-slate-900 p-5 shadow-sm space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-black text-slate-800 border-b border-stone-200 pb-2 flex items-center justify-between">
          <span>🔍 Filtros de Búsqueda y Auditoría de Caja</span>
          <span className="text-3xs font-mono font-bold text-stone-500">FIDELIDAD E INTEGRIDAD DE DATOS</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Buscar por fecha o periodo</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-stone-400" size={13} />
              <input
                type="text"
                placeholder="Ej: 2026-06 o Junio..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 pl-8 pr-3 py-1.5 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-none uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Operario</label>
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 px-2.5 py-1.5 text-xs font-bold focus:bg-white rounded-none cursor-pointer"
            >
              <option value="TODOS">TODOS LOS OPERARIOS</option>
              <option value="Santos">SANTOS</option>
              <option value="Carlos">CARLOS</option>
              <option value="Jonas">JONAS</option>
              <option value="Cristhian">CRISTHIAN</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Año</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 px-2.5 py-1.5 text-xs font-bold focus:bg-white rounded-none cursor-pointer"
            >
              <option value="TODOS">TODOS LOS AÑOS</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-2xs font-black uppercase py-2.5 px-4 flex items-center justify-center gap-2 transition rounded-none cursor-pointer border border-slate-950"
            >
              <FileSpreadsheet size={13} />
              EXPORTAR HISTORIAL CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI TOTALIZERS (AUTO CALCULATES ON-THE-FLY BASED ON FILTERS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-stone-200 bg-white p-4 shadow-xs">
          <span className="block text-[8px] font-extrabold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={10} className="text-stone-400" />
            LIQUIDACIONES FILTRADAS
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{filteredPayments.length} PERIODOS PAGADOS</span>
          <span className="text-3xs text-stone-500 font-mono block mt-0.5 uppercase tracking-wide">
            Cajas y registros auditados de quincenas cerradas
          </span>
        </div>
        
        <div className="border border-stone-200 bg-white p-4 shadow-xs">
          <span className="block text-[8px] font-extrabold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={10} className="text-stone-400" />
            DOCENAS TOTALES LIQUIDADAS
          </span>
          <span className="text-2xl font-black text-blue-800 block mt-1">{totalPaidDocenas.toLocaleString()} DOCS</span>
          <span className="text-3xs text-stone-500 font-mono block mt-0.5 uppercase tracking-wide">
            Equivalente a {(totalPaidDocenas * 12).toLocaleString()} pares procesados en planta
          </span>
        </div>

        <div className="border-2 border-emerald-950 bg-emerald-50/20 p-4 shadow-xs">
          <span className="block text-[8px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <Coins size={10} className="text-emerald-700" />
            SUMATORIA DE DESEMBOLSOS EFECTUADOS
          </span>
          <span className="text-3xl font-black text-emerald-700 block mt-1">S/ {totalPaidAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-3xs text-emerald-800 font-bold block mt-0.5 uppercase tracking-wide">
            Suma exacta de dinero pagado de caja chica a destajistas
          </span>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white border-2 border-slate-900 p-6 shadow-sm">
        <div className="flex justify-between items-center border-b border-stone-200 pb-3 mb-4">
          <h3 className="text-xs uppercase tracking-widest font-black text-slate-800">
            Base de Datos de Pagos Registrados por Fecha de Liquidación
          </h3>
          <button
            onClick={() => window.print()}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-mono text-3xs font-black uppercase py-1.5 px-3 flex items-center gap-1 transition rounded-none cursor-pointer no-print"
          >
            <Printer size={12} />
            Imprimir Reporte de Caja
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            <p className="text-2xs text-stone-500 font-bold uppercase mt-2">Cargando base de datos de pagos...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-stone-200">
            <Database className="mx-auto text-stone-300 mb-2" size={32} />
            <p className="text-xs text-stone-500 font-extrabold uppercase">
              No se encontraron registros de pagos para los filtros seleccionados.
            </p>
            <p className="text-2xs text-stone-400 mt-1 uppercase font-medium">
              Vaya a las pestañas de destajo de cada trabajador para marcar un período como pagado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200">
            <table className="w-full text-left text-2xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 uppercase font-black tracking-wider text-slate-700">
                  <th className="p-3">FECHA DE PAGO</th>
                  <th className="p-3">TRABAJADOR / OPERARIO</th>
                  <th className="p-3">ID PERÍODO</th>
                  <th className="p-3">QUINCENA / DETALLE DEL PERIODO</th>
                  <th className="p-3 text-right">CANTIDAD (DOCENAS)</th>
                  <th className="p-3 text-right">PARES EQUIV.</th>
                  <th className="p-3 text-right">ÓRDENES</th>
                  <th className="p-3 text-right">MONTO COBRADO (S/)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-mono font-medium text-slate-700">
                {filteredPayments.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3 font-sans font-black text-slate-900 whitespace-nowrap">
                      📅 {record.paidDate}
                    </td>
                    <td className="p-3 font-sans">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 border border-stone-200 bg-stone-50 text-slate-900 font-black uppercase text-[10px] rounded-none">
                        <User size={10} className="text-stone-400" />
                        {record.worker.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-stone-200 border border-stone-300 text-stone-800 px-1 py-0.5 uppercase rounded-2xs text-[9px] font-bold">
                        {record.periodId}
                      </span>
                    </td>
                    <td className="p-3 font-sans font-bold text-stone-600">
                      {formatPeriodId(record.periodId)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {record.totalDocenas.toFixed(2)} DOCS
                    </td>
                    <td className="p-3 text-right text-stone-500 font-bold">
                      {Math.round(record.totalDocenas * 12)} PARES
                    </td>
                    <td className="p-3 text-right font-bold text-stone-600">
                      {record.ordersCount} Lotes
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700 text-[11px]">
                      S/ {record.totalPagar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-100 font-black uppercase border-t-2 border-stone-300 text-slate-950 text-[10.5px]">
                  <td className="p-3" colSpan={4}>TOTAL ACUMULADO AUDITADO EN CAJA</td>
                  <td className="p-3 text-right text-slate-900">{totalPaidDocenas.toFixed(2)} docs</td>
                  <td className="p-3 text-right text-stone-600">{Math.round(totalPaidDocenas * 12)} pares</td>
                  <td className="p-3 text-right text-stone-700">{totalPaidOrders} lotes</td>
                  <td className="p-3 text-right text-emerald-800">S/ {totalPaidAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
