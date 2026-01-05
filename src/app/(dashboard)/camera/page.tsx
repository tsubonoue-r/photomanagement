import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Camera, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function CameraPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
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

      {/* Camera Placeholder */}
      <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-6">
          <Camera className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          カメラ機能
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          工事現場での写真撮影機能です。電子黒板を重ねて撮影できます。
        </p>

        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg max-w-sm mx-auto">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">この機能は現在開発中です</span>
        </div>

        <div className="mt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            プロジェクトから撮影を開始
          </Link>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">電子黒板オーバーレイ</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            撮影画面に電子黒板を重ねて表示
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GPS位置情報</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            撮影位置を自動で記録
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">オフライン対応</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            電波が届かない場所でも撮影可能
          </p>
        </div>
      </div>
    </div>
  );
}
