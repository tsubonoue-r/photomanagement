import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserOrganizations } from '@/lib/organization/organization-service';
import { OrganizationList } from '@/components/organizations';
import type { OrganizationWithCounts } from '@/types/organization';

/**
 * Organizations List Page
 *
 * Displays all organizations the user is a member of with:
 * - Organization cards
 * - Create new organization button
 * - Search functionality
 *
 * Issue #35: Organization & Member Management UI
 */
export default async function OrganizationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get initial organizations for SSR
  const result = await getUserOrganizations(session.user.id);
  const initialOrganizations = result.organizations as OrganizationWithCounts[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
              <p className="text-sm text-gray-600">
                Manage your organizations and team members
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrganizationList initialOrganizations={initialOrganizations} />
      </main>
    </div>
  );
}
