// components/TableHeaderPremium.tsx
'use client';

interface TableHeaderProps {
  columns: string[];
}

export default function TableHeaderPremium({ columns }: TableHeaderProps) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="relative">
        {/* Contenido de las columnas */}
        {columns.map((column, idx) => (
          <th 
            key={idx} 
            className="relative px-3 sm:px-4 py-3.5 sm:py-4 text-left group cursor-default bg-gradient-to-br from-[#001837] via-[#002856] to-[#00356e]"
          >
            {/* Separador vertical elegante con degradado */}
            {idx !== 0 && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-px">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/25 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff6600]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
            
            {/* Contenedor del texto con efectos */}
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* Punto decorativo */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6600] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_rgba(255,102,0,0.8)]"></div>
                
                {/* Texto de la columna */}
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-white relative">
                  {column}
                  
                  {/* Efecto de texto con sombra y brillo */}
                  <span className="absolute inset-0 text-[#ff6600] blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-300">
                    {column}
                  </span>
                </span>
                
                {/* Ícono de ordenamiento (decorativo) */}
                <svg 
                  className="w-3 h-3 text-white/30 group-hover:text-[#ff6600] transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:scale-110" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              
              {/* Línea animada inferior */}
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff6600] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-center"></div>
            </div>
            
            {/* Efecto de resplandor al hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/0 group-hover:from-white/5 group-hover:via-white/3 group-hover:to-white/0 transition-all duration-300 pointer-events-none"></div>
          </th>
        ))}
      </tr>
      
      {/* Barra decorativa inferior con animación */}
      <tr className="h-1 overflow-hidden">
        <td colSpan={columns.length} className="p-0 relative overflow-hidden bg-gradient-to-r from-[#cc5200] via-[#ff6600] to-[#cc5200]">
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          
          {/* Sombra superior */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </td>
      </tr>
      
      {/* Sombra difuminada debajo del header */}
      <tr className="h-2 overflow-hidden">
        <td colSpan={columns.length} className="p-0 bg-gradient-to-b from-[#003594]/20 via-[#003594]/5 to-transparent"></td>
      </tr>
    </thead>
  );
}