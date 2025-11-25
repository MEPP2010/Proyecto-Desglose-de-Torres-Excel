import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

// Interfaces
export interface Piece {
  id_item: string;
  texto_breve: string;
  tipo: string;
  fabricante: string;
  cabeza: string;
  parte_division: string;
  cuerpo: string;
  tramo: string;
  posicion: string;
  descripcion: string;
  long_2_principal: string;
  cantidad_x_torre: number;
  peso_unitario: number;
  plano: string;
  mod_plano: string;
  hoja_origen: string; // Nombre de la hoja de donde viene
}

export interface CalculatedPiece {
  id_item: string;
  texto_breve: string;
  descripcion: string;
  parte_division: string;
  posicion: string;
  cantidad_original: number;
  cantidad_calculada: number;
  peso_unitario: number;
  peso_total: number;
  long_2_principal: string;
  plano: string;
  mod_plano: string;
}

// Sets para división de partes (mismo que en MongoDB)
export const PARTS_DIV_2 = new Set([
  'BGDA', 'BSUP', 'BMED', 'BINF', 'BDER', 'BIZQ', 'BSUP/MED'
]);

export const PARTS_DIV_4 = new Set([
  'PATA 0', 'PATA 0.0', 'PATA 1.5', 'PATA 3', 'PATA 3.0',
  'PATA 4.5', 'PATA 6', 'PATA 6.0', 'PATA 7.5', 'PATA 9', 'PATA 9.0'
]);

// Cache de datos en memoria
let cachedData: Piece[] | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Mapea los nombres de columnas del Excel a nuestros campos internos
 * Basado en los encabezados reales del archivo
 */
const COLUMN_MAPPING: Record<string, string> = {
  'ID Item': 'id_item',
  'Texto breve del material': 'texto_breve',
  'TIPO': 'tipo',
  'FABRICANTE': 'fabricante',
  'Cabeza': 'cabeza',
  'Parte (Division)': 'parte_division',
  'Cuerpo': 'cuerpo',
  'Tramo': 'tramo',
  'Posición': 'posicion',
  'Descripción': 'descripcion',
  'Long 1': 'long_1',
  'Long 2 (Principal)': 'long_2_principal',
  'Cantidad x Torre': 'cantidad_x_torre',
  'Peso Unitario': 'peso_unitario',
  'PLANO': 'plano',
  'Mod Plano': 'mod_plano'
};

/**
 * Carga el archivo Excel y convierte todas las hojas a un array de objetos
 */
