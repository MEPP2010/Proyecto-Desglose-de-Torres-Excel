// app/api/upload-excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
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

    // Subir a Vercel Blob Storage
    try {
      const blob = await put('PROYECTO_DESGLOSE_TORRES.xlsx', file, {
        access: 'public',
        addRandomSuffix: false, // Mantener el mismo nombre
      });
      
      console.log(`✅ Archivo subido a Blob Storage: ${blob.url}`);

      return NextResponse.json({
        success: true,
        message: 'Archivo actualizado exitosamente en Vercel Blob Storage',
        stats: {
          blobUrl: blob.url,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          uploadedAt: new Date().toISOString()
        }
      });
    } catch (blobError) {
      console.error('❌ Error al subir a Blob Storage:', blobError);
      return NextResponse.json(
        { success: false, message: `Error al subir el archivo: ${blobError instanceof Error ? blobError.message : 'Error desconocido'}` },
        { status: 500 }
      );
    }

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