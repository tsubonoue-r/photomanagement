'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface DeleteAccountSectionProps {
  userId: string;
  userEmail: string;
}

/**
 * Delete Account Section Component
 *
 * Provides account deletion functionality with:
 * - Warning about data loss
 * - Password confirmation
 * - Text confirmation ("DELETE MY ACCOUNT")
 * - Modal confirmation dialog
 */
export function DeleteAccountSection({ userId, userEmail }: DeleteAccountSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmationValid = confirmation === 'DELETE MY ACCOUNT';
  const canDelete = password.length >= 8 && isConfirmationValid;

  const handleDelete = async () => {
    if (!canDelete) return;

    setError(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          confirmation,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          setError('Incorrect password');
        } else {
          throw new Error(result.error || 'Failed to delete account');
        }
        return;
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setPassword('');
    setConfirmation('');
    setError(null);
  };

  return (
    <>
      {/* Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permanently delete your account and all associated data. This action
              cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Account
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Warning */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Warning:</strong> This action is permanent and cannot be
                    undone. All your data, including projects, photos, and settings
                    will be permanently deleted.
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Account to be deleted: <strong>{userEmail}</strong>
                </p>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label
                    htmlFor="deletePassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Enter your password
                  </label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Confirmation Text */}
                <div>
                  <label
                    htmlFor="deleteConfirmation"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Type <span className="font-mono text-red-600">DELETE MY ACCOUNT</span> to
                    confirm
                  </label>
                  <input
                    type="text"
                    id="deleteConfirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      confirmation && !isConfirmationValid
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="DELETE MY ACCOUNT"
                  />
                  {confirmation && !isConfirmationValid && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Please type exactly: DELETE MY ACCOUNT
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || !canDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
