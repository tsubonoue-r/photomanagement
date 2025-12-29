/**
 * Blackboard utilities for client-side rendering
 * Server-side Sharp-based composition is in blackboard-server.ts
 */

import type { Blackboard, BlackboardTemplate, BlackboardFieldValue, BlackboardCompositeOptions, BlackboardCompositeResult, SketchData, IntegrityInfo } from '@/types/blackboard'

export async function generateIntegrityHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyIntegrity(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await generateIntegrityHash(data)
  return actualHash === expectedHash
}

export function createHashableString(blackboard: Blackboard): string {
  const sortedValues = [...blackboard.values].sort((a, b) => a.fieldId.localeCompare(b.fieldId))
  return JSON.stringify({ id: blackboard.id, templateId: blackboard.templateId, projectId: blackboard.projectId, values: sortedValues, sketchData: blackboard.sketchData, createdAt: blackboard.createdAt })
}

export async function createIntegrityInfo(blackboard: Blackboard): Promise<IntegrityInfo> {
  const hash = await generateIntegrityHash(createHashableString(blackboard))
  return { hash, algorithm: 'SHA-256', timestamp: new Date().toISOString(), verified: true }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export function formatFieldValue(value: string | number | Date | null, fieldType: string): string {
  if (value === null || value === undefined) return ''
  if (fieldType === 'date') return formatDate(value as Date | string)
  return String(value)
}

export function drawBlackboard(canvas: HTMLCanvasElement, template: BlackboardTemplate, values: BlackboardFieldValue[], sketchData?: SketchData): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = template.width
  canvas.height = template.height
  ctx.fillStyle = template.backgroundColor
  ctx.fillRect(0, 0, template.width, template.height)
  ctx.strokeStyle = template.borderColor
  ctx.lineWidth = template.borderWidth
  ctx.strokeRect(template.borderWidth / 2, template.borderWidth / 2, template.width - template.borderWidth, template.height - template.borderWidth)
  const valueMap = new Map(values.map(v => [v.fieldId, v.value]))
  template.fields.forEach(field => {
    const x = (field.x / 100) * template.width, y = (field.y / 100) * template.height, width = (field.width / 100) * template.width, height = (field.height / 100) * template.height
    if (field.type === 'sketch') {
      ctx.strokeStyle = field.fontColor || '#ffffff'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.strokeRect(x, y, width, height); ctx.setLineDash([])
      ctx.fillStyle = field.fontColor || '#ffffff'; ctx.font = '12px sans-serif'; ctx.fillText(field.label, x + 5, y + 15)
      if (sketchData) drawSketch(ctx, sketchData, x, y, width, height)
    } else {
      ctx.fillStyle = field.fontColor || '#ffffff'; ctx.font = '12px sans-serif'; ctx.fillText(field.label + ':', x, y + 12)
      const value = valueMap.get(field.id)
      if (value !== undefined && value !== null) {
        ctx.font = `${field.fontSize || 16}px sans-serif`; ctx.textAlign = field.textAlign || 'left'
        let textX = x; if (field.textAlign === 'center') textX = x + width / 2; else if (field.textAlign === 'right') textX = x + width
        ctx.fillText(formatFieldValue(value, field.type), textX, y + height - 5); ctx.textAlign = 'left'
      }
      ctx.strokeStyle = field.fontColor || '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + height); ctx.lineTo(x + width, y + height); ctx.stroke()
    }
  })
}

