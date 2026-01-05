import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Clipboard, FolderOpen, FileText, ArrowRight } from 'lucide-react';

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
    take: 5,
  });

  const totalBlackboards = projects.reduce((sum, p) => sum + p._count.blackboards, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">電子黒板</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            工事写真用の電子黒板を管理 ({totalBlackboards}件)
          </p>
        </div>
      </div>

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            黒板テンプレート
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {template.name}
                  </p>
                  {template.isDefault && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      デフォルト
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects with Blackboards */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Clipboard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            プロジェクトがありません
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            プロジェクトを作成して電子黒板を使用してください
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            プロジェクト別黒板
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/blackboard`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
                      <Clipboard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {project._count.blackboards}件の黒板
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
