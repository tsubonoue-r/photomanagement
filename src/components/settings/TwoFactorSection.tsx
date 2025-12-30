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
      setError('Failed to load 2FA status');
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
        throw new Error(data.error || 'Failed to start setup');
      }

      const data = await response.json();
      setSetupData(data);
      setShowSetup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start setup');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
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
        throw new Error(data.error || 'Verification failed');
      }

      setRecoveryCodes(data.recoveryCodes);
      setShowRecoveryCodes(true);
      setShowSetup(false);
      setSetupData(null);
      setVerificationCode('');
      setSuccess('Two-factor authentication has been enabled!');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disablePassword) {
      setError('Password is required');
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
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setShowDisable(false);
      setDisablePassword('');
      setSuccess('Two-factor authentication has been disabled');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setSuccess('Recovery codes copied to clipboard');
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
        Two-Factor Authentication
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
                ? 'Two-factor authentication is enabled'
                : 'Two-factor authentication is not enabled'}
            </span>
          </div>

          {status.enabled && (
            <p className="text-sm text-gray-500 mb-4">
              Recovery codes remaining: {status.recoveryCodesRemaining}
            </p>
          )}

          <div className="flex gap-3">
            {status.enabled ? (
              <button
                onClick={() => setShowDisable(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={startSetup}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Enable 2FA'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Setup Flow */}
      {showSetup && setupData && (
        <div>
          <p className="text-gray-600 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          <div className="flex justify-center mb-4">
            <img src={setupData.qrCode} alt="2FA QR Code" className="border rounded-lg" />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Or enter this code manually:
            </p>
            <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
              {setupData.secret}
            </code>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
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
              {isLoading ? 'Verifying...' : 'Verify and Enable'}
            </button>
            <button
              onClick={() => {
                setShowSetup(false);
                setSetupData(null);
                setVerificationCode('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recovery Codes Display */}
      {showRecoveryCodes && (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 font-medium mb-2">
              Save your recovery codes
            </p>
            <p className="text-sm text-yellow-700">
              These codes can be used to access your account if you lose your authenticator device.
              Each code can only be used once. Store them in a safe place.
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
              Copy Codes
            </button>
            <button
              onClick={downloadRecoveryCodes}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Download
            </button>
            <button
              onClick={() => {
                setShowRecoveryCodes(false);
                setRecoveryCodes([]);
              }}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Disable Confirmation */}
      {showDisable && (
        <div>
          <p className="text-gray-600 mb-4">
            Enter your password to disable two-factor authentication.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={disableTwoFactor}
              disabled={isLoading || !disablePassword}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Disabling...' : 'Disable 2FA'}
            </button>
            <button
              onClick={() => {
                setShowDisable(false);
                setDisablePassword('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
