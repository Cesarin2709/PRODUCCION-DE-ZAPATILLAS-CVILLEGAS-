import React from 'react';
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
  Wrench
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const menuItems = [
    {
      id: 'pedidos',
      label: 'Pedidos de Calzado',
      sub: 'Lotes de producción',
      icon: Footprints
    },
    {
      id: 'analytics',
      label: 'Estadísticas & Semanas',
      sub: 'Monitoreo de taller',
      icon: BarChart3
    },
    {
      id: 'vendedores',
      label: 'Vendedores & Talleres',
      sub: 'Equipos y rendimiento',
      icon: Users
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
              T
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-[10px] uppercase tracking-[0.15em] font-sans text-stone-400">Taller Calzado</span>
                <span className="font-serif italic font-bold text-sm tracking-tight text-white leading-tight mt-0.5">Control de Lotes</span>
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

        {/* Quick System Badge under header */}
        {!collapsed && (
          <div className="mx-3 my-3 p-3 bg-stone-900 border border-stone-800 rounded-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-400"></span>
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.2em]">LÍNEAS ACTIVAS</span>
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
                Zapato Lote Engine v1.1
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
