'use client'

/**
 * 数値フィールドコンポーネント
 */

import React from 'react'
import type { BlackboardField } from '@/types/blackboard'

interface NumberFieldProps {
  field: BlackboardField
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  field,
  value,
  onChange,
  disabled = false,
  min,
  max,
  step = 0.01
}: NumberFieldProps) {
  return (
    <div className="number-field">
      <label
        htmlFor={field.id}
        style={{
          display: 'block',
          marginBottom: '4px',
          fontWeight: '500',
          color: '#374151'
        }}
      >
        {field.label}
        {field.required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <input
        id={field.id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6'
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

export default NumberField
