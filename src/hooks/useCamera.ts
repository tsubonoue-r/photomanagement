'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraSource } from '@capacitor/camera';
import {
  isCapacitorCameraAvailable,
  captureWithCapacitorCamera,
  dataUrlToBlob,
  getPhotoSize,
  requestCameraPermission,
} from '@/lib/capacitor/camera';

export type CameraFacingMode = 'user' | 'environment';

export interface CameraSettings {
  facingMode: CameraFacingMode;
  resolution: {
    width: number;
    height: number;
  };
}

export interface CapturedPhoto {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface UseCameraOptions {
  initialFacingMode?: CameraFacingMode;
  jpegQuality?: number;
  /** 黒板オーバーレイ使用時はtrue（ネイティブカメラを使わない） */
  useWebCameraOnly?: boolean;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  facingMode: CameraFacingMode;
  hasMultipleCameras: boolean;
  capturedPhoto: CapturedPhoto | null;
  /** ネイティブカメラモードかどうか */
  isNativeCamera: boolean;
  initCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  capturePhoto: () => Promise<CapturedPhoto | null>;
  clearCapturedPhoto: () => void;
  retakePhoto: () => void;
  /** ネイティブカメラで直接撮影（ビデオプレビューなし） */
  captureWithNativeCamera: () => Promise<CapturedPhoto | null>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    initialFacingMode = 'environment',
    jpegQuality = 0.92,
    useWebCameraOnly = false,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  // ネイティブカメラが使用可能かつWebカメラのみモードでない場合
  const isNativeCamera = isCapacitorCameraAvailable() && !useWebCameraOnly;

  // Check for multiple cameras (Web mode only)
  const checkCameras = useCallback(async () => {
    if (isNativeCamera) {
      // ネイティブでは常にカメラ切り替え可能とみなす
      setHasMultipleCameras(true);
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch {
      setHasMultipleCameras(false);
    }
  }, [isNativeCamera]);

  // Stop camera stream (Web mode only)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsInitialized(false);
  }, []);

  // Initialize camera
  const initCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNativeCamera) {
        // ネイティブモード: 権限リクエストのみ
        const granted = await requestCameraPermission();
        if (!granted) {
          throw new Error('カメラへのアクセスが拒否されました。設定からカメラの許可を有効にしてください。');
        }
        await checkCameras();
        setIsInitialized(true);
      } else {
        // Webモード: getUserMedia を使用
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('カメラAPIがサポートされていません');
        }

        // Stop existing stream
        stopCamera();

        // Camera constraints - prefer high resolution
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 4096, min: 1920 },
            height: { ideal: 3072, min: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // iOS Safari requires these attributes
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.muted = true;

          await videoRef.current.play();
        }

        await checkCameras();
        setIsInitialized(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'カメラの初期化に失敗しました';

      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('カメラへのアクセスが拒否されました。設定からカメラの許可を有効にしてください。');
      } else if (message.includes('NotFoundError')) {
        setError('カメラが見つかりませんでした。');
      } else if (message.includes('NotReadableError')) {
        setError('カメラが他のアプリで使用中です。');
      } else {
        setError(message);
      }

      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [isNativeCamera, facingMode, stopCamera, checkCameras]);

  // Switch between front and back camera
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
  }, [facingMode]);

  // Re-initialize when facing mode changes (Web mode only)
  useEffect(() => {
    if (isInitialized && !isNativeCamera) {
      initCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Get current location
  const getCurrentLocation = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  // Capture photo with native camera (Capacitor)
  const captureWithNativeCamera = useCallback(async (): Promise<CapturedPhoto | null> => {
    if (!isNativeCamera) {
      return null;
    }

    setIsLoading(true);
    try {
      const result = await captureWithCapacitorCamera({
        quality: Math.round(jpegQuality * 100),
        source: CameraSource.Camera,
        correctOrientation: true,
        saveToGallery: false,
      });

      if (!result) {
        return null;
      }

      // Get photo dimensions
      const { width, height } = await getPhotoSize(result.dataUrl);

      // Convert to blob
      const blob = await dataUrlToBlob(result.dataUrl);

      // Get location
      const position = await getCurrentLocation();
      const location = position
        ? {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
        : undefined;

      const photo: CapturedPhoto = {
        dataUrl: result.dataUrl,
        blob,
        width,
        height,
        timestamp: new Date(),
        location,
      };

      setCapturedPhoto(photo);
      return photo;
    } catch (err) {
      const message = err instanceof Error ? err.message : '写真の撮影に失敗しました';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNativeCamera, jpegQuality]);

  // Capture photo (Web mode - from video stream)
  const capturePhotoFromVideo = useCallback(async (): Promise<CapturedPhoto | null> => {
    if (!videoRef.current || !canvasRef.current || !isInitialized) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video dimensions
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror image for front camera
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Get location
    const position = await getCurrentLocation();
    const location = position
      ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
      : undefined;

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

          const photo: CapturedPhoto = {
            dataUrl,
            blob,
            width,
            height,
            timestamp: new Date(),
            location,
          };

          setCapturedPhoto(photo);
          resolve(photo);
        },
        'image/jpeg',
        jpegQuality
      );
    });
  }, [isInitialized, facingMode, jpegQuality]);

  // Unified capture photo function
  const capturePhoto = useCallback(async (): Promise<CapturedPhoto | null> => {
    if (isNativeCamera) {
      return captureWithNativeCamera();
    }
    return capturePhotoFromVideo();
  }, [isNativeCamera, captureWithNativeCamera, capturePhotoFromVideo]);

  // Clear captured photo
  const clearCapturedPhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    clearCapturedPhoto();
  }, [clearCapturedPhoto]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isLoading,
    error,
    facingMode,
    hasMultipleCameras,
    capturedPhoto,
    isNativeCamera,
    initCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    clearCapturedPhoto,
    retakePhoto,
    captureWithNativeCamera,
  };
}
