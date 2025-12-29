'use client';

/**
 * Blackboard Management Page
 * 黒板管理ページ
 * 電子小黒板の作成・編集・プレビュー・合成
 */

import React, { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  BlackboardEditor,
  BlackboardPreview,
  BlackboardTemplateSelector,
  BlackboardComposer,
  BatchComposer,
} from '@/components/blackboard';
import type {
  BlackboardTemplate,
  BlackboardFieldValue,
  SketchData,
} from '@/types/blackboard';
import { defaultTemplates } from '@/data/default-templates';
import { compositeBlackboardToPhoto } from '@/lib/blackboard';
import { Upload } from 'lucide-react';

type ViewMode = 'templates' | 'editor' | 'composer' | 'batch';

export default function BlackboardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<BlackboardTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<BlackboardFieldValue[]>([]);
  const [sketchData, setSketchData] = useState<SketchData | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  }, []);

  // Handle composition (legacy)
  const handleCompose = useCallback(async () => {
    if (!photoUrl || !selectedTemplate) {
      setError('Please select a photo and template');
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
      setError(err instanceof Error ? err.message : 'Composition failed');
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
          flexWrap: 'wrap',
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
          Template Selection
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
          Blackboard Editor
        </button>
        <button
          onClick={() => setViewMode('composer')}
          disabled={!selectedTemplate}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: viewMode === 'composer' ? '600' : '400',
            color:
              viewMode === 'composer'
                ? '#3b82f6'
                : selectedTemplate
                  ? '#6b7280'
                  : '#d1d5db',
            backgroundColor: viewMode === 'composer' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
          }}
        >
          Photo Composer
        </button>
        <button
          onClick={() => setViewMode('batch')}
          disabled={!selectedTemplate}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: viewMode === 'batch' ? '600' : '400',
            color:
              viewMode === 'batch'
                ? '#3b82f6'
                : selectedTemplate
                  ? '#6b7280'
                  : '#d1d5db',
            backgroundColor: viewMode === 'batch' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
          }}
        >
          Batch Composer
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

      {/* Composer view */}
      {viewMode === 'composer' && selectedTemplate && (
        <div>
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>
                  Template: {selectedTemplate.name}
                </span>
                {selectedTemplate.description && (
                  <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '13px' }}>
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
                Change Template
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Upload size={16} />
              Select Photo
            </button>
          </div>

          <BlackboardComposer
            template={selectedTemplate}
            values={fieldValues}
            sketchData={sketchData}
            photoUrl={photoUrl}
            photoFile={photoFile || undefined}
            isLoading={isComposing}
          />

          {/* Blackboard Preview */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Blackboard Preview
            </h3>
            <BlackboardPreview
              template={selectedTemplate}
              values={fieldValues}
              scale={0.8}
            />
          </div>
        </div>
      )}

      {/* Batch Composer view */}
      {viewMode === 'batch' && selectedTemplate && (
        <div>
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>
                  Template: {selectedTemplate.name}
                </span>
                <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '13px' }}>
                  Batch mode - Compose multiple photos at once
                </span>
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
                Change Template
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', maxWidth: 400 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                Blackboard Preview
              </h3>
              <BlackboardPreview
                template={selectedTemplate}
                values={fieldValues}
                scale={0.6}
              />
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setViewMode('editor')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    color: '#3b82f6',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Edit Blackboard Content
                </button>
              </div>
            </div>

            <div style={{ flex: '2 1 500px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                Batch Composition
              </h3>
              <BatchComposer
                template={selectedTemplate}
                values={fieldValues}
                sketchData={sketchData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
