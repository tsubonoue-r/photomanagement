/**
 * Capacitor Camera API ユーティリティ
 * ネイティブアプリでは Capacitor Camera を使用し、Webでは getUserMedia にフォールバック
 */

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CapacitorPhotoResult {
  dataUrl: string;
  format: string;
  saved: boolean;
  webPath?: string;
}

export interface CaptureOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  width?: number;
  height?: number;
  correctOrientation?: boolean;
  saveToGallery?: boolean;
  promptLabelHeader?: string;
  promptLabelCancel?: string;
  promptLabelPhoto?: string;
  promptLabelPicture?: string;
}

/**
 * Capacitor Camera が利用可能かチェック
 */
export const isCapacitorCameraAvailable = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Camera');
};

/**
 * カメラ権限をリクエスト
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const permission = await Camera.requestPermissions({
      permissions: ['camera'],
    });
    return permission.camera === 'granted';
  } catch (error) {
    console.error('[CapacitorCamera] Permission request failed:', error);
    return false;
  }
};

/**
 * カメラ権限の状態を確認
 */
export const checkCameraPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    const permission = await Camera.checkPermissions();
    const state = permission.camera;
    // 'prompt-with-rationale' は 'prompt' として扱う
    if (state === 'granted' || state === 'denied') {
      return state;
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
};

/**
 * Capacitor Camera で写真を撮影
 */
export const captureWithCapacitorCamera = async (
  options: CaptureOptions = {}
): Promise<CapacitorPhotoResult | null> => {
  const {
    quality = 92,
    allowEditing = false,
    resultType = CameraResultType.DataUrl,
    source = CameraSource.Camera,
    width,
    height,
    correctOrientation = true,
    saveToGallery = false,
    promptLabelHeader = '写真',
    promptLabelCancel = 'キャンセル',
    promptLabelPhoto = 'フォトライブラリ',
    promptLabelPicture = '写真を撮る',
  } = options;

  try {
    const photo: Photo = await Camera.getPhoto({
      quality,
      allowEditing,
      resultType,
      source,
      width,
      height,
      correctOrientation,
      saveToGallery,
      promptLabelHeader,
      promptLabelCancel,
      promptLabelPhoto,
      promptLabelPicture,
    });

    // DataUrl の場合
    if (resultType === CameraResultType.DataUrl && photo.dataUrl) {
      return {
        dataUrl: photo.dataUrl,
        format: photo.format,
        saved: photo.saved || false,
        webPath: photo.webPath,
      };
    }

    // Base64 の場合は DataUrl に変換
    if (resultType === CameraResultType.Base64 && photo.base64String) {
      return {
        dataUrl: `data:image/${photo.format};base64,${photo.base64String}`,
        format: photo.format,
        saved: photo.saved || false,
        webPath: photo.webPath,
      };
    }

    // Uri の場合
    if (resultType === CameraResultType.Uri && photo.webPath) {
      return {
        dataUrl: photo.webPath,
        format: photo.format,
        saved: photo.saved || false,
        webPath: photo.webPath,
      };
    }

    return null;
  } catch (error) {
    // ユーザーがキャンセルした場合
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log('[CapacitorCamera] User cancelled');
      return null;
    }
    console.error('[CapacitorCamera] Capture failed:', error);
    throw error;
  }
};

/**
 * フォトライブラリから写真を選択
 */
export const pickFromGallery = async (
  options: Omit<CaptureOptions, 'source'> = {}
): Promise<CapacitorPhotoResult | null> => {
  return captureWithCapacitorCamera({
    ...options,
    source: CameraSource.Photos,
  });
};

/**
 * カメラまたはフォトライブラリから選択（プロンプト表示）
 */
export const captureWithPrompt = async (
  options: Omit<CaptureOptions, 'source'> = {}
): Promise<CapacitorPhotoResult | null> => {
  return captureWithCapacitorCamera({
    ...options,
    source: CameraSource.Prompt,
  });
};

/**
 * DataUrl から Blob を作成
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * 写真のサイズを取得
 */
export const getPhotoSize = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};
