import React, { useState, useRef, useEffect } from 'react';
import { 
  FileImage, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  CheckCircle2, 
  User, 
  ShoppingBag, 
  Calendar, 
  FileUp, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle,
  Eye,
  Info,
  FileSpreadsheet,
  FileText,
  File,
  ArrowUpDown,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Pedido, PedidoVariante, EstadoPedido } from '../types';
import { CATALOGO_REAL } from './CatalogoModelos';

interface AdjuntarPedidoImagenProps {
  proximoCodigo: string;
  onSave: (pedido: Pedido) => void;
  onSuccessRedirect: () => void;
}

const TALLAS_ESTANDAR = ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

const VENDEDORES_SUGERIDOS = [
  'VALERIA',
  'ESTEFANY',
  'ANGHY',
  'COTCAS',
  'JUAN VALER',
  'STOCK TIENDA'
];

interface ParseStatus {
  step: number;
  message: string;
}

// 3 realistic sample orders data and base64 simulated notes for demonstration
const SAMPLE_MOCKED_ORDERS = [
  {
    name: "📋 Ficha Escrita a Mano - Lote MESSI",
    description: "Pedido de Valeria: 2 colores (Negro y Blanco) con tallaje juvenil",
    result: {
      producto: "MESSI",
      vendedor: "VALERIA",
      estado: "PEDIDO" as EstadoPedido,
      semana: 19,
      items: [
        {
          color: "NEGRO AMARILLO",
          tallas: { "34": 6, "35": 12, "36": 12, "37": 12, "38": 6 }
        },
        {
          color: "BLANCO CELESTE",
          tallas: { "35": 12, "36": 12, "37": 12, "38": 12 }
        }
      ]
    },
    // Elegant drawn SVG in base64 representing a handwritten order table
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:%23faf8f5;font-family:cursive,sans-serif;padding:20px;box-sizing:border-box;color:%231e293b;">
      <rect width="100%25" height="100%25" fill="%23fcfbfa" stroke="%23cbd5e1" stroke-width="4"/>
      <path d="M 0,30 L 600,30 M 0,70 L 600,70 M 0,110 L 600,110 M 0,150 L 600,150 M 0,190 L 600,190 M 0,230 L 600,230 M 0,270 L 600,270 M 0,310 L 600,310 M 0,350 L 600,350" stroke="%23e2e8f0" stroke-width="1" />
      <text x="30" y="45" font-size="22" font-style="italic" font-weight="bold" fill="%231e3a8a">BRIXTON CALZADO - NOTA PEDIDO</text>
      <text x="30" y="80" font-size="14" font-weight="semibold">VENDEDOR: VALERIA (Lote Sem. 19)</text>
      <text x="350" y="80" font-size="14" font-weight="semibold">MODELO: MESSI</text>
      <text x="30" y="120" font-size="13" fill="%23dc2626">✓ ESTADO: PEDIDO NORMAL</text>
      <text x="350" y="120" font-size="13">Fecha: 16-06-2026</text>
      <rect x="30" y="160" width="540" height="200" fill="none" stroke="%23475569" stroke-width="2"/>
      <line x1="180" y1="160" x2="180" y2="360" stroke="%23475569" stroke-width="1.5" />
      <text x="40" y="185" font-size="13" font-weight="bold">Color / Detallado</text>
      <text x="200" y="185" font-size="13" font-weight="bold">Distribución Tallas (Pares)</text>
      <line x1="30" y1="200" x2="570" y2="200" stroke="%23475569" stroke-width="1.5" />
      <!-- Row 1 -->
      <text x="40" y="240" font-size="14" font-weight="bold" fill="%23475569">NEGRO AMARILLO</text>
      <text x="200" y="240" font-size="13">T34: 6 pares | T35: 12 pares | T36: 12 pares | T37: 12 pares | T38: 6 pares</text>
      <line x1="30" y1="265" x2="570" y2="265" stroke="%2394a3b8" stroke-width="1" />
      <!-- Row 2 -->
      <text x="40" y="310" font-size="14" font-weight="bold" fill="%231e293b">BLANCO CELESTE</text>
      <text x="200" y="310" font-size="13">T35: 12 pares | T36: 12 pares | T37: 12 pares | T38: 12 pares</text>
      <!-- Footer Note -->
      <text x="40" y="280" font-size="11" font-style="italic" fill="%2364748b">* Total docenas: 8 docenas (96 pares) *</text>
    </svg>`
  },
  {
    name: "📋 Ficha de Taller - Lote KILLER (Taller Cortado)",
    description: "Orden en producción: Modelo KILLER con suela de goma",
    result: {
      producto: "KILLER",
      vendedor: "—",
      estado: "PRODUCCION" as EstadoPedido,
      semana: 20,
      items: [
        {
          color: "NEGRO / ROJO FUEGO",
          tallas: { "37": 12, "38": 24, "39": 24, "40": 12 }
        }
      ]
    },
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:%23faf8f5;font-family:monospace;padding:20px;box-sizing:border-box;">
      <rect width="100%25" height="100%25" fill="%23ffffff" stroke="%231e293b" stroke-width="3"/>
      <text x="30" y="50" font-size="20" font-weight="bold" fill="%23b45309">🔧 ORDEN DE PRODUCCIÓN TALLER</text>
      <line x1="30" y1="65" x2="570" y2="65" stroke="%231e293b" stroke-width="2" />
      <text x="30" y="95" font-size="13">LOTE DE CALZADO: KILLER</text>
      <text x="300" y="95" font-size="13">SEMANA DE TRABAJO: 20</text>
      <text x="30" y="125" font-size="13" fill="%23d97706">OPERACIÓN: TALLER CORTADO / ARMADO</text>
      <text x="300" y="125" font-size="13">RESPONSABLE: CÉSAR VILLEGAS</text>
      <rect x="30" y="160" width="540" height="180" fill="%23f8fafc" stroke="%23475569" />
      <line x1="30" y1="200" x2="570" y2="200" stroke="%23475569" stroke-width="1.5" />
      <text x="45" y="185" font-size="11" font-weight="bold">VARIANTE COLOR</text>
      <text x="220" y="185" font-size="11" font-weight="bold">TALLAS (PARES POR NUMERO)</text>
      <text x="45" y="240" font-size="12" font-weight="bold" fill="%23dc2626">NEGRO / ROJO FUEGO</text>
      <text x="220" y="240" font-size="11">T37 -> 12 | T38 -> 24 | T39 -> 24 | T40 -> 12</text>
      <text x="30" y="375" font-size="12" font-style="italic" fill="%23475569">Total Pares: 72 pares (6.00 docenas) para envío inmediato</text>
    </svg>`
  },
  {
    name: "📋 Nota de Stock Tienda - Modelo ZOOM VAPOR",
    description: "Lote directo para Stock en Tienda Física",
    result: {
      producto: "ZOOM VAPOR",
      vendedor: "STOCK TIENDA",
      estado: "VENTA" as EstadoPedido,
      semana: 21,
      items: [
        {
          color: "BLANCO AZULINO",
          tallas: { "36": 12, "37": 12, "38": 12 }
        }
      ]
    },
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:%23fefefe;font-family:sans-serif;padding:25px;box-sizing:border-box;">
      <rect width="100%25" height="100%25" fill="%23ffffff" stroke="%2310b981" stroke-width="3" stroke-dasharray="8,4"/>
      <text x="30" y="45" font-size="20" font-weight="black" fill="%23047857">💵 NOTA DE INGRESO STOCK TIENDA</text>
      <text x="30" y="80" font-size="13" font-weight="bold" fill="%234b5563">DESTINO: STOCK TIENDA (TIENDA FISICA BRIXTON)</text>
      <text x="30" y="110" font-size="12">MODELO DE LÍNEA: ZOOM VAPOR</text>
      <text x="350" y="110" font-size="12">Semana de Venta: 21</text>
      <rect x="30" y="150" width="540" height="180" fill="%23f0fdf4" stroke="%2310b981" />
      <line x1="30" y1="190" x2="570" y2="190" stroke="%2310b981" />
      <text x="50" y="175" font-size="11" font-weight="bold" fill="%23065f46">DETALLE COLOR</text>
      <text x="210" y="175" font-size="11" font-weight="bold" fill="%23065f46">TALLAS ADQUIRIDAS (PARES)</text>
      <text x="50" y="235" font-size="12" font-weight="bold" fill="%231e293b">BLANCO AZULINO</text>
      <text x="210" y="235" font-size="11" font-weight="bold">36 -> 12 p | 37 -> 12 p | 38 -> 12 p</text>
      <text x="30" y="365" font-size="12" font-weight="bold" fill="%23047857">VOLUMEN DESPACHADO: 36 pares (3.00 docenas)</text>
    </svg>`
  }
];

export const AdjuntarPedidoImagen: React.FC<AdjuntarPedidoImagenProps> = ({
  proximoCodigo,
  onSave,
  onSuccessRedirect
}) => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseStatus, setParseStatus] = useState<ParseStatus>({ step: 0, message: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // High-fidelity zoom and viewer controls for handwritten documents
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-format support files detail states
  const [fileCategory, setFileCategory] = useState<'image' | 'pdf' | 'excel' | 'text' | 'generic'>('image');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [plainTextContent, setPlainTextContent] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');

  // Form Fields once parsed
  const [producto, setProducto] = useState<string>('');
  const [vendedor, setVendedor] = useState<string>('—');
  const [estado, setEstado] = useState<EstadoPedido>('PEDIDO');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]!);
  const [semana, setSemana] = useState<number>(19);
  const [items, setItems] = useState<PedidoVariante[]>([]);

  // Autogenerate unique ID and sequential code for newly parsed lot
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // Update sequential code dynamically based on Chosen State and proximoCodigo
  useEffect(() => {
    const rawSerial = proximoCodigo.replace(/^PD/, '');
    if (estado === 'PEDIDO') {
      setGeneratedCode(`PD${rawSerial}`);
    } else if (estado === 'PRODUCCION') {
      setGeneratedCode(`OP${rawSerial}`);
    } else if (estado === 'VENTA') {
      setGeneratedCode(`VT${rawSerial}`);
    }
  }, [estado, proximoCodigo]);

  // Handle uploaded files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAndProcessFile(file);
    }
  };

  const loadAndProcessFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadedFileName(file.name);

    const isImage = file.type.match('image.*') || file.name.match(/\.(png|jpe?g|webp|gif|heic|svg)$/i);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.csv') || 
                    file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('csv');
    const isText = file.type.match('text.*') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.xml');

    if (isImage) {
      setFileCategory('image');
      setMimeType(file.type || 'image/png');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1] || '';
          setImageBase64(base64Data);
          setSuccessMsg(`Imagen "${file.name}" cargada correctamente. Puede procesarla usando la Inteligencia Artificial.`);
        }
      };
      reader.onerror = () => setErrorMsg('Error al abrir el archivo de imagen.');
      reader.readAsDataURL(file);
    } else if (isPdf) {
      setFileCategory('pdf');
      setMimeType('application/pdf');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1] || '';
          setImageBase64(base64Data);
          setSuccessMsg(`Documento PDF "${file.name}" cargado correctamente. Puede procesarlo usando la Inteligencia Artificial.`);
        }
      };
      reader.onerror = () => setErrorMsg('Error al abrir el archivo PDF.');
      reader.readAsDataURL(file);
    } else if (isExcel) {
      setFileCategory('excel');
      setMimeType('text/plain');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          let combinedText = '';
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            combinedText += `--- HOJA: ${sheetName} ---\n${csv}\n\n`;
          });
          setPlainTextContent(combinedText);
          const base64Data = btoa(unescape(encodeURIComponent(combinedText)));
          setImageBase64(base64Data);
          setSuccessMsg(`Planilla Excel "${file.name}" cargada e interpretada automáticamente como texto estructurado. Puede procesarla usando la Inteligencia Artificial.`);
        } catch (err) {
          console.error(err);
          setErrorMsg('Error al pre-procesar el archivo de hoja de cálculo excel.');
        }
      };
      reader.onerror = () => setErrorMsg('Error al abrir la planilla excel.');
      reader.readAsArrayBuffer(file);
    } else if (isText) {
      setFileCategory('text');
      setMimeType('text/plain');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPlainTextContent(reader.result);
          const base64Data = btoa(unescape(encodeURIComponent(reader.result)));
          setImageBase64(base64Data);
          setSuccessMsg(`Archivo de texto "${file.name}" cargado correctamente. Puede procesarlo con la Inteligencia Artificial.`);
        }
      };
      reader.onerror = () => setErrorMsg('Error al abrir el archivo de texto.');
      reader.readAsText(file);
    } else {
      // Generic binary fallback: read as base64 and call it generic. Gemini can handle many forms or error out gracefully
      setFileCategory('generic');
      setMimeType(file.type || 'application/octet-stream');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1] || '';
          setImageBase64(base64Data);
          setSuccessMsg(`Archivo "${file.name}" cargado correctamente. El analizador IA intentará interpretarlo de forma inteligente.`);
        }
      };
      reader.onerror = () => setErrorMsg('Error al abrir el archivo genérico.');
      reader.readAsDataURL(file);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadAndProcessFile(file);
    }
  };

  // Pre-load demo sample with 1-click
  const handleSelectDemoSample = (sample: typeof SAMPLE_MOCKED_ORDERS[0]) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setItems([]);
    setFileCategory('image');
    setUploadedFileName(sample.name);
    
    // Extrait base64 dataset from the SVG
    const base64Svg = btoa(unescape(encodeURIComponent(sample.previewSvg.replace(/^data:image\/svg\+xml;utf8,/, ''))));
    setImageBase64(base64Svg);
    setMimeType('image/svg+xml');

    setSuccessMsg(`Ficha demo "${sample.name.substring(2)}" cargada en el visor. ¡Haga clic en el botón de Inteligencia Artificial para extraerla!`);
  };

  // Post to the backend route to process the image via Gemini model
  const handleProcessWithGemini = async () => {
    let currentImageBase64 = imageBase64;
    let currentMimeType = mimeType;

    if (activeMode === 'paste') {
      if (!pastedText.trim()) {
        setErrorMsg('Por favor pegue los datos o listado de su pedido en el cuadro de texto primero.');
        return;
      }
      setFileCategory('text');
      const base64Data = btoa(unescape(encodeURIComponent(pastedText)));
      currentImageBase64 = base64Data;
      setImageBase64(base64Data);
      currentMimeType = 'text/plain';
      setMimeType('text/plain');
      setPlainTextContent(pastedText);
    } else {
      if (!currentImageBase64) {
        setErrorMsg('Por favor adjunte una imagen o foto de su pedido primero o use la opción de copiar y pegar.');
        return;
      }
    }

    setIsProcessing(true);
    setParseStatus({ step: 1, message: 'Preparando datos para el analizador inteligente...' });
    setErrorMsg(null);

    // Dynamic step animation to reassure user during parsing process
    const steps = [
      { step: 2, message: 'Gemini AI analizando caligrafía o formato de texto pegado...' },
      { step: 3, message: 'Maquetando colores de calzado según catálogo Brixton...' },
      { step: 4, message: 'Calculando distribuciones de docenas y pares...' },
      { step: 5, message: 'Extracción finalizada. Revisando coherencia de datos...' }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setParseStatus(steps[currentStepIdx]!);
        currentStepIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    try {
      const response = await fetch('/api/parse-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: currentImageBase64,
          mimeType: currentMimeType
        })
      });

      clearInterval(interval);

      let resData: any = {};
      try {
        resData = await response.json();
      } catch (err) {
        // Not a JSON response
        console.error("No se pudo parsear el JSON de respuesta:", err);
      }

      if (!response.ok) {
        const serverError = resData.error || resData.details || 'Error desconocido del servidor.';
        throw new Error(`Error en el servidor de extracción: ${serverError}`);
      }

      const extracted = resData.result;
      if (!extracted) {
        throw new Error('La IA no pudo estructurar correctamente la información.');
      }

      // Populate extracted fields to the editable form
      setProducto(extracted.producto ? extracted.producto.toUpperCase().trim() : 'KILLER');
      setVendedor(extracted.vendedor ? extracted.vendedor.toUpperCase().trim() : '—');
      setEstado(extracted.estado ? (extracted.estado as EstadoPedido) : 'PEDIDO');
      setSemana(extracted.semana ? Number(extracted.semana) : 19);
      
      // Map variants colors & sizes
      const parsedItems: PedidoVariante[] = (extracted.items || []).map((extItem: any, idx: number) => {
        const cleanTallas: { [talla: string]: number } = {};
        TALLAS_ESTANDAR.forEach(talla => {
          if (extItem.tallas && extItem.tallas[talla]) {
            cleanTallas[talla] = Number(extItem.tallas[talla]);
          }
        });

        return {
          id: 'v-ext-' + idx + '-' + Date.now(),
          color: extItem.color ? extItem.color.toUpperCase().trim() : 'NUEVO COLOR',
          tallas: cleanTallas
        };
      });

      setItems(parsedItems.length > 0 ? parsedItems : [{ id: 'v-' + Date.now(), color: 'NEGRO', tallas: {} }]);
      setSuccessMsg('✨ ¡La Inteligencia Artificial extrajo con éxito los datos del pedido! Por favor revíselos y confirme en el panel derecho.');
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setErrorMsg(`Error procesando la imagen: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Grid manual adjustments handlers
  const handleVariantColorChange = (id: string, color: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, color: color } : item));
  };

  const handleTallaPairsChange = (id: string, talla: string, valStr: string) => {
    const val = valStr === '' ? 0 : parseInt(valStr, 10);
    if (isNaN(val) || val < 0) return;

    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const currentTallas = { ...item.tallas };
        if (val === 0) {
          delete currentTallas[talla];
        } else {
          currentTallas[talla] = val;
        }
        return { ...item, tallas: currentTallas };
      }
      return item;
    }));
  };

  const handleApplyStandardCurva = (id: string, tipoCurva: 'juvenil' | 'adulto' | '35_38' | '39_42' | '37_40') => {
    const curJuvenil = { '34': 1, '35': 2, '36': 3, '37': 3, '38': 2, '39': 1 };
    const curAdulto = { '37': 1, '38': 2, '39': 3, '40': 3, '41': 2, '42': 1 };
    const cur35_38 = { '35': 3, '36': 3, '37': 3, '38': 3 };
    const cur39_42 = { '39': 3, '40': 3, '41': 3, '42': 3 };
    const cur37_40 = { '37': 3, '38': 3, '39': 3, '40': 3 };

    let selectedCurva = {};
    if (tipoCurva === 'juvenil') selectedCurva = curJuvenil;
    else if (tipoCurva === 'adulto') selectedCurva = curAdulto;
    else if (tipoCurva === '35_38') selectedCurva = cur35_38;
    else if (tipoCurva === '39_42') selectedCurva = cur39_42;
    else if (tipoCurva === '37_40') selectedCurva = cur37_40;

    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          tallas: { ...selectedCurva }
        };
      }
      return item;
    }));
    setSuccessMsg('⚡ Curva de 12 pares (1 docena) aplicada con éxito en la fila seleccionada.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSortByColor = () => {
    setItems(prev => [...prev].sort((a, b) => a.color.localeCompare(b.color)));
    setSuccessMsg('✓ Filas de la planilla ordenadas por color alfabéticamente.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleClearAllCells = () => {
    setItems(prev => prev.map(item => ({ ...item, tallas: {} })));
    setSuccessMsg('✓ Planilla Excel limpiada. Todas las cantidades se establecieron en 0.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExportToExcelFile = () => {
    try {
      const rows: any[] = [];
      rows.push(['SISTEMA INDUSTRIAL BRIXTON CALZADO - DETALLE DE LOTE EXPORTADO']);
      rows.push(['LOTE:', generatedCode]);
      rows.push(['MODELO:', producto || 'SIN ESPECIFICAR']);
      rows.push(['VENDEDOR/CLIENTE:', vendedor === '—' ? 'SIN ASIGNAR' : vendedor]);
      rows.push(['SEMANA:', semana]);
      rows.push(['FECHA DE EXTRACCIÓN:', fecha]);
      rows.push([]);
      
      const headers = ['FILA', 'MODELO', 'COLOR', ...TALLAS_ESTANDAR.map(t => 'T' + t), 'TOTAL PARES', 'DOCENAS'];
      rows.push(headers);

      items.forEach((item, idx) => {
        const itemPairs = Object.values(item.tallas).reduce<number>((s, v) => s + (Number(v) || 0), 0);
        const itemDozen = Math.round((itemPairs / 12) * 100) / 100;
        const rowData = [
          idx + 1,
          producto,
          item.color,
          ...TALLAS_ESTANDAR.map(talla => item.tallas[talla] || 0),
          itemPairs,
          itemDozen
        ];
        rows.push(rowData);
      });

      const totalRow = [
        'TOTALES',
        '',
        '',
        ...TALLAS_ESTANDAR.map(talla => {
          return items.reduce((sum, item) => sum + (Number(item.tallas[talla]) || 0), 0);
        }),
        totalParesLote,
        totalDocenasLote
      ];
      rows.push(totalRow);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Detalle de Lote');
      XLSX.writeFile(wb, `Brixton_Lote_${generatedCode}.xlsx`);
      setSuccessMsg('📥 Hoja de cálculo Excel descargada correctamente.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al generar la planilla de Excel para descarga.');
    }
  };

  const handleSaveWithCustomConfig = (targetEstado: EstadoPedido, customVendedorOption?: string) => {
    setErrorMsg(null);
    if (!producto) {
      setErrorMsg('Debe seleccionar un modelo de calzado de la lista.');
      return;
    }
    if (totalParesLote === 0) {
      setErrorMsg('Debe registrar por lo menos 1 par en las tallas para ingresar este lote.');
      return;
    }

    let finalVendedorValue = vendedor === '—' ? null : vendedor;
    if (customVendedorOption !== undefined) {
      finalVendedorValue = customVendedorOption === '—' ? null : customVendedorOption;
    }

    const finalPedido: Pedido = {
      id: 'pd-ai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      codigo: generatedCode,
      fecha: fecha,
      semana: Number(semana),
      vendedor: finalVendedorValue,
      producto: producto,
      variantes: items.length,
      docenas: totalDocenasLote,
      estado: targetEstado,
      items: items
    };

    onSave(finalPedido);

    let mensajeDestino = '';
    if (targetEstado === 'PEDIDO') {
      mensajeDestino = `PEDIDOS GENERALES (Lote: ${generatedCode})`;
    } else if (targetEstado === 'PRODUCCION') {
      mensajeDestino = `TALLER EN PRODUCCIÓN (Lote: ${generatedCode})`;
    } else if (targetEstado === 'VENTA') {
      if (finalVendedorValue === 'STOCK TIENDA') {
        mensajeDestino = `STOCK FÍSICO DE TIENDA (Lote: ${generatedCode})`;
      } else {
        mensajeDestino = `HISTORIAL DE VENTAS DIRECTAS (Lote: ${generatedCode})`;
      }
    }

    setSuccessMsg(`🎉 ¡Lote registrado con éxito! Se ha agregado correctamente a: ${mensajeDestino}.`);
    
    setTimeout(() => {
      onSuccessRedirect();
    }, 1500);
  };

  const handleAddNewColorRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        color: 'OTRO COLOR',
        tallas: {}
      }
    ]);
  };

  const handleRemoveColorRow = (id: string) => {
    if (items.length <= 1) {
      setErrorMsg('Debe registrar al menos un color en su pedido.');
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate totals
  const totalParesLote = items.reduce((sum, item) => {
    const variantSum = Object.values(item.tallas).reduce<number>((s, v) => s + (Number(v) || 0), 0);
    return sum + variantSum;
  }, 0);

  const totalDocenasLote = Math.round((totalParesLote / 12) * 100) / 100;

  // Save parsed order into master list
  const handleSaveToMasterTable = () => {
    handleSaveWithCustomConfig(estado);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Title Banner */}
      <div className="bg-white border border-stone-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-wider flex items-center gap-2 text-[#1A1A1A]">
            <FileUp className="text-purple-600" size={18} />
            CONVERTIR FOTOS Y NOTAS ESCRITAS A MANO EN PEDIDOS
          </h2>
          <p className="text-stone-500 text-[11px] font-mono mt-1 uppercase tracking-widest font-semibold">
            Optimice su flujo de trabajo: adjunte la foto de su cuota, nota de venta o boleta física y la IA Gemini la procesará en segundos.
          </p>
        </div>
        <button
          onClick={() => {
            setImageBase64(null);
            setItems([]);
            setErrorMsg(null);
            setSuccessMsg(null);
            setProducto('');
            setPastedText('');
            setActiveMode('upload');
          }}
          className="text-[10px] uppercase font-bold tracking-widest bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 border border-stone-300 rounded-none transition"
          title="Limpiar visor de archivos"
        >
          Nueva Carga
        </button>
      </div>

      {/* Success and Error messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-none text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-none text-xs flex items-center gap-2 font-semibold">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Uploader & Document Previewer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-stone-200 p-5 space-y-4">
            <h3 className="text-2xs font-extrabold uppercase tracking-[0.2em] text-stone-500 border-b border-stone-150 pb-2">
              📸 1. Visor de Documento Adjunto
            </h3>

             {/* Choice Tabs for Upload vs. Copy-Paste */}
            {!imageBase64 && (
              <div className="flex border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveMode('upload')}
                  className={`flex-1 text-center py-2 text-[10px] uppercase font-bold tracking-wider border-b-2 transition-all ${
                    activeMode === 'upload'
                      ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50/10'
                      : 'border-transparent text-stone-400 hover:text-stone-750'
                  }`}
                >
                  📁 Subir Archivo / Foto
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('paste')}
                  className={`flex-1 text-center py-2 text-[10px] uppercase font-bold tracking-wider border-b-2 transition-all ${
                    activeMode === 'paste'
                      ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50/10'
                      : 'border-transparent text-stone-400 hover:text-stone-750'
                  }`}
                >
                  📋 Copiar y Pegar Texto
                </button>
              </div>
            )}

            {/* Drag & Drop Frame */}
            {!imageBase64 ? (
              activeMode === 'paste' ? (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="bg-stone-50 border border-stone-200 p-3">
                    <span className="text-[10px] font-black uppercase text-[#1A1A1A] block">
                      📋 Pegue sus datos de órdenes o planilla Excel:
                    </span>
                    <p className="text-[9px] font-mono text-stone-400 mt-1">
                      Copie del portapapeles y pegue filas completas, mensajes de WhatsApp, o planillas en el cuadro gris inferior.
                    </p>
                  </div>
                  
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Por ejemplo, puede pegar texto normal o celdas de excel:

MODELO: KILLER
VENDEDOR: VALERIA
SEMANA: 19

COLOR,35,36,37,38,39,40,41,42
NEGRO AMARILLO,12,12,24,12,0,0,0,0
BLANCO GRIS,0,12,12,24,12,6,0,0`}
                    className="w-full h-56 font-mono text-xs border border-stone-350 p-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none rounded-none resize-none bg-[#FAFAF9]"
                  />

                  <button
                    type="button"
                    onClick={handleProcessWithGemini}
                    disabled={isProcessing}
                    className="w-full bg-[#1A1A1A] hover:bg-stone-850 disabled:bg-stone-200 text-white font-extrabold text-[10px] uppercase tracking-widest py-3 px-4 rounded-none border border-black shadow-none transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-purple-400" />
                        <span>PROCESANDO: {parseStatus.message}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-purple-400" />
                        <span>PROCESAR CON INTELIGENCIA ARTIFICIAL</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed transition-all duration-200 p-8 text-center cursor-pointer flex flex-col items-center justify-center min-h-[300px] rounded-none
                    ${dragActive 
                      ? 'border-purple-600 bg-purple-50/50 scale-[1.02] ring-2 ring-purple-100' 
                      : 'border-stone-300 hover:border-purple-600 bg-[#fbfcfa] hover:bg-stone-50/30'
                    }`}
                >
                  <div className="w-12 h-12 bg-stone-100 border border-stone-200 rounded-none flex items-center justify-center text-stone-400 mb-4 group-hover:bg-purple-50 transition-colors">
                    <Upload size={20} className="text-stone-500" />
                  </div>
                  <h4 className="text-[#1A1A1A] font-black text-xs uppercase tracking-wider mb-1">
                    Arrastrar archivo de pedido aquí
                  </h4>
                  <p className="text-stone-400 text-[10px] font-mono leading-relaxed max-w-xs mb-4">
                    o haga clic para explorar sus archivos locales (fotos, PDFs, planillas Excel, archivos de texto, CSV, etc.)
                  </p>
                  <span className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-none border border-black shadow-none transition">
                    Seleccionar Archivo
                  </span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
                    className="hidden" 
                  />
                </div>
              )
            ) : (
              /* Highly detailed preview frame */
              <div className="space-y-4">
                {fileCategory === 'pdf' ? (
                  <div className="bg-red-50/50 border border-red-200 rounded-none h-[320px] flex flex-col items-center justify-center p-6 text-center">
                    <FileImage size={48} className="text-red-500 mb-3" />
                    <span className="text-xs font-black uppercase text-red-800 tracking-wider">Documento PDF Adjunto</span>
                    <p className="text-[11px] font-mono font-bold mt-1 max-w-xs text-stone-700 truncate w-full" title={uploadedFileName}>
                      {uploadedFileName || 'documento.pdf'}
                    </p>
                    <span className="text-[9px] bg-red-100 text-red-700 px-2.5 py-1 font-bold font-mono mt-3 uppercase border border-red-200">
                      Formato PDF Nativo
                    </span>
                  </div>
                ) : fileCategory === 'excel' ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-none h-[320px] flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 border-b border-emerald-100 pb-2">
                       <FileSpreadsheet size={24} className="text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Planilla Excel / CSV</span>
                        <p className="text-[9px] font-mono text-stone-500 truncate" title={uploadedFileName}>
                          {uploadedFileName}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white border border-emerald-200 p-2.5 flex-1 font-mono text-[9px] overflow-y-auto whitespace-pre text-stone-700 leading-normal select-text">
                      {plainTextContent || 'Interpretando celdas...'}
                    </div>
                  </div>
                ) : fileCategory === 'text' ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-none h-[320px] flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                      <FileText size={24} className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-stone-800 tracking-wider block">Archivo de Texto Adjunto</span>
                        <p className="text-[9px] font-mono text-stone-500 truncate" title={uploadedFileName}>
                          {uploadedFileName}
                        </p>
                      </div>
                    </div>
                    <div className="bg-stone-900 border border-stone-950 p-3 flex-1 font-mono text-[9px] overflow-y-auto whitespace-pre text-stone-200 leading-normal select-text">
                      {plainTextContent || 'Vacío o sin datos.'}
                    </div>
                  </div>
                ) : fileCategory === 'generic' ? (
                  <div className="bg-blue-50/55 border border-blue-200 rounded-none h-[320px] flex flex-col items-center justify-center p-6 text-center">
                    <File size={48} className="text-blue-500 mb-3" />
                    <span className="text-xs font-black uppercase text-blue-800 tracking-wider">Archivo Binario Adjunto</span>
                    <p className="text-[11px] font-mono font-bold mt-1 max-w-xs text-stone-700 truncate w-full" title={uploadedFileName}>
                      {uploadedFileName}
                    </p>
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-2.5 py-1 font-bold font-mono mt-3 uppercase border border-blue-200">
                      Tipo: {mimeType || 'Octet-stream'}
                    </span>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-none overflow-hidden relative group h-[320px] flex items-center justify-center">
                    <img 
                      src={imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`}
                      alt="Pedido escaneado"
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="max-h-full max-w-full object-contain transition-transform duration-100"
                    />
                    
                    {/* Zoom controls overlaid natively */}
                    <div className="absolute bottom-2.5 right-2.5 bg-[#1A1A1A]/80 text-white p-1 rounded-none border border-stone-600 flex items-center gap-1.5 backdrop-blur-[1px]">
                      <button 
                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                        className="p-1 hover:bg-stone-700 text-white"
                        title="Alejar"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[10px] font-mono px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
                      <button 
                        onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))}
                        className="p-1 hover:bg-stone-700 text-white"
                        title="Acercar"
                      >
                        <ZoomIn size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Extractor Action trigger */}
                <button
                  onClick={handleProcessWithGemini}
                  disabled={isProcessing}
                  className="w-full bg-[#1A1A1A] hover:bg-stone-800 disabled:bg-stone-200 text-white font-extrabold text-[10px] uppercase tracking-widest py-3.5 px-4 rounded-none border border-black shadow-none transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-purple-400" />
                      <span>PROCESANDO: {parseStatus.message}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-purple-400" />
                      <span>EXTRAER PEDIDO CON INTELIGENCIA ARTIFICIAL</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick interactive test drive panel */}
          <div className="bg-[#FAF9F6] border border-stone-250 p-5 space-y-3">
            <h4 className="text-2xs font-extrabold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
              <Sparkles size={11} className="text-purple-600" />
              💡 Probar Extracción de Demostración
            </h4>
            <p className="text-stone-500 text-[10px] leading-relaxed font-semibold">
              Si no tiene una foto real del taller en este dispositivo, haga clic en uno de nuestros ejemplos realistas para simular la carga y ver cómo la IA extrae la información:
            </p>
            <div className="flex flex-col gap-2 pt-1.5">
              {SAMPLE_MOCKED_ORDERS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDemoSample(sample)}
                  className="w-full text-left bg-white hover:bg-stone-50 p-3 border border-stone-200 text-stone-850 hover:border-black rounded-none transition flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-[10px] font-black uppercase text-stone-800 tracking-wider">
                    {sample.name}
                  </span>
                  <span className="text-stone-400 text-[9px] font-mono">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Editable spreadsheet-style grid showing extracted data fields */}
        <div id="grid-excel-section" className="lg:col-span-7 space-y-6">
          <div className="bg-white border-2 border-[#1A1A1A] p-6 space-y-6 min-h-[500px] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-stone-200 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
                  <FileSpreadsheet className="text-[#107c41]" size={18} />
                  PLANILLA INTERACTIVA (ESTILO EXCEL)
                </h3>
                <p className="text-stone-500 text-[10px] font-mono mt-0.5 uppercase tracking-wider">
                  Ordene, edite y defina la distribución de tallas del lote extraído por la IA.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-stone-100 text-stone-850 px-2.5 py-1.5 font-bold border border-stone-300">
                  LOTE N°: {generatedCode || 'GENERANDO...'}
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-400">
                <FileImage size={32} className="mb-2 text-stone-400 animate-pulse" />
                <span className="text-xs uppercase font-mono tracking-widest font-extrabold text-stone-800">Cargue un Documento</span>
                <p className="text-[10px] text-stone-500 max-w-xs mt-1 leading-relaxed">
                  Suba una imagen, boleta o use uno de los lotes de demostración de la izquierda para desplegar la grilla interactiva.
                </p>
              </div>
            ) : (
              /* Spreadsheet & Config layout form */
              <div className="space-y-6">
                
                {/* 1. Lote metadata controls */}
                <div className="bg-stone-50 p-4 border border-stone-200 space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest font-black text-stone-500 block">
                    ⚙️ CONFIGURACIÓN GENERAL DEL LOTE
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Modelo */}
                    <div>
                      <label className="block text-stone-600 text-[9px] font-bold mb-1 uppercase">Modelo Calzado</label>
                      <div className="relative">
                        <ShoppingBag className="absolute left-2.5 top-2.5 text-stone-400" size={12} />
                        <select
                          value={producto}
                          onChange={(e) => setProducto(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-none pl-8 pr-2 py-1.5 text-2xs font-extrabold text-stone-900 focus:border-black outline-none uppercase appearance-none cursor-pointer"
                        >
                          <option value="">- SELECCIONAR -</option>
                          {Object.keys(CATALOGO_REAL).sort().map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Vendedor */}
                    <div>
                      <label className="block text-stone-600 text-[9px] font-bold mb-1 uppercase">Involucrado / Vendedor</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 text-stone-400" size={12} />
                        <select
                          value={vendedor}
                          onChange={(e) => setVendedor(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-none pl-8 pr-2 py-1.5 text-2xs font-extrabold text-stone-900 focus:border-black outline-none appearance-none cursor-pointer"
                        >
                          <option value="—">— SIN COBRADOR / DIRECTO</option>
                          {VENDEDORES_SUGERIDOS.map(vendor => (
                            <option key={vendor} value={vendor}>{vendor.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Semana */}
                    <div>
                      <label className="block text-stone-600 text-[9px] font-bold mb-1 uppercase">Semana de Producción</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 text-stone-400" size={12} />
                        <input
                          type="number"
                          min={1}
                          max={53}
                          value={semana}
                          onChange={(e) => setSemana(Math.max(1, parseInt(e.target.value) || 12))}
                          className="w-full bg-white border border-stone-300 rounded-none pl-8 pr-2 py-1.5 text-2xs font-extrabold text-stone-900 focus:border-black outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Spreadsheet Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#107c41]/10 p-2 border border-[#107c41]/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-[#107c41] font-mono tracking-wider mr-2 uppercase">
                      🛠️ EXCEL TOOLS:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddNewColorRow}
                      className="bg-white hover:bg-stone-100 text-stone-800 text-[9px] font-bold uppercase tracking-wider border border-stone-300 px-2.5 py-1.5 transition flex items-center gap-1"
                      title="Añadir nueva fila de color a la planilla"
                    >
                      <Plus size={11} className="text-[#107c41]" />
                      Insertar Fila
                    </button>
                    <button
                      type="button"
                      onClick={handleSortByColor}
                      className="bg-white hover:bg-stone-100 text-stone-800 text-[9px] font-bold uppercase tracking-wider border border-stone-300 px-2.5 py-1.5 transition flex items-center gap-1"
                      title="Ordenar filas alfabéticamente por color"
                    >
                      <ArrowUpDown size={11} className="text-[#107c41]" />
                      Ordenar A-Z
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllCells}
                      className="bg-white hover:bg-red-50 text-red-700 text-[9px] font-bold uppercase tracking-wider border border-red-200 hover:border-red-300 px-2.5 py-1.5 transition flex items-center gap-1"
                      title="Reiniciar todas las celdas de tallas a cero"
                    >
                      Limpiar Hoja
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportToExcelFile}
                    className="bg-[#107c41] hover:bg-[#0c5e31] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 transition flex items-center gap-1"
                    title="Exportar esta planilla a un archivo de Excel real (.xlsx)"
                  >
                    <Download size={11} />
                    EXPORTAR A EXCEL (.XLSX)
                  </button>
                </div>

                {/* 3. The Interactive Excel Grid Canvas */}
                <div className="border border-stone-250 overflow-hidden bg-white">
                  <span className="bg-stone-100 border-b border-stone-250 text-stone-500 font-mono text-[8px] px-2 py-1 block uppercase font-bold tracking-widest text-center">
                    CUADRÍCULA DE TRABAJO - CONTROL DE TALLAJES BRIXTON
                  </span>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left font-mono text-2xs select-none">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-300">
                          {/* Row Indicator */}
                          <th className="w-8 border-r border-stone-250 bg-stone-100 text-center text-stone-400 font-bold p-1"></th>
                          
                          {/* Actions Col */}
                          <th className="w-12 border-r border-stone-200 bg-stone-50 text-stone-500 font-extrabold text-center px-1 py-1 text-[9px]">
                            ELIM
                          </th>
                          
                          {/* Color Col */}
                          <th className="min-w-[120px] border-r border-stone-200 bg-stone-50 text-stone-700 font-black p-1 text-[9px] uppercase tracking-wider">
                            COLOR (VARIANTE)
                          </th>

                          {/* Curves Quick Fill */}
                          <th className="min-w-[90px] border-r border-stone-200 bg-stone-50 text-stone-700 font-black text-center p-1 text-[9px] uppercase tracking-wider">
                            AUTO-CURVA (12P)
                          </th>

                          {/* Size Columns */}
                          {TALLAS_ESTANDAR.map(talla => (
                            <th key={talla} className="w-9 border-r border-stone-200 text-center text-stone-800 font-black px-0.5 py-1 bg-stone-100 text-[8px] uppercase tracking-tighter">
                              T{talla}
                            </th>
                          ))}

                          {/* Summation Row Totals */}
                          <th className="w-12 border-r border-stone-200 bg-stone-100/80 text-stone-900 font-black text-center p-1 text-[8px]">
                            PARES
                          </th>
                          <th className="w-12 bg-stone-100/80 text-stone-900 font-black text-center p-1 text-[8px]">
                            DOC.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {items.map((item, index) => {
                          const itemPairs = Object.values(item.tallas).reduce<number>((s, v) => s + (Number(v) || 0), 0);
                          const itemDozen = Math.round((itemPairs / 12) * 100) / 100;

                          return (
                            <tr key={item.id} className="hover:bg-yellow-50/40 transition-colors">
                              {/* Row numbering like Excel */}
                              <td className="border-r border-stone-250 bg-stone-100 text-[#1A1A1A] text-center font-bold font-mono py-1">
                                {index + 1}
                              </td>

                              {/* Remove row button */}
                              <td className="border-r border-stone-200 text-center py-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorRow(item.id)}
                                  className="text-stone-300 hover:text-red-600 transition p-1 hover:bg-stone-100"
                                  title="Quitar esta fila"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </td>

                              {/* Color selector/editor input cell */}
                              <td className="border-r border-stone-200 p-0.5 font-bold">
                                <input
                                  type="text"
                                  value={item.color}
                                  onChange={(e) => handleVariantColorChange(item.id, e.target.value.toUpperCase())}
                                  placeholder="Escriba Color..."
                                  className="w-full text-stone-900 text-[10px] font-sans font-extrabold uppercase px-1.5 py-1 bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-stone-500 outline-none"
                                />
                              </td>

                              {/* Automated Curva Quick-Fill buttons */}
                              <td className="border-r border-stone-200 p-0.5 text-center">
                                <div className="inline-flex flex-wrap gap-0.5 justify-center max-w-[130px]">
                                  <button
                                    type="button"
                                    onClick={() => handleApplyStandardCurva(item.id, 'juvenil')}
                                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-none uppercase transition"
                                    title="Pre-completar curva juvenil/damas de 12 pares (tallas centralizadas 34-39)"
                                  >
                                    Juv
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyStandardCurva(item.id, 'adulto')}
                                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-none uppercase transition"
                                    title="Pre-completar curva adultos/varones de 12 pares (tallas centralizadas 37-42)"
                                  >
                                    Adt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyStandardCurva(item.id, '35_38')}
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[7.5px] font-extrabold px-1 py-0.5 rounded-none uppercase transition"
                                    title="Pre-completar 1 docena (3 pares c/u) para talla 35-38"
                                  >
                                    35-38
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyStandardCurva(item.id, '39_42')}
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[7.5px] font-extrabold px-1 py-0.5 rounded-none uppercase transition"
                                    title="Pre-completar 1 docena (3 pares c/u) para talla 39-42"
                                  >
                                    39-42
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyStandardCurva(item.id, '37_40')}
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[7.5px] font-extrabold px-1 py-0.5 rounded-none uppercase transition"
                                    title="Pre-completar 1 docena (3 pares c/u) para talla 37-40"
                                  >
                                    37-40
                                  </button>
                                </div>
                              </td>

                              {/* Size input cells */}
                              {TALLAS_ESTANDAR.map(talla => (
                                <td key={talla} className="border-r border-stone-200 p-0 text-center z-10">
                                  <input
                                    type="text"
                                    placeholder="—"
                                    value={item.tallas[talla] || ''}
                                    onChange={(e) => handleTallaPairsChange(item.id, talla, e.target.value)}
                                    className="w-full text-center py-1 text-[11px] font-bold bg-transparent border-0 text-stone-900 focus:bg-yellow-100/60 focus:font-extrabold outline-none"
                                  />
                                </td>
                              ))}

                              {/* Sum row total */}
                              <td className="border-r border-stone-200 bg-stone-50 font-sans font-black text-center text-[10px] text-stone-800">
                                {itemPairs}
                              </td>
                              <td className="bg-stone-50 font-sans font-black text-center text-[10px] text-[#107c41]">
                                {itemDozen}
                              </td>
                            </tr>
                          );
                        })}

                        {/* SUM SHEET TOTALS (Excel Formulas representation) */}
                        <tr className="bg-[#107c41]/10 border-t-2 border-[#107c41] font-sans font-black text-stone-950">
                          <td className="border-r border-stone-250 bg-[#107c41]/15 text-center text-[8px] py-2 font-mono">
                            SUM
                          </td>
                          <td className="border-r border-stone-200" colSpan={2}>
                            <span className="text-[10px] uppercase font-black tracking-wider pl-2 text-[#107c41]">
                              TOTALES GENERALES
                            </span>
                          </td>
                          <td className="border-r border-stone-200 text-center text-[8px] text-[#107c41] font-mono uppercase">
                            fórmula
                          </td>
                          
                          {/* Column-wise sums for shoe sizes */}
                          {TALLAS_ESTANDAR.map(talla => {
                            const sumSize = items.reduce((sum, item) => sum + (Number(item.tallas[talla]) || 0), 0);
                            return (
                              <td key={talla} className="border-r border-stone-200 text-center font-mono text-[10px] font-black bg-stone-50 text-stone-950">
                                {sumSize > 0 ? sumSize : '—'}
                              </td>
                            );
                          })}

                          {/* Grand total values */}
                          <td className="border-r border-stone-200 bg-[#107c41]/15 text-center font-sans font-extrabold text-[11px] text-stone-900">
                            {totalParesLote}
                          </td>
                          <td className="bg-[#107c41]/15 text-center font-sans font-extrabold text-[11px] text-[#107c41]">
                            {totalDocenasLote}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Totals summary slate */}
                <div className="bg-[#1D1D1D] text-white p-4 flex justify-between items-center rounded-none font-sans">
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono font-semibold">Cómputo Consolidado</span>
                    <div className="text-xl font-black font-serif italic mt-0.5 text-yellow-400">
                      {totalDocenasLote} DOCENAS DE CALZADO
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono font-semibold">Pares totales (Fila SUM)</span>
                    <div className="font-mono text-sm font-extrabold text-stone-100">
                      {totalParesLote} Pares Registrados
                    </div>
                  </div>
                </div>

                {/* 5. Destino Router Routing Control Panel */}
                <div className="bg-[#FAF9F6] border-2 border-stone-300 p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-2">
                      <Layers size={14} className="text-purple-600" />
                      🎯 ¿A DÓNDE ADJUNTARÁ LA PLANILLA DE CALZADO EXTRAÍDA?
                    </h4>
                    <p className="text-stone-500 text-[10px] font-semibold mt-1">
                      Seleccione el destino definitivo. El sistema Brixton ingresará el volumen en su correspondiente modulo:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* 1. Pedidos */}
                    <button
                      type="button"
                      onClick={() => handleSaveWithCustomConfig('PEDIDO')}
                      className="bg-[#EEF2FF] hover:bg-indigo-100 text-indigo-900 border-2 border-indigo-250 p-3.5 text-left rounded-none transition flex flex-col gap-1 cursor-pointer w-full group"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1 group-hover:underline">
                        📥 ADJUNTAR A PEDIDOS (PD)
                      </span>
                      <span className="text-[10px] text-indigo-650 leading-snug font-medium font-mono">
                        Registra en la cartera general de preventas/pedidos de la semana para posterior despacho.
                      </span>
                    </button>

                    {/* 2. Producción */}
                    <button
                      type="button"
                      onClick={() => handleSaveWithCustomConfig('PRODUCCION')}
                      className="bg-[#FFFBEB] hover:bg-amber-100 text-amber-900 border-2 border-amber-250 p-3.5 text-left rounded-none transition flex flex-col gap-1 cursor-pointer w-full group"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1 group-hover:underline">
                        ⚙️ ADJUNTAR A PRODUCCIÓN (OP)
                      </span>
                      <span className="text-[10px] text-amber-650 leading-snug font-medium font-mono">
                        Se ingresa como una orden de taller activa para iniciar la fabricación, cortado y aparado física.
                      </span>
                    </button>

                    {/* 3. Stock */}
                    <button
                      type="button"
                      onClick={() => handleSaveWithCustomConfig('VENTA', 'STOCK TIENDA')}
                      className="bg-[#F0FDF4] hover:bg-emerald-100 text-[#137333] border-2 border-emerald-250 p-3.5 text-left rounded-none transition flex flex-col gap-1 cursor-pointer w-full group"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1 group-hover:underline">
                        📦 ADJUNTAR A STOCK TIENDA (ST)
                      </span>
                      <span className="text-[10px] text-emerald-700 leading-snug font-medium font-mono">
                        Registra como calzado terminado directo para cubrir el stock físico de exhibición en almacén.
                      </span>
                    </button>

                    {/* 4. Ventas */}
                    <button
                      type="button"
                      onClick={() => handleSaveWithCustomConfig('VENTA')}
                      className="bg-[#FFF5F5] hover:bg-rose-100 text-rose-950 border-2 border-rose-250 p-3.5 text-left rounded-none transition flex flex-col gap-1 cursor-pointer w-full group"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-850 flex items-center gap-1 group-hover:underline">
                        💰 ADJUNTAR A VENTAS DIRECTAS (VT)
                      </span>
                      <span className="text-[10px] text-rose-700 leading-snug font-medium font-mono">
                        Registra el lote como venta completada asignada al vendedor actual para comisiones de rendimiento.
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
