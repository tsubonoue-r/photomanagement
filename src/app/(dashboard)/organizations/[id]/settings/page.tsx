'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { OrganizationSettings } from '@/components/organizations';
import type {
  OrganizationWithMembers,
  OrganizationApiResponse,
} from '@/types/organization';
import type { OrganizationRole } from '@prisma/client';

/**
 * Organization Settings Page
 *
 * Settings page for organization with:
 * - General settings
 * - Plan information
 * - Danger zone
 *
 * Issue #35: Organization & Member Management UI
 */
export default function OrganizationSettingsPage() {
  const params = useParams();
  const organizationId = params.id as string;

  const [organization, setOrganization] =
    useState<OrganizationWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] =
    useState<OrganizationRole>('MEMBER');

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${organizationId}`);
      const result: OrganizationApiResponse<OrganizationWithMembers> =
        await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch organization');
      }

      setOrganization(result.data || null);

      // Find current user's role from members
      if (result.data?.members) {
        const ownerMember = result.data.members.find((m) => m.role === 'OWNER');
        if (ownerMember) {
          setCurrentUserRole(ownerMember.role);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch organization'
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="font-semibold mb-2">Error Loading Settings</h2>
            <p>{error || 'Organization not found'}</p>
            <Link
              href="/organizations"
              className="inline-block mt-4 text-red-800 underline hover:no-underline"
            >
              Back to Organizations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has permission to access settings
  if (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
            <h2 className="font-semibold mb-2">Access Denied</h2>
            <p>
              You do not have permission to access organization settings. Only
              OWNER or ADMIN can access this page.
            </p>
            <Link
              href={`/organizations/${organizationId}`}
              className="inline-block mt-4 text-yellow-800 underline hover:no-underline"
            >
              Back to Organization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/organizations/${organizationId}`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Organization Settings
                </h1>
                <p className="text-sm text-gray-500">{organization.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrganizationSettings
          organization={organization}
          currentUserRole={currentUserRole}
          onOrganizationUpdated={fetchOrganization}
        />
      </main>
    </div>
  );
}
