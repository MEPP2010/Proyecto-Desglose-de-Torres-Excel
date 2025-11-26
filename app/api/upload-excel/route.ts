// app/api/upload-excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar extensión
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, message: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      );
    }

    // Validar contenido Excel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { success: false, message: 'El archivo Excel no contiene hojas válidas' },
        { status: 400 }
      );
    }

    // Subir a Blob Storage
    const blob = await put('PROYECTO_DESGLOSE_TORRES.xlsx', file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log(`✅ Archivo subido: ${blob.url}`);

    // Guardar URL en variable de entorno o base de datos
    // Para persistir entre deploys, usa KV o base de datos
    process.env.EXCEL_BLOB_URL = blob.url;

    return NextResponse.json({
      success: true,
      message: 'Archivo actualizado exitosamente',
      stats: {
        blobUrl: blob.url,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      },
      { status: 500 }
    );
  }
}