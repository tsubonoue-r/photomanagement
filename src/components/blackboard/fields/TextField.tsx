"use client";

/**
 * テキストフィールドコンポーネント（スタブ）
 */

import React from "react";

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextField({ value, onChange, placeholder, disabled }: TextFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
    />
  );
}
