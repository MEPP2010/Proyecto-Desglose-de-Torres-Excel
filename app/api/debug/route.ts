import { NextRequest, NextResponse } from 'next/server';
import { loadExcelData } from '@/lib/excel-database';

export async function GET() {
  console.log('\n🌐 API /api/debug - REQUEST');
  
  try {
    const data = loadExcelData(true); // Force reload
    
    // Obtener una muestra
    const sample = data[0];
    
    // Estadísticas
    const uniqueParts = new Set(data.map(p => p.parte_division));
    const uniqueTipos = new Set(data.map(p => p.tipo));
    const uniqueFabricantes = new Set(data.map(p => p.fabricante));
    const uniqueHojas = new Set(data.map(p => p.hoja_origen));
    
    console.log('📊 Estadísticas:');
    console.log(`  - Total documentos: ${data.length}`);
    console.log(`  - Partes únicas: ${uniqueParts.size}`);
    console.log(`  - Tipos únicos: ${uniqueTipos.size}`);
    console.log(`  - Fabricantes únicos: ${uniqueFabricantes.size}`);
    console.log(`  - Hojas procesadas: ${uniqueHojas.size}`);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalDocuments: data.length,
        uniqueParts: uniqueParts.size,
        uniqueTipos: uniqueTipos.size,
        uniqueFabricantes: uniqueFabricantes.size,
        uniqueHojas: uniqueHojas.size,
        parts: Array.from(uniqueParts),
        tipos: Array.from(uniqueTipos),
        fabricantes: Array.from(uniqueFabricantes),
        hojas: Array.from(uniqueHojas)
      },
      fieldNames: sample ? Object.keys(sample) : [],
      sample: sample
    });
  } catch (error) {
    console.error('❌ API /api/debug - ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    }, { status: 500 });
  }
}