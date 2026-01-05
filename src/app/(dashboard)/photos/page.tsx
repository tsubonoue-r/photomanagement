import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Image, FolderOpen, Calendar, ArrowRight } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">写真</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            全プロジェクトの写真を管理 ({totalPhotos}枚)
          </p>
        </div>
      </div>

      {/* Project Photo Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            写真がありません
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            プロジェクトに写真をアップロードしてください
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
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/photos`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden group"
            >
              {/* Thumbnail Grid */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 grid grid-cols-2 gap-0.5 p-0.5">
                {project.photos.length > 0 ? (
                  project.photos.map((photo, i) => (
                    <div
                      key={photo.id}
                      className="bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                    >
                      {photo.thumbnailPath ? (
                        <img
                          src={photo.thumbnailPath}
                          alt={photo.title || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {project.photos.length > 0 && project.photos.length < 4 &&
                  Array.from({ length: 4 - project.photos.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                    >
                      <Image className="w-6 h-6 text-gray-300" />
                    </div>
                  ))
                }
              </div>

              {/* Project Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {project._count.photos}枚
                  </span>
                  {project.updatedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
