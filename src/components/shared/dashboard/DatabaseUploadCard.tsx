/**
 * Componente de carga de base de datos
 * Permite subir archivos en formatos .sql, .zip, .csv, .xlsx
 */

import { useRef, useState } from 'react';

interface DatabaseUploadCardProps {
  onFileSelect?: (file: File) => void;
  acceptedFormats?: string[];
  className?: string;
}

export function DatabaseUploadCard({
  onFileSelect,
  acceptedFormats = ['.sql', '.zip', '.csv', '.xlsx'],
  className = '',
}: DatabaseUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect?.(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatsDisplay = acceptedFormats.map((f) => f).join(', ');

  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-green-700 mb-2 leading-tight">
        Cargar base de datos
      </h2>

      <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
        En este apartado puedes cargar una base de datos. El archivo puede ser en los 
        siguientes formatos: <span className="font-semibold text-gray-800">{formatsDisplay}</span>
      </p>

      <div className="mb-2">
        <p className="text-xs sm:text-sm text-gray-700 font-medium mb-2">Busca en tu ordenador</p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button
          onClick={handleClick}
          className="bg-[#0B5A4A] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium hover:bg-[#0B5A4A]/90 transition-colors"
        >
          Seleccionar archivo
        </button>
      </div>

      {selectedFile && (
        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs sm:text-sm text-emerald-700">
            <span className="font-medium">Archivo seleccionado:</span> {selectedFile.name}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}
    </div>
  );
}
