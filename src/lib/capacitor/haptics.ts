/**
 * Capacitor Haptics API ユーティリティ
 * ネイティブアプリで触覚フィードバックを提供
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Haptics が利用可能かチェック
 */
export const isHapticsAvailable = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Haptics');
};

/**
 * 軽いタップフィードバック（ボタンタップなど）
 */
export const hapticLight = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.warn('[Haptics] Light impact failed:', error);
  }
};

/**
 * 中程度のタップフィードバック（選択など）
 */
export const hapticMedium = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.warn('[Haptics] Medium impact failed:', error);
  }
};

/**
 * 強いタップフィードバック（重要なアクションなど）
 */
export const hapticHeavy = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.warn('[Haptics] Heavy impact failed:', error);
  }
};

/**
 * 成功通知フィードバック
 */
export const hapticSuccess = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    console.warn('[Haptics] Success notification failed:', error);
  }
};

/**
 * 警告通知フィードバック
 */
export const hapticWarning = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (error) {
    console.warn('[Haptics] Warning notification failed:', error);
  }
};

/**
 * エラー通知フィードバック
 */
export const hapticError = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (error) {
    console.warn('[Haptics] Error notification failed:', error);
  }
};

/**
 * 選択変更フィードバック（ピッカーなど）
 */
export const hapticSelection = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch (error) {
    console.warn('[Haptics] Selection feedback failed:', error);
  }
};

/**
 * 振動パターン（カスタム）
 */
export const hapticVibrate = async (duration: number = 300): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.warn('[Haptics] Vibrate failed:', error);
  }
};

/**
 * カメラシャッター用フィードバック
 */
export const hapticShutter = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.warn('[Haptics] Shutter feedback failed:', error);
  }
};
