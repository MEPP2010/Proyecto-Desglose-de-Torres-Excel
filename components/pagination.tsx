'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemsPerPageOptions?: number[];
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  onItemsPerPageChange
}: PaginationProps) {
  
  // Calcular rango de items mostrados
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar array de páginas a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7; // Número máximo de botones de página a mostrar

    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // En el medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50">
      
      {/* Información de items mostrados */}
      <div className="flex items-center gap-4 text-sm text-gray-700 font-medium">
        <span>
          Mostrando <span className="font-bold text-[#003594]">{startItem}</span> - 
          <span className="font-bold text-[#003594]"> {endItem}</span> de 
          <span className="font-bold text-[#003594]"> {totalItems}</span> resultados
        </span>
        
        {/* Selector de items por página */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Items por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="glass-input px-3 py-1.5 rounded-lg text-sm font-semibold text-[#003594] border border-gray-200 cursor-pointer"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        
        {/* Botón Primera Página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg font-bold transition-all duration-200 ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white/80 text-[#003594] hover:bg-[#003594] hover:text-white border border-gray-200 hover:border-[#003594] shadow-sm'
          }`}
          title="Primera página"
        >
          ⏮️
        </button>

        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white/80 text-[#003594] hover:bg-[#003594] hover:text-white border border-gray-200 hover:border-[#003594] shadow-sm'
          }`}
        >
          ◀ Anterior
        </button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 font-bold">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-[#003594] text-white shadow-lg scale-110 border-2 border-[#003594]'
                    : 'bg-white/80 text-[#003594] hover:bg-[#003594] hover:text-white border border-gray-200 hover:border-[#003594] shadow-sm hover:scale-105'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Indicador de página actual en móvil */}
        <div className="sm:hidden px-4 py-2 bg-[#003594] text-white font-bold rounded-lg shadow-lg">
          {currentPage} / {totalPages}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white/80 text-[#003594] hover:bg-[#003594] hover:text-white border border-gray-200 hover:border-[#003594] shadow-sm'
          }`}
        >
          Siguiente ▶
        </button>

        {/* Botón Última Página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg font-bold transition-all duration-200 ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white/80 text-[#003594] hover:bg-[#003594] hover:text-white border border-gray-200 hover:border-[#003594] shadow-sm'
          }`}
          title="Última página"
        >
          ⏭️
        </button>
      </div>
    </div>
  );
}