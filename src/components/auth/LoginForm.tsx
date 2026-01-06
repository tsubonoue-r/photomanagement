'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, ArrowLeft } from 'lucide-react';

interface FormErrors {
  email?: string;
  password?: string;
  twoFactorCode?: string;
  general?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    if (showTwoFactor && !twoFactorCode) {
      newErrors.twoFactorCode = '認証コードを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode: showTwoFactor ? twoFactorCode : undefined,
        isRecoveryCode: isRecoveryCode ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('2FA_REQUIRED')) {
          setShowTwoFactor(true);
          setErrors({});
        } else if (result.error.includes('INVALID_2FA_CODE')) {
          setErrors({ twoFactorCode: '認証コードが無効です' });
        } else {
          setErrors({ general: 'メールアドレスまたはパスワードが正しくありません' });
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErrors({ general: '予期せぬエラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setTwoFactorCode('');
    setIsRecoveryCode(false);
    setErrors({});
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">工事写真管理</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {showTwoFactor ? '二要素認証' : 'ログイン'}
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!showTwoFactor ? (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="example@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="パスワードを入力"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                  ログイン状態を保持
                </label>
              </div>

              <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400">
                パスワードを忘れた方
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                認証アプリに表示された認証コードを入力
              </p>
            </div>

            <div>
              <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRecoveryCode ? 'リカバリーコード' : '認証コード'}
              </label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, ''))}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-center text-xl tracking-widest ${
                  errors.twoFactorCode ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder={isRecoveryCode ? 'XXXX-XXXX' : '000000'}
                maxLength={isRecoveryCode ? 9 : 6}
              />
              {errors.twoFactorCode && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.twoFactorCode}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="use-recovery"
                name="use-recovery"
                type="checkbox"
                checked={isRecoveryCode}
                onChange={(e) => {
                  setIsRecoveryCode(e.target.checked);
                  setTwoFactorCode('');
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="use-recovery" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                リカバリーコードを使用
              </label>
            </div>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              ログインに戻る
            </button>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98] transition-transform ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {showTwoFactor ? '認証中...' : 'ログイン中...'}
            </span>
          ) : (
            showTwoFactor ? '認証する' : 'ログイン'
          )}
        </button>
      </form>

      {!showTwoFactor && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="font-medium text-blue-600 dark:text-blue-400">
              新規登録
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
