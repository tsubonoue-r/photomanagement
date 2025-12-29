/**
 * Blackboard Composition API
 * 黒板合成API - Sharp画像処理ライブラリを使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import sharp from 'sharp';
import type {
  BlackboardComposition,
  TamperingDetectionInfo,
  BlackboardFieldValue,
  BlackboardTemplate,
  SketchData,
} from '@/types/blackboard';
import { generateBlackboardSvg } from '@/lib/blackboard';
import {
  calculateBlackboardPosition,
  type ServerCompositeOptions,
} from '@/lib/blackboard-server';
import { getTemplateById, defaultTemplates } from '@/data/default-templates';

// In-memory storage for compositions
const compositions: Map<string, BlackboardComposition> = new Map();

/**
 * Calculate hash for tampering detection
 */
function calculateHash(data: Buffer | string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
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
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data for file uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const photoFile = formData.get('photo') as File | null;
      const templateId = formData.get('templateId') as string;
      const valuesJson = formData.get('values') as string;
      const optionsJson = formData.get('options') as string;
      const sketchDataJson = formData.get('sketchData') as string | null;

      if (!photoFile || !templateId) {
        return NextResponse.json(
          { error: 'photo file and templateId are required' },
          { status: 400 }
        );
      }

      // Get template
      const template = getTemplateById(templateId) || defaultTemplates[0];
      const values: BlackboardFieldValue[] = valuesJson ? JSON.parse(valuesJson) : [];
      const options: ServerCompositeOptions = optionsJson ? JSON.parse(optionsJson) : {
        position: 'bottom-right',
        scale: 0.3,
        opacity: 1,
        padding: 20,
      };
      const sketchData: SketchData | undefined = sketchDataJson ? JSON.parse(sketchDataJson) : undefined;

      // Read photo buffer
      const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

      // Get photo metadata
      const photoMeta = await sharp(photoBuffer).metadata();
      const photoWidth = photoMeta.width || 1920;
      const photoHeight = photoMeta.height || 1080;

      // Generate blackboard SVG
      const svgContent = generateBlackboardSvg(template, values, sketchData);
      const blackboardBuffer = Buffer.from(svgContent);

      // Calculate position
      const position = calculateBlackboardPosition(
        photoWidth,
        photoHeight,
        template.width,
        template.height,
        options
      );

      // Resize blackboard SVG to target size
      const resizedBlackboard = await sharp(blackboardBuffer)
        .resize(position.width, position.height)
        .png()
        .toBuffer();

      // Composite blackboard onto photo
      const composedBuffer = await sharp(photoBuffer)
        .composite([{
          input: resizedBlackboard,
          left: position.x,
          top: position.y,
        }])
        .jpeg({ quality: 90 })
        .toBuffer();

      // Generate integrity hash
      const integrityHash = calculateHash(composedBuffer);

      // Generate composition ID and store
      const compositionId = generateCompositionId();
      const timestamp = new Date();

      const composition: BlackboardComposition = {
        id: compositionId,
        originalPhotoId: photoFile.name,
        composedPhotoUrl: '', // Will be set when saved to storage
        blackboardId: templateId,
        hash: integrityHash,
        timestamp,
        metadata: {
          originalWidth: photoWidth,
          originalHeight: photoHeight,
          blackboardPosition: { x: position.x, y: position.y },
          blackboardScale: options.scale,
        },
      };

      compositions.set(compositionId, composition);

      // Return composed image as base64 or blob
      const base64Image = composedBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      return NextResponse.json({
        success: true,
        composition,
        imageUrl: dataUrl,
        integrityHash,
        width: photoWidth,
        height: photoHeight,
        blackboardPosition: position,
      }, { status: 201 });
    }

    // Handle JSON request (for URL-based photos or metadata only)
    const body = await request.json();
    const {
      photoId,
      photoUrl,
      templateId,
      values,
      position,
      scale,
      sketchData,
    } = body;

    if (!photoId || !templateId) {
      return NextResponse.json(
        { error: 'photoId and templateId are required' },
        { status: 400 }
      );
    }

    // Generate composition metadata
    const compositionId = generateCompositionId();
    const timestamp = new Date();

    // Create hash for tampering detection
    const dataToHash = JSON.stringify({
      photoId,
      templateId,
      values,
      position,
      scale,
      timestamp: timestamp.toISOString(),
    });
    const hash = calculateHash(dataToHash);

    const composition: BlackboardComposition = {
      id: compositionId,
      originalPhotoId: photoId,
      composedPhotoUrl: photoUrl || '',
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
      success: true,
      composition,
      tamperingInfo,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating composition:', error);
    return NextResponse.json(
      { error: 'Failed to create composition', details: error instanceof Error ? error.message : 'Unknown error' },
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
