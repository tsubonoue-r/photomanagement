'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Password Section Component
 *
 * Allows users to change their password with:
 * - Current password verification
 * - Password strength requirements
 * - Confirmation validation
 */
export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Password strength checks
  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const validateForm = (): boolean => {
    const newErrors: PasswordErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = '現在のパスワードを入力してください';
    } else if (currentPassword.length < 8) {
      newErrors.currentPassword = 'パスワードは8文字以上で入力してください';
    }

    if (!newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください';
    } else if (!isPasswordStrong) {
      newErrors.newPassword = 'パスワード要件を満たしていません';
    } else if (currentPassword === newPassword) {
      newErrors.newPassword = '新しいパスワードは現在のパスワードと異なる必要があります';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '新しいパスワードを再入力してください';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          setGeneralError('現在のパスワードが正しくありません');
        } else {
          throw new Error(result.error || 'パスワードの変更に失敗しました');
        }
        return;
      }

      // Clear form on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'パスワードの変更に失敗しました'
      );
    } finally {
      setSaving(false);
    }
  };

  const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    show,
    onToggleShow,
    error,
    autoComplete,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    onToggleShow: () => void;
    error?: string;
    autoComplete: string;
  }) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          パスワード変更
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {generalError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{generalError}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-600 dark:text-green-400">
              パスワードを変更しました
            </p>
          </div>
        )}

        {/* Current Password */}
        <PasswordInput
          id="currentPassword"
          label="現在のパスワード"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrentPassword}
          onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
          error={errors.currentPassword}
          autoComplete="current-password"
        />

        {/* New Password */}
        <PasswordInput
          id="newPassword"
          label="新しいパスワード"
          value={newPassword}
          onChange={setNewPassword}
          show={showNewPassword}
          onToggleShow={() => setShowNewPassword(!showNewPassword)}
          error={errors.newPassword}
          autoComplete="new-password"
        />

        {/* Password Requirements */}
        {newPassword && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              パスワード要件:
            </p>
            <ul className="space-y-1 text-sm">
              {[
                { check: passwordChecks.minLength, label: '8文字以上' },
                { check: passwordChecks.hasUppercase, label: '大文字を1つ以上' },
                { check: passwordChecks.hasLowercase, label: '小文字を1つ以上' },
                { check: passwordChecks.hasNumber, label: '数字を1つ以上' },
              ].map(({ check, label }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 ${
                    check
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      check
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    {check ? '\u2713' : ''}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirm Password */}
        <PasswordInput
          id="confirmPassword"
          label="新しいパスワード（確認）"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? '変更中...' : 'パスワードを変更'}
          </button>
        </div>
      </form>
    </div>
  );
}
