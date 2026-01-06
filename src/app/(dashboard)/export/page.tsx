import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Download, FolderOpen, FileArchive, FileSpreadsheet, Image, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">エクスポート</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                写真データの出力・電子納品
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Export Types - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileArchive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                電子納品
              </h2>
            </div>
            <ul className="space-y-1 text-[10px] text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                XML自動生成
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                フォルダ整理
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                ZIP出力
              </h2>
            </div>
            <ul className="space-y-1 text-[10px] text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                一括出力
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                黒板合成対応
              </li>
            </ul>
          </div>
        </div>

        {/* Projects List */}
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          プロジェクトを選択
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              エクスポート対象なし
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              プロジェクトを作成してください
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              プロジェクト一覧へ
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/albums`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {project._count.photos}枚
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Download className="w-4 h-4" />
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
