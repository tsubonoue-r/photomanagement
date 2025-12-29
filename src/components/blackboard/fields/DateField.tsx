"use client";

/**
 * 日付フィールドコンポーネント（スタブ）
 */

import React from "react";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DateField({ value, onChange, disabled }: DateFieldProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
    />
  );
}
