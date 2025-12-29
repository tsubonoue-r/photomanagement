'use client';

import { memo } from 'react';
import type { BlackboardTemplate, BlackboardFieldValue } from '@/types/blackboard';

interface BlackboardEditorProps {
  template: BlackboardTemplate;
  values: BlackboardFieldValue[];
  onChange: (values: BlackboardFieldValue[]) => void;
}

export const BlackboardEditor = memo<BlackboardEditorProps>(function BlackboardEditor({
  template,
  values,
  onChange,
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
        {template.name}
      </h3>
      <div className="space-y-4">
        {template.fields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={String(values.find((v) => v.fieldId === field.id)?.value ?? '')}
              onChange={(e) => {
                const newValues = values.filter((v) => v.fieldId !== field.id);
                newValues.push({ fieldId: field.id, value: e.target.value });
                onChange(newValues);
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default BlackboardEditor;
