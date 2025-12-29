'use client'
import React, { useMemo } from 'react'
import type { BlackboardTemplate, BlackboardFieldValue, IntegrityInfo } from '@/types/blackboard'
import { generateBlackboardSvg, formatDate } from '@/lib/blackboard'

interface Props { template: BlackboardTemplate; values: BlackboardFieldValue[]; scale?: number; showIntegrity?: boolean; integrityInfo?: IntegrityInfo; onClick?: () => void }

export function BlackboardPreview({ template, values, scale = 1, showIntegrity = false, integrityInfo, onClick }: Props) {
  const svgContent = useMemo(() => generateBlackboardSvg(template, values), [template, values])
  return (
    <div style={{ display: 'inline-block', position: 'relative', cursor: onClick ? 'pointer' : 'default', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onClick={onClick}>
      <div style={{ display: 'block', width: template.width * scale, maxWidth: '100%' }} dangerouslySetInnerHTML={{ __html: svgContent }} />
      {showIntegrity && integrityInfo && <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 8px', backgroundColor: integrityInfo.verified ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 10, borderRadius: 4 }}>{integrityInfo.verified ? 'Verified' : 'Modified'}</div>}
    </div>
  )
}

interface CardProps { template: BlackboardTemplate; values: BlackboardFieldValue[]; name: string; createdAt: string; onEdit?: () => void; onDelete?: () => void }
export function BlackboardCard({ template, values, name, createdAt, onEdit, onDelete }: CardProps) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
      <div style={{ padding: 8, backgroundColor: '#f9fafb' }}><BlackboardPreview template={template} values={values} scale={0.4} /></div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{template.name} | {formatDate(createdAt)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onEdit && <button type="button" onClick={onEdit} style={{ flex: 1, padding: '6px 12px', fontSize: 12, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Edit</button>}
          {onDelete && <button type="button" onClick={onDelete} style={{ padding: '6px 12px', fontSize: 12, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer' }}>Delete</button>}
        </div>
      </div>
    </div>
  )
}
export default BlackboardPreview
