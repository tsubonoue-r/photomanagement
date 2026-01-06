'use client';

import { useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  Clipboard,
  Smartphone,
} from 'lucide-react';
import { useCamera, CapturedPhoto } from '@/hooks/useCamera';
import { hapticShutter, hapticLight, hapticSuccess } from '@/lib/capacitor/haptics';

interface CameraViewProps {
  onCapture?: (photo: CapturedPhoto) => void;
  onClose?: () => void;
  blackboardOverlay?: React.ReactNode;
  showBlackboardToggle?: boolean;
  isBlackboardVisible?: boolean;
  onBlackboardToggle?: () => void;
  /** 黒板オーバーレイ使用時はtrue（Webカメラを強制使用） */
  useWebCameraOnly?: boolean;
}

export function CameraView({
  onCapture,
  onClose,
  blackboardOverlay,
  showBlackboardToggle = false,
  isBlackboardVisible = false,
  onBlackboardToggle,
  useWebCameraOnly = false,
}: CameraViewProps) {
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const {
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
    retakePhoto,
  } = useCamera({ useWebCameraOnly });

  // Initialize camera on mount
  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, [initCamera, stopCamera]);

  const handleCapture = async () => {
    hapticShutter();
    await capturePhoto();
  };

  const handleConfirm = () => {
    hapticSuccess();
    if (capturedPhoto && onCapture) {
      onCapture(capturedPhoto);
    }
  };

  const handleClose = () => {
    hapticLight();
    stopCamera();
    onClose?.();
  };

  const handleRetake = () => {
    hapticLight();
    retakePhoto();
  };

  const handleSwitchCamera = () => {
    hapticLight();
    switchCamera();
  };

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <div className="bg-gray-800 rounded-lg p-6 max-w-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">カメラエラー</h3>
          <p className="text-gray-300 text-sm mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              閉じる
            </button>
            <button
              onClick={initCamera}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (only for initial loading)
  if (isLoading && !isInitialized && !isNativeCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
        <p className="text-white">カメラを起動中...</p>
      </div>
    );
  }

  // Captured photo preview
  if (capturedPhoto) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Preview Image */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={capturedPhoto.dataUrl}
            alt="撮影した写真"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Actions */}
        <div className="p-4 pb-safe bg-black/80">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleRetake}
              className="flex flex-col items-center gap-2 text-white active:scale-90 transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="text-xs">撮り直す</span>
            </button>

            <button
              onClick={handleConfirm}
              className="flex flex-col items-center gap-2 text-white active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-colors shadow-lg shadow-green-500/30">
                <Check className="w-8 h-8" />
              </div>
              <span className="text-xs">使用する</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Native camera mode - show capture button only (no video preview)
  if (isNativeCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-safe bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Native Camera Prompt */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-sm text-center">
            <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              ネイティブカメラ
            </h3>
            <p className="text-gray-400 text-sm mb-8">
              デバイスのカメラアプリを使用して高品質な写真を撮影します
            </p>
            <button
              onClick={handleCapture}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  撮影中...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  カメラを起動
                </>
              )}
            </button>
          </div>
        </div>

        {/* Native mode indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="px-3 py-1 bg-blue-600/50 rounded-full text-white text-xs flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            ネイティブカメラモード
          </div>
        </div>
      </div>
    );
  }

  // Web camera view (with video preview)
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-safe bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            {showBlackboardToggle && (
              <button
                onClick={onBlackboardToggle}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                  isBlackboardVisible
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                title={isBlackboardVisible ? '黒板を非表示' : '黒板を表示'}
              >
                <Clipboard className="w-5 h-5" />
              </button>
            )}
            {hasMultipleCameras && (
              <button
                onClick={handleSwitchCamera}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-90 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Preview */}
      <div ref={cameraContainerRef} className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Blackboard Overlay */}
        {blackboardOverlay && (
          <div className="absolute inset-0">
            {blackboardOverlay}
          </div>
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer Controls */}
      <div className="p-4 pb-safe bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center">
          {/* Shutter Button */}
          <button
            onClick={handleCapture}
            disabled={!isInitialized || isLoading}
            className="relative w-20 h-20 rounded-full bg-white disabled:bg-gray-400 disabled:opacity-50 transition-all active:scale-95"
            aria-label="撮影"
          >
            {/* Outer ring */}
            <span className="absolute inset-0 rounded-full border-4 border-white/30" />
            {/* Inner circle */}
            <span className="absolute inset-2 rounded-full bg-white" />
            {/* Camera icon when loading */}
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Camera Mode Indicator */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center">
        <div className="px-3 py-1 bg-black/50 rounded-full text-white text-xs flex items-center gap-1">
          <Camera className="w-3 h-3" />
          {facingMode === 'environment' ? '背面カメラ' : '前面カメラ'}
        </div>
      </div>
    </div>
  );
}
