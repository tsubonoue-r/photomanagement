/**
 * 黒板合成・描画ロジック
 * Canvas APIを使用した黒板の描画と写真への合成処理
 */

import type {
  Blackboard,
  BlackboardTemplate,
  BlackboardFieldValue,
  BlackboardCompositeOptions,
  BlackboardCompositeResult,
  SketchData,
  SketchPath,
  IntegrityInfo
} from '@/types/blackboard'

/** 改ざん検知用ハッシュを生成 */
export async function generateIntegrityHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** ハッシュを検証 */
export async function verifyIntegrity(
  data: string,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await generateIntegrityHash(data)
  return actualHash === expectedHash
}

/** 黒板データからハッシュ対象文字列を生成 */
export function createHashableString(blackboard: Blackboard): string {
  const sortedValues = [...blackboard.values].sort((a, b) =>
    a.fieldId.localeCompare(b.fieldId)
  )
  const data = {
    id: blackboard.id,
    templateId: blackboard.templateId,
    projectId: blackboard.projectId,
    values: sortedValues,
    sketchData: blackboard.sketchData,
    createdAt: blackboard.createdAt
  }
  return JSON.stringify(data)
}

/** 改ざん検知情報を生成 */
export async function createIntegrityInfo(
  blackboard: Blackboard
): Promise<IntegrityInfo> {
  const hashableString = createHashableString(blackboard)
  const hash = await generateIntegrityHash(hashableString)
  return {
    hash,
    algorithm: 'SHA-256',
    timestamp: new Date().toISOString(),
    verified: true
  }
}

/** 日付をフォーマット */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/** フィールド値を表示用文字列に変換 */
export function formatFieldValue(
  value: string | number | Date | null,
  fieldType: string
): string {
  if (value === null || value === undefined) return ''
  if (fieldType === 'date') return formatDate(value as Date | string)
  return String(value)
}

/** 黒板をCanvasに描画 */
export function drawBlackboard(
  canvas: HTMLCanvasElement,
  template: BlackboardTemplate,
  values: BlackboardFieldValue[],
  sketchData?: SketchData
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = template.width
  canvas.height = template.height

  // 背景
  ctx.fillStyle = template.backgroundColor
  ctx.fillRect(0, 0, template.width, template.height)

  // 枠線
  ctx.strokeStyle = template.borderColor
  ctx.lineWidth = template.borderWidth
  ctx.strokeRect(
    template.borderWidth / 2,
    template.borderWidth / 2,
    template.width - template.borderWidth,
    template.height - template.borderWidth
  )

  const valueMap = new Map(values.map(v => [v.fieldId, v.value]))

  template.fields.forEach(field => {
    const x = (field.x / 100) * template.width
    const y = (field.y / 100) * template.height
    const width = (field.width / 100) * template.width
    const height = (field.height / 100) * template.height

    if (field.type === 'sketch') {
      ctx.strokeStyle = field.fontColor || '#ffffff'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, width, height)
      ctx.setLineDash([])
      ctx.fillStyle = field.fontColor || '#ffffff'
      ctx.font = '12px sans-serif'
      ctx.fillText(field.label, x + 5, y + 15)
      if (sketchData) drawSketch(ctx, sketchData, x, y, width, height)
    } else {
      ctx.fillStyle = field.fontColor || '#ffffff'
      ctx.font = '12px sans-serif'
      ctx.fillText(field.label + ':', x, y + 12)

      const value = valueMap.get(field.id)
      if (value !== undefined && value !== null) {
        const displayValue = formatFieldValue(value, field.type)
        ctx.font = `${field.fontSize || 16}px sans-serif`
        ctx.textAlign = field.textAlign || 'left'
        let textX = x
        if (field.textAlign === 'center') textX = x + width / 2
        else if (field.textAlign === 'right') textX = x + width
        ctx.fillText(displayValue, textX, y + height - 5)
        ctx.textAlign = 'left'
      }

      ctx.strokeStyle = field.fontColor || '#ffffff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y + height)
      ctx.lineTo(x + width, y + height)
      ctx.stroke()
    }
  })
}

