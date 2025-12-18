// components/UploadExcelModal.tsx - VERSIÓN CON TANSTACK QUERY
'use client';

import { useState, useRef } from 'react';
import { useUploadExcel } from '@/hooks/useApiQueries';

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadExcelModal({ isOpen, onClose, onSuccess }: UploadExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 TANSTACK QUERY: Mutation para upload
  const uploadMutation = useUploadExcel();

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensión
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      uploadMutation.reset(); // Resetear estado de mutation
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo primero');
      return;
    }

    // 🔥 Ejecutar mutation
    uploadMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        // Esperar 2 segundos para mostrar mensaje de éxito
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      },
    });
  };

  const handleClose = () => {
    if (!uploadMutation.isPending) {
      setSelectedFile(null);
      uploadMutation.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          disabled={uploadMutation.isPending}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#003594] mb-2 flex items-center gap-2">
            <span>📤</span> Actualizar Desglose de Torres
          </h2>
          <p className="text-gray-600 text-sm">
            Selecciona un nuevo archivo Excel para actualizar la base de datos.
          </p>
        </div>

        {/* Área de selección de archivo */}
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#003594] transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-6xl mb-4">📊</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un archivo'}
              </div>
              <div className="text-sm text-gray-500">
                {selectedFile 
                  ? `Tamaño: ${(selectedFile.size / 1024).toFixed(2)} KB`
                  : 'Archivos permitidos: .xlsx, .xls'
                }
              </div>
            </label>
          </div>
        </div>

        {/* Mensaje de estado - TanStack Query */}
        {uploadMutation.isError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            ❌ {uploadMutation.error.message}
          </div>
        )}

        {uploadMutation.isSuccess && uploadMutation.data && (
          <div className="mb-6 p-4 rounded-lg whitespace-pre-line bg-green-50 border border-green-200 text-green-800">
            {uploadMutation.data.message}
            {uploadMutation.data.stats && (
              <div className="mt-2 text-sm">
                <div>📊 Total de registros: {uploadMutation.data.stats.recordsCount || 'N/A'}</div>
                <div>📁 Archivo: {uploadMutation.data.stats.fileName} ({uploadMutation.data.stats.fileSize})</div>
              </div>
            )}
          </div>
        )}

        {uploadMutation.isPending && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Subiendo archivo y actualizando caché...</span>
          </div>
        )}

        {/* Advertencia */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Importante:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• El nuevo archivo reemplazará completamente los datos existentes</li>
                <li>• Asegúrate de que el archivo tenga el formato correcto</li>
                <li>• El caché se actualizará automáticamente con TanStack Query</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="px-6 py-2 rounded-lg font-semibold bg-[#003594] text-white hover:bg-[#002a75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                Actualizando...
              </>
            ) : (
              <>
                <span>✅</span>
                Actualizar Desglose
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}