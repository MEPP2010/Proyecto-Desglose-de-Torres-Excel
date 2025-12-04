import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function buscarPlanoRecursivo(dir: string, nombrePlano: string): string | null {
  try {
    const archivos = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const archivo of archivos) {
      const rutaCompleta = path.join(dir, archivo.name);
      
      if (archivo.isDirectory()) {
        const resultado = buscarPlanoRecursivo(rutaCompleta, nombrePlano);
        if (resultado) return resultado;
      } else if (archivo.name === `${nombrePlano}.jpg` || archivo.name === `${nombrePlano}.JPG`) {
        const rutaRelativa = rutaCompleta
          .replace(path.join(process.cwd(), 'public'), '')
          .replace(/\\/g, '/');
        return rutaRelativa;
      }
    }
    return null;
  } catch (error) {
    console.error('Error en búsqueda recursiva:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const plano = searchParams.get('plano');

  if (!plano) {
    return NextResponse.json({ success: false, error: 'Parámetro "plano" requerido' }, { status: 400 });
  }

  const directorioPlanos = path.join(process.cwd(), 'public', 'planos');
  const rutaEncontrada = buscarPlanoRecursivo(directorioPlanos, plano);
  
  if (rutaEncontrada) {
    return NextResponse.json({ success: true, url: rutaEncontrada });
  } else {
    return NextResponse.json({ success: false, error: 'Plano no encontrado' }, { status: 404 });
  }
}