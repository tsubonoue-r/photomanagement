'use client'

import React, { useState, useCallback, useRef } from 'react'
import type { BlackboardTemplate, BlackboardFieldValue, SketchData } from '@/types/blackboard'
import { generateBlackboardSvg } from '@/lib/blackboard'
import { Upload, Play, Download, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

interface PhotoItem {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  resultUrl?: string
  error?: string
}

interface ComposerOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  scale: number
  opacity: number
  padding: number
}

interface Props {
  template: BlackboardTemplate
  values: BlackboardFieldValue[]
  sketchData?: SketchData
  onBatchComplete?: (results: { photoId: string; blob: Blob }[]) => void
}

export function BatchComposer({
  template,
  values,
  sketchData,
  onBatchComplete,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [options, setOptions] = useState<ComposerOptions>({
    position: 'bottom-right',
    scale: 0.3,
    opacity: 1,
    padding: 20,
  })

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: PhotoItem[] = Array.from(files).map((file, index) => ({
      id: `photo-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as const,
    }))

    setPhotos(prev => [...prev, ...newPhotos])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files) return

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    const newPhotos: PhotoItem[] = imageFiles.map((file, index) => ({
      id: `photo-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as const,
    }))

    setPhotos(prev => [...prev, ...newPhotos])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Remove photo
  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl)
        if (photo.resultUrl) {
          URL.revokeObjectURL(photo.resultUrl)
        }
      }
      return prev.filter(p => p.id !== id)
    })
  }, [])

  // Clear all photos
  const handleClearAll = useCallback(() => {
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.previewUrl)
      if (photo.resultUrl) {
        URL.revokeObjectURL(photo.resultUrl)
      }
    })
    setPhotos([])
    setProgress({ completed: 0, total: 0 })
  }, [photos])

  // Compose single photo
  const composeSinglePhoto = useCallback((photo: PhotoItem): Promise<{ resultUrl: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Calculate blackboard position
        const bbW = template.width * options.scale
        const bbH = template.height * options.scale
        let x: number, y: number

        switch (options.position) {
          case 'top-left':
            x = options.padding
            y = options.padding
            break
          case 'top-right':
            x = img.width - bbW - options.padding
            y = options.padding
            break
          case 'bottom-left':
            x = options.padding
            y = img.height - bbH - options.padding
            break
          case 'bottom-right':
          default:
            x = img.width - bbW - options.padding
            y = img.height - bbH - options.padding
        }

        // Draw blackboard SVG
        const svgContent = generateBlackboardSvg(template, values, sketchData)
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
        const svgUrl = URL.createObjectURL(svgBlob)

        const bbImg = new window.Image()
        bbImg.onload = () => {
          ctx.globalAlpha = options.opacity
          ctx.drawImage(bbImg, x, y, bbW, bbH)
          ctx.globalAlpha = 1

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(svgUrl)
            if (blob) {
              const resultUrl = URL.createObjectURL(blob)
              resolve({ resultUrl, blob })
            } else {
              reject(new Error('Failed to create blob'))
            }
          }, 'image/jpeg', 0.9)
        }
        bbImg.onerror = () => {
          URL.revokeObjectURL(svgUrl)
          reject(new Error('Failed to load blackboard'))
        }
        bbImg.src = svgUrl
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = photo.previewUrl
    })
  }, [template, values, sketchData, options])

  // Process all photos
  const handleProcessAll = useCallback(async () => {
    const pendingPhotos = photos.filter(p => p.status === 'pending' || p.status === 'error')
    if (pendingPhotos.length === 0) return

    setIsProcessing(true)
    setProgress({ completed: 0, total: pendingPhotos.length })

    const results: { photoId: string; blob: Blob }[] = []

    for (let i = 0; i < pendingPhotos.length; i++) {
      const photo = pendingPhotos[i]

      // Update status to processing
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, status: 'processing' as const } : p
      ))

      try {
        const { resultUrl, blob } = await composeSinglePhoto(photo)
        results.push({ photoId: photo.id, blob })

        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, status: 'completed' as const, resultUrl } : p
        ))
      } catch (error) {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? {
            ...p,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          } : p
        ))
      }

      setProgress({ completed: i + 1, total: pendingPhotos.length })
    }

    setIsProcessing(false)

    if (onBatchComplete && results.length > 0) {
      onBatchComplete(results)
    }
  }, [photos, composeSinglePhoto, onBatchComplete])

  // Download all completed
  const handleDownloadAll = useCallback(() => {
    const completedPhotos = photos.filter(p => p.status === 'completed' && p.resultUrl)
    completedPhotos.forEach((photo, index) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = photo.resultUrl!
        link.download = `composed_${photo.file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, index * 200) // Stagger downloads
    })
  }, [photos])

  const pendingCount = photos.filter(p => p.status === 'pending').length
  const completedCount = photos.filter(p => p.status === 'completed').length
  const errorCount = photos.filter(p => p.status === 'error').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Position
          </label>
          <select
            value={options.position}
            onChange={(e) => setOptions(prev => ({ ...prev, position: e.target.value as ComposerOptions['position'] }))}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #d1d5db',
              borderRadius: 6,
            }}
          >
            <option value="top-left">Left Top</option>
            <option value="top-right">Right Top</option>
            <option value="bottom-left">Left Bottom</option>
            <option value="bottom-right">Right Bottom</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Scale: {Math.round(options.scale * 100)}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={options.scale * 100}
            onChange={(e) => setOptions(prev => ({ ...prev, scale: parseInt(e.target.value) / 100 }))}
            disabled={isProcessing}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Padding: {options.padding}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={options.padding}
            onChange={(e) => setOptions(prev => ({ ...prev, padding: parseInt(e.target.value) }))}
            disabled={isProcessing}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Opacity: {Math.round(options.opacity * 100)}%
          </label>
          <input
            type="range"
            min="20"
            max="100"
            value={options.opacity * 100}
            onChange={(e) => setOptions(prev => ({ ...prev, opacity: parseInt(e.target.value) / 100 }))}
            disabled={isProcessing}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          padding: 32,
          border: '2px dashed #d1d5db',
          borderRadius: 8,
          textAlign: 'center',
          backgroundColor: '#fafafa',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Upload size={32} style={{ marginBottom: 12, color: '#6b7280' }} />
        <p style={{ margin: 0, color: '#374151', fontWeight: 500 }}>
          Click to select photos or drag and drop
        </p>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
          Multiple photos can be selected at once
        </p>
      </div>

      {/* Photo list */}
      {photos.length > 0 && (
        <>
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 16,
            padding: 12,
            backgroundColor: '#f3f4f6',
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14, color: '#374151' }}>
              Total: <strong>{photos.length}</strong>
            </span>
            <span style={{ fontSize: 14, color: '#059669' }}>
              Completed: <strong>{completedCount}</strong>
            </span>
            <span style={{ fontSize: 14, color: '#f59e0b' }}>
              Pending: <strong>{pendingCount}</strong>
            </span>
            {errorCount > 0 && (
              <span style={{ fontSize: 14, color: '#dc2626' }}>
                Error: <strong>{errorCount}</strong>
              </span>
            )}
          </div>

          {/* Progress */}
          {isProcessing && (
            <div style={{ padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Loader2 size={16} className="animate-spin" style={{ color: '#3b82f6' }} />
                <span style={{ color: '#1d4ed8', fontWeight: 500 }}>
                  Processing... {progress.completed}/{progress.total}
                </span>
              </div>
              <div style={{
                height: 8,
                backgroundColor: '#dbeafe',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(progress.completed / progress.total) * 100}%`,
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Photo grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}>
            {photos.map(photo => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                }}
              >
                <img
                  src={photo.resultUrl || photo.previewUrl}
                  alt={photo.file.name}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: 4,
                }}>
                  {photo.status === 'completed' && (
                    <CheckCircle size={20} style={{ color: '#059669' }} />
                  )}
                  {photo.status === 'processing' && (
                    <Loader2 size={20} className="animate-spin" style={{ color: '#3b82f6' }} />
                  )}
                  {photo.status === 'error' && (
                    <XCircle size={20} style={{ color: '#dc2626' }} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  disabled={isProcessing}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: 4,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  <Trash2 size={14} style={{ color: '#ffffff' }} />
                </button>
                <div style={{
                  padding: 8,
                  fontSize: 12,
                  color: '#6b7280',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {photo.file.name}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 14,
                color: '#dc2626',
                backgroundColor: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: 6,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1,
              }}
            >
              <Trash2 size={16} />
              Clear All
            </button>

            <button
              type="button"
              onClick={handleProcessAll}
              disabled={isProcessing || pendingCount === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 14,
                color: '#ffffff',
                backgroundColor: isProcessing || pendingCount === 0 ? '#9ca3af' : '#3b82f6',
                border: 'none',
                borderRadius: 6,
                cursor: isProcessing || pendingCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Process All ({pendingCount})
            </button>

            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={completedCount === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 14,
                color: '#ffffff',
                backgroundColor: completedCount === 0 ? '#9ca3af' : '#059669',
                border: 'none',
                borderRadius: 6,
                cursor: completedCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={16} />
              Download All ({completedCount})
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default BatchComposer
