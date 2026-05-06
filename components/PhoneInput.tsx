"use client";

import { useState, useEffect } from "react";
import { formatPhoneNumber } from "@/lib/phone-formatter";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  placeholder = "+996 555 123 456",
  className = "",
  label,
  required = false,
  disabled = false,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  // Синхронизируем с внешним значением
  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Если поле пустое, добавляем +996
    if (!displayValue || displayValue.trim() === "") {
      const formatted = formatPhoneNumber("996");
      setDisplayValue(formatted);
      onChange(formatted);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-white mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border ${
            error ? "border-red-500" : "border-slate-600"
          } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="mt-2 text-sm text-slate-400">
        Формат: +996 XXX XXX XXX (автоматически)
      </p>
    </div>
  );
}
