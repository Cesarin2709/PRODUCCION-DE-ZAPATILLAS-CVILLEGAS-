import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  MapPin, 
  Trophy, 
  Brain, 
  Megaphone, 
  TrendingUp, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Flame, 
  Compass, 
  Activity, 
  CheckCircle2, 
  User, 
  Sliders, 
  ChevronRight, 
  Check, 
  Info,
  Building,
  Target
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const MarketingDashboard: React.FC = () => {
  // Navigation active subsection
  const [activeSubSection, setActiveSubSection] = useState('inicio');
  
  // Color tabs state
  const [colorTab, setColorTab] = useState<number>(0);
  
  // Selected City for detailed view
  const [selectedCity, setSelectedCity] = useState<string>('Lima');
  
  // Marketing plan active card details expansion
  const [activePlan, setActivePlan] = useState<string>('pichanga');
  
  // Interactive Growth Simulator Slider state (percent of implementation)
  const [implementationLevel, setImplementationLevel] = useState<number>(75);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: '¡Hola César! Soy el consejero inteligente de mercado de Brixton. 👟 He analizado a fondo tus datos de producción de calzado peruano y el plan de marketing de 12 meses. Pregúntame sobre qué colores priorizar por tienda, cómo lanzar la línea escolar en Trujillo, o sugerencias específicas de pauta digital.',
      time: 'Listo'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Color Swatch descriptions
  const generalSwatches = [
    { color: '#FFFFFF', name: 'Blanco Puro', pct: '62%', border: 'border-stone-400', desc: 'Símbolo de estatus y novedad. El preferido por jóvenes de 15-35 años en Lima Norte y Trujillo.' },
    { color: '#1A1A1A', name: 'Negro Clásico', pct: '58%', border: 'border-stone-850', desc: 'Máxima seguridad. Altamente vendido para uso multipropósito en Arequipa y Cusco.' },
    { color: '#FF3B30', name: 'Rojo/Coral', pct: '47%', border: 'border-[#FF3B30]', desc: 'Color institucional de Brixton y de la selección. Despierta pasión y sentido patriótico.' },
    { color: '#0A84FF', name: 'Azul Real', pct: '44%', border: 'border-[#0A84FF]', desc: 'Domina el calzado institucional y los torneos amateurs nocturnos.' },
    { color: '#5C4033', name: 'Marrón/Moca', pct: '38%', border: 'border-amber-900', desc: 'Tendencia emergente #1. Combinación urbana muy demandada por el sector "Athleisure".' },
    { color: '#FFB800', name: 'Amarillo/Oro', pct: '32%', border: 'border-amber-400', desc: 'Indispensable en calzado intercolegial y diseños de alta visibilidad.' }
  ];

  const colorPlazasBreakdown = [
    { name: 'Lima Metropolitana', colors: ['#FFFFFF', '#1A1A1A', '#5C4033', '#C0C0C0'], details: 'Blanco lidera en distritos modernos (Miraflores, Surco); Negro y combinaciones de alto contraste en Lima Norte/Este.' },
    { name: 'Sierra (Cusco, Puno, Arequipa)', colors: ['#FF3B30', '#0A84FF', '#1A1A1A', '#8B6914'], details: 'Fuerte preferencia por tonos de alta saturación y contraste debido a la rica cultura andina cromática.' },
    { name: 'Costa Norte (Trujillo, Piura)', colors: ['#FFFFFF', '#FFB800', '#FF3B30', '#30D158'], details: 'La capital del calzado prefiere calzado blanco y claros veraniegos por condiciones climáticas de calor constante.' }
  ];

  // Specific city metrics to show in interactive panel
  const citiesData: Record<string, {
    region: string;
    score: number;
    colors: string[];
    details: string;
    targetBuyer: string;
    bestModel: string;
    strategy: string;
  }> = {
    'Lima': {
      region: 'Costa Central (Sede Principal)',
      score: 95,
      colors: ['Blanco Puro (65%)', 'Negro Mate (55%)', 'Azul Real (45%)'],
      targetBuyer: 'Urbano deportista, jugador de pichangas nocturnas de clase media-baja (16-30 años).',
      bestModel: 'Modelos KILLER y PRECISION',
      details: 'El 55% de la producción total nacional se consume aquí. Lima Norte y Este concentran la mayor densidad de losas deportivas por kilómetro cuadrado.',
      strategy: 'Distribuidores en galerías clave del centro (Jirón Huallaga) + Campaña geolocalizada en Instagram para canchas de Lima Norte.'
    },
    'Trujillo': {
      region: 'La Libertad - Norperú',
      score: 88,
      colors: ['Blanco Escolar (70%)', 'Rojo Fuego (50%)', 'Amarillo Oro (40%)'],
      targetBuyer: 'Padres de familia para calzado escolar, zapateros mayoristas locales buscando reventa.',
      bestModel: 'Línea FORCE FAST y BENOM',
      details: 'Competencia tradicional alta por fabricación de Trujillo. Se debe destacar la tecnología en la suela vulcanizada que dura 2x más que las artesanales sin marca.',
      strategy: 'Consignaciones selectas con los 5 principales mayoristas del CC El Recreo, destacando garantía de marca Brixton.'
    },
    'Arequipa': {
      region: 'Arequipa - Sierra Sur',
      score: 78,
      colors: ['Negro Total (60%)', 'Rojo Orgullo (50%)', 'Gris Plata (35%)'],
      targetBuyer: 'Líderes de clubes de fútbol de ligas distritales de Arequipa (Cayma, Yanahuara).',
      bestModel: 'Línea ABSOLUTE y ZOOM VAPOR',
      details: 'Alto nivel de lealtad local y marcas con arraigo regional. Conectividad con Cusco y Puno.',
      strategy: 'Patrocinar torneos locales de ligas de futsal corporativas del Sur profundo y dar cupones exclusivos vía distribuidores regionales.'
    },
    'Cusco': {
      region: 'Cusco - Atractivo Turístico',
      score: 65,
      colors: ['Rojo Incendio (55%)', 'Azul Andino (52%)', 'Marrón Terroso (48%)'],
      targetBuyer: 'Público juvenil escolar y universitarios, y sector informal del transporte urbano.',
      bestModel: 'Línea NEW FLEX y PANTHER',
      details: 'Preferencia por el color "Rojo" como elemento vital y colores de tierra. Demanda alta de zapatilla abrigadora de cuello acolchado.',
      strategy: 'Distribución mayorista con foco en ferias zonales y mercados rurales colindantes.'
    },
    'Chiclayo': {
      region: 'Lambayeque - Eje Comercial Norte',
      score: 62,
      colors: ['Blanco Puro (60%)', 'Verde Lima (38%)', 'Rojo (35%)'],
      targetBuyer: 'Comerciantes minoristas itinerantes de Chiclayo, Piura, y Jaén.',
      bestModel: 'Modelos MESSI y PRECISION',
      details: 'Chiclayo es un nodo estratégico: los pedidos aquí se redistribuyen a la selva norte (Amazonas/San Martín).',
      strategy: 'Establecer un punto logístico en el mercado nacional Moshoqueque para capturar pedidos mayoristas.'
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: query,
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const chatHistoryForBackend = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          history: chatHistoryForBackend
        })
      });

      const data = await res.json();
      
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: data.response || 'Disculpa César, tuve un problema procesando las estadísticas.',
        time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'Hubo un error de conexión con la IA de Brixton. Utilizando simulaciones optimizadas... Intenta de nuevo por favor.',
        time: 'Error'
      }]);
    }
  };

  const sendQuickQuestion = (q: string) => {
    handleSendMessage(q);
  };

  // Trajectory Simulation coordinates calculator
  // Adjusts visual graph y coordinates based on implementation levels
  const getGraphPoints = () => {
    const baseLine = [20, 22, 24, 25, 28]; // standard growth
    const targetBase = [20, 38, 62, 90, 125]; // 2x goal growth
    
    // interpolate based on implementation level
    const factor = implementationLevel / 100;
    const simulatedLine = baseLine.map((val, idx) => {
      const diff = targetBase[idx] - val;
      return Math.round(val + (diff * factor));
    });

    return {
      base: baseLine,
      simulated: simulatedLine
    };
  };

  const graphData = getGraphPoints();

  return (
    <div className="bg-[#0D0D12] text-[#F3F4F6] p-4 sm:p-8 rounded-none border border-stone-850 space-y-12 overflow-x-hidden font-sans select-none my-2 shadow-2xl">
      
      {/* BRAND HEADER & NAVIGATION LINK ANCHORS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-stone-800 pb-6 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#FF3B30] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 tracking-widest font-mono">ESTUDIO DE INTELIGENCIA</span>
            <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-mono">BRIXTON 2026 ACTIVE</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tight font-serif uppercase text-white leading-none">
            Plan de Marketing <span className="text-[#FF3B30] not-italic font-sans">2X</span>
          </h2>
          <p className="text-stone-400 text-[11px] font-bold uppercase tracking-wider mt-2 max-w-2xl leading-relaxed">
            Estrategia de posicionamiento territorial, optimización cromática y captación digital para duplicar la producción de Brixton en 12 meses.
          </p>
        </div>

        {/* Local Navigation bar on top of component */}
        <div className="flex flex-wrap gap-1.5 bg-[#14141C] p-1 border border-stone-850 max-w-full overflow-x-auto">
          {['inicio', 'colores', 'territorio', 'competidores', 'estrategias', 'roadmap', 'consejero'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubSection(tab);
                const element = document.getElementById(`brixton-sec-${tab}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition duration-150 shrink-0 cursor-pointer
                ${activeSubSection === tab 
                  ? 'bg-[#FF3B30] text-white' 
                  : 'text-stone-400 hover:text-white hover:bg-stone-900'}`}
            >
              {tab === 'inicio' ? 'PANORAMA' : tab === 'roadmap' ? 'PLAN 2X' : tab === 'consejero' ? 'CONSEJERO IA' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW HERO BOX AND KPIS */}
      <div id="brixton-sec-inicio" className="grid grid-cols-1 md:grid-cols-4 gap-4 scroll-mt-20">
        
        {/* KPI 1 */}
        <div className="bg-[#13131A] p-5 border border-stone-850 flex flex-col justify-between hover:border-[#FF3B30] transition duration-200">
          <div className="space-y-1">
            <span className="text-stone-450 text-[9px] font-extrabold uppercase tracking-[0.2em] block">Crecimiento Importación</span>
            <div className="text-3xl font-black text-emerald-400 font-serif italic">+14%</div>
            <p className="text-[10px] text-stone-500 font-mono mt-1">Calzado deportivo nacional en 2024–2025.</p>
          </div>
          <div className="border-t border-stone-900 pt-3 mt-4 flex items-center justify-between text-[9px] font-bold text-stone-450 uppercase tracking-widest">
            <span>Mercado Alza</span>
            <span className="text-emerald-400">▲ EXPANSIVO</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#13131A] p-5 border border-stone-850 flex flex-col justify-between hover:border-amber-500 transition duration-200">
          <div className="space-y-1">
            <span className="text-stone-450 text-[9px] font-extrabold uppercase tracking-[0.2em] block">Uso Capacidad Instalada</span>
            <div className="text-3xl font-black text-amber-500 font-serif italic">35%</div>
            <p className="text-[10px] text-stone-500 font-mono mt-1">Capacidad actual promedio de talleres peruanos.</p>
          </div>
          <div className="border-t border-stone-900 pt-3 mt-4 flex items-center justify-between text-[9px] font-bold text-stone-450 uppercase tracking-widest">
            <span>Potencial Lotes</span>
            <span className="text-amber-500">▼ BRECHA 2X OPORTUNIDAD</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#13131A] p-5 border border-stone-850 flex flex-col justify-between hover:border-[#0A84FF] transition duration-200">
          <div className="space-y-1">
            <span className="text-stone-450 text-[9px] font-extrabold uppercase tracking-[0.2em] block">Foco Gasto Urbano</span>
            <div className="text-3xl font-black text-[#0A84FF] font-serif italic">70%+</div>
            <p className="text-[10px] text-stone-500 font-mono mt-1">Lima + Costa Norte concentran el mercado de zapatillas.</p>
          </div>
          <div className="border-t border-stone-900 pt-3 mt-4 flex items-center justify-between text-[9px] font-bold text-stone-450 uppercase tracking-widest">
            <span>Ubicación Clave</span>
            <span className="text-[#0A84FF]">▲ LIMA Y PROVINCIAS</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#13131A] p-5 border border-stone-850 flex flex-col justify-between hover:border-purple-500 transition duration-200">
          <div className="space-y-1">
            <span className="text-stone-450 text-[9px] font-extrabold uppercase tracking-[0.2em] block">Consumo Athleisure</span>
            <div className="text-3xl font-black text-purple-400 font-serif italic">45%</div>
            <p className="text-[10px] text-stone-500 font-mono mt-1">De peruanos visten diariamente zapatillas deportivas.</p>
          </div>
          <div className="border-t border-stone-900 pt-3 mt-4 flex items-center justify-between text-[9px] font-bold text-stone-450 uppercase tracking-widest">
            <span>Híbrido Diario</span>
            <span className="text-purple-400">▲ CASUAL / URBANO</span>
          </div>
        </div>
      </div>

      {/* SEGMENT GROWTH CHART & EXPLANATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart representation */}
        <div className="bg-[#13131A] p-6 border border-stone-850 lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-900 pb-3">
            <div>
              <span className="text-[#FF3B30] text-[9px] font-bold tracking-widest uppercase font-mono">PANORAMA GENERAL DE VENTAS</span>
              <h3 className="text-lg font-bold text-white uppercase italic font-serif">Participación por Segmento en Perú</h3>
            </div>
            <span className="bg-stone-900 text-stone-400 text-[9px] font-mono px-2 py-1 uppercase font-bold tracking-wide border border-stone-800">Urbano & Canchas</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Custom Interactive Segment Progress Bars */}
            <div className="space-y-4">
              {[
                { label: 'Casual / Urbano (Sneakers)', pct: 32, color: 'bg-emerald-500' },
                { label: 'Futsal / Fútbol Sala', pct: 28, color: 'bg-[#FF3B30]' },
                { label: 'Running / Libre', pct: 18, color: 'bg-[#0A84FF]' },
                { label: 'Gym / Training', pct: 12, color: 'bg-amber-400' },
                { label: 'Regreso Escolar / Juvenil', pct: 10, color: 'bg-purple-500' }
              ].map((item) => (
                <div key={item.label} className="space-y-1 cursor-default group">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-stone-300 group-hover:text-white transition duration-150">{item.label}</span>
                    <span className="text-stone-400 font-mono italic">{item.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-stone-900 border border-stone-850 rounded-none overflow-hidden relative">
                    <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Micro segments chart graphic */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#0A0A0E] border border-stone-850 rounded-none space-y-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Radial representation */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-stone-850" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#FF3B30]" strokeWidth="3.5" strokeDasharray="32, 100" strokeLinecap="square" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" strokeWidth="3.5" strokeDasharray="28, 100" strokeDashoffset="-32" strokeLinecap="square" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#0A84FF]" strokeWidth="3.5" strokeDasharray="18, 100" strokeDashoffset="-60" strokeLinecap="square" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-white text-xl font-black font-serif italic">60%</span>
                  <span className="text-[8px] text-stone-450 uppercase font-mono tracking-widest leading-none">Urbano + Futsal</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 text-center font-mono leading-relaxed px-4 pt-1">
                La suma de calzado Casual y Futsal representa el **60%** de compras directas.
              </p>
            </div>
          </div>
        </div>

        {/* Tactical opportunities */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="bg-[#13131A] p-6 border border-stone-850 h-full space-y-4">
            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><Brain size={12} /> Diagnóstico Crítico de Producción</span>
            <h4 className="text-base font-bold text-stone-100 uppercase italic font-serif">Alineación de Lotes a la Venta</h4>
            <p className="text-stone-300 text-xs leading-relaxed">
              Actualmente Brixton produce de forma uniforme sin considerar los picos estacionales ni la dominancia cromática. El análisis de datos demuestra que el **78% de la decisión de compra** recae directamente sobre la combinación estricta de color y hormas. 
            </p>
            <div className="space-y-2 border-t border-stone-900 pt-3 text-[11px] text-stone-400">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-none bg-[#FF3B30] mt-1 shrink-0" />
                <span>**Futsal / Canchas (65% venta directa):** Dominio absoluto del Blanco/Negro y Rojo/Negro.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 mt-1 shrink-0" />
                <span>**Casual / Sneakers Urbanos (45%):** El color marrón chocolate y terracota irrumpe fuertemente en el 2026.</span>
              </div>
            </div>
            <div className="bg-[#1C1C24] p-3 border border-stone-800 text-[11px] text-stone-300">
              <span className="font-bold text-amber-500 uppercase font-mono text-[9px] block mb-1">Acción Táctica Directa:</span>
              Moderar lotes de colores de baja rotación (Celeste, Rosa, Beige liso) y redirigir 30% del volumen de insumos hacia Blanco y Negro con acabados en Rojo.
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE COLOR ANALYSIS */}
      <div id="brixton-sec-colores" className="bg-[#13131A] p-6 sm:p-8 border border-stone-850 scroll-mt-20 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-stone-900 pb-4 gap-4">
          <div>
            <span className="text-[#FF3B30] text-[10px] font-black uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><Palette size={14} /> Análisis Cromático</span>
            <h3 className="text-xl font-bold font-serif italic uppercase text-white leading-tight mt-1">Los Colorways que Mandan en el Mercado Peruano</h3>
          </div>

          {/* Dynamic tabs for inner color categorization */}
          <div className="flex flex-wrap gap-1 bg-[#0A0A0F] p-1 border border-stone-850">
            {['🥇 Top Colores Generales', '⚽ Futsal / Fútbol Sala', '🏙️ Plaza por Regiones', '🔥 Tendencias 2026'].map((title, idx) => (
              <button
                key={title}
                onClick={() => setColorTab(idx)}
                className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest cursor-pointer transition
                  ${colorTab === idx ? 'bg-[#FF3B30] text-white' : 'text-stone-450 hover:text-white'}`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 0 Content: General colors cards with details */}
        {colorTab === 0 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-stone-400 text-xs">
              Muestra desagregada del porcentaje de ventas directas de tiendas y comercio electrónico en Perú. Haz hover para ver las especificaciones de nicho:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {generalSwatches.map((swatch) => (
                <div key={swatch.name} className="bg-[#1A1A24] p-3 border border-stone-850 relative group cursor-default hover:border-[#FF3B30] transition duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-stone-400 font-mono font-bold uppercase">{swatch.pct}</span>
                    <span className="w-1 px-1 text-[8px] bg-[#FF3B30] text-white font-mono font-bold rounded-none uppercase leading-none tracking-widest">Rot.</span>
                  </div>
                  <div className="h-10 w-full mb-3 border border-stone-800" style={{ backgroundColor: swatch.color }} />
                  <h4 className="text-[11px] font-bold text-white uppercase truncate">{swatch.name}</h4>
                  <p className="text-[9px] text-stone-500 leading-relaxed font-sans mt-1 line-clamp-2 uppercase">
                    {swatch.desc}
                  </p>
                  
                  {/* Tooltip detail element */}
                  <div className="absolute inset-x-0 bottom-full mb-2 hidden group-hover:block bg-[#0A0A0F] text-stone-300 text-[9px] p-2 border border-stone-800 shadow-xl z-20 uppercase font-mono">
                    {swatch.desc}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-[#1C1C24] p-4 border border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-[#FF3B30] uppercase font-mono block">Estatus del Blanco</span>
                <p className="text-[11px] text-stone-400 leading-normal uppercase">El calzado blanco denote higiene y nivel socioeconómico firme en provincias. Brixton debe duplicar sus lotes en blanco puro con detalles negros.</p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-x border-stone-900 md:px-6">
                <span className="text-[9px] font-black text-amber-500 uppercase font-mono block">Seguridad del Negro</span>
                <p className="text-[11px] text-stone-400 leading-normal uppercase">El negro como "zapatilla de combate" para trabajo, pichangas e informalidad general es un clásico indiscutible.</p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 border-stone-900">
                <span className="text-[9px] font-black text-[#0A84FF] uppercase font-mono block">Fuerza del Rojo</span>
                <p className="text-[11px] text-stone-400 leading-normal uppercase">El rojo es pasión futbolera y representa el ADN Brixton. Activa la rotación visual en aparador un 30% más rápido.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1 Content: Futsal analysis */}
        {colorTab === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-[#21212B] p-5 border border-stone-850 space-y-4">
              <h4 className="text-base font-bold text-white font-serif italic uppercase">Porcentaje de Venta de Zapatos Cancha Futsal</h4>
              <p className="text-slate-400 text-xs">El fútbol sala peruano tiene códigos de vestimenta específicos que influyen drásticamente en el color del calzado:</p>
              
              <div className="space-y-3">
                {[
                  { combo: 'Blanco + Negro (Bicolor)', pct: 72, desc: 'Clásica elegancia deportiva, alta visibilidad.' },
                  { combo: 'Rojo + Negro (ADN Brixton)', pct: 65, desc: 'Poder, combatividad y patriotismo.' },
                  { combo: 'Azul + Blanco', pct: 58, desc: 'Asociado a históricos clubes peruanos.' },
                  { combo: 'Negro Sólido', pct: 50, desc: 'Lote rudo para canchas de asfalto erosionadas.' },
                  { combo: 'Verde Flúor + Negro', pct: 40, desc: 'Juvenil, estridencia amateur en redes.' }
                ].map((item) => (
                  <div key={item.combo} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-stone-300">{item.combo}</span>
                      <span className="font-mono text-emerald-400 font-bold">{item.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-900 rounded-none overflow-hidden">
                      <div className="h-full bg-[#FF3B30]" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-[8px] text-stone-500 block uppercase tracking-wider">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-[#1A1A24] p-5 border border-stone-850">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 font-mono block mb-1">CULTURA DE COPAS DE BARRIO</span>
                <span className="text-sm font-bold text-[#F3F4F6] block mb-2 uppercase">Identidad Cromática de Clubes Locales</span>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Los equipos amateurs en el Perú a menudo eligen su combinación de calzado deportivo según el color de sus uniformes representativos de Alianza Lima, Universitario, Cristal o el club de su localidad regional (Melgar en Arequipa, Cienciano en Cusco). Ofrecer paletas alineadas con estas identidades impulsa compras grupales de lotes enteros.
                </p>
              </div>

              <div className="bg-stone-900/60 p-4 border border-stone-850 flex items-center gap-3">
                <Info size={24} className="text-[#FF3B30] shrink-0" />
                <p className="text-[10px] text-stone-400 leading-normal uppercase">
                  **RECOMENDACIÓN PARA CÉSAR VILLEGAS:** Diseñar los lotes correspondientes a los modelos **KILLER y MESSI** priorizando Blanco/Rojo y Negro/Azul directo en la línea de montaje del Q3.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Regional colors map */}
        {colorTab === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {colorPlazasBreakdown.map((plaza) => (
              <div key={plaza.name} className="bg-[#1A1A24] p-4 border border-stone-850 hover:border-amber-500 transition duration-150 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-black text-white uppercase italic font-serif flex items-center gap-2">
                    <MapPin size={12} className="text-amber-500" />
                    {plaza.name}
                  </h4>
                  <p className="text-stone-400 text-[11px] leading-relaxed uppercase mt-2">
                    {plaza.details}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF3B30] font-mono block mb-2">Paleta Priorizada:</span>
                  <div className="flex gap-1.5">
                    {plaza.colors.map((c, i) => (
                      <div key={i} className="w-8 h-8 border border-stone-800" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3 Content: Future Trend Colors 2026 */}
        {colorTab === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-[#1C1C24] p-5 border border-stone-850 space-y-4">
              <span className="text-[#FF3B30] text-[9px] font-bold uppercase tracking-widest font-mono block">EVALUACIÓN DE REDES SOCIALES E INFLUENCERS</span>
              <h4 className="text-base font-bold text-stone-100 uppercase italic font-serif">Colores Emergentes para Sneakerheads en Lima</h4>
              <p className="text-stone-400 text-xs">
                TikTok e Instagram están acelerando el ciclo comercial en Lima Metropolitana. Estos son los colores con mayor velocidad de importación y búsqueda en los últimos 4 meses:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-stone-900 border border-stone-850">
                  <div className="w-8 h-8 rounded-none border border-amber-900" style={{ backgroundColor: '#5C4033' }} />
                  <div>
                    <h5 className="text-[11px] font-bold text-white uppercase leading-none">Marrón Moca / Chocolate</h5>
                    <span className="text-[9px] text-stone-500 font-mono">Crecimiento estimado: +45% en mercado casual urbano.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-stone-900 border border-stone-850">
                  <div className="w-8 h-8 rounded-none border border-stone-400" style={{ backgroundColor: '#C0C0C0' }} />
                  <div>
                    <h5 className="text-[11px] font-bold text-white uppercase leading-none">Detalles Metalizados / Plateado</h5>
                    <span className="text-[9px] text-stone-500 font-mono">Preferidos por el sector femenino moderno en distritos de Lima.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-stone-900 border border-stone-850">
                  <div className="w-8 h-8 rounded-none border border-purple-500" style={{ backgroundColor: '#BF5AF2' }} />
                  <div>
                    <h5 className="text-[11px] font-bold text-white uppercase leading-none">Morado Lavanda / Lila Pastel</h5>
                    <span className="text-[9px] text-stone-500 font-mono">Orientado al segmento juvenil femenino (15-24 años).</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A24] p-5 border border-stone-850 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-amber-500 text-[10px] uppercase font-bold tracking-widest block font-mono">PLAN DE CORTE Y SUELAS BRIXTON</span>
                <span className="text-sm font-bold text-white block uppercase">Sincronización Inteligente de Insumos</span>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Para no inflar costos fijos, no se recomienda abrir nuevas hormas. Se sugiere comprar suelas estándares en **marrón terroso** y blanco, lo cual permite crear combinaciones de alta rotación sin herramental especializado nuevo. 
                </p>
              </div>

              <div className="p-3 bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
                <span className="font-extrabold text-[#FF3B30] uppercase text-[9px] font-mono block">Plan de Acción:</span>
                Iniciar una colección cápsula para el modelo **NEW FLEX** en colorway chocolate para venta online exclusiva vía Instagram en Agosto de 2026.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE TERRITORIAL MAP SECTION */}
      <div id="brixton-sec-territorio" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-20">
        
        {/* Left column: Cities list selection */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <span className="text-amber-500 text-[10px] font-extrabold uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><MapPin size={12} /> Diagnóstico Territorial</span>
            <h3 className="text-2xl font-black italic tracking-tight uppercase font-serif text-white leading-tight mt-1">Ciudades Clave de Ventas</h3>
            <p className="text-stone-400 text-xs mt-1">
              Haz clic en cualquiera de las provincias peruanas para visualizar el Buyer Persona local, colores de alta demanda y la estrategia recomendada:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.keys(citiesData).map((cityName) => {
              const active = selectedCity === cityName;
              const data = citiesData[cityName];
              return (
                <button
                  key={cityName}
                  onClick={() => setSelectedCity(cityName)}
                  className={`p-3 text-left border flex flex-col justify-between transition cursor-pointer relative h-28
                    ${active 
                      ? 'bg-stone-900 border-[#FF3B30] shadow-none' 
                      : 'bg-[#13131A] border-stone-850 hover:bg-stone-900/60'}`}
                >
                  <div className="w-full flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white uppercase">{cityName}</span>
                      <span className="text-[7.5px] uppercase text-stone-500 font-mono block leading-none">{data.region}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-500 font-mono tracking-tight">{data.score} pts</span>
                  </div>

                  <div className="pt-2 text-[9px] text-stone-450 uppercase truncate w-full">
                    {data.bestModel}
                  </div>

                  {/* Indicator active point */}
                  {active && (
                    <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#FF3B30]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Interactive local city details panel */}
        <div className="lg:col-span-6">
          <div className="bg-[#13131A] p-6 border border-stone-850 h-full flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-900 pb-3">
                <div>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest font-mono">Ficha de Inteligencia de Plaza</span>
                  <h4 className="text-lg font-black text-white uppercase italic font-serif flex items-center gap-1.5">
                    <MapPin className="text-[#FF3B30]" size={15} />
                    {selectedCity}
                  </h4>
                </div>
                <span className="bg-stone-900 border border-stone-800 text-[10px] font-mono p-1 text-amber-400 font-bold uppercase tracking-wider">Score Priorización: {citiesData[selectedCity].score}/100</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1 bg-stone-900/50 p-2.5 border border-stone-850">
                  <span className="text-[9px] text-stone-500 font-bold uppercase block tracking-wider">Comprador Objetivo (Persona)</span>
                  <p className="text-stone-300 uppercase leading-normal">{citiesData[selectedCity].targetBuyer}</p>
                </div>
                <div className="space-y-1 bg-stone-900/50 p-2.5 border border-stone-850">
                  <span className="text-[9px] text-stone-500 font-bold uppercase block tracking-wider">Modelo más Vendido</span>
                  <p className="text-amber-400 font-bold uppercase">{citiesData[selectedCity].bestModel}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-stone-500 font-bold uppercase block tracking-wider">Cromías de Mayor Rotación en {selectedCity}</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {citiesData[selectedCity].colors.map((c) => (
                    <span key={c} className="bg-stone-900 text-stone-300 text-[10px] px-2.5 py-1 border border-stone-800 font-mono font-semibold uppercase">{c}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-stone-400 font-black uppercase font-mono block">Contexto Comercial de la Plaza:</span>
                <p className="text-stone-300 text-xs leading-relaxed uppercase">
                  {citiesData[selectedCity].details}
                </p>
              </div>
            </div>

            <div className="bg-[#1C1C24] p-3 border border-stone-800 text-xs mt-4">
              <span className="font-extrabold text-[#FF3B30] uppercase text-[9px] font-mono block mb-1">Estrategia Operativa Local Recomendada:</span>
              <p className="text-stone-200 uppercase text-[10.5px] leading-normal">{citiesData[selectedCity].strategy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED COMPETITIVE RIVALRY PANEL */}
      <div id="brixton-sec-competidores" className="bg-[#13131A] p-6 border border-stone-850 scroll-mt-20 space-y-6">
        <div>
          <span className="text-[#FF3B30] text-[10px] font-extrabold uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><Trophy size={14} /> Posicionamiento Competitivo</span>
          <h3 className="text-xl font-bold font-serif italic uppercase text-white leading-tight mt-1">Brixton frente al Ecosistema Nacional</h3>
          <p className="text-stone-400 text-xs mt-1">
            Análisis de precios promedio, fortalezas, colorways y nivel de amenaza directa para el posicionamiento de Brixton:
          </p>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse border-b border-stone-900 text-xs text-left">
            <thead>
              <tr className="border-b border-stone-850 text-[10px] text-stone-450 uppercase tracking-widest bg-stone-900/40">
                <th className="py-3 px-4 font-bold">Rango/Marca</th>
                <th className="py-3 px-4 font-bold">Origen</th>
                <th className="py-3 px-4 font-bold">Precio Perú</th>
                <th className="py-3 px-4 font-bold">Atractor / Fortaleza</th>
                <th className="py-3 px-4 font-bold">Colores Estrella</th>
                <th className="py-3 px-4 font-bold text-center">Nivel Amenaza</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '👟 Nike / Adidas', origin: 'USA / Asia', price: 'S/ 160 – 450', force: 'Máximo valor aspiracional y estatus masivo', colors: 'Blanco Puro, Negro, Azul', threat: 'ALTA (Moda)', threatColor: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20' },
                { name: '⚽ Joma (España)', origin: 'Importado', price: 'S/ 130 – 280', force: 'Marca técnica oficial de futsal, suela firme', colors: 'Blanco, Azul, Verde', threat: 'MUY CRÍTICA (Técnica)', threatColor: 'text-[#FF3B30] bg-[#FF3B30]/25 border-[#FF3B30]/30' },
                { name: '⭐ North Star (Bata)', origin: 'Nacional/Brasil', price: 'S/ 80 – 140', force: 'Presencia masiva en centros comerciales nacionales', colors: 'Blanco Escolar, Negro, Azul', threat: 'CRÍTICA (Precio)', threatColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                { name: '🇨🇳 Importadas Sin Marca', origin: 'China', price: 'S/ 40 – 90', force: 'Precio ridículamente barato, colores súper vivos', colors: 'Multi-combinado, Flúor', threat: 'MEDIA (Costo)', threatColor: 'text-amber-500 bg-amber-500/5 border-amber-500/10' },
                { name: '🦁 Brixton (César V.)', origin: 'Lima, Perú 🇵🇪', price: 'S/ 85 – 160', force: 'Suela resistente que dura el doble, Hecho en Perú', colors: 'Rojo Fuego, Blanco, Negro', threat: 'POSIBILIDAD ALTA', threatColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
              ].map((brand) => (
                <tr key={brand.name} className="border-b border-stone-900 hover:bg-stone-900/25 transition duration-150 font-sans">
                  <td className="py-3 px-4 font-bold text-white uppercase">{brand.name}</td>
                  <td className="py-3 px-4 text-stone-400 uppercase">{brand.origin}</td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-200">{brand.price}</td>
                  <td className="py-3 px-4 text-stone-400 uppercase leading-snug">{brand.force}</td>
                  <td className="py-3 px-4 text-stone-300 uppercase">{brand.colors}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider border ${brand.threatColor}`}>
                      {brand.threat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Opportunity Gap */}
        <div className="bg-[#1C1C24] p-5 border border-stone-800 space-y-3">
          <span className="text-amber-500 text-[10px] uppercase font-bold tracking-widest block font-mono">LA BRECHA DE VALOR BRIXTON:</span>
          <p className="text-stone-300 text-xs leading-relaxed uppercase">
            Nike y Joma dominan el mercado técnico/profesional arriba de S/160, mientras que el calzado Chino manda en volumen pero decepciona por durabilidad (se despega en 2 pichangas). Bata (North Star) es el único rival fuerte a S/110. **Brixton puede ganarle a Bata** comunicando una suela de goma vulcanizada superior diseñada para resistir el cemento pulido de las losas de barrio, decorada con colorways tácticos deportivos por el mismo precio accesible.
          </p>
        </div>
      </div>

      {/* STRATEGIES WITH DETAILED ACCORDIONS */}
      <div id="brixton-sec-estrategias" className="space-y-6 scroll-mt-20">
        <div>
          <span className="text-amber-500 text-[10px] font-extrabold uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><Megaphone size={12} /> Despliegue de Estrategias</span>
          <h3 className="text-3xl font-black italic tracking-tight uppercase font-serif text-white leading-tight mt-1">4 Planes de Marketing Ganadores</h3>
          <p className="text-stone-400 text-xs mt-1">
            Planes tácticos de bajo costo y alto impacto diseñados para implementarse inmediatamente en el taller de producción y canales comerciales de Brixton:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Plan 1 */}
          <div 
            onClick={() => setActivePlan('pichanga')}
            className={`p-6 border flex flex-col justify-between cursor-pointer transition h-64
              ${activePlan === 'pichanga' 
                ? 'bg-stone-900 border-[#FF3B30] shadow-xl' 
                : 'bg-[#13131A] border-stone-850 hover:bg-stone-900/60'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase italic font-serif flex items-center gap-2">
                  <span>⚽</span> Estrategias "Pichanga a Torneo"
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider uppercase">Rot. Alta</span>
              </div>
              
              <p className="text-stone-400 text-xs leading-normal">
                Patrocinar los 50 campeonatos amateurs nocturnos más virales de Lima Metropolitana. Activar el programa **"Capitán Brixton"** (par gratis al capitán a cambio de recomendación y descuento masivo de lotes al equipo).
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5 border-t border-stone-900 pt-3 text-[9px] text-stone-500 font-bold uppercase tracking-widest">
              <span className="bg-[#FF3B30]/10 text-[#FF3B30] px-2 py-0.5 border border-[#FF3B30]/25">+25% Ventas Canal Directo</span>
              <span className="bg-stone-900 px-2 py-0.5">Bajo Presupuesto</span>
            </div>
          </div>

          {/* Plan 2 */}
          <div 
            onClick={() => setActivePlan('tiktok')}
            className={`p-6 border flex flex-col justify-between cursor-pointer transition h-64
              ${activePlan === 'tiktok' 
                ? 'bg-stone-900 border-[#FF3B30] shadow-xl' 
                : 'bg-[#13131A] border-stone-850 hover:bg-stone-900/60'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase italic font-serif flex items-center gap-2">
                  <span>📱</span> Estrategia "TikTok First"
                </h4>
                <span className="text-[10px] text-[#0A84FF] font-mono font-bold tracking-wider uppercase">Viral</span>
              </div>
              
              <p className="text-stone-400 text-xs leading-normal">
                Generar 3 contenidos semanales enfocados en el "proceso de fabricación real en Lima". Destacar la durabilidad de la zapatilla contra la debilidad de la importada china barata. Alianza con 10 micro-influencers amantes del futsal.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5 border-t border-stone-900 pt-3 text-[9px] text-stone-500 font-bold uppercase tracking-widest">
              <span className="bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 border border-[#0A84FF]/25">+60% Tráfico Digital</span>
              <span className="bg-stone-900 px-2 py-0.5">ROI 5X</span>
            </div>
          </div>

          {/* Plan 3 */}
          <div 
            onClick={() => setActivePlan('lima')}
            className={`p-6 border flex flex-col justify-between cursor-pointer transition h-64
              ${activePlan === 'lima' 
                ? 'bg-stone-900 border-[#FF3B30] shadow-xl' 
                : 'bg-[#13131A] border-stone-850 hover:bg-stone-900/60'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase italic font-serif flex items-center gap-2">
                  <span>🏭</span> Orgullo "Hecho en Lima"
                </h4>
                <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider uppercase">Emocional</span>
              </div>
              
              <p className="text-stone-400 text-xs leading-normal">
                Explotar la carga identitaria de la fabricación nacional. Agregar la bandera peruana 🇵🇪 tejida en un lateral de la zapatilla y lanzar ediciones limitadas con nombres emblemáticos locales como "Selección", "Plaza Norte" y "Sujeto de barrio".
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5 border-t border-stone-900 pt-3 text-[9px] text-stone-500 font-bold uppercase tracking-widest">
              <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 border border-amber-500/25">+20% Precio Aceptado</span>
              <span className="bg-stone-900 px-2 py-0.5">Lealtad Local</span>
            </div>
          </div>

          {/* Plan 4 */}
          <div 
            onClick={() => setActivePlan('colors')}
            className={`p-6 border flex flex-col justify-between cursor-pointer transition h-64
              ${activePlan === 'colors' 
                ? 'bg-stone-900 border-[#FF3B30] shadow-xl' 
                : 'bg-[#13131A] border-stone-850 hover:bg-stone-900/60'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase italic font-serif flex items-center gap-2">
                  <span>🚀</span> Inteligencia Cromática
                </h4>
                <span className="text-[10px] text-purple-400 font-mono font-bold tracking-wider uppercase">Precisión</span>
              </div>
              
              <p className="text-stone-400 text-xs leading-normal">
                Sincronizar el plan de corte del taller de César Villegas con estadísticas semanales automáticas de pedidos. Descartar colores muertos de forma proactiva cada 4 semanas para que los talleres se concentren solo en colores de alta tracción.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5 border-t border-stone-900 pt-3 text-[9px] text-stone-500 font-bold uppercase tracking-widest">
              <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 border border-purple-500/25">-30% Stock Muerto</span>
              <span className="bg-stone-900 px-2 py-0.5">Cero Ineficiencias</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROADMAP & INTERACTIVE SIMULATION CHART */}
      <div id="brixton-sec-roadmap" className="bg-[#13131A] p-6 sm:p-8 border border-stone-850 scroll-mt-20 space-y-8">
        
        {/* Dynamic header and explanation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-stone-900 pb-4 gap-4">
          <div>
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><TrendingUp size={14} /> SIMULADOR INTERACTIVO 2X</span>
            <h3 className="text-2xl font-black italic tracking-tight uppercase font-serif text-white mt-1 leading-none">Hoja de Ruta de Trabajo</h3>
            <p className="text-stone-400 text-xs mt-2">
              Utiliza el control deslizante para simular qué tan estricta es la aplicación de la campaña de marketing y visualiza cómo impacta en las proyecciones de ventas del próximo año:
            </p>
          </div>

          {/* Interactive control slider */}
          <div className="bg-[#0A0A0F] border border-stone-850 p-4 shrink-0 flex items-center gap-4 w-96 max-w-full">
            <Sliders className="text-[#FF3B30] shrink-0" size={18} />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-stone-300">
                <span>EJECUCIÓN DEL PLAN:</span>
                <span className="text-[#FF3B30] font-mono">{implementationLevel}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={implementationLevel}
                onChange={(e) => setImplementationLevel(Number(e.target.value))}
                className="w-full h-1 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-[#FF3B30]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic customized timeline representation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Projection graph SVG responsive details */}
          <div className="lg:col-span-6 bg-[#0A0A0E] p-4 border border-stone-850 space-y-4">
            <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-b border-stone-900 pb-2">
              <span>PROYECCIÓN DE CRECIMIENTO TRILINEAL (AÑO 1)</span>
              <span className="text-emerald-400">PICO SIMULADO: +{graphData.simulated[4]}%</span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="h-48 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                {/* Horizontal guide lines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="#1A1A24" strokeWidth="0.2" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#1A1A24" strokeWidth="0.2" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#1A1A24" strokeWidth="0.2" />

                {/* Simulated line (Marketing effect) */}
                <path 
                  d={`M 0 ${35 - (graphData.simulated[0] * 0.25)} L 25 ${35 - (graphData.simulated[1] * 0.25)} L 50 ${35 - (graphData.simulated[2] * 0.25)} L 75 ${35 - (graphData.simulated[3] * 0.25)} L 100 ${35 - (graphData.simulated[4] * 0.25)}`}
                  fill="none"
                  stroke="#FF3B30"
                  strokeWidth="0.8"
                  className="transition-all duration-500 ease-out"
                />

                {/* Base Growth Line (Without marketing) */}
                <path 
                  d={`M 0 ${35 - (graphData.base[0] * 0.25)} L 25 ${35 - (graphData.base[1] * 0.25)} L 50 ${35 - (graphData.base[2] * 0.25)} L 75 ${35 - (graphData.base[3] * 0.25)} L 100 ${35 - (graphData.base[4] * 0.25)}`}
                  fill="none"
                  stroke="#555"
                  strokeWidth="0.4"
                  strokeDasharray="1,1"
                />
              </svg>
              
              {/* Overlay graph legends */}
              <div className="absolute inset-0 flex justify-between items-end p-2 text-[9px] text-stone-500 font-mono translate-y-4">
                <span>HOY</span>
                <span>Q3 2026</span>
                <span>Q4 2026</span>
                <span>Q1 2027</span>
                <span>Q2 2027</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-t border-stone-900 pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#FF3B30] inline-block" />
                <span>Simulado: +{graphData.simulated[4]}% (César V. Proyección)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-stone-500 stroke-dasharray-[1,1] inline-block" />
                <span>Base (Estático): +8%</span>
              </div>
            </div>
          </div>

          {/* Interactive timeline cards details */}
          <div className="lg:col-span-6 space-y-3">
            {[
              { q: 'Q3 2026 (Meses 1-3)', title: 'DATOS Y CRÍTICA CROMÁTICA', detail: 'Ajustar la paleta de producción en cannderas para descartar colores sin rotación y centrar esfuerzos en Blanco/Rojo. Lanzamiento de campañas de TikTok.', levelReq: 25 },
              { q: 'Q4 2026 (Meses 4-6)', title: 'SOCIOS COMERCIALES Y CAMPEONATOS', detail: 'Patrocinios del programa "Capitán Brixton" en torneos relámpagos. Alianzas con los 5 distribuidores estrella de Trujillo y Arequipa.', levelReq: 50 },
              { q: 'Q1 2027 (Meses 7-9)', title: 'CONQUISTA ESCOLAR Y TALLERES', detail: 'Stock masivo de zapatillas blancas reforzadas para la temporada de regreso a clases. Campañas geolocalizadas regionales.', levelReq: 75 },
              { q: 'Q2 2027 (Meses 10-12)', title: 'MARCA 2X CONSOLIDACIÓN', detail: 'Lanzamiento de línea deportiva juvenil femenina con colorways pastel. Auditoría de volumen de suelas y duplicación neta del taller comercial.', levelReq: 95 }
            ].map((step, i) => {
              const active = implementationLevel >= step.levelReq;
              return (
                <div 
                  key={i} 
                  className={`p-3.5 border transition cursor-default
                    ${active 
                      ? 'bg-stone-900 border-[#FF3B30]/50 text-white' 
                      : 'bg-[#13131A] border-stone-850 text-stone-500'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-[#FF3B30]">{step.q}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-stone-800 border border-stone-8 * border-stone-750">
                      {active ? '▲ IMPLEMENTADO' : '▼ BLOQUEADO'}
                    </span>
                  </div>
                  <h5 className="text-[11.5px] font-black uppercase mt-1 tracking-tight">{step.title}</h5>
                  <p className="text-[10.5px] text-stone-400 uppercase leading-snug mt-1">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FULLY INTEGRATED CHAT-BOT "CONSEJERO IA DE MERCADO BRIXTON" */}
      <div id="brixton-sec-consejero" className="bg-[#13131A] p-6 sm:p-8 border border-stone-850 scroll-mt-20 space-y-6">
        <div>
          <span className="text-amber-500 text-[10px] font-extrabold uppercase tracking-[0.2em] font-mono flex items-center gap-1.5"><Sparkles size={12} className="text-[#FF3B30]" /> Agente Inteligente de Soporte</span>
          <h3 className="text-2xl font-black italic tracking-tight uppercase font-serif text-white mt-1 leading-none">Consejero IA de Mercado</h3>
          <p className="text-stone-400 text-xs mt-2">
            Pregunta directamente sobre preferencias de color por ciudad, tácticas de distribución para la línea de producción o cómo ganarle mercado a North Star/Joma. La IA está sintonizada con el ADN de Brixton:
          </p>
        </div>

        {/* Quick Question Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '🎨 Colores KILLER Lima Norte', query: '¿Qué colores de zapatillas deportivas debería priorizar para vender el modelo KILLER en Lima Norte?' },
            { label: '📦 Entrar a Trujillo', query: '¿Cómo ingresar al mercado de Trujillo rápido y con bajo presupuesto?' },
            { label: '📱 Redes Sociales Futsal', query: '¿Qué estrategia de redes sociales y TikTok funciona mejor para calzado de futsal?' },
            { label: '⚪ Por qué el blanco domina', query: '¿Por qué el blanco es el color más vendido en Perú y cómo puede Brixton aprovecharlo?' },
            { label: '🎒 Temporada Escolar', query: '¿Qué colorways específicos debo lanzar para la temporada escolar de enero 2027?' }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => sendQuickQuestion(item.query)}
              className="px-2.5 py-1.5 bg-stone-900 border border-stone-850 text-stone-300 text-[9.5px] font-bold uppercase hover:border-[#FF3B30] hover:text-[#FF3B30] transition duration-150 rounded-none cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chat box container */}
        <div className="bg-[#0A0A0F] border border-stone-850 shadow-2xl rounded-none flex flex-col h-96">
          
          {/* Header */}
          <div className="p-3 bg-[#1A1A24] border-b border-stone-850 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Brixton Market Intelligence Agent v2.5</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end animate-slide-in' : 'mr-auto items-start animate-fade-in'}`}
              >
                <div 
                  className={`p-3.5 leading-relaxed uppercase tracking-normal relative
                    ${msg.role === 'user' 
                      ? 'bg-[#FF3B30] text-white border border-[#FF3B30]' 
                      : 'bg-[#13131A] text-stone-200 border border-stone-850'}`}
                >
                  {msg.content.split('\n').map((para, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{para}</p>
                  ))}
                </div>
                <span className="text-[8px] text-stone-500 font-mono mt-1 uppercase tracking-widest">{msg.time}</span>
              </div>
            ))}
            
            {/* Animated Typing Indicator */}
            {isTyping && (
              <div className="mr-auto items-start max-w-[85%] flex flex-col">
                <div className="p-3.5 bg-[#13131A] text-stone-400 border border-stone-850">
                  <div className="flex gap-1 items-center justify-center h-4">
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <span className="text-[8px] text-stone-500 mt-1 uppercase tracking-widest">Consultando base de datos Brixton...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input text controls */}
          <div className="p-3 bg-[#13131A] border-t border-stone-850 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Haz tu consulta táctica de mercado para Brixton (ej. lanzar la línea escolar)..."
              className="flex-1 bg-stone-900 border border-stone-800 text-[#F3F4F6] px-3 py-2 text-xs uppercase focus:outline-none focus:border-[#FF3B30]"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={isTyping}
              className="bg-[#FF3B30] hover:bg-[#ff554c] text-white font-extrabold px-4 text-xs tracking-widest uppercase transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 h-full"
            >
              <Send size={12} />
              Enviar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
