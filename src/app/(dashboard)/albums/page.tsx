import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, FolderOpen, Image, Calendar, ArrowRight } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">アルバム</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            全プロジェクトのアルバムを管理 ({albums.length}件)
          </p>
        </div>
      </div>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            アルバムがありません
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            プロジェクト内でアルバムを作成してください
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/projects/${album.project.id}/albums/${album.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow p-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {album.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {album.project.name}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>

              {album.description && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {album.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  {album._count.photos}枚
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(album.updatedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
