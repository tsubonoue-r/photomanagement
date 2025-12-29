/**
 * 黒板機能（電子小黒板）の型定義
 */

/** フィールドの種類 */
export type FieldType =
  | 'text'      // テキスト入力
  | 'date'      // 日付
  | 'number'    // 数値
  | 'select'    // 選択肢
  | 'sketch'    // 略図描画

/** フィールド定義 */
export interface BlackboardField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  defaultValue?: string
  placeholder?: string
  options?: string[]  // selectの場合の選択肢
  x: number           // 黒板上のX座標 (%)
  y: number           // 黒板上のY座標 (%)
  width: number       // 幅 (%)
  height: number      // 高さ (%)
  fontSize?: number   // フォントサイズ (px)
  fontColor?: string  // フォント色
  textAlign?: 'left' | 'center' | 'right'
}

/** 黒板テンプレート */
export interface BlackboardTemplate {
  id: string
  name: string
  description?: string
  width: number        // 黒板の幅 (px)
  height: number       // 黒板の高さ (px)
  backgroundColor: string
  borderColor: string
  borderWidth: number
  fields: BlackboardField[]
  thumbnailUrl?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** フィールド値 */
export interface BlackboardFieldValue {
  fieldId: string
  value: string | number | Date | null
}

/** 略図データ */
export interface SketchData {
  paths: SketchPath[]
  width: number
  height: number
}

/** 略図のパス */
export interface SketchPath {
  id: string
  points: { x: number; y: number }[]
  strokeColor: string
  strokeWidth: number
  tool: 'pen' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'eraser'
}

/** 黒板データ */
export interface Blackboard {
  id: string
  templateId: string
  projectId: string
  name: string
  values: BlackboardFieldValue[]
  sketchData?: SketchData
  integrityHash?: string  // 改ざん検知用ハッシュ
  createdAt: string
  updatedAt: string
  createdBy: string
}

/** 黒板作成リクエスト */
export interface CreateBlackboardRequest {
  templateId: string
  projectId: string
  name: string
  values: BlackboardFieldValue[]
  sketchData?: SketchData
}

/** 黒板更新リクエスト */
export interface UpdateBlackboardRequest {
  name?: string
  values?: BlackboardFieldValue[]
  sketchData?: SketchData
}

/** 黒板合成オプション */
export interface BlackboardCompositeOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  scale: number         // 0.1 - 1.0
  opacity: number       // 0 - 1
  padding: number       // 余白 (px)
}

/** 黒板合成結果 */
export interface BlackboardCompositeResult {
  imageUrl: string
  width: number
  height: number
  blackboardPosition: {
    x: number
    y: number
    width: number
    height: number
  }
  integrityHash: string
  composedAt: string
}

/** 改ざん検知情報 */
export interface IntegrityInfo {
  hash: string
  algorithm: 'SHA-256'
  timestamp: string
  verified: boolean
}

/** APIレスポンス */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

/** ページネーション */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
