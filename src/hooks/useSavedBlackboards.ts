'use client';

import { useState, useEffect, useCallback } from 'react';
import { blackboardStorage, SavedBlackboard, SavedBlackboardInput } from '@/lib/blackboardStorage';

interface UseSavedBlackboardsOptions {
  projectId?: string;
  autoLoad?: boolean;
}

interface UseSavedBlackboardsReturn {
  blackboards: SavedBlackboard[];
  isLoading: boolean;
  error: string | null;
  save: (input: SavedBlackboardInput) => Promise<string>;
  update: (id: string, updates: Partial<SavedBlackboardInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  load: (id: string) => Promise<SavedBlackboard | null>;
  setAsDefault: (id: string) => Promise<void>;
  getDefault: () => Promise<SavedBlackboard | null>;
  refresh: () => Promise<void>;
}

export function useSavedBlackboards(
  options: UseSavedBlackboardsOptions = {}
): UseSavedBlackboardsReturn {
  const { projectId, autoLoad = true } = options;
  const [blackboards, setBlackboards] = useState<SavedBlackboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load blackboards
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let results: SavedBlackboard[];

      if (projectId) {
        // Get project-specific + global blackboards
        const [projectBoards, globalBoards] = await Promise.all([
          blackboardStorage.getBlackboardsByProject(projectId),
          blackboardStorage.getGlobalBlackboards(),
        ]);
        results = [...projectBoards, ...globalBoards];
      } else {
        results = await blackboardStorage.getAllBlackboards();
      }

      setBlackboards(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '黒板の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Auto load on mount
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  // Save new blackboard
  const save = useCallback(async (input: SavedBlackboardInput): Promise<string> => {
    try {
      const id = await blackboardStorage.saveBlackboard(input);
      await refresh();
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : '黒板の保存に失敗しました';
      setError(message);
      throw err;
    }
  }, [refresh]);

  // Update existing blackboard
  const update = useCallback(async (id: string, updates: Partial<SavedBlackboardInput>): Promise<void> => {
    try {
      await blackboardStorage.updateBlackboard(id, updates);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : '黒板の更新に失敗しました';
      setError(message);
      throw err;
    }
  }, [refresh]);

  // Delete blackboard
  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await blackboardStorage.deleteBlackboard(id);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : '黒板の削除に失敗しました';
      setError(message);
      throw err;
    }
  }, [refresh]);

  // Load specific blackboard
  const load = useCallback(async (id: string): Promise<SavedBlackboard | null> => {
    try {
      return await blackboardStorage.getBlackboard(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : '黒板の読み込みに失敗しました';
      setError(message);
      throw err;
    }
  }, []);

  // Set as default for project
  const setAsDefault = useCallback(async (id: string): Promise<void> => {
    if (!projectId) {
      throw new Error('プロジェクトが選択されていません');
    }

    try {
      await blackboardStorage.setProjectDefault(projectId, id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'デフォルト設定に失敗しました';
      setError(message);
      throw err;
    }
  }, [projectId]);

  // Get default blackboard for project
  const getDefault = useCallback(async (): Promise<SavedBlackboard | null> => {
    if (!projectId) return null;

    try {
      return await blackboardStorage.getProjectDefault(projectId);
    } catch (err) {
      return null;
    }
  }, [projectId]);

  return {
    blackboards,
    isLoading,
    error,
    save,
    update,
    remove,
    load,
    setAsDefault,
    getDefault,
    refresh,
  };
}
