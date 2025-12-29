import { NextRequest, NextResponse } from 'next/server'
import { generateIntegrityHash, createHashableString } from '@/lib/blackboard'
import type { Blackboard, CreateBlackboardRequest, ApiResponse, PaginatedResponse } from '@/types/blackboard'

const blackboards: Blackboard[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const projectId = searchParams.get('projectId'), templateId = searchParams.get('templateId')
    let filtered = [...blackboards]
    if (projectId) filtered = filtered.filter(b => b.projectId === projectId)
    if (templateId) filtered = filtered.filter(b => b.templateId === templateId)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const total = filtered.length, totalPages = Math.ceil(total / pageSize)
    const items = filtered.slice((page - 1) * pageSize, page * pageSize)
    return NextResponse.json({ success: true, data: { items, total, page, pageSize, totalPages } } as ApiResponse<PaginatedResponse<Blackboard>>)
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBlackboardRequest = await request.json()
    if (!body.templateId) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Template ID required' } }, { status: 400 })
    if (!body.projectId) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Project ID required' } }, { status: 400 })
    if (!body.name) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Blackboard name required' } }, { status: 400 })
    const now = new Date().toISOString()
    const newBlackboard: Blackboard = { id: `blackboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, templateId: body.templateId, projectId: body.projectId, name: body.name, values: body.values || [], sketchData: body.sketchData, createdAt: now, updatedAt: now, createdBy: 'system' }
    newBlackboard.integrityHash = await generateIntegrityHash(createHashableString(newBlackboard))
    blackboards.push(newBlackboard)
    return NextResponse.json({ success: true, data: newBlackboard }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
