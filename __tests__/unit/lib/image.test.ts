/**
 * Image Processing Unit Tests
 * Issue #27: Testing for image processing utilities
 */

import {
  validateImage,
  getExtensionFromMimeType,
} from '@/lib/image';

// Mock modules that require native dependencies
jest.mock('sharp', () => {
  return jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock')),
  }));
});

jest.mock('exifr', () => ({
  parse: jest.fn().mockResolvedValue({
    Make: 'Canon',
    Model: 'EOS R5',
    DateTimeOriginal: new Date('2024-01-15'),
    ExposureTime: 0.004,
    FNumber: 2.8,
    ISO: 100,
    FocalLength: 50,
    latitude: 35.6762,
    longitude: 139.6503,
    ExifImageWidth: 8192,
    ExifImageHeight: 5464,
  }),
}));

// Import types after mocking
import type { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/types/photo';

// Define constants for tests (same as in types/photo.ts)
const TEST_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const TEST_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

describe('Image Processing Module', () => {
  describe('validateImage', () => {
    it('should validate a valid JPEG image', () => {
      const file = {
        type: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        name: 'test.jpg',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid PNG image', () => {
      const file = {
        type: 'image/png',
        size: 2 * 1024 * 1024, // 2MB
        name: 'test.png',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(true);
    });

    it('should validate a valid HEIC image', () => {
      const file = {
        type: 'image/heic',
        size: 3 * 1024 * 1024, // 3MB
        name: 'test.heic',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(true);
    });

    it('should reject files that exceed max size', () => {
      const file = {
        type: 'image/jpeg',
        size: 100 * 1024 * 1024, // 100MB
        name: 'large.jpg',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('size exceeds');
    });

    it('should reject unsupported MIME types', () => {
      const file = {
        type: 'image/gif',
        size: 1024 * 1024,
        name: 'test.gif',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject non-image MIME types', () => {
      const file = {
        type: 'application/pdf',
        size: 1024 * 1024,
        name: 'test.pdf',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should handle case-insensitive MIME types', () => {
      const file = {
        type: 'IMAGE/JPEG',
        size: 1024 * 1024,
        name: 'test.jpg',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(true);
    });

    it('should accept files at exactly max size', () => {
      const file = {
        type: 'image/jpeg',
        size: TEST_MAX_FILE_SIZE,
        name: 'exact-size.jpg',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(true);
    });

    it('should reject files just over max size', () => {
      const file = {
        type: 'image/jpeg',
        size: TEST_MAX_FILE_SIZE + 1,
        name: 'over-size.jpg',
      };

      const result = validateImage(file);

      expect(result.valid).toBe(false);
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('should return jpg for image/jpeg', () => {
      expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
    });

    it('should return png for image/png', () => {
      expect(getExtensionFromMimeType('image/png')).toBe('png');
    });

    it('should return heic for image/heic', () => {
      expect(getExtensionFromMimeType('image/heic')).toBe('heic');
    });

    it('should return heif for image/heif', () => {
      expect(getExtensionFromMimeType('image/heif')).toBe('heif');
    });

    it('should return jpg for unknown MIME types', () => {
      expect(getExtensionFromMimeType('image/unknown')).toBe('jpg');
      expect(getExtensionFromMimeType('application/pdf')).toBe('jpg');
    });
  });
});

describe('Image Processing Functions (Mocked)', () => {
  // Import functions that use mocked dependencies
  const { extractExifData, getImageDimensions, generateThumbnail } = require('@/lib/image');

  describe('extractExifData', () => {
    it('should extract EXIF data from buffer', async () => {
      const buffer = Buffer.from('mock image data');

      const exif = await extractExifData(buffer);

      expect(exif).toHaveProperty('make', 'Canon');
      expect(exif).toHaveProperty('model', 'EOS R5');
      expect(exif).toHaveProperty('fNumber', 2.8);
      expect(exif).toHaveProperty('iso', 100);
    });
  });

  describe('getImageDimensions', () => {
    it('should return image dimensions', async () => {
      const buffer = Buffer.from('mock image data');

      const dimensions = await getImageDimensions(buffer);

      expect(dimensions).toEqual({
        width: 1920,
        height: 1080,
      });
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail buffer', async () => {
      const buffer = Buffer.from('mock image data');

      const thumbnail = await generateThumbnail(buffer, 'small');

      expect(Buffer.isBuffer(thumbnail)).toBe(true);
    });
  });
});
