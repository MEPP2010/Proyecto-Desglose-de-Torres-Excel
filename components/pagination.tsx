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
    const maxPagesToShow = 5; // Reducido para diseño más compacto

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="w-full space-y-3">
      
      {/* Barra superior: Información de resultados */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 text-xs text-gray-600">
        
        {/* Contador de resultados - Estilo sutil */}
        <div className="flex items-center gap-2">
          <span className="text-white">Mostrando</span>
          <span className="font-semibold text-[#003594]">{startItem}-{endItem}</span>
          <span className="text-white">de</span>
          <span className="font-semibold text-[#003594]">{totalItems}</span>
          <span className="text-white">resultados</span>
        </div>
        
        {/* Selector de items por página - Más compacto */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-white">Por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-[#003594] focus:outline-none focus:border-[#003594] focus:ring-1 focus:ring-[#003594] transition-colors"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Barra inferior: Controles de navegación - Diseño minimalista */}
      <div className="flex items-center justify-center gap-1">
        
        {/* Botón Primera Página - Más pequeño */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-1.5 rounded text-xs transition-all ${
            currentPage === 1
              ? 'text-white cursor-not-allowed'
              : 'text-gray-600 hover:text-[#003594] hover:bg-gray-100'
          }`}
          title="Primera página"
        >
          ⟪
        </button>

        {/* Botón Anterior - Compacto */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 py-1 rounded text-xs transition-all ${
            currentPage === 1
              ? 'text-white cursor-not-allowed'
              : 'text-white hover:text-[#003594] hover:bg-gray-100'
          }`}
        >
          ‹ Anterior
        </button>

        {/* Números de página - Diseño minimalista */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-white text-xs">
                ···
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[28px] h-10 px-7 rounded text-xs font-medium transition-all ${
                  currentPage === page
                    ? 'bg-[#003594] text-white shadow-sm'
                    : 'text-white hover:bg-gray-100 hover:text-[#003594]'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Botón Siguiente - Compacto */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-6 py-1 rounded text-xs transition-all ${
            currentPage === totalPages
              ? 'text-white cursor-not-allowed'
              : 'text-white hover:text-[#003594] hover:bg-gray-100'
          }`}
        >
          Siguiente ›
        </button>

        {/* Botón Última Página - Más pequeño */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded text-xs transition-all ${
            currentPage === totalPages
              ? 'text-white cursor-not-allowed'
              : 'text-white hover:text-[#003594] hover:bg-gray-100'
          }`}
          title="Última página"
        >
          ⟫
        </button>
      </div>
    </div>
  );
}