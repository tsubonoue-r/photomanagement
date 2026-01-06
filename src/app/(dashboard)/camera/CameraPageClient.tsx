'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Wifi, Image, FolderOpen, ChevronRight, Lock } from 'lucide-react';
import { CameraView } from '@/components/camera/CameraView';
import { CapturedPhoto } from '@/hooks/useCamera';

type CameraStatus = 'checking' | 'supported' | 'not-secure' | 'not-supported';

export function CameraPageClient() {
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('checking');

  // Check camera support on client side
  useEffect(() => {
    const checkCameraSupport = () => {
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext =
        typeof window !== 'undefined' &&
        (window.isSecureContext ||
         window.location.protocol === 'https:' ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1');

      if (!isSecureContext) {
        setCameraStatus('not-secure');
        return;
      }

      // Check if mediaDevices API is available
      if (typeof navigator !== 'undefined' &&
          navigator.mediaDevices &&
          typeof navigator.mediaDevices.getUserMedia === 'function') {
        setCameraStatus('supported');
      } else {
        setCameraStatus('not-supported');
      }
    };

    checkCameraSupport();
  }, []);

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleCapture = (photo: CapturedPhoto) => {
    setCapturedPhotos((prev) => [photo, ...prev]);
    setIsCameraOpen(false);
  };

  const handleSelectProject = () => {
    router.push('/projects');
  };

  const isCameraSupported = cameraStatus === 'supported';

  return (
    <>
      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraView onCapture={handleCapture} onClose={handleCloseCamera} />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">カメラ</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              工事写真を撮影
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">写真を撮影</h2>
              <p className="text-blue-100 text-sm">
                カメラを起動して工事写真を撮影します
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleOpenCamera}
              disabled={!isCameraSupported}
              className="flex-1 px-4 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              カメラを起動
            </button>
            <button
              onClick={handleSelectProject}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              プロジェクト選択
            </button>
          </div>

          {cameraStatus === 'not-secure' && (
            <div className="mt-3 p-3 bg-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">HTTPSが必要です</p>
                  <p className="text-blue-200 mt-1">
                    カメラ機能はセキュリティ上の理由から、HTTPS接続またはlocalhostでのみ利用可能です。
                  </p>
                  <p className="text-blue-200 mt-1">
                    → <span className="font-mono">http://localhost:3001/camera</span> でアクセスしてください
                  </p>
                </div>
              </div>
            </div>
          )}
          {cameraStatus === 'not-supported' && (
            <p className="mt-3 text-sm text-blue-200">
              ※ このブラウザではカメラ機能がサポートされていません
            </p>
          )}
        </div>

        {/* Recently Captured Photos */}
        {capturedPhotos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              撮影した写真
              <span className="text-sm font-normal text-gray-500">({capturedPhotos.length}枚)</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos.slice(0, 6).map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                >
                  <img
                    src={photo.dataUrl}
                    alt={`撮影写真 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {capturedPhotos.length > 6 && (
              <button className="mt-3 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1">
                すべての写真を表示 ({capturedPhotos.length}枚)
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center mb-3">
              <Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">電子黒板オーバーレイ</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              撮影画面に電子黒板を重ねて表示。工事名、撮影日、工種などを記録
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GPS位置情報</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              撮影位置を自動で記録。EXIF情報として保存
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center mb-3">
              <Wifi className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">オフライン対応</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              電波が届かない場所でも撮影可能。後でまとめてアップロード
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">使い方</h4>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
              <span>「カメラを起動」ボタンをタップしてカメラを開きます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
              <span>被写体を画面に収め、シャッターボタンをタップして撮影</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <span>プレビューで確認し、「使用する」で保存、「撮り直す」で再撮影</span>
            </li>
          </ol>
        </div>
      </div>
    </>
  );
}
