"use client";

import { useState, useRef } from "react";
import { Upload, AlertTriangle } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  /** Папка в S3: menu | categories | banners | combos | additional */
  folder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  required,
  folder = "menu",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setProgress(10);

    try {
      if (file.size > 10 * 1024 * 1024) {
        setError("Файл слишком большой. Максимум 10 МБ");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Пожалуйста, выберите изображение");
        return;
      }

      setProgress(30);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/upload?folder=${folder}`, {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ошибка загрузки");
        return;
      }

      setProgress(100);
      onChange(data.url);
    } catch (err) {
      console.error("ImageUpload error:", err);
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadImage(file);
    // сбрасываем input чтобы можно было выбрать тот же файл повторно
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) await uploadImage(file);
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
  };

  // Определяем — это base64 или URL
  const isBase64 = value.startsWith("data:");
  const isUrl = value.startsWith("http");
  const hasImage = isBase64 || isUrl;

  return (
    <div>
      {label && (
        <label className="block text-sm font-bold text-white mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {hasImage ? (
        /* ── Preview ── */
        <>
        <div
          className="relative rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover"
            style={{ backgroundColor: "#1A212B" }}
          />
          {isBase64 && (
            <div
              className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold"
              style={{ backgroundColor: "rgba(251,191,36,0.9)", color: "#000" }}
            >
              base64 — сохраните для загрузки в S3
            </div>
          )}
          {/* На десктопе — оверлей по наведению; на мобильных кнопки
              вынесены отдельной панелью снизу, т.к. hover недоступен. */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg font-bold text-white transition-all"
              style={{ backgroundColor: "#7C8CA5" }}
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 rounded-lg font-bold text-white transition-all"
              style={{ backgroundColor: "#ef4444" }}
            >
              Удалить
            </button>
          </div>
        </div>
        {/* Мобильные кнопки управления фото (hover недоступен на телефоне) */}
        <div className="flex gap-2 mt-2 sm:hidden">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-4 py-2.5 rounded-lg font-bold text-white text-sm"
            style={{ backgroundColor: "#7C8CA5" }}
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="flex-1 px-4 py-2.5 rounded-lg font-bold text-white text-sm"
            style={{ backgroundColor: "#ef4444" }}
          >
            Удалить
          </button>
        </div>
        </>
      ) : (
        /* ── Upload area ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed transition-all cursor-pointer"
          style={{
            backgroundColor: isDragging ? "rgba(124,140,165,0.1)" : "#1A212B",
            borderColor: isDragging ? "#7C8CA5" : "rgba(255,255,255,0.08)",
          }}
        >
          <div className="p-8 text-center">
            {isUploading ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="#7C8CA5" strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="#7C8CA5"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
                <p className="text-white font-bold mb-2">Загрузка в S3...</p>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: "#7C8CA5",
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "rgba(124,140,165,0.15)" }}
                >
                  <Upload className="w-7 h-7" style={{ color: "#7C8CA5" }} />
                </div>
                <p className="text-white font-bold mb-1">
                  Перетащите изображение сюда
                </p>
                <p className="text-sm mb-3" style={{ color: "#98A2B3" }}>
                  или нажмите для выбора файла
                </p>
                <p className="text-xs" style={{ color: "#98A2B3" }}>
                  PNG, JPG, WebP, GIF · до 10 МБ
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

      {/* Error */}
      {error && (
        <div
          className="mt-2 p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <p className="text-sm font-bold" style={{ color: "#ef4444" }}>
            {error}
          </p>
        </div>
      )}

      {/* URL input */}
      <div className="mt-3">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="или вставьте URL изображения"
          className="w-full px-4 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none transition-all border text-sm"
          style={{
            backgroundColor: "#0B0F14",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        />
      </div>
    </div>
  );
}
