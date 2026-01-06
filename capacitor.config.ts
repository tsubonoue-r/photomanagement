import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor設定
 *
 * このプロジェクトはAPI Routes/SSRを使用しているため、
 * WebViewアプローチを採用しています。
 *
 * 開発時: server.url を localhost:3000 に設定
 * 本番時: server.url を本番URLに設定（CAPACITOR_SERVER_URL環境変数）
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// 本番環境ではサーバーURLが必須
const serverUrl = process.env.CAPACITOR_SERVER_URL;
if (!serverUrl && !isDevelopment) {
  console.warn(
    '[Capacitor] Warning: CAPACITOR_SERVER_URL is not set. ' +
    'Using localhost:3000 as fallback. This should not happen in production.'
  );
}

const config: CapacitorConfig = {
  appId: 'com.photomanagement.app',
  appName: '工事写真管理',

  // WebViewアプローチ: サーバーURLを指定
  webDir: 'public',

  server: {
    url: serverUrl || 'http://localhost:3000',
    // 開発時のみHTTP許可、本番はHTTPS必須
    cleartext: isDevelopment,
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },

  // iOS固有設定
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },

  // Android固有設定
  android: {
    backgroundColor: '#ffffff',
    // セキュリティ: 開発時のみ許可
    allowMixedContent: isDevelopment,
    captureInput: true,
    // セキュリティ: 開発時のみデバッグ有効
    webContentsDebuggingEnabled: isDevelopment,
  },

  // プラグイン設定
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563eb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2563eb',
    },

    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
