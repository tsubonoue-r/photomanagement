'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Wifi, Image, FolderOpen, ChevronRight, Lock, FileText, Save } from 'lucide-react';
import { CameraView } from '@/components/camera/CameraView';
import { BlackboardOverlay, BlackboardOverlayState } from '@/components/camera/BlackboardOverlay';
import { BlackboardSaveDialog } from '@/components/camera/BlackboardSaveDialog';
import { BlackboardManager } from '@/components/camera/BlackboardManager';
import { CapturedPhoto } from '@/hooks/useCamera';
import { useSavedBlackboards } from '@/hooks/useSavedBlackboards';
import type { BlackboardTemplate, BlackboardFieldValue } from '@/types/blackboard';
import type { SavedBlackboard, SavedBlackboardInput } from '@/lib/blackboardStorage';

type CameraStatus = 'checking' | 'supported' | 'not-secure' | 'not-supported';

// Default blackboard template for demo
const DEFAULT_TEMPLATE: BlackboardTemplate = {
  id: 'default',
  name: '標準工事黒板',
  width: 400,
  height: 300,
  backgroundColor: '#1a472a',
  borderColor: '#ffffff',
  borderWidth: 3,
  fields: [
    { id: 'title', name: 'title', label: '工事名', type: 'text', required: true, x: 5, y: 5, width: 90, height: 15, fontSize: 18, fontColor: '#ffffff' },
    { id: 'date', name: 'date', label: '撮影日', type: 'date', required: true, x: 5, y: 25, width: 45, height: 12, fontSize: 14, fontColor: '#ffffff' },
    { id: 'location', name: 'location', label: '撮影箇所', type: 'text', required: false, x: 50, y: 25, width: 45, height: 12, fontSize: 14, fontColor: '#ffffff' },
    { id: 'workType', name: 'workType', label: '工種', type: 'text', required: false, x: 5, y: 42, width: 45, height: 12, fontSize: 14, fontColor: '#ffffff' },
    { id: 'contractor', name: 'contractor', label: '施工者', type: 'text', required: false, x: 50, y: 42, width: 45, height: 12, fontSize: 14, fontColor: '#ffffff' },
    { id: 'note', name: 'note', label: '備考', type: 'text', required: false, x: 5, y: 59, width: 90, height: 35, fontSize: 14, fontColor: '#ffffff' },
  ],
  isDefault: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function CameraPageClient() {
  const router = useRouter();
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('checking');

  // Blackboard state
  const [blackboardValues, setBlackboardValues] = useState<BlackboardFieldValue[]>([
    { fieldId: 'title', value: '' },
    { fieldId: 'date', value: new Date().toISOString().split('T')[0] },
    { fieldId: 'location', value: '' },
    { fieldId: 'workType', value: '' },
    { fieldId: 'contractor', value: '' },
    { fieldId: 'note', value: '' },
  ]);
  const [blackboardState, setBlackboardState] = useState<BlackboardOverlayState>({
    visible: true,
    position: 'bottom-right',
    customPosition: { x: 20, y: 20 },
    scale: 0.6,
    opacity: 0.9,
  });

  // Dialogs
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

  // Saved blackboards hook
  const { save, blackboards } = useSavedBlackboards();

  // Check camera support on client side
  useEffect(() => {
    const checkCameraSupport = () => {
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

  const handleSaveBlackboard = async (input: SavedBlackboardInput) => {
    await save(input);
  };

  const handleLoadBlackboard = (blackboard: SavedBlackboard) => {
    setBlackboardValues(blackboard.values);
    setBlackboardState({
      ...blackboardState,
      position: blackboard.overlayState.position,
      customPosition: blackboard.overlayState.customPosition,
      scale: blackboard.overlayState.scale,
      opacity: blackboard.overlayState.opacity,
    });
    setIsLoadDialogOpen(false);
  };

  const handleBlackboardValueChange = (fieldId: string, value: string) => {
    setBlackboardValues(prev =>
      prev.map(v => v.fieldId === fieldId ? { ...v, value } : v)
    );
  };

  const isCameraSupported = cameraStatus === 'supported';

  return (
    <>
      {/* Camera Modal with Blackboard */}
      {isCameraOpen && (
        <CameraView
          onCapture={handleCapture}
          onClose={handleCloseCamera}
          showBlackboardToggle
          isBlackboardVisible={blackboardState.visible}
          onBlackboardToggle={() => setBlackboardState(prev => ({ ...prev, visible: !prev.visible }))}
          blackboardOverlay={
            <BlackboardOverlay
              template={DEFAULT_TEMPLATE}
              values={blackboardValues}
              state={blackboardState}
              onStateChange={setBlackboardState}
              containerRef={cameraContainerRef}
              onSave={() => setIsSaveDialogOpen(true)}
              onLoad={() => setIsLoadDialogOpen(true)}
            />
          }
        />
      )}

      {/* Save Dialog */}
      <BlackboardSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveBlackboard}
        values={blackboardValues}
        overlayState={blackboardState}
      />

      {/* Load Dialog */}
      <BlackboardManager
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onSelect={handleLoadBlackboard}
      />

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

        {/* Blackboard Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              黒板設定
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLoadDialogOpen(true)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <FolderOpen className="w-4 h-4" />
                読み込み
              </button>
              <button
                onClick={() => setIsSaveDialogOpen(true)}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                工事名
              </label>
              <input
                type="text"
                value={blackboardValues.find(v => v.fieldId === 'title')?.value as string || ''}
                onChange={(e) => handleBlackboardValueChange('title', e.target.value)}
                placeholder="例: ○○マンション新築工事"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                撮影日
              </label>
              <input
                type="date"
                value={blackboardValues.find(v => v.fieldId === 'date')?.value as string || ''}
                onChange={(e) => handleBlackboardValueChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                撮影箇所
              </label>
              <input
                type="text"
                value={blackboardValues.find(v => v.fieldId === 'location')?.value as string || ''}
                onChange={(e) => handleBlackboardValueChange('location', e.target.value)}
                placeholder="例: 1階エントランス"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                工種
              </label>
              <input
                type="text"
                value={blackboardValues.find(v => v.fieldId === 'workType')?.value as string || ''}
                onChange={(e) => handleBlackboardValueChange('workType', e.target.value)}
                placeholder="例: 基礎工事"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                施工者
              </label>
              <input
                type="text"
                value={blackboardValues.find(v => v.fieldId === 'contractor')?.value as string || ''}
                onChange={(e) => handleBlackboardValueChange('contractor', e.target.value)}
                placeholder="例: 山田建設株式会社"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                備考
              </label>
              <input
                type="text"
                value={blackboardValues.find(v => v.fieldId === 'note')?.value as string || ''}
                onChange={(e) => handleBlackboardValueChange('note', e.target.value)}
                placeholder="例: 配筋検査完了"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {blackboards.length > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              保存済み黒板: {blackboards.length}件
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
              <span>黒板設定で工事名や撮影箇所を入力し、「保存」で黒板を保存</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
              <span>「カメラを起動」ボタンをタップしてカメラを開きます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <span>黒板をドラッグで移動、タップで設定パネルを開いてサイズや位置を調整</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
              <span>シャッターボタンで撮影し、「使用する」で保存</span>
            </li>
          </ol>
        </div>
      </div>
    </>
  );
}
