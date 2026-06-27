import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  X, 
  FileText, 
  Printer, 
  Check, 
  Lock, 
  Coins, 
  Calendar,
  Save,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { Pedido } from '../types';
import { CATALOGO_REAL } from './CatalogoModelos';

export interface Operation {
  id: number;
  operario: string;
  area: string;
  modelo: string;
  pieza: string;
  precio: number;
}

export interface OrderOp {
  pieza: string;
  precio: number;
  subtotal: number;
}

export interface DestajoOrder {
  id: number;
  numero: string;
  modelo: string;
  docenas: number;
  fecha: string;
  periodoId: string; // e.g. "Q1-6-2026"
  operaciones: OrderOp[];
  total: number;
  registrado: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DEFAULT_IMAGE_MODELS_SANTOS = [
  'ABSOLUTE',
  'EXT SPORT SCOLAR',
  'DRIBING ESCOLAR',
  'FORCE FAST ASSASING',
  'FORCE FAST CHIMPUN 01',
  'FORCE FAST ELITE 2026',
  'KILLER 2026',
  'LION -MESSI',
  'MASTER 2026',
  'NEW FLEX',
  'NEW FLEX CHIMPUN',
  'PANTHER',
  'PRECISION 2026',
  'PRECISION CHIMPUN 2026',
  'PRECISION PRINT 27',
  'RUNNING MESH RAM 00',
  'SOCCER B26',
  'SPEED 2026',
  'SUPERFLY',
  'TOWER 2026',
  'VENOM 2026',
  'WALKING 2026'
];

interface TrabajadorDestajoProps {
  workerName: string;
  areaName: string;
  operationsCollection: string;
  ordersCollection: string;
  payoutsCollection: string;
  initialDb: Operation[];
  localStoragePrefix: string;
  piezasDefault: string[];
  pedidos?: Pedido[];
}

export const TrabajadorDestajo: React.FC<TrabajadorDestajoProps> = ({
  workerName,
  areaName,
  operationsCollection,
  ordersCollection,
  payoutsCollection,
  initialDb,
  localStoragePrefix,
  piezasDefault,
  pedidos
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'bd' | 'nueva_orden' | 'pago_total' | 'resumen'>('nueva_orden');

  // Core States
  const [bd, setBd] = useState<Operation[]>([]);
  const [ordenes, setOrdenes] = useState<DestajoOrder[]>([]);
  const [fechasPagadas, setFechasPagadas] = useState<Record<string, string>>({}); // periodoId -> dateString

  // DB Filter / Add states
  const [dbSearch, setDbSearch] = useState('');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

  // Matrix specific states
  const [dbViewMode, setDbViewMode] = useState<'matrix' | 'list'>('matrix');
  const [newMatrixModel, setNewMatrixModel] = useState('');
  const [customModels, setCustomModels] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${localStoragePrefix}_custom_models`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save custom models to localstorage when they change
  useEffect(() => {
    localStorage.setItem(`${localStoragePrefix}_custom_models`, JSON.stringify(customModels));
  }, [customModels, localStoragePrefix]);

  // Model category filtering state
  const [modelFilterGroup, setModelFilterGroup] = useState<string>('TODOS');

  // Dynamically calculate and filter matrix columns (exclude C. FIBRA, FIBRA, NO LLEVA ESPONJA)
  const matrixColumns = useMemo(() => {
    return Array.from(new Set([
      ...piezasDefault,
      ...bd.map(o => o.pieza).filter(Boolean)
    ])).filter(col => {
      const c = col.toUpperCase();
      return c !== 'C. FIBRA' && c !== 'FIBRA' && c !== 'NO LLEVA ESPONJA';
    });
  }, [piezasDefault, bd]);

  // Get all unique models
  const allUniqueModels = useMemo(() => {
    return Array.from(new Set([
      ...(workerName.toLowerCase() === 'santos' ? DEFAULT_IMAGE_MODELS_SANTOS : []),
      ...Array.from(new Set(bd.map(o => o.modelo).filter(Boolean))),
      ...customModels
    ])).sort((a, b) => a.localeCompare(b));
  }, [workerName, bd, customModels]);

  // Filter unique models by search text and the active category tab
  const filteredModels = useMemo(() => {
    return allUniqueModels.filter(model => {
      // Search text filter
      if (dbSearch && !model.toUpperCase().includes(dbSearch.toUpperCase())) {
        return false;
      }

      // Tab category filter
      const firstLetter = model.charAt(0).toUpperCase();
      switch (modelFilterGroup) {
        case 'A-D':
          return firstLetter >= 'A' && firstLetter <= 'D';
        case 'E-K':
          return firstLetter >= 'E' && firstLetter <= 'K';
        case 'L-O':
          return firstLetter >= 'L' && firstLetter <= 'O';
        case 'P-S':
          return firstLetter >= 'P' && firstLetter <= 'S';
        case 'T-Z':
          return firstLetter >= 'T' && firstLetter <= 'Z';
        case 'CHIMPUNES':
          return model.includes('CHIMPUN') || model.includes('SOCCER') || model.includes('DRIBING') || model.includes('LION') || model.includes('VENOM');
        case 'ESCOLAR':
          return model.includes('ESCOLAR') || model.includes('SCOLAR');
        case 'CON_TARIFAS':
          return bd.some(o => o.modelo && o.modelo.toUpperCase() === model.toUpperCase());
        case 'NUEVOS':
          return customModels.includes(model);
        case 'TODOS':
        default:
          return true;
      }
    });
  }, [allUniqueModels, dbSearch, modelFilterGroup, bd, customModels]);

  // DB Form Fields
  const [formModelo, setFormModelo] = useState('');
  const [formPieza, setFormPieza] = useState(piezasDefault[0] || '');
  const [formPrecio, setFormPrecio] = useState('0.50');

  // Order Form Fields
  const [ordNumero, setOrdNumero] = useState('');
  const [ordModelo, setOrdModelo] = useState('');
  const [ordDocenas, setOrdDocenas] = useState('');
  const [ordFecha, setOrdFecha] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Period helper: month selected and payment type (Quincena or Fin de mes)
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPeriodType, setSelectedPeriodType] = useState<'Q1' | 'Q2'>('Q1'); // Q1 = Quincena, Q2 = Fin de mes

  // Selected operations checklist for current order form
  const [selectedOps, setSelectedOps] = useState<Record<string, boolean>>({});

  // Listings Filter
  const [ordFilterSearch, setOrdFilterSearch] = useState('');
  const [ordFilterPeriod, setOrdFilterPeriod] = useState('TODOS');

  // Inline edit state for orders docenas
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingDocenas, setEditingDocenas] = useState<string>('');

  // Payout tab selection
  const [pagoMonth, setPagoMonth] = useState(() => String(new Date().getMonth() + 1));
  const [pagoYear, setPagoYear] = useState('2026');
  const [pagoPeriodType, setPagoPeriodType] = useState<'Q1' | 'Q2'>('Q1');
  const [editingPaidDate, setEditingPaidDate] = useState('');

  // Print voucher period
  const [resPeriodId, setResPeriodId] = useState('');

  // Auto-fill model and quantity (docenas) from selected Pedido/Orden
  useEffect(() => {
    if (!pedidos || pedidos.length === 0) return;
    const cleanNum = ordNumero.trim().toUpperCase();
    const matchedPedido = pedidos.find(p => p.codigo.trim().toUpperCase() === cleanNum);
    if (matchedPedido) {
      setOrdModelo(matchedPedido.producto.toUpperCase());
      setOrdDocenas(String(Math.round(matchedPedido.docenas)));
    }
  }, [ordNumero, pedidos]);

  // Auto-select corresponding pieces and prices when the model is changed/loaded
  useEffect(() => {
    const modelToMatch = ordModelo.trim().toUpperCase();
    if (!modelToMatch) {
      setSelectedOps({});
      return;
    }
    // Match exact model first
    const matching = bd.filter(o => o.modelo && o.modelo.toUpperCase() === modelToMatch);
    if (matching.length > 0) {
      const autoSelected: Record<string, boolean> = {};
      matching.forEach(op => {
        autoSelected[op.pieza] = true;
      });
      setSelectedOps(autoSelected);
    } else {
      // Partial match: check if the typed model contains or matches any defined model name in bd (e.g. NEW FLEX RED matches NEW FLEX in operations db)
      const partialMatching = bd.filter(o => o.modelo && modelToMatch.includes(o.modelo.toUpperCase()));
      if (partialMatching.length > 0) {
        const autoSelected: Record<string, boolean> = {};
        partialMatching.forEach(op => {
          autoSelected[op.pieza] = true;
        });
        setSelectedOps(autoSelected);
      } else {
        setSelectedOps({});
      }
    }
  }, [ordModelo, bd]);

  // Load state on mount
  useEffect(() => {
    // Operations Database
    const savedBd = localStorage.getItem(`${localStoragePrefix}_bd`);
    if (savedBd) {
      try {
        setBd(JSON.parse(savedBd));
      } catch {
        setBd(initialDb);
      }
    } else {
      setBd(initialDb);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(initialDb));
    }

    // Orders
    const savedOrdenes = localStorage.getItem(`${localStoragePrefix}_ordenes`);
    if (savedOrdenes) {
      try {
        setOrdenes(JSON.parse(savedOrdenes));
      } catch {
        setOrdenes([]);
      }
    }

    // Paid dates
    const savedFechas = localStorage.getItem(`${localStoragePrefix}_fechas_pagadas`);
    if (savedFechas) {
      try {
        setFechasPagadas(JSON.parse(savedFechas));
      } catch {
        setFechasPagadas({});
      }
    }

    // Default resPeriodId
    const currentPeriodId = `Q1-${new Date().getMonth() + 1}-2026`;
    setResPeriodId(currentPeriodId);
  }, [localStoragePrefix, initialDb]);

  // Firebase Real-time Synchronization Support
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Sync Operations DB
    const unsubBd = onSnapshot(collection(db, operationsCollection), async (snapshot) => {
      if (snapshot.empty) {
        const localBd = localStorage.getItem(`${localStoragePrefix}_bd`);
        let initialOps = initialDb;
        if (localBd) {
          try { initialOps = JSON.parse(localBd); } catch {}
        }
        const batch = writeBatch(db);
        initialOps.forEach((op) => {
          const cleanId = `op_${op.id}`;
          batch.set(doc(db, operationsCollection, cleanId), op);
        });
        await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, operationsCollection));
      } else {
        const remoteOps: Operation[] = [];
        snapshot.forEach((d) => {
          remoteOps.push(d.data() as Operation);
        });
        remoteOps.sort((a, b) => a.id - b.id);
        setBd(remoteOps);
        localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(remoteOps));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, operationsCollection);
    });

    // 2. Sync Orders
    const unsubOrd = onSnapshot(collection(db, ordersCollection), async (snapshot) => {
      if (snapshot.empty) {
        const localOrd = localStorage.getItem(`${localStoragePrefix}_ordenes`);
        if (localOrd) {
          try {
            const initialOrds = JSON.parse(localOrd) as DestajoOrder[];
            const batch = writeBatch(db);
            initialOrds.forEach((ord) => {
              const cleanId = `order_${ord.id}`;
              batch.set(doc(db, ordersCollection, cleanId), {
                ...ord,
                nroOrden: ord.numero || "",
                pares: Math.round((ord.docenas || 0) * 12),
                operacion: ord.operaciones?.map(o => o.pieza).join(', ') || "",
                pagoCalculado: ord.total || 0,
                timestamp: serverTimestamp()
              });
            });
            await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, ordersCollection));
          } catch {}
        }
      } else {
        const remoteOrds: DestajoOrder[] = [];
        snapshot.forEach((d) => {
          remoteOrds.push(d.data() as DestajoOrder);
        });
        remoteOrds.sort((a, b) => b.id - a.id);
        setOrdenes(remoteOrds);
        localStorage.setItem(`${localStoragePrefix}_ordenes`, JSON.stringify(remoteOrds));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ordersCollection);
    });

    // 3. Sync Payout Dates
    const unsubPay = onSnapshot(collection(db, payoutsCollection), async (snapshot) => {
      if (snapshot.empty) {
        const localFechas = localStorage.getItem(`${localStoragePrefix}_fechas_pagadas`);
        if (localFechas) {
          try {
            const initialFechas = JSON.parse(localFechas) as Record<string, string>;
            const batch = writeBatch(db);
            Object.entries(initialFechas).forEach(([periodId, paidDate]) => {
              const cleanId = periodId.replace(/[^A-Za-z0-9_-]/g, '_');
              batch.set(doc(db, payoutsCollection, cleanId), { periodId, paidDate });
            });
            await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, payoutsCollection));
          } catch {}
        }
      } else {
        const remoteFechas: Record<string, string> = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.periodId) {
            remoteFechas[data.periodId] = data.paidDate;
          }
        });
        setFechasPagadas(remoteFechas);
        localStorage.setItem(`${localStoragePrefix}_fechas_pagadas`, JSON.stringify(remoteFechas));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, payoutsCollection);
    });

    return () => {
      unsubBd();
      unsubOrd();
      unsubPay();
    };
  }, [currentUser, operationsCollection, ordersCollection, payoutsCollection, localStoragePrefix, initialDb]);

  // Sync state for editing payment date whenever dropdown selections change in Payout Tab
  const payoutPeriodId = `${pagoPeriodType}-${pagoMonth}-${pagoYear}`;
  useEffect(() => {
    setEditingPaidDate(fechasPagadas[payoutPeriodId] || '');
  }, [pagoMonth, pagoYear, pagoPeriodType, fechasPagadas, payoutPeriodId]);

  // Generator for period lists (24 periods per year)
  const getPeriodList = () => {
    const list: { id: string; label: string; tipo: string; inicio: string; fin: string; fechaPago: string }[] = [];
    for (let m = 1; m <= 12; m++) {
      const lastDay = new Date(Number(pagoYear), m, 0).getDate();
      list.push({
        id: `Q1-${m}-${pagoYear}`,
        label: `Quincena 1a — ${MESES[m - 1]} ${pagoYear}`,
        tipo: 'Quincena',
        inicio: `${pagoYear}-${String(m).padStart(2, '0')}-01`,
        fin: `${pagoYear}-${String(m).padStart(2, '0')}-15`,
        fechaPago: `${pagoYear}-${String(m).padStart(2, '0')}-15`
      });
      list.push({
        id: `Q2-${m}-${pagoYear}`,
        label: `Quincena 2a (Fin de Mes) — ${MESES[m - 1]} ${pagoYear}`,
        tipo: 'Fin de mes',
        inicio: `${pagoYear}-${String(m).padStart(2, '0')}-16`,
        fin: `${pagoYear}-${String(m).padStart(2, '0')}-${lastDay}`,
        fechaPago: `${pagoYear}-${String(m).padStart(2, '0')}-${lastDay}`
      });
    }
    return list;
  };

  const PERIODS = getPeriodList();
  const currentOrderPeriodId = `${selectedPeriodType}-${selectedMonth}-${selectedYear}`;

  // Unique models list
  const getUniqueModels = () => {
    const models = bd.map(o => o.modelo.trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set(models)).sort();
  };

  const modelsList = getUniqueModels();

  // Filtered operations for DB view
  const filteredDbOps = bd.filter(op => {
    const p = op.pieza.toUpperCase();
    if (p === 'C. FIBRA' || p === 'FIBRA' || p === 'NO LLEVA ESPONJA') {
      return false;
    }
    const matchesSearch = op.modelo.toLowerCase().includes(dbSearch.toLowerCase()) || 
                          op.pieza.toLowerCase().includes(dbSearch.toLowerCase());
    return matchesSearch;
  });

  // DB Saving
  const handleOpenAddDb = () => {
    setEditingOp(null);
    setFormModelo('');
    setFormPieza(piezasDefault[0] || '');
    setFormPrecio('0.50');
    setIsDbModalOpen(true);
  };

  const handleOpenEditDb = (op: Operation) => {
    setEditingOp(op);
    setFormModelo(op.modelo);
    setFormPieza(op.pieza);
    setFormPrecio(String(op.precio));
    setIsDbModalOpen(true);
  };

  const handleSaveDbOp = (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = parseFloat(formPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      alert('Por favor ingrese un precio válido.');
      return;
    }

    const finalPieza = formPieza.trim().toUpperCase();
    if (!finalPieza) {
      alert('Por favor especifique la pieza.');
      return;
    }

    if (editingOp) {
      // Edit
      const updatedOp = {
        ...editingOp,
        modelo: formModelo.trim().toUpperCase(),
        pieza: finalPieza,
        precio: precioNum
      };
      const updatedBd = bd.map(o => o.id === editingOp.id ? updatedOp : o);
      setBd(updatedBd);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updatedBd));

      if (currentUser) {
        const cleanId = `op_${editingOp.id}`;
        setDoc(doc(db, operationsCollection, cleanId), updatedOp)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `${operationsCollection}/${cleanId}`));
      }
    } else {
      // Add
      const nextId = Math.max(...bd.map(o => o.id), 0) + 1;
      const newOp: Operation = {
        id: nextId,
        operario: workerName,
        area: areaName,
        modelo: formModelo.trim().toUpperCase(),
        pieza: finalPieza,
        precio: precioNum
      };
      const updatedBd = [...bd, newOp];
      setBd(updatedBd);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updatedBd));

      if (currentUser) {
        const cleanId = `op_${newOp.id}`;
        setDoc(doc(db, operationsCollection, cleanId), newOp)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `${operationsCollection}/${cleanId}`));
      }
    }

    setIsDbModalOpen(false);
  };

  const handleDeleteDbOp = (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta operación?')) return;
    const updated = bd.filter(o => o.id !== id);
    setBd(updated);
    localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updated));

    if (currentUser) {
      const cleanId = `op_${id}`;
      deleteDoc(doc(db, operationsCollection, cleanId))
        .catch(e => handleFirestoreError(e, OperationType.DELETE, `${operationsCollection}/${cleanId}`));
    }
  };

  // Get standard price for a piece (used when checking a box to default the price)
  const getStandardPriceForPiece = (pieza: string): number => {
    // Look up in general pieces (where model is empty) first
    const generalOp = bd.find(o => !o.modelo && o.pieza.toUpperCase() === pieza.toUpperCase());
    if (generalOp) return generalOp.precio;

    // Look up any existing piece price in database to be consistent
    const anyOp = bd.find(o => o.pieza.toUpperCase() === pieza.toUpperCase());
    if (anyOp) return anyOp.precio;

    // Default to 0.50 if not found
    return 0.50;
  };

  // Toggle check/uncheck for a matrix cell
  const onToggleMatrixCell = async (model: string, pieza: string) => {
    const cleanModel = model.trim().toUpperCase();
    const cleanPieza = pieza.trim().toUpperCase();

    // Find if this operation already exists
    // (If cleanModel is empty, it refers to standard operations for todos los modelos)
    const existingOp = bd.find(o => 
      (cleanModel ? (o.modelo && o.modelo.toUpperCase() === cleanModel) : !o.modelo) && 
      o.pieza.toUpperCase() === cleanPieza
    );

    if (existingOp) {
      // Uncheck: Remove the operation from database
      const updated = bd.filter(o => o.id !== existingOp.id);
      setBd(updated);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updated));

      if (currentUser) {
        const cleanId = `op_${existingOp.id}`;
        await deleteDoc(doc(db, operationsCollection, cleanId))
          .catch(e => handleFirestoreError(e, OperationType.DELETE, `${operationsCollection}/${cleanId}`));
      }
    } else {
      // Check: Add a new operation with standard/default price
      const nextId = Math.max(...bd.map(o => o.id), 0) + 1;
      const defaultPrice = getStandardPriceForPiece(cleanPieza);

      const newOp: Operation = {
        id: nextId,
        operario: workerName,
        area: areaName,
        modelo: cleanModel,
        pieza: cleanPieza,
        precio: defaultPrice
      };

      const updated = [...bd, newOp];
      setBd(updated);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updated));

      if (currentUser) {
        const cleanId = `op_${newOp.id}`;
        await setDoc(doc(db, operationsCollection, cleanId), newOp)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `${operationsCollection}/${cleanId}`));
      }
    }
  };

  // Update price in real-time or blur inside the matrix cell
  const onUpdateMatrixPrice = async (model: string, pieza: string, newPrice: number) => {
    const cleanModel = model.trim().toUpperCase();
    const cleanPieza = pieza.trim().toUpperCase();

    const existingOp = bd.find(o => 
      (cleanModel ? (o.modelo && o.modelo.toUpperCase() === cleanModel) : !o.modelo) && 
      o.pieza.toUpperCase() === cleanPieza
    );

    if (existingOp) {
      const updatedOp = { ...existingOp, precio: Number(newPrice) || 0 };
      const updated = bd.map(o => o.id === existingOp.id ? updatedOp : o);
      setBd(updated);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updated));

      if (currentUser) {
        const cleanId = `op_${existingOp.id}`;
        await setDoc(doc(db, operationsCollection, cleanId), updatedOp)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `${operationsCollection}/${cleanId}`));
      }
    }
  };

  // Add a new model row to the matrix list
  const handleAddMatrixModel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanModel = newMatrixModel.trim().toUpperCase();
    if (!cleanModel) return;

    if (
      (workerName.toLowerCase() === 'santos' && DEFAULT_IMAGE_MODELS_SANTOS.includes(cleanModel)) || 
      bd.some(o => o.modelo && o.modelo.toUpperCase() === cleanModel) ||
      customModels.includes(cleanModel)
    ) {
      alert('Este modelo ya existe en la base de datos o en la matriz.');
      return;
    }

    setCustomModels(prev => [...prev, cleanModel]);
    setNewMatrixModel('');
  };

  // Remove custom model row from matrix if it has no checked operations
  const handleRemoveMatrixModel = (modelName: string) => {
    const hasOps = bd.some(o => o.modelo && o.modelo.toUpperCase() === modelName.toUpperCase());
    if (hasOps) {
      if (!confirm(`El modelo ${modelName} tiene operaciones configuradas. ¿Está seguro de quitarlo de la matriz? (Se borrarán sus operaciones de la base de datos)`)) {
        return;
      }
      // Remove all operations for this model
      const updatedOps = bd.filter(o => !o.modelo || o.modelo.toUpperCase() !== modelName.toUpperCase());
      setBd(updatedOps);
      localStorage.setItem(`${localStoragePrefix}_bd`, JSON.stringify(updatedOps));

      if (currentUser) {
        // Find and delete from firestore
        const opsToDelete = bd.filter(o => o.modelo && o.modelo.toUpperCase() === modelName.toUpperCase());
        opsToDelete.forEach(async (o) => {
          const cleanId = `op_${o.id}`;
          await deleteDoc(doc(db, operationsCollection, cleanId)).catch(() => {});
        });
      }
    }

    setCustomModels(prev => prev.filter(m => m !== modelName));
  };

  const handleExportCSV = () => {
    let csv = 'ID,OPERARIO,AREA,MODELO,PIEZA,PRECIO\n';
    bd.forEach(r => {
      csv += `${r.id},${r.operario},${r.area},"${r.modelo}","${r.pieza}",${r.precio}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BD_Destajo_${workerName}.csv`;
    a.click();
  };

  // Get operations list for order form (matching typed model, or generic ones without specific model)
  const getActiveOpsForForm = () => {
    const modelToMatch = ordModelo.trim().toUpperCase();
    if (!modelToMatch) {
      return bd.filter(o => !o.modelo);
    }
    // Try exact match first
    const matching = bd.filter(o => o.modelo && o.modelo.toUpperCase() === modelToMatch);
    if (matching.length > 0) return matching;

    // Try partial match next (e.g. if the typed model contains or starts with any of our defined models in bd)
    const partialMatching = bd.filter(o => o.modelo && modelToMatch.includes(o.modelo.toUpperCase()));
    if (partialMatching.length > 0) return partialMatching;

    return bd.filter(o => !o.modelo);
  };

  const activeOps = getActiveOpsForForm();

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordNumero.trim()) {
      alert('Por favor ingrese un número de orden/pedido.');
      return;
    }
    const docenasVal = Math.round(parseFloat(ordDocenas));
    if (isNaN(docenasVal) || docenasVal <= 0) {
      alert('Por favor ingrese una cantidad válida en docenas.');
      return;
    }

    const opsToSave: OrderOp[] = [];
    activeOps.forEach(op => {
      if (selectedOps[op.pieza]) {
        const precio = typeof op.precio === 'number' ? op.precio : parseFloat(op.precio as any) || 0;
        opsToSave.push({
          pieza: op.pieza,
          precio: precio,
          subtotal: Number((precio * docenasVal).toFixed(2))
        });
      }
    });

    if (opsToSave.length === 0) {
      alert('Debe seleccionar al menos una pieza/operación realizada.');
      return;
    }

    const orderTotal = Number(opsToSave.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const nextOrderId = Math.max(...ordenes.map(o => o.id), 0) + 1;

    const newOrder: DestajoOrder & {
      nroOrden?: string;
      pares?: number;
      operacion?: string;
      pagoCalculado?: number;
    } = {
      id: nextOrderId,
      numero: ordNumero.trim().toUpperCase(),
      nroOrden: ordNumero.trim().toUpperCase(),
      modelo: ordModelo,
      docenas: docenasVal,
      pares: docenasVal * 12,
      fecha: ordFecha,
      periodoId: currentOrderPeriodId,
      operaciones: opsToSave,
      operacion: opsToSave.map(op => op.pieza).join(', '),
      total: orderTotal,
      pagoCalculado: orderTotal,
      registrado: new Date().toISOString()
    };

    const updatedOrders = [...ordenes, newOrder];
    setOrdenes(updatedOrders);
    localStorage.setItem(`${localStoragePrefix}_ordenes`, JSON.stringify(updatedOrders));

    if (currentUser) {
      const cleanId = `order_${newOrder.id}`;
      const firestorePayload = {
        ...newOrder,
        timestamp: serverTimestamp()
      };
      setDoc(doc(db, ordersCollection, cleanId), firestorePayload)
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `${ordersCollection}/${cleanId}`));
    }

    // Reset Form
    setOrdNumero('');
    setOrdModelo('');
    setOrdDocenas('');
    setSelectedOps({});
    alert(`✅ Orden ${newOrder.numero} registrada exitosamente!\nTotal: S/ ${orderTotal.toFixed(2)}`);
  };

  const handleDeleteOrder = (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta orden del registro? Esta acción no se puede deshacer.')) return;
    const updated = ordenes.filter(o => o.id !== id);
    setOrdenes(updated);
    localStorage.setItem(`${localStoragePrefix}_ordenes`, JSON.stringify(updated));

    if (currentUser) {
      const cleanId = `order_${id}`;
      deleteDoc(doc(db, ordersCollection, cleanId))
        .catch(e => handleFirestoreError(e, OperationType.DELETE, `${ordersCollection}/${cleanId}`));
    }
  };

  const handleUpdateOrderDocenas = async (ord: DestajoOrder) => {
    const newDocenas = Math.round(parseFloat(editingDocenas));
    if (isNaN(newDocenas) || newDocenas <= 0) {
      alert('Por favor ingrese una cantidad válida en docenas.');
      return;
    }

    const updatedOperaciones = ord.operaciones.map(op => {
      const precio = typeof op.precio === 'number' ? op.precio : parseFloat(op.precio as any) || 0;
      return {
        ...op,
        subtotal: Number((precio * newDocenas).toFixed(2))
      };
    });

    const newTotal = Number(updatedOperaciones.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

    const updatedOrder = {
      ...ord,
      docenas: newDocenas,
      pares: newDocenas * 12,
      operaciones: updatedOperaciones,
      total: newTotal,
      pagoCalculado: newTotal
    };

    const updatedOrders = ordenes.map(o => o.id === ord.id ? updatedOrder : o);
    setOrdenes(updatedOrders);
    localStorage.setItem(`${localStoragePrefix}_ordenes`, JSON.stringify(updatedOrders));

    if (currentUser) {
      const cleanId = `order_${ord.id}`;
      const firestorePayload = {
        ...updatedOrder,
        timestamp: serverTimestamp()
      };
      setDoc(doc(db, ordersCollection, cleanId), firestorePayload)
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `${ordersCollection}/${cleanId}`));
    }

    setEditingOrderId(null);
    setEditingDocenas('');
  };

  // Filtered orders for view (which dynamically calculates total on-the-fly)
  const filteredOrders = ordenes.filter(o => {
    const matchesSearch = o.numero.toLowerCase().includes(ordFilterSearch.toLowerCase()) || 
                          o.modelo.toLowerCase().includes(ordFilterSearch.toLowerCase());
    const matchesPeriod = ordFilterPeriod === 'TODOS' || o.periodoId === ordFilterPeriod;
    return matchesSearch && matchesPeriod;
  });

  // Automatically sum the filtered records on-the-fly
  const filteredTotalAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const filteredTotalDozens = filteredOrders.reduce((sum, o) => sum + o.docenas, 0);

  // Calculate stats for selected period in Payout Tab
  const getPayoutStats = (periodId: string) => {
    const ords = ordenes.filter(o => o.periodoId === periodId);
    const total = ords.reduce((sum, o) => sum + o.total, 0);
    const docenas = ords.reduce((sum, o) => sum + o.docenas, 0);
    return {
      ordersCount: ords.length,
      totalPagar: Number(total.toFixed(2)),
      totalDocenas: Math.round(docenas),
      ordersList: ords
    };
  };

  const payoutStats = getPayoutStats(payoutPeriodId);

  // Group payout by pieces
  const getPayoutSummaryByPiece = (ords: DestajoOrder[]) => {
    const summary: Record<string, { docenas: number; precio: number; total: number }> = {};
    ords.forEach(o => {
      o.operaciones.forEach(op => {
        const precio = typeof op.precio === 'number' ? op.precio : parseFloat(op.precio as any) || 0;
        if (!summary[op.pieza]) {
          summary[op.pieza] = { docenas: 0, precio: precio, total: 0 };
        }
        summary[op.pieza].docenas += o.docenas;
        summary[op.pieza].total += op.subtotal;
      });
    });
    // Round totals
    Object.keys(summary).forEach(pieza => {
      summary[pieza].docenas = Math.round(summary[pieza].docenas);
      summary[pieza].total = Number(summary[pieza].total.toFixed(2));
    });
    return summary;
  };

  const payoutPieceSummary = getPayoutSummaryByPiece(payoutStats.ordersList);

  const handleSavePaidDate = () => {
    const updatedFechas = {
      ...fechasPagadas,
      [payoutPeriodId]: editingPaidDate
    };
    setFechasPagadas(updatedFechas);
    localStorage.setItem(`${localStoragePrefix}_fechas_pagadas`, JSON.stringify(updatedFechas));

    if (currentUser) {
      const cleanId = payoutPeriodId.replace(/[^A-Za-z0-9_-]/g, '_');
      setDoc(doc(db, payoutsCollection, cleanId), { periodId: payoutPeriodId, paidDate: editingPaidDate })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `${payoutsCollection}/${cleanId}`));
    }

    alert('✅ Fecha pagada registrada correctamente para este periodo.');
  };

  // Payout options for dropdowns
  const allUsedPeriodIds = Array.from(new Set(ordenes.map(o => o.periodoId)));
  const uniquePeriodsWithLabels = PERIODS.filter(p => allUsedPeriodIds.includes(p.id) || p.id === currentOrderPeriodId || p.id === payoutPeriodId);

  // Print summary generator
  const getPrintData = () => {
    const p = PERIODS.find(x => x.id === resPeriodId);
    if (!p) return null;
    const ords = ordenes.filter(o => o.periodoId === resPeriodId);
    const total = ords.reduce((sum, o) => sum + o.total, 0);
    const docenas = ords.reduce((sum, o) => sum + o.docenas, 0);
    const paidDate = fechasPagadas[resPeriodId] || '';
    const pieceSummary = getPayoutSummaryByPiece(ords);

    return {
      periodLabel: p.label,
      periodTipo: p.tipo,
      periodDates: `${p.inicio} al ${p.fin}`,
      pagoEstimado: p.fechaPago,
      ordersCount: ords.length,
      totalPagar: Number(total.toFixed(2)),
      totalDocenas: Math.round(docenas),
      ordersList: ords,
      paidDate,
      pieceSummary
    };
  };

  const printData = getPrintData();

  return (
    <div className="space-y-6 max-w-none w-full font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* HEADER SECTION (HIDDEN ON PRINT) */}
      <div className="no-print bg-[#1E293B] border-2 border-slate-900 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white shadow-md">
        <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.2em] font-black bg-blue-950 px-2.5 py-1 border border-blue-500/30 text-cyan-300 font-mono">
              FÁBRICA DE ZAPATILLAS DEPORTIVAS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold italic uppercase tracking-tight text-white mt-2 font-serif">
            {workerName.toUpperCase()} DESTAJO · CONTROL
          </h1>
          <p className="text-xs text-blue-200 mt-1 uppercase font-semibold tracking-wider">
            Operario: <span className="text-white font-black">{workerName.toUpperCase()}</span> &nbsp;|&nbsp; Área de Producción: <span className="text-white font-black">{areaName.toUpperCase()}</span>
          </p>
        </div>
        
        <div className="z-10 bg-slate-900/60 p-3 border border-blue-500/30 text-right font-mono text-2xs uppercase">
          <div className="font-extrabold text-cyan-300 flex items-center justify-end gap-1">
            <Coins size={12} className="animate-pulse" />
            Control de Destajos
          </div>
          <div className="text-stone-300 mt-1 font-bold">FECHA HOY: {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* SCREEN TABS (SCREEN ONLY) */}
      <div className="print:hidden flex flex-wrap border-b border-stone-200 gap-1 bg-stone-50 p-1">
        <button
          onClick={() => setActiveTab('nueva_orden')}
          className={`flex items-center gap-2 px-5 py-3 text-2xs uppercase font-extrabold tracking-wider transition cursor-pointer rounded-none
            ${activeTab === 'nueva_orden' 
              ? 'bg-blue-800 text-white shadow-xs' 
              : 'text-slate-600 hover:text-blue-800 hover:bg-slate-100'}`}
        >
          ➕ Nueva Orden
        </button>
        <button
          onClick={() => setActiveTab('pago_total')}
          className={`flex items-center gap-2 px-5 py-3 text-2xs uppercase font-extrabold tracking-wider transition cursor-pointer rounded-none
            ${activeTab === 'pago_total' 
              ? 'bg-blue-800 text-white shadow-xs' 
              : 'text-slate-600 hover:text-blue-800 hover:bg-slate-100'}`}
        >
          💰 PAGO TOTAL {workerName.toUpperCase()}
        </button>
        <button
          onClick={() => setActiveTab('bd')}
          className={`flex items-center gap-2 px-5 py-3 text-2xs uppercase font-extrabold tracking-wider transition cursor-pointer rounded-none
            ${activeTab === 'bd' 
              ? 'bg-blue-800 text-white shadow-xs' 
              : 'text-slate-600 hover:text-blue-800 hover:bg-slate-100'}`}
        >
          📋 Base de Datos de Operaciones
        </button>
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center gap-2 px-5 py-3 text-2xs uppercase font-extrabold tracking-wider transition cursor-pointer rounded-none
            ${activeTab === 'resumen' 
              ? 'bg-blue-800 text-white shadow-xs' 
              : 'text-slate-600 hover:text-blue-800 hover:bg-slate-100'}`}
        >
          🖨️ Comprobante para Impresión
        </button>
      </div>

      {/* ======================= TAB 1: NUEVA ORDEN ======================= */}
      {activeTab === 'nueva_orden' && (
        <div className="print:hidden space-y-6">
          <div className="bg-white border-2 border-slate-900 p-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-black text-slate-800 border-b border-stone-200 pb-2 mb-4">
              Registrar Nueva Orden de {areaName}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">N° Orden Pedido</label>
                <input
                  type="text"
                  placeholder="Ej: PD2026000300"
                  list="pedidos-list"
                  value={ordNumero}
                  onChange={(e) => setOrdNumero(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none uppercase"
                />
                <datalist id="pedidos-list">
                  {pedidos?.map(p => (
                    <option key={p.id} value={p.codigo}>{p.codigo} — {p.producto}</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Modelo de Zapatilla</label>
                <input
                  type="text"
                  placeholder="Ej: NEW FLEX"
                  list="modelos-list"
                  value={ordModelo}
                  onChange={(e) => {
                    setOrdModelo(e.target.value.toUpperCase());
                    setSelectedOps({});
                  }}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none uppercase"
                />
                <datalist id="modelos-list">
                  {Array.from(new Set([
                    ...bd.map(op => op.modelo).filter(Boolean),
                    ...Object.keys(CATALOGO_REAL)
                  ])).map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cantidad (Docenas Enteras)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="Ej: 5 (Solo números enteros)"
                  value={ordDocenas}
                  onChange={(e) => setOrdDocenas(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Fecha de Operación</label>
                <input
                  type="date"
                  value={ordFecha}
                  onChange={(e) => setOrdFecha(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 col-span-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Mes Período</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 px-2 py-2 text-xs font-bold focus:bg-white focus:outline-none rounded-none cursor-pointer"
                  >
                    {MESES.map((m, idx) => (
                      <option key={idx} value={String(idx + 1)}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Año Período</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 px-2 py-2 text-xs font-bold focus:bg-white focus:outline-none rounded-none cursor-pointer"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tipo Período</label>
                  <select
                    value={selectedPeriodType}
                    onChange={(e) => setSelectedPeriodType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 px-2 py-2 text-xs font-bold focus:bg-white focus:outline-none rounded-none cursor-pointer"
                  >
                    <option value="Q1">1a Quincena</option>
                    <option value="Q2">Fin de Mes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Checkbox Operations checklist */}
            <div className="bg-stone-50 border border-stone-200 p-4 mb-6">
              <span className="block text-[10px] font-black tracking-wider text-slate-700 uppercase mb-3">
                Seleccione las Piezas o Operaciones Realizadas por {workerName}
              </span>
              
              {activeOps.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-stone-500 font-bold">No hay operaciones específicas definidas para este modelo.</p>
                  <button 
                    onClick={() => setActiveTab('bd')}
                    className="mt-2 text-2xs uppercase tracking-widest font-black text-blue-700 underline hover:text-blue-900 cursor-pointer"
                  >
                    Configurar base de tarifas/operaciones
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeOps.map((op) => {
                    const price = typeof op.precio === 'number' ? op.precio : parseFloat(op.precio as any) || 0;
                    return (
                      <label 
                        key={op.id} 
                        className={`flex items-center gap-3 p-2.5 border transition cursor-pointer select-none
                          ${selectedOps[op.pieza] 
                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-extrabold' 
                            : 'bg-white border-stone-200 text-stone-700 font-medium hover:bg-stone-100'}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedOps[op.pieza]}
                          onChange={(e) => {
                            setSelectedOps(prev => ({
                              ...prev,
                              [op.pieza]: e.target.checked
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded-none border-stone-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="text-2xs">
                          <span className="block uppercase tracking-wide font-black truncate max-w-[160px]">{op.pieza}</span>
                          <span className="text-blue-700 font-mono font-black">S/ {price.toFixed(2)} / doc.</span>
                          {op.modelo && (
                            <span className="ml-1 bg-amber-100 border border-amber-200 text-amber-900 px-1 font-mono tracking-tight uppercase rounded-2xs">
                              {op.modelo}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveOrder}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-2xs uppercase tracking-widest font-black py-3 px-6 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.15)] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              💾 REGISTRAR ORDEN DE TRABAJO
            </button>
          </div>

          {/* Orders list register */}
          <div className="bg-white border-2 border-slate-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-3 mb-4 gap-4">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-black text-slate-800">
                  Órdenes Registradas - Operario {workerName}
                </h3>
                <p className="text-2xs text-stone-500 font-bold mt-0.5 uppercase tracking-wide">
                  Historial de producción realizada a destajo por el operario
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar lote o modelo..."
                    value={ordFilterSearch}
                    onChange={(e) => setOrdFilterSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-stone-50 border border-stone-300 text-2xs font-bold outline-none focus:bg-white focus:border-stone-500 rounded-none w-full sm:w-48 uppercase"
                  />
                </div>

                <select
                  value={ordFilterPeriod}
                  onChange={(e) => setOrdFilterPeriod(e.target.value)}
                  className="px-2.5 py-1 bg-stone-50 border border-stone-300 text-2xs font-extrabold outline-none cursor-pointer rounded-none"
                >
                  <option value="TODOS">TODOS LOS PERIODOS</option>
                  {PERIODS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Totalizers for filtered results (AUTO GENERATES ON-THE-FLY BASED ON FILTER) */}
            <div className="bg-slate-900 text-white p-4 rounded-none border border-slate-900 flex flex-wrap justify-between items-center gap-4 mb-4 font-mono uppercase">
              <div className="text-2xs space-y-1">
                <span className="block font-sans text-[10px] text-cyan-300 font-black tracking-wider">RESUMEN INTEGRADO DE BÚSQUEDA</span>
                <span className="text-stone-300 font-bold">Filtro Activo: <strong className="text-white font-extrabold">{ordFilterPeriod === 'TODOS' ? 'TODOS LOS PERIODOS' : ordFilterPeriod}</strong></span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-[8px] text-stone-400 font-black">REGISTRO DE PARES</span>
                  <span className="text-lg font-black text-white">{(filteredTotalDozens * 12).toLocaleString()} PARES</span>
                </div>
                <div className="text-right border-l border-stone-800 pl-6">
                  <span className="block text-[8px] text-stone-400 font-black">REGISTRO EN DOCENAS</span>
                  <span className="text-lg font-black text-cyan-300">{filteredTotalDozens.toLocaleString()} DOCS</span>
                </div>
                <div className="text-right border-l border-stone-800 pl-6">
                  <span className="block text-[8px] text-stone-400 font-black">SUMATORIA MONTO FILTRADO</span>
                  <span className="text-xl font-black text-emerald-400">S/ {filteredTotalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-stone-200">
                <FileText className="mx-auto text-stone-300 mb-2" size={32} />
                <p className="text-xs text-stone-500 font-extrabold uppercase">
                  No se han registrado órdenes para {workerName} en este sistema.
                </p>
                <p className="text-2xs text-stone-400 mt-1 uppercase font-medium">
                  Utilice el formulario de arriba para ingresar su primera orden.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-stone-200">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 border-b border-stone-200 uppercase font-black tracking-wider text-slate-700">
                      <th className="p-3">ID</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Periodo ID</th>
                      <th className="p-3">N° Pedido</th>
                      <th className="p-3">Modelo</th>
                      <th className="p-3 text-right">Cant (Docenas)</th>
                      <th className="p-3 text-right">Pares Equiv.</th>
                      <th className="p-3">Piezas Realizadas (Detalle de Tarifas)</th>
                      <th className="p-3 text-right">Total (S/)</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-mono font-medium text-slate-700">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 text-stone-400">#{ord.id}</td>
                        <td className="p-3 font-sans font-bold whitespace-nowrap">{ord.fecha}</td>
                        <td className="p-3">
                          <span className="bg-stone-200 border border-stone-300 text-stone-800 px-1 py-0.5 uppercase rounded-2xs text-[9px] font-bold">
                            {ord.periodoId}
                          </span>
                        </td>
                        <td className="p-3 font-sans font-black tracking-wide text-slate-900 whitespace-nowrap">
                          {ord.numero}
                        </td>
                        <td className="p-3 font-sans font-extrabold text-blue-900 uppercase">{ord.modelo || 'GENÉRICO'}</td>
                        <td className="p-3 text-right text-slate-900 font-bold">
                          {editingOrderId === ord.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="1"
                                className="w-16 bg-white border-2 border-blue-600 px-1 py-0.5 text-right text-xs font-bold focus:outline-none"
                                value={editingDocenas}
                                onChange={(e) => setEditingDocenas(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateOrderDocenas(ord);
                                  }
                                }}
                                autoFocus
                              />
                              <span className="text-[10px] text-stone-500 font-bold">doc</span>
                            </div>
                          ) : (
                            <span>{Math.round(ord.docenas)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-stone-500 font-bold">
                          {editingOrderId === ord.id ? (
                            <span>{Math.round((parseFloat(editingDocenas) || 0) * 12)}</span>
                          ) : (
                            <span>{Math.round(ord.docenas * 12)}</span>
                          )}
                        </td>
                        <td className="p-3 font-sans text-[10px]">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {ord.operaciones.map((op, idx) => (
                              <span key={idx} className="bg-slate-100 border border-stone-200 px-1.5 py-0.5 font-sans font-semibold text-stone-700 rounded-2xs text-[9.5px]">
                                {op.pieza}: <strong className="font-mono text-blue-700">S/ {op.precio.toFixed(2)}</strong> (S/ {op.subtotal.toFixed(2)})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          S/ {ord.total.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {editingOrderId === ord.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateOrderDocenas(ord)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition border border-emerald-700 cursor-pointer"
                                  title="Guardar cambios"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingOrderId(null);
                                    setEditingDocenas('');
                                  }}
                                  className="p-1.5 bg-stone-500 hover:bg-stone-600 text-white transition border border-stone-600 cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingOrderId(ord.id);
                                    setEditingDocenas(String(Math.round(ord.docenas)));
                                  }}
                                  className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-950 transition border border-stone-200 hover:border-blue-200 cursor-pointer"
                                  title="Editar Docenas de Orden"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-900 transition border border-stone-200 hover:border-red-200 cursor-pointer"
                                  title="Eliminar Registro de Orden"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: PAGO TOTAL WORKER ======================= */}
      {activeTab === 'pago_total' && (
        <div className="print:hidden space-y-6">
          <div className="bg-white border-2 border-slate-900 p-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-black text-slate-800 border-b border-stone-200 pb-2 mb-4">
              Cálculo Consolidado de Liquidación y Pago de Quincena
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Año</label>
                <select
                  value={pagoYear}
                  onChange={(e) => setPagoYear(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-2.5 py-2 text-xs font-bold rounded-none cursor-pointer focus:bg-white"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Mes de Liquidación</label>
                <select
                  value={pagoMonth}
                  onChange={(e) => setPagoMonth(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-2.5 py-2 text-xs font-bold rounded-none cursor-pointer focus:bg-white"
                >
                  {MESES.map((m, idx) => (
                    <option key={idx} value={String(idx + 1)}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Quincena / Periodo</label>
                <select
                  value={pagoPeriodType}
                  onChange={(e) => setPagoPeriodType(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-300 px-2.5 py-2 text-xs font-bold rounded-none cursor-pointer focus:bg-white"
                >
                  <option value="Q1">1ra Quincena (Días 01-15)</option>
                  <option value="Q2">2da Quincena (Fin de Mes)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">ID Período Calculado</label>
                <div className="bg-stone-100 border border-stone-300 px-3 py-2 text-xs font-mono font-black text-stone-700 uppercase">
                  {payoutPeriodId}
                </div>
              </div>
            </div>

            {/* Payout Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border border-stone-200 bg-stone-50 p-4">
                <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider">ÓRDENES COMPLETADAS</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{payoutStats.ordersCount} ÓRDENES</span>
                <span className="text-3xs text-stone-500 font-mono block mt-0.5 uppercase tracking-wide">
                  En el período {payoutPeriodId}
                </span>
              </div>
              
              <div className="border border-stone-200 bg-stone-50 p-4">
                <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider">DOCENAS PRODUCIDAS</span>
                <span className="text-2xl font-black text-blue-800 block mt-1">{payoutStats.totalDocenas.toLocaleString()} DOCS</span>
                <span className="text-3xs text-stone-500 font-mono block mt-0.5 uppercase tracking-wide">
                  Equivalente a {(payoutStats.totalDocenas * 12).toLocaleString()} pares procesados
                </span>
              </div>

              <div className="border-2 border-emerald-900 bg-emerald-50/50 p-4">
                <span className="block text-[8px] font-bold text-emerald-800 uppercase tracking-wider">MONTO TOTAL A PAGAR</span>
                <span className="text-3xl font-black text-emerald-700 block mt-1">S/ {payoutStats.totalPagar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-3xs text-emerald-800 font-bold block mt-0.5 uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-600" />
                  Monto bruto devengado de operaciones
                </span>
              </div>
            </div>

            {/* Payment record status */}
            <div className="border-2 border-slate-900 p-4 bg-stone-50 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-2xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-700" />
                  Estado y Registro de Pago en Base de Datos
                </span>
                <p className="text-3xs text-stone-500 font-bold uppercase tracking-wide max-w-xl">
                  {editingPaidDate 
                    ? `Este periodo fue marcado como PAGADO el día ${editingPaidDate}.` 
                    : 'Este período aún no tiene un registro formal de pago. Ingrese la fecha de pago abajo para registrarlo.'}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="date"
                  value={editingPaidDate}
                  onChange={(e) => setEditingPaidDate(e.target.value)}
                  className="bg-white border border-stone-300 px-3 py-1.5 text-2xs font-bold focus:outline-none rounded-none text-slate-800 shrink-0 w-full md:w-36"
                />
                <button
                  onClick={handleSavePaidDate}
                  className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-800 hover:border-emerald-700 text-white font-mono text-3xs font-extrabold uppercase px-3.5 py-2 transition shrink-0 rounded-none cursor-pointer"
                >
                  Registrar Pago
                </button>
              </div>
            </div>

            {/* Piecework summary table */}
            <h4 className="text-2xs uppercase tracking-widest font-black text-slate-800 mb-3">
              Consolidado de Unidades y Montos por Tipo de Pieza Realizada
            </h4>

            {payoutStats.ordersList.length === 0 ? (
              <p className="text-2xs text-stone-500 uppercase font-bold py-3 text-center border border-dashed border-stone-200 bg-stone-50">
                No hay órdenes registradas en este periodo {payoutPeriodId}.
              </p>
            ) : (
              <div className="overflow-x-auto border border-stone-200 mb-6">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 border-b border-stone-200 uppercase font-black tracking-wider text-slate-700">
                      <th className="p-3">Descripción de la Pieza / Operación realizada</th>
                      <th className="p-3 text-right">Tarifa por Docena</th>
                      <th className="p-3 text-right">Cantidad Producida (Docenas)</th>
                      <th className="p-3 text-right">Pares Producidos (Equivalente)</th>
                      <th className="p-3 text-right">Subtotal Liquidación (S/)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-mono font-medium text-slate-700">
                    {Object.entries(payoutPieceSummary).map(([pieza, dat]) => (
                      <tr key={pieza} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 font-sans font-bold uppercase text-slate-900">{pieza}</td>
                        <td className="p-3 text-right text-blue-900 font-bold">S/ {dat.precio.toFixed(2)}</td>
                        <td className="p-3 text-right text-slate-900 font-bold">{Math.round(dat.docenas)}</td>
                        <td className="p-3 text-right text-stone-500">{Math.round(dat.docenas * 12)}</td>
                        <td className="p-3 text-right text-emerald-700 font-black">S/ {dat.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-stone-100 font-black uppercase border-t-2 border-stone-300">
                      <td className="p-3" colSpan={2}>SUBTOTALES INTEGRADOS DE PERÍODO</td>
                      <td className="p-3 text-right text-slate-900">{Math.round(payoutStats.totalDocenas)} docs</td>
                      <td className="p-3 text-right text-stone-600">{Math.round(payoutStats.totalDocenas * 12)} pares</td>
                      <td className="p-3 text-right text-emerald-800">S/ {payoutStats.totalPagar.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setResPeriodId(payoutPeriodId);
                  setActiveTab('resumen');
                }}
                className="bg-blue-800 hover:bg-blue-700 text-white font-mono text-3xs font-extrabold uppercase py-2.5 px-4 rounded-none transition flex items-center gap-1.5 cursor-pointer border border-blue-900"
              >
                <Printer size={12} />
                Generar Comprobante Imprimible
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: BASE DE DATOS DE TARIFAS ======================= */}
      {activeTab === 'bd' && (
        <div className="print:hidden space-y-6 animate-fade-in">
          <div className="bg-white border-2 border-slate-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-4 mb-4 gap-4">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-black text-slate-800 flex items-center gap-2">
                  <Database size={14} className="text-blue-800" />
                  Base de Datos de Operaciones y Tarifas — {workerName.toUpperCase()} ({areaName})
                </h3>
                <p className="text-2xs text-stone-500 font-bold mt-0.5 uppercase tracking-wide">
                  Esta sección define las piezas y tarifas que {workerName} procesa por modelo. Es la base de cálculo automático de pagos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 font-sans">
                {/* View switcher */}
                <div className="flex bg-stone-100 p-1 border border-stone-300">
                  <button
                    onClick={() => setDbViewMode('matrix')}
                    className={`px-3 py-1 text-3xs font-black uppercase tracking-wider transition rounded-none cursor-pointer ${dbViewMode === 'matrix' ? 'bg-slate-900 text-white' : 'text-stone-600 hover:text-slate-900'}`}
                  >
                    Matriz de Checklist (Imagen)
                  </button>
                  <button
                    onClick={() => setDbViewMode('list')}
                    className={`px-3 py-1 text-3xs font-black uppercase tracking-wider transition rounded-none cursor-pointer ${dbViewMode === 'list' ? 'bg-slate-900 text-white' : 'text-stone-600 hover:text-slate-900'}`}
                  >
                    Lista Detallada
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-300 font-mono text-3xs font-black uppercase py-1.5 px-3 flex items-center gap-1 transition rounded-none cursor-pointer"
                  title="Exportar base de tarifas a archivo excel CSV"
                >
                  <FileSpreadsheet size={11} />
                  Exportar CSV
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 font-mono text-3xs font-black uppercase py-1.5 px-3.5 flex items-center gap-1 transition rounded-none cursor-pointer shadow-xs"
                  title="Imprimir Base de Datos de tarifas en formato oficial"
                >
                  <Printer size={11} />
                  Imprimir Base de Datos
                </button>

                <button
                  onClick={handleOpenAddDb}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-mono text-3xs font-black uppercase py-1.5 px-3.5 flex items-center gap-1 transition rounded-none cursor-pointer border border-slate-950"
                  title="Agregar nueva operación de forma tradicional"
                >
                  <Plus size={11} />
                  Agregar Operación
                </button>
              </div>
            </div>

            {/* ======================= VIEW MODE: MATRIX GRID ======================= */}
            {dbViewMode === 'matrix' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3 text-2xs uppercase font-bold text-blue-950 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span>
                    💡 <strong>VISTA MATRIZ ACTIVA:</strong> Marque o desmarque los casilleros de cada modelo para activar/desactivar sus piezas. Modifique el precio directo en el casillero.
                  </span>
                  <span className="font-mono text-3xs font-black tracking-widest text-slate-600">
                    SANTOS MATRIX GRID v3.0
                  </span>
                </div>

                {/* Filters Row (Search & Tabs) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-center">
                  {/* Search in matrix */}
                  <div className="relative lg:col-span-1">
                    <Search className="absolute left-2.5 top-2.5 text-stone-400" size={13} />
                    <input
                      type="text"
                      placeholder="Buscar modelo..."
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 text-2xs font-bold outline-none focus:bg-white focus:border-stone-500 rounded-none w-full uppercase"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="lg:col-span-3 flex flex-wrap items-center gap-1 bg-stone-50 p-1 border border-stone-200">
                    <span className="text-[9px] uppercase tracking-wider font-black text-stone-500 px-2">
                      Filtros:
                    </span>
                    {[
                      { id: 'TODOS', label: 'Todos' },
                      { id: 'A-D', label: 'A-D' },
                      { id: 'E-K', label: 'E-K' },
                      { id: 'L-O', label: 'L-O' },
                      { id: 'P-S', label: 'P-S' },
                      { id: 'T-Z', label: 'T-Z' },
                      { id: 'CHIMPUNES', label: '⚽ Chimpunes' },
                      { id: 'ESCOLAR', label: '👟 Escolares' },
                      { id: 'CON_TARIFAS', label: '💰 Con Tarifas' },
                      { id: 'NUEVOS', label: '➕ Creados' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setModelFilterGroup(btn.id)}
                        className={`px-2 py-1 text-4xs sm:text-3xs font-bold uppercase tracking-wider transition rounded-none cursor-pointer ${
                          modelFilterGroup === btn.id
                            ? 'bg-blue-800 text-white font-black'
                            : 'bg-white hover:bg-stone-200 text-slate-700 border border-stone-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MATRIX SCROLLABLE CONTAINER WITH STICKY HEADERS & COLUMNS */}
                <div className="overflow-auto max-h-[580px] border border-stone-200 relative shadow-inner">
                  <table className="w-full text-left text-2xs border-collapse table-fixed min-w-[800px]">
                    <thead>
                      <tr className="bg-stone-100 uppercase font-black tracking-wider text-slate-700 font-mono">
                        {/* Top-Left Corner Cell: Sticky top & left to lock its position */}
                        <th className="p-3 border-r border-stone-300 w-[220px] sticky top-0 left-0 bg-stone-100 z-30 shadow-[inset_-1px_-2px_0_rgba(0,0,0,0.15)]">
                          Modelos de Calzado
                        </th>
                        {matrixColumns.map(col => (
                          <th key={col} className="p-3 text-center border-r border-stone-200 text-[10px] sticky top-0 bg-stone-100 z-20 shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] w-[120px]">
                            <div className="truncate font-sans font-black text-slate-900" title={col}>
                              {col.replace('C. ', '')}
                            </div>
                            <span className="text-[8px] font-mono font-bold text-stone-400 block tracking-tight uppercase mt-0.5">
                              {col}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-sans font-medium text-slate-700">
                      {/* 1. ROW FOR GENERAL/STANDARD PIECES (Todos los modelos) */}
                      <tr className="bg-amber-50/85 hover:bg-amber-100 transition-colors font-bold border-b border-stone-300">
                        {/* Sticky general row label on left scroll */}
                        <td className="p-3 border-r border-stone-300 font-black text-amber-950 sticky left-0 bg-amber-50 z-10 shadow-[2px_0_0_rgba(0,0,0,0.05)]">
                          <span className="uppercase tracking-wider text-3xs flex items-center gap-1 text-amber-900">
                            <span>★</span> PIEZAS ESTÁNDAR (GENERAL)
                          </span>
                        </td>
                        {matrixColumns.map(col => {
                          const existingOp = bd.find(o => !o.modelo && o.pieza.toUpperCase() === col.toUpperCase());
                          return (
                            <td key={col} className="p-2 border-r border-stone-200 text-center">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={!!existingOp}
                                  onChange={() => onToggleMatrixCell('', col)}
                                  className="w-4.5 h-4.5 text-amber-700 rounded-none border-stone-400 focus:ring-amber-600 cursor-pointer"
                                />
                                {existingOp ? (
                                  <div className="flex items-center gap-0.5 font-mono text-[10px] text-amber-950">
                                    <span className="text-3xs text-amber-700 font-black">S/</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={existingOp.precio}
                                      onChange={(e) => onUpdateMatrixPrice('', col, Number(e.target.value))}
                                      className="w-12 bg-white border border-amber-300 text-3xs font-black text-center py-0.5 rounded-none"
                                      title="Editar tarifa estándar por docena"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-stone-400 font-mono tracking-tight">—</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 2. ROWS FOR EACH INDIVIDUAL MODEL */}
                      {filteredModels.length > 0 ? (
                        filteredModels.map(model => (
                          <tr key={model} className="hover:bg-stone-50/80 transition-colors font-sans">
                            {/* Sticky model name label on left scroll */}
                            <td className="p-3 border-r border-stone-300 font-black text-slate-900 sticky left-0 bg-white hover:bg-stone-50 z-10 shadow-[2px_0_0_rgba(0,0,0,0.05)]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="bg-slate-100 border border-slate-300 text-slate-800 px-2 py-1 text-3xs font-extrabold uppercase rounded-2xs">
                                  {model}
                                </span>
                                {customModels.includes(model) && (
                                  <button
                                    onClick={() => handleRemoveMatrixModel(model)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition rounded-none cursor-pointer"
                                    title={`Eliminar fila ${model} de la matriz`}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                            {matrixColumns.map(col => {
                              const existingOp = bd.find(o => o.modelo && o.modelo.toUpperCase() === model.toUpperCase() && o.pieza.toUpperCase() === col.toUpperCase());
                              return (
                                <td key={col} className={`p-2 border-r border-stone-200 text-center transition-colors ${existingOp ? 'bg-blue-50/50' : ''}`}>
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={!!existingOp}
                                      onChange={() => onToggleMatrixCell(model, col)}
                                      className="w-4 h-4 text-blue-800 rounded-none border-stone-300 focus:ring-blue-600 cursor-pointer"
                                    />
                                    {existingOp ? (
                                      <div className="flex items-center gap-0.5 font-mono text-[10px] text-blue-900">
                                        <span className="text-3xs text-blue-600 font-extrabold">S/</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={existingOp.precio}
                                          onChange={(e) => onUpdateMatrixPrice(model, col, Number(e.target.value))}
                                          className="w-12 bg-white border border-blue-300 text-3xs font-bold text-center py-0.5 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          title={`Editar tarifa de ${col} para ${model}`}
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-[8px] text-stone-300 font-mono tracking-tight">—</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={matrixColumns.length + 1} className="p-8 text-center text-stone-400 font-bold uppercase tracking-wider">
                            No se encontraron modelos con los filtros activos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Form to add models at the bottom */}
                <form onSubmit={handleAddMatrixModel} className="flex flex-col sm:flex-row gap-2 max-w-lg items-end pt-4 border-t border-stone-200 mt-2 font-sans">
                  <div className="flex-1 w-full">
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                      Agregar Más Modelos abajo en la matriz
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: FORCE FAST TITANIUM"
                      value={newMatrixModel}
                      onChange={(e) => setNewMatrixModel(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 px-3 py-1.5 text-2xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 rounded-none uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-950 hover:bg-slate-900 text-white font-mono text-3xs font-extrabold uppercase py-2.5 px-4 transition rounded-none cursor-pointer border border-slate-950 h-[29px] tracking-wide shrink-0 font-sans"
                  >
                    + AGREGAR FILA DE MODELO
                  </button>
                </form>
              </div>
            ) : (
              /* ======================= VIEW MODE: DETAILED LIST (OLD) ======================= */
              <div className="space-y-4">
                <div className="mb-2 relative">
                  <Search className="absolute left-2.5 top-2 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Filtrar lista detallada de operaciones por modelo o pieza..."
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-stone-50 border border-stone-300 text-2xs font-bold outline-none focus:bg-white focus:border-stone-500 rounded-none w-full uppercase"
                  />
                </div>

                <div className="overflow-x-auto border border-stone-200">
                  <table className="w-full text-left text-2xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 uppercase font-black tracking-wider text-slate-700">
                        <th className="p-3">ID</th>
                        <th className="p-3">Operario</th>
                        <th className="p-3">Área de Producción</th>
                        <th className="p-3">Modelo Aplicable</th>
                        <th className="p-3">Nombre de la Pieza u Operación</th>
                        <th className="p-3 text-right">Tarifa de Pago (Por Docena)</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono font-medium text-slate-700">
                      {filteredDbOps.map((op) => (
                        <tr key={op.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3 text-stone-400">#{op.id}</td>
                          <td className="p-3 font-sans font-bold uppercase">{op.operario}</td>
                          <td className="p-3 font-sans font-bold text-stone-500 uppercase">{op.area}</td>
                          <td className="p-3 font-sans font-black text-blue-900">
                            {op.modelo ? (
                              <span className="bg-blue-50 border border-blue-200 px-1 py-0.5 text-[9px] uppercase rounded-2xs font-extrabold text-blue-800">
                                {op.modelo}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic font-bold">TODOS LOS MODELOS (PIEZA ESTÁNDAR)</span>
                            )}
                          </td>
                          <td className="p-3 font-sans font-black text-slate-900 uppercase tracking-wide">{op.pieza}</td>
                          <td className="p-3 text-right text-emerald-700 font-black">
                            S/ {op.precio.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditDb(op)}
                                className="p-1 hover:bg-stone-100 text-stone-600 hover:text-stone-950 transition border border-stone-200 cursor-pointer"
                                title="Editar Operación"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteDbOp(op.id)}
                                className="p-1 hover:bg-red-50 text-red-600 hover:text-red-900 transition border border-stone-200 hover:border-red-100 cursor-pointer"
                                title="Eliminar Operación"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 4: COMPROBANTE / VISTA PREVIA IMPRIMIBLE ======================= */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Controls for choosing which period to print (HIDDEN IN PRINT) */}
          <div className="no-print bg-white border-2 border-slate-900 p-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-black text-slate-800 border-b border-stone-200 pb-2 mb-4">
              Generar Boleta de Pago y Comprobante Imprimible de Destajos
            </h3>

            <div className="flex flex-col sm:flex-row items-end gap-3 max-w-xl">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Seleccionar Periodo Liquidado</label>
                <select
                  value={resPeriodId}
                  onChange={(e) => setResPeriodId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-2.5 py-2 text-xs font-bold rounded-none cursor-pointer focus:bg-white"
                >
                  {uniquePeriodsWithLabels.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-slate-950 hover:bg-slate-900 text-white font-mono text-2xs font-extrabold uppercase py-2.5 px-6 rounded-none transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-950 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.15)] hover:shadow-none shrink-0"
              >
                <Printer size={13} />
                IMPRIMIR COMPROBANTE FÍSICO
              </button>
            </div>
          </div>

          {/* PRINTABLE COMPROBANTE (PHYSICAL DOCUMENT DESIGN) */}
          {printData ? (
            <div className="bg-white border-4 border-double border-slate-900 p-8 sm:p-12 mx-auto max-w-[800px] shadow-sm font-sans text-slate-900 relative selection:bg-amber-150 selection:text-slate-900">
              <div className="absolute right-6 top-6 border border-stone-300 bg-stone-50 px-4 py-2 text-right font-mono text-3xs uppercase text-stone-500">
                <div>Documento Interno</div>
                <div className="font-extrabold text-slate-900 mt-0.5">Control de Pago</div>
              </div>

              <div className="border-b-2 border-slate-900 pb-6 mb-6">
                <span className="text-[10px] uppercase tracking-[0.25em] font-black text-blue-900 block">
                  BRIXTON CO. COMFORT SHOES
                </span>
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-slate-900 mt-1 font-serif">
                  BOLETA DE PAGO · DESTAJO
                </h2>
                <p className="text-2xs text-stone-500 uppercase mt-0.5 font-bold tracking-widest">
                  Fórmula de Liquidación de Mano de Obra Destajista — Brixton Calzado
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-stone-300 p-4 bg-stone-50/50 mb-6 uppercase text-3xs font-mono font-bold">
                <div className="space-y-1.5">
                  <div className="text-stone-400">DATOS GENERALES DEL OPERARIO:</div>
                  <div>OPERARIO TRABAJADOR: <strong className="text-sm font-black text-slate-900 block mt-0.5 uppercase tracking-wide">{workerName.toUpperCase()}</strong></div>
                  <div>ÁREA DE TRABAJO: <span className="text-slate-900 font-extrabold">{areaName.toUpperCase()}</span></div>
                  <div>SISTEMA DE PAGO: <span className="text-slate-900 font-extrabold">DESTAJO POR DOCENAS</span></div>
                </div>

                <div className="space-y-1.5 border-l border-stone-300 pl-4">
                  <div className="text-stone-400">DETALLE DE PERÍODO LABORADO:</div>
                  <div>PERIODO ID: <span className="bg-slate-200 border border-stone-300 px-1 text-[9px] font-black text-slate-900 tracking-wide inline-block">{resPeriodId}</span></div>
                  <div>QUINCENA: <span className="text-slate-900 font-extrabold">{printData.periodLabel}</span></div>
                  <div>RANGO FECHAS: <span className="text-slate-900 font-extrabold">{printData.periodDates}</span></div>
                  <div>FECHA LIQUIDACIÓN: <span className="text-slate-900 font-extrabold">{new Date().toLocaleDateString('es-PE')}</span></div>
                </div>
              </div>

              {/* Status indicator on printable sheet */}
              <div className="border border-stone-300 bg-stone-50/70 px-4 py-2.5 mb-6 text-3xs uppercase font-mono font-bold flex justify-between items-center">
                <span>ESTADO DEL REGISTRO DE PAGO:</span>
                {printData.paidDate ? (
                  <span className="text-emerald-700 font-black flex items-center gap-1 text-[9.5px]">
                    ● PAGADO EL DÍA {printData.paidDate}
                  </span>
                ) : (
                  <span className="text-red-700 font-black text-[9.5px]">
                    ⚠️ PAGO PENDIENTE DE DESEMBOLSO
                  </span>
                )}
              </div>

              {/* Detail list on printable sheet */}
              <h3 className="text-2xs font-black tracking-widest text-slate-800 uppercase mb-3 font-mono border-b border-stone-300 pb-1">
                DETALLE ANALÍTICO DE OPERACIONES REALIZADAS (BRIXTON CALZADO)
              </h3>

              {printData.ordersCount === 0 ? (
                <p className="text-3xs text-stone-500 uppercase font-bold py-3 text-center bg-stone-50 border">
                  No hay órdenes registradas en este período.
                </p>
              ) : (
                <div className="border border-stone-300 mb-6 text-3xs font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-300 uppercase font-black text-slate-700">
                        <th className="p-2.5">Operación / Pieza Procesada</th>
                        <th className="p-2.5 text-right">Mano Obra / Docena</th>
                        <th className="p-2.5 text-right">Cant (Docenas)</th>
                        <th className="p-2.5 text-right">Pares Equiv.</th>
                        <th className="p-2.5 text-right">Subtotal Neto (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-medium text-slate-700">
                      {Object.entries(printData.pieceSummary).map(([pieza, dat]) => (
                        <tr key={pieza}>
                          <td className="p-2.5 font-sans font-bold uppercase text-slate-900">{pieza}</td>
                          <td className="p-2.5 text-right">S/ {dat.precio.toFixed(2)}</td>
                          <td className="p-2.5 text-right text-slate-950 font-black">{Math.round(dat.docenas)}</td>
                          <td className="p-2.5 text-right text-stone-500">{Math.round(dat.docenas * 12)}</td>
                          <td className="p-2.5 text-right text-slate-900 font-black">S/ {dat.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-stone-100 font-black uppercase text-[10px] border-t border-stone-300 text-slate-900">
                        <td className="p-3" colSpan={2}>SUBTOTALES ACUMULADOS DE TRABAJO</td>
                        <td className="p-3 text-right">{Math.round(printData.totalDocenas)} DOCS</td>
                        <td className="p-3 text-right">{Math.round(printData.totalDocenas * 12)} PARES</td>
                        <td className="p-3 text-right text-slate-900">S/ {printData.totalPagar.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total payout statement box */}
              <div className="border-4 border-double border-slate-900 bg-stone-50 p-6 flex justify-between items-center mb-12">
                <div className="font-mono text-3xs uppercase space-y-1.5 font-extrabold text-slate-700">
                  <div className="font-sans text-xs font-black text-slate-900">LIQUIDACIÓN FINAL DE PAGO DESTAJISTA</div>
                  <div>Suma integrada neta devengada a favor del operario</div>
                  <div className="text-stone-400">Sin descuentos previsionales o de salud de ley</div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black tracking-widest text-stone-500 uppercase font-mono">TOTAL NETO RECIBIR</span>
                  <span className="text-3xl font-black text-slate-950 font-serif">S/ {printData.totalPagar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PEN</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 mt-16 font-mono text-3xs text-center text-stone-600 font-bold uppercase">
                <div className="border-t border-stone-400 pt-4">
                  <div className="text-slate-900 font-extrabold text-3xs tracking-wider">Firma de Operario: {workerName.toUpperCase()}</div>
                  <div className="mt-1 text-4xs">DNI: ______________</div>
                  <div className="text-4xs text-stone-400 mt-1">Declaro conforme recepción del pago de destajos</div>
                </div>
                <div className="border-t border-stone-400 pt-4">
                  <div className="text-slate-900 font-extrabold text-3xs tracking-wider">Autorizado por: Gerencia General</div>
                  <div className="mt-1 text-4xs">BRIXTON COMFORT CO.</div>
                  <div className="text-4xs text-stone-400 mt-1">Aprobado y procesado por administración</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border p-6 text-center text-xs text-stone-500 uppercase font-bold">
              No hay datos para imprimir. Por favor registre órdenes para habilitar el comprobante.
            </div>
          )}
        </div>
      )}

      {/* DB ADD/EDIT DIALOG (MODAL OVERLAY) */}
      {isDbModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-slate-900 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsDbModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-stone-500 hover:text-stone-900 transition border border-stone-200 hover:border-stone-400 cursor-pointer"
            >
              <X size={14} />
            </button>

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 border-b border-stone-200 pb-2 mb-4">
              {editingOp ? 'Editar Operación / Tarifa' : 'Agregar Nueva Operación / Tarifa'}
            </h3>

            <form onSubmit={handleSaveDbOp} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Modelo de Calzado Aplicable</label>
                <input
                  type="text"
                  placeholder="Dejar vacío para 'TODOS LOS MODELOS' (Pieza estándar)"
                  value={formModelo}
                  onChange={(e) => setFormModelo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none uppercase"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Pieza o Tipo de Operación</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    list="piezas-list"
                    placeholder="Escriba o seleccione la pieza (ej: C. PUNTA)"
                    value={formPieza}
                    onChange={(e) => setFormPieza(e.target.value.toUpperCase())}
                    className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none uppercase"
                    required
                  />
                  <datalist id="piezas-list">
                    {Array.from(new Set([
                      ...piezasDefault,
                      ...bd.map(op => op.pieza)
                    ])).map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </datalist>
                </div>
                <p className="text-4xs text-stone-400 mt-1 uppercase font-bold tracking-wide">
                  Especifique la pieza troquelada y su precio de destajo por docena para {workerName}. Puede escribir una nueva pieza o editar el nombre libremente.
                </p>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Precio por Docena (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 0.50"
                  value={formPrecio}
                  onChange={(e) => setFormPrecio(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-2xs font-extrabold uppercase hover:bg-stone-50 transition cursor-pointer rounded-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-2xs font-extrabold uppercase transition cursor-pointer border border-slate-950 rounded-none"
                >
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= PRINT-ONLY: BASE DE DATOS MATRIZ ======================= */}
      <div className="hidden print:block font-sans text-slate-900 bg-white p-4">
        {activeTab === 'bd' && (
          <div className="w-full">
            <div className="text-center border-b-2 border-slate-950 pb-4 mb-4">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-slate-950">
                BASE DE DATOS DESTAJO - {workerName.toUpperCase()}
              </h1>
              <p className="text-2xs text-stone-500 font-bold uppercase tracking-widest mt-1">
                Área de Producción: {areaName.toUpperCase()} | Brixton Calzado
              </p>
              <p className="text-3xs text-stone-400 font-mono mt-0.5">
                FECHA DE IMPRESIÓN: {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
              </p>
            </div>

            <table className="w-full text-left text-3xs border-collapse border border-slate-950">
              <thead>
                <tr className="bg-stone-100 border-b border-slate-950 font-bold text-[9px] text-slate-900">
                  <th className="p-2 border border-slate-950">MODELOS DE CALZADO</th>
                  {matrixColumns.map(col => (
                    <th key={col} className="p-2 text-center border border-slate-950 font-black">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-400 font-mono font-medium text-slate-900">
                {/* 1. GENERAL ROW */}
                <tr className="bg-stone-50 font-bold">
                  <td className="p-2 border border-slate-950 font-black uppercase text-amber-950">
                    ★ PIEZAS ESTÁNDAR (GENERAL)
                  </td>
                  {matrixColumns.map(col => {
                    const existingOp = bd.find(o => !o.modelo && o.pieza.toUpperCase() === col.toUpperCase());
                    return (
                      <td key={col} className="p-2 border border-slate-950 text-center font-bold">
                        {existingOp ? `S/ ${existingOp.precio.toFixed(2)}` : '—'}
                      </td>
                    );
                  })}
                </tr>

                {/* 2. MODEL ROWS */}
                {allUniqueModels.map(model => {
                  const modelOps = bd.filter(o => o.modelo && o.modelo.toUpperCase() === model.toUpperCase());
                  const isDefault = workerName.toLowerCase() === 'santos' && DEFAULT_IMAGE_MODELS_SANTOS.includes(model);
                  if (modelOps.length === 0 && !isDefault) return null;

                  return (
                    <tr key={model} className="hover:bg-stone-50">
                      <td className="p-2 border border-slate-950 font-black text-slate-950 uppercase font-sans">
                        {model}
                      </td>
                      {matrixColumns.map(col => {
                        const existingOp = bd.find(o => o.modelo && o.modelo.toUpperCase() === model.toUpperCase() && o.pieza.toUpperCase() === col.toUpperCase());
                        return (
                          <td key={col} className="p-2 border border-slate-950 text-center">
                            {existingOp ? `S/ ${existingOp.precio.toFixed(2)}` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-12 flex justify-between text-center uppercase tracking-wider text-2xs font-bold pt-8">
              <div className="w-1/3 border-t border-slate-400 pt-2">Firma del Administrador</div>
              <div className="w-1/3 border-t border-slate-400 pt-2">Firma de {workerName}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
