'use client'

/**
 * 黒板テンプレート選択コンポーネント
 */

import React, { useState, useEffect } from 'react'
import type { BlackboardTemplate, ApiResponse, PaginatedResponse } from '@/types/blackboard'
import { defaultTemplates } from '@/data/default-templates'

interface BlackboardTemplateSelectorProps {
  selectedTemplateId?: string
  onSelect: (template: BlackboardTemplate) => void
  disabled?: boolean
}

export function BlackboardTemplateSelector({
  selectedTemplateId,
  onSelect,
  disabled = false
}: BlackboardTemplateSelectorProps) {
  const [templates, setTemplates] = useState<BlackboardTemplate[]>(defaultTemplates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // テンプレート一覧を取得
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/blackboard-templates?activeOnly=true')
        const data: ApiResponse<PaginatedResponse<BlackboardTemplate>> = await response.json()

        if (data.success && data.data) {
          setTemplates(data.data.items)
        } else {
          // APIが利用できない場合はデフォルトを使用
          setTemplates(defaultTemplates)
        }
      } catch {
        // エラー時はデフォルトテンプレートを使用
        setTemplates(defaultTemplates)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  return (
    <div className="template-selector">
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151'
        }}
      >
        Select Template
      </label>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '12px'
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280'
          }}
        >
          Loading templates...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => !disabled && onSelect(template)}
              style={{
                padding: '12px',
                border: selectedTemplateId === template.id
                  ? '2px solid #3b82f6'
                  : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: selectedTemplateId === template.id
                  ? '#eff6ff'
                  : '#ffffff',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!disabled && selectedTemplateId !== template.id) {
                  e.currentTarget.style.borderColor = '#93c5fd'
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && selectedTemplateId !== template.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }
              }}
            >
              {/* テンプレートプレビュー */}
              <div
                style={{
                  width: '100%',
                  height: '80px',
                  backgroundColor: template.backgroundColor,
                  border: `${Math.min(template.borderWidth, 4)}px solid ${template.borderColor}`,
                  borderRadius: '4px',
                  marginBottom: '8px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* 簡易的なフィールド表示 */}
                <div
                  style={{
                    padding: '4px',
                    fontSize: '8px',
                    color: '#ffffff'
                  }}
                >
                  {template.fields.slice(0, 3).map(field => (
                    <div key={field.id} style={{ marginBottom: '2px' }}>
                      {field.label}
                    </div>
                  ))}
                  {template.fields.length > 3 && (
                    <div style={{ opacity: 0.7 }}>
                      +{template.fields.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              {/* テンプレート情報 */}
              <div>
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1f2937',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {template.name}
                  {template.isDefault && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: '4px'
                      }}
                    >
                      DEFAULT
                    </span>
                  )}
                </div>
                {template.description && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}
                  >
                    {template.description}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginTop: '4px'
                  }}
                >
                  {template.width} x {template.height}px |{' '}
                  {template.fields.length} fields
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 選択中のテンプレート情報 */}
      {selectedTemplate && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div
            style={{
              fontWeight: '600',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px'
            }}
          >
            SELECTED
          </div>
          <div style={{ fontWeight: '600', color: '#1f2937' }}>
            {selectedTemplate.name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Fields: {selectedTemplate.fields.map(f => f.label).join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

export default BlackboardTemplateSelector
