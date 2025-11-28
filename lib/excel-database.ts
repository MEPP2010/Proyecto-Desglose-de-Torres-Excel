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
  hoja_origen: string;
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

// Sets para división de partes
export const PARTS_DIV_2 = new Set([
  'BGDA', 'BSUP', 'BMED', 'BINF', 'BDER', 'BIZQ', 'BSUP/MED'
]);

export const PARTS_DIV_4 = new Set([
  'PATA 0', 'PATA 0.0', 'PATA 1.5', 'PATA 3', 'PATA 3.0',
  'PATA 4.5', 'PATA 6', 'PATA 6.0', 'PATA 7.5', 'PATA 9', 'PATA 9.0'
]);

// ========================================
// 🔥 SISTEMA DE CACHE MEJORADO
// ========================================

let cachedData: Piece[] | null = null;
let lastLoadTime: number = 0;
let cacheVersion: number = 0; // Nueva versión de cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * ⭐ INVALIDA EL CACHE Y FUERZA RECARGA ⭐
 */
export function invalidateCache(): void {
  console.log('🗑️ Cache invalidado - se forzará recarga completa');
  cachedData = null;
  lastLoadTime = 0;
  cacheVersion++; // Incrementar versión para tracking
  console.log(`   📌 Nueva versión de cache: ${cacheVersion}`);
}

/**
 * Obtiene información del estado del cache
 */
export function getCacheInfo() {
  const now = Date.now();
  const timeInCache = cachedData ? now - lastLoadTime : 0;
  const isExpired = timeInCache > CACHE_TTL;
  
  return {
    hasCachedData: cachedData !== null,
    recordsCount: cachedData?.length || 0,
    cacheAge: Math.floor(timeInCache / 1000),
    cacheAgeMinutes: Math.floor(timeInCache / 60000),
    isExpired,
    timeToExpire: isExpired ? 0 : Math.floor((CACHE_TTL - timeInCache) / 1000),
    cacheVersion
  };
}

/**
 * ⭐⭐⭐ VERSIÓN ASYNC CON CACHE BUSTING ULTRA AGRESIVO ⭐⭐⭐
 * Esta es la versión que se debe usar en PRODUCCIÓN con Vercel Blob Storage
 */
