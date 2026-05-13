"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

export default function ImageUpload({ value, onChange, label, required }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await uploadImage(imageFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Проверка размера файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 10MB');
        setIsUploading(false);
        return;
      }

      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        setIsUploading(false);
        return;
      }

      // Конвертируем в base64 для хранения
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setIsUploading(false);
        setError(null);
      };
      reader.onerror = () => {
        setError('Ошибка при чтении файла');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Ошибка при загрузке изображения');
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-bold text-white mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {value ? (
        // Preview
        <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: '#242b47' }}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover"
            style={{ backgroundColor: '#181f38' }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg font-bold text-white transition-all"
              style={{ backgroundColor: '#4047ee' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a5ff5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4047ee'}
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 rounded-lg font-bold text-white transition-all"
              style={{ backgroundColor: '#ef4444' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        // Upload area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed transition-all cursor-pointer"
          style={{
            backgroundColor: isDragging ? 'rgba(64, 71, 238, 0.1)' : '#181f38',
            borderColor: isDragging ? '#4047ee' : '#242b47',
          }}
        >
          <div className="p-8 text-center">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto mb-4" style={{ borderColor: '#4047ee' }}></div>
                <p className="text-white font-bold">Загрузка...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#242b47' }}>
                  <svg
                    className="w-8 h-8"
                    style={{ color: '#4047ee' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-white font-bold mb-2">
                  Перетащите изображение сюда
                </p>
                <p className="text-sm mb-4" style={{ color: '#78819d' }}>
                  или нажмите для выбора файла
                </p>
                <p className="text-xs" style={{ color: '#78819d' }}>
                  PNG, JPG, GIF до 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* URL Input as alternative */}
      <div className="mt-3">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="или вставьте URL изображения"
          className="w-full px-4 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none transition-all border text-sm"
          style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
        />
      </div>
    </div>
  );
}