/** 略図をCanvas上に描画 */
export function drawSketch(
  ctx: CanvasRenderingContext2D,
  sketchData: SketchData,
  offsetX: number,
  offsetY: number,
  areaWidth: number,
  areaHeight: number
): void {
  const scaleX = areaWidth / sketchData.width
  const scaleY = areaHeight / sketchData.height

  sketchData.paths.forEach(path => {
    if (path.tool === 'eraser') return
    ctx.strokeStyle = path.strokeColor
    ctx.lineWidth = path.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (path.tool) {
      case 'pen': drawFreePath(ctx, path, offsetX, offsetY, scaleX, scaleY); break
      case 'line': drawLine(ctx, path, offsetX, offsetY, scaleX, scaleY); break
      case 'rectangle': drawRectangle(ctx, path, offsetX, offsetY, scaleX, scaleY); break
      case 'circle': drawCircle(ctx, path, offsetX, offsetY, scaleX, scaleY); break
      case 'arrow': drawArrow(ctx, path, offsetX, offsetY, scaleX, scaleY); break
    }
  })
}

function drawFreePath(ctx: CanvasRenderingContext2D, path: SketchPath, offsetX: number, offsetY: number, scaleX: number, scaleY: number): void {
  if (path.points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(offsetX + path.points[0].x * scaleX, offsetY + path.points[0].y * scaleY)
  for (let i = 1; i < path.points.length; i++) {
    ctx.lineTo(offsetX + path.points[i].x * scaleX, offsetY + path.points[i].y * scaleY)
  }
  ctx.stroke()
}

function drawLine(ctx: CanvasRenderingContext2D, path: SketchPath, offsetX: number, offsetY: number, scaleX: number, scaleY: number): void {
  if (path.points.length < 2) return
  const start = path.points[0]
  const end = path.points[path.points.length - 1]
  ctx.beginPath()
  ctx.moveTo(offsetX + start.x * scaleX, offsetY + start.y * scaleY)
  ctx.lineTo(offsetX + end.x * scaleX, offsetY + end.y * scaleY)
  ctx.stroke()
}

function drawRectangle(ctx: CanvasRenderingContext2D, path: SketchPath, offsetX: number, offsetY: number, scaleX: number, scaleY: number): void {
  if (path.points.length < 2) return
  const start = path.points[0]
  const end = path.points[path.points.length - 1]
  const x = offsetX + Math.min(start.x, end.x) * scaleX
  const y = offsetY + Math.min(start.y, end.y) * scaleY
  const width = Math.abs(end.x - start.x) * scaleX
  const height = Math.abs(end.y - start.y) * scaleY
  ctx.strokeRect(x, y, width, height)
}

function drawCircle(ctx: CanvasRenderingContext2D, path: SketchPath, offsetX: number, offsetY: number, scaleX: number, scaleY: number): void {
  if (path.points.length < 2) return
  const start = path.points[0]
  const end = path.points[path.points.length - 1]
  const centerX = offsetX + ((start.x + end.x) / 2) * scaleX
  const centerY = offsetY + ((start.y + end.y) / 2) * scaleY
  const radiusX = (Math.abs(end.x - start.x) / 2) * scaleX
  const radiusY = (Math.abs(end.y - start.y) / 2) * scaleY
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawArrow(ctx: CanvasRenderingContext2D, path: SketchPath, offsetX: number, offsetY: number, scaleX: number, scaleY: number): void {
  if (path.points.length < 2) return
  const start = path.points[0]
  const end = path.points[path.points.length - 1]
  const startX = offsetX + start.x * scaleX
  const startY = offsetY + start.y * scaleY
  const endX = offsetX + end.x * scaleX
  const endY = offsetY + end.y * scaleY

  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  const angle = Math.atan2(endY - startY, endX - startX)
  const arrowLength = 15
  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6))
  ctx.moveTo(endX, endY)
  ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6))
  ctx.stroke()
}

