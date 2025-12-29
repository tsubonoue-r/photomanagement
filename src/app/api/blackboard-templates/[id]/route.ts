import { NextRequest, NextResponse } from 'next/server'
import { defaultTemplates } from '@/data/default-templates'
import type { BlackboardTemplate, ApiResponse } from '@/types/blackboard'

const customTemplates: BlackboardTemplate[] = []
interface RouteParams { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const template = defaultTemplates.find(t => t.id === id) || customTemplates.find(t => t.id === id)
    if (!template) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Template '${id}' not found` } }, { status: 404 })
    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; const body = await request.json()
    if (defaultTemplates.some(t => t.id === id)) return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify default templates' } }, { status: 403 })
    const idx = customTemplates.findIndex(t => t.id === id)
    if (idx === -1) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Template '${id}' not found` } }, { status: 404 })
    const existing = customTemplates[idx]
    customTemplates[idx] = { ...existing, name: body.name ?? existing.name, description: body.description ?? existing.description, width: body.width ?? existing.width, height: body.height ?? existing.height, backgroundColor: body.backgroundColor ?? existing.backgroundColor, borderColor: body.borderColor ?? existing.borderColor, borderWidth: body.borderWidth ?? existing.borderWidth, fields: body.fields ?? existing.fields, thumbnailUrl: body.thumbnailUrl ?? existing.thumbnailUrl, isActive: body.isActive ?? existing.isActive, updatedAt: new Date().toISOString() }
    return NextResponse.json({ success: true, data: customTemplates[idx] })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (defaultTemplates.some(t => t.id === id)) return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete default templates' } }, { status: 403 })
    const idx = customTemplates.findIndex(t => t.id === id)
    if (idx === -1) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Template '${id}' not found` } }, { status: 404 })
    customTemplates.splice(idx, 1)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
