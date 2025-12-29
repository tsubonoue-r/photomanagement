'use client';

/**
 * Blackboard Management Page
 * 黒板管理ページ
 * 電子小黒板の作成・編集・プレビュー
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  BlackboardEditor,
  BlackboardPreview,
  BlackboardTemplateSelector,
} from '@/components/blackboard';
import type {
  BlackboardTemplate,
  BlackboardFieldValue,
  SketchData,
} from '@/types/blackboard';
import { defaultTemplates } from '@/data/default-templates';
import { compositeBlackboardToPhoto, createIntegrityInfo } from '@/lib/blackboard';

type ViewMode = 'templates' | 'editor' | 'preview';

export default function BlackboardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<BlackboardTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<BlackboardFieldValue[]>([]);
  const [sketchData, setSketchData] = useState<SketchData | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [composedImageUrl, setComposedImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: BlackboardTemplate) => {
    setSelectedTemplate(template);
    // Initialize field values from template defaults
    const initialValues: BlackboardFieldValue[] = template.fields.map(field => ({
      fieldId: field.id,
      value: field.defaultValue || null,
    }));
    setFieldValues(initialValues);
    setViewMode('editor');
  }, []);

  // Handle field values change from editor
  const handleValuesChange = useCallback((newValues: BlackboardFieldValue[]) => {
    setFieldValues(newValues);
  }, []);

  // Handle composition
  const handleCompose = useCallback(async () => {
    if (!photoUrl || !selectedTemplate) {
      setError('写真URLとテンプレートを選択してください');
      return;
    }

    setIsComposing(true);
    setError(null);

    try {
      const result = await compositeBlackboardToPhoto(
        photoUrl,
        selectedTemplate,
        fieldValues,
        {
          position: 'bottom-right',
          scale: 0.3,
          opacity: 1,
          padding: 20,
        },
        sketchData
      );
      setComposedImageUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '合成に失敗しました');
    } finally {
      setIsComposing(false);
    }
  }, [photoUrl, selectedTemplate, fieldValues, sketchData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 8px 0',
          }}
        >
          電子小黒板
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          工事写真用の電子黒板を作成・編集・管理します
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#991b1b',
            }}
          >
            x
          </button>
        </div>
      )}

      {/* View mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setViewMode('templates')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: viewMode === 'templates' ? '600' : '400',
            color: viewMode === 'templates' ? '#3b82f6' : '#6b7280',
            backgroundColor: viewMode === 'templates' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          テンプレート選択
        </button>
        <button
          onClick={() => setViewMode('editor')}
          disabled={!selectedTemplate}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: viewMode === 'editor' ? '600' : '400',
            color:
              viewMode === 'editor'
                ? '#3b82f6'
                : selectedTemplate
                  ? '#6b7280'
                  : '#d1d5db',
            backgroundColor: viewMode === 'editor' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
          }}
        >
          黒板エディタ
        </button>
        <button
          onClick={() => setViewMode('preview')}
          disabled={!selectedTemplate}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: viewMode === 'preview' ? '600' : '400',
            color:
              viewMode === 'preview'
                ? '#3b82f6'
                : selectedTemplate
                  ? '#6b7280'
                  : '#d1d5db',
            backgroundColor: viewMode === 'preview' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
          }}
        >
          写真合成プレビュー
        </button>
      </div>

      {/* Templates view */}
      {viewMode === 'templates' && (
        <BlackboardTemplateSelector
          selectedTemplateId={selectedTemplate?.id}
          onSelect={handleTemplateSelect}
        />
      )}

      {/* Editor view */}
      {viewMode === 'editor' && selectedTemplate && (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>
                テンプレート: {selectedTemplate.name}
              </span>
              {selectedTemplate.description && (
                <span
                  style={{ marginLeft: '12px', color: '#6b7280', fontSize: '13px' }}
                >
                  {selectedTemplate.description}
                </span>
              )}
            </div>
            <button
              onClick={() => setViewMode('templates')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              変更
            </button>
          </div>

          <BlackboardEditor
            template={selectedTemplate}
            values={fieldValues}
            onValuesChange={handleValuesChange}
            sketchData={sketchData}
            onSketchChange={setSketchData}
          />
        </div>
      )}

      {/* Preview view */}
      {viewMode === 'preview' && selectedTemplate && (
        <div>
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              写真URL（テスト用）
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                }}
              />
              <button
                onClick={handleCompose}
                disabled={isComposing || !photoUrl}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: isComposing ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isComposing || !photoUrl ? 'not-allowed' : 'pointer',
                }}
              >
                {isComposing ? '合成中...' : '合成実行'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                黒板プレビュー
              </h3>
              <BlackboardPreview
                template={selectedTemplate}
                values={fieldValues}
                scale={1}
              />
            </div>

            {composedImageUrl && (
              <div style={{ flex: '2 1 500px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  合成結果
                </h3>
                <img
                  src={composedImageUrl}
                  alt="Composed photo with blackboard"
                  style={{
                    maxWidth: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
