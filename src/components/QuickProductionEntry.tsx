import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, AlertCircle, Calendar, Keyboard, Layers, ArrowUpRight, Zap } from 'lucide-react';
import { Pedido, PedidoVariante, EstadoPedido } from '../types';
import { CATALOGO_REAL, getClassification } from './CatalogoModelos';

interface QuickProductionEntryProps {
  proximoCodigo: string;
  onSaveQuickPedido: (pedido: Pedido) => void;
  semanaPreseleccionada?: string | number;
  sidebarMode?: boolean;
}

const BASE_MODELOS_CONOCIDOS = [
  'KILLER',
  'MESSI',
  'ZOOM VAPOR',
  'FORCE FAST',
  'BENOM',
  'NEW FLEX',
  'ABSOLUTE',
  'PANTHER',
  'PRECISION'
];

const getModelosConocidos = (): string[] => {
  const catalogKeys = Object.keys(CATALOGO_REAL);
  // Merge, uppercase and deduplicate
  const merged = [...BASE_MODELOS_CONOCIDOS, ...catalogKeys].map(v => v.toUpperCase().trim());
  return Array.from(new Set(merged)).sort();
};

const TALLAS_DISPONIBLES = ['29', '30', '32', '33', '34', '35', '36', '40', '41'];

const RANGOS_TALLAS: Record<string, string[]> = {
  '29/34': ['29', '30', '31', '32', '33', '34'],
  '35/38': ['35', '36', '37', '38'],
  '39/42': ['39', '40', '41', '42'],
  '37/40': ['37', '38', '39', '40']
};

