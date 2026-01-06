import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectList } from '@/components/projects';
import type { ProjectWithCounts } from '@/types/project';
import { FolderKanban, Image, Album, Camera } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get basic stats
  const [projectCount, photoCount, albumCount] = await Promise.all([
    prisma.project.count(),
    prisma.photo.count(),
    prisma.album.count(),
  ]);

  // Get initial projects for SSR
  const initialProjects = await prisma.project.findMany({
    take: 20,
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

  const firstName = session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'ユーザー';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">おかえりなさい</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{firstName} さん</h1>
          </div>
          <Link
            href="/camera"
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
          >
            <Camera className="w-6 h-6 text-white" />
          </Link>
        </div>
      </div>

      {/* Stats Grid - 2x2 Compact */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Projects */}
          <Link href="/projects" className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projectCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">プロジェクト</p>
              </div>
            </div>
          </Link>

          {/* Photos */}
          <Link href="/photos" className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{photoCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">写真</p>
              </div>
            </div>
          </Link>

          {/* Albums */}
          <Link href="/albums" className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Album className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{albumCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">アルバム</p>
              </div>
            </div>
          </Link>

          {/* Quick Action */}
          <Link href="/camera" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">写真を撮る</p>
                <p className="text-xs text-white/70">カメラ起動</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">最近のプロジェクト</h2>
          <Link href="/projects" className="text-sm text-blue-600 dark:text-blue-400">
            すべて見る
          </Link>
        </div>
        <ProjectList initialProjects={initialProjects as ProjectWithCounts[]} compact />
      </div>
    </div>
  );
}
