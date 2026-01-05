import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Tags, FolderOpen, ChevronRight, ArrowRight } from 'lucide-react';

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
        take: 5,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">工種分類</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            全プロジェクトの工種分類を管理 ({totalCategories}件)
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          工種分類はプロジェクトごとに管理されます。各プロジェクトで国交省の電子納品基準に準拠した標準分類をインポートできます。
        </p>
      </div>

      {/* Projects with Categories */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Tags className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            プロジェクトがありません
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            プロジェクトを作成して工種分類を設定してください
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
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <Link
                href={`/projects/${project.id}/categories`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                    <Tags className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {project._count.categories}件の分類
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>

              {/* Category Preview */}
              {project.categories.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {project.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                      >
                        {category.code && (
                          <span className="text-gray-400 font-mono text-xs">
                            {category.code}
                          </span>
                        )}
                        {category.name}
                      </span>
                    ))}
                    {project._count.categories > 5 && (
                      <span className="inline-flex items-center px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                        +{project._count.categories - 5}件
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
