/**
 * 黒板詳細API - GET/PUT/DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateIntegrityHash, createHashableString, verifyIntegrity } from '@/lib/blackboard'
import type { Blackboard, UpdateBlackboardRequest, ApiResponse, IntegrityInfo } from '@/types/blackboard'

const blackboards: Blackboard[] = []

interface RouteParams { params: Promise<{ id: string }> }
interface BlackboardWithIntegrity extends Blackboard { integrity?: IntegrityInfo }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const verifyHash = searchParams.get('verify') === 'true'
    const blackboard = blackboards.find(b => b.id === id)
    if (!blackboard) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Blackboard with id '${id}' not found` } }, { status: 404 })
    }
    const responseData: BlackboardWithIntegrity = { ...blackboard }
    if (verifyHash && blackboard.integrityHash) {
      const hashableString = createHashableString(blackboard)
      const verified = await verifyIntegrity(hashableString, blackboard.integrityHash)
      responseData.integrity = { hash: blackboard.integrityHash, algorithm: 'SHA-256', timestamp: blackboard.updatedAt, verified }
    }
    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body: UpdateBlackboardRequest = await request.json()
    const blackboardIndex = blackboards.findIndex(b => b.id === id)
    if (blackboardIndex === -1) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Blackboard with id '${id}' not found` } }, { status: 404 })
    }
    const existingBlackboard = blackboards[blackboardIndex]
    const now = new Date().toISOString()
    const updatedBlackboard: Blackboard = {
      ...existingBlackboard,
      name: body.name ?? existingBlackboard.name,
      values: body.values ?? existingBlackboard.values,
      sketchData: body.sketchData ?? existingBlackboard.sketchData,
      updatedAt: now
    }
    const hashableString = createHashableString(updatedBlackboard)
    updatedBlackboard.integrityHash = await generateIntegrityHash(hashableString)
    blackboards[blackboardIndex] = updatedBlackboard
    return NextResponse.json({ success: true, data: updatedBlackboard })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const blackboardIndex = blackboards.findIndex(b => b.id === id)
    if (blackboardIndex === -1) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `Blackboard with id '${id}' not found` } }, { status: 404 })
    }
    blackboards.splice(blackboardIndex, 1)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
