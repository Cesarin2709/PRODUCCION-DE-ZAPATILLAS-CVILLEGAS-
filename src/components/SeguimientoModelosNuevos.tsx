import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Search, 
  Upload, 
  X, 
  Image as ImageIcon,
  Info,
  CalendarDays,
  Check,
  ChevronRight,
  Sparkles,
  Printer,
  SlidersHorizontal,
  Layers,
  Flame,
  Activity
} from 'lucide-react';
import { ModeloNuevo, Entregable } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

interface SeguimientoModelosNuevosProps {
  onNotifyUpdate?: () => void;
}

const DEFAULT_ENTREGABLES = [
  'Ficha técnica del modelo',
  'Molde / horma aprobado',
  'Muestra física terminada',
  'Aprobación de planta / suela',
  'Especificaciones de costura y aparado'
];

export const SeguimientoModelosNuevos: React.FC<SeguimientoModelosNuevosProps> = ({ onNotifyUpdate }) => {
  // Tabs: 'tracking' | 'analysis'
  const [activeTab, setActiveTab] = useState<'tracking' | 'analysis'>('tracking');
  
  // Data State
  const [modelos, setModelos] = useState<ModeloNuevo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterPlanta, setFilterPlanta] = useState<string>('TODOS');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloNuevo | null>(null);

  // Form Fields
  const [modeloName, setModeloName] = useState('');
  const [plantaType, setPlantaType] = useState('');
  const [estado, setEstado] = useState<'PENDIENTE' | 'EN PROCESO' | 'ENTREGADO' | 'POSTERGADO'>('PENDIENTE');
  const [fechaEst, setFechaEst] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [motivo, setMotivo] = useState('');
  const [imgPlanta, setImgPlanta] = useState('');
  const [imgCap, setImgCap] = useState('');
  
  // Deliverables checklist for form
  const [formEntregables, setFormEntregables] = useState<Entregable[]>([]);
  const [newEntregableText, setNewEntregableText] = useState('');

  // Auto-fill triggers
  const [autoInicioChecked, setAutoInicioChecked] = useState(false);
  const [autoFinChecked, setAutoFinChecked] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const raw = localStorage.getItem('brixton_modelos_nuevos');
    if (raw) {
      try {
        setModelos(JSON.parse(raw));
      } catch (e) {
        setInitialData();
      }
    } else {
      setInitialData();
    }
  }, []);

  // Firebase Real-time Synchronization Support
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
  }, []);

  const getSeedList = (): ModeloNuevo[] => {
    return [
      {
        id: 'seed-1',
        modelo: 'TOWER PRO',
        estado: 'ENTREGADO',
        inicio: '2026-06-10T08:00',
        fechaest: '2026-06-17',
        fin: '2026-06-16T17:30',
        planta: 'PLANTA TOWER HEAVY',
        imgPlanta: '',
        imgCap: '',
        entregables: [
          { id: '1', text: 'Ficha técnica del modelo', done: true },
          { id: '2', text: 'Molde / horma aprobado', done: true },
          { id: '3', text: 'Muestra física terminada', done: true },
          { id: '4', text: 'Aprobación de planta / suela', done: true },
          { id: '5', text: 'Especificaciones de costura y aparado', done: true }
        ],
        comentarios: 'Se aceleró el proceso de corte para iniciar producción en la semana 25.',
        motivo: '',
        created: Date.now() - 15 * 24 * 60 * 60 * 1000
      },
      {
        id: 'seed-2',
        modelo: 'MASTER BRIXTON',
        estado: 'POSTERGADO',
        inicio: '2026-06-05T09:00',
        fechaest: '2026-06-12',
        fin: '',
        planta: 'PLANTA EVOLUTION COMFORT',
        imgPlanta: '',
        imgCap: '',
        entregables: [
          { id: '1', text: 'Ficha técnica del modelo', done: true },
          { id: '2', text: 'Molde / horma aprobado', done: false },
          { id: '3', text: 'Muestra física terminada', done: false },
          { id: '4', text: 'Aprobación de planta / suela', done: true },
          { id: '5', text: 'Especificaciones de costura y aparado', done: false }
        ],
        comentarios: 'El taller de modelaje tuvo retrasos en la entrega de la horma calibrada.',
        motivo: 'Demora en la importación de la suela de poliuretano y calibración de hormas de dama.',
        created: Date.now() - 10 * 24 * 60 * 60 * 1000
      },
      {
        id: 'seed-3',
        modelo: 'KILLER RUNNER',
        estado: 'EN PROCESO',
        inicio: '2026-06-18T10:00',
        fechaest: '2026-06-25',
        fin: '',
        planta: 'SUELA RUNNING ULTRA',
        imgPlanta: '',
        imgCap: '',
        entregables: [
          { id: '1', text: 'Ficha técnica del modelo', done: true },
          { id: '2', text: 'Molde / horma aprobado', done: true },
          { id: '3', text: 'Muestra física terminada', done: false },
          { id: '4', text: 'Aprobación de planta / suela', done: false },
          { id: '5', text: 'Especificaciones de costura y aparado', done: false }
        ],
        comentarios: 'En confección de muestras del primer lote piloto.',
        motivo: '',
        created: Date.now() - 4 * 24 * 60 * 60 * 1000
      }
    ];
  };

  useEffect(() => {
    if (!currentUser) return;

    const unsubModels = onSnapshot(collection(db, 'modelosNuevos'), async (snapshot) => {
      if (snapshot.empty) {
        const localData = localStorage.getItem('brixton_modelos_nuevos');
        let seedModels = getSeedList();
        if (localData) {
          try { seedModels = JSON.parse(localData); } catch {}
        }
        const batch = writeBatch(db);
        seedModels.forEach((m: any) => {
          batch.set(doc(db, 'modelosNuevos', m.id), m);
        });
        await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'modelosNuevos'));
      } else {
        const remoteModels: ModeloNuevo[] = [];
        snapshot.forEach((d) => {
          remoteModels.push(d.data() as ModeloNuevo);
        });
        remoteModels.sort((a, b) => (b.created || 0) - (a.created || 0));
        setModelos(remoteModels);
        localStorage.setItem('brixton_modelos_nuevos', JSON.stringify(remoteModels));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modelosNuevos');
    });

    return () => {
      unsubModels();
    };
  }, [currentUser]);

  const setInitialData = () => {
    const seed: ModeloNuevo[] = [
      {
        id: 'seed-1',
        modelo: 'TOWER PRO',
        estado: 'ENTREGADO',
        inicio: '2026-06-10T08:00',
        fechaest: '2026-06-17',
        fin: '2026-06-16T17:30',
        planta: 'PLANTA TOWER HEAVY',
        imgPlanta: '',
        imgCap: '',
        entregables: [
          { id: '1', text: 'Ficha técnica del modelo', done: true },
          { id: '2', text: 'Molde / horma aprobado', done: true },
          { id: '3', text: 'Muestra física terminada', done: true },
          { id: '4', text: 'Aprobación de planta / suela', done: true },
          { id: '5', text: 'Especificaciones de costura y aparado', done: true }
        ],
        comentarios: 'Se aceleró el proceso de corte para iniciar producción en la semana 25.',
        motivo: '',
        created: Date.now() - 15 * 24 * 60 * 60 * 1000
      },
      {
        id: 'seed-2',
        modelo: 'MASTER BRIXTON',
        estado: 'POSTERGADO',
        inicio: '2026-06-05T09:00',
        fechaest: '2026-06-12',
        fin: '',
        planta: 'PLANTA EVOLUTION COMFORT',
        imgPlanta: '',
        imgCap: '',
        entregables: [
          { id: '1', text: 'Ficha técnica del modelo', done: true },
          { id: '2', text: 'Molde / horma aprobado', done: false },
          { id: '3', text: 'Muestra física terminada', done: false },
          { id: '4', text: 'Aprobación de planta / suela', done: true },
          { id: '5', text: 'Especificaciones de costura y aparado', done: false }
        ],
        comentarios: 'El taller de modelaje tuvo retrasos en la entrega de la horma calibrada.',
        motivo: 'Demora en la importación de la suela de poliuretano y calibración de hormas de dama.',
        created: Date.now() - 10 * 24 * 60 * 60 * 1000
      },
      {
        id: 'seed-3',
        modelo: 'KILLER RUNNER',
        estado: 'EN PROCESO',
        inicio: '2026-06-18T10:00',
        fechaest: '2026-06-25',
        fin: '',
        planta: 'SUELA RUNNING ULTRA',
        imgPlanta: '',
        imgCap: '',
        entregables: [
          { id: '1', text: 'Ficha técnica del modelo', done: true },
          { id: '2', text: 'Molde / horma aprobado', done: true },
          { id: '3', text: 'Muestra física terminada', done: false },
          { id: '4', text: 'Aprobación de planta / suela', done: false },
          { id: '5', text: 'Especificaciones de costura y aparado', done: false }
        ],
        comentarios: 'En confección de muestras del primer lote piloto.',
        motivo: '',
        created: Date.now() - 4 * 24 * 60 * 60 * 1000
      }
    ];
    setModelos(seed);
    localStorage.setItem('brixton_modelos_nuevos', JSON.stringify(seed));
  };

  const saveToLocalStorage = (data: ModeloNuevo[]) => {
    setModelos(data);
    localStorage.setItem('brixton_modelos_nuevos', JSON.stringify(data));
    if (onNotifyUpdate) onNotifyUpdate();
  };

  // Helper: Format DateTime for view
  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
             ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  // Helper: Format Date for view
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Helper: Calc duration in days and hours
  const calculateDurationStr = (start: string, end: string) => {
    if (!start || !end) return null;
    try {
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      if (isNaN(diffMs) || diffMs < 0) return null;
      
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      
      if (days === 0) {
        return `${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
      }
      return `${days} ${days === 1 ? 'día' : 'días'} con ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
    } catch {
      return null;
    }
  };

  // Helper: Duration in days (number for charts)
  const calculateDurationDaysNum = (start: string, end: string) => {
    if (!start || !end) return 0;
    try {
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      if (isNaN(diffMs) || diffMs < 0) return 0;
      return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
    } catch {
      return 0;
    }
  };

  // Get list of unique plants for filtering
  const uniquePlants = Array.from(new Set(modelos.map(m => m.planta).filter(Boolean)));

  // Filter models
  const filteredModelos = modelos.filter(m => {
    const matchesSearch = m.modelo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.planta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'TODOS' || m.estado === filterEstado;
    const matchesPlanta = filterPlanta === 'TODOS' || m.planta === filterPlanta;
    return matchesSearch && matchesEstado && matchesPlanta;
  });

  // Handle opening modal
  const handleOpenCreateModal = () => {
    setEditingModelo(null);
    setModeloName('');
    setPlantaType('');
    setEstado('PENDIENTE');
    setFechaEst('');
    setFechaInicio('');
    setFechaFin('');
    setComentarios('');
    setMotivo('');
    setImgPlanta('');
    setImgCap('');
    setAutoInicioChecked(false);
    setAutoFinChecked(false);
    
    // Seed default deliverables
    const defaultList: Entregable[] = DEFAULT_ENTREGABLES.map((text, idx) => ({
      id: `def-${idx}-${Date.now()}`,
      text,
      done: false
    }));
    setFormEntregables(defaultList);

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: ModeloNuevo) => {
    setEditingModelo(m);
    setModeloName(m.modelo);
    setPlantaType(m.planta);
    setEstado(m.estado);
    setFechaEst(m.fechaest);
    setFechaInicio(m.inicio);
    setFechaFin(m.fin);
    setComentarios(m.comentarios);
    setMotivo(m.motivo);
    setImgPlanta(m.imgPlanta);
    setImgCap(m.imgCap);
    setAutoInicioChecked(!!m.inicio);
    setAutoFinChecked(m.estado === 'ENTREGADO' && !!m.fin);
    setFormEntregables(m.entregables || []);

    setIsModalOpen(true);
  };

  // Convert files to Base64 easily
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'planta' | 'capellada') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const b64 = event.target.result as string;
        if (target === 'planta') {
          setImgPlanta(b64);
        } else {
          setImgCap(b64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Checklist additions
  const handleAddFormEntregable = () => {
    if (!newEntregableText.trim()) return;
    const newItem: Entregable = {
      id: `custom-${Date.now()}`,
      text: newEntregableText.trim(),
      done: false
    };
    setFormEntregables([...formEntregables, newItem]);
    setNewEntregableText('');
  };

  const handleToggleFormEntregable = (id: string) => {
    setFormEntregables(
      formEntregables.map(e => e.id === id ? { ...e, done: !e.done } : e)
    );
  };

  const handleRemoveFormEntregable = (id: string) => {
    setFormEntregables(formEntregables.filter(e => e.id !== id));
  };

  // Auto-fill Current Time for start date
  const handleToggleAutoInicio = (checked: boolean) => {
    setAutoInicioChecked(checked);
    if (checked) {
      // Get current local date/time string in format YYYY-MM-DDTHH:MM
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 16);
      setFechaInicio(localISO);
    } else {
      setFechaInicio('');
    }
  };

  // Auto-fill Current Time for fin/delivered status
  const handleToggleAutoFin = (checked: boolean) => {
    setAutoFinChecked(checked);
    if (checked) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 16);
      setFechaFin(localISO);
      setEstado('ENTREGADO');
    } else {
      setFechaFin('');
      if (estado === 'ENTREGADO') {
        setEstado('EN PROCESO');
      }
    }
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modeloName.trim()) {
      alert('Por favor ingresa el nombre del modelo.');
      return;
    }

    // Determine final status
    let finalEstado = estado;
    if (fechaFin && estado !== 'ENTREGADO') {
      finalEstado = 'ENTREGADO';
    }

    const updatedModelos = [...modelos];
    const newModel: ModeloNuevo = {
      id: editingModelo ? editingModelo.id : `mod-${Date.now()}`,
      modelo: modeloName.toUpperCase().trim(),
      planta: plantaType.toUpperCase().trim(),
      estado: finalEstado,
      fechaest: fechaEst,
      inicio: fechaInicio,
      fin: finalEstado === 'ENTREGADO' && !fechaFin ? new Date().toISOString().slice(0, 16) : fechaFin,
      comentarios: comentarios.trim(),
      motivo: finalEstado === 'POSTERGADO' || motivo ? motivo.trim() : '',
      imgPlanta,
      imgCap,
      entregables: formEntregables,
      created: editingModelo ? editingModelo.created : Date.now()
    };

    if (editingModelo) {
      const idx = updatedModelos.findIndex(m => m.id === editingModelo.id);
      if (idx !== -1) {
        updatedModelos[idx] = newModel;
      }
    } else {
      updatedModelos.unshift(newModel);
    }

    saveToLocalStorage(updatedModelos);
    if (currentUser) {
      setDoc(doc(db, 'modelosNuevos', newModel.id), newModel)
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `modelosNuevos/${newModel.id}`));
    }
    setIsModalOpen(false);
  };

  // Delete model
  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el modelo "${name}" de tu sistema? Esta acción es irreversible.`)) {
      const updated = modelos.filter(m => m.id !== id);
      saveToLocalStorage(updated);
      if (currentUser) {
        deleteDoc(doc(db, 'modelosNuevos', id))
          .catch(e => handleFirestoreError(e, OperationType.DELETE, `modelosNuevos/${id}`));
      }
    }
  };

  // Quick inline Deliverable checking directly in table
  const handleToggleTableDeliverable = (modelId: string, entregableId: string) => {
    const updatedModel = modelos.find(m => m.id === modelId);
    if (updatedModel) {
      const updatedEntregables = updatedModel.entregables.map(e => 
        e.id === entregableId ? { ...e, done: !e.done } : e
      );
      const docToSave = { ...updatedModel, entregables: updatedEntregables };
      const updated = modelos.map(m => m.id === modelId ? docToSave : m);
      saveToLocalStorage(updated);
      if (currentUser) {
        setDoc(doc(db, 'modelosNuevos', modelId), docToSave)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `modelosNuevos/${modelId}`));
      }
    }
  };

  // Quick state toggling directly in table (to mark as Entregado easily)
  const handleToggleEntregadoDirectly = (m: ModeloNuevo) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    
    const allDoneEntregables = m.entregables.map(e => ({ ...e, done: true }));
    const docToSave = {
      ...m,
      estado: 'ENTREGADO' as const,
      fin: localISO,
      entregables: allDoneEntregables,
      comentarios: m.comentarios || 'Entregado con confirmación rápida.'
    };
    const updated = modelos.map(item => item.id === m.id ? docToSave : item);
    saveToLocalStorage(updated);
    if (currentUser) {
      setDoc(doc(db, 'modelosNuevos', m.id), docToSave)
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `modelosNuevos/${m.id}`));
    }
  };

  // Dashboard Stats Calculations
  const totalModelos = modelos.length;
  const entregadosCount = modelos.filter(m => m.estado === 'ENTREGADO').length;
  const enProcesoCount = modelos.filter(m => m.estado === 'EN PROCESO').length;
  const pendientesCount = modelos.filter(m => m.estado === 'PENDIENTE').length;
  const postergadosCount = modelos.filter(m => m.estado === 'POSTERGADO').length;

  // Average Delivery Time
  const deliveredModelsWithTimes = modelos.filter(m => m.estado === 'ENTREGADO' && m.inicio && m.fin);
  const totalDays = deliveredModelsWithTimes.reduce((sum, m) => sum + calculateDurationDaysNum(m.inicio, m.fin), 0);
  const avgDays = deliveredModelsWithTimes.length > 0 
    ? (totalDays / deliveredModelsWithTimes.length).toFixed(1) 
    : '—';

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      
      {/* =======================================================
          A. SCREEN LAYOUT (HIDDEN DURING PRINT)
          ======================================================= */}
      <div className="print:hidden space-y-8">
        
        {/* 1. Futuristic Header 2030 */}
        <div className="pt-6 pb-6 px-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white border-b-4 border-cyan-400 gap-4 shadow-xl relative overflow-hidden">
          {/* Abstract background graphics to feel like Year 2030 dashboard */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.25em] font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-2.5 py-1 font-mono animate-pulse">
                SYSTEM CORE v2030.4
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] font-black text-purple-300 bg-purple-950/80 border border-purple-500/50 px-2.5 py-1 font-mono">
                Área de Diseño y Modelaje
              </span>
            </div>
            <h1 className="text-3xl sm:text-[44px] font-black leading-none tracking-tight uppercase italic font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-100 mt-3 flex items-center gap-3">
              <Sparkles className="text-cyan-400 animate-pulse" size={32} />
              Seguimiento de Modelos Nuevos
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-cyan-200/70 mt-2 font-mono">
              Gestión de lanzamientos, aprobaciones de suelas, costuras y control cronometrado de prototipos.
            </p>
          </div>
          <div className="relative z-10 md:text-right shrink-0 bg-slate-900/80 border border-cyan-500/30 p-3 font-mono text-xs backdrop-blur-xs">
            <div className="text-cyan-400 font-bold flex items-center justify-end gap-1.5">
              <Activity size={14} className="animate-pulse" />
              Taller Carabayllo 2030
            </div>
            <div className="text-[9px] uppercase tracking-[0.15em] font-medium text-slate-400 mt-1">Control de Pre-Producción</div>
          </div>
        </div>

        {/* 2. Sleek Interactive Tabs - Cyan/Blue futuristic selection */}
        <div className="flex border-b-2 border-cyan-500 gap-1 bg-slate-905 p-1 rounded-none">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-2 px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition cursor-pointer rounded-none
              ${activeTab === 'tracking' 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-b-2 border-cyan-300' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
          >
            <ClipboardList size={15} className={activeTab === 'tracking' ? "text-cyan-200 animate-bounce" : "text-slate-400"} />
            📋 Fichas de Control ({totalModelos})
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition cursor-pointer rounded-none
              ${activeTab === 'analysis' 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-b-2 border-cyan-300' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
          >
            <BarChart3 size={15} className={activeTab === 'analysis' ? "text-cyan-200 animate-pulse" : "text-slate-400"} />
            📊 Análisis & Dashboard
          </button>
        </div>

        {/* 3. CONTROLS TOOLBAR & MASTER VIEWS */}
        <div className="space-y-6">
          
          {/* Controls Toolbar with Imprimir button and Search fields */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-slate-900 p-4 border border-blue-500/30 shadow-lg">
            
            {/* Left side filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px] sm:min-w-[260px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar modelo o suela..."
                  className="w-full bg-slate-950 text-white hover:bg-slate-900 focus:bg-slate-950 text-xs px-9 py-2 border border-slate-700 focus:border-cyan-400 rounded-none focus:outline-none focus:ring-0 font-mono placeholder-slate-500"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter Estado */}
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="bg-slate-950 text-cyan-300 hover:bg-slate-900 text-xs px-3 py-2 border border-slate-700 rounded-none focus:outline-none focus:border-cyan-400 font-bold"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">⏳ PENDIENTES</option>
                <option value="EN PROCESO">⚙️ EN PROCESO</option>
                <option value="ENTREGADO">✅ ENTREGADOS</option>
                <option value="POSTERGADO">⚠️ POSTERGADOS</option>
              </select>

              {/* Filter Planta */}
              <select
                value={filterPlanta}
                onChange={(e) => setFilterPlanta(e.target.value)}
                className="bg-slate-950 text-cyan-300 hover:bg-slate-900 text-xs px-3 py-2 border border-slate-700 rounded-none focus:outline-none focus:border-cyan-400 font-bold"
              >
                <option value="TODOS">Todas las Plantas</option>
                {uniquePlants.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Right side Action triggers - Add model AND PRINT */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 border border-blue-400 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition rounded-none"
                title="Imprimir reporte unificado: Control + Análisis"
              >
                <Printer size={15} className="text-cyan-200" />
                Imprimir Reporte Completo
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-500 border border-cyan-600 text-slate-950 hover:text-black shadow-[3px_3px_0px_0px_rgba(6,182,212,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Plus size={16} strokeWidth={3} />
                Registrar Modelo Nuevo
              </button>
            </div>
          </div>

          {/* Tab 3.1: TRACKING CONTROL BOARD */}
          {activeTab === 'tracking' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Master Table styled in clean futuristic blue/indigo */}
              <div className="bg-white border-2 border-blue-900 overflow-x-auto shadow-lg">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-950 text-cyan-300 border-b-2 border-cyan-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">N°</th>
                      <th className="py-3.5 px-4 min-w-[160px]">Nombre Modelo (Prototipo)</th>
                      <th className="py-3.5 px-4 w-[130px]">Estado Sistema</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Fecha Inicio</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Entrega Estimada</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Fecha Cierre (Fin)</th>
                      <th className="py-3.5 px-4 min-w-[160px]">Suela / Planta</th>
                      <th className="py-3.5 px-4 w-[110px]">Planos / Fotos</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Checklist de Entregables</th>
                      <th className="py-3.5 px-4 w-28 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModelos.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 italic bg-slate-50/50">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-3xl">👟</span>
                            <p className="text-xs font-sans font-bold text-slate-500">No se encontraron modelos con los filtros seleccionados.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredModelos.map((m, index) => {
                        const durStr = calculateDurationStr(m.inicio, m.fin);
                        const totalEntregables = m.entregables?.length || 0;
                        const doneEntregables = m.entregables?.filter(e => e.done).length || 0;
                        const allDone = totalEntregables > 0 && doneEntregables === totalEntregables;

                        return (
                          <tr key={m.id} className="border-b border-slate-100 hover:bg-blue-50/40 font-sans transition-colors group">
                            
                            {/* Number index */}
                            <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400 group-hover:text-blue-600 font-bold">
                              {index + 1}
                            </td>

                            {/* Model name with comments */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-[13px] tracking-wide text-slate-900 font-sans flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                  {m.modelo}
                                </span>
                                {m.comentarios && (
                                  <span className="text-[10px] text-slate-500 font-sans mt-1 bg-slate-50 border border-slate-100 p-1 truncate max-w-[220px]" title={m.comentarios}>
                                    💬 {m.comentarios}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status badge */}
                            <td className="py-3.5 px-4">
                              {m.estado === 'ENTREGADO' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider font-mono shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  Entregado
                                </span>
                              ) : m.estado === 'EN PROCESO' ? (
                                <div className="flex flex-col gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider font-mono shadow-[0_0_10px_rgba(37,99,235,0.2)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                                    En Proceso
                                  </span>
                                  <button
                                    onClick={() => handleToggleEntregadoDirectly(m)}
                                    className="text-[9px] text-emerald-600 hover:text-emerald-700 hover:underline font-mono uppercase font-black text-left cursor-pointer flex items-center gap-0.5"
                                  >
                                    ✓ Entregar
                                  </button>
                                </div>
                              ) : m.estado === 'POSTERGADO' ? (
                                <div className="flex flex-col gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Postergado
                                  </span>
                                  {m.motivo && (
                                    <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 border border-rose-200 max-w-[120px] truncate leading-tight" title={m.motivo}>
                                      ⚠️ {m.motivo}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-400 text-slate-950 text-[9px] font-black uppercase tracking-wider font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                    Pendiente
                                  </span>
                                  <button
                                    onClick={() => handleToggleEntregadoDirectly(m)}
                                    className="text-[9px] text-emerald-600 hover:text-emerald-700 hover:underline font-mono uppercase font-black text-left cursor-pointer flex items-center gap-0.5"
                                  >
                                    ✓ Entregar
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Start date */}
                            <td className="py-3.5 px-4 font-mono text-[10.5px]">
                              {m.inicio ? (
                                <div className="text-slate-800 font-semibold">{formatDateTime(m.inicio)}</div>
                              ) : (
                                <span className="text-slate-400 italic">No iniciado</span>
                              )}
                            </td>

                            {/* Estimated date */}
                            <td className="py-3.5 px-4 font-mono text-[10.5px] font-bold text-blue-800 bg-blue-50/20">
                              {m.fechaest ? formatDate(m.fechaest) : <span className="text-slate-400 font-normal italic">Sin fecha</span>}
                            </td>

                            {/* End date & Duration */}
                            <td className="py-3.5 px-4 font-mono text-[10.5px]">
                              {m.fin ? (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-emerald-800 font-bold">{formatDateTime(m.fin)}</span>
                                  {durStr && (
                                    <span className="inline-block px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 font-sans text-[9px] font-black uppercase tracking-wider leading-none rounded-none shadow-3xs">
                                      ⏱ {durStr}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">En desarrollo</span>
                              )}
                            </td>

                            {/* Plant / Sole Type */}
                            <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700">
                              {m.planta ? (
                                <span className="bg-slate-100 px-2 py-1 border border-slate-200 text-slate-800 block text-center truncate max-w-[160px]" title={m.planta}>
                                  {m.planta}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No especificado</span>
                              )}
                            </td>

                            {/* Photos preview */}
                            <td className="py-3.5 px-4">
                              <div className="flex gap-2">
                                {m.imgPlanta ? (
                                  <div className="relative group/thumb border border-blue-200 p-0.5 bg-white shadow-2xs hover:border-cyan-500 cursor-pointer">
                                    <img src={m.imgPlanta} alt="Suela" className="w-8 h-8 object-cover" />
                                    <div className="hidden group-hover/thumb:block absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-300 text-[8px] uppercase tracking-widest font-mono font-bold px-2 py-1 whitespace-nowrap z-[100] border border-cyan-500/50 shadow-lg">
                                      SUELA CARGADA
                                    </div>
                                  </div>
                                ) : (
                                  <span className="w-8 h-8 border border-slate-200 border-dashed flex items-center justify-center text-slate-300 text-xs font-bold" title="Sin foto planta">
                                    🥿
                                  </span>
                                )}

                                {m.imgCap ? (
                                  <div className="relative group/thumb border border-blue-200 p-0.5 bg-white shadow-2xs hover:border-cyan-500 cursor-pointer">
                                    <img src={m.imgCap} alt="Capellada" className="w-8 h-8 object-cover" />
                                    <div className="hidden group-hover/thumb:block absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-300 text-[8px] uppercase tracking-widest font-mono font-bold px-2 py-1 whitespace-nowrap z-[100] border border-cyan-500/50 shadow-lg">
                                      CAPELLADA CARGADA
                                    </div>
                                  </div>
                                ) : (
                                  <span className="w-8 h-8 border border-slate-200 border-dashed flex items-center justify-center text-slate-300 text-xs font-bold" title="Sin foto capellada">
                                    👟
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Deliverables quick check */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1.5 max-w-[280px]">
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                                  <span className={allDone ? "text-emerald-700 font-extrabold" : "text-blue-800"}>
                                    Entregas: {doneEntregables}/{totalEntregables}
                                  </span>
                                  <span className={allDone ? "text-emerald-700 font-extrabold" : "text-cyan-700"}>
                                    {totalEntregables > 0 ? `${Math.round((doneEntregables / totalEntregables) * 100)}%` : '0%'}
                                  </span>
                                </div>

                                <div className="w-full bg-slate-100 border border-slate-300 h-2 rounded-none overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-350 ${allDone ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                    style={{ width: `${totalEntregables > 0 ? (doneEntregables / totalEntregables) * 100 : 0}%` }}
                                  />
                                </div>

                                {totalEntregables > 0 && !allDone && (
                                  <div className="text-[9px] text-slate-500 font-mono leading-tight mt-0.5 max-w-[200px] truncate" title={m.entregables.filter(e => !e.done).map(e => e.text).join(', ')}>
                                    Pendiente: {m.entregables.filter(e => !e.done).map(e => e.text).join(', ')}
                                  </div>
                                )}

                                {/* Interactive quick checkbox list on row hover */}
                                {totalEntregables > 0 && (
                                  <div className="hidden group-hover:flex flex-col gap-1 p-2 bg-slate-950 text-white border border-cyan-500/30 rounded-none mt-2 shadow-xl">
                                    <span className="text-[8.5px] font-mono text-cyan-300 uppercase tracking-widest font-black border-b border-slate-800 pb-1 mb-1">
                                      Checklist de Aprobaciones:
                                    </span>
                                    {m.entregables.map(e => (
                                      <label key={e.id} className="flex items-center gap-1.5 cursor-pointer text-[9.5px] select-none hover:text-cyan-300 transition-colors">
                                        <input
                                          type="checkbox"
                                          checked={e.done}
                                          onChange={() => handleToggleTableDeliverable(m.id, e.id)}
                                          className="w-2.5 h-2.5 text-slate-900 rounded-none focus:ring-0 border-slate-500 cursor-pointer"
                                        />
                                        <span className={e.done ? "line-through text-slate-500 font-mono" : "font-mono"}>{e.text}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Action buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(m)}
                                  className="p-1.5 border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-600 hover:text-blue-900 transition cursor-pointer"
                                  title="Editar toda la ficha del modelo"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(m.id, m.modelo)}
                                  className="p-1.5 border border-slate-200 hover:border-red-600 hover:bg-red-50 text-slate-400 hover:text-red-700 transition cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3.2: ANALYSIS & DASHBOARD */}
          {activeTab === 'analysis' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* 1. Futuristic KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Total */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-cyan-400/50 p-5 shadow-lg relative overflow-hidden group hover:border-cyan-400 transition-all">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl" />
                  <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest font-black block">Total Modelos</span>
                  <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 mt-2">{totalModelos}</div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 block border-t border-slate-800 pt-1">⚙️ Diseños Registrados</span>
                </div>

                {/* En Proceso */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-blue-400/50 p-5 shadow-lg relative overflow-hidden group hover:border-blue-400 transition-all">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
                  <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest font-black block">En Proceso</span>
                  <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300 mt-2">{enProcesoCount}</div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 block border-t border-slate-800 pt-1">⚙️ En Modelaje Activo</span>
                </div>

                {/* Pendientes */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-purple-400/50 p-5 shadow-lg relative overflow-hidden group hover:border-purple-400 transition-all">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
                  <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-black block">Pendientes</span>
                  <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 mt-2">{pendientesCount}</div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 block border-t border-slate-800 pt-1">⏳ Lista de Espera</span>
                </div>

                {/* Entregados */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-emerald-400/50 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-400 transition-all">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                  <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-black block">Entregados</span>
                  <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-300 mt-2">{entregadosCount}</div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 block border-t border-slate-800 pt-1">
                    {totalModelos > 0 ? `${Math.round((entregadosCount / totalModelos) * 100)}% de efectividad` : '0%'}
                  </span>
                </div>

                {/* Promedio Demora */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-rose-400/50 p-5 shadow-lg relative overflow-hidden group hover:border-rose-400 transition-all col-span-2 lg:col-span-1">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl" />
                  <span className="text-[10px] font-mono text-rose-300 uppercase tracking-widest font-black block">Tiempo Promedio</span>
                  <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-rose-300 mt-2">{avgDays !== '—' ? `${avgDays}d` : '—'}</div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 block border-t border-slate-800 pt-1">⏱️ Duración Promedio</span>
                </div>
              </div>

              {/* 2. Custom Futuristic Bar and Radial Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Demora en días por modelo (Electric Blue Bar Chart) */}
                <div className="bg-white border-2 border-slate-950 p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="font-extrabold uppercase text-xs tracking-wider text-slate-900 font-sans flex items-center gap-2">
                      <Clock size={16} className="text-blue-600 animate-spin-slow" />
                      ⏱️ Tiempo de Modelado por Prototipo (Año 2030)
                    </h3>
                    <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">Días de diseño transcurridos hasta el ensamble del prototipo físico</p>
                  </div>

                  {deliveredModelsWithTimes.length === 0 ? (
                    <div className="h-56 flex items-center justify-center border border-slate-200 border-dashed bg-slate-50 text-slate-400 font-mono text-[11px] italic">
                      Requiere registrar por lo menos un modelo ENTREGADO con fecha de inicio y fin.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {deliveredModelsWithTimes.map(m => {
                          const days = calculateDurationDaysNum(m.inicio, m.fin);
                          const maxDays = Math.max(...deliveredModelsWithTimes.map(x => calculateDurationDaysNum(x.inicio, x.fin))) || 1;
                          const percent = Math.max(10, Math.min(100, (days / maxDays) * 100));

                          return (
                            <div key={m.id} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono font-bold">
                                <span className="text-slate-900 font-sans font-bold flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                  {m.modelo}
                                </span>
                                <span className="text-blue-700">{days} {days === 1 ? 'Día' : 'Días'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 border border-slate-200 h-5 relative">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 border-r-2 border-cyan-300 flex items-center pl-2 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                                    style={{ width: `${percent}%` }}
                                  >
                                    <span className="text-[8.5px] text-white font-mono font-black uppercase tracking-wider">
                                      {days}d
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-2 text-right">
                        * Métricas sincronizadas cuánticamente en milisegundos reales.
                      </div>
                    </div>
                  )}
                </div>

                {/* Chart 2: Donut Bento Representation of current states */}
                <div className="bg-white border-2 border-slate-950 p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="font-extrabold uppercase text-xs tracking-wider text-slate-900 font-sans flex items-center gap-2">
                      <Activity size={16} className="text-cyan-500" />
                      📈 Estado de Operatividad del Taller
                    </h3>
                    <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">Distribución porcentual de los lanzamientos y fases activas</p>
                  </div>

                  {totalModelos === 0 ? (
                    <div className="h-56 flex items-center justify-center border border-slate-200 border-dashed bg-slate-50 text-slate-400 font-mono text-[11px] italic">
                      Aún no hay modelos registrados.
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                      {/* Visual Bento representation with glow color markers */}
                      <div className="flex-1 w-full space-y-2">
                        {[
                          { label: 'Entregados', count: entregadosCount, color: 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]', text: 'text-emerald-600' },
                          { label: 'En Proceso', count: enProcesoCount, color: 'bg-blue-600 border-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.3)]', text: 'text-blue-600' },
                          { label: 'Pendientes', count: pendientesCount, color: 'bg-slate-400 border-slate-300', text: 'text-slate-500' },
                          { label: 'Postergados', count: postergadosCount, color: 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]', text: 'text-rose-600' }
                        ].map(st => {
                          const pct = totalModelos > 0 ? Math.round((st.count / totalModelos) * 100) : 0;
                          return (
                            <div key={st.label} className="flex items-center justify-between text-xs border border-slate-100 p-2 hover:bg-slate-50 transition-colors bg-slate-50/50">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 ${st.color} border`} />
                                <span className="font-bold text-slate-800">{st.label}</span>
                              </div>
                              <div className="font-mono font-bold flex items-center gap-1.5">
                                <span className="text-slate-400 text-[10px]">({st.count})</span>
                                <span className={st.text}>{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Donut representation styling */}
                      <div className="w-32 h-32 relative shrink-0 flex items-center justify-center border-4 border-indigo-600/30 bg-slate-950 p-4 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                        <div className="absolute inset-0 border-2 border-cyan-400/20 animate-pulse rounded-none" />
                        <div className="text-center">
                          <span className="text-3xl font-black text-white">{totalModelos}</span>
                          <span className="block text-[8px] uppercase tracking-wider font-mono text-cyan-300 font-bold mt-1">Lanzamientos</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* =======================================================
          B. DEDICATED PRINT VIEW (VISIBLE ONLY WHEN PRINTING)
          ======================================================= */}
      <div className="hidden print:block space-y-8 bg-white text-slate-900 p-6 font-sans">
        
        {/* Futuristic Corporate Print Header */}
        <div className="border-b-4 border-blue-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase text-blue-900">BRIXTON FOOTWEAR 2030</h1>
            <p className="text-xs uppercase tracking-widest font-mono text-stone-500 font-bold">Reporte Consolidado de Control, Diseño & Lanzamiento de Modelos Nuevos</p>
          </div>
          <div className="text-right font-mono text-[9px] text-stone-600">
            <div>Sede de Producción: Carabayllo</div>
            <div>Fecha de Emisión: {new Date().toLocaleDateString('es-PE')}</div>
            <div>Hora del Reporte: {new Date().toLocaleTimeString('es-PE')}</div>
          </div>
        </div>

        {/* Consolidado Stats KPIs Row */}
        <div className="grid grid-cols-5 gap-4 border border-stone-300 p-4 bg-stone-50">
          <div className="text-center">
            <span className="text-[9px] uppercase font-mono text-stone-500 block">Total Modelos</span>
            <span className="text-2xl font-bold text-stone-900">{totalModelos}</span>
          </div>
          <div className="text-center border-l border-stone-250">
            <span className="text-[9px] uppercase font-mono text-blue-700 block">En Proceso</span>
            <span className="text-2xl font-bold text-blue-800">{enProcesoCount}</span>
          </div>
          <div className="text-center border-l border-stone-250">
            <span className="text-[9px] uppercase font-mono text-stone-600 block">Pendientes</span>
            <span className="text-2xl font-bold text-stone-800">{pendientesCount}</span>
          </div>
          <div className="text-center border-l border-stone-250">
            <span className="text-[9px] uppercase font-mono text-emerald-700 block">Entregados</span>
            <span className="text-2xl font-bold text-emerald-800">{entregadosCount}</span>
          </div>
          <div className="text-center border-l border-stone-250">
            <span className="text-[9px] uppercase font-mono text-rose-700 block">Tiempo Promedio</span>
            <span className="text-2xl font-bold text-rose-800">{avgDays !== '—' ? `${avgDays} días` : '—'}</span>
          </div>
        </div>

        {/* Master Control Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 font-mono border-b border-stone-300 pb-1 flex items-center gap-2">
            📊 I. LISTADO GENERAL DE CONTROL DE SEGUIMIENTO (PROTOS)
          </h3>
          <table className="w-full text-[10px] text-left border-collapse border border-stone-300">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-400 font-mono text-[9px] uppercase text-stone-700">
                <th className="py-2 px-3 w-8 border-r border-stone-300">N°</th>
                <th className="py-2 px-3 border-r border-stone-300">Modelo (Prototipo)</th>
                <th className="py-2 px-3 border-r border-stone-300">Estado</th>
                <th className="py-2 px-3 border-r border-stone-300">Fecha Inicio</th>
                <th className="py-2 px-3 border-r border-stone-300">Est. Entrega</th>
                <th className="py-2 px-3 border-r border-stone-300">Fecha Fin</th>
                <th className="py-2 px-3 border-r border-stone-300">Tipo Planta</th>
                <th className="py-2 px-3">Checklist Aprobación (Entregables)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {modelos.map((m, index) => {
                const doneEntregables = m.entregables?.filter(e => e.done).length || 0;
                const totalEntregables = m.entregables?.length || 0;
                return (
                  <tr key={m.id} className="align-top hover:bg-stone-50">
                    <td className="py-2 px-3 font-mono border-r border-stone-300 text-center">{index + 1}</td>
                    <td className="py-2 px-3 font-bold border-r border-stone-300">{m.modelo}</td>
                    <td className="py-2 px-3 font-mono uppercase border-r border-stone-300 text-xs text-blue-900 font-bold">{m.estado}</td>
                    <td className="py-2 px-3 border-r border-stone-300 text-[9px] font-mono">{m.inicio ? formatDateTime(m.inicio) : '—'}</td>
                    <td className="py-2 px-3 border-r border-stone-300 text-[9px] font-mono font-bold text-stone-800">{m.fechaest ? formatDate(m.fechaest) : '—'}</td>
                    <td className="py-2 px-3 border-r border-stone-300 text-[9px] font-mono text-emerald-800 font-bold">{m.fin ? formatDateTime(m.fin) : '—'}</td>
                    <td className="py-2 px-3 border-r border-stone-300 font-mono text-stone-700">{m.planta || '—'}</td>
                    <td className="py-2 px-3">
                      <div className="space-y-1">
                        <div className="font-bold font-mono text-stone-900">{doneEntregables}/{totalEntregables} ({totalEntregables > 0 ? Math.round((doneEntregables / totalEntregables) * 100) : 0}%)</div>
                        <div className="text-[8.5px] text-stone-600 leading-tight">
                          {m.entregables.map(e => `${e.done ? '✅ [Aprobado]' : '❌ [Pendiente]'} ${e.text}`).join(', ')}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Charts & Analysis printable layouts (Page breaking if too long) */}
        <div className="space-y-6 pt-4 page-break-before">
          <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 font-mono border-b border-stone-300 pb-1">
            📊 II. ANÁLISIS CRONOMETRADO Y DURACIÓN DE PROCESOS
          </h3>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Printable Tiempo de modelaje chart */}
            <div className="border border-stone-300 p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase text-stone-800 font-mono border-b border-stone-200 pb-1">Duración en Días por Prototipo</h4>
              {deliveredModelsWithTimes.length === 0 ? (
                <div className="text-[10px] text-stone-400 italic">No hay datos de entrega real registrados con fecha inicio y fin.</div>
              ) : (
                <div className="space-y-3">
                  {deliveredModelsWithTimes.map(m => {
                    const days = calculateDurationDaysNum(m.inicio, m.fin);
                    const maxDays = Math.max(...deliveredModelsWithTimes.map(x => calculateDurationDaysNum(x.inicio, x.fin))) || 1;
                    const percent = Math.max(10, Math.min(100, (days / maxDays) * 100));
                    return (
                      <div key={m.id} className="text-[9.5px]">
                        <div className="flex justify-between font-mono font-bold text-stone-700">
                          <span>{m.modelo}</span>
                          <span>{days} días</span>
                        </div>
                        <div className="w-full bg-stone-100 border border-stone-300 h-3 relative mt-1">
                          <div className="h-full bg-blue-600 border-r border-stone-800 animate-none" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Printable Distribución de estados */}
            <div className="border border-stone-300 p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase text-stone-800 font-mono border-b border-stone-200 pb-1">Distribución de Estados en Planta</h4>
              <div className="space-y-2 text-[10px]">
                {[
                  { label: 'Entregados', count: entregadosCount },
                  { label: 'En Proceso', count: enProcesoCount },
                  { label: 'Pendientes', count: pendientesCount },
                  { label: 'Postergados', count: postergadosCount }
                ].map(st => {
                  const pct = totalModelos > 0 ? Math.round((st.count / totalModelos) * 100) : 0;
                  return (
                    <div key={st.label} className="flex justify-between items-center py-1 border-b border-stone-200">
                      <span className="font-bold text-stone-700">{st.label}</span>
                      <span className="font-mono text-stone-900 font-bold">{st.count} unidades ({pct}%)</span>
                    </div>
                  );
                })}
                <div className="pt-3 text-center font-bold text-blue-900 font-mono text-xs">
                  TOTAL: {totalModelos} Lanzamientos Registrados
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Footer notes */}
        <div className="border-t border-stone-300 pt-3 text-[8px] text-stone-500 font-mono flex justify-between">
          <span>* Brixton System Engine v2030 - Autenticación y Criptografía Integrada</span>
          <span>Firma del Taller y Control de Calidad: ______________________</span>
        </div>

      </div>

      {/* =======================================================
          C. ADD / EDIT FULL MODAL FORM (REMAINS HIGHLY INTERACTIVE)
          ======================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[999] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white border-2 border-slate-950 w-full max-w-2xl p-6 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header with beautiful gradient blue line */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-5">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 font-sans flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-none animate-pulse" />
                  {editingModelo ? `Editar Ficha: ${editingModelo.modelo}` : 'Registrar Ficha de Modelo Nuevo (2030)'}
                </h3>
                <p className="text-[9px] font-mono uppercase text-slate-400 mt-0.5">
                  Taller de Diseño & Maquetado de Muestras - Brixton v2030
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-900 p-1 border border-transparent hover:border-slate-300 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Core Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nombre Modelo */}
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1 tracking-wider uppercase font-mono">
                    Nombre del Modelo (Prototipo) *
                  </label>
                  <input
                    type="text"
                    value={modeloName}
                    onChange={(e) => setModeloName(e.target.value.toUpperCase())}
                    placeholder="Ej. TOWER PRO, MASTER MASTER"
                    className="w-full bg-white border border-slate-300 px-3 py-2 text-xs font-bold rounded-none focus:outline-none focus:border-blue-600 placeholder-slate-400"
                    required
                  />
                </div>

                {/* Tipo Planta */}
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1 tracking-wider uppercase font-mono">
                    Tipo de Planta / Suela
                  </label>
                  <input
                    type="text"
                    value={plantaType}
                    onChange={(e) => setPlantaType(e.target.value.toUpperCase())}
                    placeholder="Ej. SUELA EVOLUTION COMFORT"
                    className="w-full bg-white border border-slate-300 px-3 py-2 text-xs font-bold rounded-none focus:outline-none focus:border-blue-600 placeholder-slate-400"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1 tracking-wider uppercase font-mono">
                    Estado Actual
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 px-3 py-2 text-xs font-bold rounded-none focus:outline-none focus:border-blue-600"
                  >
                    <option value="PENDIENTE">⏳ PENDIENTE (En lista de espera)</option>
                    <option value="EN PROCESO">⚙️ EN PROCESO (En taller / patronaje)</option>
                    <option value="ENTREGADO">✅ ENTREGADO (Aprobado para producción)</option>
                    <option value="POSTERGADO">⚠️ POSTERGADO (Con dificultades)</option>
                  </select>
                </div>

                {/* Fecha Estimada */}
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1 tracking-wider uppercase font-mono">
                    Fecha Estimada de Entrega
                  </label>
                  <input
                    type="date"
                    value={fechaEst}
                    onChange={(e) => setFechaEst(e.target.value)}
                    className="w-full bg-white border border-slate-300 px-3 py-2 text-xs font-bold rounded-none focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Time Control Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-[9px] font-mono text-blue-800 uppercase tracking-widest font-black block border-b border-slate-200 pb-1">
                  ⏱️ Control de Tiempos Inteligente
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fecha Inicio */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block text-slate-600 text-[10px] font-bold tracking-wider uppercase font-mono">
                        Modelaje Inicio
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[9.5px] font-mono font-bold text-blue-700">
                        <input
                          type="checkbox"
                          checked={autoInicioChecked}
                          onChange={(e) => handleToggleAutoInicio(e.target.checked)}
                          className="w-2.5 h-2.5 text-blue-600 rounded-none focus:ring-0 border-slate-400 cursor-pointer"
                        />
                        ✓ Registrar Hora Actual
                      </label>
                    </div>
                    <input
                      type="datetime-local"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full bg-white border border-slate-300 px-3 py-2 text-xs font-bold rounded-none focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Modelaje Fin */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block text-slate-600 text-[10px] font-bold tracking-wider uppercase font-mono">
                        Modelaje Fin / Entrega
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[9.5px] font-mono font-bold text-emerald-700">
                        <input
                          type="checkbox"
                          checked={autoFinChecked}
                          onChange={(e) => handleToggleAutoFin(e.target.checked)}
                          className="w-2.5 h-2.5 text-emerald-600 rounded-none focus:ring-0 border-slate-400 cursor-pointer"
                        />
                        ✓ Marcar Entregado Ahora
                      </label>
                    </div>
                    <input
                      type="datetime-local"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full bg-white border border-slate-300 px-3 py-2 text-xs font-bold rounded-none focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {fechaInicio && fechaFin && (
                  <div className="text-[10px] font-mono font-bold bg-blue-50 text-blue-950 p-2 border border-blue-200">
                    ⏱️ Duración de Desarrollo: <span className="underline">{calculateDurationStr(fechaInicio, fechaFin)}</span>
                  </div>
                )}
              </div>

              {/* Checklist de Entregables */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block border-b border-slate-200 pb-1">
                  ✅ Entregables Requeridos del Área de Modelaje ({formEntregables.filter(e => e.done).length}/{formEntregables.length})
                </span>

                <div className="bg-slate-50 border border-slate-200 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {formEntregables.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-mono">No hay entregables configurados.</p>
                  ) : (
                    formEntregables.map(e => (
                      <div key={e.id} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-b-0">
                        <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={e.done}
                            onChange={() => handleToggleFormEntregable(e.id)}
                            className="w-3.5 h-3.5 text-blue-600 rounded-none focus:ring-0 border-slate-300 cursor-pointer"
                          />
                          <span className={e.done ? "line-through text-slate-400 font-mono" : "font-semibold text-slate-700 font-mono"}>{e.text}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormEntregable(e.id)}
                          className="text-[11px] text-slate-400 hover:text-red-600 px-1 font-extrabold cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new deliverable */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEntregableText}
                    onChange={(e) => setNewEntregableText(e.target.value)}
                    placeholder="Escribe un entregable personalizado (ej. Prueba física de costura)..."
                    className="flex-1 bg-white border border-slate-300 px-3 py-1.5 text-xs rounded-none focus:outline-none font-medium placeholder-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFormEntregable();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFormEntregable}
                    className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider rounded-none cursor-pointer"
                  >
                    + Añadir
                  </button>
                </div>
              </div>

              {/* Textareas */}
              <div className="space-y-4">
                {(estado === 'POSTERGADO' || motivo) && (
                  <div>
                    <label className="block text-rose-700 text-[10px] font-bold mb-1 tracking-wider uppercase font-mono">
                      ⚠️ Motivo de la Postergación / Dificultades Detectadas *
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Explica qué dificultades surgieron con este prototipo..."
                      className="w-full bg-white border-2 border-rose-300 px-3 py-2 text-xs font-mono font-semibold rounded-none focus:outline-none focus:ring-0 text-slate-900 focus:border-rose-500 placeholder-slate-400"
                      rows={2}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1 tracking-wider uppercase font-mono">
                    Comentarios y Notas Adicionales
                  </label>
                  <textarea
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    placeholder="Escribe apuntes generales adicionales..."
                    className="w-full bg-white border border-slate-300 px-3 py-2 text-xs rounded-none focus:outline-none focus:border-blue-600 text-slate-900 placeholder-slate-400"
                    rows={2}
                  />
                </div>
              </div>

              {/* Photos upload section */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block border-b border-slate-200 pb-1">
                  📸 Fotos de Diseño y Prototipado
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto Planta */}
                  <div className="border border-slate-200 p-4 bg-slate-50 flex flex-col items-center justify-center text-center space-y-2 relative group min-h-[140px]">
                    {imgPlanta ? (
                      <div className="relative w-full flex flex-col items-center">
                        <img src={imgPlanta} alt="Suela" className="max-h-24 object-contain border border-slate-300 p-1 bg-white" />
                        <button
                          type="button"
                          onClick={() => setImgPlanta('')}
                          className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 border border-slate-700 hover:bg-red-600 transition"
                        >
                          <X size={10} />
                        </button>
                        <span className="text-[8.5px] font-mono text-slate-400 mt-1 uppercase tracking-widest">Suela cargada</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-slate-350" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-700">Foto de Suela / Planta</p>
                          <p className="text-[8.5px] text-slate-400 font-mono">Convertir JPG/PNG a Base64</p>
                        </div>
                        <label className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-950 text-[9px] font-black uppercase tracking-wider cursor-pointer font-mono hover:bg-slate-50 transition">
                          Subir Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'planta')}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Foto Capellada */}
                  <div className="border border-slate-200 p-4 bg-slate-50 flex flex-col items-center justify-center text-center space-y-2 relative group min-h-[140px]">
                    {imgCap ? (
                      <div className="relative w-full flex flex-col items-center">
                        <img src={imgCap} alt="Capellada" className="max-h-24 object-contain border border-slate-300 p-1 bg-white" />
                        <button
                          type="button"
                          onClick={() => setImgCap('')}
                          className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 border border-slate-700 hover:bg-red-600 transition"
                        >
                          <X size={10} />
                        </button>
                        <span className="text-[8.5px] font-mono text-slate-400 mt-1 uppercase tracking-widest">Capellada cargada</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-slate-350" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-700">Foto de Capellada / Aparado</p>
                          <p className="text-[8.5px] text-slate-400 font-mono">Convertir JPG/PNG a Base64</p>
                        </div>
                        <label className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-950 text-[9px] font-black uppercase tracking-wider cursor-pointer font-mono hover:bg-slate-50 transition">
                          Subir Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'capellada')}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 hover:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-900 text-white font-black uppercase tracking-wider text-[10px] cursor-pointer shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] active:translate-x-0.5 active:translate-y-0.5"
                >
                  💾 Guardar Ficha de Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
