import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Download, FolderOpen, FileArchive, FileSpreadsheet, Image, ArrowRight, CheckCircle } from 'lucide-react';

export default async function ExportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get all projects with photo counts
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">エクスポート</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            写真データの出力・電子納品
          </p>
        </div>
      </div>

      {/* Export Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <FileArchive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                電子納品出力
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                国交省基準準拠のXML形式
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              PHOTO.XML 自動生成
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              INDEX_C.XML 対応
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              フォルダ構成自動整理
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                アルバム出力
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ZIP形式でダウンロード
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              写真ファイル一括出力
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              メタデータ付与
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              黒板合成写真対応
            </li>
          </ul>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          プロジェクトを選択してエクスポート
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Download className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              エクスポートできるプロジェクトがありません
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              プロジェクトを作成して写真をアップロードしてください
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FolderOpen className="w-4 h-4" />
              プロジェクト一覧へ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {project._count.photos}枚
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/projects/${project.id}/albums`}
                    className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      アルバムからエクスポート
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
