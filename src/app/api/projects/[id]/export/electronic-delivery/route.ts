/**
 * 電子納品エクスポートAPI
 * POST /api/projects/[id]/export/electronic-delivery
 *
 * 国土交通省 デジタル写真管理情報基準に準拠した電子納品データを生成します。
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateFolderStructure,
  generatePhotoXml,
  generateIndexDXml,
  DeliveryValidator,
  formatValidationResult,
  createDeliveryArchive,
  generateDeliveryReport,
  formatReportAsText,
  formatReportAsJson,
  formatPhotoListAsCsv,
} from "@/lib/electronic-delivery";
import type {
  ProjectPhoto,
  ExportMetadata,
  ExportConfig,
} from "@/types/electronic-delivery";

/**
 * エクスポートリクエストボディ
 */
interface ExportRequestBody {
  config: {
    outputFormat: "zip" | "folder" | "preview";
    standardVersion?: string;
    photoQuality?: {
      maxWidth?: number;
      maxHeight?: number;
      jpegQuality?: number;
      compressionEnabled?: boolean;
    };
    photoIds?: string[];
    includeReport?: boolean;
  };
  metadata: ExportMetadata;
  photos: ProjectPhoto[];
  /** Base64エンコードされた写真データ（ZIPエクスポート時に必要） */
  photoData?: Record<string, string>;
}

/**
 * エクスポートレスポンス
 */
interface ExportResponse {
  success: boolean;
  data?: {
    folderStructure: ReturnType<typeof generateFolderStructure>;
    photoXml: string;
    indexDXml: string;
    validationResult: ReturnType<DeliveryValidator["validate"]>;
    validationReport: string;
    deliveryReport?: ReturnType<typeof generateDeliveryReport>;
    reportText?: string;
  };
  error?: string;
  processingTimeMs: number;
}

/**
 * ZIPダウンロードレスポンス
 */
interface ZipDownloadResponse {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  processingTimeMs: number;
}

