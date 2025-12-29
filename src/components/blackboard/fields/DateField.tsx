'use client'
import React from 'react'
import type { BlackboardField } from '@/types/blackboard'
interface Props { field: BlackboardField; value: string; onChange: (value: string) => void; disabled?: boolean }
export function DateField({ field, value, onChange, disabled = false }: Props) {
  const today = new Date().toISOString().split('T')[0]
  return (<div><label htmlFor={field.id} style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>{field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input id={field.id} type="date" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} required={field.required} style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, backgroundColor: disabled ? '#f3f4f6' : '#fff' }} /><button type="button" onClick={() => onChange(today)} disabled={disabled} style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, color: '#374151', cursor: disabled ? 'not-allowed' : 'pointer' }}>Today</button></div></div>)
}
export default DateField
