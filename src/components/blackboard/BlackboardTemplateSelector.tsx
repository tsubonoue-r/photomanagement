'use client'
import React, { useState, useEffect } from 'react'
import type { BlackboardTemplate, ApiResponse, PaginatedResponse } from '@/types/blackboard'
import { defaultTemplates } from '@/data/default-templates'

interface Props { selectedTemplateId?: string; onSelect: (template: BlackboardTemplate) => void; disabled?: boolean }

export function BlackboardTemplateSelector({ selectedTemplateId, onSelect, disabled = false }: Props) {
  const [templates, setTemplates] = useState<BlackboardTemplate[]>(defaultTemplates)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    fetch('/api/blackboard-templates?activeOnly=true').then(r => r.json()).then((data: ApiResponse<PaginatedResponse<BlackboardTemplate>>) => { if (data.success && data.data) setTemplates(data.data.items); else setTemplates(defaultTemplates) }).catch(() => setTemplates(defaultTemplates)).finally(() => setLoading(false))
  }, [])
  const selected = templates.find(t => t.id === selectedTemplateId)
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#374151' }}>Select Template</label>
      {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Loading templates...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {templates.map(t => (
            <div key={t.id} onClick={() => !disabled && onSelect(t)} style={{ padding: 12, border: selectedTemplateId === t.id ? '2px solid #3b82f6' : '1px solid #e5e7eb', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', backgroundColor: selectedTemplateId === t.id ? '#eff6ff' : '#fff', opacity: disabled ? 0.6 : 1 }}>
              <div style={{ width: '100%', height: 80, backgroundColor: t.backgroundColor, border: `${Math.min(t.borderWidth, 4)}px solid ${t.borderColor}`, borderRadius: 4, marginBottom: 8, padding: 4, fontSize: 8, color: '#fff' }}>{t.fields.slice(0, 3).map(f => <div key={f.id} style={{ marginBottom: 2 }}>{f.label}</div>)}{t.fields.length > 3 && <div style={{ opacity: 0.7 }}>+{t.fields.length - 3} more</div>}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>{t.name}{t.isDefault && <span style={{ fontSize: 10, padding: '2px 6px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: 4 }}>DEFAULT</span>}</div>
              {t.description && <div style={{ fontSize: 12, color: '#6b7280' }}>{t.description}</div>}
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{t.width} x {t.height}px | {t.fields.length} fields</div>
            </div>
          ))}
        </div>
      )}
      {selected && <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}><div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>SELECTED</div><div style={{ fontWeight: 600, color: '#1f2937' }}>{selected.name}</div><div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Fields: {selected.fields.map(f => f.label).join(', ')}</div></div>}
    </div>
  )
}
export default BlackboardTemplateSelector
