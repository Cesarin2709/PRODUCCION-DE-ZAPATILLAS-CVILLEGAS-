import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  UserCheck, 
  Clock, 
  UserX, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Calendar,
  Users,
  ChevronDown,
  RefreshCw,
  FileText,
  Table,
  Eye,
  LayoutDashboard
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Define attendance types
export interface AsistenciaRecord {
  id: string;
  empleado: string;
  area: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  estado: 'A tiempo' | 'Tarde' | 'Falta' | 'Licencia';
  horasTrabajadas: number;
}

const TEMPLATE_WORKERS = [
  { empleado: 'Valeria', area: 'Ventas' },
  { empleado: 'Estefany', area: 'Oficina / Ventas' },
  { empleado: 'Anghy', area: 'Tienda' },
  { empleado: 'Cotcas', area: 'Cliente / Vendedor' },
  { empleado: 'Juan Valer', area: 'Vendedor Externo' },
  { empleado: 'Carlos Paredes', area: 'Taller Cortado' },
  { empleado: 'Luisa Fernandez', area: 'Taller Aparado' },
  { empleado: 'Jorge Perez', area: 'Taller Armado' },
  { empleado: 'Ana Gomez', area: 'Taller Acabado' },
  { empleado: 'César Villegas', area: 'Logística & Datos' }
];

// Generate standard mock records for the past week
const generateMockRecords = (): AsistenciaRecord[] => {
  const records: AsistenciaRecord[] = [];
  const dates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];
  
  dates.forEach((fecha, dIndex) => {
    TEMPLATE_WORKERS.forEach((w, wIndex) => {
      // Create some realistic variations (some delayed, one or two absent on some days)
      let estado: AsistenciaRecord['estado'] = 'A tiempo';
      let horaEntrada = '07:50';
      let horaSalida = '17:00';
      
      const seed = (dIndex * 3 + wIndex * 7) % 25;
      
      if (seed === 3) {
        estado = 'Falta';
        horaEntrada = '—';
        horaSalida = '—';
      } else if (seed === 7 || seed === 14) {
        estado = 'Tarde';
        horaEntrada = seed === 7 ? '08:15' : '08:08';
        horaSalida = '17:00';
      } else if (seed === 21) {
        estado = 'Licencia';
        horaEntrada = '—';
        horaSalida = '—';
      } else {
        // Normal early arrivals
        horaEntrada = `07:${45 + (seed % 14)}`;
        horaSalida = `17:${(seed % 30)}`;
      }

      // Calculate working hours
      let horasTrabajadas = 0;
      if (estado === 'A tiempo' || estado === 'Tarde') {
        const [hE, mE] = horaEntrada.split(':').map(Number);
        const [hS, mS] = horaSalida.split(':').map(Number);
        const totalMinutes = (hS * 60 + mS) - (hE * 60 + mE);
        horasTrabajadas = Math.round((totalMinutes / 60) * 10) / 10;
      }

      records.push({
        id: `ast-${fecha}-${w.empleado.toLowerCase().replace(/\s/g, '-')}`,
        empleado: w.empleado,
        area: w.area,
        fecha,
        horaEntrada,
        horaSalida,
        estado,
        horasTrabajadas
      });
    });
  });

  return records;
};

