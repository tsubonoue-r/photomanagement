/**
 * Hooks Barrel Export
 */

export { usePhotoUpload } from './usePhotoUpload';
export { usePhotos, usePhotoSearch } from './usePhotos';
export { useInfinitePhotos } from './useInfinitePhotos';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useAuth } from './useAuth';
export { useToast } from './useToast';
export { useBlackboard } from './useBlackboard';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';

// Enhanced Upload Hook (Issue #36)
export { useUploadQueue } from './useUploadQueue';

// Camera Hook (Issue #78)
export { useCamera } from './useCamera';
export type {
  CameraFacingMode,
  CameraSettings,
  CapturedPhoto,
  UseCameraOptions,
  UseCameraReturn,
} from './useCamera';

// Offline Photos Hook (Issue #81)
export { useOfflinePhotos } from './useOfflinePhotos';
