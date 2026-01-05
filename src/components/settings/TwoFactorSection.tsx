'use client';

/**
 * Two-Factor Authentication Settings Section
 * Issue #52: 2FA/MFA support
 */

import { useState, useEffect } from 'react';

interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

interface SetupData {
  secret: string;
  qrCode: string;
  uri: string;
}

export function TwoFactorSection() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setup state
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  // Disable state
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      setError('2FA状態の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/setup');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'セットアップの開始に失敗しました');
      }

      const data = await response.json();
      setSetupData(data);
      setShowSetup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'セットアップの開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('有効な6桁のコードを入力してください');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '認証に失敗しました');
      }

      setRecoveryCodes(data.recoveryCodes);
      setShowRecoveryCodes(true);
      setShowSetup(false);
      setSetupData(null);
      setVerificationCode('');
      setSuccess('二要素認証が有効になりました');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disablePassword) {
      setError('パスワードを入力してください');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '2FAの無効化に失敗しました');
      }

      setShowDisable(false);
      setDisablePassword('');
      setSuccess('二要素認証が無効になりました');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FAの無効化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setSuccess('リカバリーコードをクリップボードにコピーしました');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadRecoveryCodes = () => {
    const content = `PhotoManager Recovery Codes\n${'='.repeat(30)}\n\nSave these codes in a safe place. Each code can only be used once.\n\n${recoveryCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photomanager-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        二要素認証
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Status Display */}
      {status && !showSetup && !showRecoveryCodes && !showDisable && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${
                status.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            <span className="text-gray-700">
              {status.enabled
                ? '二要素認証は有効です'
                : '二要素認証は無効です'}
            </span>
          </div>

          {status.enabled && (
            <p className="text-sm text-gray-500 mb-4">
              残りのリカバリーコード: {status.recoveryCodesRemaining}
            </p>
          )}

          <div className="flex gap-3">
            {status.enabled ? (
              <button
                onClick={() => setShowDisable(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                2FAを無効にする
              </button>
            ) : (
              <button
                onClick={startSetup}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '読み込み中...' : '2FAを有効にする'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Setup Flow */}
      {showSetup && setupData && (
        <div>
          <p className="text-gray-600 mb-4">
            認証アプリ（Google Authenticator、Authyなど）でこのQRコードをスキャンしてください
          </p>

          <div className="flex justify-center mb-4">
            <img src={setupData.qrCode} alt="2FA QR Code" className="border rounded-lg" />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              または手動でこのコードを入力:
            </p>
            <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
              {setupData.secret}
            </code>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              認証コード
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6桁のコードを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={completeSetup}
              disabled={isLoading || verificationCode.length !== 6}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '認証中...' : '認証して有効化'}
            </button>
            <button
              onClick={() => {
                setShowSetup(false);
                setSetupData(null);
                setVerificationCode('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Recovery Codes Display */}
      {showRecoveryCodes && (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 font-medium mb-2">
              リカバリーコードを保存してください
            </p>
            <p className="text-sm text-yellow-700">
              認証デバイスを紛失した場合、これらのコードでアカウントにアクセスできます。
              各コードは一度しか使用できません。安全な場所に保管してください。
            </p>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-md font-mono text-sm">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="py-1">{code}</div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyRecoveryCodes}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              コピー
            </button>
            <button
              onClick={downloadRecoveryCodes}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ダウンロード
            </button>
            <button
              onClick={() => {
                setShowRecoveryCodes(false);
                setRecoveryCodes([]);
              }}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              完了
            </button>
          </div>
        </div>
      )}

      {/* Disable Confirmation */}
      {showDisable && (
        <div>
          <p className="text-gray-600 mb-4">
            二要素認証を無効にするにはパスワードを入力してください。
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="パスワードを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={disableTwoFactor}
              disabled={isLoading || !disablePassword}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? '無効化中...' : '2FAを無効にする'}
            </button>
            <button
              onClick={() => {
                setShowDisable(false);
                setDisablePassword('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