export async function loadExcelDataAsync(forceReload = false): Promise<Piece[]> {
  const now = Date.now();
  
  // ✅ Solo usar cache si no ha expirado Y no se forzó recarga
  if (!forceReload && cachedData && (now - lastLoadTime) < CACHE_TTL) {
    console.log(`📦 Usando datos en caché (v${cacheVersion}, edad: ${Math.floor((now - lastLoadTime) / 1000)}s)`);
    return cachedData;
  }

  console.log(`📂 ${forceReload ? 'FORZANDO' : 'Iniciando'} carga de datos desde Excel...`);
  
  try {
    let fileBuffer: Buffer;
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    
    if (isProduction && process.env.EXCEL_BLOB_URL) {
      console.log('☁️ Cargando desde Vercel Blob Storage...');
      
      // ⭐⭐⭐ CACHE BUSTING ULTRA AGRESIVO ⭐⭐⭐
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 8);
      const cacheBuster = `?t=${timestamp}&r=${random}&v=${cacheVersion}&n=${nonce}&force=${forceReload ? '1' : '0'}`;
      const url = process.env.EXCEL_BLOB_URL + cacheBuster;
      
      console.log(`   📡 Descargando con cache-buster agresivo...`);
      console.log(`   🔗 URL: ${url.substring(0, 150)}...`);
      
      const response = await fetch(url, {
        // ⭐ Next.js cache options
        cache: 'no-store',
        next: { 
          revalidate: 0,  // ISR: revalidar inmediatamente
          tags: [`excel-data-v${cacheVersion}`] // Tag para invalidación
        },
        // ⭐ HTTP cache headers ultra agresivos
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, stale-while-revalidate=0, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': '0',
          'If-None-Match': '',
          'X-Vercel-No-Cache': '1', // Header específico de Vercel
          'X-Force-Reload': forceReload ? '1' : '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      const sizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
      console.log(`   ✅ Archivo descargado: ${sizeMB} MB`);
      
    } else {
      console.log('💻 Cargando desde archivo local (desarrollo)...');
      const excelPath = join(process.cwd(), 'data', 'PROYECTO_DESGLOSE_TORRES_martin.xlsx');
      fileBuffer = readFileSync(excelPath);
    }
    
    // Procesar el Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const allData: Piece[] = [];
    
    console.log(`   📊 Procesando ${workbook.SheetNames.length} hojas...`);
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        defval: ''
      }) as any[][];
      
      if (rawData.length === 0) return;
      
      let headerRowIndex = -1;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        const rowStr = row.join('|').toUpperCase();
        
        if (rowStr.includes('ID ITEM') || rowStr.includes('FABRICANTE') || 
            rowStr.includes('PARTE') || (rowStr.includes('TIPO') && rowStr.includes('CABEZA'))) {
          headerRowIndex = i;
          headers = row.map(cell => String(cell || '').trim());
          break;
        }
      }
      
      if (headerRowIndex === -1) return;
      
      const [tipo, fabricante] = extractTipoFabricante(sheetName);
      
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const rowArray = rawData[i];
        const row: any = {};
        headers.forEach((header, index) => {
          if (header) row[header] = rowArray[index] || '';
        });
        
        const getColumnValue = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            if (row[name] !== undefined) return row[name];
            const foundKey = Object.keys(row).find(k => 
              k.toLowerCase() === name.toLowerCase()
            );
            if (foundKey) return row[foundKey];
          }
          return '';
        };
        
        const piece: Piece = {
          id_item: normalizeValue(getColumnValue(['ID Item', 'IDItem', 'ID_Item', 'Material'])),
          texto_breve: normalizeValue(getColumnValue(['Texto breve del material', 'Texto breve', 'TextoBreve', 'Texto'])),
          tipo: tipo || normalizeValue(getColumnValue(['TIPO', 'Tipo', 'tipo'])),
          fabricante: fabricante || normalizeValue(getColumnValue(['FABRICANTE', 'Fabricante', 'fabricante'])),
          cabeza: normalizeValue(getColumnValue(['Cabeza', 'cabeza'])),
          parte_division: normalizeValue(getColumnValue(['Parte (Division)', 'Parte', 'Division', 'Parte_Division', 'Parte(Division)'])),
          cuerpo: normalizeValue(getColumnValue(['Cuerpo', 'cuerpo'])),
          tramo: normalizeValue(getColumnValue(['Tramo', 'tramo'])),
          posicion: normalizeValue(getColumnValue(['Posición', 'Posicion', 'posicion', 'Pos'])),
          descripcion: normalizeValue(getColumnValue(['Descripción', 'Descripcion', 'descripcion'])),
          long_2_principal: normalizeValue(getColumnValue(['Long 2 (Principal)', 'Long 2', 'Long2', 'Long_2', 'Long 2(Principal)'])),
          cantidad_x_torre: parseNumber(getColumnValue(['Cantidad x Torre', 'Cantidad', 'Cant x Torre', 'Cant', 'Cantidad Torre'])),
          peso_unitario: parseNumber(getColumnValue(['Peso Unitario', 'Peso', 'PesoUnitario', 'Peso Unit'])),
          plano: normalizeValue(getColumnValue(['PLANO', 'Plano', 'plano'])),
          mod_plano: normalizeValue(getColumnValue(['Mod Plano', 'ModPlano', 'Mod_Plano'])),
          hoja_origen: sheetName
        };
        
        const hasMinimumData = 
          (piece.id_item && piece.id_item !== '-') || 
          (piece.parte_division && piece.parte_division !== '-') ||
          (piece.descripcion && piece.descripcion !== '-' && piece.descripcion.length > 3);
        
        if (hasMinimumData) {
          allData.push(piece);
        }
      }
    });
    
    // ⭐ Actualizar cache con nueva data
    cachedData = allData;
    lastLoadTime = now;
    
    console.log(`   ✅ Carga completada: ${allData.length} registros`);
    console.log(`   📌 Cache actualizado (v${cacheVersion})\n`);
    
    return allData;
    
  } catch (error) {
    console.error('❌ Error al cargar Excel:', error);
    
    // Fallback: usar cache antiguo si existe
    if (cachedData && cachedData.length > 0) {
      console.warn('⚠️ Usando cache antiguo como fallback');
      return cachedData;
    }
    
    throw new Error(`No se pudo cargar el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Carga el archivo Excel (versión síncrona - solo desarrollo local)
 * ⚠️ NO USAR EN PRODUCCIÓN - usar loadExcelDataAsync
 */
export function loadExcelData(forceReload = false): Piece[] {
  const now = Date.now();
  
  if (!forceReload && cachedData && (now - lastLoadTime) < CACHE_TTL) {
    console.log('📦 Usando datos en caché');
    return cachedData;
  }

  console.log('📂 Cargando datos desde Excel (desarrollo local)...');
  
  try {
    const excelPath = join(process.cwd(), 'data', 'PROYECTO_DESGLOSE_TORRES_martin.xlsx');
    const fileBuffer = readFileSync(excelPath);
    
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const allData: Piece[] = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        defval: ''
      }) as any[][];
      
      if (rawData.length === 0) return;
      
      let headerRowIndex = -1;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        const rowStr = row.join('|').toUpperCase();
        
        if (rowStr.includes('ID ITEM') || rowStr.includes('FABRICANTE') || 
            rowStr.includes('PARTE') || (rowStr.includes('TIPO') && rowStr.includes('CABEZA'))) {
          headerRowIndex = i;
          headers = row.map(cell => String(cell || '').trim());
          break;
        }
      }
      
      if (headerRowIndex === -1) return;
      
      const [tipo, fabricante] = extractTipoFabricante(sheetName);
      
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const rowArray = rawData[i];
        const row: any = {};
        headers.forEach((header, index) => {
          if (header) row[header] = rowArray[index] || '';
        });
        
        const getColumnValue = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            if (row[name] !== undefined) return row[name];
            const foundKey = Object.keys(row).find(k => 
              k.toLowerCase() === name.toLowerCase()
            );
            if (foundKey) return row[foundKey];
          }
          return '';
        };
        
        const piece: Piece = {
          id_item: normalizeValue(getColumnValue(['ID Item', 'IDItem', 'ID_Item', 'Material'])),
          texto_breve: normalizeValue(getColumnValue(['Texto breve del material', 'Texto breve', 'TextoBreve', 'Texto'])),
          tipo: tipo || normalizeValue(getColumnValue(['TIPO', 'Tipo', 'tipo'])),
          fabricante: fabricante || normalizeValue(getColumnValue(['FABRICANTE', 'Fabricante', 'fabricante'])),
          cabeza: normalizeValue(getColumnValue(['Cabeza', 'cabeza'])),
          parte_division: normalizeValue(getColumnValue(['Parte (Division)', 'Parte', 'Division', 'Parte_Division', 'Parte(Division)'])),
          cuerpo: normalizeValue(getColumnValue(['Cuerpo', 'cuerpo'])),
          tramo: normalizeValue(getColumnValue(['Tramo', 'tramo'])),
          posicion: normalizeValue(getColumnValue(['Posición', 'Posicion', 'posicion', 'Pos'])),
          descripcion: normalizeValue(getColumnValue(['Descripción', 'Descripcion', 'descripcion'])),
          long_2_principal: normalizeValue(getColumnValue(['Long 2 (Principal)', 'Long 2', 'Long2', 'Long_2', 'Long 2(Principal)'])),
          cantidad_x_torre: parseNumber(getColumnValue(['Cantidad x Torre', 'Cantidad', 'Cant x Torre', 'Cant', 'Cantidad Torre'])),
          peso_unitario: parseNumber(getColumnValue(['Peso Unitario', 'Peso', 'PesoUnitario', 'Peso Unit'])),
          plano: normalizeValue(getColumnValue(['PLANO', 'Plano', 'plano'])),
          mod_plano: normalizeValue(getColumnValue(['Mod Plano', 'ModPlano', 'Mod_Plano'])),
          hoja_origen: sheetName
        };
        
        const hasMinimumData = 
          (piece.id_item && piece.id_item !== '-') || 
          (piece.parte_division && piece.parte_division !== '-') ||
          (piece.descripcion && piece.descripcion !== '-' && piece.descripcion.length > 3);
        
        if (hasMinimumData) {
          allData.push(piece);
        }
      }
    });
    
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
 */
function extractTipoFabricante(sheetName: string): [string, string] {
  let match = sheetName.match(/^([A-Z\s]+)\s*\(([A-Z]+)\s*-\s*([A-Z]+)\)$/i);
  if (match) {
    const fabricante = match[1].trim().toUpperCase();
    const tipo = match[2].trim().toUpperCase();
    const subtipo = match[3].trim().toUpperCase();
    return [tipo, `${fabricante} ${subtipo}`];
  }
  
  match = sheetName.match(/^([A-Z\s]+)\s*\(([A-Z0-9]+)\)$/i);
  if (match) {
    const fabricante = match[1].trim().toUpperCase();
    const tipo = match[2].trim().toUpperCase();
    return [tipo, fabricante];
  }
  
  match = sheetName.match(/^([A-Z]+)[_\-](.+)$/i);
  if (match) {
    return [match[1].trim().toUpperCase(), match[2].trim().toUpperCase()];
  }
  
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
  
  let filteredData = data;
  
  if (filters.TIPO) filteredData = filteredData.filter(p => p.tipo === filters.TIPO);
  if (filters.FABRICANTE) filteredData = filteredData.filter(p => p.fabricante === filters.FABRICANTE);
  if (filters.CABEZA) filteredData = filteredData.filter(p => p.cabeza === filters.CABEZA);
  if (filters.CUERPO) filteredData = filteredData.filter(p => p.cuerpo === filters.CUERPO);
  if (filters.TRAMO) filteredData = filteredData.filter(p => p.tramo === filters.TRAMO);
  
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
  
  return {
    TIPO: Array.from(uniqueValues.TIPO).sort(),
    FABRICANTE: Array.from(uniqueValues.FABRICANTE).sort(),
    CABEZA: Array.from(uniqueValues.CABEZA).sort(),
    CUERPO: Array.from(uniqueValues.CUERPO).sort(),
    PARTE_DIVISION: Array.from(uniqueValues.PARTE_DIVISION).sort(),
    TRAMO: Array.from(uniqueValues.TRAMO).sort()
  };
}

/**
 * Busca piezas según filtros
 */
export function searchPieces(filters: Record<string, string>): Piece[] {
  let data = loadExcelData();
  
  if (filters.tipo) data = data.filter(p => p.tipo === filters.tipo);
  if (filters.fabricante) data = data.filter(p => p.fabricante === filters.fabricante);
  if (filters.cabeza) data = data.filter(p => p.cabeza === filters.cabeza);
  if (filters.parte) data = data.filter(p => p.parte_division === filters.parte);
  if (filters.cuerpo) data = data.filter(p => p.cuerpo === filters.cuerpo);
  if (filters.tramo) {
    const tramoLower = filters.tramo.toLowerCase();
    data = data.filter(p => p.tramo.toLowerCase() === tramoLower);
  }
  
  return data.slice(0, 500);
}

/**
 * Calcula materiales según partes seleccionadas
 */
export function calculateMaterials(
  filters: Record<string, string>,
  parts: Array<{ part: string; quantity: number }>
): { results: CalculatedPiece[]; totals: { total_pieces: number; total_weight: number } } {
  
  let data = loadExcelData();
  
  if (filters.tipo) data = data.filter(p => p.tipo === filters.tipo);
  if (filters.fabricante) data = data.filter(p => p.fabricante === filters.fabricante);
  if (filters.cabeza) data = data.filter(p => p.cabeza === filters.cabeza);
  if (filters.cuerpo) data = data.filter(p => p.cuerpo === filters.cuerpo);
  
  const calculatedPieces: CalculatedPiece[] = [];
  
  data.forEach(piece => {
    const parteDiv = (piece.parte_division || '').trim().toUpperCase();
    if (!parteDiv || parteDiv === '-') return;
    
    const cantidadOriginal = piece.cantidad_x_torre || 0;
    let cantidadCalculada = 0;
    
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
  
  const totalPiezas = calculatedPieces.reduce((sum, p) => sum + p.cantidad_calculada, 0);
  const totalPeso = calculatedPieces.reduce((sum, p) => sum + p.peso_total, 0);
  
  return {
    results: calculatedPieces,
    totals: {
      total_pieces: totalPiezas,
      total_weight: totalPeso
    }
  };
}

// ========== FUNCIONES ASYNC ==========

export async function searchPiecesAsync(filters: Record<string, string>): Promise<Piece[]> {
  let data = await loadExcelDataAsync();
  
  if (filters.tipo) data = data.filter(p => p.tipo === filters.tipo);
  if (filters.fabricante) data = data.filter(p => p.fabricante === filters.fabricante);
  if (filters.cabeza) data = data.filter(p => p.cabeza === filters.cabeza);
  if (filters.parte) data = data.filter(p => p.parte_division === filters.parte);
  if (filters.cuerpo) data = data.filter(p => p.cuerpo === filters.cuerpo);
  if (filters.tramo) {
    const tramoLower = filters.tramo.toLowerCase();
    data = data.filter(p => p.tramo.toLowerCase() === tramoLower);
  }
  
  return data.slice(0, 500);
}

export async function getOptionsAsync(filters: Record<string, string>): Promise<Record<string, string[]>> {
  const data = await loadExcelDataAsync();
  
  let filteredData = data;
  
  if (filters.TIPO) filteredData = filteredData.filter(p => p.tipo === filters.TIPO);
  if (filters.FABRICANTE) filteredData = filteredData.filter(p => p.fabricante === filters.FABRICANTE);
  if (filters.CABEZA) filteredData = filteredData.filter(p => p.cabeza === filters.CABEZA);
  if (filters.CUERPO) filteredData = filteredData.filter(p => p.cuerpo === filters.CUERPO);
  if (filters.TRAMO) filteredData = filteredData.filter(p => p.tramo === filters.TRAMO);
  
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
  
  return {
    TIPO: Array.from(uniqueValues.TIPO).sort(),
    FABRICANTE: Array.from(uniqueValues.FABRICANTE).sort(),
    CABEZA: Array.from(uniqueValues.CABEZA).sort(),
    CUERPO: Array.from(uniqueValues.CUERPO).sort(),
    PARTE_DIVISION: Array.from(uniqueValues.PARTE_DIVISION).sort(),
    TRAMO: Array.from(uniqueValues.TRAMO).sort()
  };
}

export async function calculateMaterialsAsync(
  filters: Record<string, string>,
  parts: Array<{ part: string; quantity: number }>
): Promise<{ results: CalculatedPiece[]; totals: { total_pieces: number; total_weight: number } }> {
  
  let data = await loadExcelDataAsync();
  
  if (filters.tipo) data = data.filter(p => p.tipo === filters.tipo);
  if (filters.fabricante) data = data.filter(p => p.fabricante === filters.fabricante);
  if (filters.cabeza) data = data.filter(p => p.cabeza === filters.cabeza);
  if (filters.cuerpo) data = data.filter(p => p.cuerpo === filters.cuerpo); 
  
  const calculatedPieces: CalculatedPiece[] = [];
  
  data.forEach(piece => {
    const parteDiv = (piece.parte_division || '').trim().toUpperCase();
    if (!parteDiv || parteDiv === '-') return;
    
    const cantidadOriginal = piece.cantidad_x_torre || 0;
    let cantidadCalculada = 0;
    
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
  
  const totalPiezas = calculatedPieces.reduce((sum, p) => sum + p.cantidad_calculada, 0);
  const totalPeso = calculatedPieces.reduce((sum, p) => sum + p.peso_total, 0);
  
  return {
    results: calculatedPieces,
    totals: {
      total_pieces: totalPiezas,
      total_weight: totalPeso
    }
  };
}