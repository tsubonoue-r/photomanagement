/**
 * Blackboard Detail API Routes
 * GET /api/blackboards/[id] - Get blackboard details
 * PUT /api/blackboards/[id] - Update blackboard
 * DELETE /api/blackboards/[id] - Delete blackboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateIntegrityHash, createHashableString, verifyIntegrity } from '@/lib/blackboard';
import { requireAuth, withResourceAccess } from '@/lib/authorization';
import type { Blackboard, UpdateBlackboardRequest, ApiResponse, IntegrityInfo } from '@/types/blackboard';

const blackboards: Blackboard[] = [];

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface BlackboardWithIntegrity extends Blackboard {
  integrity?: IntegrityInfo;
}

/**
 * GET /api/blackboards/[id]
 * Get blackboard details
 * Requires: Authentication + Project VIEWER role
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const verifyHash = searchParams.get('verify') === 'true';

    // Check resource access (blackboard -> project -> VIEWER role)
    const accessError = await withResourceAccess('blackboard', id, 'VIEWER');
    if (accessError) return accessError;

    const blackboard = blackboards.find(b => b.id === id);

    if (!blackboard) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `Blackboard '${id}' not found` },
        },
        { status: 404 }
      );
    }

    const responseData: BlackboardWithIntegrity = { ...blackboard };

    if (verifyHash && blackboard.integrityHash) {
      const verified = await verifyIntegrity(
        createHashableString(blackboard),
        blackboard.integrityHash
      );
      responseData.integrity = {
        hash: blackboard.integrityHash,
        algorithm: 'SHA-256',
        timestamp: blackboard.updatedAt,
        verified,
      };
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blackboards/[id]
 * Update blackboard
 * Requires: Authentication + Project MEMBER role
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check resource access (blackboard -> project -> MEMBER role for updates)
    const accessError = await withResourceAccess('blackboard', id, 'MEMBER');
    if (accessError) return accessError;

    const body: UpdateBlackboardRequest = await request.json();
    const idx = blackboards.findIndex(b => b.id === id);

    if (idx === -1) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `Blackboard '${id}' not found` },
        },
        { status: 404 }
      );
    }

    const existing = blackboards[idx];
    blackboards[idx] = {
      ...existing,
      name: body.name ?? existing.name,
      values: body.values ?? existing.values,
      sketchData: body.sketchData ?? existing.sketchData,
      updatedAt: new Date().toISOString(),
    };

    blackboards[idx].integrityHash = await generateIntegrityHash(
      createHashableString(blackboards[idx])
    );

    return NextResponse.json({ success: true, data: blackboards[idx] });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blackboards/[id]
 * Delete blackboard
 * Requires: Authentication + Project MANAGER role
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check resource access (blackboard -> project -> MANAGER role for delete)
    const accessError = await withResourceAccess('blackboard', id, 'MANAGER');
    if (accessError) return accessError;

    const idx = blackboards.findIndex(b => b.id === id);

    if (idx === -1) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `Blackboard '${id}' not found` },
        },
        { status: 404 }
      );
    }

    blackboards.splice(idx, 1);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
