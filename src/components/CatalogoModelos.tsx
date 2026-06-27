import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Pedido } from '../types';
import { 
  Search, 
  Boxes, 
  Activity, 
  Layers, 
  Footprints,
  BookOpen,
  Tag,
  Sparkles,
  CheckCircle,
  Eye,
  Info,
  Printer,
  SlidersHorizontal,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  ArrowUpDown,
  Plus,
  LayoutGrid,
  List,
  Check,
  X,
  Filter
} from 'lucide-react';

interface CatalogoModelosProps {
  pedidos: Pedido[];
  onOpenPrintInstructions?: () => void;
  onSaveModelVariants?: (modelName: string, variants: CatalogEntry[]) => void;
}

export interface CatalogEntry {
  codigo: string;
  color: string;
  talla?: string;
  tipo?: string;
  linea?: string;
  suela?: string;
}

export const CATALOGO_REAL: Record<string, CatalogEntry[]> = {
  "ABSOLUTE": [
    {"codigo": "C24502101", "color": "VERDE MZ AZUL PLATA NG"},
    {"codigo": "C24502102", "color": "AZUL VERDE AGUA PLATA NG"},
    {"codigo": "C24502103", "color": "VERDE AGUA MORADO PLATA NG"},
    {"codigo": "C24502104", "color": "BLANCO CELESTE DORADO NG"},
    {"codigo": "C24502105", "color": "NEGRO DORADO PLATA"},
    {"codigo": "C24502106", "color": "NEGRO MORADO PLATA NRJ"},
    {"codigo": "C24502107", "color": "NEGRO DORADO ENTERO"},
    {"codigo": "D34501101", "color": "VERDE MZ AZUL PLATA NG"},
    {"codigo": "D34501102", "color": "AZUL VERDE AGUA PLATA NG"},
    {"codigo": "D34501103", "color": "VERDE AGUA MORADO PLATA"},
    {"codigo": "D34501104", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "D34501105", "color": "NEGRO DORADO PLATA"},
    {"codigo": "D34501106", "color": "NEGRO MORADO PLATA NRJ"},
    {"codigo": "C24502101", "color": "VERDE MZ AZUL PLATA NG"},
    {"codigo": "C24502102", "color": "AZUL VERDE AGUA PLATA NG"},
    {"codigo": "C24502103", "color": "VERDE AGUA MORADO PLATA NG"},
    {"codigo": "C24502104", "color": "BLANCO CELESTE DORADO NG"},
    {"codigo": "C24502105", "color": "NEGRO DORADO PLATA"},
    {"codigo": "C24502107", "color": "NEGRO DORADO ENTERO"}
  ],
  "ADVANCE": [
    {"codigo": "C32506101", "color": "BLANCO TURQUEZA NG"},
    {"codigo": "C32506102", "color": "TURQUEZA AM.LIMON NG"},
    {"codigo": "C32506103", "color": "NEGRO VERDE LIMON"},
    {"codigo": "C32506104", "color": "VERDE MZ AM. LIMON NG ASSASING EVA BL CAUCHO AM.LI"},
    {"codigo": "C32506105", "color": "BLANCO VERDE LIMON NG"},
    {"codigo": "C32506106", "color": "NRJ NARANJA NEON NG"},
    {"codigo": "C32506107", "color": "NEGRO NARANJA PLATA"},
    {"codigo": "C32506108", "color": "CHICLE VERDE MZ ASSASING EVA BL CAUCHO CHICLE"},
    {"codigo": "D32502101", "color": "BLANCO TURQUEZA NG                                 -"},
    {"codigo": "D32502102", "color": "TURQUEZA AM. LIMON NG"},
    {"codigo": "D32502103", "color": "NEGRO VERDE LIMON"},
    {"codigo": "D32502104", "color": "VERDE MZ AM. LIMON NG"},
    {"codigo": "D32502105", "color": "BLANCO VERDE LIMON NG"},
    {"codigo": "D32502106", "color": "NRJ NARANJA NEON"},
    {"codigo": "D32502107", "color": "NEGRO NARANJA PLATA"},
    {"codigo": "D32502108", "color": "CHICLE VERDE MZ"},
    {"codigo": "J32502101", "color": "BLANCO TURQUEZA NG ASSASING EVABL CAUCHO TURQUEZA"},
    {"codigo": "J32502102", "color": "TURQUEZA AM.LIMON NG ASSASING EVABL CAUCHO AM.LIMO"},
    {"codigo": "J32502103", "color": "NEGRO VERDE LIMON ASSASING EVA BL CAUCHO VERDE LIM"},
    {"codigo": "J32502104", "color": "VERDE MZ AM. LIMON NG ASSASING EVA BL CAUCHO AM.LI"},
    {"codigo": "J32502105", "color": "BLANCO VERDE LIMON NG ASSASING EVA BL CAUCHO VRD L"},
    {"codigo": "J32502106", "color": "NRJ NARANJA NEON NG ASSASING EVA BL CAUCHO NRJ"},
    {"codigo": "J32502107", "color": "NEGRO NARANJA PLATA ASSASING EVA BL CAUCHO NEGRO"},
    {"codigo": "J32502108", "color": "CHICLE VERDE MZ ASSASING EVA BL CAUCHO CHICLE"},
    {"codigo": "E32506108", "color": "CHICLE VERDE MZ ASSASING EVA BL CAUCHO CHICLE"},
    {"codigo": "S32506101", "color": "BLANCO TURQUEZA NG ASSASING EVABL CAUCHO TURQUEZA"},
    {"codigo": "S32506102", "color": "TURQUEZA AM.LIMON NG ASSASING EVABL CAUCHO AM.LIMO"},
    {"codigo": "S32506103", "color": "NEGRO VERDE LIMON ASSASING EVA BL CAUCHO VERDE LIM"},
    {"codigo": "S32506104", "color": "VERDE MZ AM. LIMON NG ASSASING EVA BL CAUCHO AM.LI"},
    {"codigo": "S32506105", "color": "BLANCO VERDE LIMON NG ASSASING EVA BL CAUCHO VRD L"},
    {"codigo": "S32506106", "color": "NRJ NARANJA NEON NG ASSASING EVA BL CAUCHO NRJ"},
    {"codigo": "S32506107", "color": "NEGRO NARANJA PLATA ASSASING EVA BL CAUCHO NEGRO"}
  ],
  "AIR ZOOM": [
    {"codigo": "J32502107", "color": "NEGRO NARANJA PLATA ASSASING EVA BL CAUCHO NEGRO"},
    {"codigo": "C32503109", "color": "CHICLE VERDE MZ ASSASING EVA BL CAUCHO CHICLE"},
    {"codigo": "C32503105", "color": "AZULINO NEGRO CELESTE"},
    {"codigo": "C32503103", "color": "NEGRO BLANCO AMARILLO LIMON"},
    {"codigo": "C32503102", "color": "NEGRO VERDE A. AMARILLO LIMON"},
    {"codigo": "C32503108", "color": "BLANCO NEGRO AM.LIMON"},
    {"codigo": "C32503104", "color": "AMARILLO LIMON  VERDE"},
    {"codigo": "C32503101", "color": "AMARILLO LIMON NEGRO"},
    {"codigo": "D22506105", "color": "AZULINO NEGRO CELESTE"},
    {"codigo": "D22506101", "color": "AMARILLO LIMON NEGRO PLATA"},
    {"codigo": "D22506104", "color": "AMARILLO LIMON  VERDE"},
    {"codigo": "D22506102", "color": "NEGRO VERDE A. AMARILLO LIMON"},
    {"codigo": "D22506108", "color": "BLANCO CELESTE AZULINO"},
    {"codigo": "D22506107", "color": "BLANCO NEGRO AM.LIMON"},
    {"codigo": "D22506106", "color": "VERDE AGUA NG AM.LIMON"},
    {"codigo": "D22506103", "color": "NEGRO BLANCO AMARILLO LIMON"}
  ],
  "AIR ZOOM VAPOR 19": [
    {"codigo": "C22519101", "color": "NEGRO DORADO"},
    {"codigo": "C22519104", "color": "BLANCO CELESTE AM. LIMON"},
    {"codigo": "C22519105", "color": "NEGRO AM. LIMON TURQUEZA"},
    {"codigo": "C22519103", "color": "VERDE AGUA AM. LIMON"},
    {"codigo": "C22519102", "color": "AM.LIMON VERDE LILA"}
  ],
  "B60": [
    {"codigo": "D22505101", "color": "AMARILLO LIMON AZUL NRJ"},
    {"codigo": "D22505102", "color": "BLANCO AZUL NRJ"},
    {"codigo": "D22505103", "color": "VERDE AGUA AZUL NRJ"},
    {"codigo": "D22505104", "color": "NARANJA NEON NRJ FUCSIA"},
    {"codigo": "D22505105", "color": "AZULINO CELESTE AMARILLO LIMON"},
    {"codigo": "D22505106", "color": "NEGRO CELESTE AMARILLO LIMON"},
    {"codigo": "D22505107", "color": "NEGRO DORADO PLATA"},
    {"codigo": "J12504101", "color": "AMARILLO LIMON AZUL NRJ"},
    {"codigo": "J12504102", "color": "BLANCO AZUL NRJ"},
    {"codigo": "J12504103", "color": "VERDE AGUA AZUL NRJ"},
    {"codigo": "J12504104", "color": "NARANJA NEON NRJ FUCSIA"},
    {"codigo": "J12504105", "color": "AZULINO CELESTE AMARILLO LIMON"},
    {"codigo": "J12504106", "color": "NEGRO CELESTE AMARILLO LIMON"},
    {"codigo": "J12504107", "color": "NEGRO DORADO PLATA"}
  ],
  "BENOM 2026": [
    {"codigo": "C22522101", "color": "LILA VERDE LIMON"},
    {"codigo": "C22522102", "color": "BLANCO CELESTE"},
    {"codigo": "C22522103", "color": "BLANCO NEGRO"},
    {"codigo": "C22522104", "color": "VERDE PASTEL LIMON"},
    {"codigo": "C22522105", "color": "TURQUESA AMARILLO"}
  ],
  "BR6": [
    {"codigo": "D24503103", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "D24503104", "color": "CHICLE LILA"},
    {"codigo": "D24503105", "color": "ROSADO CHICLE"},
    {"codigo": "D24503102", "color": "NEGRO PLATA"},
    {"codigo": "D24503106", "color": "MORADO CHICLE ELITE"}
  ],
  "BR6 BOTIN": [
    {"codigo": "C22518101", "color": "AM. LIMON AZULINO NRJ"},
    {"codigo": "C22518102", "color": "NEGRO DORADO PLATA"},
    {"codigo": "C22518103", "color": "AZULINO CLARO AM. LIMON"},
    {"codigo": "C22518104", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "C22518105", "color": "BLANCO ROSADO FUCSIA"}
  ],
  "BR6 CHIMPUN": [
    {"codigo": "C33901101", "color": "AMARILL LIMON AZUL NRJ"},
    {"codigo": "C33901102", "color": "BLANCO AZUL NRJ"},
    {"codigo": "C33901103", "color": "VERDE AGUA AZUL NRJ"},
    {"codigo": "C33901104", "color": "AZUL TURQUEZA"},
    {"codigo": "C33901105", "color": "NEGRO CELESTE AM.LIMON"},
    {"codigo": "C33901106", "color": "NEGRO DORADO PLATA"}
  ],
  "BR6 PRINT": [
    {"codigo": "D24503101", "color": "NEGRO DORADO"},
    {"codigo": "D24503102", "color": "NEGRO PLATA"},
    {"codigo": "D24503103", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "D24503104", "color": "CHICLE LILA"},
    {"codigo": "D24503105", "color": "ROSADO CHICLE"},
    {"codigo": "D24503106", "color": "MORADO CHICLE"},
    {"codigo": "J24501101", "color": "NEGRO DORADO EVA BLANCO"},
    {"codigo": "J24501102", "color": "NEGRO PLATA"},
    {"codigo": "J24501103", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "J24501104", "color": "CHICLE LILA"},
    {"codigo": "J24501105", "color": "ROSADO CHICLE"},
    {"codigo": "J24501106", "color": "MORADO CHICLE"},
    {"codigo": "E34504101", "color": "NEGRO DORADO"},
    {"codigo": "E34504102", "color": "NEGRO PLATA"},
    {"codigo": "E34504103", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "E34504105", "color": "CHICLE LILA"},
    {"codigo": "E34504106", "color": "ROSADO CHICLE"},
    {"codigo": "C34504103", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "C34504104", "color": "CHICLE LILA"},
    {"codigo": "C34504105", "color": "ROSADO CHICLE"},
    {"codigo": "C34504106", "color": "MORADO CHICLE"}
  ],
  "BR6 PRINT 03": [
    {"codigo": "D24503101", "color": "NEGRO DORADO"}
  ],
  "BR6 PRINT SIN PASADOR": [
    {"codigo": "C24503101", "color": "NEGRO DORADO"},
    {"codigo": "C24503102", "color": "NEGRO PLATA"},
    {"codigo": "C24503103", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "C24503105", "color": "ROSADO CHICLE"},
    {"codigo": "C24503106", "color": "MORADO CHICLE"}
  ],
  "CONFORT": [
    {"codigo": "D14602101", "color": "CELESTE BLANCO"},
    {"codigo": "D14602102", "color": "NEGRO BLANCO"},
    {"codigo": "D14602103", "color": "NEGRO BLANCO"},
    {"codigo": "D14602104", "color": "VERDE AGUA"},
    {"codigo": "D14602105", "color": "ROSADO BLANCO"},
    {"codigo": "D14602106", "color": "NUDE BLANCO"},
    {"codigo": "D14602107", "color": "VIOLETA BLANCO"},
    {"codigo": "D14602108", "color": "VIOLETA BLANCO"},
    {"codigo": "D14602109", "color": "PLATA AZUL MARINO BLANCO"},
    {"codigo": "D14602110", "color": "PLATA VERDE JADE"}
  ],
  "FORCE  - FAST ASSAZING": [
    {"codigo": "C22520101", "color": "BL CELESTE VERDE"},
    {"codigo": "C22520102", "color": "NEGRO NRJ"},
    {"codigo": "C22520103", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "C22520104", "color": "AZUL CELESTE"},
    {"codigo": "C22520105", "color": "AMARILLO LIMON"},
    {"codigo": "C22520106", "color": "NEGRO PLATA"},
    {"codigo": "C22520107", "color": "NEGRO ENTERO"},
    {"codigo": "C22520108", "color": "TURQUESA CLARO CELESTE"},
    {"codigo": "C22520109", "color": "NEGRO DORADO"},
    {"codigo": "C22520111", "color": "VERDE PASTEL"},
    {"codigo": "C22520113", "color": "VERDE PASTEL CHICLE"}
  ],
  "FORCE  - FAST -CHINPUM": [
    {"codigo": "C23901101", "color": "BL CELESTE VERDE"},
    {"codigo": "C23901102", "color": "NEGRO NRJ"},
    {"codigo": "C23901103", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "C23901104", "color": "AZUL CELESTE"},
    {"codigo": "C23901105", "color": "AMARILLO LIMON"},
    {"codigo": "C23901106", "color": "NEGRO PLATA"},
    {"codigo": "C23901107", "color": "NEGRO ENTERO"},
    {"codigo": "C23901108", "color": "NEGRO DORADO"},
    {"codigo": "C23901109", "color": "VERDE PASTEL"},
    {"codigo": "C23901110", "color": "TURQUESA CELESTE"}
  ],
  "FORCE FAST  (SUELA ANTIGUA )": [
    {"codigo": "C22520101", "color": "BLANCO CELESTE VERDE"},
    {"codigo": "C22520102", "color": "NEGRO NRJ   SUELA ANTIGUA EVA BLANCO  CAUCHO NEGRO"},
    {"codigo": "C22520103", "color": "BLANCO NEGRO SUELA ANTIGUA EVA BLANCO  CAUCHO NEGRO"},
    {"codigo": "C22520104", "color": "AZUL CELESTE SUELA ANTIGUA EVA BLANCO  CAUCHO AZU"},
    {"codigo": "C22520105", "color": "VERDE LIMON SUELA ANTIGUA EVA BLANCO  CAUCHO NEGRO"},
    {"codigo": "C22520106", "color": "NEGRO PLATA ANTIGUO EVA NEGRO CAUCHO NEGRO"},
    {"codigo": "C22520107", "color": "NEGRO ENTERO SUELA ANTIGUA EVA NEGRO  CAUCHO NEGRO"},
    {"codigo": "C22520108", "color": "VERDE PASTEL CHICLE SUELA ANTIGUA EVA BLANCO  CAUCHO VERDE PASTEL"},
    {"codigo": "C22520109", "color": "TURQUESA CELESTE SUELA ANTIGUA EVA BLANCO  CAUCHO TURQUESA"},
    {"codigo": "C22520110", "color": "NEGRO DORADO  SUELA ANTIGUA EVA NEGRO  CAUCHO NEGRO"},
    {"codigo": "C22520111", "color": "VERDE PASTEL  SUELA ANTIGUA EVA BLANCO  CAUCHO VERDE PASTEL"},
    {"codigo": "C22520112", "color": "AZUL CLARO CELESTE AM LIMON"}
  ],
  "FORCE FAST ELITE": [
    {"codigo": "C24504113", "color": "BLANCO CELESTE VERDE MZ"},
    {"codigo": "C24504111", "color": "VERDE PASTEL NG"},
    {"codigo": "C24504103", "color": "NEGRO NARANJA"},
    {"codigo": "C24504104", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "C24504105", "color": "AZUL CELESTE DORADO"},
    {"codigo": "C24504106", "color": "AMARILLO LIMON NEGRO"},
    {"codigo": "C24504107", "color": "NEGRO PLATA"},
    {"codigo": "C24504108", "color": "NEGRO ENTERO"},
    {"codigo": "C24504109", "color": "VERDE PAST CHICLE"},
    {"codigo": "C24504110", "color": "TURQUESA CELESTE"},
    {"codigo": "C24504111", "color": "NEGRO DORADO"}
  ],
  "FORCE ONE": [
    {"codigo": "D12602101", "color": "BLANCO PLATA"},
    {"codigo": "D12602102", "color": "NEGRO"},
    {"codigo": "D12602103", "color": "BLANCO"},
    {"codigo": "J12602101", "color": "BLANCO PLATA"},
    {"codigo": "J12602102", "color": "NEGRO"},
    {"codigo": "J12602103", "color": "BLANCO"}
  ],
  "KILLER 2026": [
    {"codigo": "C22524101", "color": "AMARILLO FOSF. LILA NG"},
    {"codigo": "C22524102", "color": "BLANCO AZUL CHICLE"},
    {"codigo": "C22524103", "color": "ROJO NG AMARILLO"},
    {"codigo": "C22524104", "color": "NEGRO AMARILLO"},
    {"codigo": "C22524105", "color": "TURQUESA AMARILLO NG"},
    {"codigo": "C22524106", "color": "AMARILLO LIMON CHICLE"},
    {"codigo": "C22524107", "color": "VERDE PASTEL NG"},
    {"codigo": "C22524108", "color": "LILA VERDE NEGRO"},
    {"codigo": "C22524109", "color": "CHICLE NEGRO"},
    {"codigo": "C22524110", "color": "VERDE LIMON NEGRO"},
    {"codigo": "C22524111", "color": "BLANCO AMARILLO NG"}
  ],
  "LION": [
    {"codigo": "C12502101", "color": "BLANCO CELESTE"},
    {"codigo": "C12502102", "color": "AMARILLO LIMON VERDE"},
    {"codigo": "C12502103", "color": "VERDE AGUA NARANJA"},
    {"codigo": "C12502104", "color": "BLANCO AMARILLO LIMON"},
    {"codigo": "C12502105", "color": ""},
    {"codigo": "C12502106", "color": ""},
    {"codigo": "C12502107", "color": ""},
    {"codigo": "C12502108", "color": "NEGRO CELESTE AMARILLO LIMON"},
    {"codigo": "D12504101", "color": ""},
    {"codigo": "D12504102", "color": ""},
    {"codigo": "D12504103", "color": ""},
    {"codigo": "C32508110", "color": "NEGRO ENTERO"}
  ],
  "MASTER": [
    {"codigo": "C92520101", "color": "NEGRO"},
    {"codigo": "C92520102", "color": "NEGRO PLATA"},
    {"codigo": "C92520103", "color": "BLANCO"},
    {"codigo": "C92520104", "color": "AZULINO PLATA NV"},
    {"codigo": "C92520105", "color": "ROJO NEGRO PLATA"},
    {"codigo": "C92520106", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "D92520101", "color": "NEGRO"},
    {"codigo": "D92520102", "color": "NEGRO PLATA"},
    {"codigo": "D92520104", "color": "BLANCO"},
    {"codigo": "E92520101", "color": "NEGRO PLATA"}
  ],
  "NEW BR6 02": [
    {"codigo": "C34502101", "color": "BLANCO AZULINO NRJ/AM"},
    {"codigo": "C34502102", "color": "AMARILLO PATO AZULINO/NRJ"},
    {"codigo": "C34502103", "color": "VERDE AGUA AZUL/NRJ/AM"},
    {"codigo": "C34502104", "color": "TURQUESA AMARILLO LIMON"},
    {"codigo": "C34502105", "color": "VERDE MZ CLARO MORADO"},
    {"codigo": "C34502106", "color": "AM.LIMON MORADO"},
    {"codigo": "D24501101", "color": "BLANCO AZULINO NRJ/AM"},
    {"codigo": "D24501102", "color": "AMARILLO PATO AZULINO/NRJ"},
    {"codigo": "D24501103", "color": "VERDE AGUA AZUL/NRJ/AM"},
    {"codigo": "D24501104", "color": "TURQUESA AMARILLO LIM"},
    {"codigo": "D24501105", "color": "VERDE MZ CLARO MORADO/AM"},
    {"codigo": "D24501106", "color": "AM.LIMON MORADO"},
    {"codigo": "D24501107", "color": "LILA VERDE MZ AM.LIM"},
    {"codigo": "D24501108", "color": "NEGRO AM.LIM NRJ/AZUL"},
    {"codigo": "D24501109", "color": "NEGRO TURQUESA AM.L"},
    {"codigo": "D24501110", "color": "MORADO VERDE MZ"},
    {"codigo": "D24501111", "color": "NEGRO DORADO"},
    {"codigo": "D24501112", "color": "NEGRO PLATA"},
    {"codigo": "D24501113", "color": "NEGRO ENTERO"},
    {"codigo": "E34502101", "color": "BLANCO AZULINO"},
    {"codigo": "E34502102", "color": "AMARILLO PATO"},
    {"codigo": "E34502103", "color": "VERDE AGUA AZUL"},
    {"codigo": "E34502104", "color": "TURQUESA AMARILLO"},
    {"codigo": "E34502105", "color": "VERDE MZ CLARO"},
    {"codigo": "E34502106", "color": "AM LIMON  MORADO"},
    {"codigo": "E34502107", "color": "LILA VERDE MZ AM"},
    {"codigo": "E34502108", "color": "NEGRO AM LIMON"},
    {"codigo": "E34502109", "color": "NEGRO TURQUEZA"},
    {"codigo": "E34502110", "color": "MORADO VERDE MZ"},
    {"codigo": "E34502111", "color": "NEGRO PLATA"},
    {"codigo": "E34502112", "color": "NEGRO DORADO"},
    {"codigo": "C34502107", "color": "LILA VERDE MZ AM"},
    {"codigo": "C34502108", "color": "NEGRO AM LIMON NRJ/ AZUL"},
    {"codigo": "C34502109", "color": "NEGRO TURQUEZA AM. L"},
    {"codigo": "C34502110", "color": "MORADO VERDE MZ BL ELITE"},
    {"codigo": "C34502111", "color": "NEGRO PLATA"},
    {"codigo": "C34502112", "color": "NEGRO DORADO"},
    {"codigo": "C34502113", "color": "NEGRO ENTERO"}
  ],
  "NEW FLEX": [
    {"codigo": "C32505101", "color": "AMARILLO LIMON NG"},
    {"codigo": "C32505102", "color": "NRJ FOSFORECENTE NG"},
    {"codigo": "C32505103", "color": "VERDE MZ NG"},
    {"codigo": "C32505104", "color": "VERDE AGUA NG"},
    {"codigo": "C32505106", "color": "AZULINO CLARO"},
    {"codigo": "C32505107", "color": "ROSADO NG"},
    {"codigo": "C32505108", "color": "ROJO NEGRO"},
    {"codigo": "D22507101", "color": "AMARILLO LIMON NEGRO"},
    {"codigo": "D22507102", "color": "NRJ FOSFORECENTE NEGR"},
    {"codigo": "D22507103", "color": "VERDE MZ NEGRO"},
    {"codigo": "D22507104", "color": "VERDE AGUA BLANCO"},
    {"codigo": "D22507107", "color": "ROSADO NEGRO"},
    {"codigo": "D22507108", "color": "ROJO NEGRO"},
    {"codigo": "D22507109", "color": "BLANCO NEGRO CELESTE"},
    {"codigo": "D22507110", "color": "NEGRO BLANCO"},
    {"codigo": "D22507111", "color": "AZULINO OSCURO NG"},
    {"codigo": "D22507112", "color": "BLANCO ROSADO"},
    {"codigo": "D22507113", "color": "NEGRO BL CHICLE"},
    {"codigo": "D22507114", "color": "AZUL MARINO AM.LIMON"},
    {"codigo": "D22507117", "color": "ROSADO OSCURO"},
    {"codigo": "J22504101", "color": "AMARILLO LIMON NEGRO"},
    {"codigo": "J22504102", "color": "NRJ FOSFORECENTE NEGR"},
    {"codigo": "J22504103", "color": "VERDE MZ NEGRO"},
    {"codigo": "J22504104", "color": "VERDE AGUA BLANCO"},
    {"codigo": "J22504107", "color": "ROSADO NEGRO"},
    {"codigo": "J22504108", "color": "ROJO NEGRO"},
    {"codigo": "J22504109", "color": "BLANCO NEGRO CELESTE"},
    {"codigo": "J22504110", "color": "NEGRO BLANCO"},
    {"codigo": "J22504111", "color": "AZULINO OSCURO"},
    {"codigo": "J22504112", "color": "BLANCO ROSADO"},
    {"codigo": "J22504113", "color": "NEGRO BL FUCSIA"},
    {"codigo": "J22504114", "color": "AZUL MARINO AM.LIMON"},
    {"codigo": "C32505109", "color": "BLANCO NG CELESTE"},
    {"codigo": "J22504115", "color": "ROSADO OSCURO"},
    {"codigo": "S32505110", "color": "NEGRO BLANCO"},
    {"codigo": "C32505110", "color": "NEGRO BLANCO"},
    {"codigo": "C32505111", "color": "AZULINO OSCURO"},
    {"codigo": "C32505112", "color": "BLANCO ROSADO"},
    {"codigo": "C32505113", "color": "NEGRO FUCSIA"},
    {"codigo": "C32505114", "color": "AZUL MARINO AM.LIMON"}
  ],
  "NEW FLEX CHIMPUN": [
    {"codigo": "D33902101", "color": "AMARILLO LIMON NEGRO"},
    {"codigo": "D33902104", "color": "VERDE AGUA BLANCO"},
    {"codigo": "D33902105", "color": "ROSADO NEGRO"},
    {"codigo": "D33902106", "color": "ROJO NEGRO"},
    {"codigo": "D33902107", "color": "BLANCO NEGRO CELESTE"},
    {"codigo": "D33902108", "color": "NEGRO BLANCO"},
    {"codigo": "D33902109", "color": "AZULINO OSCURO NG"},
    {"codigo": "D33902110", "color": "BLANCO ROSADO"},
    {"codigo": "D33902111", "color": "NEGRO BL CHICLE"}
  ],
  "PANTHER 03": [
    {"codigo": "J32503101", "color": "BLANCO CELESTE DORADO                     -                       EVA BL CAUCHO CELESTE"},
    {"codigo": "J32503102", "color": "BLANCO AZULINO AM.LIM                          -                            EVA BL CAUCHO AZULINO"},
    {"codigo": "J32503103", "color": "BLANCO NRJ ROJO                          -                                EVA BL CAUCHO ROJO"},
    {"codigo": "J32503104", "color": "NEGRO CELESTE NRJ                                -                  EVA BL CAUCHO NEGRO"},
    {"codigo": "J32503105", "color": "AZULINO AM.LIMON CHICLE                       -                          EVA BL CAUCHO AM.LIMON"},
    {"codigo": "J32503106", "color": "NUDE CHICLE NEGRO                      -                           EVA BL CAUCHO CHICLE"},
    {"codigo": "J32503107", "color": "NEGRO RATA AZUL MARINO                         -                          EVA BL CAUCHO AZUL MARINO"},
    {"codigo": "J32503108", "color": "VERDE MZ LILA NEGRO                   -                       EVA BL CAUCHO LILA"},
    {"codigo": "J32503109", "color": "VERDE MZ MORADO NEGRO            -                             EVA BL CAUCHO MORADO"},
    {"codigo": "J32503110", "color": "NEGRO DORADO               -                             EVA ASSASING BLANCO CAUCHO NEGRO-DOR"},
    {"codigo": "C24501101", "color": "BLANCO CELESTE  DORADO"},
    {"codigo": "C24501102", "color": "BLANCO AZULINO AM.LIMON"},
    {"codigo": "C24501103", "color": "BLANCO NRJ ROJO"},
    {"codigo": "C24501104", "color": "NEGRO CELESTE NRJ"},
    {"codigo": "C24501105", "color": "AZULINO AM.LIMON NRJ"},
    {"codigo": "C24501106", "color": "NUDE CHICLE NEGRO"},
    {"codigo": "C24501107", "color": "NEGRO RATA AZUL MARINO"},
    {"codigo": "C24501108", "color": "VERDE MZ LILA NEGRO"},
    {"codigo": "D24502101", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "D24502102", "color": "BLANCO AZULINO AM.LIMON"},
    {"codigo": "D24502103", "color": "BLANCO NRJ ROJO"},
    {"codigo": "D24502104", "color": "NEGRO CELESTE NRJ"},
    {"codigo": "C24501109", "color": "VERDE MZ MORADO NEGRO"},
    {"codigo": "D24502105", "color": "AZULINO AM.LIMON"},
    {"codigo": "D24502106", "color": "NUDE CHICLE NEGRO"},
    {"codigo": "D24502107", "color": "NEGRO RATA AZUL MARINO"},
    {"codigo": "D24502108", "color": "VERDE MZ LILA NEGRO"},
    {"codigo": "D24502109", "color": "VERDE MZ MORADO NEGRO"},
    {"codigo": "D24502110", "color": "NEGRO DORADO"},
    {"codigo": "E24501101", "color": "BLANCO CELESTE"},
    {"codigo": "E24501102", "color": "BLANCO AZULINO AM LIMON"},
    {"codigo": "E24501103", "color": "BLANCO NRJ ROJO"},
    {"codigo": "E24501104", "color": "NEGRO CELESTE"},
    {"codigo": "E24501106", "color": "NUDE CHICLE NEGRO"},
    {"codigo": "E24501107", "color": "NEGRO RATA AZUL MARINO"},
    {"codigo": "E24501108", "color": "VERDE MZ LILA NEGRO"},
    {"codigo": "E24501109", "color": "VERDE MZ MORADO NEGRO"},
    {"codigo": "C24501111", "color": "NEGRO DORADO"}
  ],
  "POWER FORCE": [
    {"codigo": "C22511104", "color": "AZULINO CELESTE"},
    {"codigo": "C22511105", "color": "VERDE AGUA AMARILLO LIMON"},
    {"codigo": "C22511106", "color": "AZULINO CHICLE"},
    {"codigo": "C22511107", "color": "AMARILLO LIMON CLICLE"},
    {"codigo": "C22511108", "color": "AMARILLO LIMON VERDE MANZANA"},
    {"codigo": "C22511110", "color": "NEGRO VERDE AGUA"},
    {"codigo": "C22511111", "color": "NEGRO AMARILLO LIMON"},
    {"codigo": "C22511113", "color": "ROJO BLANCO"},
    {"codigo": "C22511114", "color": "NARANJA NEON NEGRO"},
    {"codigo": "C22511115", "color": "NARANJA NEON BLANCO"},
    {"codigo": "D12503101", "color": "BLANCO NRJ"},
    {"codigo": "D12503102", "color": "CHICLE AMARILLO LIMON"},
    {"codigo": "D12503103", "color": "BLANCO AMARILLO LIMON"},
    {"codigo": "D12503104", "color": "AZULINO CELESTE"},
    {"codigo": "D12503105", "color": "VERDE AGUA AMARILLO LIMON"},
    {"codigo": "D12503106", "color": "AZULINO CHICLE"},
    {"codigo": "D12503107", "color": "AMARILLO LIMON CLICLE"},
    {"codigo": "D12503108", "color": "AMARILLO LIMON VERDE MANZANA"},
    {"codigo": "D12503110", "color": "NEGRO VERDE AGUA"},
    {"codigo": "D12503111", "color": "NEGRO AMARILLO LIMON"},
    {"codigo": "D12503112", "color": "ROJO BLANCO"},
    {"codigo": "D12503113", "color": "ROJO BLANCO"},
    {"codigo": "D12503114", "color": "NARANJA NEON NEGRO"},
    {"codigo": "D12503115", "color": "NARANJA NEON BLANCO"}
  ],
  "PRECISION  (SUELA ANTIGUA )": [
    {"codigo": "D22509101", "color": "ROJO BLANCO NEGRO"},
    {"codigo": "D22509102", "color": "NEGRO BLANCO PLLOMO"},
    {"codigo": "D22509103", "color": "TURQUESA CLARO CELEC. AM L"},
    {"codigo": "D22509104", "color": "LILA PASTEL  VERDE MZ"},
    {"codigo": "D22509105", "color": "BLANCO DORADO CELESTE"},
    {"codigo": "D22509106", "color": "BLANCO DORADO NEGRO"},
    {"codigo": "D22509107", "color": "VERDE MZ CLARO TURQUESA CLARO"},
    {"codigo": "D22509108", "color": "NRJ AZUL CHICLE"},
    {"codigo": "C22521101", "color": "ROJO BLANCO NEGRO"},
    {"codigo": "C22521102", "color": "NEGRO BLANCO PLLOMO"},
    {"codigo": "C22521103", "color": "TURQUESA CLARO CELEC. AM L"},
    {"codigo": "C22521104", "color": "LILA PASTEL  VERDE MZ"},
    {"codigo": "C22521105", "color": "BLANCO DORADO CELESTE"},
    {"codigo": "C22521106", "color": "BLANCO DORADO NEGRO"},
    {"codigo": "C22521107", "color": "VERDE MZ CLARO TURQUESA CLARO"},
    {"codigo": "C22521108", "color": "NRJ AZUL CHICLE"}
  ],
  "PRECISION CHIMPUN": [
    {"codigo": "C23902101", "color": "ROJO BLANCO NEGRO"},
    {"codigo": "C23902102", "color": "NEGRO BLANCO PLOMO"},
    {"codigo": "C23902103", "color": "TURQUESA CLARO CELEC. AM L"},
    {"codigo": "C23902104", "color": "LILA PASTEL  VERDE MZ."},
    {"codigo": "C23902105", "color": "BLANCO DORADO CELESTE"},
    {"codigo": "C23902106", "color": "BLANCO DORADO NEGRO"},
    {"codigo": "C23902107", "color": "VERDE MZ CLARO TURQUESA CLAR"},
    {"codigo": "C23902108", "color": "NRJ AZUL CHICLE"}
  ],
  "RUNNING MESH RAM 01": [
    {"codigo": "D34601110", "color": "PLATA NARANJA     BX801                   LUMINOSO"},
    {"codigo": "D34601111", "color": "BLANCO ROSADO BX801     LUMINOSO"},
    {"codigo": "D34601112", "color": "NEGRO RATA                BX801                       LUMINOSO                           EVA BLANCO"},
    {"codigo": "D34601113", "color": "NEGRO ROSADO BX801      LUMINOSO"},
    {"codigo": "D34601114", "color": "NEGRO VERDE                   BX801                     LUMINOSO"},
    {"codigo": "D34601115", "color": "NEGRO RATA                BX801     LUMINOSO               EVA NEGRO"},
    {"codigo": "D34601116", "color": "BLANCO CEELSTE BX801                      LUMINOSO"}
  ],
  "STRIKE": [
    {"codigo": "D14601102", "color": "NUDE BLANCO"},
    {"codigo": "D14601103", "color": "CELESTE BLANCO"},
    {"codigo": "D14601104", "color": "LILA BLANCO"},
    {"codigo": "D14601105", "color": "VERDE AGUA BLANCO"},
    {"codigo": "D14601106", "color": "NEGRO BLANCO"},
    {"codigo": "D14601107", "color": "PLOMO RATA BLANCO"},
    {"codigo": "D14601108", "color": "ROSADO BLANCO"},
    {"codigo": "D14601109", "color": "NEGRO BLANCO PLATA"},
    {"codigo": "D14601110", "color": "NEGRO ROJO"},
    {"codigo": "D14601111", "color": "VIOLETA PASTEL PLATA"},
    {"codigo": "D14601112", "color": "VIOLETA PASTEL"},
    {"codigo": "D14601113", "color": "NEGRO AMARILLO"},
    {"codigo": "D14601114", "color": "NEGRO LILA NUDE"},
    {"codigo": "D14601115", "color": "PLATA LILA NUDE"},
    {"codigo": "D14601116", "color": "PLATA NEGRO"},
    {"codigo": "D14601117", "color": "NEGRO NUDE CELESTE"},
    {"codigo": "J14601101", "color": "LILA BLANCO"},
    {"codigo": "J14601102", "color": "VIOLETA PASTEL PLATA"},
    {"codigo": "J14601103", "color": "ROSADO BLANCO"},
    {"codigo": "J14601104", "color": "PLATA BLANCO"},
    {"codigo": "J14601105", "color": "NEGRO BLANCO"},
    {"codigo": "J14601106", "color": "AZULINO BLANCO"}
  ],
  "SUPERFLY": [
    {"codigo": "C32508101", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "C32508102", "color": "BLANCO PLATA FUCSIA"},
    {"codigo": "C32508103", "color": "AMARILLO LIMON FUCSIA"},
    {"codigo": "C32508104", "color": "VERDE AGUA FUCSIA"},
    {"codigo": "C32508105", "color": "AZULINO ROJO AM.LIMON"},
    {"codigo": "D32503101", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "D32503102", "color": "BLANCO PLATA FUCSIA"},
    {"codigo": "D32503103", "color": "AMARILLO LIMON FUCSIA"},
    {"codigo": "D32503104", "color": "VERDE AGUA FUCSIA"},
    {"codigo": "D32503105", "color": "AZULINO ROJO AM.LIMON"},
    {"codigo": "D32503106", "color": "ROJO AMARILLO NG"},
    {"codigo": "D32503107", "color": "NEGRO DORADO ASSASING EVA BL CAUCHO NEGRO"},
    {"codigo": "D32503108", "color": "NEGRO PLATA"},
    {"codigo": "D32503109", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "D32503110", "color": "NEGRO ENTERO DORADO"},
    {"codigo": "E32508101", "color": "BLANCO CELESTE DORADO"},
    {"codigo": "C32508106", "color": "ROJO AMARILLO NG"},
    {"codigo": "E32508102", "color": "BLANCO PLATA FUCSIA"},
    {"codigo": "E32508103", "color": "AMARILLO LIMON FUCSIA"},
    {"codigo": "E32508104", "color": "VERDE AGUA  FUCSIA"},
    {"codigo": "E32508105", "color": "AZULINO ROJO AM LIMON"},
    {"codigo": "E32508106", "color": "ROJO AMARILLO NEGRO"},
    {"codigo": "E32508107", "color": "NEGRO DORADO"},
    {"codigo": "E32508108", "color": "NEGRO PLATA"},
    {"codigo": "E32508109", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "E32508110", "color": "NEGRO ENTERO"},
    {"codigo": "C32508107", "color": "NEGRO DORADO"},
    {"codigo": "C32508108", "color": "NEGRO PLATA"},
    {"codigo": "C32508109", "color": "BLANCO NEGRO DORADO"},
    {"codigo": "C32508110", "color": "NEGRO ENTERO"}
  ]
};

