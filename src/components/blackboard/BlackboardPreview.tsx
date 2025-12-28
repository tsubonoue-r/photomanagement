'use client'

/**
 * 黒板プレビューコンポーネント
 * SVGを使用した軽量なプレビュー表示
 */

import React, { useMemo } from 'react'
import type {
  BlackboardTemplate,
  BlackboardFieldValue,
  IntegrityInfo
} from '@/types/blackboard'
import { generateBlackboardSvg, formatDate } from '@/lib/blackboard'

interface BlackboardPreviewProps {
  template: BlackboardTemplate
  values: BlackboardFieldValue[]
  scale?: number
  showIntegrity?: boolean
  integrityInfo?: IntegrityInfo
  onClick?: () => void
}

export function BlackboardPreview({
  template,
  values,
  scale = 1,
  showIntegrity = false,
  integrityInfo,
  onClick
}: BlackboardPreviewProps) {
  // SVG生成（メモ化）
  const svgContent = useMemo(() => {
    return generateBlackboardSvg(template, values)
  }, [template, values])

  const containerStyle: React.CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  }

  const svgStyle: React.CSSProperties = {
    display: 'block',
    width: template.width * scale,
    height: template.height * scale,
    maxWidth: '100%',
    height: 'auto'
  }

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* SVG黒板 */}
      <div
        style={svgStyle}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* 改ざん検知情報 */}
      {showIntegrity && integrityInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            padding: '4px 8px',
            backgroundColor: integrityInfo.verified
              ? 'rgba(34, 197, 94, 0.9)'
              : 'rgba(239, 68, 68, 0.9)',
            color: '#ffffff',
            fontSize: '10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {integrityInfo.verified ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Verified
            </>
          ) : (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Modified
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** 黒板リストプレビュー用の小さいカード */
interface BlackboardCardProps {
  template: BlackboardTemplate
  values: BlackboardFieldValue[]
  name: string
  createdAt: string
  onEdit?: () => void
  onDelete?: () => void
}

export function BlackboardCard({
  template,
  values,
  name,
  createdAt,
  onEdit,
  onDelete
}: BlackboardCardProps) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        transition: 'box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* プレビュー */}
      <div style={{ padding: '8px', backgroundColor: '#f9fafb' }}>
        <BlackboardPreview
          template={template}
          values={values}
          scale={0.4}
        />
      </div>

      {/* 情報 */}
      <div style={{ padding: '12px' }}>
        <div
          style={{
            fontWeight: '600',
            fontSize: '14px',
            color: '#1f2937',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '8px'
          }}
        >
          {template.name} | {formatDate(createdAt)}
        </div>

        {/* アクションボタン */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fecaca'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2'
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlackboardPreview
