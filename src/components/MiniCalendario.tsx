import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Plus } from 'lucide-react';
import { Pedido } from '../types';

interface MiniCalendarioProps {
  pedidos: Pedido[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  onNewOrderForDate?: (dateStr: string) => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_HEADERS = ['Sem', 'L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Helper to calculate standard, faithful ISO week number of a date
const getWeekNumber = (y: number, m: number, d: number): number => {
  const date = new Date(Date.UTC(y, m, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

// Helper to determine the total number of weeks in a year (either 52 or 53)
const getTotalWeeksInYear = (y: number): number => {
  // December 28th is always in the last week of the ISO year
  return getWeekNumber(y, 11, 28);
};

export const MiniCalendario: React.FC<MiniCalendarioProps> = ({
  pedidos,
  selectedDate,
  onSelectDate,
  onNewOrderForDate
}) => {
  // Initialize view to the month of the selected filtered date, 
  // or the month of the most recent order, or the current system month (June 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June is index 5 status

  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]!, 10);
        const m = parseInt(parts[1]!, 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    } else if (pedidos.length > 0) {
      // Find latest order date to make it friendly
      const dates = pedidos
        .map(p => p.fecha)
        .filter(Boolean)
        .sort();
      if (dates.length > 0) {
        const latest = dates[dates.length - 1]!;
        const parts = latest.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0]!, 10);
          const m = parseInt(parts[1]!, 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            setCurrentYear(y);
            setCurrentMonth(m);
          }
        }
      }
    } else {
      // Fallback to local time metadata: June 2026
      setCurrentYear(2026);
      setCurrentMonth(5);
    }
  }, [selectedDate, pedidos.length]);

  // Navigate months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Days in month calculation
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Day of week index of first day (0 = Sunday, 1 = Monday ...)
  // Shift so 0 = Monday, 6 = Sunday
  const getFirstDayIndex = (year: number, month: number): number => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  // Group orders by exact date
  const pedidosCountByDate = pedidos.reduce((acc: Record<string, number>, curr) => {
    if (curr.fecha) {
      acc[curr.fecha] = (acc[curr.fecha] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Generate blank grids before the 1st
  const blanks = Array(firstDayIndex).fill(null);
  
  // Generate days array
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridCells = [...blanks, ...dayNumbers];

  // Chunk gridCells into weeks (rows of 7 days)
  const rows: (number | null)[][] = [];
  for (let i = 0; i < gridCells.length; i += 7) {
    rows.push(gridCells.slice(i, i + 7));
  }

  // Get week number for a specific row
  const getRowWeekNumber = (row: (number | null)[]): number => {
    const firstNonNullDay = row.find(d => d !== null);
    if (firstNonNullDay !== undefined) {
      return getWeekNumber(currentYear, currentMonth, firstNonNullDay);
    }
    return 1;
  };

  const handleDayClick = (day: number) => {
    const paddedMonth = String(currentMonth + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${paddedMonth}-${paddedDay}`;
    
    // Toggle date filter if clicked again
    if (selectedDate === dateStr) {
      onSelectDate(null);
    } else {
      onSelectDate(dateStr);
    }
  };

  const clearFilter = () => {
    onSelectDate(null);
  };

  // Convert current real date (2026-06-13 from local time metadata) to match style
  const isToday = (day: number): boolean => {
    return currentYear === 2026 && currentMonth === 5 && day === 13;
  };

  const formatHeaderDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parts[0];
    const m = parseInt(parts[1]!, 10) - 1;
    const d = parts[2];
    return `${d} de ${MESES[m]} de ${y}`;
  };

  const totalWeeksThisYear = getTotalWeeksInYear(currentYear);

  return (
    <div className="bg-white border border-stone-200 p-4 font-sans space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1A1A1A] flex items-center gap-1.5">
          <CalendarIcon size={12} className="text-stone-400" />
          Calendario
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-stone-100 border border-stone-200 rounded-none transition text-stone-600 font-bold"
            title="Mes Anterior"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-stone-100 border border-stone-200 rounded-none transition text-stone-600 font-bold"
            title="Mes Siguiente"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Month & Year Label with total weeks info in subtitle */}
      <div className="text-center space-y-1">
        <div className="font-bold text-xs uppercase tracking-widest text-stone-900 font-mono">
          {MESES[currentMonth]} {currentYear}
        </div>
        <div className="text-[8px] text-stone-400 font-black tracking-widest uppercase font-mono">
          Este año ({currentYear}) tiene {totalWeeksThisYear} semanas
        </div>
      </div>

      {/* Grid of days with 8 columns: Sem plus 7 working week days */}
      <div className="grid grid-cols-8 gap-1 text-center items-center">
        {/* Days of week labels */}
        {DIAS_SEMANA_HEADERS.map((dayLabel, idx) => {
          const isSem = idx === 0;
          return (
            <span 
              key={`${dayLabel}-${idx}`} 
              className={`text-[9px] font-bold font-mono uppercase tracking-widest py-1
                ${isSem ? 'text-indigo-600 bg-indigo-50/50 border-r border-stone-200/40 font-black' : 'text-stone-400'}
              `}
            >
              {dayLabel}
            </span>
          );
        })}

        {/* Rows with week number first, then week days */}
        {rows.map((row, rowIndex) => {
          const weekNum = getRowWeekNumber(row);
          return (
            <React.Fragment key={`week-row-${rowIndex}`}>
              {/* Week Number column */}
              <div 
                className="text-[9px] font-mono font-black text-indigo-700 bg-indigo-50/40 border border-indigo-200/50 flex items-center justify-center select-none rounded-none h-8 w-full uppercase tracking-tight"
                title={`Semana ${weekNum} del año`}
              >
                S.{weekNum}
              </div>

              {/* 7 calendar days of this week row */}
              {row.map((cell, cellIndex) => {
                if (cell === null) {
                  return <div key={`empty-${rowIndex}-${cellIndex}`} className="py-1.5 h-8 w-full" />;
                }

                const dayNum = cell;
                const paddedMonth = String(currentMonth + 1).padStart(2, '0');
                const paddedDay = String(dayNum).padStart(2, '0');
                const dateStr = `${currentYear}-${paddedMonth}-${paddedDay}`;
                const orderCount = pedidosCountByDate[dateStr] || 0;
                const isSelected = selectedDate === dateStr;
                const today = isToday(dayNum);

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`relative py-1.5 text-xs font-mono font-bold select-none transition border cursor-pointer flex flex-col items-center justify-center rounded-none h-8 w-full
                      ${isSelected 
                        ? 'bg-[#1A1A1A] text-white border-black shadow-md' 
                        : today 
                          ? 'border-indigo-500 bg-indigo-50/20 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800' 
                          : 'border-transparent hover:bg-stone-100 text-stone-850 hover:text-black'
                      }
                    `}
                    title={`Semana ${weekNum} · ${orderCount > 0 ? `${orderCount} pedido(s)` : 'Sin pedidos'} en fecha ${dateStr}`}
                  >
                    <span>{dayNum}</span>
                    {/* Little Dot or badge indicating order count */}
                    {orderCount > 0 && (
                      <span 
                        className={`w-1 h-1 rounded-none absolute bottom-1 transition-colors
                          ${isSelected ? 'bg-white' : 'bg-indigo-600'}
                        `} 
                      />
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Date Filter details */}
      {selectedDate && (
        <div className="bg-stone-50 border border-stone-200 p-2.5 space-y-2 mt-2">
          <div className="flex items-start justify-between gap-1">
            <div className="space-y-0.5">
              <span className="block text-[8px] uppercase tracking-widest font-bold text-stone-400">Filtrando por fecha:</span>
              <span className="text-[10px] font-bold text-stone-800 tracking-tight font-mono">
                {formatHeaderDate(selectedDate)}
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="text-stone-400 hover:text-stone-800 border border-stone-200 hover:bg-stone-100 p-0.5 rounded-none"
              title="Quitar filtro de fecha"
            >
              <X size={12} />
            </button>
          </div>

          {/* Quick link action to create an order pre-filled with this date */}
          {onNewOrderForDate && (
            <button
              type="button"
              onClick={() => onNewOrderForDate(selectedDate)}
              className="w-full bg-[#1A1A1A] hover:bg-stone-800 text-white font-bold tracking-widest text-[9px] uppercase py-1.5 rounded-none border border-black shadow-none transition inline-flex items-center justify-center gap-1 cursor-pointer leading-none"
            >
              <Plus size={11} />
              Añadir para este día
            </button>
          )}
        </div>
      )}

      {/* Default instructions when no filter is active */}
      {!selectedDate && (
        <div className="text-[10px] text-stone-400 text-justify leading-relaxed font-semibold uppercase tracking-tight bg-stone-50/50 p-2 border border-dashed border-stone-200">
          * Haga clic en un día con indicador en el calendario para aislar y ver los pedidos específicos de esa fecha, o seleccione cualquier día para agendar un nuevo pedido cronológicamente.
        </div>
      )}
    </div>
  );
};
