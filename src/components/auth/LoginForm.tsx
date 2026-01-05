'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        // Check if 2FA is required
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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          {showTwoFactor ? '二要素認証' : 'ログイン'}
        </h2>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!showTwoFactor ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="example@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="パスワードを入力"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
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
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    ログイン状態を保持
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    パスワードを忘れた方
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  認証アプリに表示された認証コードを入力してください
                </p>
              </div>

              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
                  {isRecoveryCode ? 'リカバリーコード' : '認証コード'}
                </label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  autoComplete="one-time-code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, ''))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest ${
                    errors.twoFactorCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={isRecoveryCode ? 'XXXX-XXXX' : '000000'}
                  maxLength={isRecoveryCode ? 9 : 6}
                />
                {errors.twoFactorCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.twoFactorCode}</p>
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
                <label htmlFor="use-recovery" className="ml-2 block text-sm text-gray-700">
                  リカバリーコードを使用
                </label>
              </div>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-sm text-blue-600 hover:text-blue-500"
              >
                ログインに戻る
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                新規登録
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
