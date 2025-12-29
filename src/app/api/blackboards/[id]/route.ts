import { NextRequest, NextResponse } from 'next/server'
import { generateIntegrityHash, createHashableString, verifyIntegrity } from '@/lib/blackboard'
import type { Blackboard, UpdateBlackboardRequest, ApiResponse, IntegrityInfo } from '@/types/blackboard'

const blackboards: Blackboard[] = []
interface RouteParams { params: Promise<{ id: string }> }
interface BlackboardWithIntegrity extends Blackboard { integrity?: IntegrityInfo }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; const { searchParams } = new URL(request.url); const verifyHash = searchParams.get('verify') === 'true'
    const blackboard = blackboards.find(b => b.id === id)
    if (!blackboard) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Blackboard '${id}' not found` } }, { status: 404 })
    const responseData: BlackboardWithIntegrity = { ...blackboard }
    if (verifyHash && blackboard.integrityHash) {
      const verified = await verifyIntegrity(createHashableString(blackboard), blackboard.integrityHash)
      responseData.integrity = { hash: blackboard.integrityHash, algorithm: 'SHA-256', timestamp: blackboard.updatedAt, verified }
    }
    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; const body: UpdateBlackboardRequest = await request.json()
    const idx = blackboards.findIndex(b => b.id === id)
    if (idx === -1) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Blackboard '${id}' not found` } }, { status: 404 })
    const existing = blackboards[idx]
    blackboards[idx] = { ...existing, name: body.name ?? existing.name, values: body.values ?? existing.values, sketchData: body.sketchData ?? existing.sketchData, updatedAt: new Date().toISOString() }
    blackboards[idx].integrityHash = await generateIntegrityHash(createHashableString(blackboards[idx]))
    return NextResponse.json({ success: true, data: blackboards[idx] })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const idx = blackboards.findIndex(b => b.id === id)
    if (idx === -1) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Blackboard '${id}' not found` } }, { status: 404 })
    blackboards.splice(idx, 1)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