// Dynamically load custom models from localStorage at load time!
try {
  const savedCustom = localStorage.getItem('zapato_custom_models_expanded');
  if (savedCustom) {
    const parsed = JSON.parse(savedCustom);
    Object.entries(parsed).forEach(([key, val]) => {
      CATALOGO_REAL[key.toUpperCase()] = val as any[];
    });
  }
} catch (e) {
  console.error("Error loading custom models", e);
}

export interface Classification {
  label: 'CABALLERO' | 'DAMA' | 'JUNIOR' | 'OTROS';
  range: string;
  colorClass: string;
}

export const getClassification = (codigo: string): Classification => {
  const firstChar = codigo.trim().charAt(0).toUpperCase();
  if (firstChar === 'C') {
    return { 
      label: 'CABALLERO', 
      range: '39/42', 
      colorClass: 'bg-blue-50/80 border-blue-200 text-blue-700' 
    };
  } else if (firstChar === 'D') {
    return { 
      label: 'DAMA', 
      range: '35/38', 
      colorClass: 'bg-rose-50/80 border-rose-200 text-rose-700' 
    };
  } else if (firstChar === 'J') {
    return { 
      label: 'JUNIOR', 
      range: '29/34', 
      colorClass: 'bg-amber-50/80 border-amber-200 text-amber-800' 
    };
  } else {
    return { 
      label: 'OTROS', 
      range: '', 
      colorClass: 'bg-stone-50/80 border-stone-200 text-stone-600' 
    };
  }
};

