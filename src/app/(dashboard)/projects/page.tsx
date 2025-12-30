import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectList } from '@/components/projects';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-sm text-gray-600">
                Manage all your construction photo projects
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectList initialProjects={initialProjects as ProjectWithCounts[]} />
      </main>
    </div>
  );
}
