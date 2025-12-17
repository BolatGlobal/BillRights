import React, { useRef } from 'react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  label: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, disabled, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelected(Array.from(event.target.files));
      // Reset input so same file can be selected again if needed
      event.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      onClick={!disabled ? handleClick : undefined}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${disabled 
          ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400' 
          : 'border-blue-300 hover:bg-blue-50 hover:border-blue-500 text-gray-600'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="font-medium text-lg">{label}</p>
        <p className="text-sm text-gray-400">Supported: JPG, PNG, PDF</p>
      </div>
    </div>
  );
};

export default UploadArea;
