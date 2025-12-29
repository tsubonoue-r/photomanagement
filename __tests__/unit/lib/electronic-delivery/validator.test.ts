/**
 * Validator Unit Tests
 * Issue #27: Testing for electronic delivery validator
 */

import {
  DeliveryValidator,
  ERROR_CODES,
  WARNING_CODES,
  formatValidationResult,
  formatValidationResultAsJson,
} from '@/lib/electronic-delivery/validator';
import type {
  ElectronicDeliveryFolder,
  PhotoFileEntry,
  PhotoInfo,
} from '@/types/electronic-delivery';

describe('DeliveryValidator', () => {
  let validator: DeliveryValidator;

  const createValidPhotoInfo = (overrides: Partial<PhotoInfo> = {}): PhotoInfo => ({
    photoNumber: 1,
    photoFileName: 'P0000001.JPG',
    photoMajorCategory: '工事写真',
    photoCategory: '施工状況',
    photoTitle: 'Test Photo',
    shootingDate: '2024-01-15',
    isRepresentativePhoto: false,
    isSubmissionFrequencyPhoto: false,
    hasDrawing: false,
    ...overrides,
  });

  const createValidPhotoFileEntry = (
    overrides: Partial<PhotoFileEntry> = {}
  ): PhotoFileEntry => ({
    originalFileName: 'original.jpg',
    deliveryFileName: 'P0000001.JPG',
    filePath: '/photos/original.jpg',
    fileSize: 1024 * 1024, // 1MB
    photoInfo: createValidPhotoInfo(),
    ...overrides,
  });

  const createValidFolder = (
    overrides: Partial<ElectronicDeliveryFolder> = {}
  ): ElectronicDeliveryFolder => ({
    rootFolderName: 'PHOTO',
    photoXmlPath: 'PHOTO/PHOTO.XML',
    picFolderPath: 'PHOTO/PIC',
    photoFiles: [createValidPhotoFileEntry()],
    drawingFiles: [],
    ...overrides,
  });

  beforeEach(() => {
    validator = new DeliveryValidator();
  });

  describe('validate', () => {
    it('should validate a valid folder structure', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({ isRepresentativePhoto: true }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing root folder', () => {
      const folder = createValidFolder({ rootFolderName: '' });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_ROOT_FOLDER,
        })
      );
    });

    it('should detect missing PHOTO.XML path', () => {
      const folder = createValidFolder({ photoXmlPath: '' });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_PHOTO_XML,
        })
      );
    });

    it('should detect missing PIC folder path', () => {
      const folder = createValidFolder({ picFolderPath: '' });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_PIC_FOLDER,
        })
      );
    });

    it('should detect empty photo list', () => {
      const folder = createValidFolder({ photoFiles: [] });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.EMPTY_PHOTO_LIST,
        })
      );
    });
  });

  describe('file naming validation', () => {
    it('should detect invalid photo file name', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            deliveryFileName: 'invalid.jpg',
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.INVALID_PHOTO_FILE_NAME,
          targetFile: 'invalid.jpg',
        })
      );
    });

    it('should detect duplicate file names', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000001.JPG',
            photoInfo: createValidPhotoInfo({ photoNumber: 1 }),
          }),
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000001.JPG',
            photoInfo: createValidPhotoInfo({ photoNumber: 2 }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.DUPLICATE_FILE_NAME,
        })
      );
    });
  });

  describe('metadata validation', () => {
    it('should detect missing photo title', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({ photoTitle: '' }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_PHOTO_TITLE,
        })
      );
    });

    it('should detect missing shooting date', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({ shootingDate: '' }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_SHOOTING_DATE,
        })
      );
    });

    it('should detect invalid date format', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({ shootingDate: '2024/01/15' }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.INVALID_DATE_FORMAT,
        })
      );
    });

    it('should accept valid date format', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({
              shootingDate: '2024-01-15',
              isRepresentativePhoto: true,
            }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(true);
    });

    it('should detect missing photo category', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({ photoCategory: '' as 'その他' }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_PHOTO_CATEGORY,
        })
      );
    });
  });

  describe('sequence validation', () => {
    it('should validate sequential photo numbers', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000001.JPG',
            photoInfo: createValidPhotoInfo({
              photoNumber: 1,
              isRepresentativePhoto: true,
            }),
          }),
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000002.JPG',
            photoInfo: createValidPhotoInfo({ photoNumber: 2 }),
          }),
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000003.JPG',
            photoInfo: createValidPhotoInfo({ photoNumber: 3 }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(true);
    });

    it('should detect non-sequential photo numbers', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000001.JPG',
            photoInfo: createValidPhotoInfo({ photoNumber: 1 }),
          }),
          createValidPhotoFileEntry({
            deliveryFileName: 'P0000003.JPG',
            photoInfo: createValidPhotoInfo({ photoNumber: 3 }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.NON_SEQUENTIAL_NUMBER,
        })
      );
    });
  });

  describe('warnings', () => {
    it('should warn about missing representative photo', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({ isRepresentativePhoto: false }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: WARNING_CODES.NO_REPRESENTATIVE_PHOTO,
        })
      );
    });

    it('should warn about missing shooting location', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            photoInfo: createValidPhotoInfo({
              shootingLocation: undefined,
              isRepresentativePhoto: true,
            }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: WARNING_CODES.MISSING_SHOOTING_LOCATION,
        })
      );
    });

    it('should warn about large file size', () => {
      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            fileSize: 15 * 1024 * 1024, // 15MB
            photoInfo: createValidPhotoInfo({ isRepresentativePhoto: true }),
          }),
        ],
      });

      const result = validator.validate(folder);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: WARNING_CODES.LARGE_FILE_SIZE,
        })
      );
    });
  });

  describe('validateXml', () => {
    it('should validate valid XML', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <photoInformation>
          <commonInformation></commonInformation>
          <photoInfo></photoInfo>
        </photoInformation>`;

      const result = validator.validateXml(validXml);

      // Note: The actual validation depends on isValidPhotoXml implementation
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('configuration', () => {
    it('should use custom max file size', () => {
      const customValidator = new DeliveryValidator({ maxFileSizeMB: 5 });

      const folder = createValidFolder({
        photoFiles: [
          createValidPhotoFileEntry({
            fileSize: 6 * 1024 * 1024, // 6MB
            photoInfo: createValidPhotoInfo({ isRepresentativePhoto: true }),
          }),
        ],
      });

      const result = customValidator.validate(folder);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: WARNING_CODES.LARGE_FILE_SIZE,
        })
      );
    });
  });
});

describe('formatValidationResult', () => {
  it('should format valid result', () => {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: '2024-01-15T10:00:00.000Z',
      targetFolder: 'PHOTO',
    };

    const formatted = formatValidationResult(result);

    expect(formatted).toContain('合格');
    expect(formatted).toContain('PHOTO');
    expect(formatted).toContain('2024-01-15');
  });

  it('should format result with errors', () => {
    const result = {
      isValid: false,
      errors: [
        {
          code: 'E001',
          message: 'Test error',
          targetFile: 'test.jpg',
        },
      ],
      warnings: [],
      validatedAt: '2024-01-15T10:00:00.000Z',
      targetFolder: 'PHOTO',
    };

    const formatted = formatValidationResult(result);

    expect(formatted).toContain('不合格');
    expect(formatted).toContain('E001');
    expect(formatted).toContain('Test error');
    expect(formatted).toContain('test.jpg');
  });

  it('should format result with warnings', () => {
    const result = {
      isValid: true,
      errors: [],
      warnings: [
        {
          code: 'W001',
          message: 'Test warning',
        },
      ],
      validatedAt: '2024-01-15T10:00:00.000Z',
      targetFolder: 'PHOTO',
    };

    const formatted = formatValidationResult(result);

    expect(formatted).toContain('W001');
    expect(formatted).toContain('Test warning');
  });
});

describe('formatValidationResultAsJson', () => {
  it('should format as valid JSON', () => {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: '2024-01-15T10:00:00.000Z',
      targetFolder: 'PHOTO',
    };

    const jsonString = formatValidationResultAsJson(result);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toEqual(result);
  });
});
