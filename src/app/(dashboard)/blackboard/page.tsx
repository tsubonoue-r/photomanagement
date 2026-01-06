import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Clipboard, FolderOpen, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

export default async function BlackboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get all projects with blackboard counts
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { blackboards: true },
      },
    },
  });

  // Get blackboard templates
  const templates = await prisma.blackboardTemplate.findMany({
    orderBy: { isDefault: 'desc' },
    take: 3,
  });

  const totalBlackboards = projects.reduce((sum, p) => sum + p._count.blackboards, 0);

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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">電子黒板</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                工事写真用黒板 {totalBlackboards}件
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Templates Section - Compact Horizontal */}
        {templates.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              テンプレート
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0"
                >
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                    {template.isDefault && (
                      <span className="text-[10px] text-green-600 dark:text-green-400">
                        デフォルト
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 mx-auto bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
              <Clipboard className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              プロジェクトがありません
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              プロジェクトを作成して電子黒板を使用
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
          /* Project List - Compact */
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              プロジェクト別
            </h2>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/blackboard`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                  <Clipboard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {project._count.blackboards}件の黒板
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