export const QuickProductionEntry: React.FC<QuickProductionEntryProps> = ({
  proximoCodigo,
  onSaveQuickPedido,
  semanaPreseleccionada,
  sidebarMode = false
}) => {
  const MODELOS_CONOCIDOS = getModelosConocidos();

  const [activeTab, setActiveTab] = useState<'shorthand' | 'fields'>('fields');
  
  // Shorthand simple string input
  const [shorthandText, setShorthandText] = useState('');
  
  // Tabular Fields
  const [numPedido, setNumPedido] = useState<string>(() => {
    const cleanSerial = proximoCodigo.replace(/^[A-Z]{2}/, '');
    return `OP${cleanSerial}`;
  });
  const [semana, setSemana] = useState<string>(() => {
    if (semanaPreseleccionada && semanaPreseleccionada !== 'TODAS') {
      return String(semanaPreseleccionada);
    }
    return '19';
  });
  const [modelo, setModelo] = useState('KILLER');
  const [talla, setTalla] = useState('29/34');
  const [cantidad, setCantidad] = useState('12');
  const [color, setColor] = useState('NEGRO');
  const [vendedor, setVendedor] = useState('—');

  // Success / Error messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const shorthandInputRef = useRef<HTMLInputElement>(null);

  // Sync semana when semanaPreseleccionada changes
  useEffect(() => {
    if (semanaPreseleccionada && semanaPreseleccionada !== 'TODAS') {
      setSemana(String(semanaPreseleccionada));
    }
  }, [semanaPreseleccionada]);

  useEffect(() => {
    const cleanSerial = proximoCodigo.replace(/^[A-Z]{2}/, '');
    setNumPedido(`OP${cleanSerial}`);
  }, [proximoCodigo]);

  // Robust live parser for single-line typewriter shorthand
  const parseShorthand = (raw: string) => {
    const text = raw.trim();
    if (!text) return null;

    // Clean spacers
    const parts = text.split(/[\s,;:\-\/]+/);

    // Baseline defaults
    let parsedSemana = semanaPreseleccionada && semanaPreseleccionada !== 'TODAS' ? Number(semanaPreseleccionada) : 19;
    let parsedModelo = '';
    let parsedTalla = '';
    let parsedCantidad = 0;
    let parsedColor = 'NEGRO';

    // Model name extraction
    const textUpper = text.toUpperCase();
    for (const m of MODELOS_CONOCIDOS) {
      if (textUpper.includes(m)) {
        parsedModelo = m;
        break;
      }
    }

    // Weak partial match if precise match is not found
    if (!parsedModelo) {
      for (const m of MODELOS_CONOCIDOS) {
        // e.g. "kil" matches "KILLER"
        const words = m.split(' ');
        const firstWord = words[0];
        if (firstWord && firstWord.length >= 3 && textUpper.includes(firstWord.substring(0, 3))) {
          parsedModelo = m;
          break;
        }
      }
    }

    // Numeric extractions
    const numbers = parts.map(p => {
      const cleanNum = p.replace(/\D/g, '');
      return cleanNum ? parseInt(cleanNum, 10) : null;
    }).filter((n): n is number => n !== null);

    // Let's analyze matched parts or positioning
    // Pattern heuristic 1: "19 KILLER 38 24"
    if (parts.length >= 4 && !isNaN(parseInt(parts[0], 10)) && isNaN(Number(parts[1]))) {
      const pSem = parseInt(parts[0], 10);
      const pTalla = parseInt(parts[2].replace(/\D/g, ''), 10);
      const pCant = parseInt(parts[3].replace(/\D/g, ''), 10);
      
      if (pSem >= 1 && pSem <= 53) parsedSemana = pSem;
      if (pTalla >= 29 && pTalla <= 42) parsedTalla = String(pTalla);
      if (pCant > 0) parsedCantidad = pCant;
    } else {
      // Pattern heuristic 2: Search for matches contextually
      // Size: look for anything 29-42
      const sizeFound = numbers.find(n => n >= 29 && n <= 42);
      if (sizeFound) {
        parsedTalla = String(sizeFound);
      }

      // Quantity: look for non-size, or a second number, or a number following 'cant', 'pares', etc.
      // Let's assume quantity is typically of scale or non-week
      // Or simply the last number in list
      if (numbers.length > 0) {
        // If we have size, remove it from list
        let filteredNumbers = [...numbers];
        const sizeIdx = filteredNumbers.indexOf(Number(parsedTalla));
        if (sizeIdx !== -1) {
          filteredNumbers.splice(sizeIdx, 1);
        }
        
        // Next check week (typically 1-53)
        const weekFound = filteredNumbers.find(n => n >= 1 && n <= 53);
        if (weekFound && !raw.toLowerCase().includes('cant')) {
          parsedSemana = weekFound;
          // remove week
          const wkIdx = filteredNumbers.indexOf(weekFound);
          if (wkIdx !== -1) filteredNumbers.splice(wkIdx, 1);
        }

        // Remaining must be quantity
        if (filteredNumbers.length > 0) {
          parsedCantidad = filteredNumbers[filteredNumbers.length - 1] || 12;
        }
      }
    }

    // Defaults in case something is empty
    return {
      semana: parsedSemana || 19,
      modelo: parsedModelo || 'KILLER',
      talla: parsedTalla || '38',
      cantidad: parsedCantidad || 12,
      color: parsedColor
    };
  };

  const parsedLive = parseShorthand(shorthandText);

  // Quick submit handler (supports shorthand line parse)
  const handleShorthandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsed = parseShorthand(shorthandText);
    if (!parsed) {
      setErrorMsg('Por favor escribe algo para procesar. Ejemplo: "19 KILLER 38 24"');
      return;
    }

    if (!parsed.modelo) {
      setErrorMsg('No se detectó un modelo de calzado válido. Intente escribir KILLER, MESSI, ZOOM VAPOR, etc.');
      return;
    }

    if (!parsed.talla || Number(parsed.talla) < 29 || Number(parsed.talla) > 42) {
      setErrorMsg('Por favor especifica una talla de calzado válida entre 29 y 42.');
      return;
    }

    if (parsed.cantidad <= 0) {
      setErrorMsg('Por favor escribe una cantidad de pares mayor que cero.');
      return;
    }

    // Proceed to register
    registerPedido(
      parsed.semana,
      parsed.modelo,
      parsed.talla,
      parsed.cantidad,
      parsed.color
    );

    // Clear and autofocus
    setShorthandText('');
    if (shorthandInputRef.current) {
      shorthandInputRef.current.focus();
    }
  };

  // Submit via specific row fields
  const handleFieldsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const codeToUse = numPedido.trim().toUpperCase();
    if (!codeToUse) {
      setErrorMsg('Por favor escribe el N° de Pedido (ej. OP000216).');
      return;
    }

    const semNum = parseInt(semana, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 53) {
      setErrorMsg('Semana debe ser del de 1 al 53.');
      return;
    }

    const isRange = talla.includes('/');
    if (!isRange) {
      const tNo = parseInt(talla, 10);
      if (isNaN(tNo) || tNo < 29 || tNo > 42) {
        setErrorMsg('Talla debe ser entre 29 y 42.');
        return;
      }
    }

    const qty = parseInt(cantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Cantidad de pares debe ser mayor a 0 (ej. 12 pares).');
      return;
    }

    registerPedido(semNum, modelo, talla, qty, color.toUpperCase().trim(), codeToUse);
  };

  // Common core registration handler
  const registerPedido = (
    targetSemana: number,
    targetModelo: string,
    targetTalla: string,
    targetCantidad: number,
    targetColor: string,
    targetCodigo?: string
  ) => {
    const isRange = targetTalla.includes('/');
    let targetTallasMap: Record<string, number> = {};
    let finalDocenasSum = 0;

    if (isRange) {
      const partsOfRange = RANGOS_TALLAS[targetTalla] || [targetTalla];
      partsOfRange.forEach(t => {
        targetTallasMap[t] = targetCantidad;
        finalDocenasSum += targetCantidad;
      });
    } else {
      targetTallasMap[targetTalla] = targetCantidad;
      finalDocenasSum = targetCantidad;
    }

    const totalDocenas = Math.round(finalDocenasSum * 100) / 100;
    const cleanSerial = proximoCodigo.replace(/^[A-Z]{2}/, '');
    const currentCode = targetCodigo?.trim().toUpperCase() || `OP${cleanSerial}`; // Use custom or Order Of Production Prefix

    const modelKey = targetModelo.trim().toUpperCase();
    const catalogEntries = CATALOGO_REAL[modelKey] || [];
    const matchedEntry = catalogEntries.find(
      entry => (entry.color || '').trim().toUpperCase() === targetColor.trim().toUpperCase()
    ) || catalogEntries[0];

    let autoSpec: any = {};
    if (matchedEntry) {
      const cls = getClassification(matchedEntry.codigo);
      autoSpec = {
        codigo: matchedEntry.codigo,
        linea: (matchedEntry as any).linea || 'Deportivas/Caucho',
        tipo: (matchedEntry as any).tipo || cls.label,
        serie: (matchedEntry as any).talla || cls.range,
        suela: (matchedEntry as any).suela || 'ESTÁNDAR'
      };
    }

    const items: PedidoVariante[] = [
      {
        id: 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        color: targetColor || (matchedEntry ? matchedEntry.color : 'ESTÁNDAR'),
        tallas: targetTallasMap,
        ...autoSpec
      }
    ];

    const currentYear = new Date().getFullYear();
    const mockDate = new Date().toISOString().split('T')[0]!;

    const payload: Pedido = {
      id: 'pd-quick-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      codigo: currentCode,
      fecha: mockDate,
      semana: targetSemana,
      vendedor: vendedor === '—' ? null : vendedor,
      producto: targetModelo,
      variantes: 1,
      docenas: totalDocenas,
      estado: 'PRODUCCION', // Must be workshop order of production
      items: items
    };

    onSaveQuickPedido(payload);
    
    // Display sweet success log
    setSuccessMsg(
      isRange 
        ? `¡Registrado con éxito! Lote ${currentCode} para Semana ${targetSemana} de ${targetModelo}. Se crearon ${targetCantidad} docenas para cada talla en el rango ${targetTalla} (total: ${finalDocenasSum} docenas).`
        : `¡Registrado con éxito! Lote ${currentCode} para Semana ${targetSemana} de ${targetModelo} (${targetCantidad} docenas, Talla ${targetTalla}).`
    );
    
    // Auto clear success msg after 10 seconds
    setTimeout(() => {
      setSuccessMsg(null);
    }, 10000);
  };

  return (
    <div className={sidebarMode ? "space-y-3 text-stone-200" : "bg-[#FAF9F6] border-2 border-stone-800 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"}>
      {/* Header */}
      {!sidebarMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-250 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 border border-black flex items-center justify-center text-[#1A1A1A]">
              <Keyboard size={15} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-stone-900 font-serif italic">
                ⚡ Registro de Producción Ultra Rápido
              </h4>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                Ingresa órdenes de taller al instante usando el teclado, sin formularios complejos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Notices */}
      {errorMsg && (
        <div className={`${sidebarMode ? "bg-red-950/80 border-red-800 text-red-200" : "bg-red-50 border-red-350 text-red-900"} border p-2.5 text-[10px] font-semibold flex items-center gap-2 rounded-none`}>
          <AlertCircle size={13} className="shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className={`${sidebarMode ? "bg-emerald-950/80 border-emerald-800 text-emerald-200" : "bg-emerald-50 border-emerald-300 text-emerald-950"} border p-2.5 text-[10px] font-semibold flex items-start gap-2 rounded-none animate-fade-in`}>
          <Check size={13} className="shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FIELDS FORM */}
      <form onSubmit={handleFieldsSubmit} className="space-y-3.5">
        <div className={sidebarMode ? "grid grid-cols-1 gap-2.5" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"}>
          {/* N° Pedido */}
          <div>
            <label className={`block text-[8.5px] font-bold uppercase tracking-wider mb-1 ${sidebarMode ? "text-stone-400" : "text-stone-550"}`}>
              N° Pedido
            </label>
            <input
              type="text"
              value={numPedido}
              onChange={(e) => setNumPedido(e.target.value.toUpperCase())}
              placeholder="Ej. OP000216"
              className={`w-full border px-2 py-1.5 text-xs font-mono font-bold rounded-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                sidebarMode 
                  ? "bg-[#2A2A2A] border-stone-700 text-stone-100 placeholder-stone-600" 
                  : "bg-white border-stone-300 text-stone-900 placeholder-stone-400"
              }`}
              required
            />
          </div>

          {/* Semana */}
          <div>
            <label className={`block text-[8.5px] font-bold uppercase tracking-wider mb-1 ${sidebarMode ? "text-stone-400" : "text-stone-550"}`}>
              Semana
            </label>
            <input
              type="number"
              min={1}
              max={53}
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className={`w-full border px-2 py-1.5 text-xs font-mono font-bold rounded-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                sidebarMode 
                  ? "bg-[#2A2A2A] border-stone-700 text-stone-100" 
                  : "bg-white border-stone-300 text-stone-900"
              }`}
              required
            />
          </div>

          {/* Modelo */}
          <div>
            <label className={`block text-[8.5px] font-bold uppercase tracking-wider mb-1 ${sidebarMode ? "text-stone-400" : "text-stone-550"}`}>
              Modelo calzado
            </label>
            <select
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className={`w-full border px-2 py-1.5 text-xs font-bold rounded-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                sidebarMode 
                  ? "bg-[#2A2A2A] border-stone-700 text-stone-100" 
                  : "bg-white border-stone-300 text-stone-900"
              }`}
            >
              {MODELOS_CONOCIDOS.map(m => (
                <option key={m} value={m} className={sidebarMode ? "bg-[#2A2A2A] text-white" : ""}>{m}</option>
              ))}
            </select>
          </div>

          {/* Talla */}
          <div>
            <label className={`block text-[8.5px] font-bold uppercase tracking-wider mb-1 ${sidebarMode ? "text-stone-400" : "text-stone-550"}`}>
              Talla Escogida
            </label>
            <select
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              className={`w-full border px-2 py-1.5 text-xs font-mono font-bold rounded-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                sidebarMode 
                  ? "bg-[#2A2A2A] border-stone-700 text-stone-100" 
                  : "bg-white border-stone-300 text-stone-900"
              }`}
            >
              <optgroup label="Rangos / Curva de Tallaje" className={sidebarMode ? "bg-[#2A2A2A] text-stone-300 font-bold" : ""}>
                {Object.keys(RANGOS_TALLAS).map(r => (
                  <option key={r} value={r} className={sidebarMode ? "bg-[#1A1A1A] text-white" : ""}>Curva {r} (Tallas {RANGOS_TALLAS[r]?.join(', ')})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className={`block text-[8.5px] font-bold uppercase tracking-wider mb-1 ${sidebarMode ? "text-stone-400" : "text-stone-550"}`}>
              DOCENAS
            </label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="docenas"
              className={`w-full border px-2 py-1.5 text-xs font-mono font-bold rounded-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                sidebarMode 
                  ? "bg-[#2A2A2A] border-stone-700 text-stone-100 placeholder-stone-550" 
                  : "bg-white border-stone-300 text-stone-900 placeholder-stone-400"
              }`}
              required
            />
          </div>

          {/* Vendedor / Cliente */}
          <div className={sidebarMode ? "flex flex-col" : "form-row"}>
            <label className={`block text-[8.5px] font-bold uppercase tracking-wider mb-1 ${sidebarMode ? "text-stone-400" : "text-stone-550 form-label"}`}>
              Vendedor / Cliente
            </label>
            <input
              type="text"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              placeholder="Ej. Valeria, Hilder"
              className={`w-full border px-2 py-1.5 text-xs font-bold rounded-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                sidebarMode 
                  ? "bg-[#2A2A2A] border-stone-700 text-stone-100 placeholder-stone-600" 
                  : "bg-white border-stone-300 text-stone-900"
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end w-full">
          <button
            type="submit"
            className={`font-black text-[9.5px] uppercase tracking-widest rounded-none border shadow-none transition flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarMode 
                ? 'w-full bg-amber-500 hover:bg-amber-400 border-amber-500 text-stone-950 px-4 py-2.5 font-sans' 
                : 'bg-[#1A1A1A] hover:bg-amber-500 hover:text-[#1A1A1A] text-white border-black px-5 py-2.5'
            }`}
          >
            <Zap size={11} />
            <span>AGREGAR PEDIDO</span>
          </button>
        </div>
      </form>
    </div>
  );
};
