"use client";

import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
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

  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleFocus = () => {
    if (!displayValue || displayValue.trim() === "") {
      const formatted = formatPhoneNumber("996");
      setDisplayValue(formatted);
      onChange(formatted);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label} {required && <span className="text-[var(--brand)]">*</span>}
        </label>
      )}
      <div className="relative">
        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" />
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={`input pl-9 font-mono ${
            error ? "!border-[var(--brand)]" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--brand)] font-semibold">{error}</p>}
      <p className="mt-1.5 text-xs text-[var(--fg-subtle)]">
        Формат: +996 XXX XXX XXX
      </p>
    </div>
  );
}