export const AsistenciaDashboard: React.FC = () => {
  const [records, setRecords] = useState<AsistenciaRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedEstado, setSelectedEstado] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState('Todas');
  
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Tab controller for general dashboard vs actual raw report previewer
  const [activeTab, setActiveTab] = useState<'dashboard' | 'preview'>('dashboard');
  const [uploadedFileName, setUploadedFileName] = useState<string>('plantilla_asistencia_calzado.xlsx');
  const [uploadedSheetName, setUploadedSheetName] = useState<string>('Plantilla Asistencia');
  const [rawExcelHeaders, setRawExcelHeaders] = useState<string[]>([
    'Empleado', 'Area_Taller', 'Fecha_YYYY_MM_DD', 'Hora_Entrada_HH_MM', 'Hora_Salida_HH_MM', 'Estado_ATiempo_Tarde_Falta_Licencia'
  ]);
  const [rawExcelRows, setRawExcelRows] = useState<any[][]>([
    ['Valeria', 'Ventas', '2026-06-15', '07:52', '17:05', 'A tiempo'],
    ['Estefany', 'Oficina / Ventas', '2026-06-15', '08:08', '17:00', 'Tarde'],
    ['Anghy', 'Tienda', '2026-06-15', '07:48', '17:15', 'A tiempo'],
    ['Carlos Paredes', 'Taller Cortado', '2026-06-15', '07:55', '17:00', 'A tiempo'],
    ['Luisa Fernandez', 'Taller Aparado', '2026-06-15', '08:12', '17:00', 'Tarde'],
    ['Jorge Perez', 'Taller Armado', '2026-06-15', '—', '—', 'Falta'],
    ['Ana Gomez', 'Taller Acabado', '2026-06-15', '07:50', '17:00', 'A tiempo'],
    ['César Villegas', 'Logística & Datos', '2026-06-15', '07:58', '17:35', 'A tiempo']
  ]);
  const [searchTermPreview, setSearchTermPreview] = useState<string>('');

  // AI report states
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoadingMessage, setAiLoadingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load demo records
  React.useEffect(() => {
    // Start with demo records as a friendly experience
    setRecords(generateMockRecords());
  }, []);

  // Download template Excel
  const handleDownloadTemplate = () => {
    try {
      const headers = [['Empleado', 'Area_Taller', 'Fecha_YYYY_MM_DD', 'Hora_Entrada_HH_MM', 'Hora_Salida_HH_MM', 'Estado_ATiempo_Tarde_Falta_Licencia']];
      const templateData = [
        ['Valeria', 'Ventas', '2026-06-15', '07:52', '17:05', 'A tiempo'],
        ['Estefany', 'Oficina / Ventas', '2026-06-15', '08:08', '17:00', 'Tarde'],
        ['Anghy', 'Tienda', '2026-06-15', '07:48', '17:15', 'A tiempo'],
        ['Carlos Paredes', 'Taller Cortado', '2026-06-15', '07:55', '17:00', 'A tiempo'],
        ['Luisa Fernandez', 'Taller Aparado', '2026-06-15', '08:12', '17:00', 'Tarde'],
        ['Jorge Perez', 'Taller Armado', '2026-06-15', '—', '—', 'Falta'],
        ['Ana Gomez', 'Taller Acabado', '2026-06-15', '07:50', '17:00', 'A tiempo'],
        ['César Villegas', 'Logística & Datos', '2026-06-15', '07:58', '17:35', 'A tiempo'],
      ];

      const ws = XLSX.utils.aoa_to_sheet([...headers, ...templateData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Asistencia');
      XLSX.writeFile(wb, 'plantilla_asistencia_calzado.xlsx');
      setSuccessMsg('Plantilla descargada correctamente. Rellénela con sus datos y súbala.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Error al descargar la plantilla de Excel.');
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Exact rows from spreadsheet row-by-row
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

        if (rawRows.length === 0) {
          setErrorMsg('El archivo Excel está vacío.');
          return;
        }

        // Headers are in Row 0
        const headers = rawRows[0].map((h: any) => String(h || "").trim());
        const dataRows = rawRows.slice(1);

        // Filter empty rows
        const cleanedDataRows = dataRows.filter(row => 
          row && row.some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== "")
        );

        // Parse and map the columns intelligently for the state-based metrics and AI report
        const parsedRecords: AsistenciaRecord[] = cleanedDataRows.map((rowArr, index) => {
          const getValByHeaderIdx = (possibleHeaders: string[], fallbackIdx: number) => {
            const idx = headers.findIndex(h => possibleHeaders.some(ph => h.toLowerCase().includes(ph)));
            const finalIdx = idx !== -1 ? idx : fallbackIdx;
            return rowArr[finalIdx] !== undefined ? String(rowArr[finalIdx]).trim() : '';
          };

          const empleado = getValByHeaderIdx(['emp', 'nom', 'traba', 'worker', 'name'], 0) || `Trabajador ${index + 1}`;
          const area = getValByHeaderIdx(['area', 'taller', 'dep', 'cargo', 'rol'], 1) || 'Producción';
          const fecha = getValByHeaderIdx(['fec', 'date', 'day', 'dia'], 2) || new Date().toISOString().split('T')[0];
          const horaEntrada = getValByHeaderIdx(['entr', 'ingr', 'checkin', 'in_work', 'hora_en', 'comienzo'], 3) || '—';
          const horaSalida = getValByHeaderIdx(['sal', 'checkout', 'out_work', 'hora_sa', 'termino'], 4) || '—';
          
          let estadoRaw = getValByHeaderIdx(['est', 'status', 'asis', 'con', 'condicion'], 5) || '';
          let estado: AsistenciaRecord['estado'] = 'A tiempo';
          
          const eLower = estadoRaw.toLowerCase();
          if (eLower.includes('tarde') || eLower.includes('delay') || eLower.includes('demor') || eLower.includes('atras')) {
            estado = 'Tarde';
          } else if (eLower.includes('falt') || eLower.includes('ausen') || eLower.includes('absent') || eLower.includes('no vino')) {
            estado = 'Falta';
          } else if (eLower.includes('lic') || eLower.includes('perm') || eLower.includes('vacac')) {
            estado = 'Licencia';
          } else if (horaEntrada !== '—' && horaEntrada !== '') {
            try {
              const [h, m] = horaEntrada.split(':').map(Number);
              if (h > 8 || (h === 8 && m > 5)) {
                estado = 'Tarde';
              }
            } catch (pErr) {
              // ignore
            }
          }

          // Calculate working hours
          let horasTrabajadas = 0;
          if (estado === 'A tiempo' || estado === 'Tarde') {
            try {
              const [hE, mE] = horaEntrada.split(':').map(Number);
              const [hS, mS] = horaSalida.split(':').map(Number);
              if (!isNaN(hE) && !isNaN(hS)) {
                const totalMinutes = (hS * 60 + mS) - (hE * 60 + mE);
                horasTrabajadas = Math.round((totalMinutes / 60) * 10) / 10;
              }
            } catch (eH) {
              horasTrabajadas = 8.5; // fallback
            }
          }

          return {
            id: `excel-${index}-${Date.now()}`,
            empleado,
            area,
            fecha,
            horaEntrada: horaEntrada || '—',
            horaSalida: horaSalida || '—',
            estado,
            horasTrabajadas: horasTrabajadas > 0 ? horasTrabajadas : 0
          };
        });

        // Set state values
        setRecords(parsedRecords);
        setRawExcelRows(cleanedDataRows);
        setRawExcelHeaders(headers);
        setUploadedFileName(file.name);
        setUploadedSheetName(sheetName);
        
        // Auto pivot to the newly added "Preview" tab to delight the user instantly
        setActiveTab('preview');
        
        setSuccessMsg(`¡Se cargaron exitosamente ${parsedRecords.length} registros desde el Excel! Abriendo previsualizador del informe...`);
        setErrorMsg(null);
        setTimeout(() => setSuccessMsg(null), 5000);
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Error al analizar el contenido de Excel. Asegúrese de que tenga columnas válidas.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Clear or restore demo database
  const handleReloadDemo = () => {
    setRecords(generateMockRecords());
    setUploadedFileName('plantilla_asistencia_calzado.xlsx');
    setUploadedSheetName('Plantilla Asistencia');
    setRawExcelHeaders([
      'Empleado', 'Area_Taller', 'Fecha_YYYY_MM_DD', 'Hora_Entrada_HH_MM', 'Hora_Salida_HH_MM', 'Estado_ATiempo_Tarde_Falta_Licencia'
    ]);
    setRawExcelRows([
      ['Valeria', 'Ventas', '2026-06-15', '07:52', '17:05', 'A tiempo'],
      ['Estefany', 'Oficina / Ventas', '2026-06-15', '08:08', '17:00', 'Tarde'],
      ['Anghy', 'Tienda', '2026-06-15', '07:48', '17:15', 'A tiempo'],
      ['Carlos Paredes', 'Taller Cortado', '2026-06-15', '07:55', '17:00', 'A tiempo'],
      ['Luisa Fernandez', 'Taller Aparado', '2026-06-15', '08:12', '17:00', 'Tarde'],
      ['Jorge Perez', 'Taller Armado', '2026-06-15', '—', '—', 'Falta'],
      ['Ana Gomez', 'Taller Acabado', '2026-06-15', '07:50', '17:00', 'A tiempo'],
      ['César Villegas', 'Logística & Datos', '2026-06-15', '07:58', '17:35', 'A tiempo']
    ]);
    setActiveTab('dashboard');
    setSuccessMsg('Se restablecieron los datos de asistencia de demostración.');
    setTimeout(() => setSuccessMsg(null), 3000);
    setAiReport(null);
  };

  // KPIs Calculations
  const totalEmployees = Array.from(new Set(records.map(r => r.empleado))).length;
  const totalRecords = records.length;
  
  const totalInScope = records.filter(r => r.estado !== 'Licencia');
  const checkedIn = totalInScope.filter(r => r.estado === 'A tiempo' || r.estado === 'Tarde').length;
  const lateArrivals = totalInScope.filter(r => r.estado === 'Tarde').length;
  const absences = totalInScope.filter(r => r.estado === 'Falta').length;

  const attendanceRate = totalInScope.length > 0 
    ? Math.round((checkedIn / totalInScope.length) * 100) 
    : 0;

  const lateRate = checkedIn > 0 
    ? Math.round((lateArrivals / checkedIn) * 100) 
    : 0;

  const averageHours = checkedIn > 0 
    ? Math.round((records.reduce((acc, r) => acc + r.horasTrabajadas, 0) / checkedIn) * 10) / 10 
    : 0;

  // Unique lists for filtering
  const areasDisponibles = Array.from(new Set(records.map(r => r.area))).sort();
  const fechasDisponibles = Array.from(new Set(records.map(r => r.fecha))).sort();

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchSearch = r.empleado.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        r.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArea = selectedArea === 'Todas' || r.area === selectedArea;
    const matchEstado = selectedEstado === 'Todos' || r.estado === selectedEstado;
    const matchFecha = selectedDate === 'Todas' || r.fecha === selectedDate;
    
    return matchSearch && matchArea && matchEstado && matchFecha;
  });

  // Calculate area stats
  const areaStats = areasDisponibles.map(area => {
    const areaRecs = records.filter(r => r.area === area);
    const areaTotal = areaRecs.filter(r => r.estado !== 'Licencia').length;
    const areaPresent = areaRecs.filter(r => r.estado === 'A tiempo' || r.estado === 'Tarde').length;
    const areaLates = areaRecs.filter(r => r.estado === 'Tarde').length;
    const rate = areaTotal > 0 ? Math.round((areaPresent / areaTotal) * 100) : 100;
    
    return { area, rate, present: areaPresent, lates: areaLates, total: areaTotal };
  });

  // Generate AI Intelligence report calling proxy endpoint
  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    setAiReport(null);
    
    const messages = [
      "Extrayendo tendencias de puntualidad de los talleres...",
      "Comparando desempeño en acabados, cortado y ventas...",
      "Cruzando datos históricos del personal con metas de producción...",
      "Evaluando pérdidas estimadas de horas productivas...",
      "Estructurando recomendaciones directivas para César Villegas..."
    ];

    let msgIndex = 0;
    setAiLoadingMessage(messages[0]);
    const timer = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setAiLoadingMessage(messages[msgIndex]);
    }, 2500);

    try {
      // Structure statistical summary to send to Gemini
      const recordsSummarized = records.slice(0, 45).map(r => ({
        empleado: r.empleado,
        area: r.area,
        fecha: r.fecha,
        entrada: r.horaEntrada,
        salida: r.horaSalida,
        estado: r.estado,
        horas: r.horasTrabajadas
      }));

      const payloadMsg = `Hola, soy César Villegas de Calzados César (Sistemas de Calzado). Analiza el consolidado de asistencia semanal del taller de producción y oficina y crea un reporte directivo. 
      Aquí tienes un resumen de la semana actual del personal:
      - Total personal físico registrado: ${totalEmployees} empleados
      - Total records procesados en la semana: ${totalRecords} días hombre
      - Tasa global de Asistencia: ${attendanceRate}%
      - Tasa global de Tardanzas (sobre presentes): ${lateRate}%
      - Ausencias registradas: ${absences} faltas
      - Horas promedio trabajadas por día: ${averageHours} horas por sesión presente.

      Estadísticas por áreas evaluadas:
      ${JSON.stringify(areaStats, null, 2)}

      Muestra de registros críticos/tardanzas en la semana:
      ${JSON.stringify(recordsSummarized.filter(r => r.estado === 'Tarde' || r.estado === 'Falta').slice(0, 15), null, 2)}

      Escribe un reporte premium para calzado que contenga:
      1. **Diagnóstico General de la Semana**: Evaluación crítica de la disciplina de asistencia en los talleres.
      2. **Cuellos de Botella Técnicos**: Qué taller (Cortado, Aparado, Armado, Acabado o Ventas) tiene el índice más comprometido y cómo afecta esto al flujo lineal del calzado (capellada, costura, ensamble, suela vulcanizada).
      3. **Impacto en Entregas**: Cómo afecta esta tasa de asistencia al cumplimiento del plan de producción semanal en docenas.
      4. **Acciones Correctivas Directivas**: 3 medidas realistas de control de ingreso, flexibilidad de horarios o incentivos para obreros del sector calzado en Lima Perú.

      Usa un tono altamente estratégico, ejecutivo, directo y enfático. Mantén las secciones bien formateadas usando títulos con Markdown llamativos.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payloadMsg })
      });

      const data = await response.json();
      clearInterval(timer);
      
      if (data.response) {
        setAiReport(data.response);
      } else {
        setAiReport("### ⚠️ Error en Respuesta\nNo se pudo consolidar el reporte del consejero de IA de asistencia. Por favor, intente generar el análisis nuevamente.");
      }
    } catch (err: any) {
      console.error(err);
      clearInterval(timer);
      setAiReport("### ❌ Error de Conexión de IA\nOcurrió un error al contactar al servidor para el análisis inteligente de asistencia.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="asistencia-module">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-5xl sm:text-[64px] font-bold leading-none tracking-tighter uppercase italic font-serif text-[#1A1A1A]">
            Asistencia
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-stone-400 mt-2">
            Módulo Inteligente de Control de Personal, Fichajes y Productividad de Talleres
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleReloadDemo}
            className="text-[10px] bg-stone-100 hover:bg-stone-200 border border-stone-250 font-bold uppercase tracking-wider px-3 py-2 flex items-center gap-1.5 transition text-stone-800"
            title="Restablecer datos simulados"
          >
            <RefreshCw size={12} />
            Recargar Demo
          </button>
          
          <button
            onClick={handleDownloadTemplate}
            className="text-[10px] bg-[#1A1A1A] hover:bg-stone-900 text-white font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-1.5 transition"
            title="Descargar plantilla Excel para llenar asistencia de personal"
          >
            <Download size={12} />
            Descargar Plantilla Excel
          </button>
        </div>
      </div>

      {/* Tabs navigation selectors */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 font-extrabold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <LayoutDashboard size={13} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-stone-400'} />
          <span>Panel General & Diagnóstico IA</span>
          {activeTab === 'dashboard' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'preview'
              ? 'text-indigo-600 font-extrabold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Table size={13} className={activeTab === 'preview' ? 'text-indigo-600' : 'text-stone-400'} />
          <span>Previsualizador de Excel</span>
          {uploadedFileName && (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-none font-mono">
              {uploadedFileName}
            </span>
          )}
          {activeTab === 'preview' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>
      </div>

      {/* Conditional renderer */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {/* Upload area & explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Custom Drag & Drop Excel Uploader */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer group relative border-2 border-dashed rounded-none p-12 text-center transition flex flex-col items-center justify-center min-h-[220px] bg-stone-50/50 hover:bg-stone-50 border-stone-300 hover:border-black
              ${dragActive ? 'bg-indigo-50 border-indigo-500 scale-[1.01]' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
            />
            
            <div className="p-4 bg-white border border-stone-200 shadow-3xs mb-4 text-[#1A1A1A] group-hover:scale-110 transition duration-200">
              <Upload size={24} className="text-[#1A1A1A]" />
            </div>

            <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
              Sube la asistencia semanal de tu personal (Excel)
            </h3>
            
            <p className="text-stone-400 text-xs mt-2 max-w-md">
              Arrastra y suelta tu archivo Excel <span className="font-mono text-[10.5px]">.xlsx</span> aquí, o haz clic para explorar tus carpetas locales. El sistema detectará automáticamente los nombres, áreas e ingresos.
            </p>

            <span className="inline-block mt-4 text-[9.5px] uppercase tracking-widest font-black text-indigo-600 bg-indigo-50 px-2.5 py-1">
              Compatible con lector biométrico & plantillas manuales
            </span>
          </div>

          {errorMsg && (
            <div className="mt-4 p-4 border-l-2 border-red-500 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-4 border-l-2 border-emerald-500 bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Sidebar help guidelines */}
        <div className="bg-stone-900 text-stone-200 p-6 flex flex-col justify-between border border-stone-850 relative">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-amber-400" size={16} />
              <h4 className="font-sans font-bold text-[10px] uppercase tracking-[0.2em] text-stone-300">
                Guía de Formato Correcto
              </h4>
            </div>
            
            <h3 className="font-serif font-black text-white text-xl">
              Columnas Soportadas para Auto-Mapeo
            </h3>
            
            <p className="text-stone-400 text-[11px] leading-relaxed">
              El motor de importación lee el archivo Excel y correlaciona automágicamente campos equivalentes. Es ideal que contenga:
            </p>

            <ul className="space-y-2 mt-4 text-[10.5px] font-mono text-stone-300">
              <li className="flex justify-between border-b border-stone-800 pb-1">
                <span>👤 Empleado / Trabajador</span>
                <span className="text-stone-500">Nombre completo</span>
              </li>
              <li className="flex justify-between border-b border-stone-800 pb-1">
                <span>📍 Area / Taller / Rol</span>
                <span className="text-stone-500">Ubicación física</span>
              </li>
              <li className="flex justify-between border-b border-stone-800 pb-1">
                <span>📅 Fecha</span>
                <span className="text-stone-500 font-sans">YYYY-MM-DD</span>
              </li>
              <li className="flex justify-between border-b border-stone-800 pb-1">
                <span>⏱️ Hora Entrada / Salida</span>
                <span className="text-stone-500 font-sans">HH:MM</span>
              </li>
              <li className="flex justify-between border-b border-stone-800 pb-1">
                <span>📊 Estado</span>
                <span className="text-emerald-400 font-sans">A tiempo / Tarde</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-800 text-stone-400 text-[10.5px] italic">
            💡 Consejo: Úsalo para controlar contratistas, aparadores de talleres externos u operarios fijos de César Villegas.
          </div>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-stone-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-stone-400">Tasa de Asistencia</span>
            <UserCheck className="text-emerald-500" size={16} />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold font-mono text-[#1A1A1A]">
              {attendanceRate}%
            </span>
            <div className="w-full bg-stone-100 h-1.5 rounded-none mt-2 overflow-hidden">
              <div 
                className={`h-full transition duration-500 ${attendanceRate > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                style={{ width: `${attendanceRate}%` }} 
              />
            </div>
            <span className="text-[9.5px] text-stone-400 block mt-1.5 uppercase font-bold">
              {checkedIn} presentes de {totalInScope.length} activos
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-stone-400">Tardanzas Semanales</span>
            <Clock className="text-amber-500" size={16} />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold font-mono text-stone-900">
              {lateRate}%
            </span>
            <div className="w-full bg-stone-100 h-1.5 rounded-none mt-2 overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition duration-500" 
                style={{ width: `${lateRate}%` }} 
              />
            </div>
            <span className="text-[9.5px] text-stone-400 block mt-1.5 uppercase font-bold">
              {lateArrivals} llegadas tarde registradas
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-stone-400">Inasistencias</span>
            <UserX className="text-red-500" size={16} />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold font-mono text-stone-900">
              {absences} <span className="text-xs font-normal font-sans text-stone-400 uppercase tracking-widest">faltas</span>
            </span>
            <div className="w-full bg-stone-100 h-1.5 rounded-none mt-2 overflow-hidden">
              <div 
                className="h-full bg-red-500 transition duration-500" 
                style={{ width: `${Math.min((absences / Math.max(records.length, 1)) * 100, 100)}%` }} 
              />
            </div>
            <span className="text-[9.5px] text-stone-500 block mt-1.5 uppercase font-bold">
              Requieren justificación con taller maestro
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-stone-400">Eficiencia Horaria</span>
            <Briefcase className="text-indigo-500" size={16} />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold font-mono text-stone-900">
              {averageHours} <span className="text-xs font-normal font-sans text-stone-400 uppercase tracking-widest">hrs</span>
            </span>
            <div className="w-full bg-stone-100 h-1.5 rounded-none mt-2 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition duration-500" 
                style={{ width: `${Math.min((averageHours / 12) * 100, 100)}%` }} 
              />
            </div>
            <span className="text-[9.5px] text-stone-400 block mt-1.5 uppercase font-bold">
              Horas promedio por turno laborado
            </span>
          </div>
        </div>
      </div>

      {/* AI Assistance report Generator section */}
      <div className="border border-indigo-200 bg-[#FAF9FF] p-6 md:p-8 flex flex-col gap-6 relative">
        <div className="absolute top-0 right-0 overflow-hidden shrink-0 pointer-events-none select-none mt-2 mr-2">
          <Sparkles size={120} className="text-indigo-100 opacity-60 translate-x-12 -translate-y-8" />
        </div>
        
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-widest">
            <Sparkles size={14} className="animate-pulse" />
            <span>Inteligencia de Personal & Cadena de Calzado</span>
          </div>
          
          <h2 className="font-serif font-black text-2xl md:text-3xl text-stone-900 mt-2">
            Análisis Predictivo de Asistencia de César Villegas
          </h2>
          
          <p className="text-stone-600 text-xs mt-3 leading-relaxed">
            Consolide los datos cargados mediante modelos generativos avanzados de Gemini. Evaluaremos el impacto cruzado entre las ausencias y la velocidad de fabricación en docenas semanales por línea deportiva.
          </p>
        </div>

        <div className="flex justify-start">
          <button
            onClick={handleGenerateAIReport}
            disabled={isGeneratingReport || records.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest px-6 py-3 border border-indigo-700 font-mono shadow-xs disabled:bg-stone-200 disabled:border-stone-300 disabled:text-stone-400 flex items-center gap-2 transition cursor-pointer"
          >
            {isGeneratingReport ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Procesando: {aiLoadingMessage}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generar Reporte con Inteligencia Artificial (IA)
              </>
            )}
          </button>
        </div>

        {/* Render generated report */}
        {aiReport && (
          <div className="bg-white border border-stone-250 p-6 md:p-8 text-[#1A1A1A] animate-fade-in text-xs max-w-none shadow-3xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={16} />
                <span className="font-sans font-black uppercase tracking-wider text-[10px] text-stone-800">
                  REPORTE ESTRATÉGICO DE PERSONAL & PRODUCTIVIDAD — CALZADOS CÉSAR
                </span>
              </div>
              <span className="font-mono text-[9px] text-stone-400">
                Generated via Gemini 3.5 Flash
              </span>
            </div>

            <div className="prose prose-stone max-w-none text-stone-750 space-y-4 font-sans leading-relaxed">
              {aiReport.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('###')) {
                  return <h3 key={lIdx} className="text-base font-bold font-serif text-[#1A1A1A] pt-4 border-t border-stone-100/50 first:border-0 mt-6 mb-2 first:pt-0">{trimmed.replace(/###/g, '').trim()}</h3>;
                }
                if (trimmed.startsWith('##')) {
                  return <h2 key={lIdx} className="text-lg font-black font-serif text-indigo-900 pt-6 mt-8 mb-3 uppercase tracking-tight">{trimmed.replace(/##/g, '').trim()}</h2>;
                }
                if (trimmed.startsWith('**') || trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.') || trimmed.startsWith('4.')) {
                  // bold or lists
                  return <p key={lIdx} className="text-stone-800 font-bold" dangerouslySetInnerHTML={{ __html: formatBoldAndItalic(line) }} />;
                }
                if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                  return <li key={lIdx} className="ml-4 list-disc pl-1 text-stone-700" dangerouslySetInnerHTML={{ __html: formatBoldAndItalic(trimmed.substring(1).trim()) }} />;
                }
                if (trimmed === '') return <div key={lIdx} className="h-2" />;
                return <p key={lIdx} className="text-stone-700" dangerouslySetInnerHTML={{ __html: formatBoldAndItalic(line) }} />;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Graphs by Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white border border-stone-200 p-6 space-y-5">
          <h3 className="font-serif font-bold text-lg text-[#1A1A1A] border-b border-stone-100 pb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-600" />
            Asistencia por Talleres / Áreas
          </h3>

          <div className="space-y-4">
            {areaStats.map((ast, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-stone-800">{ast.area}</span>
                  <span className="font-mono font-bold text-stone-900">{ast.rate}%</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-none overflow-hidden relative">
                  <div 
                    className={`h-full transition duration-500 ${ast.rate >= 90 ? 'bg-emerald-500' : ast.rate >= 75 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${ast.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-stone-400">
                  <span>Asistencia: {ast.present} / {ast.total} d.h.</span>
                  <span>{ast.lates} tardanzas</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Data View with Search and Filter bar */}
        <div className="md:col-span-2 bg-white border border-stone-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-stone-100 gap-4">
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Registros de Fichajes Detallados
              </h3>
              <span className="text-[10px] bg-stone-100 border border-stone-200 px-2.5 py-1 text-stone-600 font-bold uppercase font-mono">
                {filteredRecords.length} mostrados / {records.length} totales
              </span>
            </div>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-3 border border-stone-200">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-stone-400" size={13} />
                <input
                  type="text"
                  placeholder="Buscar operario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-250 font-bold focus:outline-none focus:border-[#1A1A1A] placeholder:text-stone-300"
                />
              </div>

              {/* Area filter */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 text-stone-400 scroll-smooth" size={13} />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-250 font-bold focus:outline-none focus:border-[#1A1A1A] appearance-none"
                >
                  <option value="Todas">Todas las Áreas</option>
                  {areasDisponibles.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 text-stone-400 pointer-events-none" size={12} />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-stone-250 font-bold focus:outline-none focus:border-[#1A1A1A] appearance-none"
                >
                  <option value="Todos">Todos los Estados</option>
                  <option value="A tiempo">A tiempo</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Falta">Falta</option>
                  <option value="Licencia">Licencia</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 text-stone-400 pointer-events-none" size={12} />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 text-stone-400" size={13} />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-250 font-bold focus:outline-none focus:border-[#1A1A1A] appearance-none"
                >
                  <option value="Todas">Todas las fechas</option>
                  {fechasDisponibles.map(fecha => (
                    <option key={fecha} value={fecha}>{fecha}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 text-stone-400 pointer-events-none" size={12} />
              </div>
            </div>

            {/* Table of records */}
            <div className="overflow-x-auto border border-stone-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="py-2.5 px-3">Trabajador</th>
                    <th className="py-2.5 px-3">Área / Taller</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Entrada / Salida</th>
                    <th className="py-2.5 px-3">Horas</th>
                    <th className="py-2.5 px-3 text-right">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-400 italic">
                        No se encontraron registros de asistencia con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-2 px-3 font-bold text-stone-900">{r.empleado}</td>
                        <td className="py-2 px-3 text-stone-500 font-mono text-[10.5px]">{r.area}</td>
                        <td className="py-2 px-3 text-stone-500">{r.fecha}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-stone-600">
                          {r.horaEntrada} / {r.horaSalida}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-stone-700">
                          {r.horasTrabajadas > 0 ? `${r.horasTrabajadas} h` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={`inline-block text-[9px] uppercase tracking-wide font-black px-2 py-0.5
                            ${r.estado === 'A tiempo' ? 'bg-emerald-50 text-emerald-700' : ''}
                            ${r.estado === 'Tarde' ? 'bg-amber-50 text-amber-700' : ''}
                            ${r.estado === 'Falta' ? 'bg-red-50 text-red-700' : ''}
                            ${r.estado === 'Licencia' ? 'bg-stone-100 text-stone-600' : ''}
                          `}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* Dynamic Excel Report Previewer */}
      {activeTab === 'preview' && (
        <div className="space-y-6 animate-fade-in" id="previsualizador-excel-panel">
          {/* File summary bar */}
          <div className="bg-white border border-stone-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-black text-stone-900 text-lg leading-tight">
                    {uploadedFileName || 'Asistencia_Cargada.xlsx'}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 animate-pulse">
                    Excel Activo
                  </span>
                </div>
                <p className="text-stone-500 text-xs mt-1">
                  Hoja activa: <span className="font-bold font-mono text-[#1A1A1A]">{uploadedSheetName}</span> • Total filas: <span className="font-bold text-[#1A1A1A]">{rawExcelRows.length}</span> • Columnas autónomas: <span className="text-[#1A1A1A] font-bold">{rawExcelHeaders.length}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-stone-400" size={13} />
                <input
                  type="text"
                  placeholder="Buscar en celdas..."
                  value={searchTermPreview}
                  onChange={(e) => setSearchTermPreview(e.target.value)}
                  className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-250 font-bold focus:outline-none focus:bg-white focus:border-[#1A1A1A] placeholder:text-stone-300"
                />
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] bg-[#1A1A1A] hover:bg-stone-900 text-white font-bold uppercase tracking-wider px-4 py-2 flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer"
              >
                <Upload size={12} />
                Subir Otro Archivo
              </button>
            </div>
          </div>

          {/* Interactive spreadsheet emulator */}
          <div className="bg-white border border-stone-250 shadow-3xs overflow-hidden">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left border-collapse select-text">
                <thead className="sticky top-0 bg-stone-100 z-10 text-stone-500 border-b border-stone-250 text-[10.5px]">
                  {/* Excel top row letters (A, B, C...) */}
                  <tr className="border-b border-stone-200">
                    <th className="bg-stone-200/60 border-r border-stone-250 w-12 text-center py-1 font-mono text-[9px] font-bold text-stone-400 select-none">
                      #
                    </th>
                    {rawExcelHeaders.map((_, hIdx) => {
                      const letter = String.fromCharCode(65 + (hIdx % 26));
                      const prefix = hIdx >= 26 ? String.fromCharCode(64 + Math.floor(hIdx / 26)) : '';
                      return (
                        <th key={hIdx} className="border-r border-stone-200 text-center py-1 font-mono text-[9.5px] font-bold text-stone-400 select-none w-48 min-w-[12rem]">
                          {prefix}{letter}
                        </th>
                      );
                    })}
                  </tr>
                  
                  {/* Actual Column Headers */}
                  <tr className="bg-stone-50">
                    <th className="bg-stone-100 border-r border-stone-250 p-2 text-center font-bold text-stone-500 select-none">
                      📋
                    </th>
                    {rawExcelHeaders.map((header, hIdx) => (
                      <th key={hIdx} className="border-r border-stone-200 p-2.5 font-sans font-extrabold text-stone-800 bg-stone-100/60 truncate min-w-[12rem]" title={header}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-150 text-xs text-stone-800 font-sans">
                  {rawExcelRows.length === 0 ? (
                    <tr>
                      <td colSpan={rawExcelHeaders.length + 1} className="py-12 text-center text-stone-400 italic">
                        No hay datos cargados para previsualizar. Por favor, suba un Excel arriba.
                      </td>
                    </tr>
                  ) : (
                    rawExcelRows
                      .filter(row => {
                        if (!searchTermPreview) return true;
                        return row.some(val => 
                          String(val !== undefined && val !== null ? val : '').toLowerCase().includes(searchTermPreview.toLowerCase())
                        );
                      })
                      .map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-indigo-50/10 group transition">
                          {/* Row numbering card */}
                          <td className="bg-stone-50/80 border-r border-stone-250 text-center py-2 font-mono text-[10px] text-stone-400 select-none group-hover:bg-stone-150/50 group-hover:text-stone-700">
                            {rIdx + 1}
                          </td>

                          {rawExcelHeaders.map((_, cIdx) => {
                            const val = row[cIdx];
                            const valStr = val !== undefined && val !== null ? String(val) : '—';
                            
                            const isLate = valStr.toLowerCase().includes('tarde');
                            const isAbsent = valStr.toLowerCase().includes('falta');
                            const isOntime = valStr.toLowerCase().includes('a tiempo');

                            return (
                              <td 
                                key={cIdx} 
                                className={`border-r border-stone-200 p-2 px-2.5 truncate font-mono text-[11px] 
                                  ${isLate ? 'bg-amber-50/70 text-amber-950 font-bold' : ''}
                                  ${isAbsent ? 'bg-red-50/70 text-red-950 font-bold' : ''}
                                  ${isOntime ? 'bg-emerald-50/55 text-emerald-950' : ''}
                                `}
                                title={valStr}
                              >
                                {valStr}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grid stats bar */}
            <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-[11px] text-stone-500 font-mono gap-2">
              <div>
                <span>🔍 Mostrando <span className="font-bold text-stone-800">
                  {rawExcelRows.filter(row => {
                    if (!searchTermPreview) return true;
                    return row.some(val => 
                      String(val !== undefined && val !== null ? val : '').toLowerCase().includes(searchTermPreview.toLowerCase())
                    );
                  }).length}
                </span> de <span className="font-bold text-stone-800">{rawExcelRows.length}</span> filas en tabla
                {searchTermPreview && ` (filtrado por "${searchTermPreview}")`}</span>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span className="text-emerald-700 font-bold">Lector de Hoja de Cálculo Activo</span>
              </div>
            </div>
          </div>

          {/* Quick instructions widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF9FF] border border-indigo-100 p-6 md:p-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <Eye size={16} className="text-indigo-600" />
                <h4 className="font-serif font-black text-stone-900 text-lg uppercase tracking-tight">Visualización Completa de Columnas</h4>
              </div>
              <p className="text-xs leading-relaxed text-stone-600">
                A diferencia de los paneles resumidos, el <strong>Previsualizador de Excel</strong> expone todas las columnas que el archivo original suministra (por ejemplo, códigos de operarios, identificadores biométricos, justificaciones escritas, o timestamps exactos). Esto te permite realizar auditorías minuciosas directamente en la web.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                <h4 className="font-serif font-black text-stone-900 text-lg uppercase tracking-tight">Inteligencia Artificial Sincronizada</h4>
              </div>
              <p className="text-xs leading-relaxed text-stone-600">
                Al cargar un nuevo reporte, el previsualizador actualiza automáticamente la estructura de memoria interna. Al presionar el botón de **Generar Reporte con IA**, Gemini evaluará estas celdas directamente para redactar recomendaciones para César Villegas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper markdown bold formatting wrapper string
function formatBoldAndItalic(text: string): string {
  let formatted = text;
  
  // Bold **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return formatted;
}
