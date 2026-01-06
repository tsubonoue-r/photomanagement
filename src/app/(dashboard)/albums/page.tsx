import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, FolderOpen, Image, ArrowRight, ArrowLeft } from 'lucide-react';

export default async function AlbumsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get all albums with project info
  const albums = await prisma.album.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { photos: true },
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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">アルバム</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                全プロジェクト {albums.length}件
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Empty State */}
        {albums.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              アルバムがありません
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              プロジェクト内でアルバムを作成してください
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
          /* Album List - Compact */
          <div className="space-y-2">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/projects/${album.project.id}/albums/${album.id}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {album.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="truncate">{album.project.name}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Image className="w-3 h-3" />
                      {album._count.photos}枚
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
