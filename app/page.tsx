// app/page.tsx - VERSIÓN CON TANSTACK QUERY
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlanoViewer, { usePlanoViewer } from '@/components/PlanoViewer';
import UploadExcelModal from '@/components/UploadExcelModal';
import Pagination from '@/components/pagination';
import TableHeaderPremium from '@/components/TableHeaderPremium';
import indicePlanos from '@/public/indice-planos.json';
import { useOptions, useSearchPieces } from '@/hooks/useApiQueries';

interface Piece {
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
}

export default function BuscadorPage() {
  const [filters, setFilters] = useState({
    tipo: '',
    fabricante: '',
    cabeza: '',
    parte: '',
    cuerpo: '',
    tramo: ''
  });
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false); // Control manual de búsqueda

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Hook para el visualizador de planos
  const { isOpen, planoUrl, planoName, openViewer, closeViewer } = usePlanoViewer();

  // 🔥 TANSTACK QUERY: Cargar opciones automáticamente
  const { 
    data: options, 
    isLoading: optionsLoading,
    error: optionsError 
  } = useOptions(filters);

  // 🔥 TANSTACK QUERY: Buscar piezas (solo cuando searchEnabled = true)
  const {
    data: results = [],
    isLoading: searchLoading,
    error: searchError,
    isFetching: searchFetching
  } = useSearchPieces(filters, searchEnabled);

  // Resetear a página 1 cuando cambien los resultados
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length, itemsPerPage]);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setSearchEnabled(false); // Resetear búsqueda al cambiar filtros
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEnabled(true); // Activar búsqueda
  };

  const handleViewPlano = (plano: string, modPlano: string, itemId: string) => {
    if (!plano || plano === '-') {
      alert('⚠️ Este ítem no tiene un plano asociado');
      return;
    }

    const planoUrl = indicePlanos[plano as keyof typeof indicePlanos];
    
    if (planoUrl) {
      const planoTitle = `${itemId} - ${plano}${modPlano && modPlano !== '-' ? ` (Mod: ${modPlano})` : ''}`;
      openViewer(planoUrl, planoTitle);
    } else {
      alert(`⚠️ No se encontró el plano "${plano}.jpg"`);
    }
  }; 

  const handleUploadSuccess = () => {
    // TanStack Query invalidará automáticamente el caché
    // No necesitamos reload manual
    setUploadModalOpen(false);
  };

  // Mensaje de estado
  const getMessage = () => {
    if (searchLoading || searchFetching) return '⏳ Buscando materiales...';
    if (searchError) return `❌ Error: ${searchError.message}`;
    if (searchEnabled && results.length > 0) return `✅ ${results.length} piezas encontradas`;
    if (searchEnabled && results.length === 0) return '⚠️ No se encontraron resultados';
    return 'Seleccione filtros y presione Buscar';
  };

  // Calcular datos paginados
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen flex flex-col items-center w-full">
      
      {/* --- CONTENEDOR PRINCIPAL LIQUID GLASS --- */}
      <div className="w-full max-w-7xl glass-container rounded-3xl p-6 sm:p-10 mt-4 mb-20 relative z-20 animate-slide-up">
        
        {/* Header con título y botones */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b border-gray-200/50 pb-6 gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-[#001837] via-[#002856] to-[#00356e] bg-clip-text text-transparent tracking-tight drop-shadow-sm">
              Buscador de Materiales
            </h1>
            <p className="text-gray-600 font-medium mt-2 text-lg">Sistema inteligente de gestión de torres de transmisión</p>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            {/* Botón Actualizar Desglose */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn-shine bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
            >
              <span className="text-xl">📤</span>
              <span>Actualizar BD</span>
            </button>

            {/* Botón Calculadora */}
            <Link
              href="/calculadora"
              className="btn-shine bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e65c00] hover:to-[#ff6600] text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
            >
              <span>Calculadora</span>
              <span className="group-hover:translate-x-1 transition-transform">➡️</span>
            </Link>
          </div>
        </div>

        {/* Panel de Filtros (Glass Card) */}
        <form onSubmit={handleSearch} className="glass-card p-8 rounded-2xl mb-8">
          {optionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003594]"></div>
              <span className="ml-4 text-gray-600">Cargando opciones...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
                <FilterSelect 
                  label="TIPO" 
                  value={filters.tipo} 
                  options={options?.TIPO || []} 
                  onChange={(v) => handleFilterChange('tipo', v)} 
                />
                <FilterSelect 
                  label="FABRICANTE" 
                  value={filters.fabricante} 
                  options={options?.FABRICANTE || []} 
                  onChange={(v) => handleFilterChange('fabricante', v)} 
                />
                <FilterSelect 
                  label="CABEZA" 
                  value={filters.cabeza} 
                  options={options?.CABEZA || []} 
                  onChange={(v) => handleFilterChange('cabeza', v)} 
                />
                <FilterSelect 
                  label="PARTE" 
                  value={filters.parte} 
                  options={options?.PARTE_DIVISION || []} 
                  onChange={(v) => handleFilterChange('parte', v)} 
                />
                <FilterSelect 
                  label="CUERPO" 
                  value={filters.cuerpo} 
                  options={options?.CUERPO || []} 
                  onChange={(v) => handleFilterChange('cuerpo', v)} 
                />
                <FilterSelect 
                  label="TRAMO" 
                  value={filters.tramo} 
                  options={options?.TRAMO || []} 
                  onChange={(v) => handleFilterChange('tramo', v)} 
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="btn-shine w-full md:w-1/3 py-4 px-8 bg-gradient-to-br from-[#001837] via-[#002856] to-[#00356e] text-white font-bold rounded-xl transition duration-300 shadow-lg hover:shadow-blue-900/40 disabled:opacity-50 flex justify-center items-center gap-3 text-lg"
                >
                  {searchLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Buscando...
                    </>
                  ) : (
                    <>🔍 Buscar Desglose</>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Mensaje de Estado */}
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className={`h-4 w-4 rounded-full shadow-inner ${
            getMessage().includes('✅') ? 'bg-green-500' : 
            getMessage().includes('❌') ? 'bg-red-500' : 
            (searchLoading || searchFetching) ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-400'
          }`}></div>
          <p className="font-semibold text-gray-800 text-lg drop-shadow-sm">{getMessage()}</p>
        </div>

        {/* Tabla de Resultados (Semi-transparente) */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/50">
          <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200/50">
                <TableHeaderPremium
                columns={[
                  'Material', 'Texto Breve', 'Tipo', 'Fabricante', 'Cabeza',
                  'Parte', 'Cuerpo', 'Tramo', 'Pos.', 'Descripción',
                  'Long 2', 'Cant.', 'Peso U.', 'Plano', 'Acción'
                ]}
              />
              <tbody className="divide-y divide-gray-200/40">
                {currentResults.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-6 py-12 text-center text-gray-500 font-medium italic bg-white/40">
                      {searchEnabled ? 'No hay resultados para mostrar. Ajusta los filtros arriba.' : 'Presiona "Buscar Desglose" para ver resultados'}
                    </td>
                  </tr>
                ) : (
                  currentResults.map((piece, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/60 transition duration-150 group bg-white/20 odd:bg-white/10">
                      <td className="px-4 py-3 text-sm font-bold text-[#003594]">{piece.id_item || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{piece.texto_breve || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.fabricante}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.cabeza}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.parte_division}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.cuerpo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.tramo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{piece.posicion}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[200px]" title={piece.descripcion}>{piece.descripcion}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.long_2_principal}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-bold bg-white/30 text-center rounded">{piece.cantidad_x_torre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {piece.peso_unitario ? `${Number(piece.peso_unitario).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{piece.plano || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {piece.plano && piece.plano !== '-' ? (
                          <button
                            onClick={() => handleViewPlano(piece.plano, piece.mod_plano, piece.id_item)}
                            className="bg-blue-100/80 hover:bg-[#003594] text-[#003594] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border border-blue-200"
                          >
                            VER PLANO
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs select-none opacity-50">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {results.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={results.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              itemsPerPageOptions={[10, 25, 50, 100, 200]}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      <UploadExcelModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Visualizador Modal */}
      {isOpen && (
        <PlanoViewer
          planoUrl={planoUrl}
          planoName={planoName}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col group">
      <label className="mb-2 text-xs font-bold bg-gradient-to-br from-[#001837] via-[#002856] to-[#00356e] bg-clip-text text-transparent tracking-tight uppercase group-hover:text-[#ff6600] transition-colors">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input p-3 w-full rounded-xl text-sm font-small text-gray-700 outline-none cursor-pointer"
      >
        <option value="">Todos</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}