/**
 * ファイル名規則モジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

export interface FileNamingConfig {
  startNumber: number;
  digits: number;
}

const DEFAULT_CONFIG: FileNamingConfig = {
  startNumber: 1,
  digits: 7,
};

export function generatePhotoFileName(
  sequenceNumber: number,
  extension: string = "JPG"
): string {
  validateSequenceNumber(sequenceNumber);
  const paddedNumber = padNumber(sequenceNumber, DEFAULT_CONFIG.digits);
  return "P" + paddedNumber + "." + normalizeExtension(extension);
}

export function generateDrawingFileName(
  sequenceNumber: number,
  extension: string
): string {
  validateSequenceNumber(sequenceNumber);
  const paddedNumber = padNumber(sequenceNumber, DEFAULT_CONFIG.digits);
  return "D" + paddedNumber + "." + normalizeExtension(extension);
}

export function extractSequenceNumber(fileName: string): number | null {
  const match = fileName.match(/^[PD](\d{7})\./i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function isValidPhotoFileName(fileName: string): boolean {
  const pattern = /^P\d{7}\.(JPG|JPEG|TIF|TIFF)$/i;
  return pattern.test(fileName);
}

export function isValidDrawingFileName(fileName: string): boolean {
  const pattern = /^D\d{7}\.(JPG|JPEG|TIF|TIFF|PDF)$/i;
  return pattern.test(fileName);
}

export function isValidDeliveryFileName(fileName: string): boolean {
  return isValidPhotoFileName(fileName) || isValidDrawingFileName(fileName);
}

export function normalizeExtension(extension: string): string {
  const ext = extension.replace(/^\./, "").toUpperCase();
  if (ext === "JPEG") return "JPG";
  if (ext === "TIFF") return "TIF";
  return ext;
}

export function getExtension(fileName: string): string {
  const match = fileName.match(/\.([^.]+)$/);
  if (!match) return "";
  return normalizeExtension(match[1]);
}

export function isSupportedExtension(
  fileName: string,
  allowedExtensions: string[] = ["JPG", "JPEG", "TIF", "TIFF"]
): boolean {
  const ext = getExtension(fileName);
  return allowedExtensions.some((allowed) => normalizeExtension(allowed) === ext);
}

export function isSupportedPhotoExtension(fileName: string): boolean {
  return isSupportedExtension(fileName, ["JPG", "JPEG", "TIF", "TIFF"]);
}

export function isSupportedDrawingExtension(fileName: string): boolean {
  return isSupportedExtension(fileName, ["JPG", "JPEG", "TIF", "TIFF", "PDF"]);
}

function padNumber(num: number, digits: number): string {
  return num.toString().padStart(digits, "0");
}

function validateSequenceNumber(sequenceNumber: number): void {
  if (!Number.isInteger(sequenceNumber)) {
    throw new Error("連番は整数である必要があります");
  }
  if (sequenceNumber < 1) {
    throw new Error("連番は1以上である必要があります");
  }
  if (sequenceNumber > 9999999) {
    throw new Error("連番は9999999以下である必要があります");
  }
}

export class FileNameGenerator {
  private photoCounter: number;
  private drawingCounter: number;

  constructor(startPhotoNumber: number = 1, startDrawingNumber: number = 1) {
    this.photoCounter = startPhotoNumber;
    this.drawingCounter = startDrawingNumber;
  }

  nextPhotoFileName(extension: string = "JPG"): string {
    const fileName = generatePhotoFileName(this.photoCounter, extension);
    this.photoCounter++;
    return fileName;
  }

  nextDrawingFileName(extension: string): string {
    const fileName = generateDrawingFileName(this.drawingCounter, extension);
    this.drawingCounter++;
    return fileName;
  }

  getCurrentPhotoNumber(): number {
    return this.photoCounter;
  }

  getCurrentDrawingNumber(): number {
    return this.drawingCounter;
  }

  reset(startPhotoNumber: number = 1, startDrawingNumber: number = 1): void {
    this.photoCounter = startPhotoNumber;
    this.drawingCounter = startDrawingNumber;
  }
}