export const CatalogoModelos: React.FC<CatalogoModelosProps> = ({ pedidos, onOpenPrintInstructions, onSaveModelVariants }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedLinea, setSelectedLinea] = useState<string>('TODAS');
  const [selectedSuela, setSelectedSuela] = useState<string>('TODAS');
  const [selectedImagePresence, setSelectedImagePresence] = useState<'TODOS' | 'CON_IMAGEN' | 'SIN_IMAGEN'>('TODOS');
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'NAME_DESC' | 'VARIANTS_DESC' | 'ACTIVE_FIRST'>('NAME_ASC');
  const [viewMode, setViewMode] = useState<'lista' | 'cuadrcula'>('lista');

  // Trigger state for updating the images view
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [imagesMap, setImagesMap] = useState<Record<string, string>>({});

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalModelName, setModalModelName] = useState('');
  const [modalOriginalCode, setModalOriginalCode] = useState('');
  const [modalOriginalColor, setModalOriginalColor] = useState('');
  
  // Form fields
  const [formCodigo, setFormCodigo] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formTalla, setFormTalla] = useState('39/42');
  const [formTipo, setFormTipo] = useState('CABALLERO');
  const [formLinea, setFormLinea] = useState('Deportivas/Caucho');
  const [formSuela, setFormSuela] = useState('ESTÁNDAR');
  const [modalImageSrc, setModalImageSrc] = useState('');

  // Image upload triggers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ modelName: string; codigo: string; color: string } | null>(null);

  // Load images on mount and refresh
  useEffect(() => {
    const loaded: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('zapato_galeria_img_')) {
        const itemKey = key.replace('zapato_galeria_img_', '');
        const data = localStorage.getItem(key);
        if (data) {
          loaded[itemKey] = data;
        }
      }
    }
    setImagesMap(loaded);
  }, [refreshTrigger]);

  // Compute dynamic live workshop stats for active models in orders
  const modelStats = useMemo(() => {
    const stats: Record<string, { pedidosCount: number; docenasTotal: number; coloresActivos: Set<string>; totalPares: number }> = {};
    
    pedidos.forEach(p => {
      const mName = p.producto.trim().toUpperCase();
      if (!stats[mName]) {
        stats[mName] = {
          pedidosCount: 0,
          docenasTotal: 0,
          coloresActivos: new Set<string>(),
          totalPares: 0
        };
      }
      
      stats[mName].pedidosCount += 1;
      stats[mName].docenasTotal += p.docenas;
      
      p.items.forEach(variant => {
        if (variant.color) {
          stats[mName].coloresActivos.add(variant.color.trim().toUpperCase());
        }
        Object.values(variant.tallas).forEach((cantidad) => {
          const uStr = Number(cantidad) || 0;
          if (uStr > 0) {
            stats[mName].totalPares += uStr;
          }
        });
      });
    });

    return stats;
  }, [pedidos]);

  // Programmatically deduplicate and unify catalog data to guarantee single truth source ("no duplicados")
  const cleanCatalog = useMemo<Record<string, CatalogEntry[]>>(() => {
    const result: Record<string, CatalogEntry[]> = {};
    Object.entries(CATALOGO_REAL).forEach(([modelName, entries]) => {
      const uniqueEntriesMap = new Map<string, CatalogEntry>();
      entries.forEach(entry => {
        const key = `${entry.codigo.trim().toUpperCase()}_${entry.color.trim().toUpperCase()}`;
        if (!uniqueEntriesMap.has(key)) {
          const classif = getClassification(entry.codigo);
          uniqueEntriesMap.set(key, {
            codigo: entry.codigo.trim().toUpperCase(),
            color: entry.color.trim().toUpperCase(),
            talla: entry.talla || classif.range,
            tipo: entry.tipo || classif.label,
            linea: entry.linea || 'Deportivas/Caucho',
            suela: entry.suela || 'ESTÁNDAR'
          });
        }
      });
      result[modelName.toUpperCase()] = Array.from(uniqueEntriesMap.values());
    });
    return result;
  }, [pedidos, CATALOGO_REAL, refreshTrigger]);

  // Compute unique list of lines for selection
  const lineasDisponibles = useMemo(() => {
    const list = new Set<string>();
    (Object.values(cleanCatalog) as CatalogEntry[][]).forEach(entries => {
      entries.forEach(item => {
        if (item.linea) list.add(item.linea);
      });
    });
    list.add('Deportivas/Caucho');
    list.add('Textil/Eva');
    list.add('Botas/Caucho');
    list.add('Chimpunes');
    return Array.from(list).filter(Boolean).sort();
  }, [cleanCatalog]);

  // Compute unique list of soles for selection
  const suelasDisponibles = useMemo(() => {
    const list = new Set<string>();
    (Object.values(cleanCatalog) as CatalogEntry[][]).forEach(entries => {
      entries.forEach(item => {
        if (item.suela) list.add(item.suela);
      });
    });
    list.add('ESTÁNDAR');
    return Array.from(list).filter(Boolean).sort();
  }, [cleanCatalog]);

  // Handle individual image uploads
  const triggerImageUpload = (modelName: string, codigo: string, color: string) => {
    setUploadTarget({ modelName, codigo, color });
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const imgKey = `zapato_galeria_img_${uploadTarget.codigo.toUpperCase().trim()}_${uploadTarget.color.toUpperCase().trim()}`;
          localStorage.setItem(imgKey, reader.result);
          setRefreshTrigger(prev => prev + 1);
        }
      };
      reader.readAsDataURL(file);
    }
    setUploadTarget(null);
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setModalImageSrc(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (codigo: string, color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Está seguro de eliminar la imagen de este modelo?')) {
      const imgKey = `zapato_galeria_img_${codigo.toUpperCase().trim()}_${color.toUpperCase().trim()}`;
      localStorage.removeItem(imgKey);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Open modal for editing or adding
  const handleOpenAddModal = (preselectedModel = '') => {
    setIsEditing(false);
    setModalModelName(preselectedModel.toUpperCase());
    setFormCodigo('');
    setFormColor('');
    setFormTalla('39/42');
    setFormTipo('CABALLERO');
    setFormLinea('Deportivas/Caucho');
    setFormSuela('ESTÁNDAR');
    setModalImageSrc('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (modelName: string, entry: CatalogEntry) => {
    setIsEditing(true);
    setModalModelName(modelName.toUpperCase());
    setModalOriginalCode(entry.codigo);
    setModalOriginalColor(entry.color);
    setFormCodigo(entry.codigo);
    setFormColor(entry.color);
    setFormTalla(entry.talla || '39/42');
    setFormTipo(entry.tipo || 'CABALLERO');
    setFormLinea(entry.linea || 'Deportivas/Caucho');
    setFormSuela(entry.suela || 'ESTÁNDAR');
    
    const imgKey = `${entry.codigo.toUpperCase().trim()}_${entry.color.toUpperCase().trim()}`;
    setModalImageSrc(imagesMap[imgKey] || '');
    setIsModalOpen(true);
  };

  const handleDeleteVariant = (modelName: string, entry: CatalogEntry) => {
    if (window.confirm(`¿Está seguro de eliminar la variante ${entry.codigo} - ${entry.color} del modelo ${modelName}?`)) {
      const currentVariants = cleanCatalog[modelName.toUpperCase()] || [];
      const updated = currentVariants.filter(
        v => !(v.codigo === entry.codigo && v.color === entry.color)
      );

      // Save through callback
      if (onSaveModelVariants) {
        onSaveModelVariants(modelName, updated);
      } else {
        CATALOGO_REAL[modelName.toUpperCase()] = updated;
        setRefreshTrigger(prev => prev + 1);
      }
    }
  };

  const handleSaveModalForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanModel = modalModelName.trim().toUpperCase();
    const cleanCode = formCodigo.trim().toUpperCase();
    const cleanColor = formColor.trim().toUpperCase();

    if (!cleanModel || !cleanCode || !cleanColor) {
      alert('Por favor complete el modelo, código y color.');
      return;
    }

    const currentVariants = cleanCatalog[cleanModel] || [];
    let updated = [...currentVariants];

    const newVariant: CatalogEntry = {
      codigo: cleanCode,
      color: cleanColor,
      talla: formTalla,
      tipo: formTipo,
      linea: formLinea,
      suela: formSuela
    };

    if (isEditing) {
      // Find and replace the original variant
      const idx = updated.findIndex(v => v.codigo === modalOriginalCode && v.color === modalOriginalColor);
      if (idx > -1) {
        updated[idx] = newVariant;
      } else {
        updated.push(newVariant);
      }

      // If key changed, migrate image in localStorage too
      const oldImgKey = `${modalOriginalCode.trim().toUpperCase()}_${modalOriginalColor.trim().toUpperCase()}`;
      const newImgKey = `${cleanCode}_${cleanColor}`;
      const existingImg = localStorage.getItem(`zapato_galeria_img_${oldImgKey}`);
      if (existingImg && oldImgKey !== newImgKey) {
        localStorage.setItem(`zapato_galeria_img_${newImgKey}`, existingImg);
        localStorage.removeItem(`zapato_galeria_img_${oldImgKey}`);
      }
    } else {
      // Check for duplicate in model variants list
      const isDup = updated.some(v => v.codigo === cleanCode && v.color === cleanColor);
      if (isDup) {
        alert('Esta especificación de código y color ya existe en este modelo.');
        return;
      }
      updated.push(newVariant);
    }

    // Save image to localStorage if changed/updated in modal
    const targetImgKey = `zapato_galeria_img_${cleanCode}_${cleanColor}`;
    if (modalImageSrc) {
      localStorage.setItem(targetImgKey, modalImageSrc);
    } else {
      localStorage.removeItem(targetImgKey);
    }

    // De-duplicate array for extra integrity
    const map = new Map<string, CatalogEntry>();
    updated.forEach(item => {
      map.set(`${item.codigo}_${item.color}`, item);
    });
    const finalVariants = Array.from(map.values());

    if (onSaveModelVariants) {
      onSaveModelVariants(cleanModel, finalVariants);
    } else {
      CATALOGO_REAL[cleanModel] = finalVariants;
      setRefreshTrigger(prev => prev + 1);
    }

    setIsModalOpen(false);
    alert(`✅ ¡Modelo ${cleanModel} actualizado exitosamente!`);
  };

  // Helper to pre-select classification on code input change
  const handleFormCodeChange = (val: string) => {
    setFormCodigo(val.toUpperCase());
    const cls = getClassification(val);
    if (cls.label) {
      setFormTipo(cls.label);
    }
    if (cls.range) {
      setFormTalla(cls.range);
    }
  };

  // Filter & Sort Logic on the deduplicated clean catalog
  const filteredModels = useMemo<Record<string, CatalogEntry[]>>(() => {
    const term = searchTerm.trim().toUpperCase();
    const result: Record<string, CatalogEntry[]> = {};

    (Object.entries(cleanCatalog) as [string, CatalogEntry[]][]).forEach(([modelName, entries]) => {
      const filteredEntries = entries.filter(entry => {
        // Search term match
        const matchesSearch = !term || 
          modelName.toUpperCase().includes(term) ||
          entry.codigo.toUpperCase().includes(term) ||
          entry.color.toUpperCase().includes(term) ||
          (entry.linea && entry.linea.toUpperCase().includes(term)) ||
          (entry.suela && entry.suela.toUpperCase().includes(term));

        if (!matchesSearch) return false;

        // Horma/Tipo match
        const matchesTipo = selectedTipo === 'TODOS' || entry.tipo === selectedTipo;
        if (!matchesTipo) return false;

        // Línea match
        const matchesLinea = selectedLinea === 'TODAS' || entry.linea === selectedLinea;
        if (!matchesLinea) return false;

        // Suela match
        const matchesSuela = selectedSuela === 'TODAS' || (entry.suela && entry.suela.toUpperCase() === selectedSuela.toUpperCase());
        if (!matchesSuela) return false;

        // Image presence match
        const imgKey = `${entry.codigo}_${entry.color}`;
        const hasImg = !!imagesMap[imgKey];
        if (selectedImagePresence === 'CON_IMAGEN' && !hasImg) return false;
        if (selectedImagePresence === 'SIN_IMAGEN' && hasImg) return false;

        return true;
      });

      if (filteredEntries.length > 0) {
        result[modelName] = filteredEntries;
      }
    });

    return result;
  }, [cleanCatalog, searchTerm, selectedTipo, selectedLinea, selectedSuela, selectedImagePresence, imagesMap]);

  // Sort model keys
  const sortedModelKeys = useMemo(() => {
    const keys = Object.keys(filteredModels);
    return keys.sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        return a.localeCompare(b);
      } else if (sortBy === 'NAME_DESC') {
        return b.localeCompare(a);
      } else if (sortBy === 'VARIANTS_DESC') {
        return (filteredModels[b]?.length || 0) - (filteredModels[a]?.length || 0);
      } else if (sortBy === 'ACTIVE_FIRST') {
        const activeA = modelStats[a]?.pedidosCount || 0;
        const activeB = modelStats[b]?.pedidosCount || 0;
        return activeB - activeA;
      }
      return 0;
    });
  }, [filteredModels, sortBy, modelStats]);

  // Metrics
  const totalModelos = Object.keys(cleanCatalog).length;
  const totalCodigos = (Object.values(cleanCatalog) as CatalogEntry[][]).reduce((sum, currentList) => sum + currentList.length, 0);
  const totalShownEntries = Object.keys(filteredModels).reduce((sum, modelName) => sum + (filteredModels[modelName]?.length || 0), 0);
  
  const totalModelosActivosEnTaller = useMemo(() => {
    let count = 0;
    Object.keys(cleanCatalog).forEach(m => {
      if (modelStats[m.toUpperCase()]?.pedidosCount > 0) {
        count++;
      }
    });
    return count;
  }, [cleanCatalog, modelStats]);

  const activeWorkshopDocenas = useMemo(() => {
    return pedidos.reduce((sum, p) => sum + p.docenas, 0);
  }, [pedidos]);

  const handlePrint = () => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isIframe && onOpenPrintInstructions) {
      onOpenPrintInstructions();
    } else {
      window.print();
    }
  };

  // Print groups unifier
  const printGroups = useMemo(() => {
    const groups = {
      'CABALLERO': [] as { modelo: string; item: CatalogEntry }[],
      'DAMA': [] as { modelo: string; item: CatalogEntry }[],
      'JUNIOR': [] as { modelo: string; item: CatalogEntry }[],
      'OTROS': [] as { modelo: string; item: CatalogEntry }[]
    };

    (Object.entries(cleanCatalog) as [string, CatalogEntry[]][]).forEach(([modelName, entries]) => {
      entries.forEach(entry => {
        const tipo = entry.tipo || 'OTROS';
        if (groups[tipo as keyof typeof groups]) {
          groups[tipo as keyof typeof groups].push({ modelo: modelName, item: entry });
        } else {
          groups['OTROS'].push({ modelo: modelName, item: entry });
        }
      });
    });

    return groups;
  }, [cleanCatalog]);

  return (
    <div id="catalog-section" className="space-y-6">
      {/* SCREEN VIEW */}
      <div className="print:hidden space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-baseline pb-6 border-b border-stone-200 bg-transparent gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-stone-900 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 tracking-widest font-mono">
                SISTEMA MAESTRO DE PRODUCCIÓN
              </span>
              <span className="w-1.5 h-1.5 bg-[#F15A24] animate-pulse" />
              <span className="text-stone-800 text-[10px] font-bold font-mono uppercase tracking-wider">BASE DE DATOS UNIFICADA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight font-serif uppercase text-stone-900 leading-none">
              BASE DE MODELOS & GALERÍA
            </h2>
            <p className="text-stone-500 text-[11px] font-bold uppercase tracking-wider mt-1.5">
              Base única de especificaciones técnicas con galería fotográfica integrada, sin duplicados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 bg-[#F15A24] hover:bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-widest px-4 py-3 border border-orange-700 transition rounded-none cursor-pointer"
            >
              <Plus size={13} />
              Agregar Nuevo Modelo
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-[10px] uppercase tracking-widest px-4 py-3 border border-stone-300 transition rounded-none cursor-pointer"
            >
              <Printer size={13} />
              Imprimir Base
            </button>
          </div>
        </div>

        {/* Stats Summary Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 p-4 rounded-none">
            <div className="flex justify-between items-center text-stone-500 mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider">Modelos Base</span>
              <Boxes size={14} className="text-stone-500" />
            </div>
            <p className="text-2xl font-black font-mono text-stone-900">{totalModelos}</p>
            <p className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">Líneas Registradas</p>
          </div>

          <div className="bg-white border border-stone-200 p-4 rounded-none">
            <div className="flex justify-between items-center text-stone-500 mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider">Especificaciones Únicas</span>
              <BookOpen size={14} className="text-stone-500" />
            </div>
            <p className="text-2xl font-black font-mono text-stone-900">{totalCodigos}</p>
            <p className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">Cero Duplicados en Sistema</p>
          </div>

          <div className="bg-white border border-stone-200 p-4 rounded-none">
            <div className="flex justify-between items-center text-stone-500 mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider">Modelos Activos</span>
              <Activity size={14} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black font-mono text-amber-600">{totalModelosActivosEnTaller}</p>
            <p className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">En Lotes de Producción</p>
          </div>

          <div className="bg-white border border-stone-200 p-4 rounded-none">
            <div className="flex justify-between items-center text-stone-500 mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider">Volumen Semanal</span>
              <Footprints size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600">
              {activeWorkshopDocenas} <span className="text-xs font-semibold">doc.</span>
            </p>
            <p className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">Taller Activo</p>
          </div>
        </div>

        {/* Toolbar & Advanced Filters */}
        <div className="bg-white border border-stone-250 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-2 text-stone-800 text-[10px] font-black uppercase tracking-wider">
              <SlidersHorizontal size={14} className="text-[#F15A24]" />
              <span>Buscador y Clasificaciones Interconectados</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-stone-200 p-0.5 bg-stone-50">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition rounded-none flex items-center gap-1 cursor-pointer ${
                  viewMode === 'lista' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                <List size={11} />
                Lista Técnica
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cuadrcula')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition rounded-none flex items-center gap-1 cursor-pointer ${
                  viewMode === 'cuadrcula' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                <LayoutGrid size={11} />
                Galería Visual
              </button>
            </div>
          </div>

          {/* Filters Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative col-span-1 md:col-span-2">
              <label className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Buscar por Texto</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar modelo, código, color, línea, suela..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-none pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 font-bold focus:outline-none focus:border-stone-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Línea filter */}
            <div>
              <label className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Línea de Fabricación</label>
              <select
                value={selectedLinea}
                onChange={(e) => setSelectedLinea(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-none px-3 py-1.5 text-xs text-stone-900 font-bold focus:outline-none focus:border-stone-900 cursor-pointer"
              >
                <option value="TODAS">-- TODAS --</option>
                {lineasDisponibles.map(linea => (
                  <option key={linea} value={linea}>{linea}</option>
                ))}
              </select>
            </div>

            {/* Suela filter */}
            <div>
              <label className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Tipo de Suela</label>
              <select
                value={selectedSuela}
                onChange={(e) => setSelectedSuela(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-none px-3 py-1.5 text-xs text-stone-900 font-bold focus:outline-none focus:border-stone-900 cursor-pointer"
              >
                <option value="TODAS">-- TODAS --</option>
                {suelasDisponibles.map(suela => (
                  <option key={suela} value={suela}>{suela}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
            {/* Horma / Segmento buttons */}
            <div>
              <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Horma / Segmento</span>
              <div className="flex flex-wrap gap-1">
                {['TODOS', 'CABALLERO', 'DAMA', 'JUNIOR', 'OTROS'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setSelectedTipo(tipo)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border transition cursor-pointer rounded-none
                      ${selectedTipo === tipo 
                        ? 'bg-stone-900 text-white border-stone-950' 
                        : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-250'}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Image presence toggle */}
            <div>
              <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Presencia de Imagen</span>
              <div className="flex border border-stone-200 p-0.5 bg-stone-50 max-w-xs">
                {(['TODOS', 'CON_IMAGEN', 'SIN_IMAGEN'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedImagePresence(opt)}
                    className={`flex-1 py-1 text-[8.5px] font-extrabold uppercase tracking-wider transition rounded-none text-center cursor-pointer ${
                      selectedImagePresence === opt ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-850'
                    }`}
                  >
                    {opt === 'TODOS' ? 'Todos' : opt === 'CON_IMAGEN' ? 'Con Foto' : 'Sin Foto'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Orden de Visualización</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-none px-3 py-1 text-xs text-stone-900 font-bold focus:outline-none focus:border-stone-900 cursor-pointer"
              >
                <option value="NAME_ASC">Nombre de Modelo (A-Z)</option>
                <option value="NAME_DESC">Nombre de Modelo (Z-A)</option>
                <option value="VARIANTS_DESC">Mayor Número de Variantes</option>
                <option value="ACTIVE_FIRST">Pedidos Activos en Taller Primero</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <div className="text-[10px] uppercase font-black tracking-widest text-stone-500 bg-stone-50 border border-stone-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-3xs">
          <div className="flex items-center gap-1.5">
            <Info size={12} className="text-[#F15A24]" />
            <span>
              {searchTerm || selectedTipo !== 'TODOS' || selectedLinea !== 'TODAS' || selectedSuela !== 'TODAS' || selectedImagePresence !== 'TODOS'
                ? `Filtros activos: Mostrando ${totalShownEntries} de ${totalCodigos} variantes técnicas`
                : `Base única unificada sin duplicados: ${totalCodigos} especificaciones y fotos vinculadas`}
            </span>
          </div>
          {(searchTerm || selectedTipo !== 'TODOS' || selectedLinea !== 'TODAS' || selectedSuela !== 'TODAS' || selectedImagePresence !== 'TODOS') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTipo('TODOS');
                setSelectedLinea('TODAS');
                setSelectedSuela('TODAS');
                setSelectedImagePresence('TODOS');
              }}
              className="text-[#F15A24] hover:underline cursor-pointer font-black text-[9px] uppercase tracking-wider"
            >
              [ Limpiar todos los filtros ]
            </button>
          )}
        </div>

        {/* Hidden Upload File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* GRID LAYOUT FOR LIST OR GALLERY GRID */}
        {sortedModelKeys.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 p-12 text-center rounded-none shadow-3xs">
            <Info size={32} className="mx-auto text-stone-300 mb-3" />
            <p className="text-sm font-bold text-stone-700">No se encontraron especificaciones con los filtros elegidos.</p>
            <p className="text-xs text-stone-400 mt-1">Intente cambiar o limpiar los filtros seleccionados.</p>
          </div>
        ) : viewMode === 'lista' ? (
          /* LIST MODE */
          <div className="space-y-6">
            {sortedModelKeys.map(modelName => {
              const entriesList = filteredModels[modelName] || [];
              const stats = modelStats[modelName.toUpperCase()] || { pedidosCount: 0, docenasTotal: 0 };
              const isModelInProduction = stats.pedidosCount > 0;

              return (
                <div key={modelName} className="border border-stone-250 bg-white p-5 rounded-none shadow-2xs space-y-4 hover:border-stone-400 transition">
                  {/* Model Name and Top Info */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-100 pb-3 gap-2">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <h3 className="text-xl font-serif font-black italic tracking-tight text-stone-900 uppercase">
                        {modelName}
                      </h3>
                      <span className="bg-stone-100 border border-stone-200 text-stone-600 text-[9px] font-black uppercase px-2 py-0.5 tracking-widest">
                        {entriesList.length} especificación(es)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isModelInProduction && (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-150 text-[9px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo en Lotes: {stats.pedidosCount} · {stats.docenasTotal} doc
                        </div>
                      )}
                      <button
                        onClick={() => handleOpenAddModal(modelName)}
                        className="text-[9px] font-black uppercase tracking-widest bg-stone-900 text-white px-2.5 py-1.5 hover:bg-stone-850 transition"
                      >
                        + Nueva Variante
                      </button>
                    </div>
                  </div>

                  {/* Variants Cards list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {entriesList.map((item, idx) => {
                      const isColorInActiveJob = pedidos.some(p => 
                        p.producto.trim().toUpperCase() === modelName.toUpperCase() &&
                        p.items.some(v => v.color.trim().toUpperCase() === item.color.trim().toUpperCase())
                      );
                      const imgKey = `${item.codigo}_${item.color}`;
                      const hasImage = !!imagesMap[imgKey];
                      const imageSrc = imagesMap[imgKey];

                      return (
                        <div 
                          key={`${item.codigo}-${idx}`}
                          className={`border p-3 flex flex-col justify-between transition min-h-[14rem] rounded-none group relative bg-white
                            ${isColorInActiveJob ? 'border-emerald-500/80 shadow-3xs' : 'border-stone-200 hover:border-stone-400'}`}
                        >
                          {/* Image Box */}
                          <div 
                            onClick={() => triggerImageUpload(modelName, item.codigo, item.color)}
                            className="aspect-[4/3] bg-stone-50 border-b border-stone-100 relative mb-3 overflow-hidden group/img flex flex-col items-center justify-center cursor-pointer hover:bg-stone-150 transition duration-150"
                            title="Haga clic aquí para subir o actualizar la foto de este calzado"
                          >
                            {hasImage ? (
                              <>
                                <img 
                                  src={imageSrc} 
                                  alt={`${modelName} ${item.color}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {/* Hover overlay triggers */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition duration-150 flex items-center justify-center gap-1.5">
                                  <span className="bg-white text-stone-900 text-[9px] font-black uppercase px-2.5 py-1 tracking-wider">
                                    Cambiar Foto
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteImage(item.codigo, item.color, e);
                                    }}
                                    className="bg-red-600 text-white p-1.5 hover:bg-red-700 transition cursor-pointer"
                                    title="Eliminar Imagen"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-stone-400 p-3 text-center">
                                <ImageIcon size={22} className="mb-1 text-stone-400 group-hover/img:text-[#F15A24] transition duration-150" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 group-hover/img:text-[#F15A24] transition duration-150">Cargar Foto</span>
                                <span className="text-[8px] text-stone-400 mt-0.5">Click o Toque</span>
                              </div>
                            )}
                          </div>

                          {/* Info section */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex justify-between items-start">
                              <code className="text-xs font-black font-mono text-stone-800 tracking-wider">
                                {item.codigo}
                              </code>
                              {isColorInActiveJob && (
                                <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 tracking-widest leading-none">
                                  activo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-black uppercase tracking-tight text-stone-900 line-clamp-2">
                              {item.color}
                            </div>
                          </div>

                          {/* Technical details footer */}
                          <div className="pt-2 border-t border-stone-100 text-[8px] font-mono text-stone-400 mt-2 space-y-0.5">
                            <div className="flex justify-between">
                              <span>SUELA:</span>
                              <span className="font-bold text-stone-700 uppercase">{item.suela || 'ESTÁNDAR'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>LÍNEA:</span>
                              <span className="font-bold text-stone-700 uppercase">{item.linea || 'Deportivas/Caucho'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>HORMA:</span>
                              <span className="font-bold text-stone-700 uppercase">{item.tipo || 'CABALLERO'}</span>
                            </div>
                          </div>

                          {/* Action overlay strip */}
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(modelName, item)}
                              className="bg-white border border-stone-300 text-stone-700 p-1 hover:text-stone-900 hover:border-stone-500 shadow-3xs"
                              title="Editar especificación"
                            >
                              <Edit size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(modelName, item)}
                              className="bg-white border border-stone-300 text-red-600 p-1 hover:bg-red-50 hover:border-red-400 shadow-3xs"
                              title="Eliminar variante"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* GALLERY GRID MODE */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedModelKeys.flatMap(modelName => {
              const entriesList = filteredModels[modelName] || [];
              return entriesList.map((item, idx) => {
                const imgKey = `${item.codigo}_${item.color}`;
                const hasImage = !!imagesMap[imgKey];
                const imageSrc = imagesMap[imgKey];

                return (
                  <div 
                    key={`${modelName}_${item.codigo}_${idx}`}
                    className="bg-white border border-stone-250 overflow-hidden flex flex-col group hover:border-stone-400 hover:shadow-md transition duration-150 relative"
                  >
                    {/* Visual Canvas */}
                    <div 
                      onClick={() => triggerImageUpload(modelName, item.codigo, item.color)}
                      className="aspect-[4/3] bg-stone-50 border-b border-stone-100 relative flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-stone-150 transition duration-150"
                      title="Haga clic aquí para subir o actualizar la foto de este calzado"
                    >
                      {hasImage ? (
                        <>
                          <img 
                            src={imageSrc} 
                            alt={`${modelName} ${item.color}`}
                            className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          {/* Action trigger strip */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center gap-1.5">
                            <span className="bg-white text-stone-900 text-[9px] font-black uppercase px-2.5 py-1 tracking-wider">
                              Cambiar Foto
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(item.codigo, item.color, e);
                              }}
                              className="bg-red-600 text-white p-1.5 hover:bg-red-700 cursor-pointer"
                              title="Eliminar imagen"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-400 p-3 text-center">
                          <ImageIcon size={24} className="mb-1 text-stone-400 group-hover:text-[#F15A24] transition duration-150" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 group-hover:text-[#F15A24] transition duration-150">Cargar Foto</span>
                          <span className="text-[8px] text-stone-400 mt-0.5">Click o Toque</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata summary */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-extrabold text-xs text-stone-900 leading-tight uppercase tracking-tight line-clamp-1">
                            {modelName}
                          </h4>
                          <span className="bg-stone-50 text-stone-500 border border-stone-200 text-[8.5px] px-1.5 py-0.5 font-bold tracking-tight">
                            {item.talla}
                          </span>
                        </div>
                        <p className="text-[9px] font-mono font-semibold text-stone-400 mt-0.5">{item.codigo}</p>
                        <p className="text-[10.5px] font-extrabold text-stone-800 mt-1 uppercase line-clamp-2 leading-snug">{item.color}</p>
                      </div>

                      {/* Footer tags */}
                      <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                        <span className="text-[7.5px] font-extrabold bg-stone-50 text-stone-500 border border-stone-200 px-1.5 py-0.5 uppercase">
                          {item.tipo}
                        </span>
                        <span className="text-[7.5px] font-extrabold bg-stone-50 text-stone-500 border border-stone-200 px-1.5 py-0.5 uppercase">
                          {item.linea}
                        </span>
                        {item.suela && item.suela !== 'ESTÁNDAR' && (
                          <span className="text-[7.5px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 uppercase">
                            {item.suela}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Technical Edits trigger */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(modelName, item)}
                        className="bg-white border border-stone-300 text-stone-700 p-1 hover:text-stone-900 shadow-3xs"
                        title="Editar especificación"
                      >
                        <Edit size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(modelName, item)}
                        className="bg-white border border-stone-300 text-red-600 p-1 hover:bg-red-50 hover:border-red-400 shadow-3xs"
                        title="Eliminar variante"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        )}
      </div>

      {/* PRINT-ONLY VIEW */}
      <div className="hidden print:block space-y-8 bg-white text-black p-4">
        <div className="border-b-4 border-black pb-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase">BRIXTON INDUSTRIAL SHOE FABRIC</span>
              <h1 className="text-3xl font-serif font-black italic tracking-tight uppercase leading-none mt-1">
                INFORME MAESTRO - BASE DE MODELOS 2030
              </h1>
              <p className="text-xs uppercase font-bold tracking-wider text-stone-700 mt-1">
                Catálogo unificado y clasificado de especificaciones de hormas, códigos y variantes de calzado.
              </p>
            </div>
            <div className="text-right text-xs font-mono font-semibold">
              <div>FECHA DE REPORTE: {new Date().toLocaleDateString()}</div>
              <div>CÓDIGOS TOTALES: {totalCodigos}</div>
            </div>
          </div>
        </div>

        {(Object.entries(printGroups) as Array<[string, Array<{ modelo: string; item: CatalogEntry }>]>).map(([tipoLabel, list]) => {
          if (list.length === 0) return null;

          return (
            <div key={tipoLabel} className="space-y-4 break-after-auto">
              <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-1 flex justify-between items-center">
                <span>📂 CLASIFICACIÓN: {tipoLabel}</span>
                <span className="text-[10px] font-mono">({list.length} VARIANTE(S))</span>
              </h3>

              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-black text-stone-800 uppercase font-bold">
                    <th className="py-2 px-1 w-8 font-mono">N°</th>
                    <th className="py-2 px-2 w-32">MODELO</th>
                    <th className="py-2 px-2 w-32 font-mono">CÓDIGO</th>
                    <th className="py-2 px-2">COLOR CORTE / ESPECIFICACIÓN</th>
                    <th className="py-2 px-2 w-20 font-mono">SERIE</th>
                    <th className="py-2 px-2 w-36">LÍNEA DE FABRICACIÓN</th>
                    <th className="py-2 px-2 w-24">SUELA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {list.map((row, i) => {
                    const cls = getClassification(row.item.codigo);
                    return (
                      <tr key={i} className="hover:bg-stone-50/50">
                        <td className="py-2 px-1 font-mono text-stone-500">{i + 1}</td>
                        <td className="py-2 px-2 font-black uppercase">{row.modelo}</td>
                        <td className="py-2 px-2 font-mono font-bold text-indigo-950">{row.item.codigo}</td>
                        <td className="py-2 px-2 uppercase">{row.item.color}</td>
                        <td className="py-2 px-2 font-mono">{row.item.talla || cls.range}</td>
                        <td className="py-2 px-2 uppercase">{row.item.linea || 'Deportivas/Caucho'}</td>
                        <td className="py-2 px-2 uppercase">{row.item.suela || 'ESTÁNDAR'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        <div className="border-t border-stone-300 pt-4 text-center text-[10px] font-mono text-stone-500 uppercase">
          SISTEMA DE CALZADO CÉSAR VILLEGAS · CONFIDENCIAL DE PRODUCCIÓN · INFORME EXCLUSIVO 2030
        </div>
      </div>

      {/* EDIT & ADD DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border-2 border-stone-900 max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-900 font-bold transition text-xs font-mono cursor-pointer"
              title="Cerrar"
            >
              ✕
            </button>
            
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 font-serif italic flex items-center gap-2">
                {isEditing ? '📝 EDITAR ESPECIFICACIÓN' : '➕ REGISTRAR NUEVA VARIANTE'}
              </h3>
              <p className="text-stone-400 text-[10px] font-mono mt-1">
                Administre especificaciones técnicas de hormas, suelas y códigos de calzado.
              </p>
            </div>

            <form onSubmit={handleSaveModalForm} className="space-y-4">
              {/* Model selection / typing */}
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Nombre del Modelo:</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  placeholder="Escriba el nombre (Ej: ABSOLUTE)..."
                  value={modalModelName}
                  onChange={(e) => setModalModelName(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold uppercase focus:ring-1 focus:ring-black focus:outline-none disabled:bg-stone-100 disabled:text-stone-500"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Código de Fabricación:</label>
                <input
                  type="text"
                  required
                  placeholder="Escriba el código de barra (Ej: C24502101)..."
                  value={formCodigo}
                  onChange={(e) => handleFormCodeChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Color / Combinación del Corte:</label>
                <input
                  type="text"
                  required
                  placeholder="Escriba los colores en mayúsculas (Ej: NEGRO DORADO PLATA)..."
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tipo / Horma */}
                <div>
                  <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Segmento / Horma:</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none cursor-pointer"
                  >
                    <option value="CABALLERO">CABALLERO</option>
                    <option value="DAMA">DAMA</option>
                    <option value="JUNIOR">JUNIOR</option>
                    <option value="OTROS">OTROS</option>
                  </select>
                </div>

                {/* Serie / Talla */}
                <div>
                  <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Serie / Rango de Tallas:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 39/42 o 35/38..."
                    value={formTalla}
                    onChange={(e) => setFormTalla(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Line */}
                <div>
                  <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Línea de Calzado:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Deportivas/Caucho..."
                    value={formLinea}
                    onChange={(e) => setFormLinea(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>

                {/* Sole */}
                <div>
                  <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">Tipo de Suela:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: ESTÁNDAR o ASSAZING..."
                    value={formSuela}
                    onChange={(e) => setFormSuela(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 p-2 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Opcional: Foto de Muestra */}
              <div className="border border-dashed border-stone-300 p-4 bg-stone-50 text-center relative rounded-none">
                <span className="block text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2">FOTO DE MUESTRA DEL CALZADO</span>
                {modalImageSrc ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative inline-block w-32 h-24 border border-stone-200 bg-white">
                      <img src={modalImageSrc} alt="Vista previa" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setModalImageSrc('')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-750 border border-white cursor-pointer shadow-sm"
                        title="Quitar foto"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="text-[8.5px] text-stone-400 font-bold uppercase">Foto cargada para esta variante</span>
                  </div>
                ) : (
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 bg-white border border-stone-350 text-stone-800 font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-2 hover:bg-stone-100 transition cursor-pointer shadow-3xs"
                    >
                      <Upload size={12} className="text-[#F15A24]" />
                      Seleccionar de Galería o Cámara
                    </button>
                    <p className="text-[8px] text-stone-400 mt-1.5 font-bold uppercase tracking-wider">Admite imágenes JPG / PNG</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={modalFileInputRef}
                  onChange={handleModalFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white hover:bg-stone-850 text-[10px] font-bold uppercase tracking-wider"
                >
                  Guardar Especificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
