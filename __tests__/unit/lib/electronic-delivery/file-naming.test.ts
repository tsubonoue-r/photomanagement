/**
 * File Naming Unit Tests
 * Issue #27: Testing for electronic delivery file naming utilities
 */

import {
  generatePhotoFileName,
  generateDrawingFileName,
  extractSequenceNumber,
  isValidPhotoFileName,
  isValidDrawingFileName,
  isValidDeliveryFileName,
  normalizeExtension,
  getExtension,
  isSupportedExtension,
  isSupportedPhotoExtension,
  isSupportedDrawingExtension,
  FileNameGenerator,
} from '@/lib/electronic-delivery/file-naming';

describe('File Naming Module', () => {
  describe('generatePhotoFileName', () => {
    it('should generate valid photo file name with default extension', () => {
      const result = generatePhotoFileName(1);
      expect(result).toBe('P0000001.JPG');
    });

    it('should generate valid photo file name with specified extension', () => {
      const result = generatePhotoFileName(1, 'TIFF');
      expect(result).toBe('P0000001.TIF');
    });

    it('should handle large sequence numbers', () => {
      const result = generatePhotoFileName(9999999);
      expect(result).toBe('P9999999.JPG');
    });

    it('should pad sequence numbers correctly', () => {
      expect(generatePhotoFileName(1)).toBe('P0000001.JPG');
      expect(generatePhotoFileName(12)).toBe('P0000012.JPG');
      expect(generatePhotoFileName(123)).toBe('P0000123.JPG');
      expect(generatePhotoFileName(1234567)).toBe('P1234567.JPG');
    });

    it('should throw error for invalid sequence number (0)', () => {
      expect(() => generatePhotoFileName(0)).toThrow('1以上');
    });

    it('should throw error for negative sequence number', () => {
      expect(() => generatePhotoFileName(-1)).toThrow('1以上');
    });

    it('should throw error for sequence number exceeding max', () => {
      expect(() => generatePhotoFileName(10000000)).toThrow('9999999以下');
    });

    it('should throw error for non-integer sequence number', () => {
      expect(() => generatePhotoFileName(1.5)).toThrow('整数');
    });
  });

  describe('generateDrawingFileName', () => {
    it('should generate valid drawing file name', () => {
      const result = generateDrawingFileName(1, 'PDF');
      expect(result).toBe('D0000001.PDF');
    });

    it('should handle different extensions', () => {
      expect(generateDrawingFileName(1, 'JPG')).toBe('D0000001.JPG');
      expect(generateDrawingFileName(1, 'TIF')).toBe('D0000001.TIF');
      expect(generateDrawingFileName(1, 'PDF')).toBe('D0000001.PDF');
    });
  });

  describe('extractSequenceNumber', () => {
    it('should extract sequence number from photo file name', () => {
      expect(extractSequenceNumber('P0000001.JPG')).toBe(1);
      expect(extractSequenceNumber('P1234567.JPG')).toBe(1234567);
    });

    it('should extract sequence number from drawing file name', () => {
      expect(extractSequenceNumber('D0000001.PDF')).toBe(1);
      expect(extractSequenceNumber('D0000123.TIF')).toBe(123);
    });

    it('should return null for invalid file name', () => {
      expect(extractSequenceNumber('invalid.jpg')).toBeNull();
      expect(extractSequenceNumber('P1.JPG')).toBeNull();
      expect(extractSequenceNumber('X0000001.JPG')).toBeNull();
    });

    it('should be case insensitive', () => {
      expect(extractSequenceNumber('p0000001.jpg')).toBe(1);
      expect(extractSequenceNumber('d0000001.pdf')).toBe(1);
    });
  });

  describe('isValidPhotoFileName', () => {
    it('should validate correct photo file names', () => {
      expect(isValidPhotoFileName('P0000001.JPG')).toBe(true);
      expect(isValidPhotoFileName('P9999999.JPEG')).toBe(true);
      expect(isValidPhotoFileName('P0000001.TIF')).toBe(true);
      expect(isValidPhotoFileName('P0000001.TIFF')).toBe(true);
    });

    it('should reject invalid photo file names', () => {
      expect(isValidPhotoFileName('D0000001.JPG')).toBe(false);
      expect(isValidPhotoFileName('P1.JPG')).toBe(false);
      expect(isValidPhotoFileName('P0000001.PDF')).toBe(false);
      expect(isValidPhotoFileName('photo.jpg')).toBe(false);
      expect(isValidPhotoFileName('')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidPhotoFileName('p0000001.jpg')).toBe(true);
      expect(isValidPhotoFileName('P0000001.jpg')).toBe(true);
    });
  });

  describe('isValidDrawingFileName', () => {
    it('should validate correct drawing file names', () => {
      expect(isValidDrawingFileName('D0000001.JPG')).toBe(true);
      expect(isValidDrawingFileName('D0000001.PDF')).toBe(true);
      expect(isValidDrawingFileName('D0000001.TIF')).toBe(true);
    });

    it('should reject invalid drawing file names', () => {
      expect(isValidDrawingFileName('P0000001.JPG')).toBe(false);
      expect(isValidDrawingFileName('D1.JPG')).toBe(false);
      expect(isValidDrawingFileName('drawing.pdf')).toBe(false);
    });
  });

  describe('isValidDeliveryFileName', () => {
    it('should validate both photo and drawing file names', () => {
      expect(isValidDeliveryFileName('P0000001.JPG')).toBe(true);
      expect(isValidDeliveryFileName('D0000001.PDF')).toBe(true);
    });

    it('should reject invalid file names', () => {
      expect(isValidDeliveryFileName('invalid.jpg')).toBe(false);
    });
  });

  describe('normalizeExtension', () => {
    it('should normalize JPEG to JPG', () => {
      expect(normalizeExtension('JPEG')).toBe('JPG');
      expect(normalizeExtension('jpeg')).toBe('JPG');
    });

    it('should normalize TIFF to TIF', () => {
      expect(normalizeExtension('TIFF')).toBe('TIF');
      expect(normalizeExtension('tiff')).toBe('TIF');
    });

    it('should keep other extensions as uppercase', () => {
      expect(normalizeExtension('jpg')).toBe('JPG');
      expect(normalizeExtension('pdf')).toBe('PDF');
      expect(normalizeExtension('PNG')).toBe('PNG');
    });

    it('should handle leading dot', () => {
      expect(normalizeExtension('.jpg')).toBe('JPG');
      expect(normalizeExtension('.jpeg')).toBe('JPG');
    });
  });

  describe('getExtension', () => {
    it('should extract and normalize extension', () => {
      expect(getExtension('photo.jpg')).toBe('JPG');
      expect(getExtension('photo.jpeg')).toBe('JPG');
      expect(getExtension('photo.tiff')).toBe('TIF');
    });

    it('should return empty string for files without extension', () => {
      expect(getExtension('filename')).toBe('');
    });

    it('should handle multiple dots in filename', () => {
      expect(getExtension('photo.2024.01.01.jpg')).toBe('JPG');
    });
  });

  describe('isSupportedExtension', () => {
    it('should return true for supported extensions', () => {
      expect(isSupportedExtension('photo.jpg', ['JPG', 'PNG'])).toBe(true);
      expect(isSupportedExtension('photo.png', ['JPG', 'PNG'])).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(isSupportedExtension('photo.gif', ['JPG', 'PNG'])).toBe(false);
    });

    it('should use default extensions if not specified', () => {
      expect(isSupportedExtension('photo.jpg')).toBe(true);
      expect(isSupportedExtension('photo.tif')).toBe(true);
    });
  });

  describe('isSupportedPhotoExtension', () => {
    it('should support JPG, JPEG, TIF, TIFF', () => {
      expect(isSupportedPhotoExtension('photo.jpg')).toBe(true);
      expect(isSupportedPhotoExtension('photo.jpeg')).toBe(true);
      expect(isSupportedPhotoExtension('photo.tif')).toBe(true);
      expect(isSupportedPhotoExtension('photo.tiff')).toBe(true);
    });

    it('should reject unsupported formats', () => {
      expect(isSupportedPhotoExtension('photo.png')).toBe(false);
      expect(isSupportedPhotoExtension('photo.pdf')).toBe(false);
    });
  });

  describe('isSupportedDrawingExtension', () => {
    it('should support JPG, TIF, and PDF', () => {
      expect(isSupportedDrawingExtension('drawing.jpg')).toBe(true);
      expect(isSupportedDrawingExtension('drawing.tif')).toBe(true);
      expect(isSupportedDrawingExtension('drawing.pdf')).toBe(true);
    });

    it('should reject unsupported formats', () => {
      expect(isSupportedDrawingExtension('drawing.png')).toBe(false);
    });
  });

  describe('FileNameGenerator', () => {
    let generator: FileNameGenerator;

    beforeEach(() => {
      generator = new FileNameGenerator();
    });

    it('should generate sequential photo file names', () => {
      expect(generator.nextPhotoFileName()).toBe('P0000001.JPG');
      expect(generator.nextPhotoFileName()).toBe('P0000002.JPG');
      expect(generator.nextPhotoFileName()).toBe('P0000003.JPG');
    });

    it('should generate sequential drawing file names', () => {
      expect(generator.nextDrawingFileName('PDF')).toBe('D0000001.PDF');
      expect(generator.nextDrawingFileName('PDF')).toBe('D0000002.PDF');
    });

    it('should track photo and drawing counters independently', () => {
      expect(generator.nextPhotoFileName()).toBe('P0000001.JPG');
      expect(generator.nextDrawingFileName('PDF')).toBe('D0000001.PDF');
      expect(generator.nextPhotoFileName()).toBe('P0000002.JPG');
      expect(generator.nextDrawingFileName('PDF')).toBe('D0000002.PDF');
    });

    it('should initialize with custom start numbers', () => {
      const customGenerator = new FileNameGenerator(100, 50);
      expect(customGenerator.nextPhotoFileName()).toBe('P0000100.JPG');
      expect(customGenerator.nextDrawingFileName('PDF')).toBe('D0000050.PDF');
    });

    it('should return current counters', () => {
      generator.nextPhotoFileName();
      generator.nextPhotoFileName();
      generator.nextDrawingFileName('PDF');

      expect(generator.getCurrentPhotoNumber()).toBe(3);
      expect(generator.getCurrentDrawingNumber()).toBe(2);
    });

    it('should reset counters', () => {
      generator.nextPhotoFileName();
      generator.nextPhotoFileName();
      generator.reset();

      expect(generator.nextPhotoFileName()).toBe('P0000001.JPG');
    });

    it('should reset counters with custom start numbers', () => {
      generator.nextPhotoFileName();
      generator.reset(10, 5);

      expect(generator.nextPhotoFileName()).toBe('P0000010.JPG');
      expect(generator.nextDrawingFileName('PDF')).toBe('D0000005.PDF');
    });
  });
});