/**
 * POST: 電子納品データを生成する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ExportResponse | ZipDownloadResponse>> {
  const startTime = Date.now();

  try {
    const { id: projectId } = await params;
    const body = (await request.json()) as ExportRequestBody;

    // バリデーション
    if (!body.photos || body.photos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "写真データが必要です",
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    if (!body.metadata) {
      return NextResponse.json(
        {
          success: false,
          error: "メタデータが必要です",
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // 写真データを変換
    const photos: ProjectPhoto[] = body.photos.map((photo) => ({
      ...photo,
      projectId,
      shootingDate: new Date(photo.shootingDate),
      createdAt: new Date(photo.createdAt),
      updatedAt: new Date(photo.updatedAt),
    }));

    // 対象写真をフィルタリング
    const targetPhotos = body.config.photoIds
      ? photos.filter((p) => body.config.photoIds!.includes(p.id))
      : photos;

    if (targetPhotos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "エクスポート対象の写真がありません",
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // フォルダ構造を生成
    const folderStructure = generateFolderStructure(targetPhotos);

    // PHOTO.XMLを生成
    const photoXml = generatePhotoXml(folderStructure, body.metadata, {
      standardVersion: body.config.standardVersion || "令和5年3月",
    });

    // INDEX_D.XMLを生成
    const indexDXml = generateIndexDXml(body.metadata, {
      standardVersion: body.config.standardVersion || "令和5年3月",
    });

    // バリデーション
    const validator = new DeliveryValidator();
    const validationResult = validator.validate(folderStructure);
    const validationReport = formatValidationResult(validationResult);

    // ZIPエクスポートの場合
    if (body.config.outputFormat === "zip") {
      if (!body.photoData) {
        return NextResponse.json(
          {
            success: false,
            error: "ZIPエクスポートには写真データ(photoData)が必要です",
            processingTimeMs: Date.now() - startTime,
          },
          { status: 400 }
        );
      }

      // Base64デコードしてファイルマップを作成
      const fileContents = new Map<string, Buffer>();
      for (const photoFile of folderStructure.photoFiles) {
        const base64Data = body.photoData[photoFile.originalFileName];
        if (base64Data) {
          // data:image/jpeg;base64, プレフィックスを除去
          const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
          fileContents.set(photoFile.filePath, Buffer.from(cleanBase64, "base64"));
        }
      }

      // ZIPアーカイブを生成
      const archiveResult = await createDeliveryArchive(
        folderStructure,
        body.metadata,
        fileContents
      );

      if (!archiveResult.success || !archiveResult.buffer) {
        return NextResponse.json(
          {
            success: false,
            error: archiveResult.error || "ZIPアーカイブの生成に失敗しました",
            processingTimeMs: Date.now() - startTime,
          },
          { status: 500 }
        );
      }

      // ZIPファイルをレスポンスとして返す
      const fileName = `electronic_delivery_${projectId}_${Date.now()}.zip`;

      // BufferをUint8Arrayに変換してNextResponseに渡す
      const uint8Array = new Uint8Array(archiveResult.buffer);

      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": archiveResult.buffer.length.toString(),
          "X-Processing-Time-Ms": (Date.now() - startTime).toString(),
          "X-File-Count": archiveResult.fileCount.toString(),
        },
      });
    }

    // プレビューまたはフォルダ出力の場合
    let deliveryReport;
    let reportText;

    if (body.config.includeReport) {
      deliveryReport = generateDeliveryReport(
        folderStructure,
        body.metadata,
        validationResult
      );
      reportText = formatReportAsText(deliveryReport);
    }

    return NextResponse.json({
      success: true,
      data: {
        folderStructure,
        photoXml,
        indexDXml,
        validationResult,
        validationReport,
        deliveryReport,
        reportText,
      },
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("電子納品エクスポートエラー:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "エクスポート中にエラーが発生しました",
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: 電子納品データを検証する
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as { photos: ProjectPhoto[] };

    if (!body.photos || body.photos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "写真データが必要です",
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    const photos: ProjectPhoto[] = body.photos.map((photo) => ({
      ...photo,
      shootingDate: new Date(photo.shootingDate),
      createdAt: new Date(photo.createdAt),
      updatedAt: new Date(photo.updatedAt),
    }));

    const folderStructure = generateFolderStructure(photos);

    const validator = new DeliveryValidator();
    const validationResult = validator.validate(folderStructure);
    const validationReport = formatValidationResult(validationResult);

    return NextResponse.json({
      success: true,
      data: {
        validationResult,
        validationReport,
        photoCount: photos.length,
        isValid: validationResult.isValid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
      },
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("電子納品検証エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "検証中にエラーが発生しました",
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 電子納品設定情報を取得する
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    // レポートフォーマットの場合
    if (format === "report-formats") {
      return NextResponse.json({
        success: true,
        data: {
          formats: [
            { id: "text", name: "テキスト形式", extension: ".txt" },
            { id: "json", name: "JSON形式", extension: ".json" },
            { id: "csv", name: "CSV形式（写真一覧）", extension: ".csv" },
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        availableFormats: ["zip", "folder", "preview"],
        standardVersions: [
          "令和5年3月",
          "令和4年3月",
          "令和3年3月",
        ],
        photoCategories: [
          "工事",
          "着工前",
          "完成",
          "施工状況",
          "安全管理",
          "使用材料",
          "品質管理",
          "出来形管理",
          "その他",
        ],
        majorCategories: ["工事写真", "完成写真", "その他写真"],
        folderStructure: {
          root: "PHOTO",
          xmlFiles: ["PHOTO.XML", "INDEX_D.XML"],
          photoFolder: "PIC",
          drawingFolder: "DRA",
        },
        fileNaming: {
          photoPattern: "P0000001.JPG",
          drawingPattern: "D0000001.JPG",
          description: "P + 7桁連番 + 拡張子",
        },
        validation: {
          requiredFields: [
            "photoTitle",
            "shootingDate",
            "photoCategory",
            "photoMajorCategory",
          ],
          recommendedFields: [
            "shootingLocation",
            "constructionType",
            "location",
          ],
          maxFileSizeMB: 10,
        },
      },
    });
  } catch (error) {
    console.error("設定情報取得エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error: "設定情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
