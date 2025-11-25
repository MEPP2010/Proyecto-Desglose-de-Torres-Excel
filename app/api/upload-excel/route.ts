// app/api/upload-excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  console.log('\n🌐 API /api/upload-excel - REQUEST (POST)');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar que sea un archivo Excel
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, message: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      );
    }

    // Leer el archivo como buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar que el archivo sea un Excel válido
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { success: false, message: 'El archivo Excel no contiene hojas válidas' },
          { status: 400 }
        );
      }
      console.log(`✅ Archivo válido con ${workbook.SheetNames.length} hojas`);
    } catch (error) {
      console.error('❌ Error al validar Excel:', error);
      return NextResponse.json(
        { success: false, message: 'El archivo no es un Excel válido' },
        { status: 400 }
      );
    }

    // Definir rutas
    const dataDir = join(process.cwd(), 'data');
    const targetPath = join(dataDir, 'PROYECTO_DESGLOSE_TORRES_martin.xlsx');
    const backupPath = join(dataDir, `PROYECTO_DESGLOSE_TORRES_martin_backup_${Date.now()}.xlsx`);

    // Crear backup del archivo actual si existe
    if (existsSync(targetPath)) {
      try {
        renameSync(targetPath, backupPath);
        console.log(`📦 Backup creado: ${backupPath}`);
      } catch (error) {
        console.error('⚠️ No se pudo crear backup:', error);
        // Continuamos aunque falle el backup
      }
    }

    // Guardar el nuevo archivo
    try {
      writeFileSync(targetPath, buffer);
      console.log(`✅ Archivo guardado exitosamente: ${targetPath}`);
    } catch (error) {
      // Si falla, restaurar el backup
      if (existsSync(backupPath)) {
        renameSync(backupPath, targetPath);
        console.log('↩️ Backup restaurado debido a error');
      }
      throw error;
    }

    // Forzar recarga de datos (limpiando el caché)
    const { loadExcelData } = await import('@/lib/excel-database');
    const newData = loadExcelData(true);
    
    console.log(`✅ Datos recargados: ${newData.length} registros`);

    return NextResponse.json({
      success: true,
      message: 'Archivo actualizado exitosamente',
      stats: {
        totalRecords: newData.length,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ API /api/upload-excel - ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      },
      { status: 500 }
    );
  }
}