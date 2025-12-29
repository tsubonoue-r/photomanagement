/**
 * INDEX_D.XML生成モジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 *
 * INDEX_D.XMLは電子納品データ全体の管理情報を格納するXMLファイルです。
 */

import type { ExportMetadata } from "@/types/electronic-delivery";

/**
 * INDEX_D.XML用の基礎情報型定義
 */
export interface IndexDInfo {
  /** 適用要領基準 */
  applicableStandard: string;
  /** 工事件名 */
  constructionName: string;
  /** 工事番号 */
  constructionNumber?: string;
  /** 受注者名 */
  contractorName: string;
  /** 発注者名 */
  ordererName?: string;
  /** 発注者コード */
  ordererCode?: string;
  /** 工期開始日 */
  constructionStartDate?: string;
  /** 工期終了日 */
  constructionEndDate?: string;
  /** 工事分野 */
  constructionField?: string;
  /** 工種 */
  workType?: string;
  /** 工事概要 */
  constructionSummary?: string;
  /** 住所コード */
  addressCode?: string;
  /** 住所 */
  address?: string;
  /** メディア番号 */
  mediaNumber: number;
  /** メディア総数 */
  totalMediaCount: number;
  /** 写真フォルダ名 */
  photoFolderName: string;
  /** 写真情報ファイル名 */
  photoInfoFileName: string;
  /** ソフトウェア名 */
  softwareName: string;
  /** ソフトウェアバージョン */
  softwareVersion: string;
}

/**
 * INDEX_D.XML生成設定
 */
export interface IndexDGeneratorConfig {
  /** XMLエンコーディング */
  encoding: string;
  /** インデントスペース数 */
  indentSpaces: number;
  /** 適用基準バージョン */
  standardVersion: string;
}

const DEFAULT_CONFIG: IndexDGeneratorConfig = {
  encoding: "UTF-8",
  indentSpaces: 2,
  standardVersion: "令和5年3月",
};

const SOFTWARE_INFO = {
  name: "PhotoManagement",
  version: "1.0.0",
};

/**
 * INDEX_D.XMLを生成する
 * @param metadata エクスポートメタデータ
 * @param config 生成設定
 * @returns XML文字列
 */
export function generateIndexDXml(
  metadata: ExportMetadata,
  config: Partial<IndexDGeneratorConfig> = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const indexInfo = buildIndexDInfo(metadata, cfg);
  return serializeIndexDToXml(indexInfo, cfg);
}

/**
 * INDEX_D情報を構築する
 * @param metadata エクスポートメタデータ
 * @param config 生成設定
 * @returns INDEX_D情報
 */
export function buildIndexDInfo(
  metadata: ExportMetadata,
  config: IndexDGeneratorConfig
): IndexDInfo {
  return {
    applicableStandard: config.standardVersion,
    constructionName: metadata.constructionName,
    contractorName: metadata.contractorName,
    ordererName: metadata.ordererName,
    constructionStartDate: metadata.constructionStartDate,
    constructionEndDate: metadata.constructionEndDate,
    mediaNumber: 1,
    totalMediaCount: 1,
    photoFolderName: "PHOTO",
    photoInfoFileName: "PHOTO.XML",
    softwareName: SOFTWARE_INFO.name,
    softwareVersion: SOFTWARE_INFO.version,
  };
}

/**
 * INDEX_D情報をXML文字列にシリアライズする
 * @param info INDEX_D情報
 * @param config 生成設定
 * @returns XML文字列
 */
