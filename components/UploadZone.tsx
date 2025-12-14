import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Plus } from 'lucide-react';

interface UploadZoneProps {
  files: File[];
  onFilesAdded: (newFiles: File[]) => void;
  onRemoveFile: (index: number) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ files, onFilesAdded, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // Reset input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== newFiles.length) {
      alert('Some files were skipped because they are not images.');
    }
    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  };

  const renderPreviews = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full animate-fade-in">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="relative group aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <img
              src={URL.createObjectURL(file)}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover"
              onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-start justify-end p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(index);
                }}
                className="bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {/* Add more button */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all group"
        >
          <Plus className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-1" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">Add</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {files.length > 0 ? (
        <div className="space-y-4">
            {renderPreviews()}
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2 font-medium">
              {files.length} screenshot{files.length !== 1 ? 's' : ''} ready
            </p>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl aspect-[16/9] flex flex-col items-center justify-center cursor-pointer transition-all duration-300
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.02]' 
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'
            }
          `}
        >
          <div className="flex flex-col items-center text-center p-6">
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
              ${isDragging ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}
            `}>
              {isDragging ? <UploadCloud className="w-7 h-7" /> : <ImageIcon className="w-7 h-7" />}
            </div>
            
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {isDragging ? 'Drop files here' : 'Upload screenshots'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs px-4">
              Drag & drop or click. Upload multiple files at once.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;