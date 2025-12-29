/**
 * Batch Blackboard Composition API
 * 一括黒板合成API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import sharp from 'sharp';
import type {
  BlackboardFieldValue,
  SketchData,
} from '@/types/blackboard';
import { generateBlackboardSvg } from '@/lib/blackboard';
import {
  calculateBlackboardPosition,
  type ServerCompositeOptions,
} from '@/lib/blackboard-server';
import { getTemplateById, defaultTemplates } from '@/data/default-templates';

interface BatchItem {
  photoId: string;
  success: boolean;
  imageUrl?: string;
  integrityHash?: string;
  error?: string;
}

/**
 * Calculate hash for integrity
 */
function calculateIntegrityHash(data: Buffer): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * POST /api/blackboards/compose/batch
 * Batch compose multiple photos with the same blackboard
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'multipart/form-data is required for batch composition' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const valuesJson = formData.get('values') as string;
    const optionsJson = formData.get('options') as string;
    const sketchDataJson = formData.get('sketchData') as string | null;

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
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

    // Get all photo files
    const photoFiles: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('photo') && value instanceof File) {
        photoFiles.push(value);
      }
    });

    if (photoFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo file is required' },
        { status: 400 }
      );
    }

    // Generate blackboard SVG once (reused for all photos)
    const svgContent = generateBlackboardSvg(template, values, sketchData);
    const blackboardBuffer = Buffer.from(svgContent);

    // Process each photo
    const results: BatchItem[] = [];

    for (const photoFile of photoFiles) {
      try {
        // Read photo buffer
        const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

        // Get photo metadata
        const photoMeta = await sharp(photoBuffer).metadata();
        const photoWidth = photoMeta.width || 1920;
        const photoHeight = photoMeta.height || 1080;

        // Calculate position for this photo
        const position = calculateBlackboardPosition(
          photoWidth,
          photoHeight,
          template.width,
          template.height,
          options
        );

        // Resize blackboard for this photo
        const resizedBlackboard = await sharp(blackboardBuffer)
          .resize(position.width, position.height)
          .png()
          .toBuffer();

        // Composite
        const composedBuffer = await sharp(photoBuffer)
          .composite([{
            input: resizedBlackboard,
            left: position.x,
            top: position.y,
          }])
          .jpeg({ quality: 90 })
          .toBuffer();

        // Generate hash
        const integrityHash = calculateIntegrityHash(composedBuffer);

        // Convert to base64
        const base64Image = composedBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        results.push({
          photoId: photoFile.name,
          success: true,
          imageUrl: dataUrl,
          integrityHash,
        });
      } catch (error) {
        results.push({
          photoId: photoFile.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: photoFiles.length,
      successCount,
      failCount,
      results,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in batch composition:', error);
    return NextResponse.json(
      { error: 'Failed to process batch composition', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