export function serializeIndexDToXml(
  info: IndexDInfo,
  config: IndexDGeneratorConfig
): string {
  const indent = " ".repeat(config.indentSpaces);
  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="${config.encoding}"?>`);
  lines.push("<!-- 国土交通省 工事完成図書の電子納品等要領 準拠 -->");
  lines.push("<INDEX_D>");

  // 基礎情報
  lines.push(indent + "<基礎情報>");
  lines.push(indent + indent + "<適用要領基準>" + escapeXml(info.applicableStandard) + "</適用要領基準>");
  lines.push(indent + "</基礎情報>");

  // 工事件名等
  lines.push(indent + "<工事件名等>");
  lines.push(indent + indent + "<工事件名>" + escapeXml(info.constructionName) + "</工事件名>");
  if (info.constructionNumber) {
    lines.push(indent + indent + "<工事番号>" + escapeXml(info.constructionNumber) + "</工事番号>");
  }
  lines.push(indent + "</工事件名等>");

  // 場所情報
  lines.push(indent + "<場所情報>");
  if (info.addressCode) {
    lines.push(indent + indent + "<住所コード>" + escapeXml(info.addressCode) + "</住所コード>");
  }
  if (info.address) {
    lines.push(indent + indent + "<住所>" + escapeXml(info.address) + "</住所>");
  }
  lines.push(indent + "</場所情報>");

  // 施設情報（空セクション）
  lines.push(indent + "<施設情報/>");

  // 発注者情報
  lines.push(indent + "<発注者情報>");
  if (info.ordererCode) {
    lines.push(indent + indent + "<発注者コード>" + escapeXml(info.ordererCode) + "</発注者コード>");
  }
  if (info.ordererName) {
    lines.push(indent + indent + "<発注者名>" + escapeXml(info.ordererName) + "</発注者名>");
  }
  lines.push(indent + "</発注者情報>");

  // 受注者情報
  lines.push(indent + "<受注者情報>");
  lines.push(indent + indent + "<受注者名>" + escapeXml(info.contractorName) + "</受注者名>");
  lines.push(indent + "</受注者情報>");

  // 工期
  lines.push(indent + "<工期>");
  if (info.constructionStartDate) {
    lines.push(indent + indent + "<工期開始日>" + escapeXml(info.constructionStartDate) + "</工期開始日>");
  }
  if (info.constructionEndDate) {
    lines.push(indent + indent + "<工期終了日>" + escapeXml(info.constructionEndDate) + "</工期終了日>");
  }
  lines.push(indent + "</工期>");

  // 工事分野・工種情報
  lines.push(indent + "<工事分野情報>");
  if (info.constructionField) {
    lines.push(indent + indent + "<工事分野>" + escapeXml(info.constructionField) + "</工事分野>");
  }
  if (info.workType) {
    lines.push(indent + indent + "<工種>" + escapeXml(info.workType) + "</工種>");
  }
  lines.push(indent + "</工事分野情報>");

  // 工事概要
  if (info.constructionSummary) {
    lines.push(indent + "<工事概要>" + escapeXml(info.constructionSummary) + "</工事概要>");
  }

  // メディア情報
  lines.push(indent + "<メディア情報>");
  lines.push(indent + indent + "<メディア番号>" + info.mediaNumber + "</メディア番号>");
  lines.push(indent + indent + "<メディア総数>" + info.totalMediaCount + "</メディア総数>");
  lines.push(indent + "</メディア情報>");

  // 写真情報
  lines.push(indent + "<写真情報>");
  lines.push(indent + indent + "<写真フォルダ名>" + escapeXml(info.photoFolderName) + "</写真フォルダ名>");
  lines.push(indent + indent + "<写真情報ファイル名>" + escapeXml(info.photoInfoFileName) + "</写真情報ファイル名>");
  lines.push(indent + "</写真情報>");

  // ソフトウェア情報
  lines.push(indent + "<ソフトウェア情報>");
  lines.push(indent + indent + "<ソフトウェア名>" + escapeXml(info.softwareName) + "</ソフトウェア名>");
  lines.push(indent + indent + "<バージョン情報>" + escapeXml(info.softwareVersion) + "</バージョン情報>");
  lines.push(indent + "</ソフトウェア情報>");

  lines.push("</INDEX_D>");

  return lines.join("\n");
}

/**
 * XML特殊文字をエスケープする
 * @param str 入力文字列
 * @returns エスケープ済み文字列
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * INDEX_D.XMLが有効かどうかを検証する
 * @param xmlString XML文字列
 * @returns 有効かどうか
 */
export function isValidIndexDXml(xmlString: string): boolean {
  const requiredElements = [
    "<INDEX_D>",
    "</INDEX_D>",
    "<基礎情報>",
    "</基礎情報>",
    "<工事件名等>",
    "</工事件名等>",
    "<受注者情報>",
    "</受注者情報>",
    "<写真情報>",
    "</写真情報>",
  ];

  return requiredElements.every((element) => xmlString.includes(element));
}
