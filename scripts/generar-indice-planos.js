const fs = require('fs');
const path = require('path');

function obtenerTodosLosPlanos(dir, base = '') {
  const planos = {};
  
  if (!fs.existsSync(dir)) {
    console.log('⚠️ Directorio de planos no existe:', dir);
    return planos;
  }

  const archivos = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const archivo of archivos) {
    const rutaCompleta = path.join(dir, archivo.name);
    const rutaRelativa = path.join(base, archivo.name);
    
    if (archivo.isDirectory()) {
      Object.assign(planos, obtenerTodosLosPlanos(rutaCompleta, rutaRelativa));
    } else if (archivo.name.toLowerCase().endsWith('.jpg')) {
      const nombre = archivo.name.replace(/\.(jpg|JPG)$/, '');
      planos[nombre] = `/planos/${rutaRelativa.replace(/\\/g, '/')}`;
    }
  }
  
  return planos;
}

const directorioPlanos = path.join(__dirname, '..', 'public', 'planos');
const indice = obtenerTodosLosPlanos(directorioPlanos);

const outputPath = path.join(__dirname, '..', 'public', 'indice-planos.json');
fs.writeFileSync(outputPath, JSON.stringify(indice, null, 2));

console.log(`✅ Índice generado con ${Object.keys(indice).length} planos`);