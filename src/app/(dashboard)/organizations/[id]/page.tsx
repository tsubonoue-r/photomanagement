'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Building2,
  Users,
  Folder,
  Settings,
  UserPlus,
  Link2,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { MemberList, InviteMemberForm, InviteLinkGenerator } from '@/components/organizations';
import type {
  OrganizationWithMembers,
  OrganizationApiResponse,
} from '@/types/organization';
import type { OrganizationRole } from '@prisma/client';
import { PLAN_TYPE_CONFIG, canInviteMembers } from '@/types/organization';

/**
 * Organization Detail Page
 *
 * Displays organization details with:
 * - Organization info card
 * - Member list
 * - Invite member button
 * - Settings link
 *
 * Issue #35: Organization & Member Management UI
 */
export default function OrganizationDetailPage() {
  const params = useParams();
  const organizationId = params.id as string;

  const [organization, setOrganization] =
    useState<OrganizationWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showInviteLinkGenerator, setShowInviteLinkGenerator] = useState(false);

  // TODO: Get actual current user role from membership
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
      // This is a simplified approach - in production, use session
      if (result.data?.members) {
        // For now, assume the first OWNER is the current user for demo
        // In production, compare with session.user.id
        const ownerMember = result.data.members.find((m) => m.role === 'OWNER');
        if (ownerMember) {
          setCurrentUserId(ownerMember.userId);
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

  const handleMemberUpdated = () => {
    setShowInviteForm(false);
    fetchOrganization();
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="font-semibold mb-2">Error Loading Organization</h2>
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

  const planConfig = PLAN_TYPE_CONFIG[organization.plan];
  const canInvite = canInviteMembers(currentUserRole);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/organizations"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {organization.name}
                  </h1>
                  <p className="text-sm text-gray-500">/{organization.slug}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${planConfig.color} ${planConfig.bgColor}`}
              >
                {planConfig.label}
              </span>
              {(currentUserRole === 'OWNER' ||
                currentUserRole === 'ADMIN') && (
                <Link
                  href={`/organizations/${organizationId}/settings`}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Members</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {organization._count.members}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Projects</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {organization._count.projects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {planConfig.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            </div>
            {canInvite && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInviteLinkGenerator(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Link2 className="w-4 h-4" />
                  Invite Link
                </button>
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            <MemberList
              members={organization.members}
              organizationId={organizationId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onMemberUpdated={handleMemberUpdated}
            />
          </div>
        </div>
      </main>

      {/* Invite Member Modal */}
      {showInviteForm && (
        <InviteMemberForm
          organizationId={organizationId}
          currentUserRole={currentUserRole}
          onMemberAdded={handleMemberUpdated}
          onCancel={() => setShowInviteForm(false)}
        />
      )}

      {/* Invite Link Generator Modal */}
      {showInviteLinkGenerator && (
        <InviteLinkGenerator
          organizationId={organizationId}
          currentUserRole={currentUserRole}
          onClose={() => setShowInviteLinkGenerator(false)}
        />
      )}
    </div>
  );
}
