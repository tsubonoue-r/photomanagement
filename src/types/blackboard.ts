/**
 * 黒板機能（電子小黒板）の型定義
 */

export type FieldType = 'text' | 'date' | 'number' | 'select' | 'sketch'

export interface BlackboardField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  defaultValue?: string
  placeholder?: string
  options?: string[]
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontColor?: string
  textAlign?: 'left' | 'center' | 'right'
}

export interface BlackboardTemplate {
  id: string
  name: string
  description?: string
  width: number
  height: number
  backgroundColor: string
  borderColor: string
  borderWidth: number
  fields: BlackboardField[]
  thumbnailUrl?: string
  isDefault: boolean
  isActive: boolean
  tableLayout?: boolean
  labelColumnWidth?: number
  createdAt: string
  updatedAt: string
}

export interface BlackboardFieldValue {
  fieldId: string
  value: string | number | Date | null
}

export interface SketchData {
  paths: SketchPath[]
  width: number
  height: number
}

export interface SketchPath {
  id: string
  points: { x: number; y: number }[]
  strokeColor: string
  strokeWidth: number
  tool: 'pen' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'eraser'
}

export interface Blackboard {
  id: string
  templateId: string
  projectId: string
  name: string
  values: BlackboardFieldValue[]
  sketchData?: SketchData
  integrityHash?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateBlackboardRequest {
  templateId: string
  projectId: string
  name: string
  values: BlackboardFieldValue[]
  sketchData?: SketchData
}

export interface UpdateBlackboardRequest {
  name?: string
  values?: BlackboardFieldValue[]
  sketchData?: SketchData
}

export interface BlackboardCompositeOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  scale: number
  opacity: number
  padding: number
}

export interface BlackboardCompositeResult {
  imageUrl: string
  width: number
  height: number
  blackboardPosition: { x: number; y: number; width: number; height: number }
  integrityHash: string
  composedAt: string
}

export interface IntegrityInfo {
  hash: string
  algorithm: 'SHA-256'
  timestamp: string
  verified: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Blackboard composition result
 */
export interface BlackboardComposition {
  id: string
  originalPhotoId: string
  composedPhotoUrl: string
  blackboardId: string
  hash: string
  timestamp: Date
  metadata: {
    originalWidth: number
    originalHeight: number
    blackboardPosition: { x: number; y: number }
    blackboardScale: number
  }
}

/**
 * Tampering detection information
 */
export interface TamperingDetectionInfo {
  photoId: string
  hash: string
  algorithm: 'sha256' | 'sha512'
  timestamp: Date
  verified: boolean
}

/**
 * Input for creating a blackboard template
 */
export interface BlackboardTemplateCreateInput {
  name: string
  description?: string
  width: number
  height: number
  backgroundColor: string
  borderColor: string
  borderWidth: number
  fields: Omit<BlackboardField, 'id'>[]
  isDefault?: boolean
}
