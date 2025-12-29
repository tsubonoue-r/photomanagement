'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { BlackboardTemplate, BlackboardFieldValue, SketchData } from '@/types/blackboard'
import { drawBlackboard } from '@/lib/blackboard'

interface Props { template: BlackboardTemplate; values: BlackboardFieldValue[]; onValuesChange: (values: BlackboardFieldValue[]) => void; sketchData?: SketchData; onSketchChange?: (sketchData: SketchData) => void; readOnly?: boolean }

export function BlackboardEditor({ template, values, onValuesChange, sketchData, readOnly = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSketchMode, setIsSketchMode] = useState(false)
  useEffect(() => { const canvas = canvasRef.current; if (canvas) drawBlackboard(canvas, template, values, sketchData) }, [template, values, sketchData])
  const updateFieldValue = useCallback((fieldId: string, value: string | number | Date | null) => {
    const idx = values.findIndex(v => v.fieldId === fieldId)
    const newValues = idx >= 0 ? [...values.slice(0, idx), { fieldId, value }, ...values.slice(idx + 1)] : [...values, { fieldId, value }]
    onValuesChange(newValues)
  }, [values, onValuesChange])
  const getFieldValue = useCallback((fieldId: string): string => { const f = values.find(v => v.fieldId === fieldId); return f?.value != null ? String(f.value) : '' }, [values])
  return (
    <div>
      <div style={{ backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'center' }}>
        <canvas ref={canvasRef} width={template.width} height={template.height} style={{ border: '1px solid #ccc', borderRadius: 4, maxWidth: '100%', height: 'auto' }} />
      </div>
      {!readOnly && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 'bold' }}>項目入力</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {template.fields.map(field => field.type === 'sketch' ? (
              <div key={field.id} style={{ marginBottom: 8 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}</label><button type="button" onClick={() => setIsSketchMode(!isSketchMode)} style={{ padding: '8px 16px', backgroundColor: isSketchMode ? '#3b82f6' : '#e5e7eb', color: isSketchMode ? '#fff' : '#374151', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{isSketchMode ? '略図モード終了' : '略図を編集'}</button></div>
            ) : (
              <div key={field.id} style={{ marginBottom: 8 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}</label>{field.type === 'date' ? <input type="date" value={getFieldValue(field.id)} onChange={e => updateFieldValue(field.id, e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }} /> : field.type === 'select' && field.options ? <select value={getFieldValue(field.id)} onChange={e => updateFieldValue(field.id, e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}><option value="">選択してください</option>{field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} value={getFieldValue(field.id)} onChange={e => updateFieldValue(field.id, e.target.value)} placeholder={field.placeholder} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }} />}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default BlackboardEditor
