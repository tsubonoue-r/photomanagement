'use client'

/**
 * 選択フィールドコンポーネント
 */

import React from 'react'
import type { BlackboardField } from '@/types/blackboard'

interface SelectFieldProps {
  field: BlackboardField
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SelectField({
  field,
  value,
  onChange,
  disabled = false
}: SelectFieldProps) {
  const options = field.options || []

  return (
    <div className="select-field">
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
      <select
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={field.required}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          backgroundSize: '20px',
          paddingRight: '36px'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6'
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db'
          e.target.style.boxShadow = 'none'
        }}
      >
        <option value="">{field.placeholder || '選択してください'}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SelectField
