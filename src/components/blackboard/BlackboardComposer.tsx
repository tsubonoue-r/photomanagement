'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { BlackboardTemplate, BlackboardFieldValue, SketchData, BlackboardCompositeOptions } from '@/types/blackboard'
import { generateBlackboardSvg } from '@/lib/blackboard'
import { Download, Move, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Loader2 } from 'lucide-react'

type PositionPreset = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'

interface ComposerOptions {
  position: PositionPreset
  scale: number
  opacity: number
  padding: number
  customX: number
  customY: number
}

interface Props {
  template: BlackboardTemplate
  values: BlackboardFieldValue[]
  sketchData?: SketchData
  photoUrl?: string
  photoFile?: File
  onCompose?: (options: ComposerOptions) => Promise<void>
  onDownload?: (composedImageBlob: Blob) => void
  isLoading?: boolean
}

const POSITION_PRESETS: { value: PositionPreset; label: string }[] = [
  { value: 'top-left', label: 'Left Top' },
  { value: 'top-right', label: 'Right Top' },
  { value: 'bottom-left', label: 'Left Bottom' },
  { value: 'bottom-right', label: 'Right Bottom' },
  { value: 'custom', label: 'Custom' },
]

export function BlackboardComposer({
  template,
  values,
  sketchData,
  photoUrl,
  photoFile,
  onCompose,
  onDownload,
  isLoading = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [options, setOptions] = useState<ComposerOptions>({
    position: 'bottom-right',
    scale: 0.3,
    opacity: 1,
    padding: 20,
    customX: 0,
    customY: 0,
  })
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [photoSize, setPhotoSize] = useState({ width: 800, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [composedResult, setComposedResult] = useState<string | null>(null)

  // Load photo from file
  useEffect(() => {
    if (photoFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setPhotoDataUrl(dataUrl)
        // Get image dimensions
        const img = new window.Image()
        img.onload = () => {
          setPhotoSize({ width: img.width, height: img.height })
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(photoFile)
    } else if (photoUrl) {
      setPhotoDataUrl(photoUrl)
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setPhotoSize({ width: img.width, height: img.height })
      }
      img.src = photoUrl
    }
  }, [photoFile, photoUrl])

  // Calculate blackboard position
  const calculatePosition = useCallback(() => {
    const bbW = template.width * options.scale
    const bbH = template.height * options.scale

    if (options.position === 'custom') {
      return { x: options.customX, y: options.customY, width: bbW, height: bbH }
    }

    let x: number, y: number
    switch (options.position) {
      case 'top-left':
        x = options.padding
        y = options.padding
        break
      case 'top-right':
        x = photoSize.width - bbW - options.padding
        y = options.padding
        break
      case 'bottom-left':
        x = options.padding
        y = photoSize.height - bbH - options.padding
        break
      case 'bottom-right':
      default:
        x = photoSize.width - bbW - options.padding
        y = photoSize.height - bbH - options.padding
        break
    }

    return { x, y, width: bbW, height: bbH }
  }, [options, template, photoSize])

  const blackboardPosition = calculatePosition()

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (options.position !== 'custom') {
      setOptions(prev => ({
        ...prev,
        position: 'custom',
        customX: blackboardPosition.x,
        customY: blackboardPosition.y,
      }))
    }
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const scale = rect.width / photoSize.width
      setDragOffset({
        x: e.clientX - (blackboardPosition.x * scale + rect.left),
        y: e.clientY - (blackboardPosition.y * scale + rect.top),
      })
    }
  }, [options.position, blackboardPosition, photoSize])

  // Handle drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const scale = rect.width / photoSize.width
    const newX = Math.max(0, Math.min(
      photoSize.width - blackboardPosition.width,
      (e.clientX - rect.left - dragOffset.x) / scale
    ))
    const newY = Math.max(0, Math.min(
      photoSize.height - blackboardPosition.height,
      (e.clientY - rect.top - dragOffset.y) / scale
    ))
    setOptions(prev => ({
      ...prev,
      customX: Math.round(newX),
      customY: Math.round(newY),
    }))
  }, [isDragging, dragOffset, photoSize, blackboardPosition])

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle option changes
  const handleScaleChange = useCallback((delta: number) => {
    setOptions(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(1, prev.scale + delta)),
    }))
  }, [])

  const handlePositionChange = useCallback((position: PositionPreset) => {
    setOptions(prev => ({ ...prev, position }))
  }, [])

  const handlePaddingChange = useCallback((padding: number) => {
    setOptions(prev => ({ ...prev, padding }))
  }, [])

  const handleOpacityChange = useCallback((opacity: number) => {
    setOptions(prev => ({ ...prev, opacity }))
  }, [])

  const handleReset = useCallback(() => {
    setOptions({
      position: 'bottom-right',
      scale: 0.3,
      opacity: 1,
      padding: 20,
      customX: 0,
      customY: 0,
    })
    setComposedResult(null)
  }, [])

  // Handle compose
  const handleCompose = useCallback(async () => {
    if (onCompose) {
      await onCompose(options)
    }
  }, [onCompose, options])

  // Client-side preview composition
  const handlePreviewCompose = useCallback(() => {
    if (!photoDataUrl) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Draw blackboard SVG
      const svgContent = generateBlackboardSvg(template, values, sketchData)
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
      const svgUrl = URL.createObjectURL(svgBlob)

      const bbImg = new window.Image()
      bbImg.onload = () => {
        ctx.globalAlpha = options.opacity
        ctx.drawImage(
          bbImg,
          blackboardPosition.x,
          blackboardPosition.y,
          blackboardPosition.width,
          blackboardPosition.height
        )
        ctx.globalAlpha = 1

        setComposedResult(canvas.toDataURL('image/jpeg', 0.9))
        URL.revokeObjectURL(svgUrl)
      }
      bbImg.src = svgUrl
    }
    img.src = photoDataUrl
  }, [photoDataUrl, template, values, sketchData, options, blackboardPosition])

  // Handle download
  const handleDownload = useCallback(() => {
    if (!composedResult) return

    const link = document.createElement('a')
    link.href = composedResult
    link.download = `composed_${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [composedResult])

  const svgContent = generateBlackboardSvg(template, values, sketchData)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}>
        {/* Position preset */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Position
          </label>
          <select
            value={options.position}
            onChange={(e) => handlePositionChange(e.target.value as PositionPreset)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: '#ffffff',
            }}
          >
            {POSITION_PRESETS.map(preset => (
              <option key={preset.value} value={preset.value}>{preset.label}</option>
            ))}
          </select>
        </div>

        {/* Scale */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Scale: {Math.round(options.scale * 100)}%
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleScaleChange(-0.05)}
              style={{
                padding: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min="10"
              max="100"
              value={options.scale * 100}
              onChange={(e) => setOptions(prev => ({ ...prev, scale: parseInt(e.target.value) / 100 }))}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleScaleChange(0.05)}
              style={{
                padding: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Padding */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Padding: {options.padding}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={options.padding}
            onChange={(e) => handlePaddingChange(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Opacity */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Opacity: {Math.round(options.opacity * 100)}%
          </label>
          <input
            type="range"
            min="20"
            max="100"
            value={options.opacity * 100}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${photoSize.width} / ${photoSize.height}`,
          backgroundColor: '#e5e7eb',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {photoDataUrl ? (
          <>
            <img
              src={photoDataUrl}
              alt="Photo preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            {/* Blackboard overlay */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                position: 'absolute',
                left: `${(blackboardPosition.x / photoSize.width) * 100}%`,
                top: `${(blackboardPosition.y / photoSize.height) * 100}%`,
                width: `${(blackboardPosition.width / photoSize.width) * 100}%`,
                height: `${(blackboardPosition.height / photoSize.height) * 100}%`,
                opacity: options.opacity,
                cursor: 'grab',
                border: isDragging ? '2px dashed #3b82f6' : '2px solid transparent',
                boxSizing: 'border-box',
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
            {/* Position indicator */}
            {options.position === 'custom' && (
              <div style={{
                position: 'absolute',
                left: `${(blackboardPosition.x / photoSize.width) * 100}%`,
                top: `${(blackboardPosition.y / photoSize.height) * 100}%`,
                transform: 'translate(-50%, -100%)',
                padding: '4px 8px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                fontSize: 10,
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}>
                X: {Math.round(blackboardPosition.x)}, Y: {Math.round(blackboardPosition.y)}
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280',
          }}>
            <ImageIcon size={48} style={{ marginBottom: 12 }} />
            <p>Select or drop a photo</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            fontSize: 14,
            color: '#374151',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} />
          Reset
        </button>

        <button
          type="button"
          onClick={handlePreviewCompose}
          disabled={!photoDataUrl || isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            fontSize: 14,
            color: '#ffffff',
            backgroundColor: !photoDataUrl || isLoading ? '#9ca3af' : '#3b82f6',
            border: 'none',
            borderRadius: 6,
            cursor: !photoDataUrl || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Move size={16} />}
          Compose Preview
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!composedResult}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            fontSize: 14,
            color: '#ffffff',
            backgroundColor: !composedResult ? '#9ca3af' : '#059669',
            border: 'none',
            borderRadius: 6,
            cursor: !composedResult ? 'not-allowed' : 'pointer',
          }}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      {/* Composed result */}
      {composedResult && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
            Composed Result
          </h4>
          <img
            src={composedResult}
            alt="Composed result"
            style={{
              maxWidth: '100%',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default BlackboardComposer
