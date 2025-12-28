/**
 * 黒板テンプレート詳細API
 */

import { NextRequest, NextResponse } from 'next/server'
import { defaultTemplates } from '@/data/default-templates'
import type { BlackboardTemplate, ApiResponse } from '@/types/blackboard'

const customTemplates: BlackboardTemplate[] = []

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    let template = defaultTemplates.find(t => t.id === id)
    if (!template) template = customTemplates.find(t => t.id === id)
    if (!template) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Template with id '${id}' not found` } }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    if (defaultTemplates.some(t => t.id === id)) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Default templates cannot be modified' } }, { status: 403 })
    }
    const templateIndex = customTemplates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Template with id '${id}' not found` } }, { status: 404 })
    }
    const existingTemplate = customTemplates[templateIndex]
    const updatedTemplate: BlackboardTemplate = {
      ...existingTemplate,
      name: body.name ?? existingTemplate.name,
      description: body.description ?? existingTemplate.description,
      width: body.width ?? existingTemplate.width,
      height: body.height ?? existingTemplate.height,
      backgroundColor: body.backgroundColor ?? existingTemplate.backgroundColor,
      borderColor: body.borderColor ?? existingTemplate.borderColor,
      borderWidth: body.borderWidth ?? existingTemplate.borderWidth,
      fields: body.fields ?? existingTemplate.fields,
      thumbnailUrl: body.thumbnailUrl ?? existingTemplate.thumbnailUrl,
      isActive: body.isActive ?? existingTemplate.isActive,
      updatedAt: new Date().toISOString()
    }
    customTemplates[templateIndex] = updatedTemplate
    return NextResponse.json({ success: true, data: updatedTemplate })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (defaultTemplates.some(t => t.id === id)) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Default templates cannot be deleted' } }, { status: 403 })
    }
    const templateIndex = customTemplates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Template with id '${id}' not found` } }, { status: 404 })
    }
    customTemplates.splice(templateIndex, 1)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
