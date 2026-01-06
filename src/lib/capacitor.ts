/**
 * Capacitor環境検出・ユーティリティ
 */

import { Capacitor } from '@capacitor/core';

/**
 * ネイティブアプリ内で実行されているか判定
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 現在のプラットフォームを取得
 */
export type Platform = 'ios' | 'android' | 'web';

export const getPlatform = (): Platform => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android') {
    return platform;
  }
  return 'web';
};

/**
 * プラグインが利用可能か確認
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * APIベースURLを取得
 * ネイティブアプリ時は外部URL、Web時は相対パス
 *
 * @throws Error if NEXT_PUBLIC_API_URL is not set in native app
 */
export const getApiBaseUrl = (): string => {
  if (isNativeApp()) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.warn(
        '[Capacitor] NEXT_PUBLIC_API_URL is not set. ' +
        'API calls may fail in native app.'
      );
      return '';
    }
    return apiUrl;
  }
  // Web版は相対パス
  return '';
};

/**
 * 安全なフェッチラッパー
 * ネイティブアプリ時にベースURLを自動付与
 */
export const capacitorFetch = async (
  path: string,
  options?: RequestInit
): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${path}` : path;
  return fetch(url, options);
};
