'use client'
import React from 'react'
import type { BlackboardField } from '@/types/blackboard'
interface Props { field: BlackboardField; value: string; onChange: (value: string) => void; disabled?: boolean }
export function NumberField({ field, value, onChange, disabled = false }: Props) {
  return (<div><label htmlFor={field.id} style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>{field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}</label><input id={field.id} type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} disabled={disabled} required={field.required} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, backgroundColor: disabled ? '#f3f4f6' : '#fff' }} /></div>)
}
export default NumberField
