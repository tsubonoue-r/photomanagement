/**
 * useBlackboard Hook
 * 黒板機能用のカスタムフック
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  BlackboardTemplate,
  BlackboardField,
  BlackboardComposition,
  TamperingDetectionInfo,
  BlackboardTemplateCreateInput,
} from '@/types/blackboard';

interface UseBlackboardOptions {
  projectId: string;
  autoLoad?: boolean;
}

interface UseBlackboardReturn {
  // Templates
  templates: BlackboardTemplate[];
  selectedTemplate: BlackboardTemplate | null;
  isLoadingTemplates: boolean;
  loadTemplates: () => Promise<void>;
  selectTemplate: (template: BlackboardTemplate) => void;
  createTemplate: (input: BlackboardTemplateCreateInput) => Promise<BlackboardTemplate | null>;
  updateTemplate: (id: string, fields: BlackboardField[]) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;

  // Fields
  fields: BlackboardField[];
  updateField: (fieldId: string, value: string) => void;
  updateFieldPosition: (fieldId: string, x: number, y: number) => void;
  resetFields: () => void;

  // Position and Scale
  position: { x: number; y: number };
  scale: number;
  setPosition: (position: { x: number; y: number }) => void;
  setScale: (scale: number) => void;

  // Composition
  compositions: BlackboardComposition[];
  isComposing: boolean;
  compose: (photoId: string, photoUrl: string) => Promise<BlackboardComposition | null>;
  verifyIntegrity: (compositionId: string, currentHash: string) => Promise<TamperingDetectionInfo | null>;

  // Error
  error: string | null;
  clearError: () => void;
}

export function useBlackboard({ projectId, autoLoad = true }: UseBlackboardOptions): UseBlackboardReturn {
  const [templates, setTemplates] = useState<BlackboardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BlackboardTemplate | null>(null);
  const [fields, setFields] = useState<BlackboardField[]>([]);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [scale, setScale] = useState(1);
  const [compositions, setCompositions] = useState<BlackboardComposition[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    setError(null);

    try {
      const response = await fetch(`/api/blackboards/templates?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates);

      // Auto-select first template if none selected
      if (data.templates.length > 0 && !selectedTemplate) {
        const defaultTemplate = data.templates.find((t: BlackboardTemplate) => t.isDefault) || data.templates[0];
        setSelectedTemplate(defaultTemplate);
        setFields(defaultTemplate.fields);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [projectId, selectedTemplate]);

  // Auto-load templates
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [autoLoad, loadTemplates]);

  // Select template
  const selectTemplate = useCallback((template: BlackboardTemplate) => {
    setSelectedTemplate(template);
    setFields(template.fields.map(field => ({ ...field })));
  }, []);

  // Create template
  const createTemplate = useCallback(async (input: BlackboardTemplateCreateInput): Promise<BlackboardTemplate | null> => {
    setError(null);

    try {
      const response = await fetch('/api/blackboards/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const data = await response.json();
      setTemplates(prev => [...prev, data.template]);
      return data.template;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Update template
  const updateTemplate = useCallback(async (id: string, newFields: BlackboardField[]): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/blackboards/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: newFields }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      const data = await response.json();
      setTemplates(prev => prev.map(t => t.id === id ? data.template : t));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  // Delete template
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/blackboards/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setFields([]);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [selectedTemplate]);

  // Update field value
  const updateField = useCallback((fieldId: string, value: string) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId ? { ...field, value } : field
    ));
  }, []);

  // Update field position
  const updateFieldPosition = useCallback((fieldId: string, x: number, y: number) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId ? { ...field, x, y } : field
    ));
  }, []);

  // Reset fields to template default
  const resetFields = useCallback(() => {
    if (selectedTemplate) {
      setFields(selectedTemplate.fields.map(field => ({ ...field })));
    }
  }, [selectedTemplate]);

  // Compose photo with blackboard
  const compose = useCallback(async (photoId: string, photoUrl: string): Promise<BlackboardComposition | null> => {
    if (!selectedTemplate) {
      setError('No template selected');
      return null;
    }

    setIsComposing(true);
    setError(null);

    try {
      const response = await fetch('/api/blackboards/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          photoUrl,
          templateId: selectedTemplate.id,
          fields,
          position,
          scale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compose photo');
      }

      const data = await response.json();
      setCompositions(prev => [...prev, data.composition]);
      return data.composition;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsComposing(false);
    }
  }, [selectedTemplate, fields, position, scale]);

  // Verify integrity
  const verifyIntegrity = useCallback(async (
    compositionId: string,
    currentHash: string
  ): Promise<TamperingDetectionInfo | null> => {
    setError(null);

    try {
      const response = await fetch('/api/blackboards/compose', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compositionId, currentHash }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify integrity');
      }

      const data = await response.json();
      return {
        photoId: compositionId,
        hash: data.originalHash,
        algorithm: 'sha256',
        timestamp: new Date(data.timestamp),
        verified: data.verified,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    templates,
    selectedTemplate,
    isLoadingTemplates,
    loadTemplates,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fields,
    updateField,
    updateFieldPosition,
    resetFields,
    position,
    scale,
    setPosition,
    setScale,
    compositions,
    isComposing,
    compose,
    verifyIntegrity,
    error,
    clearError,
  };
}

export default useBlackboard;
