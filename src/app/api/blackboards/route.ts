/**
 * 黒板API - CRUD操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateIntegrityHash, createHashableString } from '@/lib/blackboard'
import type { Blackboard, CreateBlackboardRequest, ApiResponse, PaginatedResponse } from '@/types/blackboard'

const blackboards: Blackboard[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const projectId = searchParams.get('projectId')
    const templateId = searchParams.get('templateId')

    let filteredBlackboards = [...blackboards]
    if (projectId) filteredBlackboards = filteredBlackboards.filter(b => b.projectId === projectId)
    if (templateId) filteredBlackboards = filteredBlackboards.filter(b => b.templateId === templateId)
    filteredBlackboards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = filteredBlackboards.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const items = filteredBlackboards.slice(startIndex, startIndex + pageSize)

    return NextResponse.json({ success: true, data: { items, total, page, pageSize, totalPages } } as ApiResponse<PaginatedResponse<Blackboard>>)
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBlackboardRequest = await request.json()
    if (!body.templateId) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Template ID is required' } }, { status: 400 })
    if (!body.projectId) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Project ID is required' } }, { status: 400 })
    if (!body.name || typeof body.name !== 'string') return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Blackboard name is required' } }, { status: 400 })

    const now = new Date().toISOString()
    const newBlackboard: Blackboard = {
      id: `blackboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId: body.templateId,
      projectId: body.projectId,
      name: body.name,
      values: body.values || [],
      sketchData: body.sketchData,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system'
    }
    const hashableString = createHashableString(newBlackboard)
    newBlackboard.integrityHash = await generateIntegrityHash(hashableString)
    blackboards.push(newBlackboard)
    return NextResponse.json({ success: true, data: newBlackboard }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
