'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import Link from 'next/link';
import type { OrganizationApiResponse } from '@/types/organization';

interface InvitationInfo {
  valid: boolean;
  organization?: {
    name: string;
    slug: string;
  };
  role?: string;
}

/**
 * Invitation Accept Page
 *
 * Displays invitation details and allows users to accept:
 * - Shows organization name
 * - Shows assigned role
 * - Accept/decline buttons
 * - Handles login redirect if not authenticated
 *
 * Issue #35: Organization & Member Management UI
 */
export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchInvitation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/invitations/${code}`);
      const result: OrganizationApiResponse<InvitationInfo> =
        await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invitation');
      }

      setInvitation(result.data || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch invitation'
      );
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/invitations/${code}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        // Check if it's an auth error
        if (response.status === 401) {
          // Redirect to login with return URL
          router.push(`/login?callbackUrl=/invite/${code}`);
          return;
        }
        throw new Error(result.error || 'Failed to accept invitation');
      }

      setSuccess(true);

      // Redirect to organization page after a short delay
      setTimeout(() => {
        if (invitation?.organization) {
          router.push(`/organizations`);
        }
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      );
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">招待を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!invitation || !invitation.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            無効な招待
          </h1>
          <p className="text-gray-600 mb-6">
            この招待リンクは無効、期限切れ、または既に使用されています。
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {invitation.organization?.name}へようこそ！
          </h1>
          <p className="text-gray-600 mb-6">
            <span className="font-medium">{invitation.role}</span>
            として組織に参加しました。
          </p>
          <p className="text-sm text-gray-500">組織ページへ移動中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            招待されています！
          </h1>
          <p className="text-gray-600">
            組織への参加に招待されています
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">組織</p>
              <p className="text-lg font-semibold text-gray-900">
                {invitation.organization?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">役割</p>
              <p className="text-lg font-semibold text-gray-900">
                {invitation.role}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                承認中...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                招待を承認
              </>
            )}
          </button>

          <Link
            href="/login"
            className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            別のアカウントでログイン
          </Link>

          <p className="text-center text-sm text-gray-500 mt-4">
            アカウントをお持ちでないですか？{' '}
            <Link
              href={`/register?callbackUrl=/invite/${code}`}
              className="text-blue-600 hover:underline"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
