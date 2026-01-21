import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getStatusColorClasses, getStatusLabel } from '@/types/project';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Project Detail Page
 *
 * Overview of a specific project with:
 * - Project information
 * - Quick stats
 * - Navigation to photos, albums, categories, etc.
 */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
          members: true,
          categories: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        take: 5,
      },
      albums: {
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          _count: {
            select: {
              photos: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const navigationItems = [
    {
      href: `/projects/${id}/photos`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '写真',
      description: '写真の閲覧・管理',
      count: project._count.photos,
    },
    {
      href: `/projects/${id}/albums`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'アルバム',
      description: '写真をアルバムに整理',
      count: project._count.albums,
    },
    {
      href: `/projects/${id}/categories`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      label: 'カテゴリー',
      description: 'カテゴリーの管理',
      count: project._count.categories,
    },
    {
      href: `/projects/${id}/blackboard`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: '黒板',
      description: '工事用黒板の作成',
      count: null,
    },
    {
      href: `/projects/${id}/settings`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '設定',
      description: 'プロジェクト設定・メンバー',
      count: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Link
                href="/projects"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClasses(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.code && (
                  <p className="text-sm text-gray-500 font-mono mt-1">{project.code}</p>
                )}
                {project.constructionName && (
                  <p className="text-sm text-gray-600 mt-2 max-w-2xl">工事名: {project.constructionName}</p>
                )}
              </div>
            </div>
            <Link
              href={`/projects/${id}/settings`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              設定
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">プロジェクト情報</h2>
            <dl className="space-y-3">
              {project.salesPerson && (
                <div>
                  <dt className="text-sm text-gray-500">営業担当者</dt>
                  <dd className="text-sm font-medium text-gray-900">{project.salesPerson}</dd>
                </div>
              )}
              {project.contractorName && (
                <div>
                  <dt className="text-sm text-gray-500">施工者</dt>
                  <dd className="text-sm font-medium text-gray-900">{project.contractorName}</dd>
                </div>
              )}
              {project.steelFabricationCategory && (
                <div>
                  <dt className="text-sm text-gray-500">鉄骨製作区分</dt>
                  <dd className="text-sm font-medium text-gray-900">{project.steelFabricationCategory}</dd>
                </div>
              )}
              {project.membraneFabricationCategory && (
                <div>
                  <dt className="text-sm text-gray-500">膜製作区分</dt>
                  <dd className="text-sm font-medium text-gray-900">{project.membraneFabricationCategory}</dd>
                </div>
              )}
              {project.constructionPhoto && (
                <div>
                  <dt className="text-sm text-gray-500">工程写真</dt>
                  <dd className="text-sm font-medium text-gray-900">{project.constructionPhoto}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{project._count.photos}</div>
                <div className="text-xs text-blue-600">写真</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{project._count.albums}</div>
                <div className="text-xs text-purple-600">アルバム</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{project._count.categories}</div>
                <div className="text-xs text-green-600">カテゴリー</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{project._count.members}</div>
                <div className="text-xs text-orange-600">メンバー</div>
              </div>
            </div>
          </div>

          {/* Team Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">チーム</h2>
              <Link
                href={`/projects/${id}/settings`}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                管理
              </Link>
            </div>
            {project.members.length > 0 ? (
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name || ''}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {(member.user.name || member.user.email)?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{member.role.toLowerCase()}</p>
                    </div>
                  </div>
                ))}
                {project._count.members > 5 && (
                  <p className="text-sm text-gray-500">
                    他 {project._count.members - 5} 人
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">チームメンバーはまだいません</p>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクセス</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                  {item.icon}
                </div>
                <span className="text-base font-medium text-gray-900">{item.label}</span>
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
              {item.count !== null && (
                <p className="text-sm font-medium text-blue-600 mt-2">{item.count} 件</p>
              )}
            </Link>
          ))}
        </div>

        {/* Recent Albums */}
        {project.albums.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">最近のアルバム</h2>
              <Link
                href={`/projects/${id}/albums`}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                すべて表示
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/projects/${id}/albums/${album.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 truncate mb-2">{album.name}</h3>
                  <p className="text-sm text-gray-500">
                    {album._count.photos} 枚
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
