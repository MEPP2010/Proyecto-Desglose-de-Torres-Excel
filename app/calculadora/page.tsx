'use client';

import { useState, useEffect } from 'react';
import PlanoViewer, { usePlanoViewer } from '@/components/PlanoViewer';
import Pagination from '@/components/pagination';
import indicePlanos from '@/public/indice-planos.json';

// --- Interfaces ---

interface CalculatedPiece {
  id_item: string;
  texto_breve: string;
  descripcion: string;
  parte_division: string;
  posicion: string;
  cantidad_original: number;
  cantidad_calculada: number;
  peso_unitario: number;
  peso_total: number;
  long_2_principal: string;
  plano: string;
  mod_plano: string;
}

interface FilterOptions {
  TIPO: string[];
  FABRICANTE: string[];
  CABEZA: string[];
  CUERPO: string[];
  PARTE_DIVISION: string[];
}

interface SelectedPart {
  part: string;
  quantity: number;
  selected: boolean;
}

// --- Componente Principal ---

export default function CalculadoraPage() {
  const [filters, setFilters] = useState({
    tipo: '',
    fabricante: '',
    cabeza: '',
    cuerpo: ''
  });
  
  const [options, setOptions] = useState<FilterOptions>({
    TIPO: [],
    FABRICANTE: [],
    CABEZA: [],
    CUERPO: [],
    PARTE_DIVISION: []
  });
  
  const [parts, setParts] = useState<Record<string, SelectedPart>>({});
  const [results, setResults] = useState<CalculatedPiece[]>([]);
  const [totals, setTotals] = useState({ total_pieces: 0, total_weight: 0 });
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState('');
  const [partsMessage, setPartsMessage] = useState('Selecciona TIPO y FABRICANTE para ver las partes disponibles...');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Hook para el visualizador de planos
  const { isOpen, planoUrl, planoName, openViewer, closeViewer } = usePlanoViewer();

  useEffect(() => {
    loadOptions();
  }, [filters.tipo, filters.fabricante, filters.cabeza, filters.cuerpo]);

  useEffect(() => {
    if (!filters.tipo || !filters.fabricante) {
      setPartsMessage('Selecciona TIPO y FABRICANTE para ver las partes disponibles...');
      setParts({});
    } else if (options.PARTE_DIVISION.length === 0) {
      setPartsMessage('No hay partes disponibles para esta configuración. Revisa los filtros.');
    } else {
      setPartsMessage('');
    }
  }, [filters.tipo, filters.fabricante, options.PARTE_DIVISION]);

  // Resetear a página 1 cuando cambien los resultados
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length, itemsPerPage]);

  const loadOptions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.tipo) params.append('TIPO', filters.tipo);
      if (filters.fabricante) params.append('FABRICANTE', filters.fabricante);
      if (filters.cabeza) params.append('CABEZA', filters.cabeza);
      if (filters.cuerpo) params.append('CUERPO', filters.cuerpo);

      const response = await fetch(`/api/options?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOptions(data.options);
          updatePartsList(data.options.PARTE_DIVISION);
        }
      }
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const updatePartsList = (availableParts: string[]) => {
    if (availableParts && availableParts.length > 0) {
      const newParts: Record<string, SelectedPart> = {};
      availableParts.forEach((partName: string) => {
        const existingPart = parts[partName]; 
        newParts[partName] = {
          part: partName,
          quantity: existingPart ? existingPart.quantity : 1,
          selected: existingPart ? existingPart.selected : false
        };
      });
      setParts(newParts);
    } else {
      setParts({}); 
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    let newFilters = { ...filters, [field]: value };
    if (field === 'tipo') {
      newFilters = { ...newFilters, fabricante: '', cabeza: '', cuerpo: '' };
    } else if (field === 'fabricante') {
      newFilters = { ...newFilters, cabeza: '', cuerpo: '' };
    } else if (field === 'cabeza') {
      newFilters = { ...newFilters, cuerpo: '' };
    }
    
    setFilters(newFilters);
  };

  const togglePart = (partName: string) => {
    setParts(prev => ({
      ...prev,
      [partName]: {
        ...prev[partName],
        selected: !prev[partName].selected
      }
    }));
  };

  const updateQuantity = (partName: string, quantity: number) => {
    setParts(prev => ({
      ...prev,
      [partName]: {
        ...prev[partName],
        quantity: Math.max(1, quantity)
      }
    }));
  };

  const handleCalculate = async () => {
    const selectedParts = Object.values(parts).filter(p => p.selected);
    
    if (selectedParts.length === 0) {
      showModal('⚠️ Por favor selecciona al menos una parte de la torre');
      return;
    }
    
    if (!filters.tipo || !filters.fabricante) {
      showModal('⚠️ Por favor completa al menos TIPO Y FABRICANTE');
      return;
    }
    
    setShowResults(true);
    setMessage('⏳ Calculando materiales...');
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            tipo: filters.tipo,
            fabricante: filters.fabricante,
            cabeza: filters.cabeza,
            cuerpo: filters.cuerpo
          },
          parts: selectedParts.map(p => ({ part: p.part, quantity: p.quantity }))
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.results);
          setTotals(data.totals);
          setMessage(`✅ ${data.results.length} piezas diferentes encontradas`);
        } else {
          setMessage(`❌ Error: ${data.message}`);
        }
      } else {
        throw new Error("API Error");
      }
    } catch (error) {
      setMessage(`🚨 Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleReset = () => {
    setFilters({ tipo: '', fabricante: '', cabeza: '', cuerpo: '' });
    setParts({});
    setResults([]);
    setShowResults(false);
    setTimeout(() => loadOptions(), 0);
  };

  const exportToExcel = () => {
    if (results.length === 0) {
      showModal('⚠️ No hay datos para exportar');
      return;
    }
    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"></head>
    <body>
      <table>
        <thead>
          <tr>
            <th>Material</th><th>Texto Breve</th><th>Descripción</th><th>Parte</th><th>Posición</th>
            <th>Cant. Original</th><th>Cant. Calculada</th><th>Peso Unitario</th><th>Peso Total</th>
            <th>Long 2</th><th>Plano</th><th>Mod Plano</th>
          </tr>
        </thead>
        <tbody>
  `;
  results.forEach(piece => {
    html += `
      <tr>
        <td>${piece.id_item || '-'}</td><td>${piece.texto_breve || '-'}</td>
        <td>${piece.descripcion || '-'}</td><td>${piece.parte_division || '-'}</td>
        <td>${piece.posicion || '-'}</td><td>${piece.cantidad_original || 0}</td>
        <td>${piece.cantidad_calculada || 0}</td><td>${(piece.peso_unitario || 0).toFixed(2)}</td>
        <td>${(piece.peso_total || 0).toFixed(2)}</td><td>${piece.long_2_principal || '-'}</td>
        <td>${piece.plano || '-'}</td><td>${piece.mod_plano || '-'}</td>
      </tr>`;
  });
  html += `</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `materiales_torre_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
  URL.revokeObjectURL(url);
  };

  const showModal = (msg: string) => {
    alert(msg);
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

  // Calcular datos paginados
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave hacia la tabla
    document.querySelector('.glass-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center relative z-10 w-full">
      
      {/* Contenedor Glassmorphism Principal */}
      <div className="w-full max-w-[1600px] glass-container p-6 sm:p-8 rounded-3xl mb-20 animate-slide-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-200/50 pb-6 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-[#003594] mb-2 drop-shadow-sm">
              🔧 Calculadora de Materiales
            </h1>
            <p className="text-gray-700 font-medium text-lg">
              Selecciona las partes de la torre y calcula los materiales.
            </p>
          </div>
          <a 
            href="/" 
            className="flex items-center gap-2 text-[#003594] hover:text-[#ff6600] font-bold transition-all bg-white/50 hover:bg-white/80 px-6 py-3 rounded-xl shadow-sm border border-white/60"
          >
            <span>←</span> Volver al Buscador
          </a>
        </div>

        {/* Panel de Configuración (Tarjeta interna) */}
        <div className="glass-card p-8 rounded-2xl mb-8">
          <div className="text-xl font-bold text-[#003594] mb-6 flex items-center gap-2">
            📋 Configuración de Torre
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <FilterSelect label="TIPO" value={filters.tipo} options={options.TIPO} onChange={(v) => handleFilterChange('tipo', v)} />
            <FilterSelect label="FABRICANTE" value={filters.fabricante} options={options.FABRICANTE} onChange={(v) => handleFilterChange('fabricante', v)} />
            <FilterSelect label="CABEZA" value={filters.cabeza} options={options.CABEZA} onChange={(v) => handleFilterChange('cabeza', v)} />
            <FilterSelect label="CUERPO" value={filters.cuerpo} options={options.CUERPO || []} onChange={(v) => handleFilterChange('cuerpo', v)} />
          </div>

          <div className="border-t border-gray-200/40 pt-8 mt-6">
            <div className="text-xl font-bold text-[#003594] mb-6 flex items-center gap-2">
              🗝️ Selección de Partes
            </div>

            {partsMessage ? (
              <p className="text-center text-gray-600 font-medium italic p-10 bg-white/30 rounded-xl border border-dashed border-gray-300/50">{partsMessage}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {Object.values(parts).map(part => (
                  <PartCard
                    key={part.part}
                    part={part}
                    onToggle={() => togglePart(part.part)}
                    onQuantityChange={(q) => updateQuantity(part.part, q)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-center gap-6 mt-10 flex-wrap">
            <button 
              onClick={handleCalculate} 
              className="btn-shine bg-[#003594] hover:bg-[#002a75] text-white text-lg px-10 py-4 rounded-full font-bold shadow-lg hover:shadow-blue-900/30 transition-all duration-300 flex items-center gap-3 transform hover:-translate-y-1"
            >
              <span>🧮</span> Calcular Materiales
            </button>
            <button 
              onClick={handleReset} 
              className="bg-gray-500/80 hover:bg-gray-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-md backdrop-blur-sm"
            >
              🔄 Limpiar
            </button>
          </div>
        </div>

        {/* Resultados */}
        {showResults && (
          <div className="animate-slide-up">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-6 bg-blue-50/70 backdrop-blur-md rounded-2xl border border-blue-100 shadow-sm">
              <div className="font-bold text-[#003594] text-xl mb-4 sm:mb-0 drop-shadow-sm">{message}</div>
              <div className="flex gap-6">
                <div className="flex flex-col items-center bg-white/80 px-6 py-3 rounded-xl shadow-sm border border-white/50">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Total Piezas</span>
                  <span className="font-extrabold text-[#ff6600] text-2xl">{Math.round(totals.total_pieces)}</span>
                </div>
                <div className="flex flex-col items-center bg-white/80 px-6 py-3 rounded-xl shadow-sm border border-white/50">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Peso Total (kg)</span>
                  <span className="font-extrabold text-[#ff6600] text-2xl">{totals.total_weight.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card overflow-hidden rounded-2xl border border-white/50 shadow-xl">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-[#003594] text-white sticky top-0 z-10 shadow-md">
                    <tr>
                      {['Material', 'Texto Breve', 'Descripción', 'Parte', 'Pos.', 'Cant. Orig.', 'Cant. Calc.', 'Peso U.', 'Peso Total', 'Long 2', 'Plano'].map(h => (
                        <th key={h} className="px-4 py-4 text-left font-semibold whitespace-nowrap border-r border-blue-800 last:border-none">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/30">
                    {currentResults.map((piece, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 transition duration-150 bg-white/30 odd:bg-white/10">
                        <td className="px-4 py-3 text-[#003594] font-bold">{piece.id_item || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{piece.texto_breve || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]" title={piece.descripcion}>{piece.descripcion || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{piece.parte_division || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{piece.posicion || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 text-center font-medium">{piece.cantidad_original}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-[#fff3e0] text-[#e65100] font-bold px-3 py-1 rounded-lg border border-[#ffcc80] shadow-sm">
                            {piece.cantidad_calculada}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{piece.peso_unitario.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-900 font-bold">{piece.peso_total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-700">{piece.long_2_principal || '-'}</td>
                        <td className="px-4 py-3">
                          {piece.plano && piece.plano !== '-' ? (
                            <button
                              onClick={() => handleViewPlano(piece.plano, piece.mod_plano, piece.id_item)}
                              className="bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-800 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              VER
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
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

            <div className="mt-8 p-6 bg-green-50/80 backdrop-blur-md border border-green-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
              <div className="flex items-center gap-3 text-green-900">
                <span className="text-2xl">💾</span>
                <span className="font-bold text-lg">¿Listo para usar estos datos? Descarga el reporte completo.</span>
              </div>
              <button 
                onClick={exportToExcel} 
                className="btn-shine bg-[#28a745] hover:bg-[#218838] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 transform hover:scale-105"
              >
                <span>📥</span> Exportar a Excel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visualizador de Planos */}
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

// Componentes auxiliares

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col group">
      <label className="block font-bold text-[#003594] text-xs uppercase tracking-wide mb-2 group-hover:text-[#ff6600] transition-colors">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input w-full p-3 rounded-xl focus:ring-[#003594] text-gray-700 text-sm font-medium outline-none cursor-pointer"
      >
        <option value="">Seleccionar...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function PartCard({ part, onToggle, onQuantityChange }: {
  part: SelectedPart;
  onToggle: () => void;
  onQuantityChange: (q: number) => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`
        relative rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none backdrop-blur-sm
        ${part.selected 
          ? 'bg-blue-50/90 border-2 border-[#003594] shadow-lg transform -translate-y-1' 
          : 'bg-white/60 border border-white/50 hover:bg-white/80 hover:shadow-md hover:border-white/80'
        }
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
          ${part.selected ? 'bg-[#003594] border-[#003594]' : 'border-gray-400 bg-transparent'}
        `}>
          {part.selected && <span className="text-white text-xs font-bold">✓</span>}
        </div>
        <span className={`font-bold text-lg flex-1 ${part.selected ? 'text-[#003594]' : 'text-gray-800'}`}>
          {part.part}
        </span>
      </div>
      
      <div className="flex items-center gap-3 pl-9">
        <label className="text-xs font-bold text-gray-500 uppercase">Cant:</label>
        <input
          type="number"
          min="1"
          value={part.quantity}
          disabled={!part.selected}
          onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
          onClick={(e) => e.stopPropagation()}
          className={`
            w-20 p-1.5 rounded-lg text-center font-bold text-sm outline-none transition-all
            ${part.selected 
              ? 'bg-white border border-blue-200 text-[#003594] shadow-inner' 
              : 'bg-gray-100/50 border border-transparent text-gray-400'}
          `}
        />
      </div>
    </div>
  );
}