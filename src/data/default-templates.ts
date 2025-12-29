import type { BlackboardTemplate } from '@/types/blackboard'

export const standardTemplate: BlackboardTemplate = {
  id: 'standard-construction',
  name: '標準工事黒板',
  description: '一般的な工事現場で使用する標準的な黒板レイアウト',
  width: 600, height: 400,
  backgroundColor: '#1a472a', borderColor: '#8b4513', borderWidth: 8,
  isDefault: true, isActive: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  fields: [
    { id: 'construction-name', name: 'constructionName', label: '工事名', type: 'text', required: true, placeholder: '工事名を入力', x: 5, y: 5, width: 90, height: 12, fontSize: 18, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'work-type', name: 'workType', label: '工種', type: 'text', required: true, placeholder: '工種を入力', x: 5, y: 20, width: 45, height: 10, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'work-category', name: 'workCategory', label: '種別', type: 'text', required: false, placeholder: '種別を入力', x: 50, y: 20, width: 45, height: 10, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'photo-date', name: 'photoDate', label: '撮影日', type: 'date', required: true, x: 5, y: 33, width: 45, height: 10, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'contractor', name: 'contractor', label: '施工者', type: 'text', required: false, placeholder: '施工者名', x: 50, y: 33, width: 45, height: 10, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'design-value', name: 'designValue', label: '設計値', type: 'text', required: false, placeholder: '設計値', x: 5, y: 46, width: 45, height: 10, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'measured-value', name: 'measuredValue', label: '実測値', type: 'text', required: false, placeholder: '実測値', x: 50, y: 46, width: 45, height: 10, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'sketch', name: 'sketch', label: '略図', type: 'sketch', required: false, x: 5, y: 59, width: 90, height: 38, fontColor: '#ffffff' }
  ]
}

export const simpleTemplate: BlackboardTemplate = {
  id: 'simple-blackboard',
  name: 'シンプル黒板',
  description: '必要最小限の項目のみのシンプルな黒板',
  width: 500, height: 300,
  backgroundColor: '#1a472a', borderColor: '#8b4513', borderWidth: 6,
  isDefault: false, isActive: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  fields: [
    { id: 'construction-name', name: 'constructionName', label: '工事名', type: 'text', required: true, placeholder: '工事名を入力', x: 5, y: 8, width: 90, height: 15, fontSize: 20, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'work-type', name: 'workType', label: '工種', type: 'text', required: true, placeholder: '工種を入力', x: 5, y: 28, width: 90, height: 12, fontSize: 18, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'photo-date', name: 'photoDate', label: '撮影日', type: 'date', required: true, x: 5, y: 45, width: 45, height: 12, fontSize: 18, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'contractor', name: 'contractor', label: '施工者', type: 'text', required: false, placeholder: '施工者名', x: 50, y: 45, width: 45, height: 12, fontSize: 18, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'remarks', name: 'remarks', label: '備考', type: 'text', required: false, placeholder: '備考', x: 5, y: 62, width: 90, height: 30, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' }
  ]
}

export const surveyTemplate: BlackboardTemplate = {
  id: 'survey-blackboard',
  name: '測量用黒板',
  description: '測量作業向けの設計値・実測値記入に特化した黒板',
  width: 600, height: 450,
  backgroundColor: '#1a472a', borderColor: '#8b4513', borderWidth: 8,
  isDefault: false, isActive: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  fields: [
    { id: 'construction-name', name: 'constructionName', label: '工事名', type: 'text', required: true, placeholder: '工事名を入力', x: 5, y: 4, width: 90, height: 10, fontSize: 18, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'measurement-point', name: 'measurementPoint', label: '測点', type: 'text', required: true, placeholder: '測点番号', x: 5, y: 16, width: 45, height: 8, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'photo-date', name: 'photoDate', label: '撮影日', type: 'date', required: true, x: 50, y: 16, width: 45, height: 8, fontSize: 16, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'design-height', name: 'designHeight', label: '設計高さ', type: 'text', required: false, placeholder: '設計高さ (m)', x: 5, y: 27, width: 30, height: 8, fontSize: 14, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'measured-height', name: 'measuredHeight', label: '実測高さ', type: 'text', required: false, placeholder: '実測高さ (m)', x: 35, y: 27, width: 30, height: 8, fontSize: 14, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'height-diff', name: 'heightDiff', label: '差分', type: 'text', required: false, placeholder: '差分 (mm)', x: 65, y: 27, width: 30, height: 8, fontSize: 14, fontColor: '#ffffff', textAlign: 'left' },
    { id: 'sketch', name: 'sketch', label: '略図', type: 'sketch', required: false, x: 5, y: 50, width: 90, height: 45, fontColor: '#ffffff' }
  ]
}

export const defaultTemplates: BlackboardTemplate[] = [standardTemplate, simpleTemplate, surveyTemplate]
export function getTemplateById(id: string): BlackboardTemplate | undefined { return defaultTemplates.find(t => t.id === id) }
export function getDefaultTemplate(): BlackboardTemplate { return defaultTemplates.find(t => t.isDefault) || standardTemplate }
