// components/UploadExcelModal.tsx
'use client';

import { useState, useRef } from 'react';

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadExcelModal({ isOpen, onClose, onSuccess }: UploadExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensión
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        setUploadStatus({
          type: 'error',
          message: 'Por favor selecciona un archivo Excel (.xlsx o .xls)'
        });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadStatus({ type: 'idle', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        type: 'error',
        message: 'Por favor selecciona un archivo primero'
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: 'idle', message: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus({
          type: 'success',
          message: `✅ ${data.message}\n📊 Total de registros: ${data.stats.totalRecords}\n📁 Archivo: ${data.stats.fileName} (${data.stats.fileSize})`
        });
        
        // Esperar 2 segundos para que el usuario vea el mensaje
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setUploadStatus({
          type: 'error',
          message: `❌ ${data.message}`
        });
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setUploadStatus({ type: 'idle', message: '' });
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
          disabled={uploading}
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
            Selecciona un nuevo archivo Excel para actualizar la base de datos. El archivo actual se respaldará automáticamente.
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
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

        {/* Mensaje de estado */}
        {uploadStatus.message && (
          <div className={`mb-6 p-4 rounded-lg whitespace-pre-line ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {uploadStatus.message}
          </div>
        )}

        {/* Advertencia */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Importante:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Se creará un respaldo automático del archivo actual</li>
                <li>• El nuevo archivo reemplazará completamente los datos existentes</li>
                <li>• Asegúrate de que el archivo tenga el formato correcto</li>
                <li>• La página se recargará automáticamente después de la actualización</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 rounded-lg font-semibold bg-[#003594] text-white hover:bg-[#002a75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
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