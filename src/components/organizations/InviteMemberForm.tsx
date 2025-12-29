'use client';

import { useState } from 'react';
import { UserPlus, Loader2, X } from 'lucide-react';
import type { OrganizationRole } from '@prisma/client';
import { ORGANIZATION_ROLE_CONFIG, getAssignableRoles } from '@/types/organization';

interface InviteMemberFormProps {
  organizationId: string;
  currentUserRole: OrganizationRole;
  onMemberAdded: () => void;
  onCancel: () => void;
}

/**
 * Invite Member Form Component
 *
 * Modal form for inviting new members with:
 * - Email input
 * - Role selection
 * - Submit/Cancel buttons
 */
export function InviteMemberForm({
  organizationId,
  currentUserRole,
  onMemberAdded,
  onCancel,
}: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignableRoles = getAssignableRoles(currentUserRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            role,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to invite member');
      }

      onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Invite Member
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              The user must have an existing account
            </p>
          </div>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ORGANIZATION_ROLE_CONFIG[r].label} -{' '}
                  {ORGANIZATION_ROLE_CONFIG[r].description}
                </option>
              ))}
            </select>
          </div>

          {/* Role Descriptions */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Role Permissions:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>
                <strong>Admin:</strong> Can manage members and organization
                settings
              </li>
              <li>
                <strong>Member:</strong> Can create and manage projects
              </li>
              <li>
                <strong>Viewer:</strong> Read-only access to projects
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || !email.trim()}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Invite Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteMemberForm;
