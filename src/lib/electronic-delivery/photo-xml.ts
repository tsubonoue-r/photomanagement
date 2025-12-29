/**
 * PHOTO.XML生成モジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

import type {
  PhotoInfoFile,
  PhotoCommonInfo,
  PhotoInfo,
  ElectronicDeliveryFolder,
  ExportMetadata,
} from "@/types/electronic-delivery";
import { FOLDER_NAMES } from "./folder-structure";

export interface XmlGeneratorConfig {
  encoding: string;
  indentSpaces: number;
  standardVersion: string;
}

const DEFAULT_CONFIG: XmlGeneratorConfig = {
  encoding: "UTF-8",
  indentSpaces: 2,
  standardVersion: "令和5年3月",
};

const SOFTWARE_INFO = {
  name: "PhotoManagement",
  version: "1.0.0",
};

export function generatePhotoXml(
  folder: ElectronicDeliveryFolder,
  metadata: ExportMetadata,
  config: Partial<XmlGeneratorConfig> = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const photoInfoFile = buildPhotoInfoFile(folder, metadata, cfg);
  return serializeToXml(photoInfoFile, cfg);
}

export function buildPhotoInfoFile(
  folder: ElectronicDeliveryFolder,
  _metadata: ExportMetadata,
  config: XmlGeneratorConfig
): PhotoInfoFile {
  const commonInfo: PhotoCommonInfo = {
    applicableStandard: config.standardVersion,
    photoInfoFileName: FOLDER_NAMES.PHOTO_XML,
    photoFolderName: folder.rootFolderName,
    photoFileFolderName: FOLDER_NAMES.PIC,
    drawingFolderName: folder.draFolderPath ? FOLDER_NAMES.DRA : undefined,
    softwareName: SOFTWARE_INFO.name,
    softwareVersion: SOFTWARE_INFO.version,
  };

  const photoInfoList: PhotoInfo[] = folder.photoFiles.map(
    (file) => file.photoInfo
  );

  return {
    commonInfo,
    photoInfoList,
  };
}

export function serializeToXml(
  photoInfoFile: PhotoInfoFile,
  config: XmlGeneratorConfig
): string {
  const indent = " ".repeat(config.indentSpaces);
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="' + config.encoding + '"?>');
  lines.push("<!-- 国土交通省 デジタル写真管理情報基準 準拠 -->");
  lines.push("<photoInformation>");

  lines.push(indent + "<commonInformation>");
  lines.push(
    indent + indent + "<applicableStandard>" + escapeXml(photoInfoFile.commonInfo.applicableStandard) + "</applicableStandard>"
  );
  lines.push(
    indent + indent + "<photoInformationFileName>" + escapeXml(photoInfoFile.commonInfo.photoInfoFileName) + "</photoInformationFileName>"
  );
  lines.push(
    indent + indent + "<photoFolderName>" + escapeXml(photoInfoFile.commonInfo.photoFolderName) + "</photoFolderName>"
  );
  lines.push(
    indent + indent + "<photoFileFolderName>" + escapeXml(photoInfoFile.commonInfo.photoFileFolderName) + "</photoFileFolderName>"
  );
  if (photoInfoFile.commonInfo.drawingFolderName) {
    lines.push(
      indent + indent + "<drawingFolderName>" + escapeXml(photoInfoFile.commonInfo.drawingFolderName) + "</drawingFolderName>"
    );
  }
  lines.push(
    indent + indent + "<softwareName>" + escapeXml(photoInfoFile.commonInfo.softwareName) + "</softwareName>"
  );
  lines.push(
    indent + indent + "<softwareVersion>" + escapeXml(photoInfoFile.commonInfo.softwareVersion) + "</softwareVersion>"
  );
  lines.push(indent + "</commonInformation>");

  lines.push(indent + "<photoList>");
  for (const photo of photoInfoFile.photoInfoList) {
    lines.push(...serializePhotoInfo(photo, config.indentSpaces, 2));
  }
  lines.push(indent + "</photoList>");

  lines.push("</photoInformation>");

  return lines.join("\n");
}

function serializePhotoInfo(
  photo: PhotoInfo,
  indentSpaces: number,
  depth: number
): string[] {
  const indent = " ".repeat(indentSpaces * depth);
  const childIndent = " ".repeat(indentSpaces * (depth + 1));
  const lines: string[] = [];

  lines.push(indent + "<photo>");
  lines.push(childIndent + "<photoNumber>" + photo.photoNumber + "</photoNumber>");
  lines.push(childIndent + "<photoFileName>" + escapeXml(photo.photoFileName) + "</photoFileName>");

  if (photo.photoFileJapaneseName) {
    lines.push(childIndent + "<photoFileJapaneseName>" + escapeXml(photo.photoFileJapaneseName) + "</photoFileJapaneseName>");
  }

  lines.push(childIndent + "<photoMajorCategory>" + escapeXml(photo.photoMajorCategory) + "</photoMajorCategory>");
  lines.push(childIndent + "<photoCategory>" + escapeXml(photo.photoCategory) + "</photoCategory>");

  if (photo.constructionType) {
    lines.push(childIndent + "<constructionType>" + escapeXml(photo.constructionType) + "</constructionType>");
  }

  lines.push(childIndent + "<photoTitle>" + escapeXml(photo.photoTitle) + "</photoTitle>");

  if (photo.shootingLocation) {
    lines.push(childIndent + "<shootingLocation>" + escapeXml(photo.shootingLocation) + "</shootingLocation>");
  }

  lines.push(childIndent + "<shootingDate>" + escapeXml(photo.shootingDate) + "</shootingDate>");
  lines.push(childIndent + "<isRepresentativePhoto>" + (photo.isRepresentativePhoto ? "1" : "0") + "</isRepresentativePhoto>");
  lines.push(childIndent + "<isSubmissionFrequencyPhoto>" + (photo.isSubmissionFrequencyPhoto ? "1" : "0") + "</isSubmissionFrequencyPhoto>");
  lines.push(childIndent + "<hasDrawing>" + (photo.hasDrawing ? "1" : "0") + "</hasDrawing>");

  if (photo.remarks) {
    lines.push(childIndent + "<remarks>" + escapeXml(photo.remarks) + "</remarks>");
  }

  if (photo.location) {
    lines.push(childIndent + "<location>");
    const locIndent = " ".repeat(indentSpaces * (depth + 2));
    lines.push(locIndent + "<geodeticSystem>" + escapeXml(photo.location.geodeticSystem) + "</geodeticSystem>");
    if (photo.location.latitude) {
      lines.push(locIndent + "<latitude>" + escapeXml(photo.location.latitude) + "</latitude>");
    }
    if (photo.location.longitude) {
      lines.push(locIndent + "<longitude>" + escapeXml(photo.location.longitude) + "</longitude>");
    }
    lines.push(childIndent + "</location>");
  }

  lines.push(indent + "</photo>");

  return lines;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function parsePhotoXml(xmlString: string): PhotoInfoFile | null {
  try {
    if (!xmlString.includes("<?xml")) return null;
    if (!xmlString.includes("<photoInformation>")) return null;
    return null;
  } catch {
    return null;
  }
}

export function isValidPhotoXml(xmlString: string): boolean {
  const requiredElements = [
    "<photoInformation>",
    "</photoInformation>",
    "<commonInformation>",
    "</commonInformation>",
    "<photoList>",
    "</photoList>",
  ];

  return requiredElements.every((element) => xmlString.includes(element));
}