export function loadExcelData(forceReload = false): Piece[] {
  const now = Date.now();
  
  // Retornar cache si es válido
  if (!forceReload && cachedData && (now - lastLoadTime) < CACHE_TTL) {
    console.log('📦 Usando datos en caché');
    return cachedData;
  }

  console.log('📂 Cargando datos desde Excel...');
  
  try {
    // Ruta al archivo Excel (ajusta según tu estructura)
    const excelPath = join(process.cwd(), 'data', 'PROYECTO_DESGLOSE_TORRES_martin.xlsx');
    
    // Leer archivo
    const fileBuffer = readFileSync(excelPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    const allData: Piece[] = [];
    
    // Procesar cada hoja
    workbook.SheetNames.forEach(sheetName => {
      console.log(`  📄 Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // SOLUCIÓN: Leer como arrays para encontrar la fila de encabezados
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,  // Retorna arrays en lugar de objetos
        raw: false,
        defval: ''
      }) as any[][];
      
      console.log(`     📊 Total de filas (raw): ${rawData.length}`);
      
      if (rawData.length === 0) {
        console.log(`     ⚠️ Hoja sin datos - omitiendo`);
        return;
      }
      
      // Encontrar la fila de encabezados (buscar "ID Item" o "FABRICANTE")
      let headerRowIndex = -1;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        const rowStr = row.join('|').toUpperCase();
        
        // Buscar palabras clave en los encabezados
        if (rowStr.includes('ID ITEM') || 
            rowStr.includes('FABRICANTE') || 
            rowStr.includes('PARTE') ||
            (rowStr.includes('TIPO') && rowStr.includes('CABEZA'))) {
          headerRowIndex = i;
          headers = row.map(cell => String(cell || '').trim());
          console.log(`     📋 Encabezados encontrados en fila ${i + 1}`);
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        console.log(`     ⚠️ No se encontraron encabezados válidos - omitiendo hoja`);
        return;
      }
      
      console.log(`     📋 Columnas: ${headers.filter(h => h).length} encabezados válidos`);
      console.log(`     🔍 Muestra: ${headers.filter(h => h).slice(0, 5).join(', ')}...`);
      
      // Extraer TIPO y FABRICANTE del nombre de la hoja
      const [tipo, fabricante] = extractTipoFabricante(sheetName);
      console.log(`     🏷️  TIPO: "${tipo}", FABRICANTE: "${fabricante}"`);
      
      let rowsAdded = 0;
      let rowsSkipped = 0;
      
      // Procesar filas de datos (después de los encabezados)
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const rowArray = rawData[i];
        
        // Crear objeto con los datos de la fila
        const row: any = {};
        headers.forEach((header, index) => {
          if (header) {
            row[header] = rowArray[index] || '';
          }
        });
        
        // Función para buscar columnas con nombres variables
        const getColumnValue = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            // Buscar exacto
            if (row[name] !== undefined) {
              return row[name];
            }
            // Buscar case-insensitive
            const foundKey = Object.keys(row).find(k => 
              k.toLowerCase() === name.toLowerCase()
            );
            if (foundKey) {
              return row[foundKey];
            }
          }
          return '';
        };
        
        const idItem = getColumnValue(['ID Item', 'IDItem', 'ID_Item', 'Material']);
        const textoBrev = getColumnValue(['Texto breve del material', 'Texto breve', 'TextoBreve', 'Texto']);
        const tipoCol = getColumnValue(['TIPO', 'Tipo', 'tipo']);
        const fabricanteCol = getColumnValue(['FABRICANTE', 'Fabricante', 'fabricante']);
        const cabezaCol = getColumnValue(['Cabeza', 'cabeza']);
        const parteDiv = getColumnValue(['Parte (Division)', 'Parte', 'Division', 'Parte_Division', 'Parte(Division)']);
        const cuerpoCol = getColumnValue(['Cuerpo', 'cuerpo']);
        const tramoCol = getColumnValue(['Tramo', 'tramo']);
        const posicionCol = getColumnValue(['Posición', 'Posicion', 'posicion', 'Pos']);
        const descripcionCol = getColumnValue(['Descripción', 'Descripcion', 'descripcion']);
        const long1Col = getColumnValue(['Long 1', 'Long1', 'Long_1']);
        const long2Col = getColumnValue(['Long 2 (Principal)', 'Long 2', 'Long2', 'Long_2', 'Long 2(Principal)']);
        const cantidadCol = getColumnValue(['Cantidad x Torre', 'Cantidad', 'Cant x Torre', 'Cant', 'Cantidad Torre']);
        const pesoCol = getColumnValue(['Peso Unitario', 'Peso', 'PesoUnitario', 'Peso Unit']);
        const planoCol = getColumnValue(['PLANO', 'Plano', 'plano']);
        const modPlanoCol = getColumnValue(['Mod Plano', 'ModPlano', 'Mod_Plano']);
        
        const piece: Piece = {
          id_item: normalizeValue(idItem),
          texto_breve: normalizeValue(textoBrev),
          tipo: tipo || normalizeValue(tipoCol),
          fabricante: fabricante || normalizeValue(fabricanteCol),
          cabeza: normalizeValue(cabezaCol),
          parte_division: normalizeValue(parteDiv),
          cuerpo: normalizeValue(cuerpoCol),
          tramo: normalizeValue(tramoCol),
          posicion: normalizeValue(posicionCol),
          descripcion: normalizeValue(descripcionCol),
          long_2_principal: normalizeValue(long2Col),
          cantidad_x_torre: parseNumber(cantidadCol),
          peso_unitario: parseNumber(pesoCol),
          plano: normalizeValue(planoCol),
          mod_plano: normalizeValue(modPlanoCol),
          hoja_origen: sheetName
        };
        
        // Solo agregar si tiene datos mínimos válidos
        const hasMinimumData = 
          (piece.id_item && piece.id_item !== '-') || 
          (piece.parte_division && piece.parte_division !== '-') ||
          (piece.descripcion && piece.descripcion !== '-' && piece.descripcion.length > 3);
        
        if (hasMinimumData) {
          allData.push(piece);
          rowsAdded++;
        } else {
          rowsSkipped++;
        }
      }
      
      console.log(`     ✅ ${rowsAdded} filas agregadas, ${rowsSkipped} omitidas`);
      
      // DEBUG: Mostrar muestra si se agregaron datos
      if (rowsAdded > 0) {
        const sample = allData[allData.length - 1];
        console.log(`     📦 Muestra: ${sample.id_item} - ${sample.descripcion?.substring(0, 30)}...`);
      }
    });
    
    console.log(`✅ Cargadas ${allData.length} piezas de ${workbook.SheetNames.length} hojas`);
    
    // Actualizar cache
    cachedData = allData;
    lastLoadTime = now;
    
    return allData;
    
  } catch (error) {
    console.error('❌ Error al cargar Excel:', error);
    throw new Error(`No se pudo cargar el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Extrae TIPO y FABRICANTE del nombre de una hoja
 * Soporta formatos:
 * - "NORMALIZADAS (A)" → TIPO: A, FABRICANTE: NORMALIZADAS
 * - "AJIKAWA (AC - HB)" → TIPO: AC, FABRICANTE: AJIKAWA HB
 * - "SADELMI (A)" → TIPO: A, FABRICANTE: SADELMI
 * - "TOMEXA (SM)" → TIPO: SM, FABRICANTE: TOMEXA
 */
function extractTipoFabricante(sheetName: string): [string, string] {
  // Patrón 1: "FABRICANTE (TIPO - SUBTIPO)" → Ej: AJIKAWA (AC - HB)
  let match = sheetName.match(/^([A-Z\s]+)\s*\(([A-Z]+)\s*-\s*([A-Z]+)\)$/i);
  if (match) {
    const fabricante = match[1].trim().toUpperCase();
    const tipo = match[2].trim().toUpperCase();
    const subtipo = match[3].trim().toUpperCase();
    return [tipo, `${fabricante} ${subtipo}`];
  }
  
  // Patrón 2: "FABRICANTE (TIPO)" → Ej: NORMALIZADAS (A), SADELMI (A)
  match = sheetName.match(/^([A-Z\s]+)\s*\(([A-Z0-9]+)\)$/i);
  if (match) {
    const fabricante = match[1].trim().toUpperCase();
    const tipo = match[2].trim().toUpperCase();
    return [tipo, fabricante];
  }
  
  // Patrón 3: "TIPO_FABRICANTE" → Ej: A_ISA
  match = sheetName.match(/^([A-Z]+)[_\-](.+)$/i);
  if (match) {
    return [match[1].trim().toUpperCase(), match[2].trim().toUpperCase()];
  }
  
  // Fallback: usar el nombre completo como TIPO y FABRICANTE
  console.warn(`⚠️ No se pudo extraer TIPO/FABRICANTE de "${sheetName}", usando nombre completo`);
  return [sheetName.toUpperCase(), sheetName.toUpperCase()];
}

/**
 * Normaliza valores de texto
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value).trim();
}

/**
 * Parsea valores numéricos
 */
function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Obtiene opciones únicas para cada campo según filtros aplicados
 */
export function getOptions(filters: Record<string, string>): Record<string, string[]> {
  const data = loadExcelData();
  
  console.log('\n🔍 getOptions - Filtros recibidos:', filters);
  
  const options: Record<string, string[]> = {
    TIPO: [],
    FABRICANTE: [],
    CABEZA: [],
    CUERPO: [],
    PARTE_DIVISION: [],
    TRAMO: []
  };
  
  // Filtrar datos según filtros activos
  let filteredData = data;
  
  if (filters.TIPO) {
    filteredData = filteredData.filter(p => p.tipo === filters.TIPO);
  }
  if (filters.FABRICANTE) {
    filteredData = filteredData.filter(p => p.fabricante === filters.FABRICANTE);
  }
  if (filters.CABEZA) {
    filteredData = filteredData.filter(p => p.cabeza === filters.CABEZA);
  }
  if (filters.CUERPO) {
    filteredData = filteredData.filter(p => p.cuerpo === filters.CUERPO);
  }
  if (filters.TRAMO) {
    filteredData = filteredData.filter(p => p.tramo === filters.TRAMO);
  }
  
  // Extraer valores únicos
  const uniqueValues = {
    TIPO: new Set<string>(),
    FABRICANTE: new Set<string>(),
    CABEZA: new Set<string>(),
    CUERPO: new Set<string>(),
    PARTE_DIVISION: new Set<string>(),
    TRAMO: new Set<string>()
  };
  
  filteredData.forEach(piece => {
    if (piece.tipo && piece.tipo !== '-') uniqueValues.TIPO.add(piece.tipo);
    if (piece.fabricante && piece.fabricante !== '-') uniqueValues.FABRICANTE.add(piece.fabricante);
    if (piece.cabeza && piece.cabeza !== '-') uniqueValues.CABEZA.add(piece.cabeza);
    if (piece.cuerpo && piece.cuerpo !== '-') uniqueValues.CUERPO.add(piece.cuerpo);
    if (piece.parte_division && piece.parte_division !== '-') uniqueValues.PARTE_DIVISION.add(piece.parte_division);
    if (piece.tramo && piece.tramo !== '-') uniqueValues.TRAMO.add(piece.tramo);
  });
  
  // Convertir Sets a arrays ordenados
  options.TIPO = Array.from(uniqueValues.TIPO).sort();
  options.FABRICANTE = Array.from(uniqueValues.FABRICANTE).sort();
  options.CABEZA = Array.from(uniqueValues.CABEZA).sort();
  options.CUERPO = Array.from(uniqueValues.CUERPO).sort();
  options.PARTE_DIVISION = Array.from(uniqueValues.PARTE_DIVISION).sort();
  options.TRAMO = Array.from(uniqueValues.TRAMO).sort();
  
  console.log('📊 Opciones encontradas:', Object.entries(options).map(([k, v]) => `${k}: ${v.length}`).join(', '));
  
  return options;
}

/**
 * Busca piezas según filtros
 */
export function searchPieces(filters: Record<string, string>): Piece[] {
  console.log('\n🔎 searchPieces - Filtros recibidos:', filters);
  
  let data = loadExcelData();
  
  // Aplicar filtros
  if (filters.tipo) {
    data = data.filter(p => p.tipo === filters.tipo);
  }
  if (filters.fabricante) {
    data = data.filter(p => p.fabricante === filters.fabricante);
  }
  if (filters.cabeza) {
    data = data.filter(p => p.cabeza === filters.cabeza);
  }
  if (filters.parte) {
    data = data.filter(p => p.parte_division === filters.parte);
  }
  if (filters.cuerpo) {
    data = data.filter(p => p.cuerpo === filters.cuerpo);
  }
  if (filters.tramo) {
    // Búsqueda case-insensitive para tramo
    const tramoLower = filters.tramo.toLowerCase();
    data = data.filter(p => p.tramo.toLowerCase() === tramoLower);
  }
  
  console.log(`✅ Encontradas ${data.length} piezas`);
  
  // Limitar resultados para evitar sobrecargar el cliente
  return data.slice(0, 500);
}

/**
 * Calcula materiales según partes seleccionadas
 */
export function calculateMaterials(
  filters: Record<string, string>,
  parts: Array<{ part: string; quantity: number }>
): { results: CalculatedPiece[]; totals: { total_pieces: number; total_weight: number } } {
  
  console.log('\n🧮 calculateMaterials');
  console.log('  Filtros:', filters);
  console.log('  Partes:', parts);
  
  let data = loadExcelData();
  
  // Aplicar filtros base
  if (filters.tipo) {
    data = data.filter(p => p.tipo === filters.tipo);
  }
  if (filters.fabricante) {
    data = data.filter(p => p.fabricante === filters.fabricante);
  }
  if (filters.cabeza) {
    data = data.filter(p => p.cabeza === filters.cabeza);
  }
  
  console.log(`  Total piezas base: ${data.length}`);
  
  const calculatedPieces: CalculatedPiece[] = [];
  
  // Procesar cada pieza
  data.forEach(piece => {
    const parteDiv = (piece.parte_division || '').trim().toUpperCase();
    if (!parteDiv || parteDiv === '-') return;
    
    const cantidadOriginal = piece.cantidad_x_torre || 0;
    let cantidadCalculada = 0;
    
    // Calcular cantidad según las partes seleccionadas
    for (const selectedPart of parts) {
      const partName = (selectedPart.part || '').trim().toUpperCase();
      const partQty = selectedPart.quantity || 0;
      
      if (parteDiv === partName) {
        const isDivPart = PARTS_DIV_2.has(parteDiv) || PARTS_DIV_4.has(parteDiv);
        
        if (isDivPart && cantidadOriginal === 1) {
          cantidadCalculada += cantidadOriginal * partQty;
        } else if (PARTS_DIV_2.has(parteDiv)) {
          cantidadCalculada += (cantidadOriginal * partQty) / 2;
        } else if (PARTS_DIV_4.has(parteDiv)) {
          cantidadCalculada += Math.ceil((cantidadOriginal * partQty) / 4);
        } else if (!isDivPart) {
          cantidadCalculada += cantidadOriginal * partQty;
        }
      }
    }
    
    // Solo agregar si hay cantidad calculada
    if (cantidadCalculada > 0) {
      const pesoUnitario = piece.peso_unitario || 0;
      const pesoTotal = cantidadCalculada * pesoUnitario;
      
      calculatedPieces.push({
        id_item: piece.id_item,
        texto_breve: piece.texto_breve,
        descripcion: piece.descripcion,
        parte_division: piece.parte_division,
        posicion: piece.posicion,
        cantidad_original: cantidadOriginal,
        cantidad_calculada: cantidadCalculada,
        peso_unitario: pesoUnitario,
        peso_total: pesoTotal,
        long_2_principal: piece.long_2_principal,
        plano: piece.plano,
        mod_plano: piece.mod_plano
      });
    }
  });
  
  // Calcular totales
  const totalPiezas = calculatedPieces.reduce((sum, p) => sum + p.cantidad_calculada, 0);
  const totalPeso = calculatedPieces.reduce((sum, p) => sum + p.peso_total, 0);
  
  console.log(`  ✅ Resultado: ${calculatedPieces.length} piezas calculadas`);
  console.log(`  📊 Totales: ${totalPiezas} piezas, ${totalPeso.toFixed(2)} kg`);
  
  return {
    results: calculatedPieces,
    totals: {
      total_pieces: totalPiezas,
      total_weight: totalPeso
    }
  };
}