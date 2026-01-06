import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectList } from '@/components/projects';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ProjectWithCounts } from '@/types/project';

/**
 * Projects List Page
 *
 * Server component that displays all projects with:
 * - Search and filter functionality
 * - Project creation
 * - Navigation to project details
 */
export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get initial projects for SSR
  const initialProjects = await prisma.project.findMany({
    take: 50,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
          members: true,
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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">プロジェクト</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                工事写真プロジェクトの管理
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        <ProjectList initialProjects={initialProjects as ProjectWithCounts[]} />
      </main>
    </div>
  );
}
