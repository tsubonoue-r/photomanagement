import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Tags, FolderOpen, ArrowRight, ArrowLeft } from 'lucide-react';

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get all projects with their category counts
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { categories: true },
      },
      categories: {
        where: { parentId: null },
        take: 3,
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  const totalCategories = projects.reduce((sum, p) => sum + p._count.categories, 0);

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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">工種分類</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                全プロジェクト {totalCategories}件
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Info Banner - Compact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            工種分類はプロジェクトごとに管理されます
          </p>
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <Tags className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              プロジェクトがありません
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              プロジェクトを作成して工種分類を設定
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
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/categories`}
                className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Tags className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {project._count.categories}件の分類
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                </div>

                {/* Category Tags Preview */}
                {project.categories.length > 0 && (
                  <div className="px-3 pb-3 flex flex-wrap gap-1">
                    {project.categories.map((category) => (
                      <span
                        key={category.id}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
                      >
                        {category.name}
                      </span>
                    ))}
                    {project._count.categories > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400">
                        +{project._count.categories - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
