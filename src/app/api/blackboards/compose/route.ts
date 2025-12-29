/**
 * Blackboard Composition API
 * 黒板合成API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import type {
  BlackboardField,
  BlackboardComposition,
  TamperingDetectionInfo,
} from '@/types/blackboard';

// In-memory storage for compositions
const compositions: Map<string, BlackboardComposition> = new Map();

/**
 * Calculate hash for tampering detection
 */
function calculateHash(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  const hash = createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Generate unique composition ID
 */
function generateCompositionId(): string {
  return 'comp-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * POST /api/blackboards/compose
 * Create a blackboard composition (combines photo with blackboard)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      photoId,
      photoUrl,
      templateId,
      fields,
      position,
      scale,
    } = body;

    if (!photoId || !templateId || !fields) {
      return NextResponse.json(
        { error: 'photoId, templateId, and fields are required' },
        { status: 400 }
      );
    }

    // Generate composition metadata
    const compositionId = generateCompositionId();
    const timestamp = new Date();

    // Create hash for tampering detection
    // In production, this would include actual image data
    const dataToHash = JSON.stringify({
      photoId,
      templateId,
      fields,
      position,
      scale,
      timestamp: timestamp.toISOString(),
    });
    const hash = calculateHash(dataToHash);

    const composition: BlackboardComposition = {
      id: compositionId,
      originalPhotoId: photoId,
      composedPhotoUrl: photoUrl, // In production, this would be a new composed image URL
      blackboardId: templateId,
      hash,
      timestamp,
      metadata: {
        originalWidth: body.originalWidth || 1920,
        originalHeight: body.originalHeight || 1080,
        blackboardPosition: position || { x: 20, y: 20 },
        blackboardScale: scale || 1,
      },
    };

    compositions.set(compositionId, composition);

    // Create tampering detection info
    const tamperingInfo: TamperingDetectionInfo = {
      photoId,
      hash,
      algorithm: 'sha256',
      timestamp,
      verified: true,
    };

    return NextResponse.json({
      composition,
      tamperingInfo,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating composition:', error);
    return NextResponse.json(
      { error: 'Failed to create composition' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blackboards/compose
 * Get compositions for a photo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      );
    }

    const photoCompositions = Array.from(compositions.values()).filter(
      c => c.originalPhotoId === photoId
    );

    return NextResponse.json({
      compositions: photoCompositions,
      total: photoCompositions.length,
    });
  } catch (error) {
    console.error('Error fetching compositions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compositions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blackboards/compose
 * Verify tampering detection
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { compositionId, currentHash } = body;

    if (!compositionId) {
      return NextResponse.json(
        { error: 'compositionId is required' },
        { status: 400 }
      );
    }

    const composition = compositions.get(compositionId);

    if (!composition) {
      return NextResponse.json(
        { error: 'Composition not found' },
        { status: 404 }
      );
    }

    // Verify hash
    const verified = composition.hash === currentHash;

    return NextResponse.json({
      verified,
      originalHash: composition.hash,
      currentHash,
      compositionId,
      timestamp: composition.timestamp,
    });
  } catch (error) {
    console.error('Error verifying composition:', error);
    return NextResponse.json(
      { error: 'Failed to verify composition' },
      { status: 500 }
    );
  }
}
