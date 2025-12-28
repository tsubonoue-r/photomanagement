/**
 * 黒板テンプレートAPI
 * GET: テンプレート一覧取得
 * POST: カスタムテンプレート作成
 */

import { NextRequest, NextResponse } from 'next/server'
import { defaultTemplates, getDefaultTemplate } from '@/data/default-templates'
import type { BlackboardTemplate, ApiResponse, PaginatedResponse } from '@/types/blackboard'

const customTemplates: BlackboardTemplate[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const includeDefaults = searchParams.get('includeDefaults') !== 'false'

    let allTemplates: BlackboardTemplate[] = []
    if (includeDefaults) allTemplates = [...defaultTemplates]
    allTemplates = [...allTemplates, ...customTemplates]
    if (activeOnly) allTemplates = allTemplates.filter(t => t.isActive)

    const total = allTemplates.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const items = allTemplates.slice(startIndex, startIndex + pageSize)

    const response: ApiResponse<PaginatedResponse<BlackboardTemplate>> = {
      success: true,
      data: { items, total, page, pageSize, totalPages }
    }
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
    } as ApiResponse<null>, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Template name is required' } }, { status: 400 })
    }
    if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one field is required' } }, { status: 400 })
    }

    const baseTemplate = body.baseTemplateId
      ? [...defaultTemplates, ...customTemplates].find(t => t.id === body.baseTemplateId)
      : getDefaultTemplate()

    const now = new Date().toISOString()
    const newTemplate: BlackboardTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      description: body.description || '',
      width: body.width || baseTemplate?.width || 600,
      height: body.height || baseTemplate?.height || 400,
      backgroundColor: body.backgroundColor || baseTemplate?.backgroundColor || '#1a472a',
      borderColor: body.borderColor || baseTemplate?.borderColor || '#8b4513',
      borderWidth: body.borderWidth || baseTemplate?.borderWidth || 8,
      fields: body.fields,
      thumbnailUrl: body.thumbnailUrl,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
    customTemplates.push(newTemplate)
    return NextResponse.json({ success: true, data: newTemplate }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
