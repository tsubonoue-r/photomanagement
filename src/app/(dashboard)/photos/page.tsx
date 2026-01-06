import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Image, FolderOpen, ArrowRight, ArrowLeft } from 'lucide-react';

export default async function PhotosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get all photos grouped by project
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { photos: true },
      },
      photos: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          thumbnailPath: true,
          title: true,
        },
      },
    },
  });

  const totalPhotos = projects.reduce((sum, p) => sum + p._count.photos, 0);

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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">写真</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                全プロジェクト {totalPhotos}枚
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Empty State */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              写真がありません
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              プロジェクトに写真をアップロードしてください
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
          /* 2-column Grid */
          <div className="grid grid-cols-2 gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/photos`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden active:scale-[0.98] transition-transform group"
              >
                {/* Thumbnail Grid */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 grid grid-cols-2 gap-0.5">
                  {project.photos.length > 0 ? (
                    project.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                      >
                        {photo.thumbnailPath ? (
                          <img
                            src={photo.thumbnailPath}
                            alt={photo.title || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 row-span-2 flex items-center justify-center">
                      <Image className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {project.photos.length > 0 && project.photos.length < 4 &&
                    Array.from({ length: 4 - project.photos.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                      >
                        <Image className="w-4 h-4 text-gray-300" />
                      </div>
                    ))
                  }
                </div>

                {/* Project Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {project._count.photos}枚
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
