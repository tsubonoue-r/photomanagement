'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Copy,
  Check,
  Loader2,
  X,
  Trash2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { OrganizationRole } from '@prisma/client';
import type {
  OrganizationInvitation,
  OrganizationApiResponse,
} from '@/types/organization';
import { ORGANIZATION_ROLE_CONFIG, getAssignableRoles } from '@/types/organization';

interface InviteLinkGeneratorProps {
  organizationId: string;
  currentUserRole: OrganizationRole;
  onClose: () => void;
}

/**
 * Invite Link Generator Component
 *
 * Modal for generating and managing invitation links with:
 * - Role selection
 * - Email restriction (optional)
 * - Expiration settings
 * - Active invitations list
 * - Copy to clipboard
 */
export function InviteLinkGenerator({
  organizationId,
  currentUserRole,
  onClose,
}: InviteLinkGeneratorProps) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<OrganizationRole>('MEMBER');
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);

  const assignableRoles = getAssignableRoles(currentUserRole);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/invitations`
      );
      const result: OrganizationApiResponse<OrganizationInvitation[]> =
        await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invitations');
      }

      setInvitations(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch invitations'
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            email: email.trim() || undefined,
            expiresInDays,
          }),
        }
      );

      const result: OrganizationApiResponse<OrganizationInvitation> =
        await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create invitation');
      }

      // Add new invitation to list
      if (result.data) {
        setInvitations([result.data, ...invitations]);
      }

      // Reset form
      setEmail('');
      setRole('MEMBER');
      setExpiresInDays(7);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create invitation'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to revoke invitation');
      }

      // Remove from list
      setInvitations(invitations.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to revoke invitation'
      );
    }
  };

  const copyToClipboard = async (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatExpirationDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return 'Expires in 1 day';
    return `Expires in ${diffDays} days`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Invitation Links
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Create New Invitation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Create New Invitation Link
            </h3>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as OrganizationRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={creating}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {ORGANIZATION_ROLE_CONFIG[r].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiration */}
                <div>
                  <label
                    htmlFor="expires"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expires In
                  </label>
                  <select
                    id="expires"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={creating}
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
              </div>

              {/* Email (optional) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Restrict to Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={creating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to allow anyone with the link to join
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Generate Invitation Link
              </button>
            </form>
          </div>

          {/* Active Invitations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Active Invitations
              </h3>
              <button
                onClick={fetchInvitations}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {loading && invitations.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No active invitations
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => {
                  const roleConfig = ORGANIZATION_ROLE_CONFIG[invitation.role];
                  return (
                    <div
                      key={invitation.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.color} ${roleConfig.bgColor}`}
                            >
                              {roleConfig.label}
                            </span>
                            {invitation.email && (
                              <span className="text-xs text-gray-500 truncate">
                                for {invitation.email}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatExpirationDate(invitation.expiresAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(invitation.code)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copy invitation link"
                          >
                            {copiedCode === invitation.code ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke invitation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteLinkGenerator;
