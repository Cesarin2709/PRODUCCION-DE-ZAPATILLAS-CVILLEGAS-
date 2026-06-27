import React, { useState } from 'react';
import { 
  ClipboardList, 
  BarChart3, 
  Users, 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Settings,
  HelpCircle,
  Footprints,
  Layers,
  Wrench,
  BookOpen,
  Menu,
  Plus,
  Minus,
  Scissors,
  Image,
  Coins,
  Database
} from 'lucide-react';
import { Pedido } from '../types';
import { QuickProductionEntry } from './QuickProductionEntry';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  pedidos: Pedido[];
  proximoCodigo: string;
  onSaveQuickPedido: (pedido: Pedido) => void;
  onSaveNewModelToBase?: (model: {
    codigo: string;
    modelo: string;
    color: string;
    talla: string;
    tipo: string;
    linea: string;
    suela: string;
  }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  pedidos,
  proximoCodigo,
  onSaveQuickPedido,
  onSaveNewModelToBase
}) => {
  const [lineasActivasOpen, setLineasActivasOpen] = useState(false);
  const [baseModelosOpen, setBaseModelosOpen] = useState(false);

  // Form states for new model in base
  const [newModCodigo, setNewModCodigo] = useState('');
  const [newModModelo, setNewModModelo] = useState('');
  const [newModColor, setNewModColor] = useState('');
  const [newModTalla, setNewModTalla] = useState('39/42');
  const [newModTipo, setNewModTipo] = useState('CABALLERO');
  const [newModLinea, setNewModLinea] = useState('Deportivas/Caucho');
  const [newModSuela, setNewModSuela] = useState('');

  const handleCreateNewModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModCodigo.trim() || !newModModelo.trim() || !newModColor.trim()) {
      alert("Por favor rellene Código, Modelo y Color.");
      return;
    }
    if (onSaveNewModelToBase) {
      onSaveNewModelToBase({
        codigo: newModCodigo.trim().toUpperCase(),
        modelo: newModModelo.trim().toUpperCase(),
        color: newModColor.trim().toUpperCase(),
        talla: newModTalla,
        tipo: newModTipo,
        linea: newModLinea.trim(),
        suela: newModSuela.trim() || 'ESTÁNDAR'
      });
      // Clear
      setNewModCodigo('');
      setNewModModelo('');
      setNewModColor('');
      setNewModSuela('');
      setBaseModelosOpen(false);
    }
  };

  const SEM: number[] = Array.from(new Set<number>(pedidos.map(p => Number(p.semana)))).sort((a: number, b: number) => a - b);
  const maxSemVal = SEM.length > 0 ? Math.max(...SEM) : 24;
  const nextSemVal = maxSemVal + 1;

  const menuItems = [
    {
      id: 'pedidos',
      label: 'PRODUCCIÓN DE CALZADO',
      sub: 'Lotes de producción',
      icon: Footprints
    },
    {
      id: 'seguimiento_modelo',
      label: 'SEGUIMIENTO DE MODELO NUEVO',
      sub: 'Control y Diseño de Prototipos',
      icon: ClipboardList
    },
    {
      id: 'santos_destajo',
      label: 'SANTOS DESTAJO',
      sub: 'Cálculo de Operaciones y Pago',
      icon: Scissors
    },
    {
      id: 'carlos_destajo',
      label: 'CARLOS DESTAJO',
      sub: 'Habilitado y Ensuelado',
      icon: Coins
    },
    {
      id: 'jonas_destajo',
      label: 'JONAS DESTAJO',
      sub: 'Habilitado y Ensuelado',
      icon: Coins
    },
    {
      id: 'cristhian_destajo',
      label: 'CRISTHIAN DESTAJO',
      sub: 'Habilitado y Ensuelado',
      icon: Coins
    },
    {
      id: 'historial_pagos',
      label: 'HISTORIAL DE PAGOS',
      sub: 'Base de Datos de Pagos por Fecha',
      icon: Database
    },
    {
      id: 'analisis',
      label: 'ANALISIS',
      sub: 'Diagnóstico & Planificación',
      icon: BarChart3
    },
    {
      id: 'catalogo',
      label: 'BASE DE MODELOS & GALERÍA',
      sub: 'Base Maestra, Especificaciones e Imágenes',
      icon: BookOpen
    },
    {
      id: 'asistencia',
      label: 'ASISTENCIA',
      sub: 'Control de Personal & Reportes',
      icon: Users
    },
    {
      id: 'marketing',
      label: 'ESTUDIO Y ANALISIS DE MERCADO',
      sub: 'Estudios de Canales & Competidores',
      icon: TrendingUp
    }
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-[#1A1A1A] text-stone-100 flex flex-col transition-all duration-300 z-45 border-r border-stone-800
          ${collapsed ? 'w-18' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-800/80">
          <div className="flex items-center gap-3 overflow-hidden select-none">
            <div className="w-10 h-10 bg-white rounded-none flex items-center justify-center text-[#1A1A1A] shrink-0 font-serif font-black text-xl border border-stone-700">
              S
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-[10px] uppercase tracking-[0.15em] font-sans text-stone-400">SISTEMA DE CALZADO</span>
                <span className="font-serif italic font-bold text-sm tracking-tight text-white leading-tight mt-0.5">César Villegas</span>
              </div>
            )}
          </div>

          {/* Collapse button for Desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 hover:bg-stone-800 rounded-none text-stone-400 hover:text-white transition cursor-pointer"
            title={collapsed ? "Expandir menú de navegación" : "Colapsar menú de navegación"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Quick System Badges under header - Desglosable / Dropdown */}
        {!collapsed && (
          <div className="mx-3 my-2 space-y-2 selection:bg-amber-500 selection:text-stone-900">
            {/* 1. BASE DE MODELOS COLLAPSIBLE */}
            <div className="space-y-1">
              <button
                onClick={() => setBaseModelosOpen(!baseModelosOpen)}
                className="w-full text-left p-3 bg-stone-900 border border-stone-800 rounded-none flex items-center justify-between cursor-pointer focus:outline-none hover:bg-stone-850/80 hover:border-stone-700 transition duration-150 group"
                title="Registrar nuevo modelo en la base maestra"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-none bg-blue-500 animate-pulse"></span>
                  <span className="text-[9.5px] text-stone-200 font-extrabold uppercase tracking-[0.12em]">BASE DE MODELOS</span>
                </div>
                <div className="text-stone-400 group-hover:text-blue-400 transition-colors flex items-center justify-center">
                  {baseModelosOpen ? <Minus size={15} /> : <Plus size={15} />}
                </div>
              </button>

              {baseModelosOpen && (
                <form onSubmit={handleCreateNewModel} className="p-3.5 bg-[#1F1F1F] border border-stone-850 rounded-none space-y-3">
                  <div className="border-b border-stone-800 pb-1.5">
                    <span className="text-[8px] font-black tracking-widest text-[#FFF] uppercase block">
                      REGISTRAR MODELO NUEVO
                    </span>
                  </div>

                  <div className="space-y-2 text-left">
                    <div>
                      <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Código Modelo</label>
                      <input
                        type="text"
                        placeholder="ej. C32508107"
                        value={newModCodigo}
                        onChange={(e) => setNewModCodigo(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-2 py-1 outline-none uppercase font-mono font-bold focus:border-stone-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Nombre Modelo</label>
                      <input
                        type="text"
                        placeholder="ej. ABSOLUTE"
                        value={newModModelo}
                        onChange={(e) => setNewModModelo(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-2 py-1 outline-none uppercase font-bold focus:border-stone-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Color Corte</label>
                        <input
                          type="text"
                          placeholder="ej. NEGRO"
                          value={newModColor}
                          onChange={(e) => setNewModColor(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-2 py-1 outline-none uppercase font-bold focus:border-stone-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Suela</label>
                        <input
                          type="text"
                          placeholder="ej. Elite"
                          value={newModSuela}
                          onChange={(e) => setNewModSuela(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-2 py-1 outline-none uppercase font-bold focus:border-stone-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Serie Tallas</label>
                        <select
                          value={newModTalla}
                          onChange={(e) => {
                            setNewModTalla(e.target.value);
                            // Auto map Tipo if user updates Serie Tallas to match convention
                            if (e.target.value === '39/42') setNewModTipo('CABALLERO');
                            if (e.target.value === '35/38') setNewModTipo('DAMA');
                            if (e.target.value === '29/34') setNewModTipo('JUNIOR');
                          }}
                          className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-1 py-1 outline-none font-bold focus:border-stone-600 cursor-pointer"
                        >
                          <option value="39/42">39/42 (Cab)</option>
                          <option value="35/38">35/38 (Dama)</option>
                          <option value="29/34">29/34 (Jr)</option>
                          <option value="37/40">37/40 (Otro)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Tipo/Horma</label>
                        <select
                          value={newModTipo}
                          onChange={(e) => setNewModTipo(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-1 py-1 outline-none font-bold focus:border-stone-600 cursor-pointer"
                        >
                          <option value="CABALLERO">CABALLERO</option>
                          <option value="DAMA">DAMA</option>
                          <option value="JUNIOR">JUNIOR</option>
                          <option value="OTROS">OTROS</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-400 text-[8px] font-bold uppercase tracking-wider mb-0.5">Línea de Fabricación</label>
                      <select
                        value={newModLinea}
                        onChange={(e) => setNewModLinea(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 text-white text-[10px] px-2 py-1 outline-none font-bold focus:border-stone-600 cursor-pointer"
                      >
                        <option value="Deportivas/Caucho">Deportivas/Caucho</option>
                        <option value="Textil/Eva">Textil/Eva</option>
                        <option value="Botas/Caucho">Botas/Caucho</option>
                        <option value="Chimpunes">Chimpunes</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white text-[9px] uppercase tracking-wider font-extrabold py-2 cursor-pointer transition"
                  >
                    Guardar en Base
                  </button>
                </form>
              )}
            </div>

            {/* 2. INGRESAR ORDENES COLLAPSIBLE */}
            <div className="space-y-1">
              <button
                onClick={() => setLineasActivasOpen(!lineasActivasOpen)}
                className="w-full text-left p-3 bg-stone-900 border border-stone-800 rounded-none flex items-center justify-between cursor-pointer focus:outline-none hover:bg-stone-850/80 hover:border-stone-700 transition duration-150 group"
                title="Registro de Pedidos u Órdenes Rápido"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse"></span>
                  <span className="text-[9.5px] text-stone-200 font-extrabold uppercase tracking-[0.12em]">INGRESAR ORDENES</span>
                </div>
                <div className="text-stone-400 group-hover:text-amber-400 transition-colors flex items-center justify-center" title="Desplegar registro">
                  {lineasActivasOpen ? <Minus size={15} /> : <Plus size={15} />}
                </div>
              </button>

              {lineasActivasOpen && (
                <div className="p-3.5 bg-[#1F1F1F] border border-stone-850 rounded-none space-y-2.5 max-h-[380px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                  <div className="border-b border-stone-800 pb-1.5 mb-1 flex items-center justify-between">
                    <span className="text-[8px] font-black tracking-widest text-[#FFF] uppercase">
                      INGRESAR ORDENES
                    </span>
                    <span className="text-[8px] font-mono text-stone-500">
                      REGISTRO RÁPIDO
                    </span>
                  </div>
                  <QuickProductionEntry
                    proximoCodigo={proximoCodigo}
                    onSaveQuickPedido={onSaveQuickPedido}
                    semanaPreseleccionada="23"
                    sidebarMode={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-none font-bold text-xs transition duration-150 relative cursor-pointer
                  ${active 
                    ? 'bg-stone-800 font-extrabold text-white border-l-2 border-white' 
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
                  }
                `}
                title={item.label}
              >
                <Icon size={15} className={`shrink-0 ${active ? 'text-white' : 'text-stone-400'}`} />
                
                {!collapsed && (
                  <div className="flex flex-col items-start text-left">
                    <span className="tracking-wide">{item.label}</span>
                    <span className={`text-[9px] font-medium leading-none mt-0.5 ${active ? 'text-stone-300 italic font-serif' : 'text-stone-500'}`}>
                      {item.sub}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile details at the bottom of the sidebar */}
        <div className="p-4 border-t border-stone-800 bg-[#141414]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-none bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold shrink-0 text-xs">
              CV
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 select-none">
                <span className="font-extrabold text-[11px] text-stone-200 truncate leading-snug">Cesar Villegas</span>
                <span className="text-[9px] text-stone-500 truncate leading-none mt-0.5">cesarvillegas2709@</span>
              </div>
            )}
          </div>
          
          {/* Quick legal/developer tag if not collapsed */}
          {!collapsed && (
            <div className="mt-3 text-center">
              <span className="text-[9px] text-stone-600 font-bold uppercase tracking-[0.2em] font-mono">
                SISTEMA MAESTRO v1.1
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
