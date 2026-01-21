'use client';

import { useState } from 'react';
import {
  Users,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  Crown,
  Eye,
  Loader2,
} from 'lucide-react';
import type { OrganizationMember } from '@/types/organization';
import type { OrganizationRole } from '@prisma/client';
import { ORGANIZATION_ROLE_CONFIG, canRemoveMember, canChangeMemberRole, getAssignableRoles } from '@/types/organization';

interface MemberListProps {
  members: OrganizationMember[];
  organizationId: string;
  currentUserId: string;
  currentUserRole: OrganizationRole;
  onMemberUpdated: () => void;
}

/**
 * Member List Component
 *
 * Displays organization members with:
 * - Member avatar, name, email
 * - Role badge
 * - Actions (change role, remove)
 */
export function MemberList({
  members,
  organizationId,
  currentUserId,
  currentUserRole,
  onMemberUpdated,
}: MemberListProps) {
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-3 h-3" />;
      case 'ADMIN':
        return <Shield className="w-3 h-3" />;
      case 'VIEWER':
        return <Eye className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const handleChangeRole = async (memberId: string, newRole: OrganizationRole) => {
    try {
      setLoading(memberId);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/members/${memberId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '役割の更新に失敗しました');
      }

      setChangingRole(null);
      onMemberUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '役割の更新に失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('このメンバーを削除してもよろしいですか？')) return;

    try {
      setLoading(memberId);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'メンバーの削除に失敗しました');
      }

      onMemberUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバーの削除に失敗しました');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {members.map((member) => {
          const roleConfig = ORGANIZATION_ROLE_CONFIG[member.role];
          const isCurrentUser = member.userId === currentUserId;
          const canChange = canChangeMemberRole(currentUserRole, member.role);
          const canRemove = canRemoveMember(currentUserRole, member.role);
          const assignableRoles = getAssignableRoles(currentUserRole);

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name || member.user.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {(member.user.name || member.user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {member.user.name || '名前未設定'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(あなた)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="w-3 h-3" />
                    {member.user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role Badge or Selector */}
                {changingRole === member.id ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleChangeRole(member.userId, e.target.value as OrganizationRole)
                    }
                    onBlur={() => setChangingRole(null)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading === member.id}
                    autoFocus
                  >
                    <option value={member.role}>{roleConfig.label}</option>
                    {assignableRoles
                      .filter((r) => r !== member.role)
                      .map((role) => (
                        <option key={role} value={role}>
                          {ORGANIZATION_ROLE_CONFIG[role].label}
                        </option>
                      ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.color} ${roleConfig.bgColor}`}
                  >
                    {getRoleIcon(member.role)}
                    {roleConfig.label}
                  </span>
                )}

                {/* Loading Indicator */}
                {loading === member.id && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}

                {/* Actions Menu */}
                {canManage && !isCurrentUser && (canChange || canRemove) && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActionMemberId(
                          actionMemberId === member.id ? null : member.id
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={loading === member.id}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {actionMemberId === member.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActionMemberId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          {canChange && (
                            <button
                              onClick={() => {
                                setActionMemberId(null);
                                setChangingRole(member.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                            >
                              役割を変更
                            </button>
                          )}
                          {canRemove && (
                            <button
                              onClick={() => {
                                setActionMemberId(null);
                                handleRemoveMember(member.userId);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                            >
                              メンバーを削除
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MemberList;
