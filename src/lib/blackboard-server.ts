/**
 * Server-side blackboard composition utilities using Sharp
 * This file should only be imported in server-side code (API routes, server actions)
 */

import sharp from 'sharp';
import { createHash } from 'crypto';
import type { BlackboardTemplate, BlackboardFieldValue, SketchData } from '@/types/blackboard';
import { generateBlackboardSvg, formatFieldValue } from './blackboard';

/**
 * Server-side blackboard composition options
 */
export interface ServerCompositeOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  scale: number;
  opacity: number;
  padding: number;
  customX?: number;
  customY?: number;
}

/**
 * Server-side composition result
 */
export interface ServerCompositeResult {
  buffer: Buffer;
  width: number;
  height: number;
  blackboardPosition: { x: number; y: number; width: number; height: number };
  integrityHash: string;
  composedAt: string;
  format: 'jpeg' | 'png';
}

/**
 * Batch composition item
 */
export interface BatchCompositeItem {
  photoId: string;
  photoBuffer: Buffer;
  blackboardId?: string;
}

/**
 * Batch composition result
 */
export interface BatchCompositeResult {
  photoId: string;
  success: boolean;
  result?: ServerCompositeResult;
  error?: string;
}

/**
 * Calculate blackboard position on photo based on options
 */
export function calculateBlackboardPosition(
  photoWidth: number,
  photoHeight: number,
  blackboardWidth: number,
  blackboardHeight: number,
  options: ServerCompositeOptions
): { x: number; y: number; width: number; height: number } {
  const bbW = Math.round(blackboardWidth * options.scale);
  const bbH = Math.round(blackboardHeight * options.scale);

  let x: number, y: number;

  if (options.position === 'custom' && options.customX !== undefined && options.customY !== undefined) {
    x = options.customX;
    y = options.customY;
  } else {
    switch (options.position) {
      case 'top-left':
        x = options.padding;
        y = options.padding;
        break;
      case 'top-right':
        x = photoWidth - bbW - options.padding;
        y = options.padding;
        break;
      case 'bottom-left':
        x = options.padding;
        y = photoHeight - bbH - options.padding;
        break;
      case 'bottom-right':
      default:
        x = photoWidth - bbW - options.padding;
        y = photoHeight - bbH - options.padding;
        break;
    }
  }

  // Ensure position is within bounds
  x = Math.max(0, Math.min(x, photoWidth - bbW));
  y = Math.max(0, Math.min(y, photoHeight - bbH));

  return { x, y, width: bbW, height: bbH };
}

/**
 * Generate hash for server-side integrity check (Node.js crypto)
 */
export function generateServerIntegrityHash(buffer: Buffer): string {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Server-side blackboard composition using Sharp
 * Composites a blackboard SVG onto a photo
 */
export async function compositeBlackboardToPhotoServer(
  photoBuffer: Buffer,
  template: BlackboardTemplate,
  values: BlackboardFieldValue[],
  options: ServerCompositeOptions,
  sketchData?: SketchData
): Promise<ServerCompositeResult> {
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
  const integrityHash = generateServerIntegrityHash(composedBuffer);

  return {
    buffer: composedBuffer,
    width: photoWidth,
    height: photoHeight,
    blackboardPosition: position,
    integrityHash,
    composedAt: new Date().toISOString(),
    format: 'jpeg'
  };
}

/**
 * Batch composition for multiple photos
 */
export async function batchCompositeBlackboards(
  items: BatchCompositeItem[],
  template: BlackboardTemplate,
  values: BlackboardFieldValue[],
  options: ServerCompositeOptions,
  sketchData?: SketchData,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchCompositeResult[]> {
  const results: BatchCompositeResult[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const result = await compositeBlackboardToPhotoServer(
        item.photoBuffer,
        template,
        values,
        options,
        sketchData
      );
      results.push({
        photoId: item.photoId,
        success: true,
        result
      });
    } catch (error) {
      results.push({
        photoId: item.photoId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}

/**
 * Generate downloadable blackboard image (PNG)
 */
export async function generateBlackboardImage(
  template: BlackboardTemplate,
  values: BlackboardFieldValue[],
  sketchData?: SketchData,
  scale: number = 1
): Promise<Buffer> {
  const svgContent = generateBlackboardSvg(template, values, sketchData);
  const svgBuffer = Buffer.from(svgContent);

  const outputWidth = Math.round(template.width * scale);
  const outputHeight = Math.round(template.height * scale);

  return sharp(svgBuffer)
    .resize(outputWidth, outputHeight)
    .png()
    .toBuffer();
}
