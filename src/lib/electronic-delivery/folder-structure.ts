/**
 * フォルダ構成生成モジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

import type {
  ElectronicDeliveryFolder,
  PhotoFileEntry,
  DrawingFileEntry,
  ProjectPhoto,
  PhotoInfo,
} from "@/types/electronic-delivery";
import {
  FileNameGenerator,
  getExtension,
  isSupportedPhotoExtension,
} from "./file-naming";

export const FOLDER_NAMES = {
  ROOT: "PHOTO",
  PIC: "PIC",
  DRA: "DRA",
  PHOTO_XML: "PHOTO.XML",
} as const;

export interface FolderStructureOptions {
  includeDrawingFolder: boolean;
  customRootName?: string;
}

const DEFAULT_OPTIONS: FolderStructureOptions = {
  includeDrawingFolder: true,
};

export interface FolderPaths {
  root: string;
  pic: string;
  dra?: string;
  photoXml: string;
}

export function generateFolderPaths(
  basePath: string,
  options: Partial<FolderStructureOptions> = {}
): FolderPaths {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rootName = opts.customRootName || FOLDER_NAMES.ROOT;
  const root = joinPath(basePath, rootName);

  const paths: FolderPaths = {
    root,
    pic: joinPath(root, FOLDER_NAMES.PIC),
    photoXml: joinPath(root, FOLDER_NAMES.PHOTO_XML),
  };

  if (opts.includeDrawingFolder) {
    paths.dra = joinPath(root, FOLDER_NAMES.DRA);
  }

  return paths;
}

export function generateFolderStructure(
  photos: ProjectPhoto[],
  options: Partial<FolderStructureOptions> = {}
): ElectronicDeliveryFolder {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rootName = opts.customRootName || FOLDER_NAMES.ROOT;

  const fileNameGenerator = new FileNameGenerator();
  const photoFiles: PhotoFileEntry[] = [];
  const drawingFiles: DrawingFileEntry[] = [];

  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(a.shootingDate).getTime() - new Date(b.shootingDate).getTime()
  );

  for (const photo of sortedPhotos) {
    if (!isSupportedPhotoExtension(photo.fileName)) {
      continue;
    }

    const extension = getExtension(photo.fileName);
    const deliveryFileName = fileNameGenerator.nextPhotoFileName(extension);

    const photoInfo = convertToPhotoInfo(
      photo,
      fileNameGenerator.getCurrentPhotoNumber() - 1,
      deliveryFileName
    );

    photoFiles.push({
      originalFileName: photo.fileName,
      deliveryFileName,
      filePath: photo.filePath,
      fileSize: photo.fileSize,
      photoInfo,
    });
  }

  return {
    rootFolderName: rootName,
    photoXmlPath: rootName + "/" + FOLDER_NAMES.PHOTO_XML,
    picFolderPath: rootName + "/" + FOLDER_NAMES.PIC,
    draFolderPath: opts.includeDrawingFolder
      ? rootName + "/" + FOLDER_NAMES.DRA
      : undefined,
    photoFiles,
    drawingFiles,
  };
}

export function convertToPhotoInfo(
  photo: ProjectPhoto,
  photoNumber: number,
  deliveryFileName: string
): PhotoInfo {
  return {
    photoNumber,
    photoFileName: deliveryFileName,
    photoFileJapaneseName: photo.title,
    photoMajorCategory: photo.majorCategory,
    photoCategory: photo.category,
    constructionType: photo.constructionType,
    workType: photo.workType,
    detailType: photo.detailType,
    photoTitle: photo.title,
    shootingLocation: photo.shootingLocation,
    shootingDate: formatDate(photo.shootingDate),
    isRepresentativePhoto: photo.isRepresentative,
    isSubmissionFrequencyPhoto: false,
    hasDrawing: false,
    remarks: photo.remarks,
    location: photo.location
      ? {
          geodeticSystem: "JGD2011",
          latitude: formatCoordinate(photo.location.latitude, "lat"),
          longitude: formatCoordinate(photo.location.longitude, "lon"),
        }
      : undefined,
  };
}

export function validateFolderStructure(
  folder: ElectronicDeliveryFolder
): string[] {
  const errors: string[] = [];

  if (!folder.rootFolderName || folder.rootFolderName.length === 0) {
    errors.push("ルートフォルダ名が設定されていません");
  }

  if (folder.photoFiles.length === 0) {
    errors.push("写真ファイルが含まれていません");
  }

  const fileNames = new Set<string>();
  for (const file of folder.photoFiles) {
    if (fileNames.has(file.deliveryFileName)) {
      errors.push("ファイル名が重複しています: " + file.deliveryFileName);
    }
    fileNames.add(file.deliveryFileName);
  }

  const photoNumbers = folder.photoFiles.map((f) => f.photoInfo.photoNumber).sort((a, b) => a - b);
  for (let i = 0; i < photoNumbers.length; i++) {
    if (photoNumbers[i] !== i + 1) {
      errors.push("写真番号が連続していません: " + photoNumbers[i] + " (期待値: " + (i + 1) + ")");
      break;
    }
  }

  return errors;
}

export function getFolderTreeString(folder: ElectronicDeliveryFolder): string {
  const lines: string[] = [];
  lines.push(folder.rootFolderName + "/");
  lines.push("├── " + FOLDER_NAMES.PHOTO_XML);
  lines.push("├── " + FOLDER_NAMES.PIC + "/");

  for (let i = 0; i < folder.photoFiles.length; i++) {
    const file = folder.photoFiles[i];
    const isLast = i === folder.photoFiles.length - 1 && !folder.draFolderPath;
    const prefix = isLast ? "│   └──" : "│   ├──";
    lines.push(prefix + " " + file.deliveryFileName);
  }

  if (folder.draFolderPath) {
    lines.push("└── " + FOLDER_NAMES.DRA + "/");
    for (let i = 0; i < folder.drawingFiles.length; i++) {
      const file = folder.drawingFiles[i];
      const isLast = i === folder.drawingFiles.length - 1;
      const prefix = isLast ? "    └──" : "    ├──";
      lines.push(prefix + " " + file.deliveryFileName);
    }
  }

  return lines.join("\n");
}

function joinPath(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/");
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function formatCoordinate(decimal: number, type: "lat" | "lon"): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

  const direction =
    type === "lat" ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";

  return degrees + "°" + minutes + "'" + seconds + "\"" + direction;
}