export function drawSketch(ctx: CanvasRenderingContext2D, sketchData: SketchData, offsetX: number, offsetY: number, areaWidth: number, areaHeight: number): void {
  const scaleX = areaWidth / sketchData.width, scaleY = areaHeight / sketchData.height
  sketchData.paths.forEach(path => {
    if (path.tool === 'eraser') return
    ctx.strokeStyle = path.strokeColor; ctx.lineWidth = path.strokeWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (path.tool === 'pen' && path.points.length >= 2) { ctx.beginPath(); ctx.moveTo(offsetX + path.points[0].x * scaleX, offsetY + path.points[0].y * scaleY); for (let i = 1; i < path.points.length; i++) ctx.lineTo(offsetX + path.points[i].x * scaleX, offsetY + path.points[i].y * scaleY); ctx.stroke() }
    else if (path.points.length >= 2) { const start = path.points[0], end = path.points[path.points.length - 1]; ctx.beginPath()
      if (path.tool === 'line') { ctx.moveTo(offsetX + start.x * scaleX, offsetY + start.y * scaleY); ctx.lineTo(offsetX + end.x * scaleX, offsetY + end.y * scaleY) }
      else if (path.tool === 'rectangle') ctx.strokeRect(offsetX + Math.min(start.x, end.x) * scaleX, offsetY + Math.min(start.y, end.y) * scaleY, Math.abs(end.x - start.x) * scaleX, Math.abs(end.y - start.y) * scaleY)
      else if (path.tool === 'circle') ctx.ellipse(offsetX + ((start.x + end.x) / 2) * scaleX, offsetY + ((start.y + end.y) / 2) * scaleY, (Math.abs(end.x - start.x) / 2) * scaleX, (Math.abs(end.y - start.y) / 2) * scaleY, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  })
}

export function blackboardToDataUrl(template: BlackboardTemplate, values: BlackboardFieldValue[], sketchData?: SketchData): string {
  if (typeof window === 'undefined') throw new Error('Browser environment required')
  const canvas = document.createElement('canvas'); drawBlackboard(canvas, template, values, sketchData); return canvas.toDataURL('image/png')
}

export async function compositeBlackboardToPhoto(photoUrl: string, template: BlackboardTemplate, values: BlackboardFieldValue[], options: BlackboardCompositeOptions, sketchData?: SketchData): Promise<BlackboardCompositeResult> {
  if (typeof window === 'undefined') throw new Error('Browser environment required')
  return new Promise((resolve, reject) => {
    const photo = new Image(); photo.crossOrigin = 'anonymous'
    photo.onload = () => {
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Failed to get canvas context')); return }
      canvas.width = photo.width; canvas.height = photo.height; ctx.drawImage(photo, 0, 0)
      const blackboardCanvas = document.createElement('canvas'); drawBlackboard(blackboardCanvas, template, values, sketchData)
      const bbW = blackboardCanvas.width * options.scale, bbH = blackboardCanvas.height * options.scale
      let x: number, y: number
      switch (options.position) { case 'top-left': x = options.padding; y = options.padding; break; case 'top-right': x = photo.width - bbW - options.padding; y = options.padding; break; case 'bottom-left': x = options.padding; y = photo.height - bbH - options.padding; break; default: x = photo.width - bbW - options.padding; y = photo.height - bbH - options.padding }
      ctx.globalAlpha = options.opacity; ctx.drawImage(blackboardCanvas, x, y, bbW, bbH); ctx.globalAlpha = 1
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9)
      generateIntegrityHash(imageUrl).then(hash => resolve({ imageUrl, width: photo.width, height: photo.height, blackboardPosition: { x, y, width: bbW, height: bbH }, integrityHash: hash, composedAt: new Date().toISOString() }))
    }
    photo.onerror = () => reject(new Error('Failed to load photo')); photo.src = photoUrl
  })
}

/**
 * Generate SVG representation of blackboard (works in both client and server)
 */
export function generateBlackboardSvg(template: BlackboardTemplate, values: BlackboardFieldValue[], sketchData?: SketchData): string {
  const valueMap = new Map(values.map(v => [v.fieldId, v.value]))
  let fieldsHtml = ''

  template.fields.forEach(field => {
    const x = (field.x / 100) * template.width
    const y = (field.y / 100) * template.height
    const width = (field.width / 100) * template.width
    const height = (field.height / 100) * template.height

    if (field.type === 'sketch') {
      fieldsHtml += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${field.fontColor || '#ffffff'}" stroke-dasharray="5,5" />`
      fieldsHtml += `<text x="${x + 5}" y="${y + 15}" fill="${field.fontColor || '#ffffff'}" font-size="12">${field.label}</text>`

      // Render sketch data as SVG paths
      if (sketchData && sketchData.paths.length > 0) {
        const scaleX = width / sketchData.width
        const scaleY = height / sketchData.height
        sketchData.paths.forEach(path => {
          if (path.tool === 'eraser' || path.points.length < 2) return
          if (path.tool === 'pen') {
            let d = `M ${x + path.points[0].x * scaleX} ${y + path.points[0].y * scaleY}`
            for (let i = 1; i < path.points.length; i++) {
              d += ` L ${x + path.points[i].x * scaleX} ${y + path.points[i].y * scaleY}`
            }
            fieldsHtml += `<path d="${d}" stroke="${path.strokeColor}" stroke-width="${path.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
          } else if (path.tool === 'line') {
            const start = path.points[0], end = path.points[path.points.length - 1]
            fieldsHtml += `<line x1="${x + start.x * scaleX}" y1="${y + start.y * scaleY}" x2="${x + end.x * scaleX}" y2="${y + end.y * scaleY}" stroke="${path.strokeColor}" stroke-width="${path.strokeWidth}" />`
          } else if (path.tool === 'rectangle') {
            const start = path.points[0], end = path.points[path.points.length - 1]
            const rx = x + Math.min(start.x, end.x) * scaleX
            const ry = y + Math.min(start.y, end.y) * scaleY
            const rw = Math.abs(end.x - start.x) * scaleX
            const rh = Math.abs(end.y - start.y) * scaleY
            fieldsHtml += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" stroke="${path.strokeColor}" stroke-width="${path.strokeWidth}" fill="none" />`
          } else if (path.tool === 'circle') {
            const start = path.points[0], end = path.points[path.points.length - 1]
            const cx = x + ((start.x + end.x) / 2) * scaleX
            const cy = y + ((start.y + end.y) / 2) * scaleY
            const radiusX = (Math.abs(end.x - start.x) / 2) * scaleX
            const radiusY = (Math.abs(end.y - start.y) / 2) * scaleY
            fieldsHtml += `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" stroke="${path.strokeColor}" stroke-width="${path.strokeWidth}" fill="none" />`
          }
        })
      }
    } else {
      const value = valueMap.get(field.id)
      const displayValue = value !== undefined && value !== null ? formatFieldValue(value, field.type) : ''
      const textAnchor = field.textAlign === 'center' ? 'middle' : field.textAlign === 'right' ? 'end' : 'start'
      let textX = x
      if (field.textAlign === 'center') textX = x + width / 2
      else if (field.textAlign === 'right') textX = x + width

      fieldsHtml += `<text x="${x}" y="${y + 12}" fill="${field.fontColor || '#ffffff'}" font-size="12">${field.label}:</text>`
      fieldsHtml += `<text x="${textX}" y="${y + height - 5}" fill="${field.fontColor || '#ffffff'}" font-size="${field.fontSize || 16}" text-anchor="${textAnchor}">${displayValue}</text>`
      fieldsHtml += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="${field.fontColor || '#ffffff'}" stroke-width="1" />`
    }
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${template.width}" height="${template.height}" viewBox="0 0 ${template.width} ${template.height}"><rect width="${template.width}" height="${template.height}" fill="${template.backgroundColor}" /><rect x="${template.borderWidth / 2}" y="${template.borderWidth / 2}" width="${template.width - template.borderWidth}" height="${template.height - template.borderWidth}" fill="none" stroke="${template.borderColor}" stroke-width="${template.borderWidth}" />${fieldsHtml}</svg>`
}