/** 黒板をData URLとして出力 */
export function blackboardToDataUrl(
  template: BlackboardTemplate,
  values: BlackboardFieldValue[],
  sketchData?: SketchData
): string {
  if (typeof window === 'undefined') throw new Error('Browser environment required')
  const canvas = document.createElement('canvas')
  drawBlackboard(canvas, template, values, sketchData)
  return canvas.toDataURL('image/png')
}

/** 写真に黒板を合成 */
export async function compositeBlackboardToPhoto(
  photoUrl: string,
  template: BlackboardTemplate,
  values: BlackboardFieldValue[],
  options: BlackboardCompositeOptions,
  sketchData?: SketchData
): Promise<BlackboardCompositeResult> {
  if (typeof window === 'undefined') throw new Error('Browser environment required')

  return new Promise((resolve, reject) => {
    const photo = new Image()
    photo.crossOrigin = 'anonymous'

    photo.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Failed to get canvas context')); return }

      canvas.width = photo.width
      canvas.height = photo.height
      ctx.drawImage(photo, 0, 0)

      const blackboardCanvas = document.createElement('canvas')
      drawBlackboard(blackboardCanvas, template, values, sketchData)

      const blackboardWidth = blackboardCanvas.width * options.scale
      const blackboardHeight = blackboardCanvas.height * options.scale

      let x: number, y: number
      switch (options.position) {
        case 'top-left': x = options.padding; y = options.padding; break
        case 'top-right': x = photo.width - blackboardWidth - options.padding; y = options.padding; break
        case 'bottom-left': x = options.padding; y = photo.height - blackboardHeight - options.padding; break
        default: x = photo.width - blackboardWidth - options.padding; y = photo.height - blackboardHeight - options.padding
      }

      ctx.globalAlpha = options.opacity
      ctx.drawImage(blackboardCanvas, x, y, blackboardWidth, blackboardHeight)
      ctx.globalAlpha = 1

      const imageUrl = canvas.toDataURL('image/jpeg', 0.9)
      generateIntegrityHash(imageUrl).then(hash => {
        resolve({
          imageUrl,
          width: photo.width,
          height: photo.height,
          blackboardPosition: { x, y, width: blackboardWidth, height: blackboardHeight },
          integrityHash: hash,
          composedAt: new Date().toISOString()
        })
      })
    }
    photo.onerror = () => reject(new Error('Failed to load photo'))
    photo.src = photoUrl
  })
}

/** 黒板プレビュー用SVGを生成 */
export function generateBlackboardSvg(
  template: BlackboardTemplate,
  values: BlackboardFieldValue[]
): string {
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
    } else {
      const value = valueMap.get(field.id)
      const displayValue = value !== undefined && value !== null ? formatFieldValue(value, field.type) : ''
      fieldsHtml += `<text x="${x}" y="${y + 12}" fill="${field.fontColor || '#ffffff'}" font-size="12">${field.label}:</text>`
      fieldsHtml += `<text x="${x}" y="${y + height - 5}" fill="${field.fontColor || '#ffffff'}" font-size="${field.fontSize || 16}">${displayValue}</text>`
      fieldsHtml += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="${field.fontColor || '#ffffff'}" stroke-width="1" />`
    }
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${template.width}" height="${template.height}" viewBox="0 0 ${template.width} ${template.height}">
    <rect width="${template.width}" height="${template.height}" fill="${template.backgroundColor}" />
    <rect x="${template.borderWidth / 2}" y="${template.borderWidth / 2}" width="${template.width - template.borderWidth}" height="${template.height - template.borderWidth}" fill="none" stroke="${template.borderColor}" stroke-width="${template.borderWidth}" />
    ${fieldsHtml}
  </svg>`.trim()
}
