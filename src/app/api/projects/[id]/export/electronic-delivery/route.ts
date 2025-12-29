/**
 * 電子納品エクスポートAPI
 * POST /api/projects/[id]/export/electronic-delivery
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateFolderStructure,
  generatePhotoXml,
  DeliveryValidator,
  formatValidationResult,
} from "@/lib/electronic-delivery";
import type {
  ProjectPhoto,
  ExportMetadata,
} from "@/types/electronic-delivery";

interface ExportRequestBody {
  config: {
    outputFormat: "zip" | "folder";
    standardVersion?: string;
    photoQuality?: {
      maxWidth?: number;
      maxHeight?: number;
      jpegQuality?: number;
      compressionEnabled?: boolean;
    };
    photoIds?: string[];
  };
  metadata: ExportMetadata;
  photos: ProjectPhoto[];
}

interface ExportResponse {
  success: boolean;
  data?: {
    folderStructure: ReturnType<typeof generateFolderStructure>;
    photoXml: string;
    validationResult: ReturnType<DeliveryValidator["validate"]>;
    validationReport: string;
  };
  error?: string;
  processingTimeMs: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ExportResponse>> {
  const startTime = Date.now();

  try {
    const { id: projectId } = await params;
    const body = (await request.json()) as ExportRequestBody;

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

    const photos: ProjectPhoto[] = body.photos.map((photo) => ({
      ...photo,
      projectId,
      shootingDate: new Date(photo.shootingDate),
      createdAt: new Date(photo.createdAt),
      updatedAt: new Date(photo.updatedAt),
    }));

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

    const folderStructure = generateFolderStructure(targetPhotos);

    const photoXml = generatePhotoXml(folderStructure, body.metadata, {
      standardVersion: body.config.standardVersion || "令和5年3月",
    });

    const validator = new DeliveryValidator();
    const validationResult = validator.validate(folderStructure);
    const validationReport = formatValidationResult(validationResult);

    return NextResponse.json({
      success: true,
      data: {
        folderStructure,
        photoXml,
        validationResult,
        validationReport,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        availableFormats: ["zip", "folder"],
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
          xmlFile: "PHOTO.XML",
          photoFolder: "PIC",
          drawingFolder: "DRA",
        },
        fileNaming: {
          photoPattern: "P0000001.JPG",
          drawingPattern: "D0000001.JPG",
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
